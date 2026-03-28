/**
 * AERO — AI Private Jet Finder
 * apps_script_backend.gs — Google Apps Script Backend
 *
 * DEPLOYMENT:
 *   1. Open Google Sheets → Extensions → Apps Script
 *   2. Paste this file
 *   3. Run initializeSheets() once to scaffold data
 *   4. Deploy → New Deployment → Web App
 *      Execute as: Me | Access: Anyone
 *   5. Copy the Web App URL into app.js → API_BASE
 */

const FLIGHTS_SHEET  = 'Flights';
const BOOKINGS_SHEET = 'Bookings';

// ============================================================
//  doGet
// ============================================================
function doGet(e) {
  const params = e.parameter || {};
  let result;
  try {
    switch (params.action) {
      case 'getFlights':    result = getFlights(params); break;
      case 'getFlightById': result = getFlightById(params.id); break;
      default:              result = { error: 'Unknown action', actions: ['getFlights','getFlightById'] };
    }
  } catch (err) { result = { error: err.message }; }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  doPost
// ============================================================
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return json({ error: 'Invalid JSON' }); }

  let result;
  try {
    if (body.action === 'bookFlight') result = bookFlight(body);
    else result = { error: 'Unknown action' };
  } catch (err) { result = { error: err.message }; }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  getFlights
// ============================================================
function getFlights(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FLIGHTS_SHEET);
  if (!sheet) return { error: 'Run initializeSheets() first.' };

  const [headers, ...rows] = sheet.getDataRange().getValues();
  let flights = rows
    .map(row => { const o = {}; headers.forEach((h,i) => o[h] = row[i]); return o; })
    .filter(f => f.id);

  if (params.origin)      flights = flights.filter(f => f.origin?.toUpperCase() === params.origin.toUpperCase());
  if (params.destination) flights = flights.filter(f => f.destination?.toUpperCase() === params.destination.toUpperCase());
  if (params.category)    flights = flights.filter(f => f.category === params.category);
  if (params.region)      flights = flights.filter(f => f.region === params.region);

  return { flights, count: flights.length };
}

// ============================================================
//  getFlightById
// ============================================================
function getFlightById(id) {
  if (!id) return { error: 'Missing id' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FLIGHTS_SHEET);
  if (!sheet) return { error: 'Sheet not found' };

  const [headers, ...rows] = sheet.getDataRange().getValues();
  for (const row of rows) {
    const obj = {}; headers.forEach((h,i) => obj[h] = row[i]);
    if (obj.id === id) return { flight: obj };
  }
  return { error: `Flight ${id} not found` };
}

// ============================================================
//  bookFlight
// ============================================================
function bookFlight(body) {
  const { flight_id, name, email, passengers } = body;
  if (!flight_id || !email) return { error: 'flight_id and email are required' };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BOOKINGS_SHEET);
  if (!sheet) return { error: 'Bookings sheet not found' };

  const bookingId = 'AERO-' + Utilities.getUuid().substring(0,8).toUpperCase();
  const ts = new Date().toISOString();
  sheet.appendRow([bookingId, flight_id, name, email, passengers || 1, ts]);

  return { success: true, booking_id: bookingId, timestamp: ts };
}

// ============================================================
//  initializeSheets — Run ONCE before deployment
// ============================================================
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // FLIGHTS
  let fs = ss.getSheetByName(FLIGHTS_SHEET) || ss.insertSheet(FLIGHTS_SHEET);
  const fh = ['id','origin','origin_full','destination','destination_full',
               'aircraft','category','departure_time','duration',
               'price','original_price','seats','region','image_url','operator','safety_rating'];
  fs.getRange(1,1,1,fh.length).setValues([fh]).setFontWeight('bold').setBackground('#F8F6F1').setFontColor('#B8955A');

  const now = Date.now();
  const jets = [
    ['FL001','LHR','London Heathrow','CDG','Paris Le Bourget','Bombardier Global 6000','heavy',
     new Date(now+3600000*18).toISOString(),'1h 15m',4800,22000,8,'europe',
     'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=900&q=80','Sovereign Air Group','ARGUS Platinum'],
    ['FL002','DXB','Dubai Al Maktoum','JFK','New York Teterboro','Gulfstream G700','ultra',
     new Date(now+3600000*36).toISOString(),'14h 30m',42000,185000,14,'mideast',
     'https://images.unsplash.com/photo-1583791031153-d55e79f7f115?w=900&q=80','Desert Wings Aviation','IS-BAO Stage III'],
    ['FL003','MIA','Miami Opa-locka','LAX','Los Angeles Van Nuys','Cessna Citation Longitude','midsize',
     new Date(now+3600000*8).toISOString(),'5h 20m',9500,38000,8,'americas',
     'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=900&q=80','Atlantic Charter Co.','ARGUS Gold'],
    ['FL004','CDG','Paris Le Bourget','GVA','Geneva Cointrin','Embraer Phenom 300E','light',
     new Date(now+3600000*6).toISOString(),'1h 05m',2900,11500,6,'europe',
     'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=900&q=80','Riviera Jet Partners','ARGUS Platinum'],
    ['FL005','SIN','Singapore Seletar','HND','Tokyo Haneda','Gulfstream G550','heavy',
     new Date(now+3600000*28).toISOString(),'7h 10m',26500,95000,12,'asia',
     'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=900&q=80','Pacific Prestige Aviation','ARGUS Platinum'],
    ['FL006','TEB','New York Teterboro','MIA','Miami Opa-locka','Gulfstream G450','heavy',
     new Date(now+3600000*5).toISOString(),'2h 55m',11500,44000,12,'americas',
     'https://images.unsplash.com/photo-1615813967515-e1838c1c5116?w=900&q=80','Northeast Jet Group','ARGUS Platinum'],
  ];
  fs.getRange(2,1,jets.length,fh.length).setValues(jets);

  // BOOKINGS
  let bs = ss.getSheetByName(BOOKINGS_SHEET) || ss.insertSheet(BOOKINGS_SHEET);
  const bh = ['booking_id','flight_id','name','email','passengers','timestamp'];
  bs.getRange(1,1,1,bh.length).setValues([bh]).setFontWeight('bold').setBackground('#F8F6F1').setFontColor('#B8955A');

  Logger.log('✦ AERO sheets initialized. Ready to deploy.');
  return 'Done — sheets initialized with private jet data.';
}
