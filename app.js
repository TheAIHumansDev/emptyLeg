/**
 * AERO — AI Private Jet Finder
 * app.js — Complete Frontend Logic
 *
 * Features:
 *  - Evaporate/dissolve effect on hero title (mouse proximity)
 *  - Animated particle canvas
 *  - Counter animation on stats
 *  - Countdown timers
 *  - Full booking flow
 *  - Apps Script API with mock fallback
 */

// ============================================================
//  CONFIG
// ============================================================
const API_BASE = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

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
  titleEvapTimer: null,
};

// ============================================================
//  MOCK DATA — All private jets, no commercial aircraft
// ============================================================
const MOCK_FLIGHTS = [
  {
    id: 'FL001',
    origin: 'LHR', origin_full: 'London Heathrow',
    destination: 'CDG', destination_full: 'Paris Le Bourget',
    aircraft: 'Bombardier Global 6000',
    category: 'heavy', region: 'europe',
    departure_time: new Date(Date.now() + 3600000 * 18).toISOString(),
    duration: '1h 15m', price: 4800, original_price: 22000, seats: 8,
    image_url: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=900&q=80',
    operator: 'Sovereign Air Group', safety_rating: 'ARGUS Platinum',
  },
  {
    id: 'FL002',
    origin: 'DXB', origin_full: 'Dubai Al Maktoum',
    destination: 'JFK', destination_full: 'New York Teterboro',
    aircraft: 'Gulfstream G700',
    category: 'ultra', region: 'mideast',
    departure_time: new Date(Date.now() + 3600000 * 36).toISOString(),
    duration: '14h 30m', price: 42000, original_price: 185000, seats: 14,
    image_url: 'https://images.unsplash.com/photo-1583791031153-d55e79f7f115?w=900&q=80',
    operator: 'Desert Wings Aviation', safety_rating: 'IS-BAO Stage III',
  },
  {
    id: 'FL003',
    origin: 'MIA', origin_full: 'Miami Opa-locka',
    destination: 'LAX', destination_full: 'Los Angeles Van Nuys',
    aircraft: 'Cessna Citation Longitude',
    category: 'midsize', region: 'americas',
    departure_time: new Date(Date.now() + 3600000 * 8).toISOString(),
    duration: '5h 20m', price: 9500, original_price: 38000, seats: 8,
    image_url: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=900&q=80',
    operator: 'Atlantic Charter Co.', safety_rating: 'ARGUS Gold',
  },
  {
    id: 'FL004',
    origin: 'CDG', origin_full: 'Paris Le Bourget',
    destination: 'GVA', destination_full: 'Geneva Cointrin',
    aircraft: 'Embraer Phenom 300E',
    category: 'light', region: 'europe',
    departure_time: new Date(Date.now() + 3600000 * 6).toISOString(),
    duration: '1h 05m', price: 2900, original_price: 11500, seats: 6,
    image_url: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=900&q=80',
    operator: 'Riviera Jet Partners', safety_rating: 'ARGUS Platinum',
  },
  {
    id: 'FL005',
    origin: 'SIN', origin_full: 'Singapore Seletar',
    destination: 'HND', destination_full: 'Tokyo Haneda',
    aircraft: 'Gulfstream G550',
    category: 'heavy', region: 'asia',
    departure_time: new Date(Date.now() + 3600000 * 28).toISOString(),
    duration: '7h 10m', price: 26500, original_price: 95000, seats: 12,
    image_url: 'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=900&q=80',
    operator: 'Pacific Prestige Aviation', safety_rating: 'ARGUS Platinum',
  },
  {
    id: 'FL006',
    origin: 'NBO', origin_full: 'Nairobi Wilson Airport',
    destination: 'CPT', destination_full: 'Cape Town Stellenbosch',
    aircraft: 'Dassault Falcon 8X',
    category: 'heavy', region: 'africa',
    departure_time: new Date(Date.now() + 3600000 * 48).toISOString(),
    duration: '7h 40m', price: 19000, original_price: 72000, seats: 10,
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&q=80',
    operator: 'Savanna Air Executive', safety_rating: 'IS-BAO Stage II',
  },
  {
    id: 'FL007',
    origin: 'AMS', origin_full: 'Amsterdam Lelystad',
    destination: 'BCN', destination_full: 'Barcelona Sabadell',
    aircraft: 'HondaJet Elite II',
    category: 'light', region: 'europe',
    departure_time: new Date(Date.now() + 3600000 * 10).toISOString(),
    duration: '2h 30m', price: 3400, original_price: 14000, seats: 5,
    image_url: 'https://images.unsplash.com/photo-1606768666853-403c90a981ad?w=900&q=80',
    operator: 'Benelux Air Charter', safety_rating: 'ARGUS Gold',
  },
  {
    id: 'FL008',
    origin: 'SYD', origin_full: 'Sydney Bankstown',
    destination: 'BKK', destination_full: 'Bangkok Don Mueang',
    aircraft: 'Bombardier Challenger 650',
    category: 'midsize', region: 'asia',
    departure_time: new Date(Date.now() + 3600000 * 52).toISOString(),
    duration: '9h 50m', price: 31000, original_price: 110000, seats: 10,
    image_url: 'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=900&q=80',
    operator: 'Southern Cross Jet', safety_rating: 'IS-BAO Stage III',
  },
  {
    id: 'FL009',
    origin: 'TEB', origin_full: 'New York Teterboro',
    destination: 'MIA', destination_full: 'Miami Opa-locka',
    aircraft: 'Gulfstream G450',
    category: 'heavy', region: 'americas',
    departure_time: new Date(Date.now() + 3600000 * 5).toISOString(),
    duration: '2h 55m', price: 11500, original_price: 44000, seats: 12,
    image_url: 'https://images.unsplash.com/photo-1615813967515-e1838c1c5116?w=900&q=80',
    operator: 'Northeast Jet Group', safety_rating: 'ARGUS Platinum',
  },
];

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
});

// ============================================================
//  NAV
// ============================================================
function initNav() {
  const nav = document.getElementById('nav');
  nav.classList.add('hero-nav'); // white mode over video

  window.addEventListener('scroll', () => {
    const heroActive = document.getElementById('section-hero').classList.contains('active');
    nav.classList.toggle('scrolled', window.scrollY > 50);
    if (!heroActive) {
      nav.classList.remove('hero-nav');
      nav.classList.add('solid');
    }
  });
}

function updateNavForSection(name) {
  const nav = document.getElementById('nav');
  if (name === 'hero') {
    nav.classList.add('hero-nav');
    nav.classList.remove('solid');
  } else {
    nav.classList.remove('hero-nav');
    nav.classList.add('solid');
  }
}

// ============================================================
//  SECTION NAVIGATION
// ============================================================
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`section-${name}`);
  if (el) {
    el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  updateNavForSection(name);
  if (name === 'listings') renderFlights(AppState.filteredFlights.length ? AppState.filteredFlights : AppState.flights);
  if (name === 'dashboard') renderDashboard();
  if (name === 'hero') { animateCounters(); setTimeout(initCountdowns, 100); }
}

// ============================================================
//  EVAPORATE TITLE EFFECT
// ============================================================
function initHeroTitle() {
  const el = document.getElementById('hero-title');
  if (!el) return;

  // Two lines: "AI Finds" (normal) + "Jets." (italic)
  const lines = [
    { text: 'AI Finds', italic: false },
    { text: 'Jets.', italic: true },
  ];

  el.innerHTML = '';

  lines.forEach(line => {
    const wordEl = document.createElement('div');
    wordEl.className = 'title-word' + (line.italic ? ' italic-word' : '');

    line.text.split('').forEach((char, i) => {
      if (char === ' ') {
        const sp = document.createElement('span');
        sp.className = 'title-space';
        wordEl.appendChild(sp);
      } else {
        const span = document.createElement('span');
        span.className = 'title-letter';
        span.textContent = char;
        // Random rotation for evaporate
        const rot = (Math.random() * 30 - 15).toFixed(1);
        span.style.setProperty('--rot', rot + 'deg');
        // Staggered entrance animation
        span.style.opacity = '0';
        span.style.transform = 'translateY(30px)';
        span.style.transition = `transform 0.8s ${0.9 + i * 0.04}s cubic-bezier(0.25,0.1,0.25,1), opacity 0.8s ${0.9 + i * 0.04}s ease, filter 0.6s ease, color 0.6s ease`;
        setTimeout(() => {
          span.style.opacity = '';
          span.style.transform = '';
        }, 50);
        wordEl.appendChild(span);
      }
    });

    el.appendChild(wordEl);
  });

  // Mouse proximity evaporate
  el.addEventListener('mousemove', e => {
    const letters = el.querySelectorAll('.title-letter');
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    letters.forEach(letter => {
      const lr = letter.getBoundingClientRect();
      const lx = lr.left + lr.width / 2 - rect.left;
      const ly = lr.top + lr.height / 2 - rect.top;
      const dist = Math.hypot(mx - lx, my - ly);
      const threshold = 90;

      if (dist < threshold) {
        const intensity = 1 - (dist / threshold);
        if (intensity > 0.3) {
          letter.classList.add('evap');
        }
      } else {
        letter.classList.remove('evap');
      }
    });
  });

  el.addEventListener('mouseleave', () => {
    el.querySelectorAll('.title-letter').forEach(l => l.classList.remove('evap'));
  });
}

// ============================================================
//  PARTICLE CANVAS
// ============================================================
function initParticleCanvas() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = Array.from({ length: 55 }, () => createParticle());

  function createParticle(fromBottom = false) {
    return {
      x: Math.random() * window.innerWidth,
      y: fromBottom ? window.innerHeight + 10 : Math.random() * window.innerHeight,
      size: Math.random() * 1.4 + 0.3,
      speedY: -(Math.random() * 0.5 + 0.15),
      speedX: (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.5 + 0.1,
      gold: Math.random() > 0.65,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.gold
        ? `rgba(212,174,114,${p.opacity})`
        : `rgba(255,255,255,${p.opacity * 0.6})`;
      ctx.fill();

      p.x += p.speedX;
      p.y += p.speedY;
      p.opacity += (Math.random() - 0.5) * 0.008;
      p.opacity = Math.max(0.05, Math.min(0.65, p.opacity));

      if (p.y < -10) {
        particles[i] = createParticle(true);
      }
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
    let current = 0;
    const step = Math.ceil(target / 55);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + (el.dataset.count === '120' ? '+' : '');
      if (current >= target) clearInterval(timer);
    }, 28);
  });
}

// ============================================================
//  DATA LOADING
// ============================================================
async function loadFlights() {
  try {
    const res = await fetch(`${API_BASE}?action=getFlights`, { mode: 'cors' });
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    AppState.flights = data.flights?.length ? data.flights : MOCK_FLIGHTS;
  } catch (e) {
    AppState.flights = MOCK_FLIGHTS;
  }
  AppState.filteredFlights = [...AppState.flights];
}

// ============================================================
//  SEARCH
// ============================================================
function handleSearch() {
  const from = document.getElementById('search-from').value.trim().toLowerCase();
  const to   = document.getElementById('search-to').value.trim().toLowerCase();
  const date = document.getElementById('search-date').value;

  AppState.filteredFlights = AppState.flights.filter(f => {
    const mFrom = !from || f.origin.toLowerCase().includes(from) || f.origin_full.toLowerCase().includes(from);
    const mTo   = !to   || f.destination.toLowerCase().includes(to) || f.destination_full.toLowerCase().includes(to);
    const mDate = !date || new Date(f.departure_time).toDateString() === new Date(date).toDateString();
    return mFrom && mTo && mDate;
  });

  showSection('listings');
  showToast(`${AppState.filteredFlights.length} private jets found`);
}

// ============================================================
//  FILTERS
// ============================================================
function applyFilters() {
  const price    = document.getElementById('filter-price').value;
  const aircraft = document.getElementById('filter-aircraft').value;
  const region   = document.getElementById('filter-region').value;

  AppState.filteredFlights = AppState.flights.filter(f => {
    let ok = true;
    if (price === 'low')  ok = ok && f.price < 5000;
    if (price === 'mid')  ok = ok && f.price >= 5000 && f.price < 15000;
    if (price === 'high') ok = ok && f.price >= 15000;
    if (aircraft) ok = ok && f.category === aircraft;
    if (region)   ok = ok && f.region === region;
    return ok;
  });

  renderFlights(AppState.filteredFlights);
}

// ============================================================
//  RENDER FLIGHTS GRID
// ============================================================
function renderFlights(flights) {
  const grid = document.getElementById('flights-grid');
  if (!grid) return;

  if (!flights || flights.length === 0) {
    grid.innerHTML = `<div style="color:var(--muted);font-size:14px;padding:40px 0;grid-column:1/-1">
      No private jets match your criteria. <span class="link-accent" onclick="resetFilters()" style="cursor:pointer">Clear filters →</span>
    </div>`;
    return;
  }

  grid.innerHTML = flights.map(f => {
    const dep      = new Date(f.departure_time);
    const timeStr  = dep.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const dateStr  = dep.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    const discount = Math.round((1 - f.price / f.original_price) * 100);
    const hoursLeft = Math.floor((dep - Date.now()) / 3600000);
    const urgent   = hoursLeft < 12 && hoursLeft > 0;

    return `<div class="flight-card" onclick="openFlight('${f.id}')">
      <div class="card-image">
        <img src="${f.image_url}" alt="${f.aircraft}" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&q=80'" />
        <div class="card-badge">−${discount}%</div>
        ${urgent ? `<div class="card-urgency"><span class="urgency-dot"></span>${hoursLeft}h left</div>` : ''}
      </div>
      <div class="card-body">
        <div class="card-route">
          ${f.origin}
          <span class="card-route-arrow">→</span>
          ${f.destination}
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

  initCountdowns();

  // Stagger card entrance
  grid.querySelectorAll('.flight-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(16px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.35s ease, border-color 0.35s ease';
      card.style.opacity    = '1';
      card.style.transform  = 'translateY(0)';
    }, i * 60);
  });
}

function resetFilters() {
  ['filter-price','filter-aircraft','filter-region'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  AppState.filteredFlights = [...AppState.flights];
  renderFlights(AppState.filteredFlights);
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
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
      flight = data.flight;
    } catch (e) {
      flight = MOCK_FLIGHTS.find(f => f.id === id);
    }
  }

  if (!flight) { showToast('Jet not found.'); return; }
  AppState.currentFlight = flight;
  renderDetails(flight);
  showSection('details');
}

function renderDetails(f) {
  const dep      = new Date(f.departure_time);
  const timeStr  = dep.toLocaleString('en-GB', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  const discount = Math.round((1 - f.price / f.original_price) * 100);
  const taxes    = Math.round(f.price * 0.08);

  document.getElementById('details-container').innerHTML = `
    <div class="details-hero">
      <img src="${f.image_url}" alt="${f.aircraft}"
        onerror="this.src='https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&q=80'" />
      <div class="details-hero-overlay">
        <div class="details-route">${f.origin} <span>→</span> ${f.destination}</div>
      </div>
    </div>

    <div class="details-grid">
      <div>
        <div class="details-info-card" style="margin-bottom:18px">
          <div class="details-label">Route</div>
          <div class="details-value">${f.origin_full} → ${f.destination_full}</div>
          <div class="details-label">Departure</div>
          <div class="details-value">${timeStr}</div>
          <div class="details-label">Flight Duration</div>
          <div class="details-value">${f.duration}</div>
        </div>
        <div class="details-info-card">
          <div class="details-label">Private Jet Specifications</div>
          <div class="spec-grid">
            <div><div class="details-label">Aircraft</div><div class="details-value" style="font-size:14px">${f.aircraft}</div></div>
            <div><div class="details-label">Class</div><div class="details-value" style="font-size:14px">${capitalize(f.category)} Jet</div></div>
            <div><div class="details-label">Max Passengers</div><div class="details-value" style="font-size:14px">${f.seats} seats</div></div>
            <div><div class="details-label">Safety Certification</div><div class="details-value" style="font-size:14px">${f.safety_rating}</div></div>
          </div>
        </div>
      </div>

      <div class="pricing-card">
        <div class="details-label" style="margin-bottom:20px">Pricing Breakdown</div>
        <div class="pricing-row">
          <span>Full charter rate</span>
          <span style="text-decoration:line-through;color:var(--muted)">$${f.original_price.toLocaleString()}</span>
        </div>
        <div class="pricing-row">
          <span>Empty leg savings (${discount}%)</span>
          <span style="color:#16a34a">−$${(f.original_price - f.price - taxes).toLocaleString()}</span>
        </div>
        <div class="pricing-row">
          <span>Taxes & landing fees</span>
          <span>$${taxes.toLocaleString()}</span>
        </div>
        <div class="pricing-total">
          <span class="pricing-total-label">Total</span>
          <span class="pricing-total-amount">$${f.price.toLocaleString()}</span>
        </div>
        <button class="book-btn" onclick="startBooking()">Reserve This Jet</button>
        <div class="operator-row">
          <span class="operator-dot"></span>
          <span>Operated by ${f.operator}</span>
        </div>
        <div style="margin-top:6px;font-size:10px;color:var(--muted);letter-spacing:0.1em">
          ${f.safety_rating} · Fully insured · Part 135 certified
        </div>
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
    s.classList.toggle('done', n < step);
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
        <div class="form-group full"><label class="form-label">Passport / ID Number</label><input class="form-input" id="pax-passport" placeholder="AB1234567" /></div>
        <div class="form-group"><label class="form-label">Nationality</label><input class="form-input" id="pax-nationality" placeholder="British" /></div>
        <div class="form-group"><label class="form-label">Passengers</label>
          <select class="form-input" id="pax-count">
            <option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option>
          </select>
        </div>
      </div>
      <button class="form-next-btn" onclick="nextBookingStep()">Continue →</button>`;
  }

  else if (step === 2) {
    const f = AppState.currentFlight;
    const dep = new Date(f.departure_time);
    const timeStr = dep.toLocaleString('en-GB', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    content.innerHTML = `
      <h2 class="form-title">Review Your Jet</h2>
      <div class="review-card">
        <div class="review-row"><span>Route</span><span>${f.origin} → ${f.destination}</span></div>
        <div class="review-row"><span>Aircraft</span><span>${f.aircraft}</span></div>
        <div class="review-row"><span>Departure</span><span>${timeStr}</span></div>
        <div class="review-row"><span>Duration</span><span>${f.duration}</span></div>
        <div class="review-row"><span>Passenger</span><span>${AppState.bookingPassenger?.name || '—'}</span></div>
        <div class="review-row"><span>Email</span><span>${AppState.bookingPassenger?.email || '—'}</span></div>
        <div class="review-row">
          <span style="font-size:14px;color:var(--ink)">Total Due</span>
          <span style="color:var(--gold);font-family:var(--font-display);font-size:24px">$${f.price.toLocaleString()}</span>
        </div>
      </div>
      <button class="form-next-btn" onclick="nextBookingStep()">Proceed to Payment →</button>`;
  }

  else if (step === 3) {
    const f = AppState.currentFlight;
    content.innerHTML = `
      <h2 class="form-title">Payment</h2>
      <p style="font-size:13px;color:var(--muted);margin-bottom:24px">Simulated payment — no real transaction will occur.</p>
      <div class="payment-logos">
        <div class="payment-logo">Visa</div>
        <div class="payment-logo">Mastercard</div>
        <div class="payment-logo">Amex</div>
        <div class="payment-logo">Wire Transfer</div>
      </div>
      <div class="form-row">
        <div class="form-group full"><label class="form-label">Card Number</label><input class="form-input" placeholder="4242 4242 4242 4242" maxlength="19" oninput="formatCard(this)" /></div>
        <div class="form-group"><label class="form-label">Expiry</label><input class="form-input" placeholder="MM / YY" maxlength="7" /></div>
        <div class="form-group"><label class="form-label">CVV</label><input class="form-input" placeholder="•••" maxlength="4" /></div>
        <div class="form-group full"><label class="form-label">Name on Card</label><input class="form-input" placeholder="James Morgan" /></div>
      </div>
      <button class="form-next-btn" onclick="confirmBooking()">Confirm & Pay $${f.price.toLocaleString()} →</button>`;
  }

  else if (step === 4) {
    const bookingId = 'AERO-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const f = AppState.currentFlight;
    const booking = {
      booking_id: bookingId,
      flight_id: f.id, flight: f,
      name: AppState.bookingPassenger?.name,
      email: AppState.bookingPassenger?.email,
      timestamp: new Date().toISOString(),
    };
    AppState.bookings.push(booking);
    localStorage.setItem('aero_bookings', JSON.stringify(AppState.bookings));
    submitBooking(booking);

    document.getElementById('booking-back-btn').style.display = 'none';
    content.innerHTML = `
      <div class="confirmation-center">
        <div class="confirm-icon">✦</div>
        <h2 class="confirm-title">You're Confirmed</h2>
        <p class="confirm-id">Booking Reference: ${bookingId}</p>
        <p class="confirm-sub">
          Your private jet from <strong>${f.origin}</strong> to <strong>${f.destination}</strong> is reserved.<br/>
          Confirmation sent to ${AppState.bookingPassenger?.email || 'your email'}.
        </p>
        <div style="margin-top:40px;display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
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
    AppState.bookingPassenger = {
      name: `${first} ${last}`,
      email,
      phone: document.getElementById('pax-phone')?.value,
      passport: document.getElementById('pax-passport')?.value,
      passengers: document.getElementById('pax-count')?.value,
    };
  }
  AppState.currentBookingStep++;
  renderBookingStep(AppState.currentBookingStep);
}

function confirmBooking() {
  const cardInput = document.querySelector('[placeholder="4242 4242 4242 4242"]');
  if (!cardInput || cardInput.value.replace(/\s/g, '').length < 16) {
    showToast('Please enter a valid card number.');
    return;
  }
  AppState.currentBookingStep = 4;
  renderBookingStep(4);
}

async function submitBooking(booking) {
  try {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bookFlight', ...booking }),
    });
  } catch (e) { /* silent — saved locally */ }
}

// ============================================================
//  DASHBOARD
// ============================================================
function renderDashboard() {
  const upcoming = document.getElementById('upcoming-flights');
  if (upcoming) {
    if (AppState.bookings.length > 0) {
      upcoming.innerHTML = AppState.bookings.slice(-3).reverse().map(b => `
        <div class="rec-card" style="margin-bottom:10px">
          <div class="rec-route">${b.flight?.origin || '—'} → ${b.flight?.destination || '—'}</div>
          <div class="rec-price">${b.booking_id} · ${b.flight?.aircraft}</div>
        </div>`).join('');
    }
  }
  const recs = [...AppState.flights].sort(() => Math.random() - 0.5).slice(0, 4);
  const recEl = document.getElementById('recommended-flights');
  if (recEl) {
    recEl.innerHTML = recs.map(f => `
      <div class="rec-card" onclick="openFlight('${f.id}')">
        <div class="rec-route">${f.origin} → ${f.destination}</div>
        <div class="rec-price">From $${f.price.toLocaleString()} · ${f.aircraft}</div>
      </div>`).join('');
  }
}

// ============================================================
//  COUNTDOWN TIMERS
// ============================================================
function initCountdowns() {
  let running = false;
  function tick() {
    document.querySelectorAll('[data-departure]').forEach(el => {
      const dep  = new Date(el.dataset.departure);
      const diff = dep - Date.now();
      if (diff <= 0) { el.textContent = 'Boarding'; return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    });
  }
  tick();
  if (!running) { running = true; setInterval(tick, 1000); }
}

// ============================================================
//  UTILITIES
// ============================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

function formatCard(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}
