#!/bin/bash

# Quick test script to verify a single commit builds correctly
# Usage: ./scripts/test-build.sh [commit-number]
# Example: ./scripts/test-build.sh 1

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

COMMIT_NUM=${1:-11}  # Default to latest commit

# Commit hashes
declare -A COMMITS=(
  [1]="a45d6df"
  [2]="e5282b6"
  [3]="7b0b909"
  [4]="f49c679"
  [5]="581aae7"
  [6]="ad734ba"
  [7]="276e75e"
  [8]="d78194d"
  [9]="56f5342"
  [10]="154e484"
  [11]="98324c9"
)

COMMIT_HASH="${COMMITS[$COMMIT_NUM]}"

if [ -z "$COMMIT_HASH" ]; then
  echo -e "${RED}Invalid commit number: $COMMIT_NUM${NC}"
  echo -e "${YELLOW}Valid range: 1-11${NC}"
  exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Testing Build for Commit #$COMMIT_NUM${NC}"
echo -e "${YELLOW}Hash: $COMMIT_HASH${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Current branch: $CURRENT_BRANCH${NC}"

# Checkout the commit
echo -e "${YELLOW}Checking out commit...${NC}"
git checkout "$COMMIT_HASH" --quiet

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --silent

# Set base path
export NEXT_PUBLIC_BASE_PATH="/commit-$COMMIT_NUM"

# Build
echo -e "${YELLOW}Building...${NC}"
npm run build

# Check if build succeeded
if [ -d "out" ]; then
  echo -e "${GREEN}✓ Build successful!${NC}"
  echo -e "${YELLOW}Output directory: out/${NC}"
  echo -e "${YELLOW}Files created: $(find out -type f | wc -l)${NC}"
else
  echo -e "${RED}✗ Build failed - no output directory${NC}"
  git checkout "$CURRENT_BRANCH" --quiet
  exit 1
fi

# Return to original branch
echo -e "${YELLOW}Returning to $CURRENT_BRANCH...${NC}"
git checkout "$CURRENT_BRANCH" --quiet

echo ""
echo -e "${GREEN}Test complete!${NC}"
echo -e "${YELLOW}To test locally: npx serve out${NC}"

# Made with Bob
