import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  splitting: false,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
