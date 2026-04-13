#!/bin/bash

# Build script to generate static exports for all commits
# This script checks out each commit, builds it with the appropriate basePath,
# and copies the output to a dist directory

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DIST_DIR="dist"
REPO_NAME="heritage-demo"
BASE_PATH_PREFIX="/${REPO_NAME}"

# Commit information (hash and message)
declare -A COMMITS=(
  [1]="a45d6df:initial"
  [2]="e5282b6:first"
  [3]="7b0b909:second"
  [4]="3a86dd6:fourth"
  [5]="842d34b:fifth"
  [6]="3c3fcea:sixth"
  [7]="0f657a9:seventh"
  [8]="56f5342:eight"
  [9]="154e484:nineth"
  [10]="55a2164:tenth"
  [11]="c0a94ba:eleventh"
  [12]="6dffa9a:twelfth"
  [13]="724ac73:thirteenth"
)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  HERITAGE Motors - Multi-Commit Build${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Current branch: ${CURRENT_BRANCH}${NC}"
echo ""

# Clean and create dist directory
echo -e "${YELLOW}Cleaning dist directory...${NC}"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Build each commit
for i in {1..13}; do
  COMMIT_INFO="${COMMITS[$i]}"
  COMMIT_HASH="${COMMIT_INFO%%:*}"
  COMMIT_MSG="${COMMIT_INFO#*:}"
  
  echo -e "${BLUE}========================================${NC}"
  echo -e "${GREEN}Building Commit #$i${NC}"
  echo -e "${YELLOW}Hash: ${COMMIT_HASH}${NC}"
  echo -e "${YELLOW}Message: ${COMMIT_MSG}${NC}"
  echo -e "${BLUE}========================================${NC}"
  
  # Stash any changes and checkout the commit
  echo -e "${YELLOW}Stashing changes and checking out commit ${COMMIT_HASH}...${NC}"
  git stash --quiet
  git checkout "$COMMIT_HASH" --quiet
  
  # Install dependencies if needed (only for first build or if package.json changed)
  if [ $i -eq 1 ] || git diff --name-only HEAD~1 HEAD | grep -q "package.json"; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --silent
  fi
  
  # Patch next.config.mjs to ensure static export
  echo -e "${YELLOW}Patching next.config.mjs for static export...${NC}"
  cat > next.config.mjs << 'NEXTCONFIG'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "",
}

export default nextConfig
NEXTCONFIG

  # Patch tsconfig.json to exclude demo files
  echo -e "${YELLOW}Patching tsconfig.json to exclude demo files...${NC}"
  if [ -f tsconfig.json ]; then
    # Use jq if available, otherwise use sed
    if command -v jq &> /dev/null; then
      jq '.exclude = ["node_modules", "demo.ts", "demo-layout.ts", "demo.html"]' tsconfig.json > tsconfig.json.tmp && mv tsconfig.json.tmp tsconfig.json
    else
      # Fallback: use sed to replace the exclude line
      sed -i.bak 's/"exclude": \[.*\]/"exclude": ["node_modules", "demo.ts", "demo-layout.ts", "demo.html"]/' tsconfig.json
      rm -f tsconfig.json.bak
    fi
  fi
  
  # Remove demo files if they exist
  echo -e "${YELLOW}Removing demo files if present...${NC}"
  rm -f demo.ts demo-layout.ts demo.html bidi.js
  
  # Set the base path for this commit
  export NEXT_PUBLIC_BASE_PATH="${BASE_PATH_PREFIX}/commit-$i"
  # Set asset path to repo root (where assets are copied)
  export NEXT_PUBLIC_ASSET_PREFIX="${BASE_PATH_PREFIX}"
  
  # Build the project
  echo -e "${YELLOW}Building Next.js project...${NC}"
  if npm run build; then
    # Copy output to dist directory
    echo -e "${YELLOW}Copying build output...${NC}"
    mkdir -p "$DIST_DIR/commit-$i"
    
    # Check if out directory exists and has content
    if [ -d "out" ] && [ "$(ls -A out)" ]; then
      cp -r out/* "$DIST_DIR/commit-$i/"
      
      # Fix asset paths in HTML and JS files - replace /asset with /heritage-demo/asset
      echo -e "${YELLOW}Fixing asset paths in HTML and JS files...${NC}"
      
      # Fix HTML files
      find "$DIST_DIR/commit-$i" -name "*.html" -type f -exec sed -i.bak \
        -e "s|url('/route66\.avif')|url('/heritage-demo/route66.avif')|g" \
        -e "s|url(\&\#x27;/route66\.avif\&\#x27;)|url(\&\#x27;/heritage-demo/route66.avif\&\#x27;)|g" \
        -e 's|src="/bike1\.png"|src="/heritage-demo/bike1.png"|g' \
        -e 's|src="/bike2\.png"|src="/heritage-demo/bike2.png"|g' \
        -e 's|src="/bike3\.png"|src="/heritage-demo/bike3.png"|g' \
        -e 's|src="/bob\.png"|src="/heritage-demo/bob.png"|g' \
        -e 's|src="/image-Photoroom\.png"|src="/heritage-demo/bike1.png"|g' \
        -e 's|"/revvingsound\.mp3"|"/heritage-demo/revvingsound.mp3"|g' \
        {} \;
      
      # Fix JavaScript files
      find "$DIST_DIR/commit-$i" -name "*.js" -type f -exec sed -i.bak \
        -e 's|"/bike1\.png"|"/heritage-demo/bike1.png"|g' \
        -e 's|"/bike2\.png"|"/heritage-demo/bike2.png"|g' \
        -e 's|"/bike3\.png"|"/heritage-demo/bike3.png"|g' \
        -e 's|"/bob\.png"|"/heritage-demo/bob.png"|g' \
        -e 's|"/image-Photoroom\.png"|"/heritage-demo/bike1.png"|g' \
        -e 's|"/route66\.avif"|"/heritage-demo/route66.avif"|g' \
        -e 's|"/revvingsound\.mp3"|"/heritage-demo/revvingsound.mp3"|g' \
        -e "s|'/bike1\.png'|'/heritage-demo/bike1.png'|g" \
        -e "s|'/bike2\.png'|'/heritage-demo/bike2.png'|g" \
        -e "s|'/bike3\.png'|'/heritage-demo/bike3.png'|g" \
        -e "s|'/bob\.png'|'/heritage-demo/bob.png'|g" \
        -e "s|'/image-Photoroom\.png'|'/heritage-demo/bike1.png'|g" \
        -e "s|'/route66\.avif'|'/heritage-demo/route66.avif'|g" \
        -e "s|'/revvingsound\.mp3'|'/heritage-demo/revvingsound.mp3'|g" \
        {} \;
      
      # Remove backup files
      find "$DIST_DIR/commit-$i" -name "*.bak" -type f -delete
      
      # Copy public assets to root of dist directory as workaround for asset path issues
      echo -e "${YELLOW}Copying public assets to root...${NC}"
      if [ -d "public" ]; then
        # Copy image and audio files to root
        cp -f public/*.png "$DIST_DIR/" 2>/dev/null || true
        cp -f public/*.avif "$DIST_DIR/" 2>/dev/null || true
        cp -f public/*.mp3 "$DIST_DIR/" 2>/dev/null || true
        cp -f public/*.jpg "$DIST_DIR/" 2>/dev/null || true
        cp -f public/*.jpeg "$DIST_DIR/" 2>/dev/null || true
      fi
    else
      echo -e "${RED}✗ Error: out directory is empty or doesn't exist${NC}"
      echo -e "${YELLOW}⚠ Skipping commit #$i${NC}"
      continue
    fi
  else
    echo -e "${RED}✗ Build failed for commit #$i${NC}"
    echo -e "${YELLOW}⚠ Skipping commit #$i${NC}"
    continue
  fi
  
  # Create a .nojekyll file to prevent GitHub Pages from ignoring _next directory
  touch "$DIST_DIR/commit-$i/.nojekyll"
  
  echo -e "${GREEN}✓ Commit #$i built successfully${NC}"
  echo ""
done

# Return to original branch
echo -e "${YELLOW}Returning to branch ${CURRENT_BRANCH}...${NC}"
git stash --quiet
git checkout "$CURRENT_BRANCH" --quiet
git stash pop --quiet 2>/dev/null || true

# Create redirect page to latest commit
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Creating redirect to latest commit...${NC}"
echo -e "${BLUE}========================================${NC}"

cat > "$DIST_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0; url=./commit-13/">
  <title>HERITAGE Motors - Redirecting...</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #1e3a5f 0%, #2a4a7f 100%);
      color: #faf9f6;
      min-height: 100vh;
      padding: 2rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem;
      background: rgba(193, 154, 107, 0.1);
      border: 2px solid #c19a6b;
      border-radius: 12px;
    }
    
    h1 {
      font-size: 3rem;
      color: #c19a6b;
      margin-bottom: 0.5rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .subtitle {
      font-size: 1.2rem;
      color: #faf9f6;
      opacity: 0.9;
    }
    
    .intro {
      background: rgba(255,255,255,0.05);
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 3rem;
      line-height: 1.8;
    }
    
    .timeline {
      position: relative;
      padding-left: 2rem;
    }
    
    .timeline::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(to bottom, #c19a6b, rgba(193, 154, 107, 0.3));
    }
    
    .commit-card {
      background: rgba(255,255,255,0.05);
      border: 2px solid #c19a6b;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      margin-left: 2rem;
      position: relative;
      transition: all 0.3s ease;
    }
    
    .commit-card::before {
      content: '';
      position: absolute;
      left: -2.75rem;
      top: 1.5rem;
      width: 1rem;
      height: 1rem;
      background: #c19a6b;
      border-radius: 50%;
      border: 3px solid #1e3a5f;
    }
    
    .commit-card:hover {
      background: rgba(193, 154, 107, 0.1);
      transform: translateX(5px);
      box-shadow: 0 5px 20px rgba(193, 154, 107, 0.3);
    }
    
    .commit-number {
      display: inline-block;
      background: #c19a6b;
      color: #1e3a5f;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-weight: bold;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .commit-hash {
      font-family: 'Courier New', monospace;
      color: #c19a6b;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }
    
    .commit-message {
      font-size: 1.1rem;
      margin-bottom: 1rem;
      font-style: italic;
    }
    
    .commit-link {
      display: inline-block;
      background: #c19a6b;
      color: #1e3a5f;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      transition: all 0.3s ease;
    }
    
    .commit-link:hover {
      background: #faf9f6;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(193, 154, 107, 0.4);
    }
    
    footer {
      text-align: center;
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 2px solid rgba(193, 154, 107, 0.3);
      opacity: 0.7;
    }
    
    .github-link {
      color: #c19a6b;
      text-decoration: none;
      font-weight: bold;
    }
    
    .github-link:hover {
      color: #faf9f6;
    }
  <style>
    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #1e3a5f 0%, #2a4a7f 100%);
      color: #faf9f6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 {
      font-size: 3rem;
      color: #c19a6b;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.2rem;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏍️ HERITAGE Motors</h1>
    <p>Redirecting to latest version...</p>
    <p style="margin-top: 2rem; font-size: 1rem;">
      <a href="./commit-13/" style="color: #c19a6b; text-decoration: none;">Click here if not redirected automatically</a>
    </p>
  </div>
</body>
</html>
EOF

# Create .nojekyll file at root
touch "$DIST_DIR/.nojekyll"

echo -e "${GREEN}✓ Landing page created${NC}"
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Build Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}Output directory: ${DIST_DIR}/${NC}"
echo -e "${YELLOW}Total commits built: 13${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "  1. Test locally: ${YELLOW}npx serve dist${NC}"
echo -e "  2. Deploy to GitHub Pages: ${YELLOW}./scripts/deploy-gh-pages.sh${NC}"
echo ""

# Made with Bob
