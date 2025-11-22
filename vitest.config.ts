import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Enable global test APIs (describe, it, expect, etc.)
    globals: true,

    // Test environment
    environment: "node",

    // Include test files
    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    // Exclude patterns
    exclude: [
      "node_modules",
      "dist",
      ".git",
      ".cache",
      "**/node_modules/**",
      "**/dist/**",
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      enabled: true,
      reporter: ["text", "json", "html", "lcov"],

      // Coverage thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70, // Adjusted to current level, aim to increase over time
        statements: 80,
      },

      // Files to include in coverage
      include: ["src/**/*.{ts,tsx}"],

      // Files to exclude from coverage
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/__mocks__/**",
        "src/index.ts", // Entry point, mostly imports
        "src/types.ts", // Type definitions only
        "src/**/index.ts", // Re-export files
        "src/ai/prompts/**", // AI prompts (mostly string templates)
        "**/node_modules/**",
        "**/dist/**",
      ],
    },

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // Timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,

    // Parallel execution
    isolate: true,
    pool: "threads",

    // Reporter configuration
    reporters: ["verbose"],

    // Watch mode configuration
    watch: false,
  },

  // Resolve configuration for ESM
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
