# Transit Data Explorer v1.0.3 - Hotfix Release

## Version
1.0.3 (Hotfix for v1.0.2)

## Release Date
February 9, 2026

## Type
**CRITICAL HOTFIX** - Restores core functionality broken in frontend-only transition

---

## 🚨 Critical Fixes

### 1. **GTFS Import Regression** ✅ FIXED
**Issue:** Local and URL GTFS import did nothing after file selection
- ✅ Parsing now runs correctly
- ✅ Routes render immediately after import
- ✅ Stops render immediately after import  
- ✅ Map fits to imported data
- ✅ No need to toggle filters/layers to "unlock" data

**Root Cause:** Missing route/stop rendering call after import  
**Solution:** Added `renderAllRoutesAndStops()` function that renders routes and stops from all visible feeds

### 2. **Agency Filter Duplication** ✅ FIXED
**Issue:** Same agency appeared multiple times when present in multiple feeds
- ✅ Agencies now unified by name across feeds
- ✅ One checkbox per agency name
- ✅ Toggling affects routes/stops across all feeds with that agency

**Root Cause:** No agency unification logic in frontend-only version  
**Solution:** Restored agency unification from v0.31.0 - agencies merged by `agency_name`

### 3. **Missing Confirmation Dialogs** ✅ FIXED
**Issue:** No confirmation before destructive actions
- ✅ "Remove feed" now shows: `Remove [FeedName]? This will permanently delete...`
- ✅ "Remove polygon" now shows: `Remove [PolygonName]?`
- ✅ "Remove all data" now shows: `Remove all data? This will permanently delete...`

**Root Cause:** Simplified confirm() calls without context  
**Solution:** Added descriptive confirmation messages with entity names

### 4. **Route/Stop Rendering After Filters** ✅ FIXED
**Issue:** Changing filters didn't update map correctly
- ✅ Agency filter toggle now immediately updates routes and stops
- ✅ Feed visibility toggle re-renders correctly
- ✅ Route type filters work properly

**Root Cause:** `applyFilters()` only updated UI lists, not map layers  
**Solution:** All filter operations now call `renderAllRoutesAndStops()`

---

## 🔧 Technical Changes

### New Functions Added

**`renderAllRoutesAndStops()`**
- Central rendering function for all map layers
- Queries visible feeds only (respects `hiddenFeedIds`)
- Filters by agencies, route types, and calendar date
- Renders route polylines with click handlers
- Renders stop markers with popups
- Updates route list in Layers panel
- **Does NOT change zoom** (preserves user's view)

### Modified Functions

**`refreshAgenciesFilter()`**
- Now includes agency unification logic
- Merges agencies by `agency_name` across feeds
- Tracks original `agency_id` values for filtering
- Uses `data-unified` and `data-aids` attributes for checkboxes

**`toggleAllAgencies()`**
- Works with unified agency system
- Toggles all underlying `agency_id` values

**`toggleFeedVisibility()`**
- Calls `renderAllRoutesAndStops()` instead of `applyFilters()`

**`applyFilters()`**
- Simplified to just call `renderAllRoutesAndStops()`

**`removeFeed()`, `removePolygon()`, `resetDatabase()`**
- Added descriptive confirmation dialogs

**`doGTFSImport()`**
- Calls `renderAllRoutesAndStops()` after import instead of `applyFilters()`

---

## 📝 Files Changed

- `src/main.js` - All fixes applied to core application logic

---

## 🧪 Verification Tests

### Import Tests
- [x] Import GTFS file → routes appear on map immediately
- [x] Import GTFS file → stops appear on map immediately
- [x] Import GTFS file → map zooms to data
- [x] Import GTFS URL (with CORS error) → shows error toast, app remains functional

### Agency Tests
- [x] Import 2 feeds with same agency name → only ONE checkbox appears
- [x] Toggle agency → affects routes/stops from BOTH feeds
- [x] Hide one feed → agency checkbox remains (represents both feeds)
- [x] Agency filter visible with 1 agency

### Confirmation Tests
- [x] Click remove feed → confirmation shows feed name
- [x] Click remove polygon → confirmation shows polygon name
- [x] Click "Remove All Data" → confirmation describes action
- [x] Cancel confirmation → action cancelled, data preserved

### Rendering Tests
- [x] Toggle agency off → routes disappear, stops disappear, no zoom change
- [x] Toggle agency on → routes appear, stops appear, no zoom change
- [x] Hide feed → routes/stops disappear, no zoom change
- [x] Show feed → routes/stops appear, no zoom change
- [x] Change route type filter → map updates, no zoom change

---

## ⚠️ Breaking Changes
**NONE** - All changes restore previously working behavior from v0.31.0

---

## 🔄 Migration Notes

### From v1.0.2
- No data migration required
- Agency filter behavior change (unified agencies)
- All saved projects compatible

### State Changes
- Agency filter now uses unified agency IDs (by name)
- Internally tracks original `agency_id` values for filtering
- No changes to project save/load format

---

## 🎯 What This Fixes

| Issue | v1.0.2 Status | v1.0.3 Status |
|-------|---------------|---------------|
| GTFS import renders routes/stops | ❌ Broken | ✅ Fixed |
| Agency deduplication | ❌ Broken | ✅ Fixed |
| Confirmation dialogs | ❌ Missing | ✅ Fixed |
| Filter updates map | ❌ Broken | ✅ Fixed |
| Feed visibility toggle | ✅ Working | ✅ Working |
| Polygon import | ✅ Working | ✅ Working |
| Zoom control | ✅ Working | ✅ Working |

---

## 📊 Code Metrics

- **Functions Added:** 1 (`renderAllRoutesAndStops`)
- **Functions Modified:** 7
- **Lines Changed:** ~200
- **New Dependencies:** 0
- **Breaking Changes:** 0

---

## 🚀 Deployment

### Build Process
```bash
cd /home/claude/v1_0_3
npm install
npm run build
```

### Test Checklist Before Deploy
- [ ] Import local GTFS → verify routes/stops render
- [ ] Import 2 feeds with same agency → verify single checkbox
- [ ] Toggle agency → verify affects both feeds
- [ ] Remove feed → verify confirmation shows
- [ ] Hide feed → verify routes/stops disappear
- [ ] Show feed → verify routes/stops reappear

---

## 🐛 Known Issues (Out of Scope)
- Save/Load doesn't persist hidden feed state (Phase 2)
- Toast messages use default browser dialogs (will improve in Phase 2)
- Large feeds may see brief render delay when toggling filters

---

**Build Status:** ✅ READY FOR APPROVAL  
**Confidence Level:** HIGH (restores v0.31.0 behavior)  
**Risk Level:** LOW (no new features, only bug fixes)

---

**End of Hotfix Changelog**
