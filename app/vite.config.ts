import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Relative base so the static build works from any path (GitHub Pages, artifact hosts, file servers).
// The artifact build inlines the lazily loaded places data so the output is a single script.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',
  build: mode === 'artifact' ? { rollupOptions: { output: { inlineDynamicImports: true } } } : {},
  test: { environment: 'node', globals: true },
}));
