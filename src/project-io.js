/**
 * Project I/O
 * 
 * Handles saving and loading .tde project files.
 * Project files contain ONLY: polygons, UI state, feed metadata.
 * GTFS data is NEVER included - must be re-imported.
 */

const PROJECT_VERSION = '1.0.0';
const PROJECT_SCHEMA_VERSION = 1;

/**
 * Capture current project state for saving
 */
export function captureProjectState(projectName, map, polygons, feeds, filters) {
  const center = map.getCenter();
  const zoom = map.getZoom();
  
  return {
    version: PROJECT_VERSION,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    projectName: projectName || 'Untitled Project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    mapState: {
      center: { lat: center.lat, lng: center.lng },
      zoom: zoom
    },
    
    polygons: polygons.map(poly => ({
      id: poly.id || `poly_${Date.now()}_${Math.random()}`,
      name: poly.properties?.name || poly.name || 'Unnamed Polygon',
      visible: poly.visible !== false,
      geojson: {
        type: 'Feature',
        geometry: poly.geometry,
        properties: {
          name: poly.properties?.name || poly.name || 'Unnamed Polygon',
          description: poly.properties?.description || ''
        }
      }
    })),
    
    feeds: feeds.map(feed => ({
      name: feed.name,
      sourceType: feed.metadata?.sourceType || 'file',
      sourceUrl: feed.metadata?.sourceUrl || null,
      notes: feed.metadata?.notes || '',
      imported: false // Always false - must re-import
    })),
    
    filters: {
      selectedDate: filters.selectedDate || null,
      calendarMode: filters.calendarMode || 'all',
      selectedFeedId: filters.selectedFeedId || null,
      visibleAgencyIds: filters.visibleAgencyIds || [],
      routeTypes: filters.routeTypes || [],
      selectedRouteId: filters.selectedRouteId || null,
      selectedVariantIndex: filters.selectedVariantIndex || 0,
      stopFilters: {
        insidePolygonsOnly: filters.stopFilters?.insidePolygonsOnly || false,
        accessibleOnly: filters.stopFilters?.accessibleOnly || false,
        orphansOnly: filters.stopFilters?.orphansOnly || false
      }
    }
  };
}

/**
 * Restore project state after loading
 */
export function restoreProjectState(projectData) {
  // Validate schema version
  if (projectData.schemaVersion > PROJECT_SCHEMA_VERSION) {
    throw new Error(`Project file is from a newer version (schema ${projectData.schemaVersion}). Please update the app.`);
  }
  
  return {
    projectName: projectData.projectName || 'Untitled Project',
    createdAt: projectData.createdAt,
    updatedAt: projectData.updatedAt,
    
    mapState: projectData.mapState || { center: { lat: 0, lng: 0 }, zoom: 2 },
    
    polygons: (projectData.polygons || []).map(poly => ({
      id: poly.id,
      name: poly.name,
      visible: poly.visible !== false,
      geometry: poly.geojson.geometry,
      properties: poly.geojson.properties
    })),
    
    feeds: projectData.feeds || [],
    
    filters: projectData.filters || {}
  };
}

/**
 * Save project to file
 */
export async function saveProject(projectData, filename) {
  const json = JSON.stringify(projectData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  
  // Try File System Access API (Chrome/Edge)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'Transit Data Explorer Project',
          accept: { 'application/json': ['.tde'] }
        }]
      });
      
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      
      return { success: true, method: 'file-system-access' };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      console.warn('File System Access API failed, falling back to download:', error);
    }
  }
  
  // Fallback: trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return { success: true, method: 'download' };
}

/**
 * Load project from file
 */
export async function loadProject(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  
  // Validate basic structure
  if (!data.version || !data.projectName) {
    throw new Error('Invalid project file: missing required fields');
  }
  
  return restoreProjectState(data);
}

/**
 * Export function for importing GTFS from file
 */
export async function importGTFSFromFile(file, feedName) {
  return new Promise((resolve, reject) => {
    // Create worker
    const worker = new Worker(
      new URL('./gtfs-worker.js', import.meta.url),
      { type: 'module' }
    );
    
    const progressCallbacks = [];
    
    worker.onmessage = (e) => {
      const { type, data, error, step, progress, total } = e.data;
      
      if (type === 'progress') {
        progressCallbacks.forEach(cb => cb({ step, progress, total }));
      } else if (type === 'complete') {
        worker.terminate();
        resolve(data);
      } else if (type === 'error') {
        worker.terminate();
        reject(new Error(error));
      }
    };
    
    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };
    
    // Send file to worker
    worker.postMessage({
      type: 'parse',
      data: { file, feedName }
    });
    
    // Return progress subscription
    resolve.onProgress = (callback) => {
      progressCallbacks.push(callback);
    };
  });
}

/**
 * Export function for importing GTFS from URL
 */
export async function importGTFSFromURL(url, feedName) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return await importGTFSFromFile(blob, feedName);
    
  } catch (error) {
    // Check if it's a CORS error
    if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
      throw new Error(`CORS_ERROR: The server at ${new URL(url).hostname} does not allow direct browser access. Please download the GTFS zip file manually and use "Import from File" instead.`);
    }
    throw error;
  }
}
