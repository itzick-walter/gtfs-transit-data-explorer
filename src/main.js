/**
 * Transit Data Explorer v1.0.1 - Main Application
 * 100% Static Frontend - No Backend Required
 * All event handlers wired via addEventListener in initUI().
 */

import { dataManager } from './data-manager.js';
import { captureProjectState, saveProject, loadProject } from './project-io.js';

const APP_VERSION = '1.0.1';

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

const EYE_OPEN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
const EYE_CLOSED = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

// === Global State ===
let map, stopsLayer, routeShapesLayer;
let polygonLayers = [];
let currentPolygons = [];
let visiblePolygonIds = new Set();
let visibleAgencyIds = new Set();
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
    initMap();
    initUI();
    updateProjectNameDisplay();
    selectedCalendarDate = fmtDate(new Date());
});

// === Map (no Leaflet.draw) ===
function initMap() {
    map = L.map('map').setView([40.7128, -74.006], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19
    }).addTo(map);
    stopsLayer = L.layerGroup().addTo(map);
    routeShapesLayer = L.layerGroup().addTo(map);
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
        dataManager.addFeed(feedName, parsed, { ...meta, size: file.size, importedAt: new Date().toISOString() });
        document.body.removeChild(prog);
        await refreshFeedsList();
        await refreshAgenciesFilter();
        await applyFilters();
        showToast('✓ Imported ' + feedName + ' (' + (parsed.stats?.routeCount||0) + ' routes, ' + (parsed.stats?.stopCount||0) + ' stops)', 'success');
        markDirty();
    } catch (err) {
        if (prog.parentElement) document.body.removeChild(prog);
        throw err;
    }
}

// === Polygon Import ===
async function handleImportPolygon() {
    const fileEl = document.getElementById('kmlFile');
    const file = fileEl?.files?.[0];
    if (!file) { showToast('Please select a KML or GeoJSON file', 'error'); return; }
    closePolygonModal();
    try {
        const text = await file.text();
        let gj;
        if (file.name.endsWith('.kml')) gj = kmlToGeoJSON(text);
        else gj = JSON.parse(text);

        let features = [];
        if (gj.type === 'FeatureCollection') features = gj.features;
        else if (gj.type === 'Feature') features = [gj];
        else if (gj.type === 'Polygon' || gj.type === 'MultiPolygon') features = [{ type:'Feature', geometry: gj, properties:{} }];

        const polys = features.filter(f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
        if (!polys.length) { showToast('No polygon geometries found', 'error'); return; }

        polys.forEach((feat, i) => {
            const nm = feat.properties?.name || feat.properties?.Name || file.name.replace(/\.[^.]+$/, '') + (i > 0 ? ' ' + (i+1) : '');
            const poly = { id: 'poly_' + Date.now() + '_' + i, name: nm, geometry: feat.geometry, properties: { name: nm, description: feat.properties?.description || '' }, visible: true };
            currentPolygons.push(poly);
            visiblePolygonIds.add(poly.id);
            const lyr = L.geoJSON(feat.geometry, { style: { color:'#3498db', weight:2, opacity:0.8, fillOpacity:0.2 } }).addTo(map);
            lyr.bindPopup('<strong>' + nm + '</strong>');
            polygonLayers.push(lyr);
        });
        updatePolygonsList();
        updatePolygonLayerToggles();
        markDirty();
        if (polygonLayers.length) map.fitBounds(L.featureGroup(polygonLayers).getBounds());
        showToast('✓ Imported ' + polys.length + ' polygon(s)', 'success');
        if (fileEl) fileEl.value = '';
    } catch (err) { console.error(err); showToast('Import failed: ' + err.message, 'error'); }
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
        feeds.forEach(f => { const o = document.createElement('option'); o.value = f.id; o.textContent = f.name; ff.appendChild(o); });
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
    list.innerHTML = feeds.map(f => '<li class="dock-list-item"><div class="dock-list-item-info"><div class="dock-list-item-name">' + f.name + '</div><div class="dock-list-item-detail">' + (f.stats?.routeCount||0) + ' routes · ' + (f.stats?.stopCount||0) + ' stops</div></div><button class="dock-list-item-delete" data-rm-feed="' + f.id + '" title="Remove">×</button></li>').join('');
    list.querySelectorAll('[data-rm-feed]').forEach(b => {
        b.addEventListener('click', () => removeFeed(parseInt(b.dataset.rmFeed)));
    });
}

async function removeFeed(id) {
    if (!confirm('Remove this feed?')) return;
    dataManager.removeFeed(id);
    await refreshFeedsList();
    await refreshAgenciesFilter();
    clearMapLayers();
    showToast('Feed removed', 'success');
    markDirty();
}

async function resetDatabase() {
    if (!confirm('Remove all data?')) return;
    dataManager.clear();
    currentPolygons = [];
    polygonLayers.forEach(l => map.removeLayer(l));
    polygonLayers = [];
    visiblePolygonIds.clear();
    visibleAgencyIds.clear();
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
    const agencies = dataManager.getAgencies ? dataManager.getAgencies(feedId) : [];
    const grp = document.getElementById('agencyFilterGroup');
    const list = document.getElementById('agencyToggleList');
    if (agencies.length < 2) {
        if (grp) grp.style.display = 'none';
        agencies.forEach(a => visibleAgencyIds.add(a.agency_id));
        return;
    }
    if (grp) grp.style.display = 'block';
    if (!visibleAgencyIds.size) agencies.forEach(a => visibleAgencyIds.add(a.agency_id));
    if (list) {
        list.innerHTML = agencies.map(a => '<label class="toggle-item"><input type="checkbox" data-aid="' + a.agency_id + '"' + (visibleAgencyIds.has(a.agency_id) ? ' checked' : '') + '><span>' + (a.agency_name||a.agency_id) + '</span></label>').join('');
        list.querySelectorAll('[data-aid]').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) visibleAgencyIds.add(cb.dataset.aid);
                else visibleAgencyIds.delete(cb.dataset.aid);
                applyFilters();
            });
        });
    }
}

function toggleAllAgencies(on) {
    const agencies = dataManager.getAgencies ? dataManager.getAgencies() : [];
    if (on) agencies.forEach(a => visibleAgencyIds.add(a.agency_id));
    else visibleAgencyIds.clear();
    document.querySelectorAll('#agencyToggleList [data-aid]').forEach(c => c.checked = on);
    applyFilters();
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
    if (vis) { if (!map.hasLayer(stopsLayer)) map.addLayer(stopsLayer); }
    else map.removeLayer(stopsLayer);
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
    currentPolygons.forEach((p, i) => {
        const lyr = polygonLayers[i];
        if (!lyr) return;
        if (visiblePolygonIds.has(p.id)) { if (!map.hasLayer(lyr)) map.addLayer(lyr); }
        else map.removeLayer(lyr);
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
    const feedId = parseInt(document.getElementById('feedFilter')?.value) || null;
    const routeTypes = getSelectedRouteTypes();
    const agencyIds = Array.from(visibleAgencyIds);
    const routes = dataManager.getRoutes ? dataManager.getRoutes({ feedId, agencyIds: agencyIds.length ? agencyIds : null, routeTypes: routeTypes.length ? routeTypes : null, date: selectedCalendarDate }) : [];
    displayRoutes(routes);
    if (selectedRouteDetails) await displayRouteOnMap(selectedRouteDetails);
    else clearMapLayers();
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
async function displayRouteOnMap(details) {
    clearMapLayers();
    if (!details.variants?.length) { showToast('No variants on selected date', 'warning'); return; }
    const v = details.variants[0];
    if (v.coordinates?.length) {
        const c = getRouteTypeConfig(details.route_type);
        const pl = L.polyline(v.coordinates, { color: c.color, weight: 4, opacity: 0.7 }).addTo(routeShapesLayer);
        map.fitBounds(pl.getBounds());
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
    const idx = currentPolygons.findIndex(p => p.id === id);
    if (idx === -1) return;
    currentPolygons.splice(idx, 1);
    if (polygonLayers[idx]) { map.removeLayer(polygonLayers[idx]); polygonLayers.splice(idx, 1); }
    visiblePolygonIds.delete(id);
    updatePolygonsList();
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
    if (result.success && !result.cancelled) { markClean(); showToast('✓ Project saved', 'success'); }
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
        showToast('✓ Project loaded', 'success');
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
