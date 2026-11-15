# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Coarse LOLA grids for own coordinates (ADR 0106): block mean, projection of the coarse pixel, provenance entries."""
import json
import pathlib
import sys
import unittest

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import horizon as H  # noqa: E402
import terrain_coarse as C  # noqa: E402


class Coarse(unittest.TestCase):
    def test_block_mean_rounds_each_block(self):
        h = np.array([[0, 2, 10, 10], [4, 5, 10, 11], [-4, -4, 7, 7], [-4, -5, 7, 7]], dtype="<i2")
        out = C.block_mean(h.ravel(), 4, 2)
        self.assertEqual(out.tolist(), [[3, 10], [-4, 7]])
        self.assertEqual(out.dtype, np.dtype("<i2"))
        with self.assertRaises(ValueError):
            C.block_mean(h.ravel(), 4, 3)

    def test_coarse_pixel_is_the_block_centre(self):
        # A point maps to the same place on the ground in the source grid and in the coarse grid.
        cfg = json.loads((ROOT / "config/horizon.json").read_text(encoding="utf-8"))
        for src in cfg["dems"]:
            for factor in (4, 5):
                if src["size"] % factor:
                    continue
                spec = C.coarse_spec(src, factor)
                fine = H.Dem(src, cfg["moon_radius_m"], [])
                coarse = H.Dem({**src, **spec}, cfg["moon_radius_m"], [])
                for lat, lon in ((-85.0, 10.0), (-81.3, 250.0), (-89.9, 120.0)):
                    r, c = fine.pixel(*H.unit(lat, lon))
                    rc, cc = coarse.pixel(*H.unit(lat, lon))
                    self.assertAlmostEqual(rc, (r - (factor - 1) / 2) / factor, places=6)
                    self.assertAlmostEqual(cc, (c - (factor - 1) / 2) / factor, places=6)

    def test_every_coarse_file_and_the_gate_have_a_source_entry(self):
        tcfg = json.loads((ROOT / "config/terrain-own.json").read_text(encoding="utf-8"))
        sources = {e["file"]: e for e in json.loads((ROOT / "data/SOURCES.json").read_text(encoding="utf-8"))["files"]}
        for g in tcfg["grids"]:
            self.assertEqual(sources[g["file"]]["script"], "scripts/terrain_coarse.py")
            self.assertIn(g["from"], sources[g["file"]]["url"])
        self.assertEqual(sources[tcfg["gate_file"]]["script"], "scripts/terrain_gate.mjs")


if __name__ == "__main__":
    unittest.main()
