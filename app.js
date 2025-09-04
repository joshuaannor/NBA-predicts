// --- Data ---------------------------------------------------------------
const TEAM_DATA = {
  Eastern: {
    Atlantic: [
      { name: "Boston Celtics", colors: ["#007A33", "#BA9653"] },
      { name: "Brooklyn Nets", colors: ["#000000", "#FFFFFF"] },
      { name: "New York Knicks", colors: ["#F58426", "#006BB6"] },
      { name: "Philadelphia 76ers", colors: ["#006BB6", "#ED174C"] },
      { name: "Toronto Raptors", colors: ["#CE1141", "#000000"] },
    ],
    Central: [
      { name: "Chicago Bulls", colors: ["#CE1141", "#000000"] },
      { name: "Cleveland Cavaliers", colors: ["#6F263D", "#FFB81C"] },
      { name: "Detroit Pistons", colors: ["#C8102E", "#1D428A"] },
      { name: "Indiana Pacers", colors: ["#002D62", "#FDBB30"] },
      { name: "Milwaukee Bucks", colors: ["#00471B", "#EEE1C6"] },
    ],
    Southeast: [
      { name: "Atlanta Hawks", colors: ["#E03A3E", "#C1D32F"] },
      { name: "Charlotte Hornets", colors: ["#1D1160", "#00788C"] },
      { name: "Miami Heat", colors: ["#98002E", "#F9A01B"] },
      { name: "Orlando Magic", colors: ["#0077C0", "#C4CED4"] },
      { name: "Washington Wizards", colors: ["#002B5C", "#E31837"] },
    ],
  },
  Western: {
    Northwest: [
      { name: "Denver Nuggets", colors: ["#0E2240", "#FEC524"] },
      { name: "Minnesota Timberwolves", colors: ["#0C2340", "#236192"] },
      { name: "Oklahoma City Thunder", colors: ["#007AC1", "#EF3B24"] },
      { name: "Portland Trail Blazers", colors: ["#E03A3E", "#000000"] },
      { name: "Utah Jazz", colors: ["#002B5C", "#00471B"] },
    ],
    Pacific: [
      { name: "Golden State Warriors", colors: ["#1D428A", "#FFC72C"] },
      { name: "LA Clippers", colors: ["#C8102E", "#1D428A"] },
      { name: "Los Angeles Lakers", colors: ["#552583", "#FDB927"] },
      { name: "Phoenix Suns", colors: ["#1D1160", "#E56020"] },
      { name: "Sacramento Kings", colors: ["#5A2D81", "#63727A"] },
    ],
    Southwest: [
      { name: "Dallas Mavericks", colors: ["#00538C", "#B8C4CA"] },
      { name: "Houston Rockets", colors: ["#CE1141", "#C4CED4"] },
      { name: "Memphis Grizzlies", colors: ["#5D76A9", "#12173F"] },
      { name: "New Orleans Pelicans", colors: ["#0C2340", "#C8102E"] },
      { name: "San Antonio Spurs", colors: ["#C4CED4", "#000000"] },
    ],
  },
};

const STATE = {
  season: "2024-25",
  standings: { Eastern: [], Western: [] },
  divisions: JSON.parse(JSON.stringify(TEAM_DATA)),
  playin: { Eastern: {}, Western: {} },
  bracket: { Eastern: {}, Western: {}, Finals: {} },
  awards: { mvp: "", dpoy: "", smoy: "", roy: "", mip: "", coy: "", eoy: "", confidence: 5 },
  allstar: { easternStarters: [], westernStarters: [], easternReserves: [], westernReserves: [], mvp: "" },
  records: {},
  leaders: { ppg: "", rpg: "", apg: "", spg: "", bpg: "", tpp: "", topOff: "", topDef: "", most3pm: "", bestFt: "" },
  overallConfidence: 5, notes: ""
};

const HISTORY = { past: [], future: [] };
const savePoint = () => {
  HISTORY.past.push(JSON.stringify(STATE));
  HISTORY.future.length = 0;
  localStorage.setItem("nba-predict-state", JSON.stringify(STATE));
  updateUndoRedo();
}
const restore = (snap) => { Object.assign(STATE, JSON.parse(snap)); renderAll(); updateUndoRedo(); }
const updateUndoRedo = () => {
  document.getElementById('undo').disabled = HISTORY.past.length === 0;
  document.getElementById('redo').disabled = HISTORY.future.length === 0;
}

// Load saved
const saved = localStorage.getItem("nba-predict-state");
if (saved) { Object.assign(STATE, JSON.parse(saved)); } else { initDefaults(); }

function initDefaults() {
  STATE.standings.Eastern = [
    ...TEAM_DATA.Eastern.Atlantic,
    ...TEAM_DATA.Eastern.Central,
    ...TEAM_DATA.Eastern.Southeast,
  ].map(t => t.name);
  STATE.standings.Western = [
    ...TEAM_DATA.Western.Northwest,
    ...TEAM_DATA.Western.Pacific,
    ...TEAM_DATA.Western.Southwest,
  ].map(t => t.name);
  allTeams().forEach(t => STATE.records[t] = { w: 41, l: 41 });
}

function allTeams() { return [
  ...Object.values(TEAM_DATA.Eastern).flat(),
  ...Object.values(TEAM_DATA.Western).flat(),
].map(t => t.name); }

// Datalists
const playerHints = [
  "Nikola Jokic","Luka Doncic","Giannis Antetokounmpo","Jayson Tatum","Joel Embiid","Shai Gilgeous-Alexander","Stephen Curry","Kevin Durant","LeBron James","Anthony Davis","Kawhi Leonard","Devin Booker","Anthony Edwards","Donovan Mitchell","Jalen Brunson","Jimmy Butler","Damian Lillard","Tyrese Haliburton","Jaren Jackson Jr.","Bam Adebayo","Victor Wembanyama","Chet Holmgren","Jamal Murray","Kyrie Irving","Paul George","Jaylen Brown","Klay Thompson","De'Aaron Fox","Zion Williamson","Trae Young"
];
const dlP = document.getElementById('players');
const dlT = document.getElementById('teams');
playerHints.forEach(p => dlP.appendChild(new Option(p, p)));
allTeams().forEach(t => dlT.appendChild(new Option(t, t)));

// --- UI Builders -------------------------------------------------------
function makeTeamChip(name, ctx) {
  const { colors } = findTeam(name);
  const el = document.createElement('div');
  el.className = 'team'; el.draggable = true; el.dataset.team = name;
  let right = '<div class="badge tiny">Drag</div>';
  if (ctx?.type === 'division') {
    right = `<div class="ctrls"><button class="up" title="Move up">▲</button><button class="down" title="Move down">▼</button></div>`;
  }
  el.innerHTML = `
    <div class="swatch" style="background: linear-gradient(135deg, ${colors[0]}, ${colors[1]})"></div>
    <div class="name">${name}</div>
    ${right}
  `;
  hookDnD(el);
  if (ctx?.type === 'division') {
    const up = el.querySelector('.up'); const down = el.querySelector('.down');
    up.onclick = (ev) => { ev.stopPropagation(); ev.preventDefault(); moveDivisionRelative(ctx.conf, ctx.div, name, -1); };
    down.onclick = (ev) => { ev.stopPropagation(); ev.preventDefault(); moveDivisionRelative(ctx.conf, ctx.div, name, +1); };
  }
  return el;
}

function moveDivisionRelative(conf, div, name, delta){
  const arr = STATE.divisions[conf][div];
  const i = arr.findIndex(t=>t.name===name); if (i<0) return;
  const j = i + delta; if (j<0 || j>=arr.length) return;
  const [item] = arr.splice(i,1); arr.splice(j,0,item);
  // reflect in conference standings near neighbor
  const neighbor = arr[Math.max(0, Math.min(j, arr.length-1))]?.name;
  reflectConfNear(conf, name, neighbor);
  savePoint(); updateDivisionUI(conf, div); updateConferenceUI(conf); renderBrackets();
}

function reflectConfNear(conf, name, anchor){
  const confArr = STATE.standings[conf];
  const old = confArr.indexOf(name); if (old>=0) confArr.splice(old,1);
  const idx = anchor ? confArr.indexOf(anchor) : -1;
  confArr.splice(idx>=0 ? idx+1 : confArr.length, 0, name);
}

function findTeam(name) {
  for (const conf of ["Eastern","Western"]) {
    for (const [div, arr] of Object.entries(TEAM_DATA[conf])) {
      const t = arr.find(t => t.name === name);
      if (t) return t;
    }
  }
  return { name, colors: ["#334155","#64748b"] };
}

function renderDivisions() {
  const east = document.getElementById('east-divisions'); east.innerHTML = '';
  const west = document.getElementById('west-divisions'); west.innerHTML = '';
  for (const [div, teams] of Object.entries(STATE.divisions.Eastern)) east.appendChild(divisionBlock('Eastern', div, teams));
  for (const [div, teams] of Object.entries(STATE.divisions.Western)) west.appendChild(divisionBlock('Western', div, teams));
}
function divisionBlock(conf, div, teams) {
  const block = document.createElement('div'); block.className = 'division';
  const h = document.createElement('h3'); h.textContent = `${div}`; block.appendChild(h);
  const list = document.createElement('div'); list.className = 'team-list'; list.dataset.conf = conf; list.dataset.div = div; block.appendChild(list);
  teams.forEach(t => list.appendChild(makeTeamChip(t.name, {type:'division', conf, div})));
  hookDropZone(list, (name, index) => {
    const targetArr = STATE.divisions[conf][div];
    let item = { name, colors: findTeam(name).colors };
    if (dragData.source?.type === 'division') {
      const srcArr = STATE.divisions[dragData.source.conf][dragData.source.div];
      const i = srcArr.findIndex(t=>t.name===name);
      if (i>=0) item = srcArr.splice(i,1)[0];
    }
    targetArr.splice(index, 0, item);
    // update conference standings relative to neighbor before index
    const anchor = targetArr[Math.max(0, index-1)]?.name || null;
    reflectConfNear(conf, name, anchor);
    savePoint(); updateDivisionUI(conf, div); updateConferenceUI(conf); renderBrackets();
  });
  return block;
}

function updateDivisionUI(conf, div){
  const list = document.querySelector(`.team-list[data-conf="${conf}"][data-div="${div}"]`);
  if (!list) { renderDivisions(); return; }
  list.innerHTML = '';
  STATE.divisions[conf][div].forEach(t => list.appendChild(makeTeamChip(t.name, {type:'division', conf, div})));
}

function renderStandings() {
  const e = document.getElementById('east-ordered'); e.innerHTML = '';
  const w = document.getElementById('west-ordered'); w.innerHTML = '';
  STATE.standings.Eastern.forEach(name => e.appendChild(makeTeamChip(name, {type:'conference', conf:'Eastern'})));
  STATE.standings.Western.forEach(name => w.appendChild(makeTeamChip(name, {type:'conference', conf:'Western'})));
  hookDropZone(e, (name, index) => reorderConference('Eastern', name, index));
  hookDropZone(w, (name, index) => reorderConference('Western', name, index));
  renderBrackets();
}
function updateConferenceUI(conf){
  const list = document.getElementById(conf==='Eastern' ? 'east-ordered' : 'west-ordered');
  list.innerHTML = '';
  STATE.standings[conf].forEach(name => list.appendChild(makeTeamChip(name, {type:'conference', conf}))); 
  hookDropZone(list, (name, index) => reorderConference(conf, name, index));
}
function reorderConference(conf, name, index) {
  const arr = STATE.standings[conf];
  const from = arr.indexOf(name); if (from < 0) return;
  arr.splice(from,1);
  arr.splice(index, 0, name);
  savePoint(); updateConferenceUI(conf); renderBrackets();
}

// --- Drag & Drop helpers ----------------------------------------------
let dragData = { el: null, source: null, placeholder: null, raf: false };
function hookDnD(el) {
  el.addEventListener('dragstart', (e) => {
    dragData.el = el;
    const parent = el.parentElement;
    if (parent?.classList.contains('team-list')) {
      dragData.source = { type: 'division', conf: parent.dataset.conf, div: parent.dataset.div };
    } else if (parent?.id === 'east-ordered' || parent?.id === 'west-ordered') {
      dragData.source = { type: 'conference', conf: parent.id.startsWith('east') ? 'Eastern' : 'Western' };
    } else {
      dragData.source = null;
    }
    setTimeout(()=>el.classList.add('ghost'), 0);
    e.dataTransfer.setData('text/plain', el.dataset.team);
    e.dataTransfer.effectAllowed = 'move';
    if (!dragData.placeholder) { const ph = document.createElement('div'); ph.className='placeholder'; dragData.placeholder = ph; }
  });
  el.addEventListener('dragend', () => { el.classList.remove('ghost'); dragCleanup(); });
}
function dragCleanup(){
  if (dragData.placeholder?.parentElement) dragData.placeholder.remove();
  dragData.el = null; dragData.source = null; dragData.raf = false;
}

function hookDropZone(zone, onCommit) {
  zone.addEventListener('dragover', (e) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    if (dragData.raf) return; dragData.raf = true;
    requestAnimationFrame(() => {
      const idx = getInsertIndex(zone, e.clientY);
      const children = [...zone.children].filter(n=>n!==dragData.placeholder);
      if (idx >= children.length) zone.appendChild(dragData.placeholder);
      else zone.insertBefore(dragData.placeholder, children[idx]);
      dragData.raf = false;
    });
  }, { passive: false });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    const name = e.dataTransfer.getData('text/plain');
    const index = getInsertIndex(zone, e.clientY);
    if (dragData.placeholder?.parentElement) dragData.placeholder.remove();
    onCommit(name, index);
  });
  zone.addEventListener('dragleave', (e) => {
    // Remove placeholder if leaving container bounds
    const r = zone.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
      if (dragData.placeholder?.parentElement) dragData.placeholder.remove();
    }
  });
}
function getInsertIndex(zone, y){
  const items = [...zone.querySelectorAll('.team')].filter(n=>n!==dragData.el);
  for (let i=0;i<items.length;i++){
    const r = items[i].getBoundingClientRect();
    const mid = r.top + r.height/2;
    if (y < mid) return i;
  }
  return items.length;
}

// --- Playoffs ----------------------------------------------------------
function seeds(conf) { return STATE.standings[conf].slice(0, 10); }
function renderBrackets() {
  const bracket = { Eastern: makeConfBracket('Eastern'), Western: makeConfBracket('Western') };
  document.getElementById('east-bracket').replaceChildren(...bracket.Eastern);
  document.getElementById('west-bracket').replaceChildren(...bracket.Western);
}
function makeConfBracket(conf) {
  const s = seeds(conf);
  const el = [];
  el.push(sectionTitle(`${conf} — Play-In`));
  el.push(match(conf, 'PI-7-8', s[6], s[7], true));
  el.push(match(conf, 'PI-9-10', s[8], s[9], true));
  el.push(sectionTitle(`${conf} — First Round`));
  const s7 = winnerOf(conf,'PI-7-8');
  const s8 = winnerOf(conf,'PI-9-10');
  el.push(match(conf, 'R1-1-8', s[0], s8));
  el.push(match(conf, 'R1-2-7', s[1], s7));
  el.push(match(conf, 'R1-3-6', s[2], s[5]));
  el.push(match(conf, 'R1-4-5', s[3], s[4]));
  el.push(sectionTitle(`${conf} — Semifinals`));
  el.push(match(conf, 'SF-1', winnerOf(conf,'R1-1-8'), winnerOf(conf,'R1-4-5')));
  el.push(match(conf, 'SF-2', winnerOf(conf,'R1-2-7'), winnerOf(conf,'R1-3-6')));
  el.push(sectionTitle(`${conf} — Finals`));
  el.push(match(conf, 'CF', winnerOf(conf,'SF-1'), winnerOf(conf,'SF-2')));
  return el;
}
function sectionTitle(text){ const t=document.createElement('div'); t.className='tiny muted'; t.style.margin='6px 0'; t.textContent=text; return t; }
function winnerOf(conf,key){ return STATE.bracket[conf]?.[key]?.winner || ''; }
function match(conf, key, a, b, isPlayIn=false) {
  const row = document.createElement('div'); row.className = 'match';
  const left = document.createElement('div'); left.textContent = a && b ? `${a} vs ${b}` : 'TBD';
  const right = document.createElement('div'); right.className = 'series';
  const sel = document.createElement('select');
  ;[4,5,6,7].forEach(n => sel.appendChild(new Option(`${n} games`, String(n))));
  const pickA = document.createElement('button'); pickA.textContent = a ? teamShort(a) : 'A';
  const pickB = document.createElement('button'); pickB.textContent = b ? teamShort(b) : 'B';
  [pickA,pickB].forEach(btn => btn.disabled = !(a && b));
  const record = STATE.bracket[conf][key] || { winner: '', games: 4 };
  sel.value = record.games || 4;
  if (record.winner === a) pickA.classList.add('primary');
  if (record.winner === b) pickB.classList.add('primary');
  pickA.onclick = () => { STATE.bracket[conf][key] = { winner: a, games: Number(sel.value) }; savePoint(); renderBrackets(); };
  pickB.onclick = () => { STATE.bracket[conf][key] = { winner: b, games: Number(sel.value) }; savePoint(); renderBrackets(); };
  sel.onchange = () => { const rec = STATE.bracket[conf][key] || {}; rec.games = Number(sel.value); STATE.bracket[conf][key] = rec; savePoint(); };
  right.append(pickA, pickB, sel);
  row.append(left,right);
  return row;
}
function teamShort(name){ return name.split(' ').slice(-1)[0]; }

// --- Awards/All-Star/Stats bindings -----------------------------------
const bind = (id, path) => {
  const el = document.getElementById(id);
  const set = (v) => { const parts = path.split('.'); let o = STATE; while(parts.length>1){ o = o[parts.shift()]; } o[parts[0]] = v; }
  const get = () => { const parts = path.split('.'); let o = STATE; while(parts.length){ o = o[parts.shift()]; } return o; }
  const render = () => { if (el.type === 'range' || el.type === 'text' || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') el.value = get() ?? ''; };
  el.addEventListener('change', () => { set(el.value); savePoint(); });
  render();
}
bind('mvp','awards.mvp'); bind('dpoy','awards.dpoy'); bind('smoy','awards.smoy'); bind('roy','awards.roy'); bind('mip','awards.mip'); bind('coy','awards.coy'); bind('eoy','awards.eoy'); bind('awards-confidence','awards.confidence');
bind('ppg','leaders.ppg'); bind('rpg','leaders.rpg'); bind('apg','leaders.apg'); bind('spg','leaders.spg'); bind('bpg','leaders.bpg'); bind('tpp','leaders.tpp'); bind('top-off','leaders.topOff'); bind('top-def','leaders.topDef'); bind('most-3pm','leaders.most3pm'); bind('best-ft','leaders.bestFt');
bind('overall-confidence','overallConfidence'); bind('notes','notes');

const asBind = (id, key) => {
  const el = document.getElementById(id);
  const render = () => el.value = (STATE.allstar[key]||[]).join(', ');
  el.addEventListener('change', () => { STATE.allstar[key] = el.value.split(',').map(s=>s.trim()).filter(Boolean); savePoint(); });
  render();
};
asBind('east-starters','easternStarters'); asBind('west-starters','westernStarters'); asBind('east-reserves','easternReserves'); asBind('west-reserves','westernReserves');
bind('as-mvp','allstar.mvp');

function renderRecords(){
  const host = document.getElementById('team-records'); host.innerHTML='';
  allTeams().forEach(team => {
    const row = document.createElement('div'); row.className='chip'; row.style.display='grid'; row.style.gridTemplateColumns='auto 44px 10px 44px'; row.style.gap='8px';
    const label = document.createElement('div'); label.textContent = team; label.className='tiny'; row.appendChild(label);
    const w = document.createElement('input'); w.type='number'; w.min='0'; w.max='82'; w.value = STATE.records[team]?.w ?? 41; w.title='Wins';
    const sep = document.createElement('div'); sep.textContent='-'; sep.className='muted'; sep.style.textAlign='center';
    const l = document.createElement('input'); l.type='number'; l.min='0'; l.max='82'; l.value = STATE.records[team]?.l ?? 41; l.title='Losses';
    [w,l].forEach(inp=>{ inp.addEventListener('change', ()=>{ STATE.records[team] = { w: Number(w.value), l: Number(l.value) }; savePoint(); }); });
    row.append(w, sep, l); host.appendChild(row);
  });
}

// --- Actions -----------------------------------------------------------
document.getElementById('undo').onclick = () => { if (!HISTORY.past.length) return; const snap = HISTORY.past.pop(); HISTORY.future.push(JSON.stringify(STATE)); restore(snap); };
document.getElementById('redo').onclick = () => { if (!HISTORY.future.length) return; const snap = HISTORY.future.pop(); HISTORY.past.push(JSON.stringify(STATE)); restore(snap); };
document.getElementById('save').onclick = () => { localStorage.setItem('nba-predict-state', JSON.stringify(STATE)); flash('Saved locally'); };
document.getElementById('export').onclick = () => exportData();
document.getElementById('print').onclick = () => window.print();
document.querySelector('[data-action="reset"]').onclick = () => { if (confirm('Reset all predictions?')) { Object.assign(STATE, { ...STATE, bracket:{Eastern:{},Western:{},Finals:{}}, playin:{Eastern:{},Western:{}}, awards:{mvp:"",dpoy:"",smoy:"",roy:"",mip:"",coy:"",eoy:"",confidence:5}, allstar:{easternStarters:[],westernStarters:[],easternReserves:[],westernReserves:[],mvp:""}, leaders:{ppg:"",rpg:"",apg:"",spg:"",bpg:"",tpp:"",topOff:"",topDef:"",most3pm:"",bestFt:""}, overallConfidence:5, notes:"" }); initDefaults(); savePoint(); renderAll(); } };
document.querySelector('[data-action="randomize"]').onclick = () => { ['Eastern','Western'].forEach(c=>STATE.standings[c].sort(()=>Math.random()-0.5)); savePoint(); renderStandings(); };

document.getElementById('season').onchange = (e) => { STATE.season = e.target.value; savePoint(); };

document.getElementById('compare').onclick = async () => {
  const f = document.getElementById('import-file').files?.[0]; if (!f) { flash('Pick a JSON file to compare'); return; }
  const text = await f.text();
  try { const other = JSON.parse(text); const diffs = compareStates(STATE, other); document.getElementById('compare-out').innerHTML = diffs || 'No differences'; } catch { flash('Invalid JSON'); }
}

function compareStates(a,b){
  const lines = [];
  const cmpArr = (path, A, B) => {
    if (!Array.isArray(A) || !Array.isArray(B)) return;
    if (A.join('|') !== B.join('|')) lines.push(`${path} differs`);
  };
  cmpArr('standings.Eastern', a.standings?.Eastern || [], b.standings?.Eastern || []);
  cmpArr('standings.Western', a.standings?.Western || [], b.standings?.Western || []);
  ['mvp','dpoy','smoy','roy','mip','coy','eoy'].forEach(k=>{ if ((a.awards?.[k]||'') !== (b.awards?.[k]||'')) lines.push(`awards.${k} differs`); });
  if ((a.allstar?.mvp||'') !== (b.allstar?.mvp||'')) lines.push('allstar.mvp differs');
  return lines.join('<br/>');
}

function exportData(){
  const data = JSON.stringify(STATE, null, 2);
  download(`nba-predictions-${STATE.season.replace(/\s+/g,'')}.json`, data, 'application/json');
  const csv = [ ['Seed','Conference','Team'].join(',') ];
  ['Eastern','Western'].forEach(conf => STATE.standings[conf].forEach((t,i)=>csv.push([i+1, conf, '"'+t+'"'].join(','))));
  download(`nba-standings-${STATE.season.replace(/\s+/g,'')}.csv`, csv.join('\n'), 'text/csv');
  flash('Exported JSON and CSV');
}
function download(name, content, type){
  const a = document.createElement('a'); a.download = name; a.href = URL.createObjectURL(new Blob([content], { type })); a.click(); URL.revokeObjectURL(a.href);
}

function flash(msg){
  const b = document.createElement('div');
  b.textContent = msg; b.style.position='fixed'; b.style.bottom='16px'; b.style.left='50%'; b.style.transform='translateX(-50%)'; b.style.background='var(--panel)'; b.style.border='1px solid var(--stroke)'; b.style.padding='8px 12px'; b.style.borderRadius='10px'; b.style.boxShadow='var(--shadow)'; b.style.zIndex='1000';
  document.body.appendChild(b); setTimeout(()=>b.remove(), 1600);
}

// --- Initial Render ----------------------------------------------------
function renderAll(){ renderDivisions(); renderStandings(); renderRecords(); }
renderAll(); updateUndoRedo();

// Keyboard shortcuts for undo/redo
window.addEventListener('keydown', (e) => {
  const z = e.key.toLowerCase() === 'z';
  if ((e.metaKey || e.ctrlKey) && z && !e.shiftKey) { e.preventDefault(); document.getElementById('undo').click(); }
  if ((e.metaKey || e.ctrlKey) && z && e.shiftKey) { e.preventDefault(); document.getElementById('redo').click(); }
});

