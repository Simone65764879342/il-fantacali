const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const startScreen = $('#startScreen');
const introScreen = $('#introScreen');
const hubScreen = $('#hubScreen');
const sectionScreen = $('#sectionScreen');
const enterButton = $('#enterButton');
const backButton = $('#backButton');
const sectionEyebrow = $('#sectionEyebrow');
const sectionTitle = $('#sectionTitle');
const sectionSubtitle = $('#sectionSubtitle');
const sectionContent = $('#sectionContent');
const walkoutOverlay = $('#walkoutOverlay');
const walkoutClose = $('#walkoutClose');
const flash = $('#flash');
const confettiLayer = $('#confettiLayer');
const teams = FANTACALI_DATA.teams;

const roleNames = { P: 'Portieri', D: 'Difensori', C: 'Centrocampisti', A: 'Attaccanti' };
let currentSection = null;
let introRunning = false;

function showOnly(screen) {
  [startScreen, introScreen, hubScreen, sectionScreen].forEach(s => s.classList.toggle('is-active', s === screen));
}

async function playIntro() {
  if (introRunning) return;
  introRunning = true;
  showOnly(introScreen);
  introScreen.classList.remove('animate');
  void introScreen.offsetWidth;
  introScreen.classList.add('animate');
  await sleep(3150);
  showOnly(hubScreen);
  introScreen.classList.remove('animate');
  introRunning = false;
}

enterButton.addEventListener('click', playIntro);

function teamTotal(team) {
  return Object.values(team.roster).flat().reduce((sum, p) => sum + p.price, 0);
}

function roleTotal(team, role) {
  return team.roster[role].reduce((sum, p) => sum + p.price, 0);
}

function esc(text) {
  return String(text).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function setSection(kicker, title, subtitle) {
  sectionEyebrow.textContent = kicker;
  sectionTitle.textContent = title;
  sectionSubtitle.textContent = subtitle;
  sectionContent.innerHTML = '';
  showOnly(sectionScreen);
  sectionScreen.scrollTop = 0;
}

function renderTeamGrid(mode) {
  const grid = document.createElement('div');
  grid.className = 'team-grid';
  teams.forEach((team, index) => {
    const button = document.createElement('button');
    button.className = `team-card ${mode === 'walkout' ? 'team-card--walkout' : ''}`;
    button.style.setProperty('--team-accent', team.accent);
    if (mode === 'walkout') {
      button.innerHTML = `
        <span class="team-number">SQUADRA ${String(index + 1).padStart(2, '0')}</span>
        <div class="team-name">${esc(team.name)}</div>
        <div class="team-owner">${esc(team.owner)}</div>
        <div class="team-extra"><span>Premi per scoprire</span><strong>WALKOUT →</strong></div>`;
      button.addEventListener('click', () => openWalkout(team));
    } else {
      button.innerHTML = `
        <span class="team-number">SQUADRA ${String(index + 1).padStart(2, '0')}</span>
        <div class="team-name">${esc(team.name)}</div>
        <div class="team-owner">${esc(team.owner)}</div>
        <div class="team-extra"><span>25 giocatori</span><strong>${teamTotal(team)} cr</strong></div>`;
      button.addEventListener('click', () => renderRoster(team));
    }
    grid.appendChild(button);
  });
  sectionContent.replaceChildren(grid);
}

function renderRoster(team) {
  const wrap = document.createElement('div');
  wrap.className = 'roster-view';
  const departments = Object.keys(roleNames).map(role => `
    <section class="department">
      <div class="department-title"><strong>${roleNames[role]}</strong><span>${roleTotal(team, role)} crediti</span></div>
      <div class="player-list">
        ${team.roster[role].map(p => `<div class="player-row"><span>${esc(p.name)}</span><span class="credits"><strong>${p.price}</strong> cr</span></div>`).join('')}
      </div>
    </section>`).join('');
  wrap.innerHTML = `
    <button class="sub-back">← Tutte le squadre</button>
    <div class="roster-head">
      <div><p class="eyebrow">ROSA COMPLETA</p><h3>${esc(team.name)}</h3><p>${esc(team.owner)} · 25 giocatori</p></div>
      <div class="roster-total"><strong>${teamTotal(team)}</strong><span>crediti spesi</span></div>
    </div>
    <div class="departments">${departments}</div>`;
  $('.sub-back', wrap).addEventListener('click', () => renderTeamGrid('roster'));
  sectionContent.replaceChildren(wrap);
  sectionScreen.scrollTop = 0;
}

function getAllPlayers() {
  return teams.flatMap(team => Object.entries(team.roster).flatMap(([role, players]) =>
    players.map(player => ({...player, role, team: team.name, owner: team.owner}))
  ));
}

function highestPlayer(role = null) {
  const list = role ? getAllPlayers().filter(p => p.role === role) : getAllPlayers();
  return list.reduce((best, p) => !best || p.price > best.price ? p : best, null);
}

function highestTeamByRole(role) {
  return teams.map(team => ({team, value: roleTotal(team, role)})).sort((a,b) => b.value-a.value)[0];
}

function lowestTeamByRole(role) {
  return teams.map(team => ({team, value: roleTotal(team, role)})).sort((a,b) => a.value-b.value)[0];
}

function recordCard(label, value, detail, number = '') {
  return `<article class="record-card"><div class="record-label">${esc(label)}</div><div class="record-value">${esc(value)}</div><div class="record-detail">${esc(detail)}</div>${number ? `<div class="record-number">${esc(number)}</div>` : ''}</article>`;
}

function renderRecords() {
  const allTop = highestPlayer();
  const topRoster = [...teams].sort((a,b) => teamTotal(b)-teamTotal(a))[0];
  const topP = highestPlayer('P');
  const topD = highestPlayer('D');
  const topC = highestPlayer('C');
  const topA = highestPlayer('A');
  const pDept = highestTeamByRole('P');
  const dDept = highestTeamByRole('D');
  const cDept = highestTeamByRole('C');
  const aDept = highestTeamByRole('A');
  const cheapDefense = lowestTeamByRole('D');
  const leastTop = [...teams].sort((a,b) => a.walkout.price-b.walkout.price)[0];
  const malenTeam = teams.find(t => t.name === 'Los Pecialone');
  const malenShare = Math.round(malenTeam.walkout.price / teamTotal(malenTeam) * 100);
  const spending = [...teams].sort((a,b) => teamTotal(b)-teamTotal(a));

  sectionContent.innerHTML = `
    <div class="record-hero">
      <article class="record-card record-card--gold">
        <div class="record-label">RE DELL’ASTA</div>
        <div class="record-value">${esc(allTop.name)} · ${allTop.price}</div>
        <div class="record-detail">${esc(allTop.team)} — il giocatore più pagato dell’intera asta.</div>
        <div class="record-number">#1</div>
      </article>
      <article class="record-card">
        <div class="record-label">ROSA PIÙ COSTOSA</div>
        <div class="record-value">${teamTotal(topRoster)} cr</div>
        <div class="record-detail">${esc(topRoster.name)} · ${esc(topRoster.owner)}</div>
        <div class="record-number">€</div>
      </article>
    </div>
    <div class="records-grid">
      ${recordCard('Portiere più pagato', `${topP.name} · ${topP.price}`, topP.team, 'P')}
      ${recordCard('Difensore più pagato', `${topD.name} · ${topD.price}`, topD.team, 'D')}
      ${recordCard('Centrocampista più pagato', `${topC.name} · ${topC.price}`, topC.team, 'C')}
      ${recordCard('Attaccante più pagato', `${topA.name} · ${topA.price}`, topA.team, 'A')}
      ${recordCard('Portieri più costosi', `${pDept.team.name} · ${pDept.value}`, `${pDept.team.owner} ha investito più di tutti tra i pali.`, '58')}
      ${recordCard('Difesa più costosa', `${dDept.team.name} · ${dDept.value}`, 'Il reparto difensivo più caro della lega.', '141')}
      ${recordCard('Centrocampo Galácticos', `${cDept.team.name} · ${cDept.value}`, 'Il centrocampo più costoso dell’asta.', '243')}
      ${recordCard('Attacco più costoso', `${aDept.team.name} · ${aDept.value}`, 'Nessuno ha investito di più davanti.', '320')}
      ${recordCard('La difesa? Un dettaglio', `${cheapDefense.team.name} · ${cheapDefense.value}`, 'Otto difensori, spesa minima assoluta.', '21')}
      ${recordCard('All-in', `Malen · ${malenTeam.walkout.price}`, `${malenShare}% dell’intera spesa dei Los Pecialone in un solo giocatore.`, `${malenShare}%`)}
      ${recordCard('Il più democratico', `${leastTop.name} · ${leastTop.walkout.price}`, 'È la squadra con il proprio acquisto più caro meno costoso.', '52')}
      ${recordCard('Attacco in saldo', 'AFS Soreta · 50', 'Tutti e 6 gli attaccanti costano meno di Wesley da solo (55).', '50')}
    </div>
    <div class="spending-table">
      <div class="spending-head"><span>#</span><span>Spesa totale rosa</span><span>Crediti</span></div>
      ${spending.map((team,i) => `<div class="spending-row"><span class="spending-rank">${i+1}</span><span class="spending-name">${esc(team.name)} <small style="color:#8f97a2;font-weight:500">· ${esc(team.owner)}</small></span><span class="spending-value">${teamTotal(team)}</span></div>`).join('')}
    </div>`;
}

function renderCalendar() {
  sectionContent.innerHTML = `
    <div class="calendar-placeholder">
      <div class="calendar-card">
        <div class="calendar-icon">▦</div>
        <p class="eyebrow">PROSSIMAMENTE</p>
        <h3>Calendario in arrivo.</h3>
        <p>La sezione è già pronta. Appena avremo il numero di giornate e i quattro scontri di ogni turno, qui comparirà l’elenco completo: tocchi una giornata e si aprono le quattro partite.</p>
        <div class="calendar-note">Il calendario potrà essere aggiornato in seguito senza modificare il QR code.</div>
      </div>
    </div>`;
}

function confetti(amount = 70) {
  const colors = ['#159447','#ffffff','#d72c32','#f2b94b'];
  for (let i=0; i<amount; i++) {
    const p = document.createElement('i');
    p.className = 'particle';
    p.style.left = `${Math.random()*100}vw`;
    p.style.background = colors[i % colors.length];
    p.style.opacity = String(.72 + Math.random()*.28);
    p.style.setProperty('--drift', `${(Math.random()-.5)*190}px`);
    p.style.animationDuration = `${3.1 + Math.random()*2.7}s`;
    p.style.animationDelay = `${Math.random()*.45}s`;
    confettiLayer.appendChild(p);
    setTimeout(() => p.remove(), 6800);
  }
}

function renderFinale() {
  sectionContent.innerHTML = `
    <div class="finale-wrap">
      <img src="fantacali.png" alt="Il Fantacali — Che vinca il migliore. Speriamo di beccarci pure il prossimo anno." />
      <div class="finale-caption">Che vinca il migliore · e speriamo di beccarci pure il prossimo anno.</div>
    </div>`;
  confetti(90);
}

function openSection(section) {
  currentSection = section;
  if (section === 'calendar') {
    setSection('PARTITE', 'Calendario completo', 'Tutte le giornate e i quattro scontri di ogni turno.');
    renderCalendar();
  } else if (section === 'walkouts') {
    setSection('ASTA', 'Migliori Acquisti', 'Scegli una squadra. Il resto te lo racconta il walkout.');
    renderTeamGrid('walkout');
  } else if (section === 'rosters') {
    setSection('SQUADRE', 'Le Rose', '25 giocatori per squadra, con prezzo d’asta e spesa per reparto.');
    renderTeamGrid('roster');
  } else if (section === 'records') {
    setSection('NUMERI', 'Record dell’Asta', 'I primati, gli all-in e le strategie più folli dell’asta.');
    renderRecords();
  } else if (section === 'finale') {
    setSection('SI PARTE', 'Il Fischio d’Inizio', 'L’asta è finita. Da qui in poi parla il campo.');
    renderFinale();
  }
}

$$('.menu-card').forEach(card => card.addEventListener('click', () => openSection(card.dataset.section)));
backButton.addEventListener('click', () => {
  currentSection = null;
  showOnly(hubScreen);
  hubScreen.scrollTop = 0;
});

function sparkleBurst() {
  const holder = $('#walkoutSparks');
  holder.innerHTML = '';
  for (let i=0; i<50; i++) {
    const s = document.createElement('i');
    s.className = 'walkout-spark';
    s.style.left = `${42 + Math.random()*16}%`;
    s.style.setProperty('--sx', `${(Math.random()-.5)*520}px`);
    s.style.setProperty('--sy', `${-(150+Math.random()*480)}px`);
    s.style.animationDelay = `${1.45 + Math.random()*.65}s`;
    holder.appendChild(s);
  }
  setTimeout(() => holder.innerHTML = '', 3600);
}

function openWalkout(team) {
  $('#walkoutFlag').textContent = team.walkout.flag;
  $('#walkoutRole').textContent = team.walkout.role === 'C' ? 'CENTROCAMPISTA' : 'ATTACCANTE';
  $('#walkoutName').textContent = team.walkout.player;
  $('#walkoutTeam').textContent = team.name;
  $('#walkoutOwner').textContent = team.owner;
  $('#walkoutPrice').textContent = team.walkout.price;

  walkoutOverlay.classList.remove('is-open');
  void walkoutOverlay.offsetWidth;
  walkoutOverlay.classList.add('is-open');
  walkoutOverlay.setAttribute('aria-hidden', 'false');
  flash.classList.remove('go');
  void flash.offsetWidth;
  setTimeout(() => flash.classList.add('go'), 1350);
  sparkleBurst();
}

function closeWalkout() {
  walkoutOverlay.classList.remove('is-open');
  walkoutOverlay.setAttribute('aria-hidden', 'true');
}

walkoutClose.addEventListener('click', closeWalkout);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && walkoutOverlay.classList.contains('is-open')) closeWalkout();
});
