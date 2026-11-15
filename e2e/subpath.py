# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Smoke test of the build served under a sub-path, as GitHub Pages serves a project site (P4y).

Usage: python3 e2e/subpath.py [prefix]   (default prefix /spaceapps26/; run `npm run build` first)
Serves dist/ at http://127.0.0.1:<free port><prefix> (nothing above the prefix exists) and runs e2e/smoke.py against it.
"""
import functools
import http.server
import pathlib
import subprocess
import sys
import threading

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


class Prefixed(http.server.SimpleHTTPRequestHandler):
    prefix = "/spaceapps26/"

    def translate_path(self, path):
        if not path.startswith(self.prefix):
            return str(DIST / "__outside_prefix__")  # 404: a root-absolute link would fail here, as on Pages
        return super().translate_path("/" + path[len(self.prefix):])

    def log_message(self, *args):
        pass


def main():
    prefix = sys.argv[1] if len(sys.argv) > 1 else Prefixed.prefix
    if not (DIST / "index.html").is_file():
        sys.exit("dist/ missing: run `npm run build` first")
    Prefixed.prefix = "/" + prefix.strip("/") + "/"
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Prefixed, directory=str(DIST)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{srv.server_address[1]}{Prefixed.prefix}"
    try:
        rc = subprocess.call([sys.executable, str(ROOT / "e2e" / "smoke.py"), url])
    finally:
        srv.shutdown()
    sys.exit(rc)


if __name__ == "__main__":
    main()
