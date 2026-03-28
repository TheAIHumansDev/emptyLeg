/**
 * AERO — Private Aviation
 * apps_script_backend.gs — Google Apps Script Backend
 *
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Sheet structure:
 *   "Flights"  — flight inventory
 *   "Bookings" — reservation records
 */

// ============================================================
//  SHEET NAMES
// ============================================================
const FLIGHTS_SHEET  = 'Flights';
const BOOKINGS_SHEET = 'Bookings';

// ============================================================
//  CORS HEADERS — Required for browser fetch()
// ============================================================
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type':                 'application/json',
  };
}

// ============================================================
//  doGet — Handle GET requests
// ============================================================
function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || '';

  let result;

  try {
    switch (action) {
      case 'getFlights':
        result = getFlights(params);
        break;
      case 'getFlightById':
        result = getFlightById(params.id);
        break;
      default:
        result = { error: 'Unknown action', available: ['getFlights', 'getFlightById'] };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  doPost — Handle POST requests (bookings)
// ============================================================
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Invalid JSON body' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const action = body.action || '';
  let result;

  try {
    switch (action) {
      case 'bookFlight':
        result = bookFlight(body);
        break;
      default:
        result = { error: 'Unknown action' };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  getFlights — Return all flights, optionally filtered
//  Params: origin, destination, date
// ============================================================
function getFlights(params) {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const sheet  = ss.getSheetByName(FLIGHTS_SHEET);

  if (!sheet) return { error: 'Flights sheet not found. Run initializeSheets() first.' };

  const data   = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows    = data.slice(1);

  let flights = rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  }).filter(f => f.id); // Skip empty rows

  // Optional filtering
  if (params.origin)      flights = flights.filter(f => f.origin?.toUpperCase() === params.origin.toUpperCase());
  if (params.destination) flights = flights.filter(f => f.destination?.toUpperCase() === params.destination.toUpperCase());
  if (params.date) {
    const d = new Date(params.date).toDateString();
    flights = flights.filter(f => new Date(f.departure_time).toDateString() === d);
  }

  return { flights, count: flights.length };
}

// ============================================================
//  getFlightById — Return a single flight by ID
// ============================================================
function getFlightById(id) {
  if (!id) return { error: 'Missing id parameter' };

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(FLIGHTS_SHEET);
  if (!sheet) return { error: 'Flights sheet not found' };

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows    = data.slice(1);

  for (const row of rows) {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    if (obj.id === id) return { flight: obj };
  }

  return { error: `Flight ${id} not found` };
}

// ============================================================
//  bookFlight — Write booking to Bookings sheet
// ============================================================
function bookFlight(body) {
  const { flight_id, name, email, passengers, booking_id } = body;

  if (!flight_id || !email) {
    return { error: 'Missing required fields: flight_id, email' };
  }

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(BOOKINGS_SHEET);
  if (!sheet) return { error: 'Bookings sheet not found' };

  const bId  = booking_id || 'AERO-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  const ts   = new Date().toISOString();

  sheet.appendRow([bId, flight_id, name, email, passengers || 1, ts]);

  // Optional: Send confirmation email
  // sendConfirmationEmail(email, name, bId, flight_id);

  return {
    success:    true,
    booking_id: bId,
    message:    'Booking confirmed',
    timestamp:  ts,
  };
}

// ============================================================
//  initializeSheets — Run ONCE to scaffold the spreadsheet
//  → Tools > Run function > initializeSheets
// ============================================================
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ---- FLIGHTS SHEET ----
  let flightsSheet = ss.getSheetByName(FLIGHTS_SHEET);
  if (!flightsSheet) flightsSheet = ss.insertSheet(FLIGHTS_SHEET);

  const flightHeaders = [
    'id','origin','origin_full','destination','destination_full',
    'aircraft','category','departure_time','duration',
    'price','original_price','seats','region','image_url',
    'operator','safety_rating'
  ];
  flightsSheet.getRange(1, 1, 1, flightHeaders.length).setValues([flightHeaders]);
  flightsSheet.getRange(1, 1, 1, flightHeaders.length)
    .setFontWeight('bold')
    .setBackground('#1a1a1a')
    .setFontColor('#C9A96E');

  // Seed with sample data
  const sampleFlights = [
    ['FL001','LHR','London Heathrow','CDG','Paris Charles de Gaulle','Bombardier Global 6000','heavy',
     new Date(Date.now() + 3600000*18).toISOString(),'1h 15m',4800,22000,8,'europe',
     'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
     'Sovereign Air Group','ARGUS Platinum'],
    ['FL002','DXB','Dubai International','JFK','New York JFK','Gulfstream G700','ultra',
     new Date(Date.now() + 3600000*36).toISOString(),'14h 30m',42000,180000,14,'mideast',
     'https://images.unsplash.com/photo-1583791031153-d55e79f7f115?w=800&q=80',
     'Desert Wings Aviation','IS-BAO Stage III'],
    ['FL003','MIA','Miami International','LAX','Los Angeles','Citation Longitude','midsize',
     new Date(Date.now() + 3600000*8).toISOString(),'5h 20m',9500,38000,8,'americas',
     'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800&q=80',
     'Atlantic Charter Co.','ARGUS Gold'],
    ['FL004','CDG','Paris Charles de Gaulle','GVA','Geneva','Phenom 300E','light',
     new Date(Date.now() + 3600000*6).toISOString(),'1h 05m',2900,11500,6,'europe',
     'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800&q=80',
     'Riviera Jet Partners','ARGUS Platinum'],
    ['FL005','SIN','Singapore Changi','HND','Tokyo Haneda','Gulfstream G550','heavy',
     new Date(Date.now() + 3600000*28).toISOString(),'7h 10m',26500,95000,12,'asia',
     'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=80',
     'Pacific Prestige Aviation','ARGUS Platinum'],
  ];

  flightsSheet.getRange(2, 1, sampleFlights.length, flightHeaders.length)
    .setValues(sampleFlights);

  // ---- BOOKINGS SHEET ----
  let bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET);
  if (!bookingsSheet) bookingsSheet = ss.insertSheet(BOOKINGS_SHEET);

  const bookingHeaders = ['booking_id','flight_id','name','email','passengers','timestamp'];
  bookingsSheet.getRange(1, 1, 1, bookingHeaders.length).setValues([bookingHeaders]);
  bookingsSheet.getRange(1, 1, 1, bookingHeaders.length)
    .setFontWeight('bold')
    .setBackground('#1a1a1a')
    .setFontColor('#C9A96E');

  Logger.log('✦ AERO sheets initialized successfully.');
  return 'Sheets initialized. Ready for deployment.';
}

// ============================================================
//  sendConfirmationEmail (optional)
// ============================================================
function sendConfirmationEmail(email, name, bookingId, flightId) {
  const subject = `✦ AERO — Your Flight is Confirmed (${bookingId})`;
  const body = `
Dear ${name},

Your private flight reservation has been confirmed.

Booking Reference: ${bookingId}
Flight: ${flightId}

Our team will be in touch with full itinerary details within 2 hours.

Fly exceptionally.

AERO Private Aviation
  `.trim();

  MailApp.sendEmail({ to: email, subject, body });
}
