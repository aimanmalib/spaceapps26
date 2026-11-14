// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { defineConfig } from 'vite';
import { cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// Frozen data (data/) is served as static files next to the page: the dev server serves it from the project root,
// the build copies it into dist/data/ unchanged (SOURCES.json included).
const copyData = {
  name: 'copy-frozen-data',
  apply: 'build',
  closeBundle() {
    cpSync(`${root}data`, `${root}dist/data`, { recursive: true });
  },
};

export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  plugins: [copyData],
});
