import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Relative base so the static build works from any path (GitHub Pages, artifact hosts, file servers).
export default defineConfig({
  plugins: [react()],
  base: './',
  test: { environment: 'node', globals: true },
});
