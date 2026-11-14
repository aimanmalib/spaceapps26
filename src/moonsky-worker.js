// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Builds one own-coordinates table off the main thread (a year of hourly rows takes about a second).
import { computeTable } from './moonsky.js';

self.onmessage = ({ data }) => {
  try {
    self.postMessage({ id: data.id, table: computeTable(data.site, data.opts) });
  } catch (err) {
    self.postMessage({ id: data.id, error: String(err) });
  }
};
