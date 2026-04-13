# Deployment Guide: Multi-Commit Demo on GitHub Pages

This guide explains how to deploy all 11 commits of the HERITAGE Motors blog as separate static builds on GitHub Pages, with a debug navigation panel for switching between versions.

## 🏗️ Architecture Overview

The deployment creates the following structure on GitHub Pages:

```
https://josip-ledic.github.io/heritage-demo/
├── index.html                    # Landing page with commit timeline
├── commit-1/                     # Build of commit a45d6df
├── commit-2/                     # Build of commit e5282b6
├── commit-3/                     # Build of commit 7b0b909
├── ...
└── commit-11/                    # Build of commit 98324c9
```

Each commit version includes a floating debug panel that allows navigation between all commits.

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)

The easiest way is to push to the `main` branch, which triggers GitHub Actions:

```bash
# Commit your changes
git add .
git commit -m "Setup multi-commit deployment"
git push origin main
```

GitHub Actions will automatically:
1. Build all 11 commits
2. Create the landing page
3. Deploy to GitHub Pages

### Option 2: Manual Deployment

If you prefer manual control:

```bash
# 1. Build all commits (takes ~10-15 minutes)
npm run build:all

# 2. Test locally
npm run serve:dist
# Visit http://localhost:3000

# 3. Deploy to GitHub Pages
npm run deploy
```

## 📋 Prerequisites

- Node.js 18+ installed
- Git repository with all 11 commits
- GitHub repository with Pages enabled
- Write access to the repository

## 🔧 Configuration

### GitHub Pages Setup

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Select branch: **gh-pages**
5. Select folder: **/ (root)**
6. Click **Save**

### Repository Secrets (for GitHub Actions)

No additional secrets needed! The workflow uses the built-in `GITHUB_TOKEN`.

## 📝 Build Scripts

### `scripts/build-all-commits.sh`

This script:
- Iterates through all 11 commits
- Checks out each commit
- Builds it with the appropriate `basePath` (e.g., `/commit-1`)
- Copies the output to `dist/commit-N/`
- Creates a landing page at `dist/index.html`
- Returns to the original branch

**Usage:**
```bash
./scripts/build-all-commits.sh
# or
npm run build:all
```

**Output:**
```
dist/
├── index.html
├── commit-1/
│   ├── index.html
│   ├── _next/
│   └── ...
├── commit-2/
└── ...
```

### `scripts/deploy-gh-pages.sh`

This script:
- Checks for uncommitted changes
- Switches to `gh-pages` branch (creates if needed)
- Copies `dist/` contents to root
- Commits and pushes to GitHub

**Usage:**
```bash
./scripts/deploy-gh-pages.sh
# or
npm run deploy
```

## 🎨 Debug Panel Features

The floating debug panel appears on all commit versions and includes:

- **Current Commit Info**: Shows commit number, hash, and message
- **Navigation Buttons**: Previous/Next commit navigation
- **Commit Selector**: Dropdown to jump to any commit
- **Home Link**: Return to landing page
- **Collapsible**: Minimize to save screen space

### Styling

The panel matches the HERITAGE Motors theme:
- Background: Navy Blue (#1e3a5f)
- Border/Accents: Tan Leather (#c19a6b)
- Text: Off-White (#faf9f6)

## 🔍 Testing Locally

Before deploying, test the build locally:

```bash
# Build all commits
npm run build:all

# Serve the dist directory
npm run serve:dist

# Visit in browser
open http://localhost:3000
```

Test checklist:
- [ ] Landing page loads correctly
- [ ] All commit links work
- [ ] Debug panel appears on each commit
- [ ] Navigation between commits works
- [ ] Previous/Next buttons function correctly
- [ ] Dropdown selector works
- [ ] Home link returns to landing page

## 🐛 Troubleshooting

### Build fails on a specific commit

**Problem:** One commit might have breaking changes or missing dependencies.

**Solution:**
1. Check out that commit manually: `git checkout <hash>`
2. Try building: `npm install && npm run build`
3. Fix any issues
4. Commit the fix to main branch
5. Re-run the build script

### GitHub Pages shows 404

**Problem:** GitHub Pages not configured correctly.

**Solution:**
1. Ensure `gh-pages` branch exists
2. Check GitHub Pages settings (Settings → Pages)
3. Verify source is set to `gh-pages` branch
4. Wait 2-3 minutes for deployment to complete

### Debug panel not appearing

**Problem:** Component not included in older commits.

**Solution:** The debug panel is only added to the current codebase. Older commits won't have it unless you:
1. Cherry-pick the component to each commit, or
2. Accept that only recent commits have the panel

### Assets not loading (404 errors)

**Problem:** Base path not configured correctly.

**Solution:**
1. Check `next.config.mjs` has `basePath` set
2. Verify `NEXT_PUBLIC_BASE_PATH` environment variable
3. Ensure `.nojekyll` file exists in each commit directory

### Build takes too long

**Problem:** Building 11 commits sequentially is time-consuming.

**Solution:**
- Use GitHub Actions (runs in parallel on GitHub's servers)
- Or, build only changed commits manually
- Consider caching `node_modules` between builds

## 📊 Performance Considerations

### Build Time
- **Local**: ~10-15 minutes (sequential builds)
- **GitHub Actions**: ~8-12 minutes (optimized)

### Storage
- Each build: ~10-50 MB
- Total: ~100-500 MB
- GitHub Pages limit: 1 GB ✅

### Bandwidth
- Landing page: ~50 KB
- Each commit: ~10-50 MB initial load
- Subsequent navigation: Minimal (full page reload)

## 🔄 Updating the Demo

### Adding a new commit

1. Make your changes and commit:
   ```bash
   git add .
   git commit -m "eleventh commit"
   ```

2. Update `scripts/build-all-commits.sh`:
   ```bash
   # Add to COMMITS array
   [12]="<new-hash>:eleventh commit"
   
   # Update loop
   for i in {1..12}; do
   ```

3. Update `components/commit-debug-panel.tsx`:
   ```typescript
   const COMMITS: CommitInfo[] = [
     // ... existing commits
     { number: 12, hash: '<new-hash>', message: 'eleventh commit' },
   ]
   ```

4. Rebuild and deploy:
   ```bash
   npm run build:all
   npm run deploy
   ```

### Modifying the landing page

Edit the HTML in `scripts/build-all-commits.sh` (search for `cat > "$DIST_DIR/index.html"`).

## 🎯 Best Practices

1. **Test locally first**: Always run `npm run build:all && npm run serve:dist` before deploying
2. **Commit changes**: Ensure all changes are committed before running deploy script
3. **Use GitHub Actions**: Let automation handle deployment for consistency
4. **Monitor builds**: Check GitHub Actions logs for any errors
5. **Version control**: Keep deployment scripts in version control

## 📚 Additional Resources

- [Next.js Static Export Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🆘 Support

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review GitHub Actions logs
3. Verify all prerequisites are met
4. Check that all scripts are executable (`chmod +x scripts/*.sh`)

---

**HERITAGE Motors** - *Crafted with precision. Ridden with passion.*
