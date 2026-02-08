# Adaptation Guide: Converting app.js to main.js

This guide explains how to convert the v0.31.0 app.js (backend-based) to v1.0.0 main.js (static frontend).

## Step-by-Step Conversion

### 1. Add Module Imports (Top of File)

```javascript
// Add these imports at the very top
import { dataManager } from './data-manager.js';
import { 
  captureProjectState, 
  saveProject, 
  loadProject,
  importGTFSFromFile,
  importGTFSFromURL
} from './project-io.js';
```

### 2. Remove Backend Constants

```javascript
// DELETE THIS:
const API_BASE_URL = '';

// UPDATE THIS:
const APP_VERSION = '1.0.0';  // Was 0.31.0
const PROJECT_SCHEMA_VERSION = 1;  // Was 4
```

### 3. Update GTFS Import Functions

#### File Import (Lines ~1826-1860)

**OLD CODE:**
```javascript
async function importGTFSFile() {
    // ...
    const r = await fetch(`${API_BASE_URL}/gtfs/import-file`, { 
        method: 'POST', 
        body: fd 
    });
    const result = await r.json();
    // ...
}
```

**NEW CODE:**
```javascript
async function importGTFSFile() {
    const fileInput = document.getElementById('gtfsFileInput');
    const files = fileInput.files;
    if (!files || files.length === 0) {
        showToast('Please select a GTFS file', 'error');
        return;
    }
    
    const file = files[0];
    const feedName = prompt('Enter feed name:', file.name.replace('.zip', '')) || file.name;
    
    // Show progress UI
    const progressDiv = document.createElement('div');
    progressDiv.id = 'import-progress';
    progressDiv.innerHTML = `
        <div class="progress-container">
            <h3>Importing ${feedName}...</h3>
            <div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>
            <div class="progress-text">Starting...</div>
        </div>
    `;
    document.body.appendChild(progressDiv);
    
    try {
        const parsedData = await importGTFSFromFile(file, feedName);
        
        // Listen for progress updates
        parsedData.onProgress?.((progress) => {
            const { step, progress: percent, total } = progress;
            document.querySelector('.progress-fill').style.width = total + '%';
            document.querySelector('.progress-text').textContent = `${step}: ${percent}%`;
        });
        
        // Wait for parsing to complete
        const data = await parsedData;
        
        // Add to data manager
        const feedId = dataManager.addFeed(feedName, data, {
            sourceType: 'file',
            filename: file.name,
            size: file.size
        });
        
        // Remove progress UI
        document.body.removeChild(progressDiv);
        
        // Update UI
        await refreshFeedsList();
        await refreshAgenciesFilter();
        showToast(`Imported ${feedName} successfully`, 'success');
        
    } catch (error) {
        document.body.removeChild(progressDiv);
        console.error('Import failed:', error);
        showToast('Import failed: ' + error.message, 'error');
    }
}
```

#### URL Import (Lines ~1733-1800)

**OLD CODE:**
```javascript
const r = await fetch(`${API_BASE_URL}/gtfs/import-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, name })
});
```

**NEW CODE:**
```javascript
async function importGTFSFromURLUI() {
    const url = prompt('Enter GTFS URL:');
    if (!url) return;
    
    const feedName = prompt('Enter feed name:', new URL(url).hostname);
    if (!feedName) return;
    
    try {
        const data = await importGTFSFromURL(url, feedName);
        const feedId = dataManager.addFeed(feedName, data, {
            sourceType: 'url',
            sourceUrl: url
        });
        
        await refreshFeedsList();
        showToast(`Imported ${feedName}`, 'success');
        
    } catch (error) {
        if (error.message.startsWith('CORS_ERROR:')) {
            showToast(
                'Cannot import from this URL due to CORS restrictions. ' +
                'Please download the file and use "Import from File" instead.',
                'error'
            );
        } else {
            showToast('Import failed: ' + error.message, 'error');
        }
    }
}
```

### 4. Update Data Query Functions

#### Get Agencies (Lines ~721-740)

**OLD:**
```javascript
const r = await fetch(`${API_BASE_URL}/agencies?feed_source_id=${feedId}`);
const agencies = await r.json();
```

**NEW:**
```javascript
const agencies = dataManager.getAgencies(feedId);
```

#### Get Routes (Lines ~483-512)

**OLD:**
```javascript
const r = await fetch(`${API_BASE_URL}/routes?${params}`);
const routes = await r.json();
```

**NEW:**
```javascript
const routes = dataManager.getRoutes({
    feedId: selectedFeedId,
    agencyIds: Array.from(visibleAgencyIds),
    routeTypes: selectedRouteTypes,
    date: selectedCalendarDate
});
```

#### Get Stops (Lines ~1405-1430)

**OLD:**
```javascript
const r = await fetch(`${API_BASE_URL}/stops?${params}`);
const stops = await r.json();
```

**NEW:**
```javascript
const stops = dataManager.getStops({
    feedId: selectedFeedId,
    date: selectedCalendarDate,
    polygons: selectedPolygons
});
```

#### Get Route Details (Lines ~1109-1150)

**OLD:**
```javascript
const r = await fetch(`${API_BASE_URL}/routes/detail/${routeId}?feed_source_id=${feedId}`);
const details = await r.json();
```

**NEW:**
```javascript
const details = dataManager.getRouteDetails(feedId, routeId, selectedCalendarDate);
```

### 5. Update Feed Management

#### Get Feeds List (Lines ~549-575)

**OLD:**
```javascript
const r = await fetch(`${API_BASE_URL}/feed-sources`);
const feeds = await r.json();
```

**NEW:**
```javascript
const feeds = dataManager.getAllFeeds();
```

#### Delete Feed (Lines ~1986-2005)

**OLD:**
```javascript
const r = await fetch(`${API_BASE_URL}/feed-sources/${feedId}`, { 
    method: 'DELETE' 
});
```

**NEW:**
```javascript
dataManager.removeFeed(feedId);
await refreshFeedsList();
showToast('Feed removed', 'success');
```

### 6. Update Project Save/Load

#### Save Project (Lines ~2282-2318)

**OLD:**
```javascript
async function saveProject() {
    const state = await captureProjectState(); // Gets from backend
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    // ... save blob
}
```

**NEW:**
```javascript
async function saveProjectUI() {
    const currentFilters = {
        selectedDate: selectedCalendarDate,
        selectedFeedId: document.getElementById('feedFilter')?.value,
        visibleAgencyIds: Array.from(visibleAgencyIds),
        routeTypes: getSelectedRouteTypes()
    };
    
    const state = captureProjectState(
        projectName,
        map,
        currentPolygons,
        dataManager.getAllFeeds(),
        currentFilters
    );
    
    const result = await saveProject(state, `${projectName}.tde`);
    
    if (result.success) {
        showToast('Project saved', 'success');
    }
}
```

#### Load Project (Lines ~2420-2550)

**OLD:**
```javascript
async function loadProject(file) {
    const text = await file.text();
    const state = JSON.parse(text);
    // ... feeds loaded from backend via API calls
}
```

**NEW:**
```javascript
async function loadProjectUI(file) {
    try {
        const restored = await loadProject(file);
        
        // Restore map state
        map.setView(
            [restored.mapState.center.lat, restored.mapState.center.lng],
            restored.mapState.zoom
        );
        
        // Restore polygons
        currentPolygons = restored.polygons;
        renderPolygons();
        
        // Check if feeds need re-import
        if (restored.feeds && restored.feeds.length > 0) {
            showMissingDataBanner(restored.feeds);
        }
        
        // Restore filters (will apply after feeds imported)
        pendingFilters = restored.filters;
        
        showToast('Project loaded', 'success');
        
    } catch (error) {
        showToast('Load failed: ' + error.message, 'error');
    }
}

function showMissingDataBanner(feeds) {
    const banner = document.createElement('div');
    banner.className = 'missing-data-banner';
    banner.innerHTML = `
        <h3>⚠️ GTFS Data Not Included</h3>
        <p>This project requires ${feeds.length} feed(s) to be imported:</p>
        <ul>
            ${feeds.map(f => `<li>${f.name} ${f.sourceUrl ? `(<a href="${f.sourceUrl}">URL</a>)` : ''}</li>`).join('')}
        </ul>
        <button onclick="this.parentElement.remove()">Got it</button>
    `;
    document.body.appendChild(banner);
}
```

### 7. Remove All Other Backend Calls

Search for these patterns and replace:

```javascript
// Pattern to search:
fetch(`${API_BASE_URL}/

// Lines to check:
// 501: /stats
// 818: /polygons (if using backend polygons)
// 1066: /routes/shapes
// 1468: /stops (inside-polygon)
// 1710: /stops (export)
// 1923: /polygons/upload
// 2009: /polygons/{id} DELETE
// 2031, 2072: /admin/reset-db
```

For each, replace with appropriate dataManager call or remove entirely.

### 8. Update HTML Script Tag

In `index.html`, find:

```html
<script src="app.js"></script>
```

Replace with:

```html
<script type="module" src="./src/main.js"></script>
```

### 9. Add Leaflet MarkerCluster

In `index.html` `<head>`, add:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
```

### 10. Test Checklist

After conversion:

- [ ] File loads without errors
- [ ] Map renders
- [ ] GTFS file import works
- [ ] Progress bar shows during import
- [ ] Routes display on map
- [ ] Stops display on map
- [ ] Date filter works
- [ ] Agency filter works
- [ ] Route type filter works
- [ ] Polygon drawing works
- [ ] Polygon filtering works
- [ ] Project save works
- [ ] Project load works
- [ ] Feed re-import after load works

## Complete Example: Before & After

### Before (v0.31.0)

```javascript
// app.js (backend-based)
const API_BASE_URL = '';

async function loadRoutes() {
    const feedId = document.getElementById('feedFilter').value;
    const r = await fetch(`${API_BASE_URL}/routes?feed_source_id=${feedId}`);
    const routes = await r.json();
    displayRoutes(routes);
}

async function importGTFS(file) {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(`${API_BASE_URL}/gtfs/import-file`, {
        method: 'POST',
        body: fd
    });
    const result = await r.json();
    return result;
}
```

### After (v1.0.0)

```javascript
// main.js (static frontend)
import { dataManager } from './data-manager.js';
import { importGTFSFromFile } from './project-io.js';

async function loadRoutes() {
    const feedId = parseInt(document.getElementById('feedFilter').value);
    const routes = dataManager.getRoutes({ feedId });
    displayRoutes(routes);
}

async function importGTFS(file, feedName) {
    const data = await importGTFSFromFile(file, feedName);
    const feedId = dataManager.addFeed(feedName, data, {
        sourceType: 'file',
        filename: file.name
    });
    return feedId;
}
```

## Common Pitfalls

1. **Forgetting to await dataManager calls** - they're synchronous but keep await for consistency
2. **Not handling missing feeds on project load** - always show banner prompting re-import
3. **Trying to use backend polygon endpoints** - polygons are now frontend-only
4. **Not updating progress UI** - Web Worker provides progress events, use them
5. **Keeping API_BASE_URL** - remove it entirely to catch missed conversions

## Performance Notes

- dataManager queries are fast (<1ms) because data is in memory
- GTFS import is the only slow operation (30-60s for large feeds)
- Always show progress during import
- Consider debouncing filter changes (100ms) to avoid excessive re-renders

## Debugging Tips

If something doesn't work:

1. Check browser console for errors
2. Verify all `fetch(API_BASE_URL` removed
3. Check dataManager has feeds: `dataManager.getAllFeeds()`
4. Verify Web Worker loaded: check Network tab
5. Check GTFS parsing errors: Web Worker console logs

---

**Estimated adaptation time:** 2-3 hours
**Lines to modify:** ~200-300 (out of 2,970)
**Difficulty:** Medium (mostly find-and-replace patterns)
