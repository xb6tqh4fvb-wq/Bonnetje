import {
  computeSplit, formatEuro, formatEuroShort, formatPlain, parseEuro, uid, unitsLeft, itemWeights,
  roundUpSuggestions, personRoundUps, splitLine,
} from './calc.js';
import { parseReceiptText } from './parse.js';
import { readReceiptFile } from './ocr.js';
import { load, save } from './store.js';
import { t, getLang, setLang, fmtDate, UI_LANGS } from './i18n.js';
import { loadSettings, saveSettings, applySettings } from './settings.js';
import { translateName, detectLanguage, translateOnline, RECEIPT_LANGS } from './translate.js';

const state = load();
const ui = { tab: 'bon', person: null, ocr: null, open: {}, trBusy: false, settings: false };
const display = loadSettings();
applySettings(display);
const $app = document.getElementById('app');
const $toast = document.getElementById('toast');
const RL_KEY = 'bonnetje.receiptLang';
let receiptLang = (() => {
  try {
    return localStorage.getItem(RL_KEY) || 'auto';
  } catch {
    return 'auto';
  }
})();

// ---------- helpers ----------
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const bill = () => state.bills.find((b) => b.id === state.currentId);
const findBill = (id) => state.bills.find((x) => x.id === id);
const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
const COLORS = ['#2563eb', '#db2777', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#65a30d', '#c026d3', '#ea580c'];
const colorOf = (b, pid) => COLORS[Math.max(0, b.people.findIndex((p) => p.id === pid)) % COLORS.length];
const langName = (l) => t('lang_' + l);
const showOrig = (it) => it.orig && it.orig.trim().toLowerCase() !== it.name.trim().toLowerCase();

// ---------- ongedaan maken ----------
// Na elke wijziging een momentopname van de gegevens (zonder foto's: die worden apart
// bewaard en via een kenmerk teruggezet). Alleen in het geheugen, max. 50 stappen.
const undoStack = [];
const images = new Map(); // dataURL -> kenmerk
const imageByToken = new Map();
function snapshot() {
  // Alleen de bonnen; navigatie (welke bon open is) telt niet als stap.
  return JSON.stringify(state.bills, (k, v) => {
    if (k !== 'image' || !v) return v;
    if (!images.has(v)) {
      const tok = 'img#' + images.size;
      images.set(v, tok);
      imageByToken.set(tok, v);
    }
    return images.get(v);
  });
}
let lastSnap = snapshot();
function recordUndo() {
  const snap = snapshot();
  if (snap === lastSnap) return;
  undoStack.push(lastSnap);
  if (undoStack.length > 50) undoStack.shift();
  lastSnap = snap;
}
function undo() {
  if (!undoStack.length) return;
  const prev = undoStack.pop();
  state.bills = JSON.parse(prev, (k, v) => (k === 'image' && v ? imageByToken.get(v) ?? null : v));
  if (!state.bills.some((b) => b.id === state.currentId)) go(null);
  lastSnap = snapshot();
  save(state);
  render();
  toast(t('undone'));
}

function commit() {
  recordUndo();
  if (!save(state)) toast(t('storageFull'));
  render();
}

// Na een achtergrondtaak (uitlezen, vertalen) niet opnieuw tekenen terwijl iemand typt:
// dan pas bij het verlaten van het invoerveld.
let pendingRender = false;
function commitSoon() {
  recordUndo();
  if (!save(state)) toast(t('storageFull'));
  const a = document.activeElement;
  if (a && a.tagName === 'INPUT' && $app.contains(a)) pendingRender = true;
  else render();
}
document.addEventListener('focusout', () => {
  if (!pendingRender) return;
  pendingRender = false;
  setTimeout(render, 0);
});

// ---------- navigatie (terugknop van telefoon/browser) ----------
let navPushed = false;
function go(billId, tab) {
  const fromHome = !state.currentId;
  if (billId !== state.currentId) ui.person = null;
  state.currentId = billId;
  if (tab) ui.tab = tab;
  const st = { billId, tab: ui.tab };
  if (billId && fromHome) {
    history.pushState(st, '');
    navPushed = true;
  } else history.replaceState(st, '');
}
window.addEventListener('popstate', (e) => {
  const st = e.state || {};
  state.currentId = st.billId && findBill(st.billId) ? st.billId : null;
  ui.tab = st.tab || 'bon';
  ui.settings = false;
  navPushed = !!state.currentId;
  commit();
});

let toastTimer;
/** Korte melding; met withUndo een knop "Ongedaan maken" (langer zichtbaar). */
function toast(msg, withUndo = false) {
  $toast.textContent = msg;
  if (withUndo) {
    const btn = document.createElement('button');
    btn.textContent = t('undo');
    btn.addEventListener('click', () => {
      $toast.classList.remove('show');
      undo();
    });
    $toast.append(' ', btn);
  }
  $toast.classList.toggle('has-action', withUndo);
  $toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.classList.remove('show'), withUndo ? 6000 : 2400);
}

function newBill() {
  const b = {
    id: uid(),
    createdAt: Date.now(),
    title: t('billDefault', { date: fmtDate(Date.now()) }),
    autoTitle: true,
    image: null,
    lang: null,
    translatedTo: null,
    receiptTotalCents: null,
    items: [],
    people: [],
    tip: { mode: 'none', amountCents: 0, paidTotalCents: null, distribution: 'proportional' },
  };
  state.bills.unshift(b);
  go(b.id, 'bon');
  return b;
}

function splitItem(b, id) {
  const it = findItem(b, id);
  b.items.splice(b.items.indexOf(it), 1, ...splitLine(it, uid));
}

// ---------- vertalen ----------
function applyTranslation(b) {
  const to = getLang();
  for (const it of b.items) {
    const src = it.orig ?? it.name;
    it.orig = src;
    const r = translateName(src, b.lang, to);
    it.name = r.text;
    it.coverage = r.coverage;
  }
  b.translatedTo = to;
}

function undoTranslation(b) {
  for (const it of b.items) {
    if (it.orig != null) it.name = it.orig;
    delete it.coverage;
  }
  b.translatedTo = null;
}

const untranslated = (b) => (b.translatedTo ? b.items.filter((it) => it.orig && (it.coverage ?? 1) < 1) : []);

async function translateRestOnline(b) {
  ui.trBusy = true;
  render();
  let ok = 0;
  try {
    for (const it of untranslated(b)) {
      it.name = await translateOnline(it.orig, b.lang, b.translatedTo);
      it.coverage = 1;
      ok++;
    }
    toast(t('trOnlineDone', { n: ok }));
  } catch (e) {
    console.error(e);
    toast(ok ? t('trOnlineDone', { n: ok }) : t('trOnlineFail'));
  }
  ui.trBusy = false;
  commitSoon();
}

const HINT_KEY = 'bonnetje.hintSeen';
let hintFlag = (() => {
  try {
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
})();
// De uitgebreide uitleg blijft staan tot de eerste keer dat iets is toegewezen (en daarna weg).
let hintShownThisVisit = !hintFlag;
const hintSeen = () => hintFlag && !hintShownThisVisit;
function markHintSeen() {
  if (hintFlag) return;
  hintFlag = true;
  try {
    localStorage.setItem(HINT_KEY, '1');
  } catch {}
}

const ocrBusy = () => !!(ui.ocr && !ui.ocr.error);

async function importFile(file, b) {
  if (ocrBusy()) return toast(t('busy'));
  ui.ocr = { billId: b.id, label: t('busy'), progress: 0 };
  go(b.id, 'bon');
  render();
  try {
    const progress = (p) => {
      ui.ocr = { billId: b.id, ...p };
      updateProgress();
    };
    // 'Automatisch': eerst lezen in de taal van de app (één taalbestand, sneller en minder
    // downloaden); blijkt de bon in een andere taal, dan nog één keer met dat taalbestand.
    const first = receiptLang !== 'auto' ? receiptLang : getLang();
    let res = await readReceiptFile(file, progress, first);
    let parsed = parseReceiptText(res.text);
    let detected = receiptLang !== 'auto' ? receiptLang : detectLanguage(res.text, parsed.items.map((i) => i.name)) || first;
    if (receiptLang === 'auto' && detected !== first && !(res.source === 'pdf')) {
      progress({ label: t('ocrRetry', { lang: langName(detected) }), progress: 0 });
      res = await readReceiptFile(file, progress, detected);
      parsed = parseReceiptText(res.text);
    }
    b.image = res.previewUrl;
    b.rawText = res.text;
    const newItems = parsed.items.map((it) => ({ id: uid(), assign: {}, ...it, orig: it.name }));
    if (b.items.length && !confirm(t('replaceLines'))) b.items.push(...newItems);
    else b.items = newItems;
    if (parsed.totalCents != null) b.receiptTotalCents = parsed.totalCents;
    if (parsed.title && b.autoTitle) b.title = parsed.title;
    b.lang = detected;
    b.translatedTo = null;
    ui.ocr = null;
    if (b.lang !== getLang() && newItems.length) {
      applyTranslation(b);
      toast(t('trToast', { lang: langName(b.lang) }));
    } else {
      toast(newItems.length ? t('linesFound', { n: newItems.length }) : t('noLines'));
    }
  } catch (e) {
    console.error(e);
    ui.ocr = { billId: b.id, error: e.message || t('readFailed') };
  }
  commitSoon();
}

// Alleen de voortgangsbalk bijwerken (als die in beeld is), nooit het hele scherm.
function updateProgress() {
  const el = document.querySelector('.ocr');
  if (!el || !ui.ocr) return;
  el.querySelector('.ocr-label').textContent = ui.ocr.label;
  el.querySelector('.bar > span').style.width = `${Math.round((ui.ocr.progress || 0) * 100)}%`;
}

// ---------- views ----------
function render() {
  document.documentElement.lang = getLang();
  const b = bill();
  $app.innerHTML = (b ? viewBill(b) : viewHome()) + (ui.settings ? viewSettings() : '');
  document.title = b ? `${b.title} · Bonnetje` : 'Bonnetje';
}

const fileButtons = () => `
  <label class="btn primary big">${icon('camera')} ${t('takePhoto')}
    <input type="file" accept="image/*" capture="environment" data-action="file" hidden></label>
  <label class="btn big">${icon('file')} ${t('choose')}
    <input type="file" accept="image/*,application/pdf,.pdf" data-action="file" hidden></label>`;

const langSwitch = () =>
  `<div class="lang-switch" role="group" aria-label="Language">${UI_LANGS.map(
    (l) => `<button class="${getLang() === l ? 'active' : ''}" data-action="ui-lang" data-lang="${l}">${l.toUpperCase()}</button>`
  ).join('')}</div>`;

const undoButton = () =>
  `<button class="settings-btn undo-btn" data-action="undo" aria-label="${t('undo')}" title="${t('undo')}" ${undoStack.length ? '' : 'disabled'}>${icon('undo')}</button>`;

const settingsButton = (withLabel) =>
  `<button class="settings-btn" data-action="settings" aria-label="${t('display')}">${icon('textsize')}${withLabel ? ` <span>${t('display')}</span>` : ''}</button>`;

function viewSettings() {
  const seg = (key, opts) =>
    `<div class="seg">${opts
      .map(([v, l]) => `<button class="${display[key] === v ? 'active' : ''}" data-action="set-display" data-key="${key}" data-value="${v}" aria-pressed="${display[key] === v}">${l}</button>`)
      .join('')}</div>`;
  return `<div class="overlay" data-action="settings-close-bg">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <h2 id="settings-title">${t('settingsTitle')}
        <button class="icon-btn" data-action="settings-close" aria-label="${t('close')}">${icon('x')}</button></h2>
      <div class="field"><span>${t('language')}</span>${`<div class="seg">${UI_LANGS.map(
        (l) => `<button class="${getLang() === l ? 'active' : ''}" data-action="ui-lang" data-lang="${l}">${l === 'nl' ? 'Nederlands' : 'English'}</button>`
      ).join('')}</div>`}</div>
      <div class="field"><span>${t('theme')}</span>${seg('theme', [['auto', t('themeAuto')], ['light', t('themeLight')], ['dark', t('themeDark')]])}
        <small class="muted">${t('themeHelp')}</small></div>
      <div class="field"><span>${t('textSize')}</span>${seg('size', [['normal', t('sizeNormal')], ['large', t('sizeLarge')], ['xl', t('sizeXl')]])}</div>
      <label class="switch"><span><strong>${t('contrast')}</strong><br><small class="muted">${t('contrastHelp')}</small></span>
        <input type="checkbox" role="switch" data-action="set-contrast" ${display.contrast ? 'checked' : ''}></label>
      <div class="sample"><span class="muted small">${t('sample')}</span>
        <div class="row-between"><strong>${t('sampleLine')}</strong><strong>${formatEuro(2450)}</strong></div></div>
      <button class="btn primary big" data-action="settings-close">${t('close')}</button>
    </section>
  </div>`;
}

function viewHome() {
  const list = state.bills
    .map((b) => {
      const r = computeSplit(b);
      const paid = r.persons.filter((p) => p.paid).length;
      return `<li class="bill-row">
        <button class="bill-open" data-action="open" data-id="${b.id}">
          <strong>${esc(b.title)}</strong>
          <span class="muted">${fmtDate(b.createdAt)} · ${b.people.length} ${t('persons')} · ${formatEuro(r.itemsTotal)}</span>
          ${b.people.length ? `<span class="pill ${paid === b.people.length ? 'ok' : ''}">${t('paidOf', { a: paid, b: b.people.length })}</span>` : ''}
        </button>
        <button class="icon-btn" data-action="delete-bill" data-id="${b.id}" aria-label="${t('delete')}">${icon('trash')}</button>
      </li>`;
    })
    .join('');
  return `
  <header class="topbar"><h1>${icon('receipt')} Bonnetje</h1>${langSwitch()}${undoStack.length ? undoButton() : ''}${settingsButton(true)}</header>
  <main class="wrap">
    <section class="card hero">
      <h2>${t('newBill')}</h2>
      <p class="muted">${t('heroText')}</p>
      <div class="stack">${fileButtons()}
        <button class="btn ghost" data-action="manual">${t('noPhoto')}</button>
      </div>
      <div class="receipt-lang">
        <span class="label">${t('receiptLang')}</span>
        <div class="seg small">${['auto', ...RECEIPT_LANGS]
          .map((l) => `<button class="${receiptLang === l ? 'active' : ''}" data-action="receipt-lang" data-lang="${l}">${l === 'auto' ? t('auto') : langName(l)}</button>`)
          .join('')}</div>
      </div>
    </section>
    ${list ? `<section><h2 class="section-title">${t('earlier')}</h2><ul class="bill-list">${list}</ul></section>` : ''}
    <p class="foot muted desktop-only">${t('dropHint')}</p>
    <p class="foot muted">${t('privacy')}</p>
  </main>`;
}

function viewBill(b) {
  const r = computeSplit(b);
  const tabs = [
    ['bon', '1', t('tabBon'), b.items.length ? '' : '!'],
    ['deelnemers', '2', t('tabPeople'), b.people.length || ''],
    ['verdelen', '3', t('tabAssign'), r.unassignedCents && b.people.length ? '!' : ''],
    ['overzicht', '4', t('tabOverview'), ''],
  ];
  const body = { bon: viewBon, deelnemers: viewPeople, verdelen: viewAssign, overzicht: viewOverview }[ui.tab](b, r);
  return `
  <header class="topbar">
    <button class="icon-btn" data-action="home" aria-label="${t('back')}">${icon('back')}</button>
    <h1 class="ellipsis">${esc(b.title)}</h1>
    <span class="topbar-total">${formatEuro(r.itemsTotal)}</span>
    ${undoButton()}
    ${settingsButton(false)}
  </header>
  <main class="wrap with-nav">${body}</main>
  <nav class="tabs">${tabs
    .map(
      ([id, n, label, badge]) => `<button class="tab ${ui.tab === id ? 'active' : ''}" data-action="tab" data-tab="${id}">
        <span class="tab-n">${n}</span><span>${label}</span>${badge !== '' ? `<span class="badge ${badge === '!' ? 'warn' : ''}">${badge}</span>` : ''}
      </button>`
    )
    .join('')}</nav>`;
}

function viewTranslation(b) {
  if (!b.lang || !b.items.length) return '';
  const ui_ = getLang();
  if (b.lang === ui_ && !b.translatedTo) return '';
  const rest = untranslated(b);
  const translatedHere = b.translatedTo === ui_;
  return `<section class="card translate">
    <div class="row-between"><h3>${icon('globe')} ${t('trTitle')}</h3>
      <select data-action="bill-lang" aria-label="${t('receiptLang')}">${RECEIPT_LANGS.map(
        (l) => `<option value="${l}" ${b.lang === l ? 'selected' : ''}>${langName(l)}</option>`
      ).join('')}</select></div>
    <p class="muted small">${t('trDetected', { lang: langName(b.lang) })} ${translatedHere ? t('trTranslated') : ''}</p>
    <div class="row-wrap">
      ${
        translatedHere
          ? `<button class="btn small-btn" data-action="tr-undo">${t('trUndo')}</button>`
          : b.lang !== ui_
            ? `<button class="btn primary small-btn" data-action="tr-do">${icon('globe')} ${t('trDo')}</button>`
            : `<button class="btn small-btn" data-action="tr-undo">${t('trUndo')}</button>`
      }
    </div>
    ${
      translatedHere && rest.length
        ? `<div class="alert warn">${t('trPartial', { n: rest.length })}</div>
           <button class="btn small-btn" data-action="tr-online" ${ui.trBusy ? 'disabled' : ''}>${icon('globe')} ${ui.trBusy ? t('trOnlineBusy') : t('trOnline')}</button>
           <p class="muted small">${t('trOnlineNote')}</p>`
        : ''
    }
  </section>`;
}

function viewBon(b, r) {
  const o = ui.ocr?.billId === b.id ? ui.ocr : null;
  const ocr = o
    ? o.error
      ? `<div class="alert error">${esc(o.error)}</div>`
      : `<div class="ocr card" role="status"><span class="ocr-label">${esc(o.label)}</span>
           <div class="bar"><span style="width:${Math.round((o.progress || 0) * 100)}%"></span></div>
           <p class="muted small">${t('langDownload')}</p></div>`
    : '';
  const diff = b.receiptTotalCents != null ? r.itemsTotal - b.receiptTotalCents : 0;
  const rows = b.items
    .map(
      (it) => `<div class="item-edit ${(it.coverage ?? 1) < 1 && b.translatedTo ? 'partial' : ''}">
        <input class="qty" type="number" min="1" step="1" inputmode="numeric" value="${it.qty}" data-action="item-field" data-field="qty" data-id="${it.id}" aria-label="${t('qty')}">
        <input class="name" value="${esc(it.name)}" placeholder="${t('desc')}" data-action="item-field" data-field="name" data-id="${it.id}" aria-label="${t('desc')}">
        <input class="price" inputmode="decimal" value="${formatPlain(it.priceCents)}" data-action="item-field" data-field="price" data-id="${it.id}" aria-label="${t('amount')}">
        <button class="icon-btn" data-action="item-del" data-id="${it.id}" aria-label="${t('delLine')}">${icon('x')}</button>
        ${showOrig(it) ? `<span class="orig">${t('original')}: ${esc(it.orig)}</span>` : ''}
        ${it.qty > 1 ? `<button class="link small split" data-action="item-split" data-id="${it.id}">${t('split', { n: it.qty })}</button>` : ''}
      </div>`
    )
    .join('');
  return `
  <section class="card">
    <label class="field"><span>${t('billName')}</span><input value="${esc(b.title)}" data-action="title"></label>
  </section>
  ${ocr}
  ${
    b.image
      ? `<details class="card preview" ${ui.open.preview === false ? '' : 'open'} data-action="preview-toggle">
           <summary>${t('preview')}</summary><img src="${esc(b.image)}" alt="${t('photoAlt')}"></details>`
      : !o
        ? `<section class="card"><h3>${t('readBill')}</h3><div class="stack">${fileButtons()}</div></section>`
        : ''
  }
  ${viewTranslation(b)}
  <section class="card">
    <div class="row-between"><h3>${t('lines')}</h3><span class="muted small">${t('linesHead')}</span></div>
    ${rows || `<p class="muted">${t('noLinesYet')}</p>`}
    <button class="btn ghost" data-action="item-add">${icon('plus')} ${t('addLine')}</button>
    <div class="totals">
      <div class="row-between"><span>${t('sumLines')}</span><strong>${formatEuro(r.itemsTotal)}</strong></div>
      <label class="row-between"><span>${t('totalOnBill')}</span>
        <input class="price" inputmode="decimal" placeholder="${t('optional')}" value="${b.receiptTotalCents != null ? formatPlain(b.receiptTotalCents) : ''}" data-action="receipt-total"></label>
      ${
        b.receiptTotalCents != null
          ? diff
            ? `<div class="alert warn">${t('diff', { d: formatEuro(diff) })}</div>`
            : `<div class="alert ok">${icon('check')} ${t('matches')}</div>`
          : ''
      }
    </div>
    ${b.image ? `<label class="btn ghost small-btn">${icon('camera')} ${t('otherPhoto')}<input type="file" accept="image/*,application/pdf,.pdf" data-action="file" hidden></label>` : ''}
  </section>
  <button class="btn primary big next" data-action="tab" data-tab="deelnemers">${t('nextPeople')} ${icon('next')}</button>`;
}

function viewPeople(b) {
  const list = b.people
    .map(
      (p) => `<li class="person-row">
        <span class="avatar" style="background:${colorOf(b, p.id)}">${esc(initials(p.name))}</span>
        <input value="${esc(p.name)}" data-action="person-rename" data-id="${p.id}" aria-label="${t('name')}">
        <button class="icon-btn" data-action="person-del" data-id="${p.id}" aria-label="${t('delete')}">${icon('trash')}</button>
      </li>`
    )
    .join('');
  return `
  <section class="card">
    <h3>${t('whoJoined')}</h3>
    <form class="add-person" data-action="person-add">
      <input name="pname" placeholder="${t('name')}" autocomplete="off" enterkeyhint="done" ${b.people.length ? '' : 'autofocus'}>
      <button class="btn primary" type="submit">${icon('plus')} ${t('add')}</button>
    </form>
    <p class="muted small">${t('peopleTip')}</p>
    <ul class="person-list">${list}</ul>
  </section>
  ${b.people.length ? `<button class="btn primary big next" data-action="tab" data-tab="verdelen">${t('nextAssign')} ${icon('next')}</button>` : ''}`;
}

function viewAssign(b, r) {
  if (!b.people.length) return emptyHint(t('addPeopleFirst'), 'deelnemers', t('toPeople'));
  if (!b.items.length) return emptyHint(t('noItems'), 'bon', t('toBon'));
  if (!b.people.some((p) => p.id === ui.person)) ui.person = b.people[0].id;
  const sel = b.people.find((p) => p.id === ui.person);
  const chips = b.people
    .map((p) => {
      const pr = r.persons.find((x) => x.id === p.id);
      return `<button class="chip ${p.id === ui.person ? 'active' : ''}" style="--c:${colorOf(b, p.id)}" data-action="select-person" data-id="${p.id}">
        <span class="avatar sm" style="background:${colorOf(b, p.id)}">${esc(initials(p.name))}</span>
        <span>${esc(p.name)}</span><small>${formatEuro(pr.subtotalCents)}</small></button>`;
    })
    .join('');
  const rows = b.items
    .map((it) => {
      const weights = itemWeights(it, b.people);
      const mine = it.everyone ? 1 : it.assign?.[ui.person] || 0;
      const left = unitsLeft(it, b.people);
      const W = weights.reduce((a, [, w]) => a + w, 0);
      const badges = weights
        .map(([pid, w]) => {
          const p = b.people.find((x) => x.id === pid);
          return `<span class="mini" style="background:${colorOf(b, pid)}" title="${esc(p.name)}">${esc(initials(p.name))}${w > 1 ? `×${w}` : ''}</span>`;
        })
        .join('');
      const status = it.everyone
        ? `<span class="pill ok">${t('everyone')}</span>`
        : left > 0
          ? `<span class="pill warn">${t('left', { a: left, b: it.qty })}</span>`
          : W > it.qty
            ? `<span class="pill">${t('shared')}</span>`
            : `<span class="pill ok">${t('assigned')}</span>`;
      return `<div class="assign-row ${mine ? 'mine' : ''}" style="--c:${colorOf(b, ui.person)}">
        <button class="assign-main" data-action="unit" data-delta="1" data-id="${it.id}">
          <span class="assign-name">${it.qty > 1 ? `<b>${it.qty}×</b> ` : ''}${esc(it.name) || `<em class="muted">${t('desc')}</em>`}</span>
          ${showOrig(it) ? `<span class="orig">${esc(it.orig)}</span>` : ''}
          <span class="assign-meta">${formatEuro(it.priceCents)} ${status}</span>
          <span class="badges">${badges}</span>
        </button>
        ${it.qty > 1 ? `<button class="link small split" data-action="item-split" data-id="${it.id}">${icon('split')} ${t('split', { n: it.qty })}</button>` : ''}
        <div class="stepper">
          <button data-action="unit" data-delta="-1" data-id="${it.id}" aria-label="${t('less')}" ${mine ? '' : 'disabled'}>−</button>
          <span>${mine}</span>
          <button data-action="unit" data-delta="1" data-id="${it.id}" aria-label="${t('more')}">+</button>
        </div>
        <button class="icon-btn everyone ${it.everyone ? 'on' : ''}" data-action="everyone" data-id="${it.id}" aria-label="${t('splitAll')}" title="${t('splitAll')}">${icon('users')}</button>
      </div>`;
    })
    .join('');
  return `
  <div class="chips">${chips}</div>
  ${
    hintSeen()
      ? `<p class="hint">${t('step2', { name: `<strong>${esc(sel.name)}</strong>` })}. ${t('step3', { icon: icon('users') })}</p>`
      : `<div class="steps-hint"><span><b>1</b> ${t('step1')}</span><span><b>2</b> ${t('step2', { name: esc(sel.name) })}</span><small>${t('step3', { icon: icon('users') })}</small></div>`
  }
  <section class="assign-list">${rows}</section>
  ${
    r.unassignedCents
      ? `<div class="alert warn sticky-note">${t('unassigned', { a: formatEuro(r.unassignedCents) })}</div>`
      : `<div class="alert ok sticky-note">${icon('check')} ${t('allAssigned')}</div>`
  }
  <button class="btn primary big next" data-action="tab" data-tab="overzicht">${t('toOverview')} ${icon('next')}</button>`;
}

function viewOverview(b, r) {
  if (!b.people.length) return emptyHint(t('addPeopleFirst'), 'deelnemers', t('toPeople'));
  const tp = b.tip;
  const pct = r.dueTotal ? Math.round((r.paidTotal / r.dueTotal) * 100) : 0;
  const paidCount = r.persons.filter((p) => p.paid).length;
  const cards = r.persons.map((p) => personCard(b, p)).join('');
  return `
  <section class="summary card">
    <div class="stat"><span>${t('sBill')}</span><strong>${formatEuro(r.itemsTotal)}</strong></div>
    <div class="stat"><span>${t('sTip')}</span><strong>${formatEuro(r.tipTotal)}</strong></div>
    <div class="stat"><span>${t('sPaid')}</span><strong class="ok-text">${formatEuro(r.paidTotal)}</strong></div>
    <div class="stat"><span>${t('sOpen')}</span><strong class="${r.openTotal ? 'warn-text' : 'ok-text'}">${formatEuro(r.openTotal)}</strong></div>
    <div class="progress"><div class="bar"><span style="width:${pct}%"></span></div><small>${t('paidCount', { a: paidCount, b: r.persons.length })}</small></div>
  </section>
  ${r.unassignedCents ? `<div class="alert warn">${t('stillUnassigned', { a: formatEuro(r.unassignedCents) })} <button class="link" data-action="tab" data-tab="verdelen">${t('tabAssign')}</button></div>` : ''}
  <details class="card tipbox" ${ui.open.tip ? 'open' : ''} data-action="tip-toggle">
    <summary><span>${t('tipTitle')}</span><strong>${tp.mode === 'none' && !r.tipTotal ? t('none') : formatEuro(r.tipTotal)}</strong></summary>
    <div class="seg">${[['none', t('tmNone')], ['total', t('tmTotal')], ...(tp.mode === 'amount' ? [['amount', t('tmAmount')]] : []), ['perPerson', t('tmPerPerson')]]
      .map(([m, l]) => `<button class="${tp.mode === m ? 'active' : ''}" data-action="tip-mode" data-mode="${m}">${l}</button>`)
      .join('')}</div>
    ${
      tp.mode === 'amount'
        ? `<label class="field"><span>${t('tipAmountLabel')}</span><input inputmode="decimal" value="${formatPlain(tp.amountCents)}" data-action="tip-value"></label>`
        : tp.mode === 'total'
          ? `<label class="field"><span>${t('paidRestaurant', { a: formatEuro(r.itemsTotal) })}</span><input inputmode="decimal" placeholder="${t('eg')} ${formatPlain(roundUpSuggestions(r.itemsTotal)[1] ?? 0)}" value="${tp.paidTotalCents != null ? formatPlain(tp.paidTotalCents) : ''}" data-action="tip-value"></label>
             <div class="quick">${roundUpSuggestions(r.itemsTotal).map((c) => `<button data-action="tip-paid-quick" data-cents="${c}">${formatEuroShort(c)}</button>`).join('')}</div>
             ${
               tp.paidTotalCents == null
                 ? ''
                 : tp.paidTotalCents < r.itemsTotal
                   ? `<div class="alert warn">${t('lessThanBill', { a: formatEuro(r.itemsTotal - tp.paidTotalCents) })}</div>`
                   : `<div class="alert ok">${t('tipIs', { a: formatEuro(r.tipTarget) })}</div>`
             }`
          : ''
    }
    ${
      tp.mode === 'total' || tp.mode === 'amount'
        ? `<span class="label">${t('distribute')}</span><div class="seg">${[['proportional', t('proportional')], ['equal', t('equal')]]
            .map(([d, l]) => `<button class="${tp.distribution === d ? 'active' : ''}" data-action="tip-dist" data-dist="${d}">${l}</button>`)
            .join('')}</div>`
        : ''
    }
    <p class="muted small">${tp.mode === 'perPerson' ? t('perPersonHelp2') : tp.mode === 'total' ? t('tipHelp2') : t('noTipHelp')}</p>
  </details>
  <section class="people-cards">${cards}</section>
  ${viewSend(b, r)}`;
}

const changeBox = (c) =>
  c == null
    ? ''
    : `<div class="change ${c >= 0 ? 'ok' : 'bad'}"><span>${c >= 0 ? t('change') : t('stillOwes')}</span><strong>${formatEuro(Math.abs(c))}</strong></div>`;

function personCard(b, p) {
  const cash = p.method === 'contant';
  const quick = [];
  if (cash) {
    quick.push([t('exactCash'), p.dueCents]);
    for (const n of [500, 1000, 2000, 5000, 10000]) if (n > p.dueCents && quick.length < 4) quick.push([formatEuroShort(n), n]);
  }
  const methodName = { contant: t('mCash'), pin: t('mCard'), tikkie: t('mTikkie') }[p.method];
  // Eén statusregel onder de naam: het belangrijkste in één oogopslag.
  const status = [methodName];
  if (cash && p.changeCents != null)
    status.push(p.changeCents >= 0 ? `${t('change').toLowerCase()} <strong>${formatEuro(p.changeCents)}</strong>` : `${t('stillOwes').toLowerCase()} <strong>${formatEuro(-p.changeCents)}</strong>`);
  if (p.tipCents) status.push(`${t('tipLine').toLowerCase()} ${formatEuro(p.tipCents)}`);
  const lines = p.lines
    .map((l) => `<li><span>${l.units > 1 ? `${l.units}× ` : ''}${esc(l.name)}${l.shared ? ` <em>${t('sharedTag')}</em>` : ''}</span><span>${formatEuro(l.cents)}</span></li>`)
    .join('');
  // Details standaard dicht (overzicht blijft kort); open/dicht wordt onthouden.
  const detailsOpen = !!ui.open['p' + p.id];
  const perPerson = b.tip.mode === 'perPerson';
  const tipBlock = perPerson
    ? `<label class="field inline"><span>${t('pays')}</span><input inputmode="decimal" placeholder="${formatPlain(p.subtotalCents)}" value="${p.payCents != null ? formatPlain(p.payCents) : ''}" data-action="pay" data-id="${p.id}"></label>
       <div class="quick">${[[t('exact'), p.subtotalCents], ...personRoundUps(p.subtotalCents).map((c) => [formatEuroShort(c), c])]
         .concat(cash && p.givenCents != null && p.givenCents > p.subtotalCents ? [[t('restTip'), p.givenCents]] : [])
         .map(([l, c]) => `<button class="${p.payCents === c ? 'active' : ''}" data-action="pay-quick" data-id="${p.id}" data-cents="${c}">${l}</button>`).join('')}</div>
       ${p.underpaidCents ? `<div class="alert warn">${t('underpaid', { a: formatEuro(p.underpaidCents), b: formatEuro(p.subtotalCents) })}</div>` : ''}`
    : cash && p.givenCents != null && p.givenCents > p.subtotalCents
      ? p.extraTipCents
        ? `<div class="row-between small"><span>${t('tipChange')}: <strong>${formatEuro(p.extraTipCents)}</strong></span><button class="link" data-action="undo-keep" data-id="${p.id}">${t('giveChange')}</button></div>`
        : `<button class="btn ghost small-btn" data-action="keep-change" data-id="${p.id}">${t('restTip')}</button>`
      : '';
  return `<article class="person-card card compact ${p.paid ? 'is-paid' : ''}" style="--c:${colorOf(b, p.id)}">
    <header>
      <label class="paid-toggle" title="${t('paid')}">
        <input type="checkbox" data-action="paid" data-id="${p.id}" ${p.paid ? 'checked' : ''} aria-label="${esc(p.name)} ${t('paid')}">
        <span class="check">${icon('check')}</span>
      </label>
      <div class="who"><strong>${esc(p.name)}</strong><span class="muted small status">${p.paid ? `✓ ${t('paid')} · ` : ''}${status.join(' · ')}</span></div>
      <div class="due"><strong>${formatEuro(p.dueCents)}</strong></div>
    </header>
    ${
      p.paidDiffCents
        ? `<div class="alert warn">${t(p.paidDiffCents > 0 ? 'paidMore' : 'paidLess', { paid: formatEuro(p.paidCents), d: formatEuro(Math.abs(p.paidDiffCents)) })}
             <button class="link" data-action="paid-settle" data-id="${p.id}">${t('settled')}</button></div>`
        : ''
    }
    <details ${detailsOpen ? 'open' : ''} data-action="person-toggle" data-id="${p.id}">
      <summary>${t('details')}</summary>
      <div class="details-body">
        <span class="label">${t('payMethod')}</span>
        <div class="seg small">${[['contant', t('mCash')], ['pin', t('mCard')], ['tikkie', t('mTikkie')]]
          .map(([m, l]) => `<button class="${p.method === m ? 'active' : ''}" data-action="method" data-method="${m}" data-id="${p.id}">${l}</button>`)
          .join('')}</div>
        ${
          cash
            ? `<div class="cash">
                 <label class="field inline"><span>${t('gives')}</span><input inputmode="decimal" placeholder="${formatPlain(0)}" value="${p.givenCents != null ? formatPlain(p.givenCents) : ''}" data-action="given" data-id="${p.id}"></label>
                 <div class="quick">${quick.map(([l, c]) => `<button data-action="given-quick" data-id="${p.id}" data-cents="${c}">${l}</button>`).join('')}</div>
                 ${changeBox(p.changeCents)}
               </div>`
            : p.method === 'tikkie'
              ? `<button class="btn small-btn" data-action="copy" data-cents="${p.dueCents}">${t('copyAmount')} (${formatPlain(p.dueCents)})</button>`
              : ''
        }
        ${tipBlock}
        <span class="label">${t('spec')}</span>
        <ul class="lines">${lines || `<li class="muted">${t('nothingYet')}</li>`}
          ${p.tipCents ? `<li><span>${t('tipLine')}</span><span>${formatEuro(p.tipCents)}</span></li>` : ''}</ul>
        <span class="label">${t('sendTo', { name: esc(p.name) })}</span>
        ${sendButtons(p.id)}
      </div>
    </details>
  </article>`;
}

const emptyHint = (msg, tab, label) =>
  `<section class="card empty"><p>${msg}</p><button class="btn primary" data-action="tab" data-tab="${tab}">${label}</button></section>`;

const sendButtons = (id) => `<div class="send-btns">
    <button class="btn small-btn wa" data-action="send" data-via="wa" data-id="${id}">${icon('chat')} WhatsApp</button>
    <button class="btn small-btn" data-action="send" data-via="mail" data-id="${id}">${icon('mail')} ${t('email')}</button>
    <button class="btn small-btn" data-action="send" data-via="share" data-id="${id}">${icon('share')} ${t('more')}</button>
  </div>`;

function viewSend(b, r) {
  return `<section class="card send">
    <h3>${icon('share')} ${t('sendAll')}</h3>
    ${sendButtons('all')}
    <label class="field"><span>${t('payInfo')}</span><input value="${esc(b.payInfo || '')}" placeholder="${t('payInfoPh')}" data-action="pay-info" autocomplete="off"></label>
    <p class="muted small">${t('sendHelp2')}</p>
  </section>`;
}

function personText(b, p) {
  const lines = p.lines.map(
    (l) => `• ${l.units > 1 ? `${l.units}× ` : ''}${l.name}${l.shared ? ` ${t('sharedTag')}` : ''}: ${formatEuro(l.cents)}`
  );
  if (p.tipCents) lines.push(`• ${t('tipLine')}: ${formatEuro(p.tipCents)}`);
  return [
    t('msgHi', { name: p.name }),
    t('msgShare', { title: b.title, date: fmtDate(b.createdAt, false), a: formatEuro(p.dueCents) }),
    '',
    t('msgSpec'),
    ...lines,
    '',
    p.paid && p.paidDiffCents <= 0
      ? t('msgPaid')
      : [p.paid ? t('msgStillDue', { d: formatEuro(p.paidDiffCents) }) : '', b.payInfo ? t('msgPayVia', { info: b.payInfo }) : '']
          .filter(Boolean)
          .join('\n'),
    t('msgThanks'),
  ]
    .filter((x, i, arr) => !(x === '' && arr[i - 1] === ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

async function send(via, text, subject) {
  if (via === 'wa') return void window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  if (via === 'mail') return void (location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`);
  if (navigator.share) {
    try {
      return await navigator.share({ title: subject, text });
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }
  return copy(text);
}

function shareText(b) {
  const r = computeSplit(b);
  const lines = r.persons.map((p) => {
    const tip = p.tipCents ? t('shareTip', { a: formatEuro(p.tipCents) }) : '';
    return `• ${p.name}: ${formatEuro(p.dueCents)}${tip}${p.paid ? (p.paidDiffCents > 0 ? t('shareStillDue', { d: formatEuro(p.paidDiffCents) }) : t('sharePaid')) : ''}`;
  });
  return [
    `🧾 ${b.title} – ${fmtDate(b.createdAt, false)}`,
    ...lines,
    t('shareTotal', { a: formatEuro(r.dueTotal) }) + (r.tipTotal ? t('shareTipTotal', { a: formatEuro(r.tipTotal) }) : ''),
    r.openTotal ? t('shareOpen', { a: formatEuro(r.openTotal) }) : t('shareAllPaid'),
    ...(b.payInfo && r.openTotal ? [t('payVia', { info: b.payInfo })] : []),
  ].join('\n');
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast(t('copied'));
  } catch {
    prompt(t('copyPrompt'), text);
  }
}

// ---------- events ----------
const findItem = (b, id) => b.items.find((i) => i.id === id);
const findPerson = (b, id) => b.people.find((p) => p.id === id);

$app.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || ['INPUT', 'FORM', 'DETAILS', 'SELECT'].includes(el.tagName)) return;
  const b = bill();
  const { action, id } = el.dataset;
  switch (action) {
    case 'undo':
      return undo();
    case 'settings':
      ui.settings = true;
      render();
      return document.querySelector('.sheet [data-action=settings-close]')?.focus();
    case 'settings-close-bg':
      if (e.target !== el) return; // alleen klik naast het paneel
    // fallthrough
    case 'settings-close':
      ui.settings = false;
      render();
      return document.querySelector('[data-action=settings]')?.focus();
    case 'set-display':
      display[el.dataset.key] = el.dataset.value;
      saveSettings(display);
      return render();
    case 'ui-lang':
      setLang(el.dataset.lang);
      return render();
    case 'receipt-lang':
      receiptLang = el.dataset.lang;
      try {
        localStorage.setItem(RL_KEY, receiptLang);
      } catch {}
      return render();
    case 'manual':
      newBill();
      return commit();
    case 'open': {
      const ob = findBill(id);
      go(id, ob.people.length ? 'overzicht' : ob.items.length ? 'deelnemers' : 'bon');
      return commit();
    }
    case 'delete-bill': {
      const title = findBill(id).title;
      state.bills = state.bills.filter((x) => x.id !== id);
      if (ui.ocr?.billId === id && ui.ocr.error) ui.ocr = null;
      commit();
      return toast(t('deleted', { name: title }), true);
    }
    case 'home':
      if (navPushed) return history.back(); // popstate tekent het startscherm
      go(null);
      return commit();
    case 'tab':
      go(state.currentId, el.dataset.tab);
      render();
      return window.scrollTo(0, 0);
    case 'tr-do':
      applyTranslation(b);
      return commit();
    case 'tr-undo':
      undoTranslation(b);
      return commit();
    case 'tr-online':
      return translateRestOnline(b);
    case 'item-add':
      b.items.push({ id: uid(), name: '', qty: 1, priceCents: 0, assign: {} });
      commit();
      return document.querySelector('.item-edit:last-of-type .name')?.focus();
    case 'item-del': {
      const name = findItem(b, id).name || t('desc');
      b.items = b.items.filter((i) => i.id !== id);
      commit();
      return toast(t('deleted', { name }), true);
    }
    case 'item-split':
      splitItem(b, id);
      commit();
      return toast(t('splitDone'), true);
    case 'person-del': {
      const p = findPerson(b, id);
      b.people = b.people.filter((x) => x.id !== id);
      b.items.forEach((i) => delete i.assign?.[id]);
      commit();
      return toast(t('deleted', { name: p.name }), true);
    }
    case 'select-person':
      ui.person = id;
      return render();
    case 'unit': {
      markHintSeen();
      const it = findItem(b, id);
      if (it.everyone) {
        it.everyone = false;
        it.assign = Object.fromEntries(b.people.map((p) => [p.id, 1]));
      }
      it.assign ||= {};
      const v = Math.max(0, (it.assign[ui.person] || 0) + Number(el.dataset.delta));
      if (v) it.assign[ui.person] = v;
      else delete it.assign[ui.person];
      return commit();
    }
    case 'everyone': {
      const it = findItem(b, id);
      it.everyone = !it.everyone;
      it.assign = {};
      return commit();
    }
    case 'tip-mode':
      b.tip.mode = el.dataset.mode;
      ui.open.tip = true;
      return commit();
    case 'pay-quick':
      findPerson(b, id).payCents = Number(el.dataset.cents);
      return commit();
    case 'tip-paid-quick':
      b.tip.paidTotalCents = Number(el.dataset.cents);
      return commit();
    case 'tip-dist':
      b.tip.distribution = el.dataset.dist;
      return commit();
    case 'method': {
      const p = findPerson(b, id);
      if (p.method === 'contant' && el.dataset.method !== 'contant') {
        p.givenCents = null;
        p.extraTipCents = 0; // was wisselgeld als fooi; zonder contant geen wisselgeld
      }
      p.method = el.dataset.method;
      return commit();
    }
    case 'given-quick':
      findPerson(b, id).givenCents = Number(el.dataset.cents);
      return commit();
    case 'keep-change': {
      const p = findPerson(b, id);
      const pr = computeSplit(b).persons.find((x) => x.id === id);
      p.extraTipCents = Math.max(0, p.givenCents - pr.subtotalCents);
      toast(t('toTip', { a: formatEuro(p.extraTipCents), name: p.name }));
      return commit();
    }
    case 'paid-settle': {
      const p = findPerson(b, id);
      p.paidCents = computeSplit(b).persons.find((x) => x.id === id).dueCents;
      return commit();
    }
    case 'undo-keep':
      findPerson(b, id).extraTipCents = 0;
      return commit();
    case 'copy':
      return copy(formatPlain(Number(el.dataset.cents)));
    case 'send': {
      const un = computeSplit(b).unassignedCents;
      if (un && !confirm(t('sendUnassigned', { a: formatEuro(un) }))) return;
      const subject = t('mailSubject', { title: b.title });
      if (id === 'all') return send(el.dataset.via, shareText(b), subject);
      const p = computeSplit(b).persons.find((x) => x.id === id);
      return send(el.dataset.via, personText(b, p), subject);
    }
  }
});

$app.addEventListener('toggle', (e) => {
  const el = e.target;
  if (el.dataset?.action === 'tip-toggle') ui.open.tip = el.open;
  if (el.dataset?.action === 'preview-toggle') ui.open.preview = el.open;
  if (el.dataset?.action === 'person-toggle') ui.open['p' + el.dataset.id] = el.open;
}, true);

$app.addEventListener('change', (e) => {
  const el = e.target;
  const b = bill();
  const { action, id } = el.dataset;
  switch (action) {
    case 'file': {
      const file = el.files?.[0];
      if (!file) return;
      return importFile(file, b || newBill());
    }
    case 'bill-lang':
      undoTranslation(b);
      b.lang = el.value;
      if (b.lang !== getLang()) applyTranslation(b);
      return commit();
    case 'title':
      b.title = el.value.trim() || b.title;
      b.autoTitle = false;
      return commit();
    case 'item-field': {
      const it = findItem(b, id);
      const f = el.dataset.field;
      if (f === 'name') {
        it.name = el.value.trim();
        it.coverage = 1;
      }
      if (f === 'qty') {
        it.qty = Math.max(1, Math.round(Number(el.value) || 1));
        const W = it.everyone ? 0 : Object.values(it.assign || {}).reduce((a, w) => a + w, 0);
        if (W > it.qty) toast(t('qtyBelow', { n: W, q: it.qty }));
      }
      if (f === 'price') {
        const c = parseEuro(el.value);
        if (c == null) toast(t('invalidAmount'));
        else it.priceCents = c;
      }
      return commit();
    }
    case 'set-contrast':
      display.contrast = el.checked;
      saveSettings(display);
      return render();
    case 'pay-info':
      b.payInfo = el.value.trim();
      return commit();
    case 'receipt-total':
      b.receiptTotalCents = el.value.trim() ? parseEuro(el.value) : null;
      return commit();
    case 'person-rename':
      findPerson(b, id).name = el.value.trim() || findPerson(b, id).name;
      return commit();
    case 'tip-value':
      if (b.tip.mode === 'amount') b.tip.amountCents = Math.max(0, parseEuro(el.value) || 0);
      else b.tip.paidTotalCents = el.value.trim() ? parseEuro(el.value) : null;
      return commit();
    case 'given':
      findPerson(b, id).givenCents = el.value.trim() ? parseEuro(el.value) : null;
      return commit();
    case 'pay':
      findPerson(b, id).payCents = el.value.trim() ? parseEuro(el.value) : null;
      return commit();
    case 'extra-tip':
      findPerson(b, id).extraTipCents = Math.max(0, parseEuro(el.value) || 0);
      return commit();
    case 'paid': {
      const p = findPerson(b, id);
      p.paid = el.checked;
      if (el.checked) {
        p.paidCents = computeSplit(b).persons.find((x) => x.id === id).dueCents;
        toast(t('hasPaid', { name: p.name }));
      } else delete p.paidCents;
      return commit();
    }
  }
});

// Live wisselgeld tonen tijdens het typen, zonder de invoer te verstoren.
$app.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.action !== 'given') return;
  const b = bill();
  const p = findPerson(b, el.dataset.id);
  const old = p.givenCents;
  p.givenCents = el.value.trim() ? parseEuro(el.value) : null;
  const pr = computeSplit(b).persons.find((x) => x.id === p.id);
  p.givenCents = old;
  const card = el.closest('.person-card');
  card.querySelector('.change')?.remove();
  card.querySelector('.cash')?.insertAdjacentHTML('beforeend', changeBox(pr.changeCents));
});

$app.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  if (form.dataset.action !== 'person-add') return;
  const b = bill();
  const names = form.elements.pname.value.split(',').map((s) => s.trim()).filter(Boolean);
  if (!names.length) return;
  for (const name of names)
    b.people.push({ id: uid(), name, method: 'contant', givenCents: null, extraTipCents: 0, paid: false });
  commit();
  document.querySelector('.add-person input')?.focus();
});

// ---------- icons ----------
function icon(name) {
  const p = {
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5 2.5 5 5.5"/>',
    share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v7h14v-7"/>',
    chat: '<path d="M4 20l1.5-4A8 8 0 1 1 8 18.5z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    split: '<path d="M12 3v6M12 9l-6 6M12 9l6 6M6 15v6M18 15v6"/>',
    textsize: '<path d="M3 19l5-13 5 13M4.8 14.5h6.4"/><path d="M14 19l3.5-9 3.5 9M15.2 16h4.6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  }[name];
  return `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

document.addEventListener('keydown', (e) => {
  // ⌘Z / Ctrl+Z buiten invoervelden: ongedaan maken
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    e.preventDefault();
    return undo();
  }
  if (e.key === 'Escape' && ui.settings) {
    ui.settings = false;
    render();
  }
});

// ---------- plakken en slepen (bv. vanuit Voorvertoning op de Mac) ----------
const receiptFileFrom = (list) =>
  [...(list || [])].find((f) => f && (/^image\//.test(f.type) || f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '')));

function acceptFile(file) {
  if (!file) return;
  importFile(file, bill() || newBill());
}

document.addEventListener('paste', (e) => {
  const file = receiptFileFrom([...(e.clipboardData?.items || [])].filter((i) => i.kind === 'file').map((i) => i.getAsFile()));
  if (!file) return;
  e.preventDefault();
  acceptFile(file);
});

let dragDepth = 0;
const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
document.addEventListener('dragenter', (e) => {
  if (!hasFiles(e)) return;
  dragDepth++;
  document.body.dataset.drop = t('dropHere');
  document.body.classList.add('dragging');
});
document.addEventListener('dragover', (e) => {
  if (hasFiles(e)) e.preventDefault();
});
document.addEventListener('dragleave', () => {
  if (--dragDepth <= 0) {
    dragDepth = 0;
    document.body.classList.remove('dragging');
  }
});
document.addEventListener('drop', (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('dragging');
  acceptFile(receiptFileFrom(e.dataTransfer.files));
});

history.replaceState({ billId: state.currentId, tab: ui.tab }, '');
render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
