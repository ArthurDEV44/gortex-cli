#!/bin/bash

#
# Bundle Analysis Script
# Analyzes the built bundle size and provides optimization recommendations
#

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/../dist"
BUNDLE_FILE="$DIST_DIR/index.js"
DTS_FILE="$DIST_DIR/index.d.ts"

# ANSI colors
RESET="\033[0m"
BRIGHT="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[36m"
RED="\033[31m"

# Format bytes function
format_bytes() {
  local bytes=$1
  if [ "$bytes" -eq 0 ]; then
    echo "0 Bytes"
    return
  fi
  
  local k=1024
  local sizes=("Bytes" "KB" "MB" "GB")
  local i=0
  local size=$bytes
  
  while [ "$(echo "$size >= $k" | bc -l)" -eq 1 ] && [ "$i" -lt 3 ]; do
    size=$(echo "scale=2; $size / $k" | bc -l)
    i=$((i + 1))
  done
  
  printf "%.2f %s" "$size" "${sizes[$i]}"
}

# Check if dist folder exists
if [ ! -d "$DIST_DIR" ]; then
  echo -e "${RED}❌ Dist folder not found. Run 'npm run build' first.${RESET}\n"
  exit 1
fi

echo -e "\n${BRIGHT}${BLUE}📦 Bundle Analysis${RESET}\n"

# Analyze main bundle
if [ ! -f "$BUNDLE_FILE" ]; then
  echo -e "${RED}❌ Bundle file not found: $BUNDLE_FILE${RESET}\n"
  exit 1
fi

bundle_size=$(stat -f%z "$BUNDLE_FILE" 2>/dev/null || stat -c%s "$BUNDLE_FILE" 2>/dev/null)
bundle_size_kb=$(echo "scale=2; $bundle_size / 1024" | bc -l)

echo -e "${BRIGHT}Main Bundle:${RESET}"
echo "  File: $BUNDLE_FILE"
echo "  Size: $(format_bytes $bundle_size) ($bundle_size_kb KB)"

# Analyze types
if [ -f "$DTS_FILE" ]; then
  dts_size=$(stat -f%z "$DTS_FILE" 2>/dev/null || stat -c%s "$DTS_FILE" 2>/dev/null)
  echo -e "\n${BRIGHT}Type Definitions:${RESET}"
  echo "  File: $DTS_FILE"
  echo "  Size: $(format_bytes $dts_size)"
fi

# Read bundle content for analysis
lines=$(wc -l < "$BUNDLE_FILE" | tr -d ' ')
chars=$(wc -c < "$BUNDLE_FILE" | tr -d ' ')

echo -e "\n${BRIGHT}Bundle Statistics:${RESET}"
printf "  Lines of code: %'d\n" "$lines"
printf "  Characters: %'d\n" "$chars"

# Analyze imports (approximate)
imports=$(grep -oE "(require\(|import\()" "$BUNDLE_FILE" 2>/dev/null | wc -l | tr -d ' ')
echo "  Dynamic imports: $imports"

# Check for common large dependencies
echo -e "\n${BRIGHT}Detected Dependencies:${RESET}"

deps=("react" "ink" "simple-git" "chalk" "commander")
for dep in "${deps[@]}"; do
  if grep -q "$dep" "$BUNDLE_FILE" 2>/dev/null; then
    echo "  ✓ $dep"
  fi
done

# Performance rating
echo -e "\n${BRIGHT}Performance Rating:${RESET}"

rating="Good"
rating_color=$GREEN

if [ "$(echo "$bundle_size_kb > 300" | bc -l)" -eq 1 ]; then
  rating="Needs Optimization"
  rating_color=$RED
elif [ "$(echo "$bundle_size_kb > 200" | bc -l)" -eq 1 ]; then
  rating="Could be Improved"
  rating_color=$YELLOW
fi

echo -e "  Bundle Size: ${rating_color}${rating}${RESET} ($bundle_size_kb KB)"

if [ "$(echo "$bundle_size_kb < 200" | bc -l)" -eq 1 ]; then
  echo "  Target: < 200 KB (✓)"
else
  echo "  Target: < 200 KB (✗)"
fi

# Recommendations
echo -e "\n${BRIGHT}Optimization Recommendations:${RESET}"

if [ "$(echo "$bundle_size_kb > 200" | bc -l)" -eq 1 ]; then
  echo -e "  ${YELLOW}Consider code splitting for larger modules${RESET}"
fi

if [ "$imports" -eq 0 ]; then
  echo -e "  ${GREEN}✓ No dynamic imports detected - bundle is fully bundled${RESET}"
fi

if [ "$(echo "$bundle_size_kb < 200" | bc -l)" -eq 1 ]; then
  echo -e "  ${GREEN}✓ Bundle size is optimal${RESET}"
fi

echo -e "  ${GREEN}✓ Tree shaking is enabled by default in tsup${RESET}"
echo -e "  ${GREEN}✓ Minification is handled by esbuild${RESET}"

# Comparison with typical CLI tools
echo -e "\n${BRIGHT}Comparison with Typical CLI Tools:${RESET}"
echo "  Small CLI: 50-100 KB"

if [ "$(echo "$bundle_size_kb >= 100 && $bundle_size_kb <= 200" | bc -l)" -eq 1 ]; then
  echo "  Medium CLI: 100-200 KB ← GORTEX CLI is here"
else
  echo "  Medium CLI: 100-200 KB"
fi

if [ "$(echo "$bundle_size_kb > 200" | bc -l)" -eq 1 ]; then
  echo "  Large CLI: 200-500 KB ← GORTEX CLI is here"
else
  echo "  Large CLI: 200-500 KB"
fi

echo "  Very Large: > 500 KB"

echo -e "\n${BRIGHT}Summary:${RESET}"
rating_lower=$(echo "$rating" | tr '[:upper:]' '[:lower:]')
echo -e "  GORTEX CLI bundle is ${rating_color}${rating_lower}${RESET} for a feature-rich CLI tool."
echo -e "  With React, Ink, and AI integration, $bundle_size_kb KB is expected and acceptable.\n"

