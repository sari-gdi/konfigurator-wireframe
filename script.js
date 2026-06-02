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
  return e ? e.base : 0;
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
  const btn = document.getElementById('btn-1');
  if (btn) btn.disabled = !ok;
}

['legal','budget','members','orgtype'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', e => {
      let v = e.target.value;
      if (id === 'budget' || id === 'members') v = v ? parseInt(v,10) : null;
      state.org[id] = v;
      validateS1();
      if (state.unlockedSteps >= 2) renderS2();
      if (state.unlockedSteps >= 3) renderS3();
      if (state.unlockedSteps >= 4) renderS4();
    });
  }
});

const btn1 = document.getElementById('btn-1');
if (btn1) {
  btn1.addEventListener('click', () => {
    state.unlockedSteps = Math.max(state.unlockedSteps, 2);
    renderS2();
    revealStep(2);
  });
}

const safeBindClick = (id, target) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', () => scrollTo(target));
};
safeBindClick('edit-s1', 'step-1');
safeBindClick('edit-s2', 'step-2');
safeBindClick('ov-edit-1', 'step-1');
safeBindClick('ov-edit-2', 'step-2');
safeBindClick('ov-edit-3', 'step-3');

function scrollTo(id) { 
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
}

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
  const cardDo = document.getElementById('card-do-auto');
  const optDo = document.getElementById('opt-do');
  
  if (cardDo) cardDo.classList.toggle('hidden', !auto);
  if (optDo) optDo.style.display = auto ? 'none' : '';
  if (auto) state.optional.do = false;

  const dp = document.getElementById('do-price');
  const rp = document.getElementById('rs-price');
  const rwp = document.getElementById('rw-price');
  
  if (dp) dp.innerHTML = priceDoSurcharge() > 0 ? `€ ${priceDoSurcharge()},– <span class="price-interval">/ Jahr</span>` : '€ – <span class="price-interval">/ Jahr</span>';
  if (rp) rp.innerHTML = priceRs() > 0 ? `€ ${priceRs()},– <span class="price-interval">/ Jahr</span>` : '€ – <span class="price-interval">/ Jahr</span>';
  if (rwp) rwp.innerHTML = priceRw() > 0 ? `€ ${priceRw()},– <span class="price-interval">/ einmalig</span>` : '€ – <span class="price-interval">/ einmalig</span>';

  ['do','rs','rw'].forEach(k => {
    const cb = document.querySelector(`.checkbox[data-key="${k}"]`);
    if (!cb) return;
    const card = cb.closest('.optional-card');
    const lbl = document.querySelector(`[data-action-label="${k}"]`);
    cb.classList.toggle('checked', state.optional[k]);
    if (card) card.classList.toggle('active', state.optional[k]);
    if (lbl) lbl.textContent = state.optional[k] ? 'Hinzugefügt' : 'Hinzufügen';
  });

  const heroBase = priceBase() + (state.optional.do && !auto ? priceDoSurcharge() : 0);
  const hpEl = document.getElementById('hero-price');
  if (hpEl) hpEl.textContent = heroBase.toLocaleString('de-DE');

  const tags = [];
  if (state.org.legal) tags.push(labels.legal[state.org.legal]);
  if (state.org.budget) tags.push(labels.budget[state.org.budget]);
  if (state.org.members) tags.push(labels.members[state.org.members]);
  if (state.org.orgtype) tags.push(labels.orgtype[state.org.orgtype]);
  
  const rt2 = document.getElementById('recap-tags-s2');
  if (rt2) rt2.innerHTML = tags.map(t => `<span class="recap-tag">${t}</span>`).join('');

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

  const br = document.getElementById('beitrag-rows');
  if (br) {
    br.innerHTML = rows.map(r => {
      const isSum = r[0].startsWith('Jahresbeitrag') || r[0] === 'Einmalig';
      return `<div class="beitrag-row${isSum?' summary':''}"><span>${r[0]}</span><span style="display:flex;gap:24px;"><span style="min-width:60px;text-align:right;color:var(--text-muted);">${r[1]}</span><span style="min-width:80px;text-align:right;">${r[2]}</span></span></div>`;
    }).join('');
  }
}

const btn2back = document.getElementById('btn-2-back');
if (btn2back) btn2back.addEventListener('click', () => scrollTo('step-1'));

const btn2 = document.getElementById('btn-2');
if (btn2) {
  btn2.addEventListener('click', () => {
    state.unlockedSteps = Math.max(state.unlockedSteps, 3);
    if (!state.startDate) state.startDate = new Date().toISOString().split('T')[0];
    const sdInput = document.getElementById('start-date');
    if (sdInput) sdInput.value = state.startDate;
    renderS3();
    revealStep(3);
  });
}

// ============ STEP 3 ============
document.querySelectorAll('input[name="start"]').forEach(r => {
  r.addEventListener('change', e => {
    state.startMode = e.target.value;
    const sdw = document.getElementById('start-date-wrap');
    if (sdw) sdw.classList.toggle('hidden', state.startMode !== 'datum');
    renderS3();
  });
});

const sdEl = document.getElementById('start-date');
if (sdEl) {
  sdEl.addEventListener('change', e => {
    state.startDate = e.target.value;
    renderS3();
  });
}

document.querySelectorAll('input[name="defer"]').forEach(r => {
  r.addEventListener('change', e => {
    state.deferOpen = (e.target.value === 'ja');
    const modBox = document.getElementById('modules');
    if (modBox) modBox.classList.toggle('hidden', !state.deferOpen);
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

  const vst = document.getElementById('vs-title');
  if (vst) {
    vst.innerHTML = hasDo
      ? 'Vermögensschadenhaftpflicht- & D&O-Versicherung <span class="help-icon" data-help="vs">i</span>'
      : 'Vermögensschadenhaftpflichtversicherung <span class="help-icon" data-help="vs">i</span>';
  }

  ['hp','vs','do','rs'].forEach(k => {
    const el = document.getElementById(k + '-default-date');
    if (el) el.textContent = fmt(start);
  });
  
  const vsDate = state.modules.vs.mode === 'verschieben' ? state.modules.vs.shiftDate : start;
  const rwd = document.getElementById('rw-date');
  if (rwd) rwd.textContent = fmt(vsDate);

  ['hp','vs','do','rs'].forEach(k => {
    const wrap = document.querySelector(`[data-shift="${k}"]`);
    if (!wrap) return;
    wrap.classList.toggle('hidden', state.modules[k].mode !== 'verschieben');
    const inp = wrap.querySelector('input[type="date"]');
    if (start && inp) { inp.min = start; inp.max = addMonths(start, 12); }
  });

  const hpDev = state.modules.hp.mode !== 'default';
  const vsDev = state.modules.vs.mode !== 'default';
  document.querySelectorAll('input[name="hp"]').forEach(r => {
    if (r.value !== 'default') {
      r.disabled = vsDev;
      if (r.parentElement) r.parentElement.classList.toggle('disabled', vsDev);
    }
  });
  document.querySelectorAll('input[name="vs"]').forEach(r => {
    if (r.value !== 'default') {
      r.disabled = hpDev;
      if (r.parentElement) r.parentElement.classList.toggle('disabled', hpDev);
    }
  });

  const vsAussetzen = state.modules.vs.mode === 'aussetzen';
  const vsw = document.getElementById('vs-warn');
  if (vsw) vsw.classList.toggle('hidden', !(vsAussetzen && state.optional.rw));

  const tags = ['Vereins-Schutzbrief'];
  if (!auto && state.optional.do) tags.push('D&O');
  if (state.optional.rs) tags.push('Rechtsschutz');
  if (state.optional.rw) tags.push('Rückwirkende Absicherung');
  
  const rt3 = document.getElementById('recap-tags-s3');
  if (rt3) rt3.innerHTML = tags.map(t => `<span class="recap-tag">${t}</span>`).join('');

  const mRs = document.getElementById('mod-rs');
  const mDo = document.getElementById('mod-do');
  const mRw = document.getElementById('mod-rw');
  const rwi = document.getElementById('rw-info');
  const rww = document.getElementById('rw-warn');
  
  if (mRs) mRs.classList.toggle('hidden', !state.optional.rs);
  if (mDo) mDo.classList.add('hidden');
  if (mRw) mRw.classList.toggle('hidden', !state.optional.rw);
  if (rwi) rwi.style.display = vsAussetzen ? 'none' : '';
  if (rww) rww.classList.toggle('hidden', !vsAussetzen);

  const zus = [];
  zus.push(['Vereins-Schutzbrief', fmt(start)]);
  if (state.modules.hp.mode === 'aussetzen') zus.push(['Haftpflicht & Veranstalter', '<span class="val warn">ausgesetzt</span>']);
  else zus.push(['Haftpflicht & Veranstalter', fmt(state.modules.hp.mode === 'verschieben' ? state.modules.hp.shiftDate : start)]);
  
  const vsLbl = hasDo ? 'Vermögensschaden & D&O' : 'Vermögensschadenhaftpflicht';
  if (vsAussetzen) zus.push([vsLbl, '<span class="val warn">ausgesetzt</span>']);
  else zus.push([vsLbl, fmt(state.modules.vs.mode === 'verschieben' ? state.modules.vs.shiftDate : start)]);
  
  if (!auto && !state.optional.do) zus.push(['D&O-Versicherung', '<span class="val muted">nicht enthalten</span>']);
  if (state.optional.rs) zus.push(['Rechtsschutz', fmt(state.modules.rs.mode === 'verschieben' ? state.modules.rs.shiftDate : start)]);
  else zus.push(['Rechtsschutz', '<span class="val muted">nicht enthalten</span>']);
  
  if (state.optional.rw) {
    if (vsAussetzen) zus.push(['Rückwirkende Absicherung', '<span class="val warn">ausgesetzt</span>']);
    else zus.push(['Rückwirkende Absicherung', fmt(vsDate)]);
  } else zus.push(['Rückwirkende Absicherung', '<span class="val muted">nicht enthalten</span>']);

  const zr = document.getElementById('zus-rows');
  if (zr) {
    zr.innerHTML = zus.map(r => {
      if (r[1].includes('<span')) return `<div class="zus-row"><span class="lbl">${r[0]}</span>${r[1]}</div>`;
      return `<div class="zus-row"><span class="lbl">${r[0]}</span><span class="val">${r[1]}</span></div>`;
    }).join('');
  }
}

const btn3back = document.getElementById('btn-3-back');
if (btn3back) btn3back.addEventListener('click', () => scrollTo('step-2'));

const btn3 = document.getElementById('btn-3');
if (btn3) {
  btn3.addEventListener('click', () => {
    if (state.modules.vs.mode === 'aussetzen' && state.optional.rw) {
      openModal();
      return;
    }
    proceedToStep4();
  });
}

function proceedToStep4() {
  state.unlockedSteps = Math.max(state.unlockedSteps, 4);
  renderS4();
  revealStep(4);
}

// ============ MODAL (RÜCKWIRKENDE ENTFERNEN) ============
function openModal() { 
  const el = document.getElementById('modal-rw-removal');
  if (el) el.classList.remove('hidden'); 
}
function closeModal() { 
  const el = document.getElementById('modal-rw-removal');
  if (el) el.classList.add('hidden'); 
}
const mcBtn = document.getElementById('modal-cancel');
if (mcBtn) mcBtn.addEventListener('click', closeModal);

const mcfBtn = document.getElementById('modal-confirm');
if (mcfBtn) {
  mcfBtn.addEventListener('click', () => {
    state.optional.rw = false;
    renderS2();
    renderS3();
    closeModal();
    proceedToStep4();
  });
}
const mrwEl = document.getElementById('modal-rw-removal');
if (mrwEl) mrwEl.addEventListener('click', e => { if (e.target.id === 'modal-rw-removal') closeModal(); });

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
  const ovo = document.getElementById('ov-organisation');
  if (ovo) ovo.innerHTML = org.map(r => `<div class="ov-row"><span class="lbl">${r[0]}</span><span class="val">${r[1]}</span></div>`).join('');

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

  const ovp = document.getElementById('ov-paket');
  if (ovp) ovp.innerHTML = html;

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

  const ovs = document.getElementById('ov-startzeit');
  if (ovs) {
    ovs.innerHTML = sz.map(r => {
      if (r[1].includes('<span')) return `<div class="ov-row"><span class="lbl">${r[0]}</span>${r[1]}</div>`;
      return `<div class="ov-row"><span class="lbl">${r[0]}</span><span class="val">${r[1]}</span></div>`;
    }).join('');
  }

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
  const ovk = document.getElementById('ov-kosten');
  if (ovk) ovk.innerHTML = k;
}

const btn4back = document.getElementById('btn-4-back');
if (btn4back) btn4back.addEventListener('click', () => scrollTo('step-3'));

const btn4 = document.getElementById('btn-4');
if (btn4) btn4.addEventListener('click', () => alert('Demo: hier ginge es weiter zu den Antragsdaten.'));

// ============ E-MAIL SPEICHER-MODAL LOGIK (SICHER VERPACKT) ============
const saveButton = document.getElementById('btn-4-save');
if (saveButton) {
  saveButton.addEventListener('click', () => {
    document.getElementById('save-email').value = '';
    document.getElementById('save-modal').classList.remove('hidden');
  });
}

function closeSaveModal() { 
  const el = document.getElementById('save-modal');
  if (el) el.classList.add('hidden'); 
}
const saveCloseBtn = document.getElementById('save-close');
if (saveCloseBtn) saveCloseBtn.addEventListener('click', closeSaveModal);
const saveCancelBtn = document.getElementById('save-cancel');
if (saveCancelBtn) saveCancelBtn.addEventListener('click', closeSaveModal);

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

    const autoDo = isDoAuto();
    const vsAussetzen = state.modules.vs.mode === 'aussetzen';
    const hpAussetzen = state.modules.hp.mode === 'aussetzen';
    const start = effectiveStartDate();

    const grund = priceBase();
    const doFull = (!autoDo && state.optional.do) ? priceDoSurcharge() : 0;
    const rsFull = state.optional.rs ? priceRs() : 0;
    const rwP = (state.optional.rw && !vsAussetzen) ? priceRw() : 0;
    const gesamtJahresBeitrag = grund + doFull + rsFull;

    let emailText = `Hallo!\n\nVielen Dank für die Nutzung unseres Konfigurators. Hier ist Ihre maßgeschneiderte Übersicht:\n\n`;
    emailText += `📋 1. DETAILS ZUR ORGANISATION\n-----------------------------------\n`;
    emailText += `   Rechtsform:        ${labels.legal[state.org.legal] || '–'}\n`;
    emailText += `   Haushaltssumme:    ${labels.budget[state.org.budget] || '–'}\n`;
    emailText += `   Aktive Mitglieder: ${state.org.members ? 'bis ' + state.org.members : '–'}\n\n`;
    
    const subject = encodeURIComponent("Ihre Konfiguration: Vereins-Schutzbrief");
    const body = encodeURIComponent(emailText);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

    closeSaveModal();
    document.getElementById('save-email-shown').textContent = email;
    document.getElementById('save-success-modal').classList.remove('hidden');
  });
}

function closeSaveSuccess() { 
  const el = document.getElementById('save-success-modal');
  if (el) el.classList.add('hidden'); 
}
const successCloseBtn = document.getElementById('save-success-close');
if (successCloseBtn) successCloseBtn.addEventListener('click', closeSaveSuccess);
const successOkBtn = document.getElementById('save-success-ok');
if (successOkBtn) successOkBtn.addEventListener('click', closeSaveSuccess);

// ============ HILFE MODALS SYSTEM & DESIGN ============
const helpModals = {
  legal: { title: 'Rechtsform Ihres Vereins', intro: 'Die rechtliche Organisationsform Ihrer Einrichtung bestimmt teils den Versicherungsumfang. Wählen Sie die Form, unter der Ihr Verein eingetragen ist.' },
  budget: {
    title: 'Haushaltssumme',
    intro: 'Die Summe aller jährlichen Einnahmen Ihres Vereins (Mitgliedsbeiträge, Spenden, Förderungen, Veranstaltungseinnahmen).',
    sections: [{ head: 'Warum ist das wichtig?', items: ['Bestimmt den Beitrag für den Vereins-Schutzbrief', 'Ab 200.000 € ist die D&O-Versicherung automatisch enthalten'] }]
  },
  members: { title: 'Aktive Mitglieder', intro: 'Die Anzahl der Personen, die aktiv im Verein mitwirken.' },
  orgtype: { title: 'Organisationsform', intro: 'Die thematische Ausrichtung Ihres Vereins.' },
  vereinshaftpflicht: { title: 'Vereinshaftpflicht', intro: 'Die Vereinshaftpflicht ist das absolute Muss für jeden Verein – vergleichbar mit der Betriebshaftpflicht bei Unternehmen.' },
  veranstalterhaftpflicht: { title: 'Veranstalterhaftpflicht', intro: 'Zusätzlicher Schutz für Vereinsveranstaltungen wie Feste, Turniere oder Ausflüge.' },
  vermoegen: { title: 'Vermögensschadenhaftpflicht', intro: 'Sichert finanzielle Schäden ab, die durch Fehler oder Versäumnisse im Vereinsbetrieb entstehen.' },
  do: { title: 'D&O-Versicherung (Vorstandshaftpflicht)', intro: 'Schützt Vorstände persönlich vor Haftungsansprüchen aus ihrer ehrenamtlichen Tätigkeit.' },
  rechtsberatung: { title: 'Rechtsberatung', intro: 'Anwaltliche Beratung zu Vereins- und Steuerrecht durch Fachanwälte.' },
  vorstandsberatung: { title: 'Vorstandsberatung', intro: 'Praxisnahe Unterstützung bei Organisations- und Finanzfragen im Vereinsalltag.' },
  rs: { title: 'Rechtsschutzversicherung', intro: 'Übernimmt Kosten für anwaltliche und gerichtliche Auseinandersetzungen.' },
  rw: { title: 'Rückwirkende Absicherung', intro: 'Deckt Vermögensschäden aus der Vergangenheit ab – bis zu 3 Jahre rückwirkend.' },
  start: { title: 'Startdatum Ihres Vereins-Schutzbriefs', intro: 'Das Datum, an dem Ihr Schutz beginnen soll.' },
  defer: { title: 'Bausteine verschieben oder aussetzen', intro: 'Falls Sie für einen einzelnen Baustein bereits eine bestehende Versicherung haben.' },
  hp: { title: 'Haftpflicht & Veranstalterhaftpflicht', intro: 'Pflichtbaustein: Haftpflicht-Schutz für den Verein und seine Veranstaltungen.' },
  vs: { title: 'Vermögensschadenhaftpflicht', intro: 'Pflichtbaustein: Schutz vor finanziellen Schäden durch Fehler im Vereinsbetrieb.' },
  aussetzen: { title: 'Baustein permanent aussetzen', intro: 'Wenn Sie bereits eine bestehende Versicherung für einen Pflichtbaustein haben.' }
};

function openHelpModal(key) {
  const data = helpModals[key];
  if (!data) return;
  let html = `<h2>${data.title}</h2>`;
  if (data.intro) html += `<p>${data.intro}</p>`;
  if (data.sections) {
    data.sections.forEach(s => {
      html += `<h3>${s.head}</h3><ul>${s.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    });
  }
  const hc = document.getElementById('help-content');
  const hm = document.getElementById('help-modal');
  if (hc && hm) {
    hc.innerHTML = html;
    hm.classList.remove('hidden');
  }
}

function closeHelpModal() { 
  const el = document.getElementById('help-modal');
  if (el) el.classList.add('hidden'); 
}
const hcb = document.getElementById('help-close');
if (hcb) hcb.addEventListener('click', closeHelpModal);
const hmEl = document.getElementById('help-modal');
if (hmEl) hmEl.addEventListener('click', e => { if (e.target.id === 'help-modal') closeHelpModal(); });

// Globaler Klick-Delegator für Hilfe-Icons
document.addEventListener('click', e => {
  const helpBtn = e.target.closest('.help-icon');
  if (helpBtn) {
    e.stopPropagation();
    openHelpModal(helpBtn.dataset.help);
  }
});

// ============ LIVE-VORSCHAU PDF EXPORT (GARANTIERT SICHTBAR & GEFÜLLT) ============
const pdfButton = document.getElementById('btn-pdf-download');
if (pdfButton) {
  pdfButton.addEventListener('click', () => {
    if (typeof html2pdf === 'undefined') {
      alert("Fehler: Die PDF-Bibliothek wurde nicht geladen!");
      return;
    }

    // 1. Daten berechnen
    const autoDo = isDoAuto();
    const vsAussetzen = state.modules.vs.mode === 'aussetzen';
    const hpAussetzen = state.modules.hp.mode === 'aussetzen';
    const start = effectiveStartDate();

    const grund = priceBase();
    const doFull = (!autoDo && state.optional.do) ? priceDoSurcharge() : 0;
    const rsFull = state.optional.rs ? priceRs() : 0;
    const rwP = (state.optional.rw && !vsAussetzen) ? priceRw() : 0;
    const gesamtJahresBeitrag = grund + doFull + rsFull;

    // 2. Die Vorschau-Box aufbauen
    const previewContainer = document.createElement('div');
    previewContainer.style.position = 'fixed';
    previewContainer.style.top = '0';
    previewContainer.style.left = '0';
    previewContainer.style.width = '100%';
    previewContainer.style.height = '100%';
    previewContainer.style.backgroundColor = 'rgba(255,255,255,0.98)';
    previewContainer.style.zIndex = '999999';
    previewContainer.style.overflowY = 'auto';
    previewContainer.style.padding = '40px 20px';
    previewContainer.style.boxSizing = 'border-box';

    const documentContent = document.createElement('div');
    documentContent.style.maxWidth = '700px';
    documentContent.style.margin = '0 auto';
    documentContent.style.backgroundColor = '#ffffff';
    documentContent.style.padding = '20px';
    documentContent.style.color = '#1a2e1a';
    documentContent.style.fontFamily = 'Arial, sans-serif';

    documentContent.innerHTML = `
      <div style="border-bottom: 3px solid #2f7044; padding-bottom: 15px; margin-bottom: 25px;">
        <div style="float: left;"><span style="font-size: 22px; font-weight: bold; color: #2f7044;">Deutsches Ehrenamt</span></div>
        <div style="float: right; text-align: right; font-size: 11px; color: #5a6a5a;">
          <strong>Unverbindliche Übersicht</strong><br>Datum: ${fmt(new Date())}
        </div>
        <div style="clear: both;"></div>
      </div>

      <h1 style="font-size: 22px; margin-bottom: 8px;">Ihre Schutzbrief-Konfiguration</h1>
      <p style="font-size: 13px; color: #5a6a5a; margin-bottom: 25px;">Nachfolgend finden Sie alle berechneten Bausteine im Detail.</p>
      
      <h3 style="color: #2f7044; border-bottom: 2px solid #e0e6e0; padding-bottom: 4px;">1. Details zur Organisation</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; color: #5a6a5a;">Rechtsform:</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; font-weight: bold;">${labels.legal[state.org.legal] || '–'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; color: #5a6a5a;">Haushaltssumme:</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; font-weight: bold;">${labels.budget[state.org.budget] || '–'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; color: #5a6a5a;">Aktive Mitglieder:</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; font-weight: bold;">${state.org.members ? 'bis ' + state.org.members : '–'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; color: #5a6a5a;">Sparte / Bereich:</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; font-weight: bold;">${labels.orgtype[state.org.orgtype] || 'Keine Angabe'}</td></tr>
      </table>

      <h3 style="color: #2f7044; border-bottom: 2px solid #e0e6e0; padding-bottom: 4px; margin-top: 20px;">2. Ihr Versicherungsschutz</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
        <tr style="background-color: #f5f7f5; font-weight: bold;">
          <td style="padding: 6px 8px;">Versicherungsbaustein</td><td style="padding: 6px 8px;">Status</td><td style="padding: 6px 8px;">Startdatum</td>
        </tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; font-weight: bold;">Vereinshaftpflicht</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; color: #2f7044; font-weight: bold;">Enthalten</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0;">${hpAussetzen ? 'Ausgesetzt' : (state.modules.hp.mode === 'verschieben' ? fmt(state.modules.hp.shiftDate) : fmt(start))}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; font-weight: bold;">Veranstalterhaftpflicht</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; color: #2f7044; font-weight: bold;">Enthalten</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0;">${hpAussetzen ? 'Ausgesetzt' : (state.modules.hp.mode === 'verschieben' ? fmt(state.modules.hp.shiftDate) : fmt(start))}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; font-weight: bold;">Vermögensschadenhaftpflicht</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; color: ${vsAussetzen ? '#b85c00' : '#2f7044'}; font-weight: bold;">${vsAussetzen ? 'Ausgesetzt' : 'Enthalten'}</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0;">${vsAussetzen ? '–' : (state.modules.vs.mode === 'verschieben' ? fmt(state.modules.vs.shiftDate) : fmt(start))}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; font-weight: bold;">Vorstandshaftpflicht (D&amp;O)</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0;">${autoDo ? 'Inklusive' : (state.optional.do ? 'Hinzugefügt' : 'Nicht enthalten')}</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0;">${(autoDo || state.optional.do) ? (vsAussetzen ? 'Ausgesetzt' : fmt(start)) : '–'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; font-weight: bold;">Rechtsschutzversicherung</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0;">${state.optional.rs ? 'Hinzugefügt' : 'Nicht enthalten'}</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0;">${state.optional.rs ? fmt(start) : '–'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e6e0; font-weight: bold;">Rückwirkende Absicherung</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0;">${state.optional.rw && !vsAussetzen ? 'Hinzugefügt' : 'Nicht enthalten'}</td><td style="padding: 8px; border-bottom: 1px solid #e0e6e0;">${state.optional.rw && !vsAussetzen ? 'Einmalig' : '–'}</td></tr>
      </table>

      <h3 style="color: #2f7044; border-bottom: 2px solid #e0e6e0; padding-bottom: 4px; margin-top: 20px;">3. Kostenberechnung</h3>
      <div style="background-color: #f5f7f5; border: 1px solid #e0e6e0; padding: 15px; font-size: 12px; border-radius: 4px;">
        <table style="width: 100%;">
          <tr><td>Basis Vereins-Schutzbrief:</td><td style="text-align: right; font-weight: bold;">${grund},00 € / Jahr</td></tr>
          ${doFull > 0 ? `<tr><td>Vorstandshaftpflicht (D&amp;O):</td><td style="text-align: right; font-weight: bold;">${doFull},00 € / Jahr</td></tr>` : ''}
          ${rsFull > 0 ? `<tr><td>Zusatz Rechtsschutz:</td><td style="text-align: right; font-weight: bold;">${rsFull},00 € / Jahr</td></tr>` : ''}
          ${rwP > 0 ? `<tr><td style="color: #b85c00;">Rückwirkende Absicherung:</td><td style="text-align: right; font-weight: bold; color: #b85c00;">${rwP},00 € (einmalig)</td></tr>` : ''}
          <tr style="border-top: 2px solid #2f7044; font-size: 14px; font-weight: bold; color: #2f7044;">
            <td style="padding-top: 8px;">Laufender Jahresbeitrag:</td><td style="padding-top: 8px; text-align: right;">${gesamtJahresBeitrag},00 € / Jahr</td>
          </tr>
        </table>
      </div>
    `;

    previewContainer.appendChild(documentContent);
    document.body.appendChild(previewContainer);

    // 3. PDF erstellen
    const opt = {
      margin:       15,
      filename:     'Vereins-Schutzbrief_Konfiguration.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(documentContent).save().then(() => {
      // Wenn fertig, Vorschau rückstandslos entfernen
      document.body.removeChild(previewContainer);
    }).catch(err => {
      console.error(err);
      document.body.removeChild(previewContainer);
    });
  });
}

validateS1();
