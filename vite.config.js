// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import { defineConfig } from 'vite';
import { cpSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { staticMeta } from './src/static-meta.js';

const root = fileURLToPath(new URL('.', import.meta.url));

// Frozen data (data/) is served as static files next to the page: the dev server serves it from the project root,
// the build copies it into dist/data/ unchanged (SOURCES.json included).
const copyData = {
  name: 'copy-frozen-data',
  apply: 'build',
  closeBundle() {
    cpSync(`${root}data`, `${root}dist/data`, { recursive: true });
    // The deck travels with the site so a copy hosted elsewhere (GitHub Pages, P4y) can link its own demo/demo.pdf.
    if (existsSync(`${root}demo/demo.pdf`)) cpSync(`${root}demo/demo.pdf`, `${root}dist/demo/demo.pdf`);
  },
};

// Title, description, og: tags and the favicon link written into every page from i18n/en.json (src/static-meta.js).
const en = JSON.parse(readFileSync(`${root}i18n/en.json`, 'utf8'));
const appConfig = JSON.parse(readFileSync(`${root}config/app.json`, 'utf8'));
const pageMeta = {
  name: 'static-page-meta',
  transformIndexHtml: { order: 'post', handler: (html) => staticMeta(html, en, appConfig.share_image) },
};

// Pages with their source under src/ (repo file scope): the game (P4j), the page for teachers (P4o) and the overview (P4s). Each is served
// and built as /<name>.html. Their plain links (nav) are already written for the site root; only the bundled asset paths
// need one level less.
const SRC_PAGES = ['play', 'teach', 'overview'];
const srcPagesAtRoot = {
  name: 'src-pages-at-root',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      for (const p of SRC_PAGES) {
        if (req.url === `/${p}.html` || req.url.startsWith(`/${p}.html?`)) req.url = req.url.replace(`/${p}.html`, `/src/${p}.html`);
      }
      next();
    });
  },
  closeBundle() {
    for (const p of SRC_PAGES) {
      const from = `${root}dist/src/${p}.html`;
      if (existsSync(from)) writeFileSync(`${root}dist/${p}.html`, readFileSync(from, 'utf8').replaceAll('"../assets/', '"./assets/'));
    }
    rmSync(`${root}dist/src`, { recursive: true, force: true });
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
        ...Object.fromEntries(SRC_PAGES.map((p) => [p, `${root}src/${p}.html`])),
      },
    },
  },
  plugins: [copyData, pageMeta, srcPagesAtRoot],
});
