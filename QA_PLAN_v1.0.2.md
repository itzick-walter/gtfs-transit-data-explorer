# Transit Data Explorer v1.0.2 - QA Test Plan (Phase 1)

## Test Environment Setup
- Browser: Chrome/Firefox/Edge latest version
- Clear browser cache before testing
- Use dev server or built version on GitHub Pages
- Have test GTFS files ready (small metro feed recommended)
- Have test KML and GeoJSON polygon files ready

---

## 1. GTFS Import Tests

### Test 1.1: Local GTFS Import - Basic Functionality
**Steps:**
1. Click "Import Feed" button
2. Switch to "From File" tab
3. Select a valid GTFS zip file
4. Enter feed name (or leave blank to use filename)
5. Click "Import"
6. Wait for progress bar to complete

**Expected Results:**
- ✅ Progress bar shows import stages (parsing routes, stops, shapes, etc.)
- ✅ Success toast appears: "✓ Imported [name] (X routes, Y stops)"
- ✅ Feed appears in Data tab feed list with eye icon and delete button
- ✅ Feed appears in Filters tab dropdown
- ✅ Routes appear in Layers tab (up to 50 shown)
- ✅ Map automatically zooms to show all imported stops
- ✅ Stops and routes render correctly on map

**Console Check:**
- Look for: `[GTFS Import] Fitting map to imported data`

---

### Test 1.2: GTFS Import - No Missing Layers
**Steps:**
1. Import a GTFS feed with shapes
2. Check Layers tab for route list
3. Check map for route shapes

**Expected Results:**
- ✅ All routes from feed appear in route list
- ✅ Route shapes render when feed is visible
- ✅ No console errors about missing layers

---

### Test 1.3: GTFS Import - Zoom Behavior
**Steps:**
1. Start with map zoomed to specific location (e.g., zoom level 10 on New York)
2. Import a GTFS feed
3. Observe map zoom change

**Expected Results:**
- ✅ Map zooms out/in to show all imported stops
- ✅ All stops are visible within map bounds after import

---

## 2. Feed Visibility Tests

### Test 2.1: Hide Feed - Routes and Stops Disappear
**Steps:**
1. Import a GTFS feed (ensure it's visible)
2. Note current map zoom level
3. Click the eye icon button next to the feed in Data tab
4. Observe map and feed list

**Expected Results:**
- ✅ Eye icon changes from open to closed
- ✅ Feed list item shows closed eye icon
- ✅ All routes from this feed disappear from Layers tab
- ✅ All stops from this feed disappear from map
- ✅ Feed appears with "(hidden)" suffix in Filters dropdown
- ✅ Feed text in dropdown is grayed out
- ✅ Map zoom level does NOT change
- ✅ Success toast: "Feed hidden"

**Console Check:**
- Look for: `[Feed Visibility] Toggle called for feed: X`
- Look for: `[Feed Visibility] Hiding feed: X`

---

### Test 2.2: Show Feed - Routes and Stops Reappear
**Steps:**
1. Hide a feed (as in Test 2.1)
2. Note current map zoom level
3. Click the eye icon button again
4. Observe map and feed list

**Expected Results:**
- ✅ Eye icon changes from closed to open
- ✅ Routes from this feed reappear in Layers tab
- ✅ Stops from this feed reappear on map
- ✅ Feed no longer shows "(hidden)" suffix in dropdown
- ✅ Feed text in dropdown returns to normal color
- ✅ Map zoom level does NOT change
- ✅ Success toast: "Feed shown"

**Console Check:**
- Look for: `[Feed Visibility] Toggle called for feed: X`
- Look for: `[Feed Visibility] Showing feed: X`

---

### Test 2.3: Multiple Feed Visibility
**Steps:**
1. Import Feed A and Feed B
2. Hide Feed A
3. Verify only Feed B data is visible
4. Hide Feed B
5. Verify no feed data is visible
6. Show Feed A
7. Verify only Feed A data is visible
8. Show Feed B
9. Verify both feeds are visible

**Expected Results:**
- ✅ Each feed's visibility toggles independently
- ✅ Map shows correct data for visible feeds only
- ✅ Filters reflect only visible feeds
- ✅ No zoom changes during any toggle

---

## 3. Polygon Import Tests

### Test 3.1: KML Import - Named Polygons
**Steps:**
1. Prepare KML file with `<name>` element (e.g., "Downtown District")
2. Click "Add Polygon" button
3. Select KML file
4. Click "Import"

**Expected Results:**
- ✅ Success toast: "✓ Imported 1 polygon(s)"
- ✅ Polygon appears in Data tab list with correct name
- ✅ Polygon renders on map with blue outline
- ✅ Map zooms to fit imported polygon
- ✅ Clicking polygon shows popup with name
- ✅ Polygon appears in Layers tab toggle list with correct name

**Console Check:**
- Look for: `[Polygon Import] Starting import of: [filename]`
- Look for: `[Polygon Import] Converting KML to GeoJSON`
- Look for: `[Polygon Import] Found X polygon(s)`
- Look for: `[Polygon Import] Polygon 0 name: [extracted name]`
- Look for: `[Polygon Import] Fitting map to imported polygons`

---

### Test 3.2: KML Import - Unnamed Polygons
**Steps:**
1. Prepare KML file without `<name>` element
2. Import file named "test-area.kml"

**Expected Results:**
- ✅ Polygon name defaults to "test-area" (filename without extension)
- ✅ Polygon renders and appears in lists with filename-based name

---

### Test 3.3: GeoJSON Import - Named Polygons
**Steps:**
1. Prepare GeoJSON file with `properties.name` set to "Central Park"
2. Import file

**Expected Results:**
- ✅ Success toast appears
- ✅ Polygon name is "Central Park" (from properties.name)
- ✅ Polygon renders on map
- ✅ Map zooms to fit polygon
- ✅ Name appears correctly in Data tab and Layers tab

**Console Check:**
- Look for: `[Polygon Import] Parsing GeoJSON`
- Look for: `[Polygon Import] Polygon 0 name: Central Park`

---

### Test 3.4: GeoJSON Import - Multiple Polygons
**Steps:**
1. Import GeoJSON FeatureCollection with 3 polygons
2. First polygon has `properties.name: "Zone A"`
3. Second polygon has `properties.name: "Zone B"`  
4. Third polygon has no name property

**Expected Results:**
- ✅ Success toast: "✓ Imported 3 polygon(s)"
- ✅ Zone A appears with correct name
- ✅ Zone B appears with correct name
- ✅ Third polygon gets filename + " 3" as name
- ✅ All three render on map
- ✅ Map fits to show all three polygons

---

## 4. Polygon Visibility Tests

### Test 4.1: Hide Polygon (Data Tab)
**Steps:**
1. Import polygon
2. Note current map zoom
3. Click eye icon in Data tab polygon list
4. Observe map

**Expected Results:**
- ✅ Eye icon changes from open to closed
- ✅ Polygon disappears from map
- ✅ Layers tab checkbox unchecks
- ✅ Map zoom does NOT change

**Console Check:**
- Look for: `[Polygon Visibility] Rendering polygon visibility`
- Look for: `[Polygon Visibility] Hiding polygon: [name]`

---

### Test 4.2: Show Polygon (Data Tab)
**Steps:**
1. Hide polygon (as in Test 4.1)
2. Note current map zoom
3. Click eye icon again
4. Observe map

**Expected Results:**
- ✅ Eye icon changes from closed to open
- ✅ Polygon reappears on map
- ✅ Layers tab checkbox re-checks
- ✅ Map zoom does NOT change

**Console Check:**
- Look for: `[Polygon Visibility] Showing polygon: [name]`

---

### Test 4.3: Hide Polygon (Layers Tab)
**Steps:**
1. Import polygon
2. Go to Layers tab
3. Uncheck polygon checkbox
4. Observe map and Data tab

**Expected Results:**
- ✅ Polygon disappears from map
- ✅ Data tab eye icon changes to closed
- ✅ No zoom change

---

### Test 4.4: Show Polygon (Layers Tab)
**Steps:**
1. Hide polygon via Layers tab
2. Check polygon checkbox
3. Observe map and Data tab

**Expected Results:**
- ✅ Polygon reappears on map
- ✅ Data tab eye icon changes to open
- ✅ No zoom change

---

## 5. Agency Filter Tests

### Test 5.1: Single Agency - Filter Visible
**Steps:**
1. Import GTFS feed with only one agency
2. Check Filters tab
3. Locate Agency Filter section

**Expected Results:**
- ✅ Agency Filter section is VISIBLE (not hidden)
- ✅ One agency checkbox appears
- ✅ Agency checkbox is checked by default
- ✅ Agency name displays correctly

---

### Test 5.2: Single Agency - Toggle Off
**Steps:**
1. Import feed with one agency
2. Uncheck the agency checkbox
3. Observe map

**Expected Results:**
- ✅ All routes disappear from map
- ✅ All stops disappear from map
- ✅ Route list in Layers tab becomes empty
- ✅ No zoom change

---

### Test 5.3: Single Agency - Toggle On
**Steps:**
1. Toggle agency off (as in Test 5.2)
2. Check agency checkbox again
3. Observe map

**Expected Results:**
- ✅ Routes reappear on map
- ✅ Stops reappear on map
- ✅ Route list repopulates in Layers tab
- ✅ No zoom change

**Console Check:**
- Look for: `[Agency Filter] Agency toggled: [id] true/false`

---

### Test 5.4: Multiple Agencies
**Steps:**
1. Import feed with 2+ agencies
2. Verify all agencies checked by default
3. Uncheck one agency
4. Observe map

**Expected Results:**
- ✅ Only routes from unchecked agency disappear
- ✅ Only stops from unchecked agency disappear  
- ✅ Other agencies' data remains visible
- ✅ No zoom change

---

### Test 5.5: Hidden Feed Agencies Excluded
**Steps:**
1. Import Feed A (Agency X) and Feed B (Agency Y)
2. Hide Feed A
3. Check Filters tab agency list

**Expected Results:**
- ✅ Agency X does NOT appear in agency filter
- ✅ Only Agency Y appears
- ✅ Agency Y is checked

---

## 6. Integration Tests

### Test 6.1: Feed + Polygon Import Sequence
**Steps:**
1. Import GTFS feed
2. Import polygon
3. Hide feed
4. Hide polygon
5. Show feed
6. Show polygon

**Expected Results:**
- ✅ Each action completes without errors
- ✅ Map shows correct data at each step
- ✅ Zoom only changes during imports (steps 1-2)
- ✅ No zoom change during visibility toggles (steps 3-6)

---

### Test 6.2: Remove All Data
**Steps:**
1. Import feed and polygon
2. Click "Remove All Data" button
3. Confirm dialog

**Expected Results:**
- ✅ All feeds removed from Data tab
- ✅ All polygons removed from Data tab
- ✅ All layers cleared from map
- ✅ Filters reset
- ✅ Agency filter hidden (no agencies)
- ✅ "Remove All Data" button disappears

---

### Test 6.3: Multi-Feed Filter Interaction
**Steps:**
1. Import Feed A and Feed B
2. Select Feed A in feed filter dropdown
3. Observe route list
4. Hide Feed A via eye icon
5. Observe route list

**Expected Results:**
- ✅ Step 3: Only Feed A routes shown
- ✅ Step 5: No routes shown (Feed A is hidden)
- ✅ Feed dropdown still shows Feed A selected with "(hidden)"

---

## 7. Edge Cases

### Test 7.1: Import Empty GTFS
**Steps:**
1. Import GTFS with no routes/stops
2. Observe behavior

**Expected Results:**
- ✅ Import completes without crash
- ✅ Feed appears in list with "0 routes · 0 stops"
- ✅ No map zoom change (no data to fit)

---

### Test 7.2: Import Invalid Polygon
**Steps:**
1. Try importing file with no polygon geometries
2. Observe error handling

**Expected Results:**
- ✅ Error toast: "No polygon geometries found"
- ✅ No partial import
- ✅ Modal closes
- ✅ No map changes

---

### Test 7.3: Rapid Toggle Clicks
**Steps:**
1. Import feed
2. Rapidly click feed eye icon 5 times
3. Wait for completion
4. Observe final state

**Expected Results:**
- ✅ Feed ends in expected state (visible or hidden based on odd/even clicks)
- ✅ No console errors
- ✅ No duplicate layers on map

---

## 8. UI/UX Checks

### Test 8.1: Icon Consistency
**Steps:**
1. Import feed and polygon
2. Check all eye icons

**Expected Results:**
- ✅ Open eye icon is consistent across feed list and polygon list
- ✅ Closed eye icon is consistent
- ✅ Icons are monochrome and professional

---

### Test 8.2: Toast Notifications
**Steps:**
1. Import feed
2. Hide feed
3. Show feed
4. Import polygon
5. Toggle polygon visibility

**Expected Results:**
- ✅ Each action shows appropriate toast
- ✅ No alarming red backgrounds
- ✅ Success toasts use ✓ icon
- ✅ Error toasts use ✗ icon

---

## 9. Performance Checks

### Test 9.1: Large Feed Import
**Steps:**
1. Import large metro GTFS (100k+ stops)
2. Monitor import time
3. Check responsiveness

**Expected Results:**
- ✅ Import completes within reasonable time (<2 minutes)
- ✅ UI remains responsive via Web Worker
- ✅ Map renders without freezing browser

---

### Test 9.2: Multiple Polygons
**Steps:**
1. Import 10 polygons
2. Toggle visibility on all
3. Check performance

**Expected Results:**
- ✅ Toggle actions complete quickly (<500ms)
- ✅ No visible lag in map rendering
- ✅ No console warnings

---

## 10. Cross-Browser Testing

### Test 10.1: Chrome
- [ ] All tests pass

### Test 10.2: Firefox
- [ ] All tests pass

### Test 10.3: Edge
- [ ] All tests pass

### Test 10.4: Safari (if available)
- [ ] All tests pass

---

## Sign-Off

**Tester Name:** _________________
**Date:** _________________
**Version Tested:** v1.0.2
**Environment:** _________________
**Overall Status:** [ ] PASS [ ] FAIL

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**End of QA Test Plan**
