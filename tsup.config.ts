import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  shims: true,
  esbuildOptions: (options) => {
    options.jsx = 'transform';
    options.jsxFactory = 'React.createElement';
    options.jsxFragment = 'React.Fragment';
  },
  outExtension: ({ format }) => ({
    js: '.js',
  }),
  banner: {
    js: '#!/usr/bin/env node',
  },
});
