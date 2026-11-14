# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Shape checks for deploy/: one host name, prefixed container names, no host-specific names in tracked files."""
import pathlib
import re
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEPLOY = ROOT / "deploy"
TRACKED = ("compose.yaml", "nginx.conf", "nginx-headers.conf", "traefik.yaml", "pasang.sh", "hos.env.example")


class DeployShape(unittest.TestCase):
    def read(self, name):
        return (DEPLOY / name).read_text(encoding="utf-8")

    def test_route_has_exactly_one_host(self):
        hosts = set(re.findall(r"Host\(`([^`]+)`\)", self.read("traefik.yaml")))
        self.assertEqual(len(hosts), 1, hosts)
        self.assertIn(f"HOST={hosts.pop()}\n", self.read("pasang.sh"))

    def test_service_and_container_names_are_prefixed(self):
        compose = self.read("compose.yaml")
        services = re.findall(r"^  ([\w-]+):\s*$", compose.split("networks:\n  proxy:")[0], re.M)
        names = re.findall(r"container_name:\s*(\S+)", compose)
        self.assertTrue(services and names)
        for n in services + names:
            self.assertTrue(n.startswith("spaceapps26-"), n)
        self.assertIn("url: http://spaceapps26-web:80", self.read("traefik.yaml"))

    def test_no_host_specific_names(self):
        # Any IPv4 except the public resolver 1.1.1.1 used to check DNS, and no home-folder paths.
        banned = re.compile(r"/home/|\b(?!1\.1\.1\.1\b)\d{1,3}(?:\.\d{1,3}){3}\b")
        # Where deploy/hos.env exists (the deploying host), none of its values may appear in tracked files.
        env = DEPLOY / "hos.env"
        values = []
        if env.exists():
            for line in env.read_text(encoding="utf-8").splitlines():
                key, _, value = line.partition("=")
                if key.strip() and not key.startswith("#") and len(value.strip()) >= 4:
                    values.append(value.strip())
        for name in TRACKED:
            text = self.read(name)
            with self.subTest(name=name):
                self.assertIsNone(banned.search(text))
                for value in values:
                    self.assertNotIn(value, text)

    def test_example_lists_every_variable_the_script_needs(self):
        needed = re.search(r"for v in ([A-Z_ ]+); do", self.read("pasang.sh")).group(1).split()
        example = self.read("hos.env.example")
        for v in needed:
            self.assertRegex(example, rf"(?m)^{v}=$")
        self.assertIn("${PROXY_NET:?", self.read("compose.yaml"))

    def test_script_parses(self):
        subprocess.run(["bash", "-n", str(DEPLOY / "pasang.sh")], check=True)


if __name__ == "__main__":
    unittest.main()
