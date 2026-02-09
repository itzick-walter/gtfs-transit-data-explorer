# Transit Data Explorer - Version 1.0.2 Changelog

## Release Date
February 9, 2026

## Version
1.0.2

## Phase 1: Core Map Rendering and Data Import Stabilization

### Summary
This release brings v1.0.2 to a stable working state for core map rendering and data import functionality. The primary focus is establishing reliable import workflows, correct show/hide behavior, and ensuring zoom behavior is strictly controlled (zoom only changes during import, never during visibility toggles).

---

## 🎯 Major Features Added

### Feed Visibility Toggle
- **Added show/hide functionality for feeds** - Each feed in the Data tab now has an eye icon button to toggle visibility
- Hiding a feed removes its routes and stops from the map without deleting the data
- Feed filter dropdown shows "(hidden)" suffix for hidden feeds
- Hidden feeds are excluded from agency filter and route queries
- Feed visibility state tracked via `hiddenFeedIds` Set

### Agency Filter Always Visible
- **Fixed agency filter behavior** - Agency filter section now displays even when only one agency exists
- Previously hidden when less than 2 agencies, making single-agency feeds unusable
- Agency filter correctly excludes agencies from hidden feeds
- Toggling agency visibility affects both routes AND stops

---

## 🐛 Bug Fixes

### Zoom Control
- **Feed import now fits map bounds** - Importing GTFS data automatically zooms to show all imported stops
- **Polygon import fits to new polygons only** - Map zooms to newly imported polygons on import
- **Visibility toggles never change zoom** - Hiding/showing feeds or polygons maintains current map view
- Added `fitBounds` parameter to `displayRouteOnMap()` to control zoom behavior

### Polygon Import
- **Improved polygon name extraction** - Names correctly extracted from:
  - GeoJSON `properties.name` (preferred)
  - KML `<name>` elements  
  - Filename fallback when no name property exists
- **Fixed polygon visibility persistence** - Polygon show/hide state correctly maintained
- **Enhanced logging** - Console logs track polygon import and name extraction

### Feed Visibility
- **Routes and stops respond to feed visibility** - Hiding a feed removes both its routes AND stops from the map
- **Filter queries respect hidden feeds** - Route queries exclude hidden feeds
- **Agency filter updates on feed toggle** - Hiding a feed removes its agencies from the filter list

---

## 🔧 Technical Improvements

### Console Logging
- Added debug logs for:
  - Feed visibility toggles: `[Feed Visibility] Toggle called for feed: X`
  - Filter application: `[Filters] Apply filters called`
  - Polygon import: `[Polygon Import] Starting import of: X`
  - Route display: `[Route Display] Fitting bounds to route`
  - GTFS import: `[GTFS Import] Fitting map to imported data`

### Code Quality
- Improved event handler organization
- Better separation of concerns between visibility and data management
- Consistent state tracking across all data types (feeds, polygons, agencies)

---

## 📋 Files Modified

### `/src/main.js`
- Added `hiddenFeedIds` Set for tracking hidden feeds
- Implemented `toggleFeedVisibility()` function
- Updated `refreshFeedsList()` to include visibility toggle buttons
- Modified `refreshAgenciesFilter()` to always show and respect hidden feeds
- Enhanced `applyFilters()` to exclude hidden feeds from queries
- Added `fitBounds` parameter to `displayRouteOnMap()`
- Updated `doGTFSImport()` to fit map bounds after import
- Improved `handleImportPolygon()` with better name extraction and logging
- Updated `renderPolygonVis()` with logging
- Updated `resetDatabase()` and `newProject()` to clear `hiddenFeedIds`

---

## ⚠️ Known Limitations (Out of Scope for Phase 1)

The following items are intentionally deferred:
- Save/Load functionality updates (Phase 2)
- Route selection and highlighting
- Advanced filtering options
- Performance optimizations for very large datasets
- Multi-agency merging logic

---

## 🧪 QA Checklist (Phase 1)

### GTFS Import
- [ ] Import local GTFS zip file successfully
- [ ] Verify routes, stops, and shapes render on map
- [ ] Confirm no missing layers after import
- [ ] Verify map fits to imported data (zoom changes)

### Feed Visibility
- [ ] Hide feed via eye icon button
- [ ] Confirm routes AND stops disappear from map
- [ ] Show feed via eye icon button  
- [ ] Confirm routes AND stops reappear without zoom change
- [ ] Verify feed filter dropdown shows "(hidden)" for hidden feeds

### Polygon Import - KML
- [ ] Import KML file with named polygons
- [ ] Verify polygon renders on map
- [ ] Confirm polygon name displays correctly
- [ ] Verify map fits to imported polygon (zoom changes)
- [ ] Hide polygon via Layers tab toggle
- [ ] Show polygon via Layers tab toggle
- [ ] Confirm toggle works without zoom change

### Polygon Import - GeoJSON
- [ ] Import GeoJSON file with named polygons
- [ ] Verify polygon renders on map
- [ ] Confirm polygon name extracted from properties.name
- [ ] Verify map fits to imported polygon (zoom changes)
- [ ] Toggle visibility without zoom change

### Agency Filter
- [ ] Import feed with single agency
- [ ] Verify agency filter section is visible (not hidden)
- [ ] Toggle agency checkbox off
- [ ] Confirm both routes AND stops disappear
- [ ] Toggle agency checkbox on
- [ ] Confirm both routes AND stops reappear
- [ ] Verify no zoom change during toggle

### Multi-Feed Scenarios
- [ ] Import two feeds
- [ ] Hide first feed, verify only second feed's data visible
- [ ] Show first feed, verify both feeds visible
- [ ] Confirm agency filter shows agencies from visible feeds only

---

## 🔄 Migration Notes

### From v1.0.1
No breaking changes. All existing functionality preserved while adding:
- Feed visibility toggles
- Improved agency filter behavior  
- Better zoom control
- Enhanced polygon name handling

### State Changes
- Added `hiddenFeedIds` Set to global state
- No changes to data structures or file formats
- Project save/load functionality unchanged (will be updated in Phase 2)

---

## 📝 Notes

### Design Decisions
1. **Feed visibility is non-destructive** - Hidden feeds remain in memory, only removed from display
2. **Zoom only on import** - Maintains user's current view when toggling visibility
3. **Agency filter always visible** - Even single-agency feeds show the filter for consistency
4. **Console logging for debugging** - Extensive logs help track state changes during development

### Performance Considerations
- Feed visibility queries filter at runtime (acceptable for Phase 1)
- Large feeds may see slight delay when toggling visibility (will optimize in later phases)
- Polygon rendering unchanged from v1.0.1

---

## 🎯 Next Steps (Phase 2 Preview)

Future phases will address:
- Save/Load integration with feed visibility state
- Project file format updates to store hidden feed IDs
- Route selection and highlighting improvements
- Performance optimizations for large metro feeds
- Enhanced polygon editing capabilities

---

## 🐛 Bug Reports

If you encounter issues, please check:
1. Browser console for error messages
2. Verify GTFS file format is valid
3. Check that polygon files contain valid Polygon/MultiPolygon geometries
4. Review console logs prefixed with `[Feed Visibility]`, `[Polygon Import]`, etc.

---

**End of Changelog**
