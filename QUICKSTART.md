# Quick Start Guide

## What You Have

This package contains the **CORE FILES** for Transit Data Explorer v1.0.0 static frontend:

✅ **Complete and ready to use:**
- `package.json` - Dependencies
- `vite.config.js` - Build configuration
- `src/gtfs-worker.js` - GTFS parser (600+ lines)
- `src/data-manager.js` - Data store (330+ lines)
- `src/project-io.js` - Save/load (220+ lines)
- `.github/workflows/deploy.yml` - GitHub Actions
- `.gitignore` - Git ignore rules

📝 **Needs adaptation:**
- `index.html` - Copy from v0.31.0, minor updates needed
- `src/main.js` - Adapt from v0.31.0 app.js (~2-3 hours work)

## Step-by-Step Setup

### 1. Complete the Adaptation (2-3 hours)

Follow `ADAPTATION_GUIDE.md` to convert v0.31.0 app.js to main.js.

**Key changes:**
- Add module imports
- Replace all `fetch(API_BASE_URL/...)` with dataManager calls
- Update GTFS import to use Web Worker
- Update project save/load

### 2. Test Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Test in browser at http://localhost:3000
```

### 3. Import Test Feed

1. Download a small GTFS feed (e.g., https://transitfeeds.com/)
2. Click "Import from File"
3. Select the zip file
4. Wait for parsing (should show progress)
5. Verify routes and stops appear on map

### 4. Deploy to GitHub Pages

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit - v1.0.0"

# Create GitHub repository
# (Do this on github.com first)

# Push
git remote add origin https://github.com/YOUR_USERNAME/transit-data-explorer.git
git push -u origin main

# Enable GitHub Pages
# Go to Settings > Pages > Source: GitHub Actions

# Access at:
# https://YOUR_USERNAME.github.io/transit-data-explorer/
```

### 5. Configure Base Path

**IMPORTANT:** Edit `vite.config.js`:

```javascript
export default defineConfig({
  base: '/transit-data-explorer/',  // Must match your repo name!
  // ...
});
```

## What Works Right Now

The core parsing engine is complete and functional:

```javascript
// This works:
import { importGTFSFromFile } from './project-io.js';
import { dataManager } from './data-manager.js';

const data = await importGTFSFromFile(file, 'NYC Subway');
const feedId = dataManager.addFeed('NYC Subway', data);
const routes = dataManager.getRoutes({ feedId });
// routes is an array of route objects
```

## What Needs Work

The UI layer needs to be connected:

- Import button click handlers
- Filter change handlers
- Map rendering
- Project save/load UI
- Progress display

All of this exists in v0.31.0 app.js - just needs API calls replaced.

## Testing Checklist

- [ ] `npm install` works
- [ ] `npm run dev` starts server
- [ ] Page loads without errors
- [ ] Import GTFS file works
- [ ] Progress bar shows during import
- [ ] Routes appear in list
- [ ] Stops appear on map
- [ ] Filters work
- [ ] Save project works
- [ ] Load project works
- [ ] `npm run build` succeeds
- [ ] Deploy to GitHub Pages works

## Common Issues

### "Cannot find module"
- Check all imports use `.js` extension
- Check file paths are relative (`./` or `../`)

### "Worker failed to load"
- Check vite.config.js has `worker: { format: 'es' }`
- Check Web Worker file is in src/ directory

### "CORS error" on URL import
- Expected behavior for many GTFS URLs
- User should download file and use file import instead

### GitHub Pages 404
- Check `base` in vite.config.js matches repo name
- Check GitHub Pages is enabled with "GitHub Actions" source
- Check Actions tab shows successful deployment

## Next Steps After Setup

1. Test with small GTFS feed (100-500 routes)
2. Test with large metro feed (NYC MTA, London TfL)
3. Test project save/load cycle
4. Test on mobile devices
5. Add any custom features you need

## File Size Reference

```
Core logic (NEW CODE):
- gtfs-worker.js: ~600 lines
- data-manager.js: ~330 lines
- project-io.js: ~220 lines
Total: ~1,150 lines

UI integration (TO ADAPT):
- main.js: ~1,500 lines (from app.js)
- index.html: ~1,500 lines (minor updates)

Grand total: ~4,150 lines
```

## Get Help

If you get stuck:

1. Check `ADAPTATION_GUIDE.md` for detailed conversion examples
2. Check `README.md` for API reference
3. Check browser console for error messages
4. Check GitHub Actions logs if deployment fails

## Architecture Overview

```
┌─────────────┐
│ User Action │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   main.js (UI)  │  ← Needs adaptation
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│  data-manager.js │  ✅ Complete
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ gtfs-worker.js  │  ✅ Complete
└─────────────────┘
```

## Success Metrics

You'll know it's working when:

✅ Large feed imports in <60 seconds
✅ UI never freezes during import
✅ Filter changes respond instantly
✅ Project files are <1MB (no GTFS data)
✅ Map interactions are smooth
✅ GitHub Pages deployment works

---

**Time estimate:** 2-3 hours to complete adaptation + 1-2 hours testing
**Difficulty:** Medium (mostly systematic find-and-replace)
**Reward:** 100% static app, no backend needed! 🎉
