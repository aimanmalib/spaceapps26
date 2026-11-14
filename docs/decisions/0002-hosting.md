# 0002 — Hosting the static site

- Status: accepted
- Date: 2026-11-14

## Context

The entry needs a public URL that loads on phones and keeps working during judging. The site is a folder of static files
(ADR 0001). The author already runs a server with a reverse proxy (Traefik) that issues Let's Encrypt certificates with the
HTTP-01 challenge.

## Decision

1. **Address:** `https://spaceapps26.aimanmalib.com/`, a DNS-only A record (no CDN in front), so headers and caching are exactly
   what the server sends.
2. **Server:** one `nginx:1.30.6-alpine` container (`deploy/compose.yaml`) with a read-only root filesystem and no published
   ports, serving `deploy/live/` read-only. Security headers (CSP `'self'` only, no framing, `nosniff`, no referrer) are repeated in
   every block (`deploy/nginx-headers.conf`). HTML and data are `no-cache`; Vite's content-hashed `/assets/` are cached for a year.
3. **Route:** one Traefik file-provider file (`deploy/traefik.yaml`) for one host name, copied only after public DNS answers —
   with HTTP-01, a name that does not resolve can fail certificates for other names in the same router.
4. **Deploy = HEAD:** `deploy/pasang.sh` refuses uncommitted changes, builds, copies `dist/` into `deploy/live/` in place (the bind
   mount follows the folder), writes `version.json` with the commit, recreates the container, and checks the live site
   (DNS, valid certificate, `GET /` 200 with CSP, served commit = HEAD, HTTP → HTTPS redirect) with 9 retries 10 s apart.
   `--semak` runs the check only; `--undur` removes the route and the container.
5. **Host-specific names** (proxy network, proxy container, its config folder, origin IP) live in `deploy/hos.env`, which git
   ignores; `deploy/hos.env.example` lists the variables. A unit test (`tests/test_deploy.py`) keeps them out of tracked files.

## Consequences

- Building into `dist/` (for example by the test gate) does not change the live site; only `deploy/pasang.sh` does.
- Fallback if the address could not be issued a certificate: a second host name under another domain the author controls,
  with its own DNS record; recorded here if used.
