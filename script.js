// ============ STATE ============
const state = {
  unlockedSteps: 1,
  org: { legal: '', budget: null, members: null, orgtype: '' },
  optional: { do: false, rs: false, rw: false },
  startMode: 'sofort',
  startDate: null,
  deferOpen: false,
  modules: {
    hp: { mode: 'default', shiftDate: null },
    vs: { mode: 'default', shiftDate: null },
    do: { mode: 'default', shiftDate: null },
    rs: { mode: 'default', shiftDate: null }
  }
};

// ============ PREISTABELLEN ============
const PRICE_BASE = {
  20000:  { base: 299,  withDo: 428 },
  100000: { base: 399,  withDo: 555 },
  200000: { base: 741,  withDo: 741 },
  300000: { base: 855,  withDo: 855 },
  500000: { base: 1014, withDo: 1014 },
  1000000:{ base: 1356, withDo: 1356 },
  1500000:{ base: 1556, withDo: 1556 },
  2000000:{ base: 1870, withDo: 1870 }
};
const PRICE_RS = { 250: 150, 500: 250, 1000: 450, 2000: 890 };
const PRICE_RW = { 20000: 350, 100000: 550, 200000: 780, 300000: 900, 500000: 1100, 1000000: 1100, 1500000: 1300, 2000000: 1500 };

function isDoAuto() {
  return state.org.budget !== null && state.org.budget >= 200000;
}
function priceBase() {
  if (!state.org.budget) return 0;
  const e = PRICE_BASE[state.org.budget];
  if (!e) return 0;
  return e.base;
}
function priceDoSurcharge() {
  if (!state.org.budget || isDoAuto()) return 0;
  const e = PRICE_BASE[state.org.budget];
  return e ? e.withDo - e.base : 0;
}
function priceRs() { return state.org.members ? (PRICE_RS[state.org.members] || 0) : 0; }
function priceRw() { return state.org.budget ? (PRICE_RW[state.org.budget] || 0) : 0; }

// ============ HELPER ============
function fmt(d) {
  if (!d) return '–';
  const dt = (typeof d === 'string') ? new Date(d) : d;
  if (isNaN(dt)) return '–';
  return String(dt.getDate()).padStart(2,'0') + '.' + String(dt.getMonth()+1).padStart(2,'0') + '.' + dt.getFullYear();
}
function addMonths(d, m) {
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() + m);
  return dt.toISOString().split('T')[0];
}
function effectiveStartDate() {
  if (state.startMode === 'sofort') return new Date().toISOString().split('T')[0];
  return state.startDate;
}

const labels = {
  legal: { ev: 'Eingetragener Verein (e.V.)', ggmbh: 'gemeinnützige GmbH', stiftung: 'Stiftung', sonst: 'Sonstige' },
  budget: { 20000:'bis 20.000 €', 100000:'bis 100.000 €', 200000:'bis 200.000 €', 300000:'bis 300.000 €', 500000:'bis 500.000 €', 1000000:'bis 1.000.000 €', 1500000:'bis 1.500.000 €', 2000000:'bis 2.000.000 €' },
  members: { 250:'bis 250 aktive Mitglieder', 500:'bis 500 aktive Mitglieder', 1000:'bis 1.000 aktive Mitglieder', 2000:'bis 2.000 aktive Mitglieder' },
  orgtype: { sport:'Sport', kultur:'Kunst, Kultur, Musik', schule:'Schule und Kita', kirche:'Kirchlich/religiös', sozial:'Gesundheit und Soziales', heimat:'Heimatverein', umwelt:'Umwelt, Natur, Tierschutz', freizeit:'Freizeit, Geselligkeit', fluechtling:'Flüchtlingshilfe', rettung:'Rettungsdienst, Feuerwehr', bildung:'Jugendarbeit, Bildung', branche:'Branchenverband', unbekannt:'Nicht bekannt' }
};

// ============ STEP 1 ============
function validateS1() {
  const ok = state.org.legal && state.org.budget && state.org.members;
  document.getElementById('btn-1').disabled = !ok;
}
['legal','budget','members','orgtype'].forEach(id => {
  document.getElementById(id).addEventListener('change', e => {
    let v = e.target.value;
    if (id === 'budget' || id === 'members') v = v ? parseInt(v,10) : null;
    state.org[id] = v;
    validateS1();
    if (state.unlockedSteps >= 2) renderS2();
    if (state.unlockedSteps >= 3) renderS3();
    if (state.unlockedSteps >= 4) renderS4();
  });
});

document.getElementById('btn-1').addEventListener('click', () => {
  state.unlockedSteps = Math.max(state.unlockedSteps, 2);
  renderS2();
  revealStep(2);
});

document.getElementById('edit-s1').addEventListener('click', () => scrollTo('step-1'));
document.getElementById('edit-s2').addEventListener('click', () => scrollTo('step-2'));
document.getElementById('ov-edit-1').addEventListener('click', () => scrollTo('step-1'));
document.getElementById('ov-edit-2').addEventListener('click', () => scrollTo('step-2'));
document.getElementById('ov-edit-3').addEventListener('click', () => scrollTo('step-3'));
function scrollTo(id) { document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' }); }

// ============ STEP 2 ============
document.querySelectorAll('.checkbox').forEach(c => {
  c.addEventListener('click', () => {
    if (c.closest('.disabled')) return;
    const key = c.dataset.key;
    state.optional[key] = !state.optional[key];
    
    if (key === 'rw' && state.optional.rw) {
      state.modules.vs.mode = 'default';
    }

    renderS2();
    if (state.unlockedSteps >= 3) renderS3();
    if (state.unlockedSteps >= 4) renderS4();
  });
});

function renderS2() {
  const auto = isDoAuto();
  document.getElementById('card-do-auto').classList.toggle('hidden', !auto);
  document.getElementById('opt-do').style.display = auto ? 'none' : '';
  if (auto) state.optional.do = false;

  document.getElementById('do-price').innerHTML = priceDoSurcharge() > 0 ? `€ ${priceDoSurcharge()},– <span class="price-interval">/ Jahr</span>` : '€ – <span class="price-interval">/ Jahr</span>';
  document.getElementById('rs-price').innerHTML = priceRs() > 0 ? `€ ${priceRs()},– <span class="price-interval">/ Jahr</span>` : '€ – <span class="price-interval">/ Jahr</span>';
  document.getElementById('rw-price').innerHTML = priceRw() > 0 ? `€ ${priceRw()},– <span class="price-interval">/ einmalig</span>` : '€ – <span class="price-interval">/ einmalig</span>';

  ['do','rs','rw'].forEach(k => {
    const cb = document.querySelector(`.checkbox[data-key="${k}"]`);
    if (!cb) return;
    const card = cb.closest('.optional-card');
    const lbl = document.querySelector(`[data-action-label="${k}"]`);
    cb.classList.toggle('checked', state.optional[k]);
    card.classList.toggle('active', state.optional[k]);
    if (lbl) lbl.textContent = state.optional[k] ? 'Hinzugefügt' : 'Hinzufügen';
  });

  const heroBase = priceBase() + (state.optional.do && !auto ? priceDoSurcharge() : 0);
  document.getElementById('hero-price').textContent = heroBase.toLocaleString('de-DE');

  const tags = [];
  if (state.org.legal) tags.push(labels.legal[state.org.legal]);
  if (state.org.budget) tags.push(labels.budget[state.org.budget]);
  if (state.org.members) tags.push(labels.members[state.org.members]);
  if (state.org.orgtype) tags.push(labels.orgtype[state.org.orgtype]);
  document.getElementById('recap-tags-s2').innerHTML = tags.map(t => `<span class="recap-tag">${t}</span>`).join('');

  const rows = [];
  const grund = priceBase();
  rows.push(['Vereins-Schutzbrief', 'jährlich', grund + ' €']);
  let jahres = grund;

  if (!auto && state.optional.do) {
    rows.push(['D&O-Versicherung (optional)', 'jährlich', priceDoSurcharge() + ' €']);
    jahres += priceDoSurcharge();
  }
  if (state.optional.rs) { rows.push(['Rechtsschutz (optional)', 'jährlich', priceRs() + ' €']); jahres += priceRs(); }
  if (state.optional.rw) { rows.push(['Rückwirkende Absicherung (optional)', 'einmalig', priceRw() + ' €']); }
  rows.push(['Jahresbeitrag gesamt', '', jahres + ' €']);
  if (state.optional.rw) rows.push(['Einmalig', '', priceRw() + ' €']);

  document.getElementById('beitrag-rows').innerHTML = rows.map((r,i) => {
    const isSum = r[0].startsWith('Jahresbeitrag') || r[0] === 'Einmalig';
    return `<div class="beitrag-row${isSum?' summary':''}"><span>${r[0]}</span><span style="display:flex;gap:24px;"><span style="min-width:60px;text-align:right;color:var(--text-muted);">${r[1]}</span><span style="min-width:80px;text-align:right;">${r[2]}</span></span></div>`;
  }).join('');
}

document.getElementById('btn-2-back').addEventListener('click', () => scrollTo('step-1'));
document.getElementById('btn-2').addEventListener('click', () => {
  state.unlockedSteps = Math.max(state.unlockedSteps, 3);
  if (!state.startDate) state.startDate = new Date().toISOString().split('T')[0];
  document.getElementById('start-date').value = state.startDate;
  renderS3();
  revealStep(3);
});

// ============ STEP 3 ============
document.querySelectorAll('input[name="start"]').forEach(r => {
  r.addEventListener('change', e => {
    state.startMode = e.target.value;
    document.getElementById('start-date-wrap').classList.toggle('hidden', state.startMode !== 'datum');
    renderS3();
  });
});
document.getElementById('start-date').addEventListener('change', e => {
  state.startDate = e.target.value;
  renderS3();
});
document.querySelectorAll('input[name="defer"]').forEach(r => {
  r.addEventListener('change', e => {
    state.deferOpen = (e.target.value === 'ja');
    document.getElementById('modules').classList.toggle('hidden', !state.deferOpen);
    renderS3();
  });
});
['hp','vs','do','rs'].forEach(key => {
  document.querySelectorAll(`input[name="${key}"]`).forEach(r => {
    r.addEventListener('change', e => { state.modules[key].mode = e.target.value; renderS3(); });
  });
  const sd = document.querySelector(`[data-shift-date="${key}"]`);
  if (sd) sd.addEventListener('change', e => { state.modules[key].shiftDate = e.target.value; renderS3(); });
});

function renderS3() {
  const auto = isDoAuto();
  const start = effectiveStartDate();
  const hasDo = auto || state.optional.do;

  document.getElementById('vs-title').innerHTML = hasDo
    ? 'Vermögensschadenhaftpflicht- & D&O-Versicherung <span class="help-icon" data-help="vs">i</span>'
    : 'Vermögensschadenhaftpflichtversicherung <span class="help-icon" data-help="vs">i</span>';

  ['hp','vs','do','rs'].forEach(k => {
    const el = document.getElementById(k + '-default-date');
    if (el) el.textContent = fmt(start);
  });
  const vsDate = state.modules.vs.mode === 'verschieben' ? state.modules.vs.shiftDate : start;
  document.getElementById('rw-date').textContent = fmt(vsDate);

  ['hp','vs','do','rs'].forEach(k => {
    const wrap = document.querySelector(`[data-shift="${k}"]`);
    if (!wrap) return;
    wrap.classList.toggle('hidden', state.modules[k].mode !== 'verschieben');
    const inp = wrap.querySelector('input[type="date"]');
    if (start) { inp.min = start; inp.max = addMonths(start, 12); }
  });

  const hpDev = state.modules.hp.mode !== 'default';
  const vsDev = state.modules.vs.mode !== 'default';
  document.querySelectorAll('input[name="hp"]').forEach(r => {
    if (r.value !== 'default') {
      r.disabled = vsDev;
      r.parentElement.classList.toggle('disabled', vsDev);
    }
  });
  document.querySelectorAll('input[name="vs"]').forEach(r => {
    if (r.value !== 'default') {
      r.disabled = hpDev;
      r.parentElement.classList.toggle('disabled', hpDev);
    }
  });

  const vsAussetzen = state.modules.vs.mode === 'aussetzen';
  document.getElementById('vs-warn').classList.toggle('hidden', !(vsAussetzen && state.optional.rw));

  const tags = ['Vereins-Schutzbrief'];
  if (!auto && state.optional.do) tags.push('D&O');
  if (state.optional.rs) tags.push('Rechtsschutz');
  if (state.optional.rw) tags.push('Rückwirkende Absicherung');
  document.getElementById('recap-tags-s3').innerHTML = tags.map(t => `<span class="recap-tag">${t}</span>`).join('');

  document.getElementById('mod-rs').classList.toggle('hidden', !state.optional.rs);
  document.getElementById('mod-do').classList.add('hidden');
  document.getElementById('mod-rw').classList.toggle('hidden', !state.optional.rw);
  document.getElementById('rw-info').style.display = vsAussetzen ? 'none' : '';
  document.getElementById('rw-warn').classList.toggle('hidden', !vsAussetzen);

  const zus = [];
  zus.push(['Vereins-Schutzbrief', fmt(start)]);
  if (state.modules.hp.mode === 'aussetzen') zus.push(['Haftpflicht & Veranstalter', '<span class="val warn">ausgesetzt</span>']);
  else zus.push(['Haftpflicht & Veranstalter', fmt(state.modules.hp.mode === 'verschieben' ? state.modules.hp.shiftDate : start)]);
  
  const vsLbl = hasDo ? 'Vermögensschaden & D&O' : 'Vermögensschadenhaftpflicht';
  if (vsAussetzen) zus.push([vsLbl, '<span class="val warn">ausgesetzt</span>']);
  else zus.push([vsLbl, fmt(state.modules.vs.mode === 'verschieben' ? state.modules.vs.shiftDate : start)]);
  
  if (!auto && !state.optional.do) {
    zus.push(['D&O-Versicherung', '<span class="val muted">nicht enthalten</span>']);
  }
  if (state.optional.rs) zus.push(['Rechtsschutz', fmt(state.modules.rs.mode === 'verschieben' ? state.modules.rs.shiftDate : start)]);
  else zus.push(['Rechtsschutz', '<span class="val muted">nicht enthalten</span>']);
  if (state.optional.rw) {
    if (vsAussetzen) zus.push(['Rückwirkende Absicherung', '<span class="val warn">ausgesetzt</span>']);
    else zus.push(['Rückwirkende Absicherung', fmt(vsDate)]);
  } else zus.push(['Rückwirkende Absicherung', '<span class="val muted">nicht enthalten</span>']);

  document.getElementById('zus-rows').innerHTML = zus.map(r => {
    if (r[1].includes('<span')) return `<div class="zus-row"><span class="lbl">${r[0]}</span>${r[1]}</div>`;
    return `<div class="zus-row"><span class="lbl">${r[0]}</span><span class="val">${r[1]}</span></div>`;
  }).join('');
}

document.getElementById('btn-3-back').addEventListener('click', () => scrollTo('step-2'));
document.getElementById('btn-3').addEventListener('click', () => {
  if (state.modules.vs.mode === 'aussetzen' && state.optional.rw) {
    openModal();
    return;
  }
  proceedToStep4();
});

function proceedToStep4() {
  state.unlockedSteps = Math.max(state.unlockedSteps, 4);
  renderS4();
  revealStep(4);
}

// ============ MODAL ============
function openModal() { document.getElementById('modal-rw-removal').classList.remove('hidden'); }
function closeModal() { document.getElementById('modal-rw-removal').classList.add('hidden'); }
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-confirm').addEventListener('click', () => {
  state.optional.rw = false;
  renderS2();
  renderS3();
  closeModal();
  proceedToStep4();
});
document.getElementById('modal-rw-removal').addEventListener('click', e => {
  if (e.target.id === 'modal-rw-removal') closeModal();
});

// ============ STEP 4 (ÜBERSICHT) ============
function renderS4() {
  const auto = isDoAuto();
  const start = effectiveStartDate();
  const vsAussetzen = state.modules.vs.mode === 'aussetzen';
  const hasDo = auto || state.optional.do;

  const org = [
    ['Rechtsform', labels.legal[state.org.legal] || '–'],
    ['Haushaltssumme', labels.budget[state.org.budget] || '–'],
    ['Aktive Mitglieder', state.org.members ? ('bis ' + state.org.members) : '–'],
    ['Organisationsform', labels.orgtype[state.org.orgtype] || '–']
  ];
  document.getElementById('ov-organisation').innerHTML = org.map(r => `<div class="ov-row"><span class="lbl">${r[0]}</span><span class="val">${r[1]}</span></div>`).join('');

  let html = '<div class="paket-group-label">Inklusivleistungen</div>';
  const inkl = [
    ['Vereinshaftpflicht', 'enthalten'],
    ['Veranstalterhaftpflicht', 'enthalten'],
    ['Vermögensschadenhaftpflicht', vsAussetzen ? '<span class="tag-suspended">ausgesetzt</span>' : 'enthalten'],
    ['Rechtsberatung', 'enthalten'],
    ['Vorstandsberatung', 'enthalten']
  ];
  if (auto) inkl.splice(3, 0, ['D&O-Versicherung', vsAussetzen ? '<span class="tag-suspended">ausgesetzt</span>' : 'enthalten']);
  html += inkl.map(r => `<div class="ov-row"><span class="lbl">${r[0]}</span><span class="val">${r[1]}</span></div>`).join('');

  html += '<div class="paket-group-label">Optionale Bausteine</div>';
  const opt = [];
  if (!auto) opt.push(['D&O-Versicherung', state.optional.do ? 'enthalten' : '<span class="tag-not-included">nicht enthalten</span>']);
  opt.push(['Rechtsschutz', state.optional.rs ? 'enthalten' : '<span class="tag-not-included">nicht enthalten</span>']);
  opt.push(['Rückwirkende Absicherung', state.optional.rw && !vsAussetzen ? 'enthalten (einmalig)' : '<span class="tag-not-included">nicht enthalten</span>']);
  html += opt.map(r => `<div class="ov-row"><span class="lbl">${r[0]}</span><span class="val">${r[1]}</span></div>`).join('');

  document.getElementById('ov-paket').innerHTML = html;

  const vsLbl = hasDo ? 'Vermögensschaden & D&O' : 'Vermögensschadenhaftpflicht';

  const sz = [];
  sz.push(['Vereins-Schutzbrief', fmt(start)]);
  if (state.modules.hp.mode === 'aussetzen') sz.push(['Haftpflicht & Veranstalter', '<span class="val warn">ausgesetzt</span>']);
  else sz.push(['Haftpflicht & Veranstalter', fmt(state.modules.hp.mode === 'verschieben' ? state.modules.hp.shiftDate : start)]);
  if (vsAussetzen) sz.push([vsLbl, '<span class="val warn">ausgesetzt</span>']);
  else sz.push([vsLbl, fmt(state.modules.vs.mode === 'verschieben' ? state.modules.vs.shiftDate : start)]);
  if (!auto) {
    if (state.optional.do) sz.push(['D&O-Versicherung', fmt(state.modules.vs.mode === 'verschieben' ? state.modules.vs.shiftDate : start)]);
    else sz.push(['D&O-Versicherung', '<span class="val muted">nicht enthalten</span>']);
  }
  if (state.optional.rs) sz.push(['Rechtsschutz', fmt(state.modules.rs.mode === 'verschieben' ? state.modules.rs.shiftDate : start)]);
  else sz.push(['Rechtsschutz', '<span class="val muted">nicht enthalten</span>']);
  if (state.optional.rw && !vsAussetzen) sz.push(['Rückwirkende Absicherung', fmt(state.modules.vs.mode === 'verschieben' ? state.modules.vs.shiftDate : start)]);
  else sz.push(['Rückwirkende Absicherung', '<span class="val muted">nicht enthalten</span>']);

  document.getElementById('ov-startzeit').innerHTML = sz.map(r => {
    if (r[1].includes('<span')) return `<div class="ov-row"><span class="lbl">${r[0]}</span>${r[1]}</div>`;
    return `<div class="ov-row"><span class="lbl">${r[0]}</span><span class="val">${r[1]}</span></div>`;
  }).join('');

  const grund = priceBase();
  const doFull = (!auto && state.optional.do) ? priceDoSurcharge() : 0;
  const rsFull = state.optional.rs ? priceRs() : 0;
  const rwP = (state.optional.rw && !vsAussetzen) ? priceRw() : 0;

  function getProrataFactor(key, startDateStr) {
    const mode = state.modules[key].mode;
    if (mode === 'aussetzen') return 0;
    if (mode === 'default') return 1;
    if (mode === 'verschieben') {
      const shiftDateStr = state.modules[key].shiftDate;
      if (!shiftDateStr) return 1;
      const dStart = new Date(startDateStr);
      const dShift = new Date(shiftDateStr);
      const dEnd = new Date(addMonths(startDateStr, 12));
      const totalMs = dEnd - dStart;
      const activeMs = dEnd - dShift;
      if (totalMs <= 0 || activeMs <= 0) return 0;
      return Math.max(0, Math.min(1, activeMs / totalMs));
    }
    return 1;
  }

  const hpFactor1 = getProrataFactor('hp', start);
  const vsFactor1 = getProrataFactor('vs', start);
  const rsFactor1 = getProrataFactor('rs', start);

  const hpBase = Math.floor(grund * 0.5);
  const vsBase = grund - hpBase;

  const hpYr1 = state.modules.hp.mode === 'aussetzen' ? 0 : Math.round(hpBase * hpFactor1);
  const vsYr1 = state.modules.vs.mode === 'aussetzen' ? 0 : Math.round(vsBase * vsFactor1);
  const doYr1 = Math.round(doFull * vsFactor1); 
  const rsYr1 = Math.round(rsFull * rsFactor1);

  const hpYr2 = state.modules.hp.mode === 'aussetzen' ? 0 : hpBase;
  const vsYr2 = state.modules.vs.mode === 'aussetzen' ? 0 : vsBase;
  const doYr2 = state.modules.vs.mode === 'aussetzen' ? 0 : doFull;
  const rsYr2 = state.modules.rs.mode === 'aussetzen' ? 0 : rsFull;

  const totalYr1 = hpYr1 + vsYr1 + doYr1 + rsYr1;
  const totalYr2 = hpYr2 + vsYr2 + doYr2 + rsYr2;

  let k = '';

  if (totalYr1 === totalYr2 && rwP === 0) {
    k += '<div class="cost-section"><div class="cost-section-title">Jährlicher Beitrag</div>';
    k += `<div class="ov-cost-row"><span>Vereins-Schutzbrief</span><span>${grund} €</span></div>`;
    if (doYr2) k += `<div class="ov-cost-row"><span>D&O-Versicherung</span><span>${doYr2} €</span></div>`;
    if (rsYr2) k += `<div class="ov-cost-row"><span>Rechtsschutz</span><span>${rsYr2} €</span></div>`;
    k += `<div class="ov-cost-row subtotal"><span>Gesamtbeitrag</span><span>${totalYr2} € / Jahr</span></div></div>`;
  } else {
    k += '<div class="cost-section">';
    k += `<div class="ov-cost-row" style="font-weight: 700; color: var(--brand-green); border-bottom: 1px solid var(--border-soft); padding-bottom: 8px; margin-bottom: 12px;">
            <span style="flex: 2;">Gewählte Bausteine</span>
            <span style="flex: 1; text-align: right;">1. Jahr</span>
            <span style="flex: 1; text-align: right;">Ab 2. Jahr</span>
          </div>`;

    k += `<div style="font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-top: 12px; margin-bottom: 6px; border-bottom: 1px dashed var(--border-soft); padding-bottom: 4px;">Vereins-Schutzbrief (Basis-Paket)</div>`;

    let hpTxt1 = '';
    if (state.modules.hp.mode === 'aussetzen') hpTxt1 = '<span style="color:var(--warn-orange);">ausgesetzt</span>';
    else if (state.modules.hp.mode === 'verschieben') hpTxt1 = `${hpYr1} € <span style="font-size:11px; color:var(--text-muted); font-weight:400;">(anteilig)</span>`;
    else hpTxt1 = `${hpYr1} €`;
    const hpTxt2 = hpYr2 > 0 ? `${hpYr2} €` : '<span style="color:var(--warn-orange);">ausgesetzt</span>';
    k += `<div class="ov-cost-row" style="padding-left: 8px;"><span style="flex: 2;">Haftpflicht & Veranstalter</span><span style="flex: 1; text-align: right;">${hpTxt1}</span><span style="flex: 1; text-align: right;">${hpTxt2}</span></div>`;

    let vsTxt1 = '';
    if (state.modules.vs.mode === 'aussetzen') vsTxt1 = '<span style="color:var(--warn-orange);">ausgesetzt</span>';
    else if (state.modules.vs.mode === 'verschieben') vsTxt1 = `${vsYr1 + doYr1} € <span style="font-size:11px; color:var(--text-muted); font-weight:400;">(anteilig)</span>`;
    else vsTxt1 = `${vsYr1 + doYr1} €`;
    const vsTxt2 = (vsYr2 + doYr2) > 0 ? `${vsYr2 + doYr2} €` : '<span style="color:var(--warn-orange);">ausgesetzt</span>';
    k += `<div class="ov-cost-row" style="padding-left: 8px;"><span style="flex: 2;">${vsLbl}</span><span style="flex: 1; text-align: right;">${vsTxt1}</span><span style="flex: 1; text-align: right;">${vsTxt2}</span></div>`;

    if (rsFull > 0) {
      k += `<div style="font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-top: 20px; margin-bottom: 6px; border-bottom: 1px dashed var(--border-soft); padding-bottom: 4px;">Optionale Ergänzungen</div>`;
      
      let rsTxt1 = '';
      if (state.modules.rs.mode === 'verschieben') rsTxt1 = `${rsYr1} € <span style="font-size:11px; color:var(--text-muted); font-weight:400;">(anteilig)</span>`;
      else rsTxt1 = `${rsYr1} €`;
      k += `<div class="ov-cost-row" style="padding-left: 8px;"><span style="flex: 2;">Rechtsschutz</span><span style="flex: 1; text-align: right;">${rsTxt1}</span><span style="flex: 1; text-align: right;">${rsYr2} €</span></div>`;
    }

    k += `<div class="ov-cost-row subtotal" style="margin-top: 16px; padding-top: 8px; border-top: 1px solid var(--border-soft);">
            <span style="flex: 2; font-weight: 700;">Laufender Beitrag (Gesamt)</span>
            <span style="flex: 1; text-align: right; font-weight: 700;">${totalYr1} €</span>
            <span style="flex: 1; text-align: right; font-weight: 700;">${totalYr2} €</span>
          </div>`;
    k += '</div>';

    if (rwP) {
      k += `<div class="cost-section" style="margin-top: 24px; border-top: 1px dashed var(--border-soft); padding-top: 16px;">
              <div class="cost-section-title">Einmalige Kosten</div>
              <div class="ov-cost-row">
                <span>Rückwirkende Absicherung</span>
                <span style="font-weight: 700; font-size: var(--font-size-md); color: var(--text-primary);">${rwP} €</span>
              </div>
            </div>`;
    }
  }

  document.getElementById('ov-kosten').innerHTML = k;
}

document.getElementById('btn-4-back').addEventListener('click', () => scrollTo('step-3'));

// 1. Der "Konfiguration speichern" Code (Sicher verpackt, falls du den Button im HTML mal wieder einbaust)
const saveButton = document.getElementById('btn-4-save');
if (saveButton) {
  saveButton.addEventListener('click', () => {
    document.getElementById('save-email').value = '';
    document.getElementById('save-modal').classList.remove('hidden');
  });
}

function closeSaveModal() { document.getElementById('save-modal').classList.add('hidden'); }
document.getElementById('save-close').addEventListener('click', closeSaveModal);
document.getElementById('save-cancel').addEventListener('click', closeSaveModal);
const saveModalEl = document.getElementById('save-modal');
if (saveModalEl) {
  saveModalEl.addEventListener('click', e => { if (e.target.id === 'save-modal') closeSaveModal(); });
}

const saveSendBtn = document.getElementById('save-send');
if (saveSendBtn) {
  saveSendBtn.addEventListener('click', () => {
    const email = document.getElementById('save-email').value.trim();
    if (!email || !email.includes('@')) {
      alert('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }

    // Hilfsvariablen & Berechnungen
    const autoDo = isDoAuto();
    const vsAussetzen = state.modules.vs.mode === 'aussetzen';
    const hpAussetzen = state.modules.hp.mode === 'aussetzen';
    const start = effectiveStartDate();

    const grund = priceBase();
    const doFull = (!autoDo && state.optional.do) ? priceDoSurcharge() : 0;
    const rsFull = state.optional.rs ? priceRs() : 0;
    const rwP = (state.optional.rw && !vsAussetzen) ? priceRw() : 0;
    const gesamtJahresBeitrag = grund + doFull + rsFull;

    // "Schönes" Plain-Text-Design mit Emojis und Struktur
    let emailText = `Hallo!\n\nVielen Dank für die Nutzung unseres Konfigurators. Hier ist Ihre maßgeschneiderte Übersicht:\n\n`;
    
    emailText += `📋 1. DETAILS ZUR ORGANISATION\n`;
    emailText += `--------------------------------------------------\n`;
    emailText += `   Rechtsform:        ${labels.legal[state.org.legal] || '–'}\n`;
    emailText += `   Haushaltssumme:    ${labels.budget[state.org.budget] || '–'}\n`;
    emailText += `   Aktive Mitglieder: ${state.org.members ? 'bis ' + state.org.members : '–'}\n`;
    emailText += `   Sparte/Bereich:    ${labels.orgtype[state.org.orgtype] || 'Keine Angabe'}\n\n`;

    emailText += `🛡️ 2. IHR GEWÄHLTES SCHUTZPAKET\n`;
    emailText += `--------------------------------------------------\n`;
    emailText += `  [✓] Vereinshaftpflicht\n`;
    emailText += `  [✓] Veranstalterhaftpflicht\n`;
    emailText += `  [${vsAussetzen ? ' ' : '✓'}] Vermögensschadenhaftpflicht ${vsAussetzen ? '(AUSGESETZT)' : ''}\n`;
    emailText += `  [${(autoDo || state.optional.do) ? '✓' : ' '}] Vorstandshaftpflicht (D&O) ${autoDo ? '(Automatisch inklusive)' : ''}\n`;
    emailText += `  [${state.optional.rs ? '✓' : ' '}] Rechtsschutzversicherung\n`;
    emailText += `  [${(state.optional.rw && !vsAussetzen) ? '✓' : ' '}] Rückwirkende Absicherung\n\n`;

    emailText += `📅 3. STARTZEITPUNKTE DER BAUSTEINE\n`;
    emailText += `--------------------------------------------------\n`;
    emailText += `  🏁 Haupt-Startdatum:         ${fmt(start)}\n`;
    emailText += `  • Haftpflicht-Baustein:     ${hpAussetzen ? '❌ Ausgesetzt' : (state.modules.hp.mode === 'verschieben' ? fmt(state.modules.hp.shiftDate) + ' (verschoben)' : fmt(start))}\n`;
    emailText += `  • Vermögensschaden & D&O:   ${vsAussetzen ? '❌ Ausgesetzt' : (state.modules.vs.mode === 'verschieben' ? fmt(state.modules.vs.shiftDate) + ' (verschoben)' : fmt(start))}\n`;
    if (state.optional.rs) {
      emailText += `  • Rechtsschutz:             ${state.modules.rs.mode === 'verschieben' ? fmt(state.modules.rs.shiftDate) + ' (verschoben)' : fmt(start)}\n`;
    }
    emailText += `\n`;

    emailText += `💳 4. PREISÜBERSICHT (Regulär ab 2. Jahr)\n`;
    emailText += `--------------------------------------------------\n`;
    emailText += `  Basis-Schutzbrief:          ${grund} € / Jahr\n`;
    if (doFull > 0) emailText += `  Zusatz D&O-Schutz:          ${doFull} € / Jahr\n`;
    if (rsFull > 0) emailText += `  Zusatz Rechtsschutz:        ${rsFull} € / Jahr\n`;
    emailText += `  ==================================================\n`;
    emailText += `  🔥 LAUFENDER BEITRAG:       ${gesamtJahresBeitrag} € / Jahr\n`;
    if (rwP > 0) {
      emailText += `  ==================================================\n`;
      emailText += `  🎁 Einmalige Kosten (RW):    ${rwP} € (einmalig)\n`;
    }
    emailText += `\n\nSie können Ihren Antrag jederzeit mit diesen Daten bei Ihrem Berater fortsetzen.\n\nMit freundlichen Grüßen\nIhr Vereins-Schutzbrief Team`;

    const subject = encodeURIComponent("Ihre Konfiguration: Vereins-Schutzbrief");
    const body = encodeURIComponent(emailText);

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

    closeSaveModal();
    document.getElementById('save-email-shown').textContent = email;
    document.getElementById('save-success-modal').classList.remove('hidden');
  });
}

function closeSaveSuccess() { document.getElementById('save-success-modal').classList.add('hidden'); }
const successCloseBtn = document.getElementById('save-success-close');
if (successCloseBtn) successCloseBtn.addEventListener('click', closeSaveSuccess);
const successOkBtn = document.getElementById('save-success-ok');
if (successOkBtn) successOkBtn.addEventListener('click', closeSaveSuccess);
const successModalEl = document.getElementById('save-success-modal');
if (successModalEl) {
  successModalEl.addEventListener('click', e => { if (e.target.id === 'save-success-modal') closeSaveSuccess(); });
}

document.getElementById('btn-4').addEventListener('click', () => alert('Demo: hier ginge es weiter zu den Antragsdaten.'));

// ============ STEP REVEAL ============
function revealStep(n) {
  const el = document.getElementById('step-' + n);
  el.classList.remove('hidden-step');
  requestAnimationFrame(() => {
    el.classList.add('visible');
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  });
}

// ============ HELP MODALS ============
// (Die helpModals und openHelpModal Funktionen bleiben wie sie sind)

// ============ PDF EXPORT BAUSTEIN ============
const pdfButton = document.getElementById('btn-pdf-download');
if (pdfButton) {
  pdfButton.addEventListener('click', () => {
    if (typeof html2pdf === 'undefined') {
      alert("Fehler: Die PDF-Bibliothek wurde nicht geladen!");
      return;
    }

    const element = document.createElement('div');
    element.style.padding = '30px';
    element.style.fontFamily = 'Lato, sans-serif';
    element.style.color = '#1a2e1a';

    const orgHTML = document.getElementById('ov-organisation')?.innerHTML || 'Keine Daten vorhanden';
    const paketHTML = document.getElementById('ov-paket')?.innerHTML || 'Keine Daten vorhanden';
    const startzeitHTML = document.getElementById('ov-startzeit')?.innerHTML || 'Keine Daten vorhanden';
    const kostenHTML = document.getElementById('ov-kosten')?.innerHTML || 'Keine Daten vorhanden';

    element.innerHTML = `
      <div style="border-bottom: 2px solid #2f7044; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 20px; font-weight: bold; color: #313231;">Deutsches Ehrenamt</span>
        <span style="font-size: 12px; color: #5a6a5a; text-align: right;">Unverbindliche Übersicht<br>Datum: ${fmt(new Date())}</span>
      </div>
      <h1 style="font-family: Vollkorn, serif; font-size: 26px; color: #2f7044; margin-bottom: 10px;">Ihre Schutzbrief-Konfiguration</h1>
      <p style="font-size: 14px; color: #5a6a5a; margin-bottom: 30px;">Nachfolgend finden Sie die Zusammenfassung Ihrer Eingaben und Berechnungen.</p>
      
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; color: #2f7044; margin-bottom: 10px; border-bottom: 1px solid #e0e6e0; padding-bottom: 5px;">1. Organisation & Paket</h2>
        ${orgHTML}
      </div>

      <div style="margin-bottom: 20px; page-break-inside: avoid;">
        <h2 style="font-size: 16px; color: #2f7044; margin-bottom: 10px; border-bottom: 1px solid #e0e6e0; padding-bottom: 5px;">2. Enthaltene Leistungen</h2>
        ${paketHTML}
      </div>

      <div style="margin-bottom: 20px; page-break-inside: avoid;">
        <h2 style="font-size: 16px; color: #2f7044; margin-bottom: 10px; border-bottom: 1px solid #e0e6e0; padding-bottom: 5px;">3. Startzeitpunkte</h2>
        ${startzeitHTML}
      </div>

      <div style="margin-top: 30px; background: #f5f7f5; padding: 20px; border-radius: 8px; page-break-inside: avoid;">
        <h2 style="font-size: 16px; color: #2f7044; margin-bottom: 15px;">4. Kostenberechnung</h2>
        ${kostenHTML}
      </div>
      
      <p style="font-size: 11px; color: #8a9a8a; margin-top: 20px; line-height: 1.4;">
        Hinweis: Diese Übersicht ist unverbindlich und dient zur Dokumentation Ihrer Online-Berechnung.
      </p>
    `;

    const opt = {
      margin:       15,
      filename:     'Vereins-Schutzbrief_Konfiguration.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  });
}
