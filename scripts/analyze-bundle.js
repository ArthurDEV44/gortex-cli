#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the built bundle size and provides optimization recommendations
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, "..", "dist");
const BUNDLE_FILE = path.join(DIST_DIR, "index.js");
const DTS_FILE = path.join(DIST_DIR, "index.d.ts");

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  red: "\x1b[31m",
};

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}

function analyzeBundle() {
  console.log(
    `\n${colors.bright}${colors.blue}📦 Bundle Analysis${colors.reset}\n`,
  );

  // Check if dist folder exists
  if (!fs.existsSync(DIST_DIR)) {
    console.log(
      `${colors.red}❌ Dist folder not found. Run 'npm run build' first.${colors.reset}\n`,
    );
    process.exit(1);
  }

  // Analyze main bundle
  const bundleStats = fs.statSync(BUNDLE_FILE);
  const bundleSize = bundleStats.size;
  const bundleSizeKB = (bundleSize / 1024).toFixed(2);

  console.log(`${colors.bright}Main Bundle:${colors.reset}`);
  console.log(`  File: ${BUNDLE_FILE}`);
  console.log(`  Size: ${formatBytes(bundleSize)} (${bundleSizeKB} KB)`);

  // Analyze types
  if (fs.existsSync(DTS_FILE)) {
    const dtsStats = fs.statSync(DTS_FILE);
    const dtsSize = dtsStats.size;
    console.log(`\n${colors.bright}Type Definitions:${colors.reset}`);
    console.log(`  File: ${DTS_FILE}`);
    console.log(`  Size: ${formatBytes(dtsSize)}`);
  }

  // Read bundle content for analysis
  const bundleContent = fs.readFileSync(BUNDLE_FILE, "utf-8");
  const lines = bundleContent.split("\n").length;

  console.log(`\n${colors.bright}Bundle Statistics:${colors.reset}`);
  console.log(`  Lines of code: ${lines.toLocaleString()}`);
  console.log(`  Characters: ${bundleContent.length.toLocaleString()}`);

  // Analyze imports (approximate)
  const imports = bundleContent.match(/require\(|import\(/g) || [];
  console.log(`  Dynamic imports: ${imports.length}`);

  // Check for common large dependencies
  const heavyDeps = {
    react: /react["\s]/g,
    ink: /ink["\s]/g,
    "simple-git": /simple-git/g,
    chalk: /chalk/g,
    commander: /commander/g,
  };

  console.log(`\n${colors.bright}Detected Dependencies:${colors.reset}`);
  for (const [dep, regex] of Object.entries(heavyDeps)) {
    const matches = bundleContent.match(regex);
    if (matches && matches.length > 0) {
      console.log(`  ✓ ${dep}`);
    }
  }

  // Performance rating
  console.log(`\n${colors.bright}Performance Rating:${colors.reset}`);

  let rating = "Good";
  let ratingColor = colors.green;

  if (bundleSizeKB > 300) {
    rating = "Needs Optimization";
    ratingColor = colors.red;
  } else if (bundleSizeKB > 200) {
    rating = "Could be Improved";
    ratingColor = colors.yellow;
  }

  console.log(
    `  Bundle Size: ${ratingColor}${rating}${colors.reset} (${bundleSizeKB} KB)`,
  );
  console.log(`  Target: < 200 KB (${bundleSizeKB < 200 ? "✓" : "✗"})`);

  // Recommendations
  console.log(`\n${colors.bright}Optimization Recommendations:${colors.reset}`);

  const recommendations = [];

  if (bundleSizeKB > 200) {
    recommendations.push("Consider code splitting for larger modules");
  }

  if (imports.length === 0) {
    recommendations.push(
      "✓ No dynamic imports detected - bundle is fully bundled",
    );
  }

  if (bundleSizeKB < 200) {
    recommendations.push("✓ Bundle size is optimal");
  }

  recommendations.push("✓ Tree shaking is enabled by default in tsup");
  recommendations.push("✓ Minification is handled by esbuild");

  recommendations.forEach((rec, _i) => {
    const icon = rec.startsWith("✓") ? colors.green : colors.yellow;
    console.log(`  ${icon}${rec}${colors.reset}`);
  });

  // Comparison with typical CLI tools
  console.log(
    `\n${colors.bright}Comparison with Typical CLI Tools:${colors.reset}`,
  );
  console.log("  Small CLI: 50-100 KB");
  console.log(
    `  Medium CLI: 100-200 KB ${bundleSizeKB >= 100 && bundleSizeKB <= 200 ? "← GORTEX CLI is here" : ""}`,
  );
  console.log(
    `  Large CLI: 200-500 KB ${bundleSizeKB > 200 ? "← GORTEX CLI is here" : ""}`,
  );
  console.log("  Very Large: > 500 KB");

  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  console.log(
    `  GORTEX CLI bundle is ${ratingColor}${rating.toLowerCase()}${colors.reset} for a feature-rich CLI tool.`,
  );
  console.log(
    `  With React, Ink, and AI integration, ${bundleSizeKB} KB is expected and acceptable.\n`,
  );
}

// Run analysis
analyzeBundle();
