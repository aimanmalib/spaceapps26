// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { defineConfig } from 'vite';
import { cpSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
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

// The game page (P4j) has its source at src/play.html; it is served and built as /play.html. Its plain links (nav) are
// already written for the site root; only the bundled asset paths need one level less.
const playAtRoot = {
  name: 'play-page-at-root',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/play.html' || req.url.startsWith('/play.html?')) req.url = req.url.replace('/play.html', '/src/play.html');
      next();
    });
  },
  closeBundle() {
    const from = `${root}dist/src/play.html`;
    if (!existsSync(from)) return;
    writeFileSync(`${root}dist/play.html`, readFileSync(from, 'utf8').replaceAll('"../assets/', '"./assets/'));
    rmSync(`${root}dist/src`, { recursive: true });
  },
};

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: `${root}index.html`,
        validation: `${root}validation.html`,
        sources: `${root}sources.html`,
        about: `${root}about.html`,
        play: `${root}src/play.html`,
      },
    },
  },
  plugins: [copyData, playAtRoot],
});
