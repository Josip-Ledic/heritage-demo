#!/bin/bash

# Deploy script for GitHub Pages
# This script deploys the dist directory to the gh-pages branch

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DIST_DIR="dist"
GH_PAGES_BRANCH="gh-pages"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deploying to GitHub Pages${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
  echo -e "${RED}Error: dist directory not found!${NC}"
  echo -e "${YELLOW}Please run ./scripts/build-all-commits.sh first${NC}"
  exit 1
fi

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Current branch: ${CURRENT_BRANCH}${NC}"

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo -e "${RED}Error: You have uncommitted changes!${NC}"
  echo -e "${YELLOW}Please commit or stash your changes before deploying${NC}"
  exit 1
fi

# Create or checkout gh-pages branch
echo -e "${YELLOW}Preparing gh-pages branch...${NC}"
if git show-ref --verify --quiet refs/heads/$GH_PAGES_BRANCH; then
  echo -e "${YELLOW}Checking out existing gh-pages branch...${NC}"
  git checkout $GH_PAGES_BRANCH
else
  echo -e "${YELLOW}Creating new gh-pages branch...${NC}"
  git checkout --orphan $GH_PAGES_BRANCH
  git rm -rf .
fi

# Copy dist contents to root
echo -e "${YELLOW}Copying build files...${NC}"
cp -r "$DIST_DIR"/* .

# Add all files
echo -e "${YELLOW}Adding files to git...${NC}"
git add -A

# Commit
echo -e "${YELLOW}Creating commit...${NC}"
COMMIT_MSG="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MSG" || echo -e "${YELLOW}No changes to commit${NC}"

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push origin $GH_PAGES_BRANCH --force

# Return to original branch
echo -e "${YELLOW}Returning to ${CURRENT_BRANCH}...${NC}"
git checkout $CURRENT_BRANCH

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Your site will be available at:${NC}"
echo -e "${YELLOW}https://josip-ledic.github.io/heritage-demo/${NC}"
echo ""
echo -e "${YELLOW}Note: It may take a few minutes for GitHub Pages to update${NC}"
echo ""

# Made with Bob
