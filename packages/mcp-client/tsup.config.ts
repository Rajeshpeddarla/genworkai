import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  minify: true,
  dts: false,
  outExtension() {
    return {
      js: '.js',
    }
  },
  banner: {
    js: '#!/usr/bin/env node',
  },
});
