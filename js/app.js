import {
  computeSplit, formatEuro, formatEuroShort, formatPlain, parseEuro, uid, unitsLeft, itemWeights,
  roundUpSuggestions, personRoundUps,
} from './calc.js';
import { parseReceiptText } from './parse.js';
import { readReceiptFile } from './ocr.js';
import { load, save } from './store.js';
import { t, getLang, setLang, fmtDate, UI_LANGS } from './i18n.js';
import { translateName, detectLanguage, translateOnline, RECEIPT_LANGS } from './translate.js';

const state = load();
const ui = { tab: 'bon', person: null, ocr: null, open: {}, trBusy: false };
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

function commit() {
  if (!save(state)) toast(t('storageFull'));
  render();
}

let toastTimer;
function toast(msg) {
  $toast.textContent = msg;
  $toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.classList.remove('show'), 2400);
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
  state.currentId = b.id;
  ui.tab = 'bon';
  ui.person = null;
  return b;
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
  commit();
}

async function importFile(file, b) {
  ui.ocr = { label: t('busy'), progress: 0 };
  ui.tab = 'bon';
  render();
  try {
    const res = await readReceiptFile(
      file,
      (p) => {
        ui.ocr = p;
        updateProgress();
      },
      receiptLang
    );
    const parsed = parseReceiptText(res.text);
    b.image = res.previewUrl;
    b.rawText = res.text;
    const newItems = parsed.items.map((it) => ({ id: uid(), assign: {}, ...it, orig: it.name }));
    if (b.items.length && !confirm(t('replaceLines'))) b.items.push(...newItems);
    else b.items = newItems;
    if (parsed.totalCents != null) b.receiptTotalCents = parsed.totalCents;
    if (parsed.title && b.autoTitle) b.title = parsed.title;
    b.lang = receiptLang !== 'auto' ? receiptLang : detectLanguage(res.text, parsed.items.map((i) => i.name)) || 'nl';
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
    ui.ocr = { error: e.message || t('readFailed') };
  }
  commit();
}

function updateProgress() {
  const el = document.querySelector('.ocr');
  if (!el || !ui.ocr) return render();
  el.querySelector('.ocr-label').textContent = ui.ocr.label;
  el.querySelector('.bar > span').style.width = `${Math.round((ui.ocr.progress || 0) * 100)}%`;
}

// ---------- views ----------
function render() {
  document.documentElement.lang = getLang();
  const b = bill();
  $app.innerHTML = b ? viewBill(b) : viewHome();
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
  <header class="topbar"><h1>${icon('receipt')} Bonnetje</h1>${langSwitch()}</header>
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
  const ocr = ui.ocr
    ? ui.ocr.error
      ? `<div class="alert error">${esc(ui.ocr.error)}</div>`
      : `<div class="ocr card"><span class="ocr-label">${esc(ui.ocr.label)}</span>
           <div class="bar"><span style="width:${Math.round((ui.ocr.progress || 0) * 100)}%"></span></div>
           <p class="muted small">${t('langDownload')}</p></div>`
    : '';
  const diff = b.receiptTotalCents != null ? r.itemsTotal - b.receiptTotalCents : 0;
  const rows = b.items
    .map(
      (it) => `<div class="item-edit ${(it.coverage ?? 1) < 1 && b.translatedTo ? 'partial' : ''}">
        <input class="qty" type="number" min="1" step="1" inputmode="numeric" value="${it.qty}" data-action="item-field" data-field="qty" data-id="${it.id}" aria-label="${t('qty')}">
        <input class="name" value="${esc(it.name)}" data-action="item-field" data-field="name" data-id="${it.id}" aria-label="${t('desc')}">
        <input class="price" inputmode="decimal" value="${formatPlain(it.priceCents)}" data-action="item-field" data-field="price" data-id="${it.id}" aria-label="${t('amount')}">
        <button class="icon-btn" data-action="item-del" data-id="${it.id}" aria-label="${t('delLine')}">${icon('x')}</button>
        ${showOrig(it) ? `<span class="orig">${t('original')}: ${esc(it.orig)}</span>` : ''}
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
           <summary>${t('preview')}</summary><img src="${b.image}" alt="${t('photoAlt')}"></details>`
      : !ui.ocr
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
          <span class="assign-name">${it.qty > 1 ? `<b>${it.qty}×</b> ` : ''}${esc(it.name)}</span>
          ${showOrig(it) ? `<span class="orig">${esc(it.orig)}</span>` : ''}
          <span class="assign-meta">${formatEuro(it.priceCents)} ${status}</span>
          <span class="badges">${badges}</span>
        </button>
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
  <p class="hint">${t('assignHint', { name: esc(sel.name), icon: icon('users') })}</p>
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
    <div class="seg">${[['none', t('tmNone')], ['total', t('tmTotal')], ['amount', t('tmAmount')], ['perPerson', t('tmPerPerson')]]
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
    <p class="muted small">${tp.mode === 'perPerson' ? t('perPersonHelp') : t('tipHelp')}</p>
  </details>
  <section class="people-cards">${cards}</section>
  <div class="stack">
    <button class="btn primary big" data-action="share">${icon('share')} ${t('shareBtn')}</button>
  </div>`;
}

function personCard(b, p) {
  const quick = [];
  if (p.method === 'contant') {
    quick.push([t('exactCash'), p.dueCents]);
    for (const n of [500, 1000, 2000, 5000, 10000]) if (n > p.dueCents && quick.length < 4) quick.push([formatEuroShort(n), n]);
  }
  const change =
    p.method === 'contant' && p.changeCents != null
      ? p.changeCents >= 0
        ? `<div class="change ok"><span>${t('change')}</span><strong>${formatEuro(p.changeCents)}</strong></div>`
        : `<div class="change bad"><span>${t('stillOwes')}</span><strong>${formatEuro(-p.changeCents)}</strong></div>`
      : '';
  const lines = p.lines
    .map((l) => `<li><span>${l.units > 1 ? `${l.units}× ` : ''}${esc(l.name)}${l.shared ? ` <em>${t('sharedTag')}</em>` : ''}</span><span>${formatEuro(l.cents)}</span></li>`)
    .join('');
  const tipLabel = p.method === 'contant' ? t('tipChange') : t('extraTip');
  const tipBlock =
    b.tip.mode === 'perPerson'
      ? `<div class="extra">
        <label class="field inline"><span>${t('pays')}</span><input inputmode="decimal" placeholder="${formatPlain(p.subtotalCents)}" value="${p.payCents != null ? formatPlain(p.payCents) : ''}" data-action="pay" data-id="${p.id}"></label>
        <div class="quick">${[[t('exact'), p.subtotalCents], ...personRoundUps(p.subtotalCents).map((c) => [formatEuroShort(c), c])]
          .concat(p.method === 'contant' && p.givenCents != null && p.givenCents > p.subtotalCents ? [[t('restTip'), p.givenCents]] : [])
          .map(([l, c]) => `<button class="${p.payCents === c ? 'active' : ''}" data-action="pay-quick" data-id="${p.id}" data-cents="${c}">${l}</button>`).join('')}</div>
        ${p.underpaidCents ? `<div class="alert warn">${t('underpaid', { a: formatEuro(p.underpaidCents), b: formatEuro(p.subtotalCents) })}</div>` : p.tipCents ? `<div class="muted small tip-note">${t('tipColon', { a: formatEuro(p.tipCents) })}</div>` : ''}
      </div>`
      : `<div class="extra">
      <label class="field inline"><span>${tipLabel}</span><input inputmode="decimal" placeholder="${formatPlain(0)}" value="${p.extraTipCents ? formatPlain(p.extraTipCents) : ''}" data-action="extra-tip" data-id="${p.id}"></label>
      ${p.method === 'contant' && p.givenCents != null && p.givenCents > p.subtotalCents && p.extraTipCents !== p.givenCents - p.subtotalCents ? `<button class="btn ghost small-btn" data-action="keep-change" data-id="${p.id}">${t('restTip')}</button>` : ''}
    </div>`;
  return `<article class="person-card card ${p.paid ? 'is-paid' : ''}" style="--c:${colorOf(b, p.id)}">
    <header>
      <label class="paid-toggle">
        <input type="checkbox" data-action="paid" data-id="${p.id}" ${p.paid ? 'checked' : ''}>
        <span class="check">${icon('check')}</span>
      </label>
      <div class="who"><strong>${esc(p.name)}</strong><span class="muted small">${p.paid ? t('paid') : t('notPaid')}</span></div>
      <div class="due"><strong>${formatEuro(p.dueCents)}</strong>
        ${p.method === 'tikkie' ? `<button class="link small" data-action="copy" data-cents="${p.dueCents}">${t('copyAmount')}</button>` : ''}</div>
    </header>
    <details ${ui.open['p' + p.id] ? 'open' : ''} data-action="person-toggle" data-id="${p.id}">
      <summary class="muted small">${t('consumptions', { a: formatEuro(p.subtotalCents), b: formatEuro(p.tipCents) })}</summary>
      <ul class="lines">${lines || `<li class="muted">${t('nothingYet')}</li>`}
        ${p.tipCents ? `<li><span>${t('tipLine')}${p.extraTipCents ? t('ofWhichExtra', { a: formatEuro(p.extraTipCents) }) : ''}</span><span>${formatEuro(p.tipCents)}</span></li>` : ''}</ul>
    </details>
    <div class="seg small">${[['contant', t('mCash')], ['pin', t('mCard')], ['tikkie', t('mTikkie')]]
      .map(([m, l]) => `<button class="${p.method === m ? 'active' : ''}" data-action="method" data-method="${m}" data-id="${p.id}">${l}</button>`)
      .join('')}</div>
    ${
      p.method === 'contant'
        ? `<div class="cash">
            <label class="field inline"><span>${t('gives')}</span><input inputmode="decimal" placeholder="${formatPlain(0)}" value="${p.givenCents != null ? formatPlain(p.givenCents) : ''}" data-action="given" data-id="${p.id}"></label>
            <div class="quick">${quick.map(([l, c]) => `<button data-action="given-quick" data-id="${p.id}" data-cents="${c}">${l}</button>`).join('')}</div>
            ${change}
          </div>`
        : ''
    }
    ${tipBlock}
  </article>`;
}

const emptyHint = (msg, tab, label) =>
  `<section class="card empty"><p>${msg}</p><button class="btn primary" data-action="tab" data-tab="${tab}">${label}</button></section>`;

function shareText(b) {
  const r = computeSplit(b);
  const lines = r.persons.map((p) => {
    const tip = p.tipCents ? t('shareTip', { a: formatEuro(p.tipCents) }) : '';
    return `• ${p.name}: ${formatEuro(p.dueCents)}${tip}${p.paid ? t('sharePaid') : ''}`;
  });
  return [
    `🧾 ${b.title} – ${fmtDate(b.createdAt, false)}`,
    ...lines,
    t('shareTotal', { a: formatEuro(r.dueTotal) }) + (r.tipTotal ? t('shareTipTotal', { a: formatEuro(r.tipTotal) }) : ''),
    r.openTotal ? t('shareOpen', { a: formatEuro(r.openTotal) }) : t('shareAllPaid'),
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
      state.currentId = id;
      ui.ocr = null;
      const ob = findBill(id);
      ui.tab = ob.people.length ? 'overzicht' : ob.items.length ? 'deelnemers' : 'bon';
      return commit();
    }
    case 'delete-bill':
      if (confirm(t('deleteBill'))) {
        state.bills = state.bills.filter((x) => x.id !== id);
        commit();
      }
      return;
    case 'home':
      state.currentId = null;
      ui.ocr = null;
      return commit();
    case 'tab':
      ui.tab = el.dataset.tab;
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
    case 'item-del':
      b.items = b.items.filter((i) => i.id !== id);
      return commit();
    case 'person-del': {
      const p = findPerson(b, id);
      if (!confirm(t('deletePerson', { name: p.name }))) return;
      b.people = b.people.filter((x) => x.id !== id);
      b.items.forEach((i) => delete i.assign?.[id]);
      return commit();
    }
    case 'select-person':
      ui.person = id;
      return render();
    case 'unit': {
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
      p.method = el.dataset.method;
      if (p.method !== 'contant') p.givenCents = null;
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
    case 'copy':
      return copy(formatPlain(Number(el.dataset.cents)));
    case 'share': {
      const text = shareText(b);
      if (navigator.share) {
        try {
          return await navigator.share({ text });
        } catch (err) {
          if (err.name === 'AbortError') return;
        }
      }
      return copy(text);
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
      if (f === 'qty') it.qty = Math.max(1, Math.round(Number(el.value) || 1));
      if (f === 'price') {
        const c = parseEuro(el.value);
        if (c == null) toast(t('invalidAmount'));
        else it.priceCents = c;
      }
      return commit();
    }
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
    case 'paid':
      findPerson(b, id).paid = el.checked;
      if (el.checked) toast(t('hasPaid', { name: findPerson(b, id).name }));
      return commit();
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
  if (pr.changeCents == null) return;
  const div = document.createElement('div');
  div.className = `change ${pr.changeCents >= 0 ? 'ok' : 'bad'}`;
  div.innerHTML = `<span>${pr.changeCents >= 0 ? t('change') : t('stillOwes')}</span><strong>${formatEuro(Math.abs(pr.changeCents))}</strong>`;
  card.querySelector('.cash').appendChild(div);
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
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  }[name];
  return `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
