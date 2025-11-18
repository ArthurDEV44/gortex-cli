#!/bin/bash

# 🚀 Gortex CLI - Publication Script
# Usage: ./scripts/publish.sh [version]
# Example: ./scripts/publish.sh 2.0.0

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emoji
ROCKET="🚀"
CHECK="✅"
CROSS="❌"
INFO="ℹ️"
WARNING="⚠️"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════╗"
echo "║   Gortex CLI - Publication Script     ║"
echo "╔════════════════════════════════════════╝"
echo -e "${NC}"

# Check if version is provided
VERSION=${1:-$(node -p "require('./package.json').version")}

echo -e "${BLUE}${INFO} Version to publish: ${CYAN}${VERSION}${NC}"
echo ""

# Step 1: Pre-flight checks
echo -e "${BLUE}━━━ Step 1/8: Pre-flight Checks ━━━${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}${CROSS} npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}${CHECK} npm is installed${NC}"

# Check if logged in to npm
if ! npm whoami &> /dev/null; then
    echo -e "${YELLOW}${WARNING} Not logged in to npm${NC}"
    echo -e "${INFO} Please login with: npm login"
    exit 1
fi
NPM_USER=$(npm whoami)
echo -e "${GREEN}${CHECK} Logged in as: ${CYAN}${NPM_USER}${NC}"

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}${WARNING} Git working directory is not clean${NC}"
    git status -s
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}${CHECK} Git working directory is clean${NC}"
fi

echo ""

# Step 2: Type Check
echo -e "${BLUE}━━━ Step 2/8: Type Check ━━━${NC}"
if pnpm typecheck; then
    echo -e "${GREEN}${CHECK} Type check passed${NC}"
else
    echo -e "${RED}${CROSS} Type check failed${NC}"
    exit 1
fi

echo ""

# Step 3: Build
echo -e "${BLUE}━━━ Step 3/8: Build ━━━${NC}"
if pnpm build; then
    echo -e "${GREEN}${CHECK} Build successful${NC}"
else
    echo -e "${RED}${CROSS} Build failed${NC}"
    exit 1
fi

# Check bundle size
BUNDLE_SIZE=$(du -sh dist/index.js | cut -f1)
echo -e "${INFO} Bundle size: ${CYAN}${BUNDLE_SIZE}${NC}"

echo ""

# Step 4: Version Check
echo -e "${BLUE}━━━ Step 4/8: Version Check ━━━${NC}"
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${INFO} Current version: ${CYAN}${CURRENT_VERSION}${NC}"

if [[ "$VERSION" != "$CURRENT_VERSION" ]]; then
    echo -e "${YELLOW}${WARNING} Versions don't match!${NC}"
    read -p "Update package.json to ${VERSION}? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm version $VERSION --no-git-tag-version
        echo -e "${GREEN}${CHECK} Version updated to ${VERSION}${NC}"
    else
        exit 1
    fi
fi

echo ""

# Step 5: Dry Run
echo -e "${BLUE}━━━ Step 5/8: Dry Run ━━━${NC}"
echo -e "${INFO} Running npm publish --dry-run...${NC}"
npm publish --dry-run

read -p "Files look good? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""

# Step 6: Publish to npm
echo -e "${BLUE}━━━ Step 6/8: Publish to npm ━━━${NC}"
echo -e "${YELLOW}${WARNING} This will publish version ${VERSION} to npm${NC}"
read -p "Are you sure? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if npm publish; then
        echo -e "${GREEN}${CHECK} ${ROCKET} Published to npm!${NC}"
        echo -e "${CYAN}https://www.npmjs.com/package/gortex-cli${NC}"
    else
        echo -e "${RED}${CROSS} Publish failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Publish cancelled${NC}"
    exit 0
fi

echo ""

# Step 7: Git Tag
echo -e "${BLUE}━━━ Step 7/8: Git Tag ━━━${NC}"
read -p "Create git tag v${VERSION}? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if git tag -a "v${VERSION}" -m "Release v${VERSION} - Premium UX/UI"; then
        echo -e "${GREEN}${CHECK} Git tag created${NC}"

        read -p "Push tag to remote? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if git push origin "v${VERSION}"; then
                echo -e "${GREEN}${CHECK} Tag pushed to remote${NC}"
            else
                echo -e "${RED}${CROSS} Failed to push tag${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}${WARNING} Tag creation failed (may already exist)${NC}"
    fi
fi

echo ""

# Step 8: Summary
echo -e "${BLUE}━━━ Step 8/8: Summary ━━━${NC}"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ${ROCKET} Publication Successful! ${ROCKET}     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Package:${NC}  gortex-cli"
echo -e "${CYAN}Version:${NC}  ${VERSION}"
echo -e "${CYAN}npm:${NC}      https://www.npmjs.com/package/gortex-cli"
echo -e "${CYAN}GitHub:${NC}   https://github.com/ArthurDEV44/gortex-cli"
echo ""
echo -e "${BLUE}━━━ Next Steps ━━━${NC}"
echo ""
echo -e "1. Create GitHub Release:"
echo -e "   ${CYAN}https://github.com/ArthurDEV44/gortex-cli/releases/new${NC}"
echo ""
echo -e "2. Test installation:"
echo -e "   ${CYAN}npm install -g gortex-cli@latest${NC}"
echo -e "   ${CYAN}gortex --version${NC}"
echo ""
echo -e "3. Promote on social media:"
echo -e "   - Twitter/X"
echo -e "   - Dev.to"
echo -e "   - Reddit r/programming"
echo ""
echo -e "4. Monitor:"
echo -e "   - npm downloads"
echo -e "   - GitHub issues"
echo -e "   - Community feedback"
echo ""
echo -e "${GREEN}${ROCKET} Congratulations! Gortex CLI ${VERSION} is live!${NC}"
echo ""
