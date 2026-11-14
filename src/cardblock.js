// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Shared handle for the closed per-card blocks (items h, l): keeps the current scenario, shows/hides the box and
// redraws when the scenario changes or the <details> opens. render() reads block.sc; cancel() drops pending work.
export function cardBlock(box, details, render, cancel = () => {}) {
  const block = {
    sc: null,
    draw(s) {
      block.sc = s;
      box.hidden = false;
      render();
    },
    hide() {
      block.sc = null;
      cancel();
      box.hidden = true;
    },
  };
  details.addEventListener('toggle', render);
  return block;
}
