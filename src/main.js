/**
 * Transit Data Explorer v1.0.1 - Main Application
 * 100% Static Frontend - No Backend Required
 * All event handlers wired via addEventListener in initUI().
 */

import { dataManager } from './data-manager.js';
import { captureProjectState, saveProject, loadProject } from './project-io.js';

const APP_VERSION = '1.1.1';

const ROUTE_TYPE_CONFIG = {
    0: { name: 'Tram/Light Rail', color: '#F4C430' },
    1: { name: 'Subway/Metro', color: '#0057B8' },
    2: { name: 'Rail', color: '#8B1E3F' },
    3: { name: 'Bus', color: '#2E8B57' },
    4: { name: 'Ferry', color: '#008080' },
    5: { name: 'Cable Tram', color: '#E67E22' },
    6: { name: 'Gondola', color: '#6A5ACD' },
    7: { name: 'Funicular', color: '#8B5A2B' },
    default: { name: 'Unknown', color: '#3498db' }
};

function getRouteTypeConfig(rt) {
    return ROUTE_TYPE_CONFIG[rt] || ROUTE_TYPE_CONFIG.default;
}

function getRouteTypeSVG(routeType) {
    const svgPaths = {
        0: `<g fill="white">
            <line x1="7" y1="3" x2="17" y2="3" stroke="white" stroke-width="2.5"/>
            <line x1="12" y1="3" x2="12" y2="6" stroke="white" stroke-width="2"/>
            <rect x="5" y="6" width="14" height="12" rx="2"/>
            <rect x="6.5" y="7.5" width="11" height="6" rx="1" fill="#F4C430"/>
            <circle cx="8" cy="19" r="2.5"/>
            <circle cx="16" cy="19" r="2.5"/>
        </g>`,
        1: `<g fill="white">
            <rect x="5" y="6" width="14" height="13" rx="3"/>
            <rect x="6.5" y="7.5" width="11" height="6" rx="1" fill="#0057B8"/>
            <text x="12" y="17" font-size="8" font-weight="bold" text-anchor="middle" fill="white">M</text>
            <circle cx="9" cy="20" r="2.5"/>
            <circle cx="15" cy="20" r="2.5"/>
        </g>`,
        2: `<g fill="white">
            <rect x="2" y="7" width="20" height="11" rx="2"/>
            <rect x="4" y="9" width="16" height="6" rx="1" fill="#8B1E3F"/>
            <circle cx="6" cy="19" r="2.5"/>
            <circle cx="12" cy="19" r="2.5"/>
            <circle cx="18" cy="19" r="2.5"/>
        </g>`,
        3: `<g fill="white">
            <rect x="3" y="5" width="18" height="16" rx="2.5"/>
            <rect x="4.5" y="6.5" width="15" height="6" rx="1" fill="#2E8B57"/>
            <circle cx="7" cy="16" r="2"/>
            <circle cx="17" cy="16" r="2"/>
            <rect x="5" y="19" width="14" height="2" rx="1"/>
            <circle cx="7" cy="22" r="2.5"/>
            <circle cx="17" cy="22" r="2.5"/>
        </g>`,
        4: `<g fill="white">
            <rect x="7" y="5" width="10" height="7" rx="1"/>
            <rect x="8.5" y="6.5" width="7" height="4" rx="0.5" fill="#008080"/>
            <path d="M4 13 L7 13 L7 16 L12 18 L17 16 L17 13 L20 13 L18 17 L6 17 Z"/>
            <rect x="10.5" y="3" width="3" height="2" rx="0.5"/>
        </g>`,
        5: `<g fill="white">
            <line x1="1" y1="4" x2="23" y2="4" stroke="white" stroke-width="3"/>
            <line x1="12" y1="4" x2="12" y2="8" stroke="white" stroke-width="2.5"/>
            <rect x="6" y="8" width="12" height="10" rx="2"/>
            <rect x="7.5" y="9.5" width="9" height="6" rx="1" fill="#E67E22"/>
            <circle cx="9" cy="19" r="2"/>
            <circle cx="15" cy="19" r="2"/>
        </g>`,
        6: `<g fill="white">
            <line x1="1" y1="4" x2="23" y2="4" stroke="white" stroke-width="3"/>
            <line x1="8" y1="4" x2="8" y2="8" stroke="white" stroke-width="2.5"/>
            <line x1="16" y1="4" x2="16" y2="8" stroke="white" stroke-width="2.5"/>
            <rect x="6" y="8" width="12" height="11" rx="3"/>
            <rect x="7.5" y="9.5" width="9" height="7" rx="1" fill="#6A5ACD"/>
            <line x1="6" y1="19" x2="3" y2="21" stroke="white" stroke-width="2.5"/>
            <line x1="18" y1="19" x2="21" y2="21" stroke="white" stroke-width="2.5"/>
        </g>`,
        7: `<g fill="white">
            <rect x="4" y="5" width="16" height="12" rx="2" transform="rotate(-20 12 12)"/>
            <rect x="6" y="7" width="12" height="7" rx="1" fill="#8B5A2B" transform="rotate(-20 12 12)"/>
            <circle cx="6" cy="17" r="2.5"/>
            <circle cx="18" cy="17" r="2.5"/>
            <line x1="2" y1="19" x2="22" y2="12" stroke="white" stroke-width="3.5"/>
        </g>`,
        default: `<g fill="white"><circle cx="12" cy="12" r="5"/></g>`
    };
    return svgPaths[routeType] || svgPaths.default;
}

function createStopIcon(routeType, size = 28) {
    const config = getRouteTypeConfig(routeType);
    const svgContent = getRouteTypeSVG(routeType);
    const html = `
        <div style="width:${size}px;height:${size}px;background-color:${config.color};border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.4);">
            <svg width="${size*0.65}" height="${size*0.65}" viewBox="0 0 24 24" fill="none">${svgContent}</svg>
        </div>`;
    return L.divIcon({ html, className:'custom-stop-icon', iconSize:[size,size], iconAnchor:[size/2,size/2], popupAnchor:[0,-size/2] });
}

function getRouteColor(route) {
    // Priority: route_color from GTFS > route_type color > smart assignment
    if (route.route_color && route.route_color.length === 6) {
        return '#' + route.route_color;
    }
    
    // Fallback to route_type color
    const config = getRouteTypeConfig(route.route_type);
    return config.color;
}

// Vibrant, distinct color palette for routes (avoiding pale colors)
const DISTINCT_ROUTE_COLORS = [
    '#E53935', // Vibrant Red
    '#1E88E5', // Vibrant Blue
    '#43A047', // Vibrant Green
    '#FB8C00', // Vibrant Orange
    '#8E24AA', // Vibrant Purple
    '#00ACC1', // Vibrant Cyan
    '#FFB300', // Vibrant Amber
    '#D81B60', // Vibrant Pink
    '#00897B', // Vibrant Teal
    '#6D4C41', // Brown
    '#546E7A', // Blue Grey
    '#C0CA33', // Lime
    '#F4511E', // Deep Orange
    '#7B1FA2', // Deep Purple
    '#0277BD', // Light Blue
    '#2E7D32', // Dark Green
    '#AD1457', // Deep Pink
    '#5E35B1', // Indigo
    '#00695C', // Dark Teal
    '#EF6C00'  // Orange
];

// Global route color cache: route_id -> color
const routeColorCache = new Map();

function getSmartRouteColor(route, allRoutes) {
    // If already assigned, return cached color
    if (routeColorCache.has(route.route_id)) {
        return routeColorCache.get(route.route_id);
    }
    
    // Priority 1: Use GTFS route_color if available
    if (route.route_color && route.route_color.length === 6) {
        const color = '#' + route.route_color;
        routeColorCache.set(route.route_id, color);
        return color;
    }
    
    // Priority 2: Use route_type color if distinct enough from other routes
    const typeColor = getRouteTypeConfig(route.route_type).color;
    
    // Priority 3: Assign from distinct color palette
    // Use route index to ensure consistency across renders
    const routeIndex = allRoutes.findIndex(r => r.route_id === route.route_id);
    const color = DISTINCT_ROUTE_COLORS[routeIndex % DISTINCT_ROUTE_COLORS.length];
    
    routeColorCache.set(route.route_id, color);
    return color;
}

const EYE_OPEN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
const EYE_CLOSED = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

// === Global State ===
let map, stopsLayer, routeShapesLayer;
let polygonLayers = [];
let currentPolygons = [];
let visiblePolygonIds = new Set();
let visibleAgencyIds = new Set();
let hiddenFeedIds = new Set(); // Track hidden feeds
let selectedCalendarDate = null;
let selectedRouteDetails = null;

let projectState = {
    projectName: 'Untitled Project',
    isDirty: false,
    savedFilePath: null,
    createdAt: null
};

// === Boot ===
window.addEventListener('DOMContentLoaded', () => {
    console.log('Transit Data Explorer v' + APP_VERSION + ' - Static Frontend');
    
    // Set version displays from single source of truth
    const dockVersion = document.getElementById('dockVersion');
    const aboutVersion = document.getElementById('aboutVersion');
    const versionPill = document.getElementById('versionPill');
    
    if (dockVersion) dockVersion.textContent = 'v' + APP_VERSION;
    if (aboutVersion) aboutVersion.textContent = 'v' + APP_VERSION;
    if (versionPill) versionPill.textContent = 'v' + APP_VERSION;
    
    initMap();
    initUI();
    updateProjectNameDisplay();
    selectedCalendarDate = fmtDate(new Date());
});

// === Map (no Leaflet.draw) ===
function initMap() {
    map = L.map('map', {
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        zoomControl: true
    }).setView([40.7128, -74.006], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19
    }).addTo(map);
    
    // Re-enable MarkerClusterGroup with proper config to prevent blocking map interaction
    stopsLayer = L.markerClusterGroup({
        disableClusteringAtZoom: 16,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
        // CRITICAL: Allow mouse events to bubble through to map
        bubblingMouseEvents: true
    });
    map.addLayer(stopsLayer);
    
    routeShapesLayer = L.layerGroup().addTo(map);
    
    console.log('[Map] Initialized with dragging enabled and stop clustering');
}

// === UI Wiring (addEventListener only — zero inline onclick) ===
function initUI() {
    const $ = id => document.getElementById(id);

    // Dock tabs
    $('tabData')?.addEventListener('click', () => switchDockTab('data'));
    $('tabLayers')?.addEventListener('click', () => switchDockTab('layers'));
    $('tabFilters')?.addEventListener('click', () => switchDockTab('filters'));

    // Collapse strip
    const strip = $('collapseStrip');
    if (strip) {
        strip.addEventListener('click', toggleDock);
        strip.addEventListener('keydown', e => { if (e.key === 'Enter') toggleDock(); });
    }

    // Data-tab buttons
    $('btnImportFeed')?.addEventListener('click', openFeedModal);
    $('btnAddPolygon')?.addEventListener('click', openPolygonModal);
    $('btnResetDb')?.addEventListener('click', resetDatabase);

    // Feed modal
    $('btnCloseFeedModal')?.addEventListener('click', closeFeedModal);
    $('feedTabUrl')?.addEventListener('click', () => switchFeedTab('url'));
    $('feedTabFile')?.addEventListener('click', () => switchFeedTab('file'));
    $('btnSubmitFeedUrl')?.addEventListener('click', handleImportFeedURL);
    $('btnSubmitFeedFile')?.addEventListener('click', handleImportFeedFile);

    // Polygon modal
    $('btnClosePolygonModal')?.addEventListener('click', closePolygonModal);
    $('btnSubmitPolygon')?.addEventListener('click', handleImportPolygon);

    // About modal
    $('btnCloseAboutModal')?.addEventListener('click', closeAboutModal);

    // Burger menu
    $('burgerMenuTrigger')?.addEventListener('click', e => { e.stopPropagation(); $('burgerMenuDropdown')?.classList.toggle('open'); });
    $('menuNewProject')?.addEventListener('click', () => { closeBurger(); newProject(); });
    $('menuSaveProject')?.addEventListener('click', () => { closeBurger(); saveProjectUI(); });
    $('menuSaveAs')?.addEventListener('click', () => { closeBurger(); saveProjectAsUI(); });
    $('menuLoadProject')?.addEventListener('click', () => { closeBurger(); $('projectFileInput')?.click(); });
    $('menuToggleTheme')?.addEventListener('click', () => { closeBurger(); toggleTheme(); });
    $('menuAbout')?.addEventListener('click', () => { closeBurger(); openAboutModal(); });

    // Project file input
    $('projectFileInput')?.addEventListener('change', loadProjectUI);

    // Filters
    $('feedFilter')?.addEventListener('change', applyFilters);
    $('dayTypeSelect')?.addEventListener('change', handleDayTypeChange);
    $('btnClearFilters')?.addEventListener('click', clearFilters);
    $('calTrigger')?.addEventListener('click', e => toggleCalendar(e));

    // Layer master checkboxes
    $('agencyMasterCheckbox')?.addEventListener('change', function() { toggleAllAgencies(this.checked); });
    $('routesMasterCheckbox')?.addEventListener('change', function() { toggleAllRoutes(this.checked); });
    $('polygonsMasterCheckbox')?.addEventListener('change', function() { toggleAllPolygons(this.checked); });
    $('stopsVisibleCheckbox')?.addEventListener('change', function() { toggleStopsVisibility(this.checked); });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(ov => {
        ov.addEventListener('click', e => { if (e.target === ov) { ov.style.display = 'none'; } });
    });

    // Close burger on outside click
    document.addEventListener('click', e => {
        const dd = $('burgerMenuDropdown');
        const trig = $('burgerMenuTrigger');
        if (dd?.classList.contains('open') && !dd.contains(e.target) && !trig?.contains(e.target)) closeBurger();
    });
}

// === Dock Tabs ===
function switchDockTab(name) {
    document.querySelectorAll('.dock-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.dock-panel').forEach(p => p.classList.toggle('active', p.id === 'dock-' + name));
}

function toggleDock() {
    const dock = document.getElementById('leftDock');
    if (!dock) return;
    dock.classList.toggle('collapsed');
    const ch = dock.querySelector('.collapse-chevron');
    if (ch) ch.textContent = dock.classList.contains('collapsed') ? '▶' : '◀';
    setTimeout(() => map?.invalidateSize(), 250);
}

// === Burger ===
function closeBurger() {
    document.getElementById('burgerMenuDropdown')?.classList.remove('open');
}

// === Modals ===
function openFeedModal() {
    const m = document.getElementById('feedModal');
    if (m) { m.style.display = 'flex'; }
    switchFeedTab('url');
}
function closeFeedModal() {
    const m = document.getElementById('feedModal');
    if (m) m.style.display = 'none';
}
function switchFeedTab(tab) {
    document.getElementById('feedTabUrl')?.classList.toggle('active', tab === 'url');
    document.getElementById('feedTabFile')?.classList.toggle('active', tab === 'file');
    document.getElementById('feedTab-url')?.classList.toggle('active', tab === 'url');
    document.getElementById('feedTab-file')?.classList.toggle('active', tab === 'file');
}

function openPolygonModal() {
    const m = document.getElementById('polygonModal');
    if (m) m.style.display = 'flex';
}
function closePolygonModal() {
    const m = document.getElementById('polygonModal');
    if (m) m.style.display = 'none';
}

function openAboutModal() {
    const m = document.getElementById('aboutModal');
    if (m) m.style.display = 'flex';
}
function closeAboutModal() {
    const m = document.getElementById('aboutModal');
    if (m) m.style.display = 'none';
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const t = document.getElementById('themeToggleText');
    if (t) t.textContent = document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
}

// === GTFS Import — URL ===
async function handleImportFeedURL() {
    const nameEl = document.getElementById('gtfsName');
    const urlEl = document.getElementById('gtfsUrl');
    const url = urlEl?.value?.trim();
    if (!url) { showToast('Please enter a GTFS URL', 'error'); return; }
    const name = nameEl?.value?.trim() || new URL(url).hostname;
    closeFeedModal();
    showToast('Fetching from URL…', 'info');
    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const blob = await resp.blob();
        const file = new File([blob], 'gtfs.zip', { type: 'application/zip' });
        await doGTFSImport(file, name, { sourceType: 'url', sourceUrl: url });
        if (nameEl) nameEl.value = '';
        if (urlEl) urlEl.value = '';
    } catch (err) {
        if (err.name === 'TypeError' || String(err.message).includes('Failed to fetch'))
            showToast('Cannot import: CORS restriction. Download and use "From File".', 'error');
        else showToast('Import failed: ' + err.message, 'error');
    }
}

// === GTFS Import — File ===
async function handleImportFeedFile() {
    const nameEl = document.getElementById('gtfsFileName');
    const fileEl = document.getElementById('gtfsFile');
    const file = fileEl?.files?.[0];
    if (!file) { showToast('Please select a GTFS zip file', 'error'); return; }
    const feedName = nameEl?.value?.trim() || file.name.replace('.zip', '');
    closeFeedModal();
    try {
        await doGTFSImport(file, feedName, { sourceType: 'file', filename: file.name });
        if (nameEl) nameEl.value = '';
        if (fileEl) fileEl.value = '';
    } catch (err) { showToast('Import failed: ' + err.message, 'error'); }
}

async function doGTFSImport(file, feedName, meta) {
    const prog = document.createElement('div');
    prog.className = 'import-progress';
    prog.innerHTML = '<div class="progress-container"><h3>Importing ' + feedName + '…</h3><div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div><div class="progress-text">Starting…</div></div>';
    document.body.appendChild(prog);
    try {
        const worker = new Worker(new URL('./gtfs-worker.js', import.meta.url), { type: 'module' });
        const parsed = await new Promise((resolve, reject) => {
            worker.onmessage = e => {
                const { type, data, error, step, progress, total } = e.data;
                if (type === 'progress') {
                    const f = prog.querySelector('.progress-fill');
                    const t = prog.querySelector('.progress-text');
                    if (f) f.style.width = total + '%';
                    if (t) t.textContent = step + ': ' + progress + '%';
                } else if (type === 'complete') { worker.terminate(); resolve(data); }
                else if (type === 'error') { worker.terminate(); reject(new Error(error)); }
            };
            worker.onerror = err => { worker.terminate(); reject(err); };
            worker.postMessage({ type: 'parse', data: { file, feedName } });
        });
        
        const feedId = dataManager.addFeed(feedName, parsed, { ...meta, size: file.size, importedAt: new Date().toISOString() });
        document.body.removeChild(prog);
        
        await refreshFeedsList();
        await refreshAgenciesFilter();
        
        // Render routes and stops immediately after import
        console.log('[GTFS Import] Rendering routes and stops');
        await renderAllRoutesAndStops();
        
        // Fit map to imported stops
        console.log('[GTFS Import] Fitting map to imported data');
        const feed = dataManager.getFeed(feedId);
        if (feed && feed.stops && feed.stops.size > 0) {
            const bounds = L.latLngBounds();
            for (const stop of feed.stops.values()) {
                bounds.extend([stop.stop_lat, stop.stop_lon]);
            }
            if (bounds.isValid()) {
                map.fitBounds(bounds);
            }
        }
        
        showToast('Imported ' + feedName + ' (' + (parsed.stats?.routeCount||0) + ' routes, ' + (parsed.stats?.stopCount||0) + ' stops)', 'success');
        markDirty();
    } catch (err) {
        if (prog.parentElement) document.body.removeChild(prog);
        throw err;
    }
}

// === Render Routes and Stops ===
async function renderAllRoutesAndStops() {
    console.log('[Render] Starting route and stop rendering');
    
    // Get all visible feeds
    const allFeeds = dataManager.getAllFeeds();
    const visibleFeeds = allFeeds.filter(f => !hiddenFeedIds.has(f.id));
    
    if (visibleFeeds.length === 0) {
        console.log('[Render] No visible feeds, clearing map');
        clearMapLayers();
        return;
    }
    
    // Clear existing layers
    clearMapLayers();
    
    // Handle agency filter: 
    // - If no agencies loaded yet: show all routes (null)
    // - If agencies loaded and some selected: filter by those
    // - If agencies loaded but none selected: show nothing (empty array)
    let agencyIds = null; // default: show all
    if (visibleAgencyIds.size > 0) {
        agencyIds = Array.from(visibleAgencyIds);
    }
    
    const routeTypes = getSelectedRouteTypes();
    
    console.log('[Render] Agency filter:', visibleAgencyIds.size, 'agencies selected, agencyIds:', agencyIds);
    
    // Collect all routes first for consistent color assignment
    const allVisibleRoutes = [];
    for (const feed of visibleFeeds) {
        const routes = dataManager.getRoutes({
            feedId: feed.id,
            agencyIds: agencyIds,
            routeTypes: routeTypes.length > 0 ? routeTypes : null,
            date: selectedCalendarDate
        });
        allVisibleRoutes.push(...routes);
    }
    
    console.log('[Render] Total routes across all feeds:', allVisibleRoutes.length);
    
    for (const feed of visibleFeeds) {
        const routes = dataManager.getRoutes({
            feedId: feed.id,
            agencyIds: agencyIds,
            routeTypes: routeTypes.length > 0 ? routeTypes : null,
            date: selectedCalendarDate
        });
        
        console.log('[Render] Feed', feed.name, ':', routes.length, 'routes');
        
        // Render route shapes with smart color assignment
        routes.forEach(route => {
            const details = dataManager.getRouteDetails(feed.id, route.route_id, selectedCalendarDate);
            if (details && details.variants && details.variants.length > 0) {
                const variant = details.variants[0];
                if (variant.coordinates && variant.coordinates.length > 0) {
                    const routeColor = getSmartRouteColor(route, allVisibleRoutes);
                    const polyline = L.polyline(variant.coordinates, {
                        color: routeColor,
                        weight: 4,
                        opacity: 0.75
                    }).addTo(routeShapesLayer);
                    
                    // Add click handler for route selection
                    polyline.on('click', () => {
                        window.selectRoute(feed.id, route.route_id);
                    });
                }
            }
        });
    }
    
    // Render all stops from visible feeds with custom icons and detailed popups
    const stops = dataManager.getStops({
        feedId: null, // Get from all feeds
        date: selectedCalendarDate
    }).filter(s => !hiddenFeedIds.has(s.feedId));
    
    console.log('[Render] Rendering', stops.length, 'stops');
    
    // Build stop -> routes mapping for detailed popups
    const stopRoutesMap = new Map(); // key: stopId_feedId, value: array of route objects
    const stopRouteTypes = new Map(); // key: stopId_feedId, value: Set of route_types
    
    console.log('[Render] Building stop-route mapping for', visibleFeeds.length, 'feeds');
    
    for (const feed of visibleFeeds) {
        const routes = dataManager.getRoutes({
            feedId: feed.id,
            agencyIds: agencyIds,
            routeTypes: routeTypes.length > 0 ? routeTypes : null,
            date: selectedCalendarDate
        });
        
        console.log('[Render] Feed', feed.name, '- processing', routes.length, 'routes for stop mapping');
        
        routes.forEach(route => {
            const details = dataManager.getRouteDetails(feed.id, route.route_id, selectedCalendarDate);
            if (details && details.variants) {
                details.variants.forEach(variant => {
                    if (variant.stops) {
                        variant.stops.forEach(stop => {
                            const key = `${stop.stop_id}_${feed.id}`;
                            
                            // Track route types
                            if (!stopRouteTypes.has(key)) {
                                stopRouteTypes.set(key, new Set());
                            }
                            stopRouteTypes.get(key).add(route.route_type);
                            
                            // Track routes serving this stop
                            if (!stopRoutesMap.has(key)) {
                                stopRoutesMap.set(key, []);
                            }
                            // Avoid duplicates
                            if (!stopRoutesMap.get(key).find(r => r.route_id === route.route_id)) {
                                stopRoutesMap.get(key).push({
                                    route_id: route.route_id,
                                    route_short_name: route.route_short_name,
                                    route_long_name: route.route_long_name,
                                    route_type: route.route_type
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    
    console.log('[Render] Stop-route mapping complete:', stopRoutesMap.size, 'stops have routes');
    
    stops.forEach(stop => {
        const key = `${stop.stop_id}_${stop.feedId}`;
        const routeTypesForStop = stopRouteTypes.get(key);
        const routesServingStop = stopRoutesMap.get(key) || [];
        
        // Determine primary route type for icon color
        let primaryRouteType = 3; // default to Bus
        if (routeTypesForStop && routeTypesForStop.size > 0) {
            primaryRouteType = Array.from(routeTypesForStop)[0];
        }
        
        // Create custom icon with route-type color and SVG
        const icon = createStopIcon(primaryRouteType, 28);
        
        const marker = L.marker([stop.stop_lat, stop.stop_lon], { icon }).addTo(stopsLayer);
        
        // Build detailed popup like FE+BE
        const routeTypeConfig = getRouteTypeConfig(primaryRouteType);
        const routesBadge = routesServingStop.length > 0
            ? `<span style="display:inline-block;background:${routeTypeConfig.color};color:white;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;margin-top:6px;">${routeTypeConfig.name}</span>`
            : '';
        
        const routesList = routesServingStop.length > 0
            ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB;">
                <strong style="font-size:0.8rem;color:#374151;">Routes: ${routesServingStop.length}</strong>
                <div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;">
                    ${routesServingStop.slice(0, 18).map(r => {
                        const rConfig = getRouteTypeConfig(r.route_type);
                        return `<span style="background:${rConfig.color};color:white;padding:2px 6px;border-radius:3px;font-size:0.7rem;font-weight:600;">${r.route_short_name || r.route_id}</span>`;
                    }).join('')}
                    ${routesServingStop.length > 18 ? `<span style="color:#6B7280;font-size:0.7rem;">+${routesServingStop.length - 18} more</span>` : ''}
                </div>
            </div>`
            : '';
        
        const locationType = stop.location_type !== undefined 
            ? (stop.location_type === 0 ? 'Stop or platform' : stop.location_type === 1 ? 'Station' : 'Other')
            : 'Stop or platform';
        
        const accessibility = stop.wheelchair_boarding !== undefined
            ? (stop.wheelchair_boarding === 1 ? 'Accessible' : stop.wheelchair_boarding === 2 ? 'Not accessible' : 'No information')
            : 'No information';
        
        const popupHTML = `
            <div style="min-width:240px;font-family:Inter,sans-serif;">
                <div style="font-size:1rem;font-weight:600;color:#111827;margin-bottom:4px;">${stop.stop_name}</div>
                <div style="font-size:0.75rem;color:#6B7280;">Stop ID: ${stop.stop_id}</div>
                <div style="font-size:0.75rem;color:#6B7280;">Feed: ${stop.feedName || 'Unknown'}</div>
                ${routesBadge}
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB;font-size:0.75rem;color:#6B7280;">
                    <div>Location Type: ${locationType}</div>
                    <div style="margin-top:2px;">Accessibility: ${accessibility}</div>
                </div>
                ${routesList}
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB;font-size:0.7rem;color:#9CA3AF;">
                    Lat: ${stop.stop_lat.toFixed(6)}, Lon: ${stop.stop_lon.toFixed(6)}
                </div>
            </div>
        `;
        
        marker.bindPopup(popupHTML, { maxWidth: 320 });
    });
    
    // Update route display list
    const allRoutes = [];
    for (const feed of visibleFeeds) {
        const feedRoutes = dataManager.getRoutes({
            feedId: feed.id,
            agencyIds: agencyIds,
            routeTypes: routeTypes.length > 0 ? routeTypes : null,
            date: selectedCalendarDate
        });
        allRoutes.push(...feedRoutes);
    }
    displayRoutes(allRoutes);
}

// === Polygon Import ===
async function handleImportPolygon() {
    const fileEl = document.getElementById('kmlFile');
    const file = fileEl?.files?.[0];
    if (!file) { showToast('Please select a KML or GeoJSON file', 'error'); return; }
    closePolygonModal();
    
    console.log('[Polygon Import] Starting import of:', file.name);
    
    try {
        const text = await file.text();
        let gj;
        if (file.name.endsWith('.kml')) {
            console.log('[Polygon Import] Converting KML to GeoJSON');
            gj = kmlToGeoJSON(text);
        } else {
            console.log('[Polygon Import] Parsing GeoJSON');
            gj = JSON.parse(text);
        }

        let features = [];
        if (gj.type === 'FeatureCollection') features = gj.features;
        else if (gj.type === 'Feature') features = [gj];
        else if (gj.type === 'Polygon' || gj.type === 'MultiPolygon') features = [{ type:'Feature', geometry: gj, properties:{} }];

        const polys = features.filter(f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
        if (!polys.length) { showToast('No polygon geometries found', 'error'); return; }

        console.log('[Polygon Import] Found', polys.length, 'polygon(s)');
        
        const newLayers = [];
        polys.forEach((feat, i) => {
            // Extract name: prefer properties.name, fall back to filename
            const nm = feat.properties?.name || 
                       feat.properties?.Name || 
                       file.name.replace(/\.[^.]+$/, '') + (polys.length > 1 ? ' ' + (i+1) : '');
            
            console.log('[Polygon Import] Polygon', i, 'name:', nm);
            
            const poly = { 
                id: 'poly_' + Date.now() + '_' + i, 
                name: nm, 
                geometry: feat.geometry, 
                properties: { 
                    name: nm, 
                    description: feat.properties?.description || '' 
                }, 
                visible: true 
            };
            
            currentPolygons.push(poly);
            visiblePolygonIds.add(poly.id);
            
            const lyr = L.geoJSON(feat.geometry, { 
                style: { color:'#3498db', weight:2, opacity:0.8, fillOpacity:0.2 } 
            }).addTo(map);
            lyr.bindPopup('<strong>' + nm + '</strong>');
            polygonLayers.push(lyr);
            newLayers.push(lyr);
        });
        
        updatePolygonsList();
        updatePolygonLayerToggles();
        markDirty();
        
        // Fit map to newly imported polygons only
        if (newLayers.length) {
            console.log('[Polygon Import] Fitting map to imported polygons');
            map.fitBounds(L.featureGroup(newLayers).getBounds());
        }
        
        showToast('Imported ' + polys.length + ' polygon(s)', 'success');
        if (fileEl) fileEl.value = '';
    } catch (err) { 
        console.error('[Polygon Import] Error:', err); 
        showToast('Import failed: ' + err.message, 'error'); 
    }
}

function kmlToGeoJSON(kml) {
    const doc = new DOMParser().parseFromString(kml, 'text/xml');
    const features = [];
    doc.querySelectorAll('Placemark').forEach(pm => {
        const name = pm.querySelector('name')?.textContent || 'Unnamed';
        const coords = pm.querySelector('coordinates');
        if (!coords) return;
        const pts = coords.textContent.trim().split(/\s+/).map(c => {
            const [lng, lat] = c.split(',').map(Number);
            return [lng, lat];
        }).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
        if (pts.length < 3) return;
        features.push({ type:'Feature', geometry:{ type:'Polygon', coordinates:[pts] }, properties:{ name } });
    });
    return { type:'FeatureCollection', features };
}

// === Feed List ===
async function refreshFeedsList() {
    const feeds = dataManager.getAllFeeds();
    const ff = document.getElementById('feedFilter');
    if (ff) {
        ff.innerHTML = '<option value="">All Feeds</option>';
        feeds.forEach(f => {
            const o = document.createElement('option');
            o.value = f.id;
            const hiddenSuffix = hiddenFeedIds.has(f.id) ? ' (hidden)' : '';
            o.textContent = f.name + hiddenSuffix;
            if (hiddenFeedIds.has(f.id)) o.style.color = 'var(--gray-400)';
            ff.appendChild(o);
        });
    }
    const list = document.getElementById('feedList');
    const empty = document.getElementById('emptyFeeds');
    const reset = document.getElementById('resetDbSection');
    if (!list) return;
    if (!feeds.length) {
        list.innerHTML = '';
        if (empty) empty.style.display = 'block';
        if (reset) reset.style.display = 'none';
        return;
    }
    if (empty) empty.style.display = 'none';
    if (reset) reset.style.display = 'block';
    
    list.innerHTML = feeds.map(f => {
        const isVisible = !hiddenFeedIds.has(f.id);
        const eyeIcon = isVisible ? EYE_OPEN : EYE_CLOSED;
        return `<li class="dock-list-item">
            <div class="dock-list-item-info">
                <div class="dock-list-item-name">${f.name}</div>
                <div class="dock-list-item-detail">${f.stats?.routeCount||0} routes · ${f.stats?.stopCount||0} stops</div>
            </div>
            <button class="dock-list-item-action" data-toggle-feed="${f.id}" title="Toggle visibility">${eyeIcon}</button>
            <button class="dock-list-item-delete" data-rm-feed="${f.id}" title="Remove">×</button>
        </li>`;
    }).join('');
    
    // Wire up visibility toggle buttons
    list.querySelectorAll('[data-toggle-feed]').forEach(btn => {
        btn.addEventListener('click', () => {
            const feedId = parseInt(btn.dataset.toggleFeed);
            console.log('[Feed Visibility] Toggling feed:', feedId);
            toggleFeedVisibility(feedId);
        });
    });
    
    // Wire up delete buttons
    list.querySelectorAll('[data-rm-feed]').forEach(b => {
        b.addEventListener('click', () => removeFeed(parseInt(b.dataset.rmFeed)));
    });
}

async function removeFeed(id) {
    const feed = dataManager.getFeed(id);
    const feedName = feed ? feed.name : 'this feed';
    if (!confirm(`Remove ${feedName}?\n\nThis will permanently delete the feed and all its data.`)) return;
    dataManager.removeFeed(id);
    hiddenFeedIds.delete(id); // Clean up visibility tracking
    await refreshFeedsList();
    await refreshAgenciesFilter();
    await renderAllRoutesAndStops();
    showToast('Feed removed', 'success');
    markDirty();
}

async function toggleFeedVisibility(feedId) {
    console.log('[Feed Visibility] Toggle called for feed:', feedId, 'Current hidden:', hiddenFeedIds.has(feedId));
    
    if (hiddenFeedIds.has(feedId)) {
        // Show feed
        hiddenFeedIds.delete(feedId);
        console.log('[Feed Visibility] Showing feed:', feedId);
        
        // Re-render feed list to update icon
        await refreshFeedsList();
        
        // Reload agencies (feed's agencies may now be visible)
        await refreshAgenciesFilter();
        
        // Re-render routes and stops (WITHOUT changing zoom)
        await renderAllRoutesAndStops();
        
        showToast('Feed shown', 'success');
    } else {
        // Hide feed
        hiddenFeedIds.add(feedId);
        console.log('[Feed Visibility] Hiding feed:', feedId);
        
        // Re-render feed list to update icon
        await refreshFeedsList();
        
        // Reload agencies (feed's agencies should be hidden)
        await refreshAgenciesFilter();
        
        // Re-render routes and stops (WITHOUT changing zoom)
        await renderAllRoutesAndStops();
        
        showToast('Feed hidden', 'success');
    }
    
    markDirty();
}

async function resetDatabase() {
    if (!confirm('Remove all data?\n\nThis will permanently delete all feeds and polygons.')) return;
    dataManager.clear();
    currentPolygons = [];
    polygonLayers.forEach(l => map.removeLayer(l));
    polygonLayers = [];
    visiblePolygonIds.clear();
    visibleAgencyIds.clear();
    hiddenFeedIds.clear(); // Clear hidden feeds tracking
    clearMapLayers();
    await refreshFeedsList();
    await refreshAgenciesFilter();
    updatePolygonsList();
    updatePolygonLayerToggles();
    showToast('All data removed', 'success');
    markDirty();
}

// === Agency Filter ===
async function refreshAgenciesFilter() {
    const feedId = parseInt(document.getElementById('feedFilter')?.value) || null;
    
    // Get agencies from all non-hidden feeds
    let rawAgencies = dataManager.getAgencies ? dataManager.getAgencies(feedId) : [];
    rawAgencies = rawAgencies.filter(a => !hiddenFeedIds.has(a.feedId));
    
    // Unify agencies by name across feeds (same agency name = ONE logical agency)
    console.log('[Agency Filter] Raw agencies:', rawAgencies.length);
    const agencyMap = new Map();
    rawAgencies.forEach(a => {
        const name = a.agency_name || a.agency_id || 'Unknown';
        if (!agencyMap.has(name)) {
            agencyMap.set(name, {
                unified_id: name, // Use name as unified ID
                agency_name: name,
                agency_ids: [], // Track all original agency_ids
                feed_ids: [] // Track which feeds this agency appears in
            });
        }
        const unified = agencyMap.get(name);
        if (a.agency_id && !unified.agency_ids.includes(a.agency_id)) {
            unified.agency_ids.push(a.agency_id);
        }
        if (a.feedId && !unified.feed_ids.includes(a.feedId)) {
            unified.feed_ids.push(a.feedId);
        }
    });
    
    const unifiedAgencies = Array.from(agencyMap.values());
    console.log('[Agency Filter] Unified agencies:', unifiedAgencies.length);
    
    const grp = document.getElementById('agencyFilterGroup');
    const list = document.getElementById('agencyToggleList');
    
    // Always show agency filter if there are any agencies
    if (unifiedAgencies.length === 0) {
        if (grp) grp.style.display = 'none';
        return;
    }
    
    // Show filter even with 1 agency
    if (grp) grp.style.display = 'block';
    
    // Initialize visible agencies on first load - use ORIGINAL agency_ids, not unified_id
    if (!visibleAgencyIds.size) {
        unifiedAgencies.forEach(ua => {
            ua.agency_ids.forEach(aid => visibleAgencyIds.add(aid));
        });
    }
    
    if (list) {
        list.innerHTML = unifiedAgencies.map(ua => {
            // Check if ALL original agency_ids are visible
            const allVisible = ua.agency_ids.every(aid => visibleAgencyIds.has(aid));
            return `<label class="toggle-item">
                <input type="checkbox" data-unified="${ua.unified_id}" data-aids="${ua.agency_ids.join(',')}"${allVisible ? ' checked' : ''}>
                <span>${ua.agency_name}</span>
            </label>`;
        }).join('');
        
        list.querySelectorAll('[data-unified]').forEach(cb => {
            cb.addEventListener('change', () => {
                console.log('[Agency Filter] Agency toggled:', cb.dataset.unified, cb.checked);
                const agencyIds = cb.dataset.aids.split(',');
                if (cb.checked) {
                    // Add all original agency_ids
                    agencyIds.forEach(aid => visibleAgencyIds.add(aid));
                } else {
                    // Remove all original agency_ids
                    agencyIds.forEach(aid => visibleAgencyIds.delete(aid));
                }
                renderAllRoutesAndStops();
                markDirty();
            });
        });
    }
}

function toggleAllAgencies(on) {
    const checkboxes = document.querySelectorAll('#agencyToggleList [data-unified]');
    checkboxes.forEach(cb => {
        cb.checked = on;
        const agencyIds = cb.dataset.aids.split(',');
        if (on) {
            agencyIds.forEach(aid => visibleAgencyIds.add(aid));
        } else {
            agencyIds.forEach(aid => visibleAgencyIds.delete(aid));
        }
    });
    renderAllRoutesAndStops();
}

// === Layer Toggles ===
function toggleAllRoutes(on) {
    document.querySelectorAll('#routeToggleList input[type="checkbox"]').forEach(c => c.checked = on);
    applyFilters();
}
function toggleAllPolygons(on) {
    if (on) currentPolygons.forEach(p => visiblePolygonIds.add(p.id));
    else visiblePolygonIds.clear();
    document.querySelectorAll('#polygonToggleList input[type="checkbox"]').forEach(c => c.checked = on);
    renderPolygonVis();
}
function toggleStopsVisibility(vis) {
    if (!stopsLayer) return;
    if (vis) {
        if (!map.hasLayer(stopsLayer)) map.addLayer(stopsLayer);
    } else {
        if (map.hasLayer(stopsLayer)) map.removeLayer(stopsLayer);
    }
}
function updatePolygonLayerToggles() {
    const sec = document.getElementById('polygonLayerSection');
    const list = document.getElementById('polygonToggleList');
    if (!currentPolygons.length) { if (sec) sec.style.display = 'none'; return; }
    if (sec) sec.style.display = 'block';
    if (list) {
        list.innerHTML = currentPolygons.map(p => '<label class="toggle-item"><input type="checkbox" data-ptog="' + p.id + '"' + (visiblePolygonIds.has(p.id) ? ' checked':'') + '><span>' + p.name + '</span></label>').join('');
        list.querySelectorAll('[data-ptog]').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) visiblePolygonIds.add(cb.dataset.ptog);
                else visiblePolygonIds.delete(cb.dataset.ptog);
                renderPolygonVis();
            });
        });
    }
}
function renderPolygonVis() {
    console.log('[Polygon Visibility] Rendering polygon visibility');
    currentPolygons.forEach((p, i) => {
        const lyr = polygonLayers[i];
        if (!lyr) return;
        if (visiblePolygonIds.has(p.id)) { 
            if (!map.hasLayer(lyr)) {
                console.log('[Polygon Visibility] Showing polygon:', p.name);
                map.addLayer(lyr); 
            }
        }
        else {
            console.log('[Polygon Visibility] Hiding polygon:', p.name);
            map.removeLayer(lyr);
        }
    });
}

// === Calendar ===
function handleDayTypeChange() {
    const sel = document.getElementById('dayTypeSelect');
    const wrap = document.getElementById('calTriggerWrap');
    if (sel?.value === 'specific') { if (wrap) wrap.style.display = 'block'; }
    else { if (wrap) wrap.style.display = 'none'; }
    applyFilters();
}
function toggleCalendar(e) {
    e.stopPropagation();
    const pop = document.getElementById('calPopup');
    if (!pop) return;
    if (pop.style.display === 'block') { pop.style.display = 'none'; return; }
    pop.style.display = 'block';
    pop.innerHTML = '<input type="date" id="calDatePicker" style="padding:0.5rem;border:1px solid var(--gray-300);border-radius:var(--radius);font-family:inherit;">';
    const pk = document.getElementById('calDatePicker');
    if (pk && selectedCalendarDate) pk.value = selectedCalendarDate.substring(0,4)+'-'+selectedCalendarDate.substring(4,6)+'-'+selectedCalendarDate.substring(6,8);
    pk?.addEventListener('change', () => {
        if (pk.value) {
            selectedCalendarDate = pk.value.replace(/-/g,'');
            const tt = document.getElementById('calTriggerText');
            if (tt) tt.textContent = pk.value;
            pop.style.display = 'none';
            applyFilters();
        }
    });
}
function fmtDate(d) {
    return '' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
}

// === Filters ===
async function applyFilters() {
    console.log('[Filters] Apply filters called');
    await renderAllRoutesAndStops();
}
function clearFilters() {
    const ff = document.getElementById('feedFilter'); if (ff) ff.value = '';
    const dt = document.getElementById('dayTypeSelect'); if (dt) dt.value = 'all';
    const cw = document.getElementById('calTriggerWrap'); if (cw) cw.style.display = 'none';
    selectedCalendarDate = fmtDate(new Date());
    selectedRouteDetails = null;
    applyFilters();
    showToast('Filters cleared', 'info');
}
function getSelectedRouteTypes() {
    const t = [];
    for (let i = 0; i <= 7; i++) { const cb = document.getElementById('routeType'+i); if (cb?.checked) t.push(i); }
    return t;
}
function displayRoutes(routes) {
    const sec = document.getElementById('routeLayerSection');
    const list = document.getElementById('routeToggleList');
    if (!routes?.length) { if (sec) sec.style.display = 'none'; return; }
    if (sec) sec.style.display = 'block';
    if (list) {
        list.innerHTML = routes.slice(0,50).map(r => {
            const c = getRouteTypeConfig(r.route_type);
            return '<label class="toggle-item" style="cursor:pointer"><span style="color:'+c.color+';font-weight:600">'+(r.route_short_name||r.route_id)+'</span></label>';
        }).join('');
    }
}
async function displayRouteOnMap(details, fitBounds = true) {
    clearMapLayers();
    if (!details.variants?.length) { showToast('No variants on selected date', 'warning'); return; }
    const v = details.variants[0];
    if (v.coordinates?.length) {
        const c = getRouteTypeConfig(details.route_type);
        const pl = L.polyline(v.coordinates, { color: c.color, weight: 4, opacity: 0.7 }).addTo(routeShapesLayer);
        if (fitBounds) {
            console.log('[Route Display] Fitting bounds to route');
            map.fitBounds(pl.getBounds());
        }
    }
    if (v.stops) {
        v.stops.forEach(s => {
            const m = L.circleMarker([s.stop_lat, s.stop_lon], { radius:6, fillColor: getRouteTypeConfig(details.route_type).color, color:'#fff', weight:2, opacity:1, fillOpacity:0.8 }).addTo(stopsLayer);
            m.bindPopup('<strong>'+s.stop_name+'</strong>' + (s.stop_code ? '<br>Code: '+s.stop_code : ''));
        });
    }
    showToast('Showing ' + (details.route_short_name||details.route_long_name) + ' (' + (v.stops?.length||0) + ' stops)', 'success');
}
function clearMapLayers() {
    if (stopsLayer) stopsLayer.clearLayers();
    if (routeShapesLayer) routeShapesLayer.clearLayers();
}

// === Polygon List (Data tab) ===
function updatePolygonsList() {
    const list = document.getElementById('polygonList');
    const empty = document.getElementById('emptyPolygons');
    if (!list) return;
    if (!currentPolygons.length) {
        list.innerHTML = '';
        if (empty) empty.style.display = 'block';
        updatePolygonLayerToggles();
        return;
    }
    if (empty) empty.style.display = 'none';
    list.innerHTML = currentPolygons.map(p => '<li class="dock-list-item"><div class="dock-list-item-info"><div class="dock-list-item-name">'+p.name+'</div></div><button class="dock-list-item-action" data-ptogvis="'+p.id+'" title="Toggle">'+(visiblePolygonIds.has(p.id)?EYE_OPEN:EYE_CLOSED)+'</button><button class="dock-list-item-delete" data-prm="'+p.id+'" title="Remove">×</button></li>').join('');
    list.querySelectorAll('[data-ptogvis]').forEach(b => {
        b.addEventListener('click', () => {
            const id = b.dataset.ptogvis;
            if (visiblePolygonIds.has(id)) visiblePolygonIds.delete(id); else visiblePolygonIds.add(id);
            updatePolygonsList(); renderPolygonVis(); markDirty();
        });
    });
    list.querySelectorAll('[data-prm]').forEach(b => {
        b.addEventListener('click', () => removePolygon(b.dataset.prm));
    });
    updatePolygonLayerToggles();
}
function removePolygon(id) {
    const poly = currentPolygons.find(p => p.id === id);
    const polyName = poly ? poly.name : 'this polygon';
    if (!confirm(`Remove ${polyName}?`)) return;
    const idx = currentPolygons.findIndex(p => p.id === id);
    if (idx === -1) return;
    currentPolygons.splice(idx, 1);
    if (polygonLayers[idx]) { map.removeLayer(polygonLayers[idx]); polygonLayers.splice(idx, 1); }
    visiblePolygonIds.delete(id);
    updatePolygonsList();
    showToast('Polygon removed', 'success');
    markDirty();
}

// === Project Management ===
function newProject() {
    if (projectState.isDirty && !confirm('Discard unsaved changes?')) return;
    dataManager.clear();
    currentPolygons = [];
    polygonLayers.forEach(l => map.removeLayer(l));
    polygonLayers = [];
    visiblePolygonIds.clear();
    visibleAgencyIds.clear();
    hiddenFeedIds.clear(); // Clear hidden feeds tracking
    selectedCalendarDate = fmtDate(new Date());
    selectedRouteDetails = null;
    clearMapLayers();
    projectState = { projectName:'Untitled Project', isDirty:false, savedFilePath:null, createdAt: new Date().toISOString() };
    updateProjectNameDisplay();
    refreshFeedsList();
    refreshAgenciesFilter();
    updatePolygonsList();
    showToast('New project created', 'success');
}

async function saveProjectUI() {
    const filters = {
        selectedDate: selectedCalendarDate,
        selectedFeedId: document.getElementById('feedFilter')?.value || null,
        visibleAgencyIds: Array.from(visibleAgencyIds),
        routeTypes: getSelectedRouteTypes()
    };
    const state = captureProjectState(projectState.projectName, map, currentPolygons, dataManager.getAllFeeds(), filters);
    const result = await saveProject(state, projectState.projectName + '.tde');
    if (result.success && !result.cancelled) { markClean(); showToast('Project saved', 'success'); }
}

async function saveProjectAsUI() {
    const nm = prompt('Project name:', projectState.projectName);
    if (!nm) return;
    projectState.projectName = nm;
    if (!projectState.createdAt) projectState.createdAt = new Date().toISOString();
    await saveProjectUI();
    updateProjectNameDisplay();
}

async function loadProjectUI() {
    const fi = document.getElementById('projectFileInput');
    if (!fi?.files?.length) return;
    try {
        const restored = await loadProject(fi.files[0]);
        if (restored.mapState) map.setView([restored.mapState.center.lat, restored.mapState.center.lng], restored.mapState.zoom);
        currentPolygons = restored.polygons || [];
        visiblePolygonIds.clear();
        currentPolygons.forEach(p => visiblePolygonIds.add(p.id));
        renderPolygons();
        updatePolygonsList();
        if (restored.filters) {
            selectedCalendarDate = restored.filters.selectedDate;
            if (restored.filters.visibleAgencyIds) visibleAgencyIds = new Set(restored.filters.visibleAgencyIds);
        }
        projectState.projectName = restored.projectName;
        projectState.createdAt = restored.createdAt;
        projectState.isDirty = false;
        updateProjectNameDisplay();
        if (restored.feeds?.length) showMissingBanner(restored.feeds);
        showToast('Project loaded', 'success');
        fi.value = '';
    } catch (err) { console.error(err); showToast('Load failed: ' + err.message, 'error'); }
}

function renderPolygons() {
    polygonLayers.forEach(l => map.removeLayer(l));
    polygonLayers = [];
    currentPolygons.forEach(p => {
        const lyr = L.geoJSON(p.geometry, { style:{ color:'#3498db', weight:2, opacity:0.8, fillOpacity:0.2 } }).addTo(map);
        lyr.bindPopup('<strong>'+p.name+'</strong>');
        polygonLayers.push(lyr);
    });
}

function showMissingBanner(feeds) {
    const b = document.createElement('div');
    b.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9999;max-width:600px;padding:1.5rem;background:#FFF3CD;border:2px solid #FFC107;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    b.innerHTML = '<h3 style="margin:0 0 .5rem;color:#856404">⚠️ GTFS Data Not Included</h3><p style="color:#856404">Requires '+feeds.length+' feed(s):</p><ul style="padding-left:1.5rem">' + feeds.map(f => '<li style="color:#856404">'+f.name+(f.sourceUrl?' <a href="'+f.sourceUrl+'" target="_blank">(Download)</a>':'')+'</li>').join('') + '</ul><button style="margin-top:.75rem;padding:.4rem 1rem;border:1px solid #856404;background:transparent;border-radius:4px;cursor:pointer;color:#856404">Got it</button>';
    document.body.appendChild(b);
    b.querySelector('button').addEventListener('click', () => b.remove());
}

// === Utils ===
function markDirty() {
    projectState.isDirty = true;
    updateProjectNameDisplay();
    const ind = document.getElementById('burgerIndicator');
    if (ind) { ind.style.display = 'block'; ind.className = 'burger-indicator dirty'; }
}
function markClean() {
    projectState.isDirty = false;
    updateProjectNameDisplay();
    const ind = document.getElementById('burgerIndicator');
    if (ind) ind.style.display = 'none';
}
function updateProjectNameDisplay() {
    const d = document.getElementById('projectNameDisplay');
    if (!d) return;
    if (projectState.projectName && projectState.projectName !== 'Untitled Project') {
        d.textContent = projectState.projectName + (projectState.isDirty ? ' •' : '');
        d.style.display = 'inline';
    } else d.style.display = 'none';
}
function showToast(msg, type) {
    type = type || 'info';
    const existing = document.getElementById('toast');
    if (existing) {
        const m = existing.querySelector('.toast-message');
        const ic = existing.querySelector('.toast-icon');
        if (m) m.textContent = msg;
        if (ic) ic.textContent = type === 'error' ? '✗' : type === 'warning' ? '⚠' : '✓';
        existing.className = 'toast toast-' + type + ' show';
        clearTimeout(existing._ht);
        existing._ht = setTimeout(() => existing.classList.remove('show'), 3000);
        return;
    }
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.parentElement?.removeChild(t), 300); }, 3000);
}

// === Global exports for dynamically generated onclick in innerHTML ===
window.selectRoute = async function(feedId, routeId) {
    const det = dataManager.getRouteDetails ? dataManager.getRouteDetails(feedId, routeId, selectedCalendarDate) : null;
    if (!det) { showToast('Route not found', 'error'); return; }
    selectedRouteDetails = det;
    await displayRouteOnMap(det);
};

window.dataManager = dataManager;
window.projectState = projectState;
console.log('Transit Data Explorer v' + APP_VERSION + ' ready.');
