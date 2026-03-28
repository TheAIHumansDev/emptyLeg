/**
 * AERO — Private Aviation
 * app.js — Frontend Logic
 *
 * Architecture:
 *   - State management via `AppState`
 *   - Fetch from Apps Script endpoints (with mock fallback)
 *   - Sections controlled by showSection()
 *   - Booking flow via currentBookingStep
 */

// ============================================================
//  CONFIG — Replace with your deployed Apps Script URL
// ============================================================
const API_BASE = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// ============================================================
//  APP STATE
// ============================================================
const AppState = {
  flights: [],
  filteredFlights: [],
  currentFlight: null,
  bookingPassenger: null,
  currentBookingStep: 1,
  bookings: JSON.parse(localStorage.getItem('aero_bookings') || '[]'),
};

// ============================================================
//  MOCK DATA (used when API is unavailable)
// ============================================================
const MOCK_FLIGHTS = [
  {
    id: 'FL001',
    origin: 'LHR', origin_full: 'London Heathrow',
    destination: 'CDG', destination_full: 'Paris Charles de Gaulle',
    aircraft: 'Bombardier Global 6000', category: 'heavy',
    departure_time: new Date(Date.now() + 3600000 * 18).toISOString(),
    duration: '1h 15m', price: 4800, original_price: 22000,
    seats: 8, region: 'europe',
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
    operator: 'Sovereign Air Group', safety_rating: 'ARGUS Platinum',
  },
  {
    id: 'FL002',
    origin: 'DXB', origin_full: 'Dubai International',
    destination: 'JFK', destination_full: 'New York JFK',
    aircraft: 'Gulfstream G700', category: 'ultra',
    departure_time: new Date(Date.now() + 3600000 * 36).toISOString(),
    duration: '14h 30m', price: 42000, original_price: 180000,
    seats: 14, region: 'mideast',
    image_url: 'https://images.unsplash.com/photo-1583791031153-d55e79f7f115?w=800&q=80',
    operator: 'Desert Wings Aviation', safety_rating: 'IS-BAO Stage III',
  },
  {
    id: 'FL003',
    origin: 'MIA', origin_full: 'Miami International',
    destination: 'LAX', destination_full: 'Los Angeles',
    aircraft: 'Citation Longitude', category: 'midsize',
    departure_time: new Date(Date.now() + 3600000 * 8).toISOString(),
    duration: '5h 20m', price: 9500, original_price: 38000,
    seats: 8, region: 'americas',
    image_url: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800&q=80',
    operator: 'Atlantic Charter Co.', safety_rating: 'ARGUS Gold',
  },
  {
    id: 'FL004',
    origin: 'CDG', origin_full: 'Paris Charles de Gaulle',
    destination: 'GVA', destination_full: 'Geneva',
    aircraft: 'Phenom 300E', category: 'light',
    departure_time: new Date(Date.now() + 3600000 * 6).toISOString(),
    duration: '1h 05m', price: 2900, original_price: 11500,
    seats: 6, region: 'europe',
    image_url: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800&q=80',
    operator: 'Riviera Jet Partners', safety_rating: 'ARGUS Platinum',
  },
  {
    id: 'FL005',
    origin: 'NBO', origin_full: 'Nairobi',
    destination: 'CPT', destination_full: 'Cape Town',
    aircraft: 'Falcon 8X', category: 'heavy',
    departure_time: new Date(Date.now() + 3600000 * 48).toISOString(),
    duration: '7h 40m', price: 19000, original_price: 72000,
    seats: 10, region: 'africa',
    image_url: 'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=800&q=80',
    operator: 'Savanna Air Executive', safety_rating: 'IS-BAO Stage II',
  },
  {
    id: 'FL006',
    origin: 'SIN', origin_full: 'Singapore Changi',
    destination: 'HND', destination_full: 'Tokyo Haneda',
    aircraft: 'Gulfstream G550', category: 'heavy',
    departure_time: new Date(Date.now() + 3600000 * 28).toISOString(),
    duration: '7h 10m', price: 26500, original_price: 95000,
    seats: 12, region: 'asia',
    image_url: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=80',
    operator: 'Pacific Prestige Aviation', safety_rating: 'ARGUS Platinum',
  },
];

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  loadFlights();
  initCountdowns();
});

function initNav() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('nav');
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
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
  // Special logic per section
  if (name === 'listings') renderFlights(AppState.filteredFlights.length ? AppState.filteredFlights : AppState.flights);
  if (name === 'dashboard') renderDashboard();
}

// ============================================================
//  DATA LOADING
// ============================================================
async function loadFlights() {
  try {
    const res = await fetch(`${API_BASE}?action=getFlights`, { mode: 'cors' });
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    AppState.flights = data.flights || MOCK_FLIGHTS;
  } catch (e) {
    // Fallback to mock data when API unreachable
    AppState.flights = MOCK_FLIGHTS;
  }
  AppState.filteredFlights = [...AppState.flights];
}

// ============================================================
//  SEARCH
// ============================================================
function handleSearch() {
  const from = document.getElementById('search-from').value.toLowerCase();
  const to   = document.getElementById('search-to').value.toLowerCase();
  const date = document.getElementById('search-date').value;

  AppState.filteredFlights = AppState.flights.filter(f => {
    const matchFrom = !from || f.origin.toLowerCase().includes(from) || f.origin_full.toLowerCase().includes(from);
    const matchTo   = !to   || f.destination.toLowerCase().includes(to) || f.destination_full.toLowerCase().includes(to);
    const matchDate = !date || new Date(f.departure_time).toDateString() === new Date(date).toDateString();
    return matchFrom && matchTo && matchDate;
  });

  showSection('listings');
  showToast(`Found ${AppState.filteredFlights.length} available flights`);
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
    if (price === 'mid')  ok = ok && f.price >= 5000  && f.price < 15000;
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
  if (!flights || flights.length === 0) {
    grid.innerHTML = `<div style="color:var(--muted);font-size:14px;padding:40px 0;grid-column:1/-1">
      No flights match your criteria. <span class="link-gold" onclick="resetFilters()">Clear filters →</span>
    </div>`;
    return;
  }

  grid.innerHTML = flights.map(f => {
    const dep   = new Date(f.departure_time);
    const timeStr = dep.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
    const dateStr = dep.toLocaleDateString('en-GB', { month:'short', day:'numeric' });
    const discount = Math.round((1 - f.price / f.original_price) * 100);
    const hoursLeft = Math.floor((dep - Date.now()) / 3600000);
    const urgent = hoursLeft < 12;

    return `
      <div class="flight-card" onclick="openFlight('${f.id}')">
        <div class="card-image">
          <img src="${f.image_url}" alt="${f.origin}-${f.destination}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80'" />
          <div class="card-badge">-${discount}%</div>
          ${urgent ? `<div class="card-urgency"><span class="urgency-dot"></span>${hoursLeft}h left</div>` : ''}
        </div>
        <div class="card-body">
          <div class="card-route">
            ${f.origin}
            <span class="card-route-arrow">→</span>
            ${f.destination}
          </div>
          <div class="card-aircraft">${f.aircraft}</div>
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

  // Start countdown timers for rendered cards
  initCountdowns();
}

function resetFilters() {
  document.getElementById('filter-price').value    = '';
  document.getElementById('filter-aircraft').value = '';
  document.getElementById('filter-region').value   = '';
  AppState.filteredFlights = [...AppState.flights];
  renderFlights(AppState.filteredFlights);
}

// ============================================================
//  OPEN FLIGHT DETAILS
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

  if (!flight) return showToast('Flight not found.');
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
      <img src="${f.image_url}" alt="${f.aircraft}" onerror="this.src='https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80'" />
      <div class="details-hero-overlay">
        <div class="details-route">${f.origin} <span>→</span> ${f.destination}</div>
      </div>
    </div>

    <div class="details-grid">
      <div>
        <div class="details-info-card" style="margin-bottom:20px">
          <div class="details-label">Route</div>
          <div class="details-value">${f.origin_full} → ${f.destination_full}</div>
          <div class="details-label">Departure</div>
          <div class="details-value">${timeStr}</div>
          <div class="details-label">Flight Duration</div>
          <div class="details-value">${f.duration}</div>
        </div>

        <div class="details-info-card">
          <div class="details-label">Aircraft Specifications</div>
          <div class="spec-grid" style="margin-top:12px">
            <div class="spec-item">
              <div class="details-label">Type</div>
              <div class="details-value" style="font-size:14px">${f.aircraft}</div>
            </div>
            <div class="spec-item">
              <div class="details-label">Class</div>
              <div class="details-value" style="font-size:14px;text-transform:capitalize">${f.category} Jet</div>
            </div>
            <div class="spec-item">
              <div class="details-label">Capacity</div>
              <div class="details-value" style="font-size:14px">${f.seats} passengers</div>
            </div>
            <div class="spec-item">
              <div class="details-label">Safety Rating</div>
              <div class="details-value" style="font-size:14px">${f.safety_rating}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="pricing-card">
        <div class="details-label" style="margin-bottom:20px">Pricing Breakdown</div>

        <div class="pricing-row">
          <span>Charter rate</span>
          <span style="text-decoration:line-through">$${f.original_price.toLocaleString()}</span>
        </div>
        <div class="pricing-row">
          <span>Empty leg discount (${discount}%)</span>
          <span style="color:#4ade80">–$${(f.original_price - f.price - taxes).toLocaleString()}</span>
        </div>
        <div class="pricing-row">
          <span>Taxes & fees</span>
          <span>$${taxes.toLocaleString()}</span>
        </div>

        <div class="pricing-total">
          <span class="pricing-total-label">Total</span>
          <span class="pricing-total-amount">$${f.price.toLocaleString()}</span>
        </div>

        <button class="book-btn" onclick="startBooking()">Reserve This Flight</button>

        <div class="operator-row">
          <span class="operator-dot"></span>
          <span>Operated by ${f.operator}</span>
        </div>
        <div style="margin-top:8px;font-size:10px;color:var(--muted);letter-spacing:0.1em">
          Certified · ${f.safety_rating} · Fully insured
        </div>
      </div>
    </div>`;
}

// ============================================================
//  BOOKING FLOW
// ============================================================
function startBooking() {
  AppState.currentBookingStep = 1;
  showSection('booking');
  document.getElementById('booking-back-btn').style.display = 'block';
  renderBookingStep(1);
}

function renderBookingStep(step) {
  // Update step indicators
  document.querySelectorAll('.step').forEach(s => {
    const n = parseInt(s.dataset.step);
    s.classList.toggle('active', n === step);
    s.classList.toggle('done',   n < step);
  });

  const content = document.getElementById('booking-step-content');

  if (step === 1) {
    content.innerHTML = `
      <h2 class="form-title">Passenger Details</h2>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">First Name</label>
          <input type="text" class="form-input" id="pax-first" placeholder="James" />
        </div>
        <div class="form-group">
          <label class="form-label">Last Name</label>
          <input type="text" class="form-input" id="pax-last" placeholder="Morgan" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" id="pax-email" placeholder="james@example.com" />
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input type="tel" class="form-input" id="pax-phone" placeholder="+1 212 000 0000" />
        </div>
        <div class="form-group full">
          <label class="form-label">Passport / ID Number</label>
          <input type="text" class="form-input" id="pax-passport" placeholder="AB1234567" />
        </div>
        <div class="form-group">
          <label class="form-label">Nationality</label>
          <input type="text" class="form-input" id="pax-nationality" placeholder="British" />
        </div>
        <div class="form-group">
          <label class="form-label">Passengers</label>
          <select class="form-input" id="pax-count">
            <option>1</option><option>2</option><option>3</option>
            <option>4</option><option>5</option><option>6</option>
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
      <h2 class="form-title">Review Your Flight</h2>
      <div class="review-card">
        <div class="review-row"><span>Route</span><span>${f.origin} → ${f.destination}</span></div>
        <div class="review-row"><span>Aircraft</span><span>${f.aircraft}</span></div>
        <div class="review-row"><span>Departure</span><span>${timeStr}</span></div>
        <div class="review-row"><span>Duration</span><span>${f.duration}</span></div>
        <div class="review-row"><span>Passenger</span><span>${AppState.bookingPassenger?.name || '—'}</span></div>
        <div class="review-row"><span>Email</span><span>${AppState.bookingPassenger?.email || '—'}</span></div>
        <div class="review-row">
          <span style="font-size:14px;color:var(--white)">Total</span>
          <span style="color:var(--gold-light);font-family:var(--font-display);font-size:22px">$${f.price.toLocaleString()}</span>
        </div>
      </div>
      <button class="form-next-btn" onclick="nextBookingStep()">Proceed to Payment →</button>`;
  }

  else if (step === 3) {
    const f = AppState.currentFlight;
    content.innerHTML = `
      <h2 class="form-title">Payment</h2>
      <p style="font-size:13px;color:var(--muted);margin-bottom:28px">This is a simulated payment. No real transaction will occur.</p>
      <div class="payment-logos">
        <div class="payment-logo">Visa</div>
        <div class="payment-logo">Mastercard</div>
        <div class="payment-logo">Amex</div>
        <div class="payment-logo">Wire Transfer</div>
      </div>
      <div class="form-row">
        <div class="form-group full">
          <label class="form-label">Card Number</label>
          <input type="text" class="form-input" placeholder="4242 4242 4242 4242" maxlength="19" oninput="formatCard(this)" />
        </div>
        <div class="form-group">
          <label class="form-label">Expiry</label>
          <input type="text" class="form-input" placeholder="MM / YY" maxlength="7" />
        </div>
        <div class="form-group">
          <label class="form-label">CVV</label>
          <input type="text" class="form-input" placeholder="•••" maxlength="4" />
        </div>
        <div class="form-group full">
          <label class="form-label">Name on Card</label>
          <input type="text" class="form-input" placeholder="James Morgan" />
        </div>
      </div>
      <button class="form-next-btn" onclick="confirmBooking()">Confirm & Pay $${f.price.toLocaleString()} →</button>`;
  }

  else if (step === 4) {
    const bookingId = 'AERO-' + Math.random().toString(36).substr(2,8).toUpperCase();
    const f = AppState.currentFlight;

    // Save booking
    const booking = {
      booking_id: bookingId,
      flight_id: f.id,
      flight: f,
      name: AppState.bookingPassenger?.name,
      email: AppState.bookingPassenger?.email,
      timestamp: new Date().toISOString(),
    };
    AppState.bookings.push(booking);
    localStorage.setItem('aero_bookings', JSON.stringify(AppState.bookings));

    // Post to backend
    submitBooking(booking);

    document.getElementById('booking-back-btn').style.display = 'none';
    content.innerHTML = `
      <div class="confirmation-center">
        <div class="confirm-icon">✦</div>
        <h2 class="confirm-title">You're Confirmed</h2>
        <p class="confirm-id">Booking Ref: ${bookingId}</p>
        <p class="confirm-sub">
          Your flight from <strong>${f.origin}</strong> to <strong>${f.destination}</strong> is reserved.<br/>
          A confirmation has been sent to ${AppState.bookingPassenger?.email || 'your email'}.
        </p>
        <div style="margin-top:40px;display:flex;gap:16px;justify-content:center">
          <button class="form-next-btn" onclick="showSection('dashboard')">View My Flights</button>
          <button class="back-btn" style="margin-top:0" onclick="showSection('listings')">Browse More Flights</button>
        </div>
      </div>`;
  }
}

function nextBookingStep() {
  if (AppState.currentBookingStep === 1) {
    const first = document.getElementById('pax-first')?.value;
    const last  = document.getElementById('pax-last')?.value;
    const email = document.getElementById('pax-email')?.value;

    if (!first || !last || !email) {
      showToast('Please fill in all required fields.');
      return;
    }
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
  if (!cardInput || cardInput.value.replace(/\s/g,'').length < 16) {
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
  } catch (e) {
    // Silent fail — booking already saved locally
  }
}

// ============================================================
//  DASHBOARD
// ============================================================
function renderDashboard() {
  // Upcoming flights
  const upcoming = document.getElementById('upcoming-flights');
  if (AppState.bookings.length > 0) {
    upcoming.innerHTML = AppState.bookings.map(b => `
      <div class="rec-card" style="margin-bottom:12px">
        <div class="rec-route">${b.flight?.origin || '—'} → ${b.flight?.destination || '—'}</div>
        <div class="rec-price">${b.booking_id} · ${b.flight?.aircraft}</div>
      </div>`).join('');
  }

  // Recommendations (random subset)
  const recs = [...AppState.flights].sort(() => Math.random() - 0.5).slice(0, 4);
  document.getElementById('recommended-flights').innerHTML = recs.map(f => `
    <div class="rec-card" onclick="openFlight('${f.id}')">
      <div class="rec-route">${f.origin} → ${f.destination}</div>
      <div class="rec-price">From $${f.price.toLocaleString()} · ${f.aircraft}</div>
    </div>`).join('');
}

// ============================================================
//  COUNTDOWN TIMERS
// ============================================================
function initCountdowns() {
  function tick() {
    document.querySelectorAll('[data-departure]').forEach(el => {
      const dep = new Date(el.dataset.departure);
      const diff = dep - Date.now();
      if (diff <= 0) { el.textContent = 'Boarding'; return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    });
  }
  tick();
  setInterval(tick, 1000);
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
