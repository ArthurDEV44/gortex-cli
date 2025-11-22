import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  shims: true,
  // Note: tsup ne compile que les fichiers importés depuis l'entry point.
  // Les fichiers de test ne seront pas inclus car ils ne sont pas importés.
  // L'exclusion est également gérée par .npmignore pour le package npm.
  esbuildOptions: (options) => {
    options.jsx = "transform";
    options.jsxFactory = "React.createElement";
    options.jsxFragment = "React.Fragment";
  },
  outExtension: () => ({
    js: ".js",
  }),
  banner: {
    js: "#!/usr/bin/env node",
  },
});
