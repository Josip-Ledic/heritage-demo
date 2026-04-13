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
  [1]="a45d6df:feat: initial commit"
  [2]="e5282b6:first"
  [3]="7b0b909:second"
  [4]="f49c679:third"
  [5]="581aae7:fourth"
  [6]="ad734ba:fifth"
  [7]="276e75e:sixth"
  [8]="d78194d:seventh"
  [9]="56f5342:eight"
  [10]="154e484:nineth"
  [11]="98324c9:tenth"
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
for i in {1..11}; do
  COMMIT_INFO="${COMMITS[$i]}"
  COMMIT_HASH="${COMMIT_INFO%%:*}"
  COMMIT_MSG="${COMMIT_INFO#*:}"
  
  echo -e "${BLUE}========================================${NC}"
  echo -e "${GREEN}Building Commit #$i${NC}"
  echo -e "${YELLOW}Hash: ${COMMIT_HASH}${NC}"
  echo -e "${YELLOW}Message: ${COMMIT_MSG}${NC}"
  echo -e "${BLUE}========================================${NC}"
  
  # Checkout the commit
  echo -e "${YELLOW}Checking out commit ${COMMIT_HASH}...${NC}"
  git checkout "$COMMIT_HASH" --quiet
  
  # Install dependencies if needed (only for first build or if package.json changed)
  if [ $i -eq 1 ] || git diff --name-only HEAD~1 HEAD | grep -q "package.json"; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --silent
  fi
  
  # Set the base path for this commit
  export NEXT_PUBLIC_BASE_PATH="${BASE_PATH_PREFIX}/commit-$i"
  
  # Build the project
  echo -e "${YELLOW}Building Next.js project...${NC}"
  npm run build
  
  # Copy output to dist directory
  echo -e "${YELLOW}Copying build output...${NC}"
  mkdir -p "$DIST_DIR/commit-$i"
  cp -r out/* "$DIST_DIR/commit-$i/"
  
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

# Create landing page
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Creating landing page...${NC}"
echo -e "${BLUE}========================================${NC}"

cat > "$DIST_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HERITAGE Motors - Commit Timeline Demo</title>
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
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🏍️ HERITAGE Motors</h1>
      <p class="subtitle">Commit Timeline Demo</p>
    </header>
    
    <div class="intro">
      <p>
        Welcome to the HERITAGE Motors editorial blog demo! This project showcases 
        pixel-perfect text flow around a motorcycle silhouette using the Pretext library.
      </p>
      <p style="margin-top: 1rem;">
        Below you'll find all 11 commits of this project's development. Click on any commit 
        to view that specific version of the site. Each version includes a floating debug 
        panel that lets you navigate between commits.
      </p>
    </div>
    
    <div class="timeline">
      <div class="commit-card">
        <span class="commit-number">Commit #1</span>
        <div class="commit-hash">a45d6df</div>
        <div class="commit-message">"feat: initial commit"</div>
        <a href="./commit-1/" class="commit-link">View Commit #1 →</a>
      </div>
      
      <div class="commit-card">
        <span class="commit-number">Commit #2</span>
        <div class="commit-hash">e5282b6</div>
        <div class="commit-message">"first"</div>
        <a href="./commit-2/" class="commit-link">View Commit #2 →</a>
      </div>
      
      <div class="commit-card">
        <span class="commit-number">Commit #3</span>
        <div class="commit-hash">7b0b909</div>
        <div class="commit-message">"second"</div>
        <a href="./commit-3/" class="commit-link">View Commit #3 →</a>
      </div>
      
      <div class="commit-card">
        <span class="commit-number">Commit #4</span>
        <div class="commit-hash">f49c679</div>
        <div class="commit-message">"third"</div>
        <a href="./commit-4/" class="commit-link">View Commit #4 →</a>
      </div>
      
      <div class="commit-card">
        <span class="commit-number">Commit #5</span>
        <div class="commit-hash">581aae7</div>
        <div class="commit-message">"fourth"</div>
        <a href="./commit-5/" class="commit-link">View Commit #5 →</a>
      </div>
      
      <div class="commit-card">
        <span class="commit-number">Commit #6</span>
        <div class="commit-hash">ad734ba</div>
        <div class="commit-message">"fifth"</div>
        <a href="./commit-6/" class="commit-link">View Commit #6 →</a>
      </div>
      
      <div class="commit-card">
        <span class="commit-number">Commit #7</span>
        <div class="commit-hash">276e75e</div>
        <div class="commit-message">"sixth"</div>
        <a href="./commit-7/" class="commit-link">View Commit #7 →</a>
      </div>
      
      <div class="commit-card">
        <span class="commit-number">Commit #8</span>
        <div class="commit-hash">d78194d</div>
        <div class="commit-message">"seventh"</div>
        <a href="./commit-8/" class="commit-link">View Commit #8 →</a>
      </div>
      
      <div class="commit-card">
        <span class="commit-number">Commit #9</span>
        <div class="commit-hash">56f5342</div>
        <div class="commit-message">"eight"</div>
        <a href="./commit-9/" class="commit-link">View Commit #9 →</a>
      </div>
      
      <div class="commit-card">
        <span class="commit-number">Commit #10</span>
        <div class="commit-hash">154e484</div>
        <div class="commit-message">"nineth"</div>
        <a href="./commit-10/" class="commit-link">View Commit #10 →</a>
      </div>
      
      <div class="commit-card">
        <span class="commit-number">Commit #11</span>
        <div class="commit-hash">98324c9</div>
        <div class="commit-message">"tenth"</div>
        <a href="./commit-11/" class="commit-link">View Commit #11 →</a>
      </div>
    </div>
    
    <footer>
      <p>
        View the source code on 
        <a href="https://github.com/Josip-Ledic/heritage-demo" class="github-link" target="_blank">GitHub</a>
      </p>
      <p style="margin-top: 0.5rem;">
        <strong>HERITAGE Motors</strong> - <em>Crafted with precision. Ridden with passion.</em>
      </p>
    </footer>
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
echo -e "${YELLOW}Total commits built: 11${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "  1. Test locally: ${YELLOW}npx serve dist${NC}"
echo -e "  2. Deploy to GitHub Pages: ${YELLOW}./scripts/deploy-gh-pages.sh${NC}"
echo ""

# Made with Bob
