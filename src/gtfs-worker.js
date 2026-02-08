/**
 * GTFS Parser Web Worker
 * 
 * Parses GTFS zip files in a background thread to prevent UI freezing.
 * Builds efficient indexes for fast querying.
 */

import JSZip from 'jszip';
import Papa from 'papaparse';

// Progress tracking
let currentProgress = 0;
const steps = {
  extract: 10,
  agency: 5,
  routes: 10,
  trips: 15,
  stopTimes: 30,
  stops: 10,
  shapes: 10,
  calendar: 5,
  calendarDates: 5
};

function reportProgress(step, progress) {
  currentProgress += (steps[step] * progress / 100);
  self.postMessage({
    type: 'progress',
    step,
    progress,
    total: Math.min(100, Math.round(currentProgress))
  });
}

/**
 * Parse CSV text with PapaParse
 */
function parseCSV(text, skipEmptyLines = true) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines,
    transformHeader: (header) => header.trim()
  });
  
  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors.slice(0, 5));
  }
  
  return result.data;
}

/**
 * Parse date from YYYYMMDD format
 */
function parseGTFSDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return null;
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day);
}

/**
 * Format date to YYYYMMDD string
 */
function formatGTFSDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Get day of week (0=Sunday, 6=Saturday)
 */
function getDayOfWeek(date) {
  return date.getDay();
}

/**
 * Calculate service IDs active on a given date
 */
function calculateServicesByDate(calendar, calendarDates) {
  const servicesByDate = new Map();
  
  // Build calendar rules map
  const calendarRules = new Map();
  for (const rule of calendar) {
    calendarRules.set(rule.service_id, rule);
  }
  
  // Build calendar_dates exceptions map
  const calendarExceptions = new Map();
  for (const exception of calendarDates) {
    if (!calendarExceptions.has(exception.service_id)) {
      calendarExceptions.set(exception.service_id, new Map());
    }
    calendarExceptions.get(exception.service_id).set(
      exception.date,
      parseInt(exception.exception_type)
    );
  }
  
  // Find date range to pre-compute
  let minDate = new Date();
  let maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1); // Default: next year
  
  for (const rule of calendar) {
    const start = parseGTFSDate(rule.start_date);
    const end = parseGTFSDate(rule.end_date);
    if (start && start < minDate) minDate = start;
    if (end && end > maxDate) maxDate = end;
  }
  
  // Pre-compute service IDs for each date in range
  const currentDate = new Date(minDate);
  while (currentDate <= maxDate) {
    const dateStr = formatGTFSDate(currentDate);
    const activeServices = new Set();
    
    // Check calendar rules
    for (const [serviceId, rule] of calendarRules) {
      const startDate = parseGTFSDate(rule.start_date);
      const endDate = parseGTFSDate(rule.end_date);
      
      if (currentDate >= startDate && currentDate <= endDate) {
        const dayOfWeek = getDayOfWeek(currentDate);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayActive = parseInt(rule[dayNames[dayOfWeek]]) === 1;
        
        if (dayActive) {
          activeServices.add(serviceId);
        }
      }
    }
    
    // Apply calendar_dates exceptions
    for (const [serviceId, exceptions] of calendarExceptions) {
      const exceptionType = exceptions.get(dateStr);
      if (exceptionType === 1) {
        activeServices.add(serviceId); // Service added
      } else if (exceptionType === 2) {
        activeServices.delete(serviceId); // Service removed
      }
    }
    
    if (activeServices.size > 0) {
      servicesByDate.set(dateStr, activeServices);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return servicesByDate;
}

/**
 * Main GTFS parsing function
 */
async function parseGTFS(file) {
  try {
    currentProgress = 0;
    
    // Step 1: Extract zip
    reportProgress('extract', 0);
    const zip = await JSZip.loadAsync(file);
    reportProgress('extract', 100);
    
    // Check required files
    const requiredFiles = ['agency.txt', 'routes.txt', 'trips.txt', 'stops.txt', 'stop_times.txt'];
    for (const filename of requiredFiles) {
      if (!zip.files[filename]) {
        throw new Error(`Invalid GTFS feed: missing required file ${filename}`);
      }
    }
    
    // Step 2: Parse agency.txt
    reportProgress('agency', 0);
    const agencyText = await zip.files['agency.txt'].async('text');
    const agencyRows = parseCSV(agencyText);
    const agencies = new Map();
    for (const row of agencyRows) {
      if (row.agency_id) {
        agencies.set(row.agency_id, {
          agency_id: row.agency_id,
          agency_name: row.agency_name || 'Unknown Agency',
          agency_url: row.agency_url || '',
          agency_timezone: row.agency_timezone || ''
        });
      }
    }
    reportProgress('agency', 100);
    
    // Step 3: Parse routes.txt
    reportProgress('routes', 0);
    const routesText = await zip.files['routes.txt'].async('text');
    const routesRows = parseCSV(routesText);
    const routes = new Map();
    for (const row of routesRows) {
      if (row.route_id) {
        routes.set(row.route_id, {
          route_id: row.route_id,
          agency_id: row.agency_id || '',
          route_short_name: row.route_short_name || '',
          route_long_name: row.route_long_name || '',
          route_type: parseInt(row.route_type) || 3,
          route_color: row.route_color || null,
          route_text_color: row.route_text_color || null
        });
      }
    }
    reportProgress('routes', 100);
    
    // Step 4: Parse trips.txt
    reportProgress('trips', 0);
    const tripsText = await zip.files['trips.txt'].async('text');
    const tripsRows = parseCSV(tripsText);
    const trips = new Map();
    const tripsByRoute = new Map();
    const tripsByService = new Map();
    
    for (const row of tripsRows) {
      if (row.trip_id && row.route_id) {
        const trip = {
          trip_id: row.trip_id,
          route_id: row.route_id,
          service_id: row.service_id || '',
          trip_headsign: row.trip_headsign || '',
          direction_id: parseInt(row.direction_id) || 0,
          shape_id: row.shape_id || null
        };
        
        trips.set(row.trip_id, trip);
        
        // Index by route
        if (!tripsByRoute.has(row.route_id)) {
          tripsByRoute.set(row.route_id, new Set());
        }
        tripsByRoute.get(row.route_id).add(row.trip_id);
        
        // Index by service
        if (row.service_id) {
          if (!tripsByService.has(row.service_id)) {
            tripsByService.set(row.service_id, new Set());
          }
          tripsByService.get(row.service_id).add(row.trip_id);
        }
      }
    }
    reportProgress('trips', 100);
    
    // Step 5: Parse stop_times.txt (build indexes, don't keep all in memory)
    reportProgress('stopTimes', 0);
    const stopTimesText = await zip.files['stop_times.txt'].async('text');
    const stopTimesRows = parseCSV(stopTimesText);
    
    const stopTimesByTrip = new Map();
    const stopsByRoute = new Map();
    
    let processed = 0;
    const total = stopTimesRows.length;
    
    for (const row of stopTimesRows) {
      if (row.trip_id && row.stop_id) {
        // Store stop_times grouped by trip
        if (!stopTimesByTrip.has(row.trip_id)) {
          stopTimesByTrip.set(row.trip_id, []);
        }
        stopTimesByTrip.get(row.trip_id).push({
          stop_id: row.stop_id,
          stop_sequence: parseInt(row.stop_sequence) || 0,
          arrival_time: row.arrival_time || '',
          departure_time: row.departure_time || ''
        });
        
        // Build stop-to-route index
        const trip = trips.get(row.trip_id);
        if (trip) {
          if (!stopsByRoute.has(trip.route_id)) {
            stopsByRoute.set(trip.route_id, new Set());
          }
          stopsByRoute.get(trip.route_id).add(row.stop_id);
        }
      }
      
      processed++;
      if (processed % 10000 === 0) {
        reportProgress('stopTimes', Math.round(processed / total * 100));
      }
    }
    reportProgress('stopTimes', 100);
    
    // Sort stop_times by sequence
    for (const [tripId, stopTimes] of stopTimesByTrip) {
      stopTimes.sort((a, b) => a.stop_sequence - b.stop_sequence);
    }
    
    // Step 6: Parse stops.txt
    reportProgress('stops', 0);
    const stopsText = await zip.files['stops.txt'].async('text');
    const stopsRows = parseCSV(stopsText);
    const stops = new Map();
    
    for (const row of stopsRows) {
      if (row.stop_id && row.stop_lat && row.stop_lon) {
        stops.set(row.stop_id, {
          stop_id: row.stop_id,
          stop_name: row.stop_name || 'Unnamed Stop',
          stop_lat: parseFloat(row.stop_lat),
          stop_lon: parseFloat(row.stop_lon),
          stop_code: row.stop_code || '',
          wheelchair_boarding: parseInt(row.wheelchair_boarding) || 0
        });
      }
    }
    reportProgress('stops', 100);
    
    // Step 7: Parse shapes.txt (if exists)
    let shapes = new Map();
    if (zip.files['shapes.txt']) {
      reportProgress('shapes', 0);
      const shapesText = await zip.files['shapes.txt'].async('text');
      const shapesRows = parseCSV(shapesText);
      
      const shapePoints = new Map();
      for (const row of shapesRows) {
        if (row.shape_id && row.shape_pt_lat && row.shape_pt_lon) {
          if (!shapePoints.has(row.shape_id)) {
            shapePoints.set(row.shape_id, []);
          }
          shapePoints.get(row.shape_id).push({
            lat: parseFloat(row.shape_pt_lat),
            lon: parseFloat(row.shape_pt_lon),
            sequence: parseInt(row.shape_pt_sequence) || 0
          });
        }
      }
      
      // Sort and convert to coordinate arrays
      for (const [shapeId, points] of shapePoints) {
        points.sort((a, b) => a.sequence - b.sequence);
        shapes.set(shapeId, points.map(p => [p.lat, p.lon]));
      }
      reportProgress('shapes', 100);
    } else {
      reportProgress('shapes', 100);
    }
    
    // Step 8: Parse calendar.txt (if exists)
    let calendar = [];
    if (zip.files['calendar.txt']) {
      reportProgress('calendar', 0);
      const calendarText = await zip.files['calendar.txt'].async('text');
      calendar = parseCSV(calendarText);
      reportProgress('calendar', 100);
    } else {
      reportProgress('calendar', 100);
    }
    
    // Step 9: Parse calendar_dates.txt (if exists)
    let calendarDates = [];
    if (zip.files['calendar_dates.txt']) {
      reportProgress('calendarDates', 0);
      const calendarDatesText = await zip.files['calendar_dates.txt'].async('text');
      calendarDates = parseCSV(calendarDatesText);
      reportProgress('calendarDates', 100);
    } else {
      reportProgress('calendarDates', 100);
    }
    
    // Calculate service days
    const servicesByDate = calculateServicesByDate(calendar, calendarDates);
    
    // Convert Sets to Arrays for transfer
    const tripsByRouteObj = {};
    for (const [routeId, tripSet] of tripsByRoute) {
      tripsByRouteObj[routeId] = Array.from(tripSet);
    }
    
    const tripsByServiceObj = {};
    for (const [serviceId, tripSet] of tripsByService) {
      tripsByServiceObj[serviceId] = Array.from(tripSet);
    }
    
    const stopsByRouteObj = {};
    for (const [routeId, stopSet] of stopsByRoute) {
      stopsByRouteObj[routeId] = Array.from(stopSet);
    }
    
    const servicesByDateObj = {};
    for (const [date, serviceSet] of servicesByDate) {
      servicesByDateObj[date] = Array.from(serviceSet);
    }
    
    // Return parsed data
    return {
      agencies: Object.fromEntries(agencies),
      routes: Object.fromEntries(routes),
      trips: Object.fromEntries(trips),
      stops: Object.fromEntries(stops),
      shapes: Object.fromEntries(shapes),
      
      // Indexes
      tripsByRoute: tripsByRouteObj,
      tripsByService: tripsByServiceObj,
      stopsByRoute: stopsByRouteObj,
      stopTimesByTrip: Object.fromEntries(stopTimesByTrip),
      servicesByDate: servicesByDateObj,
      
      // Metadata
      stats: {
        agencyCount: agencies.size,
        routeCount: routes.size,
        tripCount: trips.size,
        stopCount: stops.size,
        shapeCount: shapes.size
      }
    };
    
  } catch (error) {
    throw new Error(`GTFS parsing failed: ${error.message}`);
  }
}

// Worker message handler
self.addEventListener('message', async (e) => {
  const { type, data } = e.data;
  
  if (type === 'parse') {
    try {
      const result = await parseGTFS(data.file);
      self.postMessage({
        type: 'complete',
        data: result,
        feedName: data.feedName
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error.message
      });
    }
  }
});
