import { computeSplit, formatEuro, formatPlain, parseEuro, uid, unitsLeft, itemWeights } from './calc.js';
import { parseReceiptText } from './parse.js';
import { readReceiptFile } from './ocr.js';
import { load, save } from './store.js';

const state = load();
const ui = { tab: 'bon', person: null, ocr: null, open: {} };
const $app = document.getElementById('app');
const $toast = document.getElementById('toast');

// ---------- helpers ----------
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (ts) => {
  const d = new Date(ts);
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const bill = () => state.bills.find((b) => b.id === state.currentId);
const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
const COLORS = ['#2563eb', '#db2777', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#65a30d', '#c026d3', '#ea580c'];
const colorOf = (b, pid) => COLORS[Math.max(0, b.people.findIndex((p) => p.id === pid)) % COLORS.length];

function commit() {
  if (!save(state)) toast('Let op: opslag op dit toestel is vol.');
  render();
}

let toastTimer;
function toast(msg) {
  $toast.textContent = msg;
  $toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.classList.remove('show'), 2200);
}

function newBill(title) {
  const b = {
    id: uid(),
    createdAt: Date.now(),
    title: title || `Bon ${fmtDate(Date.now())}`,
    image: null,
    receiptTotalCents: null,
    items: [],
    people: [],
    tip: { mode: 'none', amountCents: 0, percent: 10, distribution: 'proportional' },
  };
  state.bills.unshift(b);
  state.currentId = b.id;
  ui.tab = 'bon';
  ui.person = null;
  return b;
}

async function importFile(file, b) {
  ui.ocr = { label: 'Bezig…', progress: 0 };
  ui.tab = 'bon';
  render();
  try {
    const res = await readReceiptFile(file, (p) => {
      ui.ocr = p;
      updateProgress();
    });
    const parsed = parseReceiptText(res.text);
    b.image = res.previewUrl;
    b.rawText = res.text;
    const newItems = parsed.items.map((it) => ({ id: uid(), assign: {}, ...it }));
    if (b.items.length && !confirm('Bestaande regels vervangen door de ingelezen regels?')) b.items.push(...newItems);
    else b.items = newItems;
    if (parsed.totalCents != null) b.receiptTotalCents = parsed.totalCents;
    if (parsed.title && /^Bon \d/.test(b.title)) b.title = parsed.title;
    ui.ocr = null;
    toast(newItems.length ? `${newItems.length} regels gevonden – controleer ze even.` : 'Geen regels herkend – voer ze handmatig in.');
  } catch (e) {
    console.error(e);
    ui.ocr = { error: e.message || 'Uitlezen mislukt.' };
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
  const b = bill();
  $app.innerHTML = b ? viewBill(b) : viewHome();
  document.title = b ? `${b.title} · Bonnetje` : 'Bonnetje';
}

const fileButtons = (primaryLabel = 'Foto maken') => `
  <label class="btn primary big">${icon('camera')} ${primaryLabel}
    <input type="file" accept="image/*" capture="environment" data-action="file" hidden></label>
  <label class="btn big">${icon('file')} Foto of PDF kiezen
    <input type="file" accept="image/*,application/pdf,.pdf" data-action="file" hidden></label>`;

function viewHome() {
  const list = state.bills
    .map((b) => {
      const r = computeSplit(b);
      const paid = r.persons.filter((p) => p.paid).length;
      return `<li class="bill-row">
        <button class="bill-open" data-action="open" data-id="${b.id}">
          <strong>${esc(b.title)}</strong>
          <span class="muted">${fmtDate(b.createdAt)} · ${b.people.length} pers. · ${formatEuro(r.itemsTotal)}</span>
          ${b.people.length ? `<span class="pill ${paid === b.people.length ? 'ok' : ''}">${paid}/${b.people.length} betaald</span>` : ''}
        </button>
        <button class="icon-btn" data-action="delete-bill" data-id="${b.id}" aria-label="Verwijderen">${icon('trash')}</button>
      </li>`;
    })
    .join('');
  return `
  <header class="topbar"><h1>${icon('receipt')} Bonnetje</h1></header>
  <main class="wrap">
    <section class="card hero">
      <h2>Nieuwe bon verdelen</h2>
      <p class="muted">Maak een foto van de rekening, voeg de deelnemers toe en tik aan wie wat had.</p>
      <div class="stack">${fileButtons()}
        <button class="btn ghost" data-action="manual">Zonder foto beginnen</button>
      </div>
    </section>
    ${list ? `<section><h2 class="section-title">Eerdere bonnen</h2><ul class="bill-list">${list}</ul></section>` : ''}
    <p class="foot muted">Alles blijft op dit toestel. Het uitlezen gebeurt op je telefoon zelf.</p>
  </main>`;
}

function viewBill(b) {
  const r = computeSplit(b);
  const tabs = [
    ['bon', '1', 'Bon', b.items.length ? '' : '!'],
    ['deelnemers', '2', 'Deelnemers', b.people.length || ''],
    ['verdelen', '3', 'Verdelen', r.unassignedCents && b.people.length ? '!' : ''],
    ['overzicht', '4', 'Overzicht', ''],
  ];
  const body = { bon: viewBon, deelnemers: viewPeople, verdelen: viewAssign, overzicht: viewOverview }[ui.tab](b, r);
  return `
  <header class="topbar">
    <button class="icon-btn" data-action="home" aria-label="Terug">${icon('back')}</button>
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

function viewBon(b, r) {
  const ocr = ui.ocr
    ? ui.ocr.error
      ? `<div class="alert error">${esc(ui.ocr.error)}</div>`
      : `<div class="ocr card"><span class="ocr-label">${esc(ui.ocr.label)}</span>
           <div class="bar"><span style="width:${Math.round((ui.ocr.progress || 0) * 100)}%"></span></div>
           <p class="muted small">De eerste keer wordt het Nederlandse taalbestand gedownload (een paar MB).</p></div>`
    : '';
  const diff = b.receiptTotalCents != null ? r.itemsTotal - b.receiptTotalCents : 0;
  const rows = b.items
    .map(
      (it) => `<div class="item-edit">
        <input class="qty" type="number" min="1" step="1" inputmode="numeric" value="${it.qty}" data-action="item-field" data-field="qty" data-id="${it.id}" aria-label="Aantal">
        <input class="name" value="${esc(it.name)}" data-action="item-field" data-field="name" data-id="${it.id}" aria-label="Omschrijving">
        <input class="price" inputmode="decimal" value="${formatPlain(it.priceCents)}" data-action="item-field" data-field="price" data-id="${it.id}" aria-label="Bedrag">
        <button class="icon-btn" data-action="item-del" data-id="${it.id}" aria-label="Regel verwijderen">${icon('x')}</button>
      </div>`
    )
    .join('');
  return `
  <section class="card">
    <label class="field"><span>Naam van de bon</span><input value="${esc(b.title)}" data-action="title"></label>
  </section>
  ${ocr}
  ${
    b.image
      ? `<details class="card preview" ${ui.open.preview === false ? '' : 'open'} data-action="preview-toggle">
           <summary>Voorvertoning van de bon</summary><img src="${b.image}" alt="Foto van de bon"></details>`
      : !ui.ocr
        ? `<section class="card"><h3>Bon inlezen</h3><div class="stack">${fileButtons()}</div></section>`
        : ''
  }
  <section class="card">
    <div class="row-between"><h3>Regels op de bon</h3><span class="muted small">aantal · omschrijving · bedrag</span></div>
    ${rows || '<p class="muted">Nog geen regels. Lees een bon in of voeg regels toe.</p>'}
    <button class="btn ghost" data-action="item-add">${icon('plus')} Regel toevoegen</button>
    <div class="totals">
      <div class="row-between"><span>Som van de regels</span><strong>${formatEuro(r.itemsTotal)}</strong></div>
      <label class="row-between"><span>Totaal volgens bon</span>
        <input class="price" inputmode="decimal" placeholder="optioneel" value="${b.receiptTotalCents != null ? formatPlain(b.receiptTotalCents) : ''}" data-action="receipt-total"></label>
      ${
        b.receiptTotalCents != null
          ? diff
            ? `<div class="alert warn">Verschil van ${formatEuro(diff)} met het totaal op de bon. Controleer de regels met de voorvertoning.</div>`
            : `<div class="alert ok">${icon('check')} Regels kloppen met het totaal op de bon.</div>`
          : ''
      }
    </div>
    ${b.image ? `<label class="btn ghost small-btn">${icon('camera')} Andere foto/PDF inlezen<input type="file" accept="image/*,application/pdf,.pdf" data-action="file" hidden></label>` : ''}
  </section>
  <button class="btn primary big next" data-action="tab" data-tab="deelnemers">Volgende: deelnemers ${icon('next')}</button>`;
}

function viewPeople(b) {
  const list = b.people
    .map(
      (p) => `<li class="person-row">
        <span class="avatar" style="background:${colorOf(b, p.id)}">${esc(initials(p.name))}</span>
        <input value="${esc(p.name)}" data-action="person-rename" data-id="${p.id}" aria-label="Naam">
        <button class="icon-btn" data-action="person-del" data-id="${p.id}" aria-label="Verwijderen">${icon('trash')}</button>
      </li>`
    )
    .join('');
  return `
  <section class="card">
    <h3>Wie deden er mee?</h3>
    <form class="add-person" data-action="person-add">
      <input name="pname" placeholder="Naam" autocomplete="off" enterkeyhint="done" ${b.people.length ? '' : 'autofocus'}>
      <button class="btn primary" type="submit">${icon('plus')} Toevoegen</button>
    </form>
    <p class="muted small">Tip: zet jezelf er ook bij. Je kunt meerdere namen tegelijk invoeren, gescheiden door komma's.</p>
    <ul class="person-list">${list}</ul>
  </section>
  ${b.people.length ? `<button class="btn primary big next" data-action="tab" data-tab="verdelen">Volgende: verdelen ${icon('next')}</button>` : ''}`;
}

function viewAssign(b, r) {
  if (!b.people.length) return emptyHint('Voeg eerst deelnemers toe.', 'deelnemers', 'Naar deelnemers');
  if (!b.items.length) return emptyHint('Er staan nog geen regels op de bon.', 'bon', 'Naar de bon');
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
        ? '<span class="pill ok">iedereen</span>'
        : left > 0
          ? `<span class="pill warn">nog ${left} van ${it.qty}</span>`
          : W > it.qty
            ? '<span class="pill">gedeeld</span>'
            : '<span class="pill ok">verdeeld</span>';
      return `<div class="assign-row ${mine ? 'mine' : ''}" style="--c:${colorOf(b, ui.person)}">
        <button class="assign-main" data-action="unit" data-delta="1" data-id="${it.id}">
          <span class="assign-name">${it.qty > 1 ? `<b>${it.qty}×</b> ` : ''}${esc(it.name)}</span>
          <span class="assign-meta">${formatEuro(it.priceCents)} ${status}</span>
          <span class="badges">${badges}</span>
        </button>
        <div class="stepper">
          <button data-action="unit" data-delta="-1" data-id="${it.id}" aria-label="Minder" ${mine ? '' : 'disabled'}>−</button>
          <span>${mine}</span>
          <button data-action="unit" data-delta="1" data-id="${it.id}" aria-label="Meer">+</button>
        </div>
        <button class="icon-btn everyone ${it.everyone ? 'on' : ''}" data-action="everyone" data-id="${it.id}" aria-label="Gelijk verdelen over iedereen" title="Gelijk over iedereen">${icon('users')}</button>
      </div>`;
    })
    .join('');
  return `
  <div class="chips">${chips}</div>
  <p class="hint">Tik op wat <strong>${esc(sel.name)}</strong> heeft gehad. Delen? Tik hetzelfde item ook bij de anderen aan, of gebruik ${icon('users')} voor iedereen.</p>
  <section class="assign-list">${rows}</section>
  ${
    r.unassignedCents
      ? `<div class="alert warn sticky-note">Nog niet verdeeld: <strong>${formatEuro(r.unassignedCents)}</strong></div>`
      : `<div class="alert ok sticky-note">${icon('check')} Alles is verdeeld</div>`
  }
  <button class="btn primary big next" data-action="tab" data-tab="overzicht">Naar overzicht ${icon('next')}</button>`;
}

function viewOverview(b, r) {
  if (!b.people.length) return emptyHint('Voeg eerst deelnemers toe.', 'deelnemers', 'Naar deelnemers');
  const t = b.tip;
  const pct = r.dueTotal ? Math.round((r.paidTotal / r.dueTotal) * 100) : 0;
  const paidCount = r.persons.filter((p) => p.paid).length;
  const cards = r.persons.map((p) => personCard(b, p)).join('');
  return `
  <section class="summary card">
    <div class="stat"><span>Bon</span><strong>${formatEuro(r.itemsTotal)}</strong></div>
    <div class="stat"><span>Fooi</span><strong>${formatEuro(r.tipTotal)}</strong></div>
    <div class="stat"><span>Betaald</span><strong class="ok-text">${formatEuro(r.paidTotal)}</strong></div>
    <div class="stat"><span>Nog open</span><strong class="${r.openTotal ? 'warn-text' : 'ok-text'}">${formatEuro(r.openTotal)}</strong></div>
    <div class="progress"><div class="bar"><span style="width:${pct}%"></span></div><small>${paidCount} van ${r.persons.length} betaald</small></div>
  </section>
  ${r.unassignedCents ? `<div class="alert warn">Er is nog ${formatEuro(r.unassignedCents)} niet verdeeld. <button class="link" data-action="tab" data-tab="verdelen">Verdelen</button></div>` : ''}
  <details class="card tipbox" ${ui.open.tip ? 'open' : ''} data-action="tip-toggle">
    <summary><span>Fooi / servicekosten</span><strong>${t.mode === 'none' && !r.tipTotal ? 'geen' : formatEuro(r.tipTotal)}</strong></summary>
    <div class="seg">${[['none', 'Geen'], ['amount', 'Bedrag'], ['percent', 'Percentage']]
      .map(([m, l]) => `<button class="${t.mode === m ? 'active' : ''}" data-action="tip-mode" data-mode="${m}">${l}</button>`)
      .join('')}</div>
    ${
      t.mode === 'amount'
        ? `<label class="field"><span>Fooibedrag totaal (€)</span><input inputmode="decimal" value="${formatPlain(t.amountCents)}" data-action="tip-value"></label>`
        : t.mode === 'percent'
          ? `<label class="field"><span>Percentage van de bon (= ${formatEuro(r.tipTarget)})</span><input inputmode="decimal" value="${String(t.percent).replace('.', ',')}" data-action="tip-value"></label>`
          : ''
    }
    ${
      t.mode !== 'none'
        ? `<span class="label">Verdelen</span><div class="seg">${[['proportional', 'Naar verhouding'], ['equal', 'Gelijk per persoon']]
            .map(([d, l]) => `<button class="${t.distribution === d ? 'active' : ''}" data-action="tip-dist" data-dist="${d}">${l}</button>`)
            .join('')}</div>`
        : ''
    }
    <p class="muted small">Laat iemand wisselgeld liggen of geeft iemand extra fooi, dan telt dat eerst voor zijn of haar eigen deel van de fooi. Wat overblijft, verlaagt de fooi van de anderen. Hun bedrag (ook voor een Tikkie) wordt automatisch aangepast.</p>
  </details>
  <section class="people-cards">${cards}</section>
  <div class="stack">
    <button class="btn primary big" data-action="share">${icon('share')} Overzicht delen (bv. bij Tikkie)</button>
  </div>`;
}

function personCard(b, p) {
  const quick = [];
  if (p.method === 'contant') {
    quick.push(['Gepast', p.dueCents]);
    for (const n of [500, 1000, 2000, 5000, 10000]) if (n > p.dueCents && quick.length < 4) quick.push([formatEuro(n).replace(',00', ''), n]);
  }
  const change =
    p.method === 'contant' && p.changeCents != null
      ? p.changeCents >= 0
        ? `<div class="change ok"><span>Terug</span><strong>${formatEuro(p.changeCents)}</strong></div>`
        : `<div class="change bad"><span>Nog bij te betalen</span><strong>${formatEuro(-p.changeCents)}</strong></div>`
      : '';
  const lines = p.lines
    .map((l) => `<li><span>${l.units > 1 ? `${l.units}× ` : ''}${esc(l.name)}${l.shared ? ' <em>(gedeeld)</em>' : ''}</span><span>${formatEuro(l.cents)}</span></li>`)
    .join('');
  const tipLabel = p.method === 'contant' ? 'Wisselgeld als fooi' : 'Extra fooi';
  return `<article class="person-card card ${p.paid ? 'is-paid' : ''}" style="--c:${colorOf(b, p.id)}">
    <header>
      <label class="paid-toggle">
        <input type="checkbox" data-action="paid" data-id="${p.id}" ${p.paid ? 'checked' : ''}>
        <span class="check">${icon('check')}</span>
      </label>
      <div class="who"><strong>${esc(p.name)}</strong><span class="muted small">${p.paid ? 'betaald' : 'nog niet betaald'}</span></div>
      <div class="due"><strong>${formatEuro(p.dueCents)}</strong>
        ${p.method === 'tikkie' ? `<button class="link small" data-action="copy" data-cents="${p.dueCents}">kopieer bedrag</button>` : ''}</div>
    </header>
    <details ${ui.open['p' + p.id] ? 'open' : ''} data-action="person-toggle" data-id="${p.id}">
      <summary class="muted small">Consumpties ${formatEuro(p.subtotalCents)} · fooi ${formatEuro(p.tipCents)}</summary>
      <ul class="lines">${lines || '<li class="muted">Nog niets toegewezen</li>'}
        ${p.tipCents ? `<li><span>Fooi${p.extraTipCents ? ` (waarvan ${formatEuro(p.extraTipCents)} extra)` : ''}</span><span>${formatEuro(p.tipCents)}</span></li>` : ''}</ul>
    </details>
    <div class="seg small">${[['contant', 'Contant'], ['pin', 'Pin'], ['tikkie', 'Tikkie']]
      .map(([m, l]) => `<button class="${p.method === m ? 'active' : ''}" data-action="method" data-method="${m}" data-id="${p.id}">${l}</button>`)
      .join('')}</div>
    ${
      p.method === 'contant'
        ? `<div class="cash">
            <label class="field inline"><span>Geeft</span><input inputmode="decimal" placeholder="0,00" value="${p.givenCents != null ? formatPlain(p.givenCents) : ''}" data-action="given" data-id="${p.id}"></label>
            <div class="quick">${quick.map(([l, c]) => `<button data-action="given-quick" data-id="${p.id}" data-cents="${c}">${l}</button>`).join('')}</div>
            ${change}
          </div>`
        : ''
    }
    <div class="extra">
      <label class="field inline"><span>${tipLabel}</span><input inputmode="decimal" placeholder="0,00" value="${p.extraTipCents ? formatPlain(p.extraTipCents) : ''}" data-action="extra-tip" data-id="${p.id}"></label>
      ${p.method === 'contant' && p.givenCents != null && p.givenCents > p.subtotalCents && p.extraTipCents !== p.givenCents - p.subtotalCents ? `<button class="btn ghost small-btn" data-action="keep-change" data-id="${p.id}">Rest is fooi</button>` : ''}
    </div>
  </article>`;
}

const emptyHint = (msg, tab, label) =>
  `<section class="card empty"><p>${msg}</p><button class="btn primary" data-action="tab" data-tab="${tab}">${label}</button></section>`;

function shareText(b) {
  const r = computeSplit(b);
  const lines = r.persons.map((p) => {
    const tip = p.tipCents ? ` (incl. ${formatEuro(p.tipCents)} fooi)` : '';
    return `• ${p.name}: ${formatEuro(p.dueCents)}${tip}${p.paid ? ' ✓ betaald' : ''}`;
  });
  return [
    `🧾 ${b.title} – ${fmtDate(b.createdAt).slice(0, 10)}`,
    ...lines,
    `Totaal: ${formatEuro(r.dueTotal)}${r.tipTotal ? ` (waarvan fooi ${formatEuro(r.tipTotal)})` : ''}`,
    r.openTotal ? `Nog open: ${formatEuro(r.openTotal)}` : 'Iedereen heeft betaald 🎉',
  ].join('\n');
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Gekopieerd');
  } catch {
    prompt('Kopieer:', text);
  }
}

// ---------- events ----------
const findItem = (b, id) => b.items.find((i) => i.id === id);
const findPerson = (b, id) => b.people.find((p) => p.id === id);

$app.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.tagName === 'INPUT' || el.tagName === 'FORM' || el.tagName === 'DETAILS') return;
  const b = bill();
  const { action, id } = el.dataset;
  switch (action) {
    case 'manual':
      newBill();
      return commit();
    case 'open':
      state.currentId = id;
      ui.tab = 'overzicht';
      ui.ocr = null;
      if (!findBill(id).people.length) ui.tab = findBill(id).items.length ? 'deelnemers' : 'bon';
      return commit();
    case 'delete-bill':
      if (confirm('Deze bon verwijderen?')) {
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
    case 'item-add':
      b.items.push({ id: uid(), name: '', qty: 1, priceCents: 0, assign: {} });
      commit();
      return document.querySelector('.item-edit:last-of-type .name')?.focus();
    case 'item-del':
      b.items = b.items.filter((i) => i.id !== id);
      return commit();
    case 'person-del': {
      const p = findPerson(b, id);
      if (!confirm(`${p.name} verwijderen?`)) return;
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
      toast(`${formatEuro(p.extraTipCents)} van ${p.name} gaat naar de fooi`);
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

const findBill = (id) => state.bills.find((x) => x.id === id);

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
      const target = b || newBill();
      return importFile(file, target);
    }
    case 'title':
      b.title = el.value.trim() || b.title;
      return commit();
    case 'item-field': {
      const it = findItem(b, id);
      const f = el.dataset.field;
      if (f === 'name') it.name = el.value.trim();
      if (f === 'qty') it.qty = Math.max(1, Math.round(Number(el.value) || 1));
      if (f === 'price') {
        const c = parseEuro(el.value);
        if (c == null) toast('Ongeldig bedrag');
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
      else b.tip.percent = Math.max(0, (parseEuro(el.value) || 0) / 100);
      return commit();
    case 'given': {
      const p = findPerson(b, id);
      p.givenCents = el.value.trim() ? parseEuro(el.value) : null;
      return commit();
    }
    case 'extra-tip':
      findPerson(b, id).extraTipCents = Math.max(0, parseEuro(el.value) || 0);
      return commit();
    case 'paid':
      findPerson(b, id).paid = el.checked;
      if (el.checked) toast(`${findPerson(b, id).name} heeft betaald`);
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
  div.innerHTML = `<span>${pr.changeCents >= 0 ? 'Terug' : 'Nog bij te betalen'}</span><strong>${formatEuro(Math.abs(pr.changeCents))}</strong>`;
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
  }[name];
  return `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
