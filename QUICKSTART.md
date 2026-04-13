# Quick Start Guide: Multi-Commit Demo Deployment

This guide will get your multi-commit demo deployed to GitHub Pages in minutes.

## ⚡ Fast Track (5 minutes)

### Step 1: Commit Your Changes

```bash
git add .
git commit -m "Add multi-commit deployment system"
git push origin main
```

That's it! GitHub Actions will automatically:
- Build all 11 commits
- Create the landing page
- Deploy to GitHub Pages

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/Josip-Ledic/heritage-demo`
2. Click **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Select branch: **gh-pages**, folder: **/ (root)**
5. Click **Save**

### Step 3: Wait & Visit

- Wait 2-3 minutes for the first deployment
- Visit: `https://josip-ledic.github.io/heritage-demo/`

## 🧪 Test Locally First (Optional)

If you want to test before deploying:

```bash
# Build all commits (takes ~10-15 minutes)
npm run build:all

# Serve locally
npm run serve:dist

# Visit http://localhost:3000
```

## 📋 What Was Created

### New Files

1. **`components/commit-debug-panel.tsx`**
   - Floating debug panel component
   - Shows current commit info
   - Navigation controls (prev/next/dropdown)

2. **`scripts/build-all-commits.sh`**
   - Builds all 11 commits sequentially
   - Creates landing page
   - Outputs to `dist/` directory

3. **`scripts/deploy-gh-pages.sh`**
   - Deploys `dist/` to `gh-pages` branch
   - Manual deployment option

4. **`.github/workflows/deploy.yml`**
   - GitHub Actions workflow
   - Automatic deployment on push to main

5. **`DEPLOYMENT.md`**
   - Comprehensive deployment documentation
   - Troubleshooting guide

### Modified Files

1. **`next.config.mjs`**
   - Added `output: 'export'` for static export
   - Added `basePath` configuration
   - Added `images.unoptimized: true`

2. **`app/layout.tsx`**
   - Added `<CommitDebugPanel />` component

3. **`package.json`**
   - Added deployment scripts
   - Added `lucide-react` dependency

4. **`.gitignore`**
   - Added `/dist` to ignore build output

5. **`README.md`**
   - Added live demo link
   - Added deployment section

## 🎯 What You Get

### Landing Page
- Beautiful timeline of all 11 commits
- Styled in HERITAGE Motors theme
- Links to each commit version

### Each Commit Version
- Full static build of that commit
- Floating debug panel in bottom-right
- Navigation to any other commit
- Link back to landing page

### Debug Panel Features
- Current commit number and hash
- Commit message display
- Previous/Next buttons
- Dropdown selector for all commits
- Collapsible to minimize

## 🔧 Customization

### Change Debug Panel Position

Edit `components/commit-debug-panel.tsx`:

```tsx
// Change from bottom-right to bottom-left
className="fixed bottom-4 left-4 z-50 ..."
```

### Modify Landing Page

Edit the HTML in `scripts/build-all-commits.sh` (search for `cat > "$DIST_DIR/index.html"`).

### Add More Commits

1. Make your changes and commit
2. Update `scripts/build-all-commits.sh`:
   - Add to `COMMITS` array
   - Update loop range
3. Update `components/commit-debug-panel.tsx`:
   - Add to `COMMITS` array
4. Rebuild and deploy

## 🐛 Common Issues

### "Permission denied" when running scripts

```bash
chmod +x scripts/*.sh
```

### Build fails on a commit

Check out that commit and fix the issue:
```bash
git checkout <commit-hash>
npm install
npm run build
# Fix any errors
git checkout main
```

### GitHub Pages shows 404

- Wait 2-3 minutes after first deployment
- Check Settings → Pages is configured correctly
- Verify `gh-pages` branch exists

### Debug panel not showing

The panel is only in the current codebase. Older commits won't have it unless you cherry-pick the component.

## 📊 Build Times

- **Local build**: ~10-15 minutes (sequential)
- **GitHub Actions**: ~8-12 minutes (optimized)
- **First deployment**: Add 2-3 minutes for GitHub Pages

## 🎨 Demo Structure

```
https://josip-ledic.github.io/heritage-demo/
│
├── /                    → Landing page
├── /commit-1/          → Initial commit
├── /commit-2/          → First commit
├── /commit-3/          → Second commit
├── ...
└── /commit-11/         → Tenth commit
```

## 📚 Next Steps

1. **Test locally**: `npm run build:all && npm run serve:dist`
2. **Commit changes**: `git add . && git commit -m "Add deployment"`
3. **Push to GitHub**: `git push origin main`
4. **Enable Pages**: Settings → Pages → gh-pages branch
5. **Visit your demo**: Wait 2-3 minutes, then visit the URL

## 🆘 Need Help?

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed docs
- Review GitHub Actions logs for build errors
- Ensure all scripts are executable
- Verify all prerequisites are met

---

**Ready to deploy?** Just commit and push! 🚀

**HERITAGE Motors** - *Crafted with precision. Ridden with passion.*
