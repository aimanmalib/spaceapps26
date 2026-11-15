# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Terrain range (ADR 0041): scripts/band.py helper and the README numbers (no network, no DEM)."""
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import band  # noqa: E402


def load(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


class Band(unittest.TestCase):
    def test_envelope_is_lowest_and_highest_per_azimuth(self):
        lo, hi = band.envelope([[1.0, 5.0, 3.004], [2.0, 4.0, 3.006], [0.5, 4.5, 3.0]], 2)
        self.assertEqual(lo, [0.5, 4.0, 3.0])
        self.assertEqual(hi, [2.0, 5.0, 3.01])

    def test_readme_quotes_the_im2_file(self):
        b = load("data/band/im-2.json")
        cfg = load("config/band.json")
        flat = " ".join((ROOT / "README.md").read_text(encoding="utf-8").split())
        y, ch = b["year"]["centre"], b["year"]["changes"]
        for text in (
            f"the nine points {cfg['offset_m']} m apart around the site, one LOLA pixel, with the observer at "
            f"{min(cfg['observer_heights_m'])} m and at {max(cfg['observer_heights_m'])} m",
            f"above the skyline {y['sun']['site'] * 100:.1f} % of the year's hours at the site and {y['sun']['min'] * 100:.1f} % to "
            f"{y['sun']['max'] * 100:.1f} % across the range; Earth {y['earth']['site'] * 100:.1f} % and "
            f"{y['earth']['min'] * 100:.1f} % to {y['earth']['max'] * 100:.1f} %",
            f"The Sun answer changes inside the range in {ch['sun'] * 100:.1f} % of the hours and the Earth answer in {ch['earth'] * 100:.1f} %",
        ):
            self.assertIn(text, flat)
        self.assertEqual(b["variants"], 9 * len(cfg["observer_heights_m"]))

    def test_every_range_file_is_listed_with_its_script(self):
        files = {e["file"]: e for e in load("data/SOURCES.json")["files"]}
        for p in sorted((ROOT / "data/band").glob("*.json")):
            entry = files[f"band/{p.name}"]
            self.assertEqual(entry["script"], "scripts/band.py")


if __name__ == "__main__":
    unittest.main()
