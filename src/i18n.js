// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Tiny text lookup: all UI text lives in i18n/<lang>.json, never in code.

export function makeT(dict) {
  return (key) => (Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key);
}

// Fill [data-i18n] text and [data-i18n-attr="attr:key;attr2:key2"] attributes under root.
export function applyText(root, t) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    }
  }
}
