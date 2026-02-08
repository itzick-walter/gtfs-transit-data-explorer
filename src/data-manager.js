/**
 * Data Manager
 * 
 * Manages in-memory GTFS data structures and provides query methods.
 * All data is volatile - cleared on page reload.
 */

class DataManager {
  constructor() {
    this.feeds = new Map(); // feedId -> feedData
    this.nextFeedId = 1;
  }
  
  /**
   * Store parsed GTFS data
   */
  addFeed(feedName, parsedData, metadata = {}) {
    const feedId = this.nextFeedId++;
    
    const feed = {
      id: feedId,
      name: feedName,
      importedAt: new Date(),
      metadata,
      
      // Core data (Maps for fast lookup)
      agencies: new Map(Object.entries(parsedData.agencies)),
      routes: new Map(Object.entries(parsedData.routes)),
      trips: new Map(Object.entries(parsedData.trips)),
      stops: new Map(Object.entries(parsedData.stops)),
      shapes: new Map(Object.entries(parsedData.shapes)),
      
      // Indexes (converted back to Maps)
      tripsByRoute: new Map(Object.entries(parsedData.tripsByRoute).map(([k, v]) => [k, new Set(v)])),
      tripsByService: new Map(Object.entries(parsedData.tripsByService).map(([k, v]) => [k, new Set(v)])),
      stopsByRoute: new Map(Object.entries(parsedData.stopsByRoute).map(([k, v]) => [k, new Set(v)])),
      stopTimesByTrip: new Map(Object.entries(parsedData.stopTimesByTrip)),
      servicesByDate: new Map(Object.entries(parsedData.servicesByDate).map(([k, v]) => [k, new Set(v)])),
      
      stats: parsedData.stats
    };
    
    this.feeds.set(feedId, feed);
    return feedId;
  }
  
  /**
   * Remove a feed
   */
  removeFeed(feedId) {
    return this.feeds.delete(feedId);
  }
  
  /**
   * Get feed by ID
   */
  getFeed(feedId) {
    return this.feeds.get(feedId);
  }
  
  /**
   * Get all feeds
   */
  getAllFeeds() {
    return Array.from(this.feeds.values());
  }
  
  /**
   * Get agencies for a feed
   */
  getAgencies(feedId = null) {
    if (feedId) {
      const feed = this.feeds.get(feedId);
      return feed ? Array.from(feed.agencies.values()) : [];
    }
    
    // All agencies from all feeds
    const allAgencies = [];
    for (const feed of this.feeds.values()) {
      for (const agency of feed.agencies.values()) {
        allAgencies.push({
          ...agency,
          feedId: feed.id,
          feedName: feed.name
        });
      }
    }
    return allAgencies;
  }
  
  /**
   * Get routes with filters
   */
  getRoutes(filters = {}) {
    const { feedId, agencyIds, routeTypes, date } = filters;
    let routes = [];
    
    // Collect routes from feeds
    const feedsToQuery = feedId ? [this.feeds.get(feedId)] : Array.from(this.feeds.values());
    
    for (const feed of feedsToQuery) {
      if (!feed) continue;
      
      // Get active service IDs for date
      let activeServiceIds = null;
      if (date) {
        activeServiceIds = feed.servicesByDate.get(date);
        if (!activeServiceIds || activeServiceIds.size === 0) {
          continue; // No service on this date
        }
      }
      
      for (const route of feed.routes.values()) {
        // Filter by agency
        if (agencyIds && agencyIds.length > 0 && !agencyIds.includes(route.agency_id)) {
          continue;
        }
        
        // Filter by route type
        if (routeTypes && routeTypes.length > 0 && !routeTypes.includes(route.route_type)) {
          continue;
        }
        
        // Filter by date (check if route has any active trips)
        if (activeServiceIds) {
          const routeTripIds = feed.tripsByRoute.get(route.route_id);
          if (!routeTripIds) continue;
          
          let hasActiveTrip = false;
          for (const tripId of routeTripIds) {
            const trip = feed.trips.get(tripId);
            if (trip && activeServiceIds.has(trip.service_id)) {
              hasActiveTrip = true;
              break;
            }
          }
          
          if (!hasActiveTrip) continue;
        }
        
        routes.push({
          ...route,
          feedId: feed.id,
          feedName: feed.name
        });
      }
    }
    
    return routes;
  }
  
  /**
   * Get stops with filters
   */
  getStops(filters = {}) {
    const { feedId, routeId, date, polygons } = filters;
    let stops = [];
    
    const feedsToQuery = feedId ? [this.feeds.get(feedId)] : Array.from(this.feeds.values());
    
    for (const feed of feedsToQuery) {
      if (!feed) continue;
      
      let stopIds = null;
      
      // If filtering by route, get stops for that route
      if (routeId) {
        stopIds = feed.stopsByRoute.get(routeId);
        if (!stopIds) continue;
      }
      
      // If filtering by date, get stops from active trips
      if (date && !routeId) {
        const activeServiceIds = feed.servicesByDate.get(date);
        if (!activeServiceIds || activeServiceIds.size === 0) continue;
        
        stopIds = new Set();
        for (const serviceId of activeServiceIds) {
          const tripIds = feed.tripsByService.get(serviceId);
          if (tripIds) {
            for (const tripId of tripIds) {
              const stopTimes = feed.stopTimesByTrip.get(tripId);
              if (stopTimes) {
                for (const st of stopTimes) {
                  stopIds.add(st.stop_id);
                }
              }
            }
          }
        }
      }
      
      // Collect stops
      const stopsToCheck = stopIds ? 
        Array.from(stopIds).map(id => feed.stops.get(id)).filter(Boolean) :
        Array.from(feed.stops.values());
      
      for (const stop of stopsToCheck) {
        // Filter by polygon
        if (polygons && polygons.length > 0) {
          const point = [stop.stop_lon, stop.stop_lat];
          let insideAny = false;
          
          for (const polygon of polygons) {
            if (this.isPointInPolygon(point, polygon)) {
              insideAny = true;
              break;
            }
          }
          
          if (!insideAny) continue;
        }
        
        stops.push({
          ...stop,
          feedId: feed.id,
          feedName: feed.name
        });
      }
    }
    
    return stops;
  }
  
  /**
   * Get route details including shape variants
   */
  getRouteDetails(feedId, routeId, date = null) {
    const feed = this.feeds.get(feedId);
    if (!feed) return null;
    
    const route = feed.routes.get(routeId);
    if (!route) return null;
    
    const tripIds = feed.tripsByRoute.get(routeId);
    if (!tripIds) return { ...route, variants: [] };
    
    // Filter trips by active service
    let activeServiceIds = null;
    if (date) {
      activeServiceIds = feed.servicesByDate.get(date);
      if (!activeServiceIds || activeServiceIds.size === 0) {
        return { ...route, variants: [] };
      }
    }
    
    // Group trips by direction + shape
    const variantMap = new Map();
    
    for (const tripId of tripIds) {
      const trip = feed.trips.get(tripId);
      if (!trip) continue;
      
      // Filter by date
      if (activeServiceIds && !activeServiceIds.has(trip.service_id)) {
        continue;
      }
      
      const key = `${trip.direction_id}_${trip.shape_id || 'none'}`;
      
      if (!variantMap.has(key)) {
        variantMap.set(key, {
          direction_id: trip.direction_id,
          shape_id: trip.shape_id,
          trip_count: 0,
          sample_trip_id: tripId,
          headsign: trip.trip_headsign
        });
      }
      
      variantMap.get(key).trip_count++;
    }
    
    // Sort variants by trip count (most frequent first)
    const variants = Array.from(variantMap.values())
      .sort((a, b) => b.trip_count - a.trip_count);
    
    // Add shape coordinates to each variant
    for (const variant of variants) {
      if (variant.shape_id) {
        const shape = feed.shapes.get(variant.shape_id);
        if (shape) {
          variant.coordinates = shape;
        }
      }
      
      // Get stops for this variant
      const stopIds = new Set();
      for (const tripId of tripIds) {
        const trip = feed.trips.get(tripId);
        if (trip && 
            trip.direction_id === variant.direction_id && 
            trip.shape_id === variant.shape_id) {
          const stopTimes = feed.stopTimesByTrip.get(tripId);
          if (stopTimes) {
            for (const st of stopTimes) {
              stopIds.add(st.stop_id);
            }
          }
        }
      }
      
      variant.stops = Array.from(stopIds)
        .map(id => feed.stops.get(id))
        .filter(Boolean);
    }
    
    return {
      ...route,
      feedId,
      feedName: feed.name,
      variants
    };
  }
  
  /**
   * Get available dates (dates with service)
   */
  getAvailableDates(feedId = null) {
    const dates = new Set();
    
    const feedsToQuery = feedId ? [this.feeds.get(feedId)] : Array.from(this.feeds.values());
    
    for (const feed of feedsToQuery) {
      if (!feed) continue;
      
      for (const date of feed.servicesByDate.keys()) {
        dates.add(date);
      }
    }
    
    return Array.from(dates).sort();
  }
  
  /**
   * Simple point-in-polygon test
   * Uses ray casting algorithm
   */
  isPointInPolygon(point, polygon) {
    const [x, y] = point;
    
    // Handle different GeoJSON types
    let coordinates;
    if (polygon.type === 'Feature') {
      coordinates = polygon.geometry.coordinates;
    } else if (polygon.type === 'Polygon') {
      coordinates = polygon.coordinates;
    } else if (polygon.type === 'MultiPolygon') {
      // Check each polygon in MultiPolygon
      for (const polyCoords of polygon.coordinates) {
        if (this.pointInRing(point, polyCoords[0])) {
          return true;
        }
      }
      return false;
    } else {
      return false;
    }
    
    // For regular Polygon, check exterior ring (first ring)
    return this.pointInRing(point, coordinates[0]);
  }
  
  /**
   * Check if point is inside a polygon ring
   * Ray casting algorithm
   */
  pointInRing(point, ring) {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }
  
  /**
   * Clear all data
   */
  clear() {
    this.feeds.clear();
    this.nextFeedId = 1;
  }
}

// Export singleton instance
export const dataManager = new DataManager();
