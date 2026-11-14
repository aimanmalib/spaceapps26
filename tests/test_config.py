# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Shape checks for config/, i18n/ and data provenance (data/SOURCES.json)."""
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
ITEMS = "abcdefghijkl"


class ConfigShape(unittest.TestCase):
    def test_json_files_parse(self):
        for folder in ("config", "i18n"):
            for path in sorted((ROOT / folder).glob("*.json")):
                with self.subTest(path=path.name):
                    json.loads(path.read_text(encoding="utf-8"))

    def test_features_cover_items_a_to_l(self):
        items = json.loads((ROOT / "config/features.json").read_text(encoding="utf-8"))["items"]
        letters = sorted(k.split("_", 1)[0] for k in items)
        self.assertEqual(letters, list(ITEMS))
        self.assertTrue(all(isinstance(v, bool) for v in items.values()))

    def test_sites_is_a_list(self):
        sites = json.loads((ROOT / "config/sites.json").read_text(encoding="utf-8"))["sites"]
        self.assertIsInstance(sites, list)


class DataProvenance(unittest.TestCase):
    """H2: every file under data/ has an entry in data/SOURCES.json with the required fields."""

    REQUIRED = ("url", "retrieved_at", "license", "script", "generated_by")

    def test_every_data_file_has_a_source(self):
        data = ROOT / "data"
        files = [p for p in data.rglob("*") if p.is_file() and p.name != "SOURCES.json"] if data.is_dir() else []
        if not files:
            self.skipTest("data/ has no files yet")
        sources = json.loads((data / "SOURCES.json").read_text(encoding="utf-8"))
        entries = {e["file"]: e for e in sources["files"]}
        for path in files:
            rel = path.relative_to(data).as_posix()
            with self.subTest(file=rel):
                self.assertIn(rel, entries)
                for field in self.REQUIRED:
                    self.assertTrue(entries[rel].get(field), field)


if __name__ == "__main__":
    unittest.main()
