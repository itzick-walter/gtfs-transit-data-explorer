# Transit Data Explorer v1.0.4 - Comprehensive Fix Release

## Version
1.0.4

## Release Date  
February 9, 2026

## Type
**COMPREHENSIVE FIX** - Version consistency, UI regressions, and feature parity restoration

---

## 🎯 Critical Fixes

### A. Version Number Consistency ✅ FIXED

**Problem:** Version appeared in multiple locations with inconsistent or stale values

**Solution:**
- ✅ Single source of truth: `APP_VERSION` constant in `main.js`
- ✅ Version pill added to top bar (next to app name, subtle styling)
- ✅ About modal shows same version
- ✅ Dock footer shows same version
- ✅ All version displays set dynamically from `APP_VERSION` on boot
- ✅ Changing version in one place updates it everywhere

**Locations Updated:**
- Top bar: Version pill (new) - `<span class="version-pill" id="versionPill">`
- About modal: `#aboutVersion`
- Dock footer: `#dockVersion`
- All set from `APP_VERSION` in `DOMContentLoaded` event

**Build Consistency:**
- Zip filename: `transit-data-explorer-v1.0.4.zip` (includes version)
- Directory inside zip: `v1_0_4` (stable, no decorative version suffix)

---

### B. Stop Rendering Enhancements ✅ RESTORED

**Problem:** Stops rendered as simple blue circles without clustering or metadata

**Solution:**
- ✅ **Stop clustering restored** - Uses Leaflet MarkerClusterGroup
  - Clusters disabled at zoom level 16+
  - Spiderfy on max zoom for overlapping stops
  - Max cluster radius: 50px
- ✅ **Route-type color coding** - Stops colored by primary route type serving them
  - Bus stops → Green (#2E8B57)
  - Metro stops → Blue (#0057B8)
  - Tram stops → Yellow (#F4C430)
  - Rail stops → Red (#8B1E3F)
  - Ferry stops → Teal (#008080)
  - Etc.
- ✅ **Enhanced stop popups** with full metadata:
  - Stop name (larger font)
  - Stop code
  - Stop description (if available)
  - Route types serving this stop
  - Feed name
  - Clean styling with dividers and proper spacing
- ✅ **Better visual markers**
  - Radius: 6px (up from 5px)
  - White border: 2px (up from 1px)
  - Fill opacity: 0.8 (up from 0.7)

**Technical Implementation:**
- Stop → route type mapping built during render
- MarkerClusterGroup configured with optimal settings
- Popup HTML styled inline for consistency

---

### C. Routes Rendering ✅ WORKING

**Status:** Routes already rendering correctly after v1.0.3 fixes

**Verified:**
- ✅ Routes render on map after import
- ✅ Routes appear in Layers tab
- ✅ Route visibility toggles work
- ✅ Route colors match route type
- ✅ Route click handlers work (selectRoute)

---

### D. Agency Filter Unification ✅ RESTORED (v1.0.3)

**Status:** Already fixed in v1.0.3

**Verified:**
- ✅ Same agency name across feeds = ONE checkbox
- ✅ Agency toggle affects routes/stops from all feeds
- ✅ Agency filter respects hidden feeds

---

### E. Feed Import Improvements ✅ ENHANCED

**GTFS Import:**
- ✅ Local GTFS import works correctly (fixed in v1.0.3)
- ✅ Routes and stops render immediately
- ✅ Map fits to imported data
- ✅ No console errors during import

**URL Import Handling:**
- ✅ CORS errors handled gracefully
- ✅ Clear error message: "Cannot import: CORS restriction. Download and use 'From File'."
- ✅ App remains functional after CORS error
- ✅ No repeated retry attempts

**Implementation:**
```javascript
// In handleImportFeedURL
try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    // ... import logic
} catch (err) {
    if (err.name === 'TypeError' || String(err.message).includes('Failed to fetch'))
        showToast('Cannot import: CORS restriction. Download and use "From File".', 'error');
    else showToast('Import failed: ' + err.message, 'error');
}
```

---

### F. Confirmation Dialogs ✅ RESTORED (v1.0.3)

**Status:** Already fixed in v1.0.3

**Verified:**
- ✅ Remove feed: Shows feed name in confirmation
- ✅ Remove polygon: Shows polygon name in confirmation
- ✅ Remove all data: Descriptive confirmation
- ✅ All confirmations block action until user responds

---

### G. UI Polish ✅ IN PROGRESS

**Version Pill Styling:**
```css
.version-pill {
    padding: 0.15rem 0.5rem;
    background: var(--gray-100);
    color: var(--secondary-text);
    font-size: 0.6875rem;
    font-weight: 500;
    border-radius: 999px;
    line-height: 1.3;
    margin-left: 0.25rem;
}
```

**Future Calendar UI Polish:**
- Deferred to future release (Phase 2)
- Current calendar functional but could be more polished

---

## 📊 Technical Changes

### Files Modified

**src/main.js:**
- Updated `APP_VERSION` to '1.0.4'
- Enhanced `DOMContentLoaded` to set all version displays
- Updated `initMap()` to use MarkerClusterGroup
- Enhanced `renderAllRoutesAndStops()` with:
  - Stop → route type mapping
  - Route-type color coding for stops
  - Enhanced popup HTML
- Fixed `toggleStopsVisibility()` for MarkerClusterGroup

**index.html:**
- Added version pill to top bar brand section
- Added CSS for `.version-pill`
- Updated `#aboutVersion` placeholder to v1.0.4
- Updated `#dockVersion` placeholder to v1.0.4
- All versions dynamically set by JavaScript

**Dependencies:**
- Leaflet MarkerCluster already included (no new dependencies)

---

## 🧪 Test Results

### Version Consistency
- [x] Version pill appears in top bar
- [x] About modal shows correct version
- [x] Dock footer shows correct version
- [x] All three match `APP_VERSION` constant

### Stop Rendering
- [x] Stops cluster at low zoom levels
- [x] Stops uncluster at zoom 16+
- [x] Stop colors match route types
- [x] Stop popups show full metadata
- [x] Stop popups include route types and feed name

### Import Workflow
- [x] Local GTFS import → routes + stops appear
- [x] Map zooms to imported data
- [x] No console errors during import
- [x] URL import with CORS → shows clear error message

### Filters & Visibility
- [x] Agency filter works (unified)
- [x] Feed visibility toggle works
- [x] Route type filters work
- [x] All toggles update map correctly

---

## 🔄 Migration from v1.0.3

**Breaking Changes:** NONE

**Data Compatibility:** 100%

**UI Changes:**
- Version pill now visible in top bar (new, non-intrusive)
- Stop markers slightly larger and more colorful
- Stop popups more detailed

**Behavioral Changes:**
- Stops now cluster (better performance with large datasets)
- Stop colors vary by route type (more informative)

---

## 📋 Known Limitations

**Out of Scope (Phase 2):**
- Save/Load doesn't persist hidden feed state
- Calendar UI could be more polished
- Toast notifications could be more sophisticated
- URL feeds can't bypass CORS (browser limitation)

**Performance:**
- Large metro feeds (100k+ stops) may have brief render delay
- Clustering mitigates this at low zoom levels

---

## 🎯 Feature Parity Status

| Feature | v0.31.0 (FE+BE) | v1.0.4 (FE-only) | Status |
|---------|-----------------|------------------|--------|
| GTFS Import | ✅ | ✅ | **RESTORED** |
| Stop Clustering | ✅ | ✅ | **RESTORED** |
| Stop Colors | ✅ | ✅ | **RESTORED** |
| Enhanced Popups | ✅ | ✅ | **RESTORED** |
| Route Rendering | ✅ | ✅ | **WORKING** |
| Agency Unification | ✅ | ✅ | **RESTORED** |
| Feed Visibility | ✅ | ✅ | **WORKING** |
| Confirmations | ✅ | ✅ | **RESTORED** |
| Version Display | ⚠️ Manual | ✅ Auto | **IMPROVED** |
| CORS Handling | N/A (Backend) | ✅ | **IMPLEMENTED** |

---

## 🚀 Deployment Checklist

- [ ] Extract zip to get `v1_0_4` directory
- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Verify `dist/` folder created
- [ ] Test import workflow locally
- [ ] Verify version displays correctly in all locations
- [ ] Deploy `dist/` to GitHub Pages
- [ ] Test on production URL

---

## 📚 Documentation Updates

**README.md:** No changes required  
**BUILD_INSTRUCTIONS.md:** Updated to clarify stable directory name  
**QA_PLAN:** Expanded to include version consistency tests

---

## 🎉 Summary

v1.0.4 achieves **feature parity** with the last stable FE+BE version while maintaining the frontend-only architecture. All critical regressions from the backend removal have been addressed.

**Key Achievements:**
1. ✅ Single source of truth for version number
2. ✅ Stop clustering and color coding restored
3. ✅ Enhanced stop metadata popups
4. ✅ CORS handling for URL imports
5. ✅ All confirmation dialogs working
6. ✅ Agency unification working
7. ✅ Professional version pill in UI

**Production Ready:** YES  
**Confidence Level:** HIGH  
**Risk Level:** LOW (restoration of previous features)

---

**End of Changelog**
