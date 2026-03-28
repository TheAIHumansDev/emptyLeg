/**
 * AERO — AI Private Jet Finder
 * app.js
 *
 * Key additions vs previous version:
 *  - Filter panel: open/close, airport autocomplete, date range pills,
 *    jet class chips, price & region pills
 *  - Active filter tags with individual clear
 *  - Results count badge on filter button
 *  - Live result count inside "Show Results" button
 *  - No search bar on hero
 */

// ============================================================
//  CONFIG
// ============================================================
const API_BASE = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// ============================================================
//  AIRPORT DIRECTORY — used for autocomplete suggestions
// ============================================================
const AIRPORTS = [
  { code:'LHR', name:'Heathrow',          city:'London',       country:'UK' },
  { code:'LCY', name:'City Airport',       city:'London',       country:'UK' },
  { code:'FAB', name:'Farnborough',        city:'London',       country:'UK' },
  { code:'CDG', name:'Charles de Gaulle', city:'Paris',        country:'France' },
  { code:'LBG', name:'Le Bourget',         city:'Paris',        country:'France' },
  { code:'JFK', name:'JFK International', city:'New York',     country:'USA' },
  { code:'TEB', name:'Teterboro',          city:'New York',     country:'USA' },
  { code:'LAX', name:'Van Nuys',           city:'Los Angeles',  country:'USA' },
  { code:'MIA', name:"Opa-locka",          city:'Miami',        country:'USA' },
  { code:'DXB', name:'Al Maktoum',         city:'Dubai',        country:'UAE' },
  { code:'SIN', name:'Seletar',            city:'Singapore',    country:'SG' },
  { code:'HND', name:'Haneda',             city:'Tokyo',        country:'Japan' },
  { code:'GVA', name:'Cointrin',           city:'Geneva',       country:'Switzerland' },
  { code:'ZRH', name:'Kloten',             city:'Zürich',       country:'Switzerland' },
  { code:'BCN', name:'Sabadell',           city:'Barcelona',    country:'Spain' },
  { code:'AMS', name:'Lelystad',           city:'Amsterdam',    country:'Netherlands' },
  { code:'NBO', name:'Wilson Airport',     city:'Nairobi',      country:'Kenya' },
  { code:'CPT', name:'Stellenbosch',       city:'Cape Town',    country:'South Africa' },
  { code:'SYD', name:'Bankstown',          city:'Sydney',       country:'Australia' },
  { code:'BKK', name:"Don Mueang",         city:'Bangkok',      country:'Thailand' },
  { code:'MCO', name:'Sanford',            city:'Orlando',      country:'USA' },
  { code:'LAS', name:'Henderson Executive',city:'Las Vegas',    country:'USA' },
  { code:'HOU', name:'Hobby',              city:'Houston',      country:'USA' },
  { code:'MXP', name:'Malpensa',           city:'Milan',        country:'Italy' },
  { code:'FCO', name:'Ciampino',           city:'Rome',         country:'Italy' },
  { code:'NIC', name:'Nice Côte d\'Azur', city:'Nice',         country:'France' },
  { code:'IBZ', name:'Ibiza',              city:'Ibiza',        country:'Spain' },
];

// ============================================================
//  STATE
// ============================================================
const AppState = {
  flights: [],
  filteredFlights: [],
  currentFlight: null,
  bookingPassenger: null,
  currentBookingStep: 1,
  bookings: JSON.parse(localStorage.getItem('aero_bookings') || '[]'),

  // Filter state
  filters: {
    fromCode:   '',   // IATA code or '' for any
    toCode:     '',
    fromLabel:  '',
    toLabel:    '',
    dateRange:  'any',  // 'any'|'today'|'7'|'30'|'custom'
    dateFrom:   '',
    dateTo:     '',
    jetClass:   '',
    maxPrice:   '',
    region:     '',
  },
};

// ============================================================
//  MOCK FLIGHTS — all private jets, private FBOs
// ============================================================
const MOCK_FLIGHTS = [
  { id:'FL001', origin:'LHR', origin_full:'London Farnborough',     destination:'CDG', destination_full:'Paris Le Bourget',      aircraft:'Bombardier Global 6000',    category:'heavy',   region:'europe',   departure_time: ts(18),  duration:'1h 15m', price:4800,  original_price:22000,  seats:8,  image_url:'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=900&q=80', operator:'Sovereign Air Group',      safety_rating:'ARGUS Platinum' },
  { id:'FL002', origin:'DXB', origin_full:'Dubai Al Maktoum',       destination:'TEB', destination_full:'New York Teterboro',    aircraft:'Gulfstream G700',           category:'ultra',   region:'mideast',  departure_time: ts(36),  duration:'14h 30m',price:42000, original_price:185000, seats:14, image_url:'https://images.unsplash.com/photo-1583791031153-d55e79f7f115?w=900&q=80', operator:'Desert Wings Aviation',    safety_rating:'IS-BAO Stage III' },
  { id:'FL003', origin:'MIA', origin_full:'Miami Opa-locka',        destination:'LAX', destination_full:'Los Angeles Van Nuys', aircraft:'Cessna Citation Longitude', category:'midsize', region:'americas', departure_time: ts(8),   duration:'5h 20m', price:9500,  original_price:38000,  seats:8,  image_url:'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=900&q=80', operator:'Atlantic Charter Co.',     safety_rating:'ARGUS Gold' },
  { id:'FL004', origin:'CDG', origin_full:'Paris Le Bourget',       destination:'GVA', destination_full:'Geneva Cointrin',      aircraft:'Embraer Phenom 300E',       category:'light',   region:'europe',   departure_time: ts(6),   duration:'1h 05m', price:2900,  original_price:11500,  seats:6,  image_url:'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=900&q=80', operator:'Riviera Jet Partners',    safety_rating:'ARGUS Platinum' },
  { id:'FL005', origin:'SIN', origin_full:'Singapore Seletar',      destination:'HND', destination_full:'Tokyo Haneda',         aircraft:'Gulfstream G550',           category:'heavy',   region:'asia',     departure_time: ts(28),  duration:'7h 10m', price:26500, original_price:95000,  seats:12, image_url:'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=900&q=80', operator:'Pacific Prestige Aviation',safety_rating:'ARGUS Platinum' },
  { id:'FL006', origin:'NBO', origin_full:'Nairobi Wilson Airport', destination:'CPT', destination_full:'Cape Town Stellenbosch',aircraft:'Dassault Falcon 8X',        category:'heavy',   region:'africa',   departure_time: ts(48),  duration:'7h 40m', price:19000, original_price:72000,  seats:10, image_url:'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&q=80', operator:'Savanna Air Executive',   safety_rating:'IS-BAO Stage II' },
  { id:'FL007', origin:'AMS', origin_full:'Amsterdam Lelystad',     destination:'BCN', destination_full:'Barcelona Sabadell',   aircraft:'HondaJet Elite II',         category:'light',   region:'europe',   departure_time: ts(10),  duration:'2h 30m', price:3400,  original_price:14000,  seats:5,  image_url:'https://images.unsplash.com/photo-1606768666853-403c90a981ad?w=900&q=80', operator:'Benelux Air Charter',    safety_rating:'ARGUS Gold' },
  { id:'FL008', origin:'SYD', origin_full:'Sydney Bankstown',       destination:'BKK', destination_full:'Bangkok Don Mueang',   aircraft:'Bombardier Challenger 650', category:'midsize', region:'asia',     departure_time: ts(52),  duration:'9h 50m', price:31000, original_price:110000, seats:10, image_url:'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=900&q=80', operator:'Southern Cross Jet',     safety_rating:'IS-BAO Stage III' },
  { id:'FL009', origin:'TEB', origin_full:'New York Teterboro',     destination:'MIA', destination_full:'Miami Opa-locka',      aircraft:'Gulfstream G450',           category:'heavy',   region:'americas', departure_time: ts(5),   duration:'2h 55m', price:11500, original_price:44000,  seats:12, image_url:'https://images.unsplash.com/photo-1615813967515-e1838c1c5116?w=900&q=80', operator:'Northeast Jet Group',    safety_rating:'ARGUS Platinum' },
  { id:'FL010', origin:'LHR', origin_full:'London Farnborough',     destination:'GVA', destination_full:'Geneva Cointrin',      aircraft:'Bombardier Learjet 75',     category:'light',   region:'europe',   departure_time: ts(3),   duration:'1h 40m', price:3100,  original_price:12500,  seats:6,  image_url:'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=900&q=80', operator:'Sovereign Air Group',    safety_rating:'ARGUS Platinum' },
  { id:'FL011', origin:'DXB', origin_full:'Dubai Al Maktoum',       destination:'CDG', destination_full:'Paris Le Bourget',     aircraft:'Gulfstream G650ER',         category:'ultra',   region:'mideast',  departure_time: ts(22),  duration:'7h 05m', price:38000, original_price:148000, seats:14, image_url:'https://images.unsplash.com/photo-1583791031153-d55e79f7f115?w=900&q=80', operator:'Gulf Sky Aviation',      safety_rating:'IS-BAO Stage III' },
  { id:'FL012', origin:'NIC', origin_full:'Nice Côte d\'Azur',     destination:'IBZ', destination_full:'Ibiza Airport',        aircraft:'Dassault Falcon 2000LX',    category:'midsize', region:'europe',   departure_time: ts(14),  duration:'1h 50m', price:6800,  original_price:28000,  seats:8,  image_url:'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=900&q=80', operator:'Mediterranean Jets',     safety_rating:'ARGUS Gold' },
];

function ts(hoursFromNow) {
  return new Date(Date.now() + hoursFromNow * 3600000).toISOString();
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initHeroTitle();
  initParticleCanvas();
  loadFlights().then(() => {
    animateCounters();
    initCountdowns();
  });
  // Close dropdowns on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.fp-airport-field')) closeAllDropdowns();
  });
});

// ============================================================
//  NAV
// ============================================================
function initNav() {
  const nav = document.getElementById('nav');
  nav.classList.add('hero-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
}
function updateNavForSection(name) {
  const nav = document.getElementById('nav');
  if (name === 'hero') {
    nav.classList.add('hero-nav'); nav.classList.remove('solid');
  } else {
    nav.classList.remove('hero-nav'); nav.classList.add('solid');
  }
}

// ============================================================
//  SECTION NAVIGATION
// ============================================================
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`section-${name}`);
  if (el) { el.classList.add('active'); window.scrollTo({ top:0, behavior:'smooth' }); }
  updateNavForSection(name);
  if (name === 'listings') renderFlights(AppState.filteredFlights);
  if (name === 'dashboard') renderDashboard();
  if (name === 'hero') animateCounters();
}

// ============================================================
//  FILTER PANEL OPEN / CLOSE
// ============================================================
function openFilterPanel() {
  const panel   = document.getElementById('filter-panel');
  const btn     = document.getElementById('filter-trigger-btn');
  const backdrop= document.getElementById('fp-backdrop');
  panel.classList.add('open');
  btn.classList.add('active');
  backdrop.classList.add('visible');
  updateLiveCount();
}
function closeFilterPanel() {
  const panel   = document.getElementById('filter-panel');
  const btn     = document.getElementById('filter-trigger-btn');
  const backdrop= document.getElementById('fp-backdrop');
  panel.classList.remove('open');
  btn.classList.remove('active');
  backdrop.classList.remove('visible');
  closeAllDropdowns();
}
function toggleFilterPanel() {
  const panel = document.getElementById('filter-panel');
  panel.classList.contains('open') ? closeFilterPanel() : openFilterPanel();
}

// ============================================================
//  AIRPORT AUTOCOMPLETE
// ============================================================
function airportSuggest(inputId, dropdownId) {
  const input    = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  const query    = input.value.trim().toLowerCase();

  // Show all loaded airports if empty, otherwise filter
  const results = query.length === 0
    ? AppState.flights.reduce((acc, f) => {
        // Show only airports that appear in current flights
        const from = AIRPORTS.find(a => a.code === f.origin);
        const to   = AIRPORTS.find(a => a.code === f.destination);
        if (from && !acc.find(a => a.code === from.code)) acc.push(from);
        if (to   && !acc.find(a => a.code === to.code))   acc.push(to);
        return acc;
      }, [])
    : AIRPORTS.filter(a =>
        a.code.toLowerCase().includes(query) ||
        a.city.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query)
      ).slice(0, 7);

  if (results.length === 0) { dropdown.classList.remove('show'); return; }

  dropdown.innerHTML = results.map(a => `
    <div class="fp-dropdown-item" onclick="selectAirport('${inputId}','${dropdownId}','${a.code}','${a.city} ${a.code}')">
      <div class="fp-dropdown-code">${a.code}</div>
      <div>
        <div class="fp-dropdown-name">${a.city}</div>
        <div class="fp-dropdown-city">${a.name} · ${a.country}</div>
      </div>
    </div>`).join('');

  dropdown.classList.add('show');
  // Close other dropdown
  const otherId = inputId === 'fp-from' ? 'fp-to-dropdown' : 'fp-from-dropdown';
  document.getElementById(otherId)?.classList.remove('show');
}

function selectAirport(inputId, dropdownId, code, label) {
  document.getElementById(inputId).value = label;
  document.getElementById(dropdownId).classList.remove('show');
  if (inputId === 'fp-from') {
    AppState.filters.fromCode  = code;
    AppState.filters.fromLabel = label;
  } else {
    AppState.filters.toCode  = code;
    AppState.filters.toLabel = label;
  }
  updateLiveCount();
}

function closeAllDropdowns() {
  document.querySelectorAll('.fp-dropdown').forEach(d => d.classList.remove('show'));
}

function swapAirports() {
  const fromInput = document.getElementById('fp-from');
  const toInput   = document.getElementById('fp-to');
  const tmpVal = fromInput.value; fromInput.value = toInput.value; toInput.value = tmpVal;
  const tmpCode    = AppState.filters.fromCode;    AppState.filters.fromCode    = AppState.filters.toCode;    AppState.filters.toCode    = tmpCode;
  const tmpLabel   = AppState.filters.fromLabel;   AppState.filters.fromLabel   = AppState.filters.toLabel;   AppState.filters.toLabel   = tmpLabel;
  updateLiveCount();
}

// ============================================================
//  DATE RANGE SELECTION
// ============================================================
function selectDateRange(el, range) {
  document.querySelectorAll('.fp-date-pills .fp-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  AppState.filters.dateRange = range;

  const customEl = document.getElementById('fp-custom-dates');
  if (range === 'custom') {
    customEl.classList.add('show');
  } else {
    customEl.classList.remove('show');
    AppState.filters.dateFrom = '';
    AppState.filters.dateTo   = '';
  }
  updateLiveCount();
}

// ============================================================
//  JET CLASS CHIPS
// ============================================================
function selectJetClass(el, cls) {
  document.querySelectorAll('.fp-chips .fp-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  AppState.filters.jetClass = cls;
  updateLiveCount();
}

// ============================================================
//  PRICE / REGION PILLS
// ============================================================
function selectPrice(el, val) {
  document.querySelectorAll('.fp-price-pills .fp-pill[data-price]').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  AppState.filters.maxPrice = val;
  updateLiveCount();
}
function selectRegion(el, val) {
  document.querySelectorAll('.fp-price-pills .fp-pill[data-region]').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  AppState.filters.region = val;
  updateLiveCount();
}

// ============================================================
//  CLEAR ALL FILTERS
// ============================================================
function clearAllFilters() {
  const f = AppState.filters;
  f.fromCode = f.toCode = f.fromLabel = f.toLabel = f.dateFrom = f.dateTo = f.jetClass = f.maxPrice = f.region = '';
  f.dateRange = 'any';

  // Reset UI
  document.getElementById('fp-from').value = '';
  document.getElementById('fp-to').value   = '';
  document.getElementById('fp-custom-dates').classList.remove('show');

  document.querySelectorAll('.fp-date-pills .fp-pill').forEach((p,i) => p.classList.toggle('active', i===0));
  document.querySelectorAll('.fp-chips .fp-chip').forEach((c,i)   => c.classList.toggle('active', i===0));
  document.querySelectorAll('.fp-price-pills .fp-pill[data-price]').forEach((p,i)  => p.classList.toggle('active', i===0));
  document.querySelectorAll('.fp-price-pills .fp-pill[data-region]').forEach((p,i) => p.classList.toggle('active', i===0));

  AppState.filteredFlights = [...AppState.flights];
  renderFlights(AppState.filteredFlights);
  updateFilterBadge(0);
  updateActiveTags();
  updateResultsSummary(AppState.filteredFlights.length);
  updateLiveCount();
}

// ============================================================
//  COMPUTE FILTERED FLIGHTS (used both live + on apply)
// ============================================================
function computeFiltered() {
  const f   = AppState.filters;
  const now = Date.now();

  return AppState.flights.filter(fl => {
    const dep = new Date(fl.departure_time).getTime();

    // Route
    if (f.fromCode && fl.origin      !== f.fromCode) return false;
    if (f.toCode   && fl.destination !== f.toCode)   return false;

    // Date
    if (f.dateRange === 'today') {
      const today = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
      if (dep < today.getTime() || dep >= tomorrow.getTime()) return false;
    } else if (f.dateRange === '7') {
      if (dep < now || dep > now + 7*86400000) return false;
    } else if (f.dateRange === '30') {
      if (dep < now || dep > now + 30*86400000) return false;
    } else if (f.dateRange === 'custom') {
      const from = document.getElementById('fp-date-from')?.value;
      const to   = document.getElementById('fp-date-to')?.value;
      if (from && dep < new Date(from).getTime()) return false;
      if (to   && dep > new Date(to).getTime() + 86400000) return false;
    }

    // Jet class
    if (f.jetClass && fl.category !== f.jetClass) return false;

    // Price
    if (f.maxPrice && fl.price > parseInt(f.maxPrice, 10)) return false;

    // Region
    if (f.region && fl.region !== f.region) return false;

    return true;
  });
}

// ============================================================
//  APPLY FILTERS (called when user clicks "Show Results")
// ============================================================
function applyFilters() {
  AppState.filteredFlights = computeFiltered();
  renderFlights(AppState.filteredFlights);
  updateActiveTags();
  updateFilterBadge(countActiveFilters());
  updateResultsSummary(AppState.filteredFlights.length);
}

// ============================================================
//  LIVE COUNT (updates inside button while panel is open)
// ============================================================
function updateLiveCount() {
  const count   = computeFiltered().length;
  const badge   = document.getElementById('fp-result-count');
  if (badge) badge.textContent = count > 0 ? `${count} jet${count!==1?'s':''}` : 'None';
}

// ============================================================
//  ACTIVE FILTER TAGS
// ============================================================
function updateActiveTags() {
  const f    = AppState.filters;
  const tags = [];

  if (f.fromCode)    tags.push({ label: `From: ${f.fromLabel||f.fromCode}`, clear: () => { f.fromCode=''; f.fromLabel=''; document.getElementById('fp-from').value=''; applyFilters(); } });
  if (f.toCode)      tags.push({ label: `To: ${f.toLabel||f.toCode}`,       clear: () => { f.toCode='';   f.toLabel='';   document.getElementById('fp-to').value='';   applyFilters(); } });
  if (f.dateRange !== 'any') {
    const labels = { today:'Today', '7':'Next 7 Days', '30':'Next 30 Days', custom:`${f.dateFrom||'?'} – ${f.dateTo||'?'}` };
    tags.push({ label: labels[f.dateRange]||f.dateRange, clear: () => { f.dateRange='any'; f.dateFrom=''; f.dateTo=''; document.querySelectorAll('.fp-date-pills .fp-pill').forEach((p,i)=>p.classList.toggle('active',i===0)); document.getElementById('fp-custom-dates').classList.remove('show'); applyFilters(); } });
  }
  if (f.jetClass) {
    const label = {light:'Light Jet', midsize:'Midsize', heavy:'Heavy Jet', ultra:'Ultra Long Range'}[f.jetClass]||f.jetClass;
    tags.push({ label, clear: () => { f.jetClass=''; document.querySelectorAll('.fp-chips .fp-chip').forEach((c,i)=>c.classList.toggle('active',i===0)); applyFilters(); } });
  }
  if (f.maxPrice) tags.push({ label: `Under $${(parseInt(f.maxPrice,10)/1000).toFixed(0)}K`, clear: () => { f.maxPrice=''; document.querySelectorAll('.fp-price-pills .fp-pill[data-price]').forEach((p,i)=>p.classList.toggle('active',i===0)); applyFilters(); } });
  if (f.region)   tags.push({ label: capitalize(f.region), clear: () => { f.region='';   document.querySelectorAll('.fp-price-pills .fp-pill[data-region]').forEach((p,i)=>p.classList.toggle('active',i===0)); applyFilters(); } });

  const container = document.getElementById('active-tags');
  if (!container) return;
  container.innerHTML = tags.map((t,i) => `
    <div class="active-tag">
      ${t.label}
      <button onclick="(${t.clear.toString()})()" title="Remove filter">×</button>
    </div>`).join('');
}

function updateFilterBadge(count) {
  const badge = document.getElementById('filter-count-badge');
  const btn   = document.getElementById('filter-btn-label');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count; badge.style.display = 'flex';
    if (btn) btn.textContent = 'Filters';
  } else {
    badge.style.display = 'none';
    if (btn) btn.textContent = 'Filter';
  }
}

function updateResultsSummary(count) {
  const el = document.getElementById('results-summary');
  if (!el) return;
  const f = AppState.filters;
  const hasFilters = countActiveFilters() > 0;
  if (!hasFilters) { el.textContent = `Showing all ${count} available private jets`; return; }
  el.textContent = `${count} jet${count!==1?'s':''} match your criteria`;
}

function countActiveFilters() {
  const f = AppState.filters;
  return [f.fromCode, f.toCode, f.dateRange!=='any', f.jetClass, f.maxPrice, f.region].filter(Boolean).length;
}

// ============================================================
//  DATA LOADING
// ============================================================
async function loadFlights() {
  try {
    const res = await fetch(`${API_BASE}?action=getFlights`, { mode:'cors' });
    if (!res.ok) throw new Error();
    const data = await res.json();
    AppState.flights = data.flights?.length ? data.flights : MOCK_FLIGHTS;
  } catch { AppState.flights = MOCK_FLIGHTS; }
  AppState.filteredFlights = [...AppState.flights];
}

// ============================================================
//  RENDER FLIGHTS GRID
// ============================================================
function renderFlights(flights) {
  const grid = document.getElementById('flights-grid');
  if (!grid) return;

  if (!flights || flights.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">✦</div>
        <h3>No Jets Found</h3>
        <p>No empty legs match your current filters.<br/>Try widening your date range or removing a filter.</p>
        <button class="back-btn" style="margin-top:16px" onclick="clearAllFilters()">Clear All Filters</button>
      </div>`;
    return;
  }

  grid.innerHTML = flights.map(f => {
    const dep       = new Date(f.departure_time);
    const timeStr   = dep.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
    const dateStr   = dep.toLocaleDateString('en-GB', { weekday:'short', month:'short', day:'numeric' });
    const discount  = Math.round((1 - f.price / f.original_price) * 100);
    const hoursLeft = Math.floor((dep - Date.now()) / 3600000);
    const urgent    = hoursLeft > 0 && hoursLeft < 12;

    return `<div class="flight-card" onclick="openFlight('${f.id}')">
      <div class="card-image">
        <img src="${f.image_url}" alt="${f.aircraft}" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&q=80'" />
        <div class="card-badge">−${discount}%</div>
        ${urgent ? `<div class="card-urgency"><span class="urgency-dot"></span>${hoursLeft}h left</div>` : ''}
      </div>
      <div class="card-body">
        <div class="card-route">
          ${f.origin}<span class="card-route-arrow">→</span>${f.destination}
        </div>
        <div class="card-aircraft">${f.aircraft} · ${capitalize(f.category)} Jet</div>
        <div class="card-meta">
          <div class="card-price">
            <span class="card-price-from">From</span>
            <span class="card-price-amount">$${f.price.toLocaleString()}</span>
            <span class="card-price-original">$${f.original_price.toLocaleString()} charter</span>
          </div>
          <div class="card-info">
            <div class="card-time">${timeStr} · ${dateStr}</div>
            <div class="card-seats">${f.seats} seats available</div>
          </div>
        </div>
        <div class="card-countdown">
          <span class="countdown-label">Departs in</span>
          <span class="countdown-timer" data-departure="${f.departure_time}" id="cd-${f.id}">—</span>
        </div>
      </div>
    </div>`;
  }).join('');

  // Stagger entrance
  grid.querySelectorAll('.flight-card').forEach((card, i) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(14px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.45s ease, transform 0.45s ease, box-shadow 0.32s ease, border-color 0.32s ease';
      card.style.opacity    = '1';
      card.style.transform  = 'translateY(0)';
    }, i * 55);
  });

  initCountdowns();
  updateResultsSummary(flights.length);
}

// ============================================================
//  FLIGHT DETAILS
// ============================================================
async function openFlight(id) {
  let flight = AppState.flights.find(f => f.id === id);
  if (!flight) {
    try {
      const res  = await fetch(`${API_BASE}?action=getFlightById&id=${id}`);
      const data = await res.json();
      flight     = data.flight;
    } catch { flight = MOCK_FLIGHTS.find(f => f.id === id); }
  }
  if (!flight) { showToast('Jet not found.'); return; }
  AppState.currentFlight = flight;
  renderDetails(flight);
  showSection('details');
}

function renderDetails(f) {
  const dep      = new Date(f.departure_time);
  const timeStr  = dep.toLocaleString('en-GB', { weekday:'long', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
  const discount = Math.round((1 - f.price / f.original_price) * 100);
  const taxes    = Math.round(f.price * 0.08);

  document.getElementById('details-container').innerHTML = `
    <div class="details-hero">
      <img src="${f.image_url}" alt="${f.aircraft}" onerror="this.src='https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&q=80'" />
      <div class="details-hero-overlay">
        <div class="details-route">${f.origin} <span>→</span> ${f.destination}</div>
      </div>
    </div>
    <div class="details-grid">
      <div>
        <div class="details-info-card">
          <div class="details-label">Route</div><div class="details-value">${f.origin_full} → ${f.destination_full}</div>
          <div class="details-label">Departure</div><div class="details-value">${timeStr}</div>
          <div class="details-label">Duration</div><div class="details-value">${f.duration}</div>
        </div>
        <div class="details-info-card">
          <div class="details-label">Private Jet Specifications</div>
          <div class="spec-grid">
            <div><div class="details-label">Aircraft</div><div class="details-value" style="font-size:14px">${f.aircraft}</div></div>
            <div><div class="details-label">Class</div><div class="details-value" style="font-size:14px">${capitalize(f.category)} Jet</div></div>
            <div><div class="details-label">Passengers</div><div class="details-value" style="font-size:14px">${f.seats} seats</div></div>
            <div><div class="details-label">Safety</div><div class="details-value" style="font-size:14px">${f.safety_rating}</div></div>
          </div>
        </div>
      </div>
      <div class="pricing-card">
        <div class="details-label" style="margin-bottom:20px">Pricing Breakdown</div>
        <div class="pricing-row"><span>Full charter rate</span><span style="text-decoration:line-through;color:var(--muted)">$${f.original_price.toLocaleString()}</span></div>
        <div class="pricing-row"><span>Empty leg savings (${discount}%)</span><span style="color:#16a34a">−$${(f.original_price-f.price-taxes).toLocaleString()}</span></div>
        <div class="pricing-row"><span>Taxes & landing fees</span><span>$${taxes.toLocaleString()}</span></div>
        <div class="pricing-total">
          <span class="pricing-total-label">Total</span>
          <span class="pricing-total-amount">$${f.price.toLocaleString()}</span>
        </div>
        <button class="book-btn" onclick="startBooking()">Reserve This Jet</button>
        <div class="operator-row"><span class="operator-dot"></span><span>Operated by ${f.operator}</span></div>
        <div style="margin-top:6px;font-size:10px;color:var(--muted);letter-spacing:0.1em">${f.safety_rating} · Fully insured · Part 135 certified</div>
      </div>
    </div>`;
}

// ============================================================
//  BOOKING FLOW
// ============================================================
function startBooking() {
  AppState.currentBookingStep = 1;
  document.getElementById('booking-back-btn').style.display = 'block';
  showSection('booking');
  renderBookingStep(1);
}

function renderBookingStep(step) {
  document.querySelectorAll('.step').forEach(s => {
    const n = parseInt(s.dataset.step);
    s.classList.toggle('active', n === step);
    s.classList.toggle('done',   n < step);
  });
  const content = document.getElementById('booking-step-content');
  if (!content) return;

  if (step === 1) {
    content.innerHTML = `
      <h2 class="form-title">Passenger Details</h2>
      <div class="form-row">
        <div class="form-group"><label class="form-label">First Name</label><input class="form-input" id="pax-first" placeholder="James" /></div>
        <div class="form-group"><label class="form-label">Last Name</label><input class="form-input" id="pax-last" placeholder="Morgan" /></div>
        <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="pax-email" placeholder="james@example.com" /></div>
        <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="pax-phone" placeholder="+1 212 000 0000" /></div>
        <div class="form-group full"><label class="form-label">Passport / ID</label><input class="form-input" id="pax-passport" placeholder="AB1234567" /></div>
        <div class="form-group"><label class="form-label">Nationality</label><input class="form-input" id="pax-nat" placeholder="British" /></div>
        <div class="form-group"><label class="form-label">Passengers</label><select class="form-input" id="pax-count"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></div>
      </div>
      <button class="form-next-btn" onclick="nextBookingStep()">Continue →</button>`;
  } else if (step === 2) {
    const f = AppState.currentFlight;
    const dep = new Date(f.departure_time);
    content.innerHTML = `
      <h2 class="form-title">Review Your Jet</h2>
      <div class="review-card">
        <div class="review-row"><span>Route</span><span>${f.origin} → ${f.destination}</span></div>
        <div class="review-row"><span>Aircraft</span><span>${f.aircraft}</span></div>
        <div class="review-row"><span>Departure</span><span>${dep.toLocaleString('en-GB',{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span></div>
        <div class="review-row"><span>Passenger</span><span>${AppState.bookingPassenger?.name||'—'}</span></div>
        <div class="review-row"><span>Email</span><span>${AppState.bookingPassenger?.email||'—'}</span></div>
        <div class="review-row"><span style="color:var(--ink)">Total</span><span style="color:var(--gold);font-family:var(--font-display);font-size:24px">$${f.price.toLocaleString()}</span></div>
      </div>
      <button class="form-next-btn" onclick="nextBookingStep()">Proceed to Payment →</button>`;
  } else if (step === 3) {
    const f = AppState.currentFlight;
    content.innerHTML = `
      <h2 class="form-title">Payment</h2>
      <p style="font-size:13px;color:var(--muted);margin-bottom:22px">Simulated — no real transaction occurs.</p>
      <div class="payment-logos"><div class="payment-logo">Visa</div><div class="payment-logo">Mastercard</div><div class="payment-logo">Amex</div><div class="payment-logo">Wire Transfer</div></div>
      <div class="form-row">
        <div class="form-group full"><label class="form-label">Card Number</label><input class="form-input" placeholder="4242 4242 4242 4242" maxlength="19" oninput="formatCard(this)" /></div>
        <div class="form-group"><label class="form-label">Expiry</label><input class="form-input" placeholder="MM / YY" maxlength="7" /></div>
        <div class="form-group"><label class="form-label">CVV</label><input class="form-input" placeholder="•••" maxlength="4" /></div>
        <div class="form-group full"><label class="form-label">Name on Card</label><input class="form-input" placeholder="James Morgan" /></div>
      </div>
      <button class="form-next-btn" onclick="confirmBooking()">Confirm & Pay $${f.price.toLocaleString()} →</button>`;
  } else if (step === 4) {
    const id  = 'AERO-' + Math.random().toString(36).substr(2,8).toUpperCase();
    const f   = AppState.currentFlight;
    const bk  = { booking_id:id, flight_id:f.id, flight:f, name:AppState.bookingPassenger?.name, email:AppState.bookingPassenger?.email, timestamp:new Date().toISOString() };
    AppState.bookings.push(bk);
    localStorage.setItem('aero_bookings', JSON.stringify(AppState.bookings));
    submitBooking(bk);
    document.getElementById('booking-back-btn').style.display = 'none';
    content.innerHTML = `
      <div class="confirmation-center">
        <div class="confirm-icon">✦</div>
        <h2 class="confirm-title">You're Confirmed</h2>
        <p class="confirm-id">Booking Ref: ${id}</p>
        <p class="confirm-sub">Your private jet from <strong>${f.origin}</strong> to <strong>${f.destination}</strong> is reserved.<br/>Confirmation sent to ${AppState.bookingPassenger?.email||'your email'}.</p>
        <div style="margin-top:36px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
          <button class="form-next-btn" onclick="showSection('dashboard')">View My Flights</button>
          <button class="back-btn" style="margin-top:0" onclick="showSection('listings')">Browse More Jets</button>
        </div>
      </div>`;
  }
}

function nextBookingStep() {
  if (AppState.currentBookingStep === 1) {
    const first = document.getElementById('pax-first')?.value.trim();
    const last  = document.getElementById('pax-last')?.value.trim();
    const email = document.getElementById('pax-email')?.value.trim();
    if (!first || !last || !email) { showToast('Please fill in all required fields.'); return; }
    AppState.bookingPassenger = { name:`${first} ${last}`, email, phone:document.getElementById('pax-phone')?.value, passengers:document.getElementById('pax-count')?.value };
  }
  AppState.currentBookingStep++;
  renderBookingStep(AppState.currentBookingStep);
}
function confirmBooking() {
  const ci = document.querySelector('[placeholder="4242 4242 4242 4242"]');
  if (!ci || ci.value.replace(/\s/g,'').length < 16) { showToast('Please enter a valid card number.'); return; }
  AppState.currentBookingStep = 4; renderBookingStep(4);
}
async function submitBooking(b) {
  try { await fetch(API_BASE, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'bookFlight',...b}) }); } catch {}
}

// ============================================================
//  DASHBOARD
// ============================================================
function renderDashboard() {
  const up = document.getElementById('upcoming-flights');
  if (up && AppState.bookings.length > 0) {
    up.innerHTML = AppState.bookings.slice(-3).reverse().map(b => `
      <div class="rec-card" style="margin-bottom:10px">
        <div class="rec-route">${b.flight?.origin||'—'} → ${b.flight?.destination||'—'}</div>
        <div class="rec-price">${b.booking_id} · ${b.flight?.aircraft}</div>
      </div>`).join('');
  }
  const recEl = document.getElementById('recommended-flights');
  if (recEl) {
    const recs = [...AppState.flights].sort(()=>Math.random()-0.5).slice(0,4);
    recEl.innerHTML = recs.map(f => `
      <div class="rec-card" onclick="openFlight('${f.id}')">
        <div class="rec-route">${f.origin} → ${f.destination}</div>
        <div class="rec-price">From $${f.price.toLocaleString()} · ${f.aircraft}</div>
      </div>`).join('');
  }
}

// ============================================================
//  HERO — EVAPORATE TITLE
// ============================================================
function initHeroTitle() {
  const el = document.getElementById('hero-title');
  if (!el) return;
  const lines = [{ text:'AI Finds', italic:false }, { text:'Jets.', italic:true }];
  el.innerHTML = '';
  lines.forEach(line => {
    const wordEl = document.createElement('div');
    wordEl.className = 'title-word' + (line.italic ? ' italic-word' : '');
    line.text.split('').forEach((char, i) => {
      if (char === ' ') {
        const sp = document.createElement('span'); sp.className = 'title-space'; wordEl.appendChild(sp);
      } else {
        const span = document.createElement('span'); span.className = 'title-letter'; span.textContent = char;
        const rot = (Math.random() * 32 - 16).toFixed(1); span.style.setProperty('--rot', rot + 'deg');
        span.style.opacity = '0'; span.style.transform = 'translateY(28px)';
        span.style.transition = `transform 0.8s ${0.9 + i*0.042}s cubic-bezier(0.25,0.1,0.25,1), opacity 0.8s ${0.9 + i*0.042}s ease, filter 0.55s ease`;
        setTimeout(() => { span.style.opacity = ''; span.style.transform = ''; }, 60);
        wordEl.appendChild(span);
      }
    });
    el.appendChild(wordEl);
  });
  el.addEventListener('mousemove', e => {
    const letters = el.querySelectorAll('.title-letter');
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
    letters.forEach(l => {
      const lr = l.getBoundingClientRect();
      const lx = lr.left + lr.width/2 - rect.left; const ly = lr.top + lr.height/2 - rect.top;
      const dist = Math.hypot(mx - lx, my - ly);
      l.classList.toggle('evap', dist < 88 && (1 - dist/88) > 0.28);
    });
  });
  el.addEventListener('mouseleave', () => el.querySelectorAll('.title-letter').forEach(l => l.classList.remove('evap')));
}

// ============================================================
//  PARTICLE CANVAS
// ============================================================
function initParticleCanvas() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);
  const particles = Array.from({length:55}, () => mkParticle());
  function mkParticle(fromBottom=false) {
    return { x:Math.random()*window.innerWidth, y:fromBottom?window.innerHeight+10:Math.random()*window.innerHeight, size:Math.random()*1.5+0.25, speedY:-(Math.random()*0.5+0.12), speedX:(Math.random()-0.5)*0.22, opacity:Math.random()*0.5+0.08, gold:Math.random()>0.62 };
  }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach((p,i) => {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fillStyle = p.gold ? `rgba(212,174,114,${p.opacity})` : `rgba(255,255,255,${p.opacity*0.55})`;
      ctx.fill();
      p.x += p.speedX; p.y += p.speedY;
      p.opacity += (Math.random()-0.5)*0.007;
      p.opacity = Math.max(0.04, Math.min(0.62, p.opacity));
      if (p.y < -10) particles[i] = mkParticle(true);
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ============================================================
//  COUNTER ANIMATION
// ============================================================
function animateCounters() {
  document.querySelectorAll('.stat-num[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    let cur = 0; const step = Math.ceil(target/55);
    const timer = setInterval(() => {
      cur = Math.min(cur + step, target);
      el.textContent = cur + (el.dataset.count === '120' ? '+' : '');
      if (cur >= target) clearInterval(timer);
    }, 28);
  });
}

// ============================================================
//  COUNTDOWN TIMERS
// ============================================================
let _countdownRunning = false;
function initCountdowns() {
  function tick() {
    document.querySelectorAll('[data-departure]').forEach(el => {
      const dep = new Date(el.dataset.departure); const diff = dep - Date.now();
      if (diff <= 0) { el.textContent = 'Boarding'; return; }
      const h = Math.floor(diff/3600000); const m = Math.floor((diff%3600000)/60000); const s = Math.floor((diff%60000)/1000);
      el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    });
  }
  tick();
  if (!_countdownRunning) { _countdownRunning = true; setInterval(tick, 1000); }
}

// ============================================================
//  UTILITIES
// ============================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}
function formatCard(input) {
  let v = input.value.replace(/\D/g,'').substring(0,16);
  input.value = v.replace(/(.{4})/g,'$1 ').trim();
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
