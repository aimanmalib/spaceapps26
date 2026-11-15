#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Polite, batched JPL Horizons requests for the check at scale (ADR 0108, scripts/validate.py --scale).

One request carries many minutes for one site and body (Horizons TLIST, calendar UT minutes) with the same
observer setup as scripts/fetch_horizons.py. Requests go out one at a time, at most one every
min_interval_seconds, and are retried after network errors or an answer without a table. Every raw answer is
kept in one cache file (config/validation.json scale.cache_file), keyed by its request URL, so a second run with
the same seed sends no request at all.
"""
import datetime as dt
import hashlib
import json
import time
import urllib.error
import urllib.parse
import urllib.request

import fetch_horizons as fh


def tlist_params(eph, point, code, times):
    """Request parameters for the given UT minutes ("YYYY-MM-DD HH:MM"), same observer setup as fetch_horizons.py."""
    params = fh.request_params(dict(eph, step_minutes=1), point, code, ("", ""))
    for key in ("START_TIME", "STOP_TIME", "STEP_SIZE"):
        params.pop(key)
    params.update(TLIST=" ".join(f"'{t}'" for t in times), TLIST_TYPE="'CAL'", TIME_TYPE="'UT'")
    return params


def parse_tlist(result):
    """{"YYYY-MM-DDTHH:MM": (az, el)} from the CSV block of a TLIST answer."""
    if "$$SOE" not in result:
        raise ValueError("Horizons result has no $$SOE block: " + result[:300])
    out = {}
    for line in result.split("$$SOE", 1)[1].split("$$EOE", 1)[0].strip().splitlines():
        cells = [c.strip() for c in line.split(",")]
        when = dt.datetime.strptime(cells[0], "%Y-%b-%d %H:%M:%S.%f")
        out[when.strftime("%Y-%m-%dT%H:%M")] = (float(cells[3]), float(cells[4]))
    return out


class Client:
    """Rate-limited, retrying Horizons client with a file cache; counts the requests it really sent."""

    def __init__(self, eph, scfg, sleep=time.sleep, opener=None, clock=time.monotonic):
        self.eph, self.cfg, self.sleep, self.clock = eph, scfg, sleep, clock
        self.open = opener or (lambda url: urllib.request.urlopen(url, timeout=eph["timeout_seconds"]))
        self.path = fh.ROOT / scfg["cache_file"]
        self.cache = json.loads(self.path.read_text(encoding="utf-8")) if self.path.exists() else {}
        self.sent = 0
        self.used = set()
        self.last = None

    def _get(self, url):
        for attempt in range(1, self.cfg["retries"] + 2):
            if self.last is not None:
                wait = self.cfg["min_interval_seconds"] - (self.clock() - self.last)
                if wait > 0:
                    self.sleep(wait)
            self.last = self.clock()
            self.sent += 1
            try:
                with self.open(url) as resp:
                    result = json.load(resp)["result"]
                parse_tlist(result)
                return result
            except (urllib.error.URLError, TimeoutError, ValueError, KeyError) as err:
                if attempt > self.cfg["retries"]:
                    raise
                print(f"Horizons attempt {attempt} failed ({err}); retrying", flush=True)
                self.sleep(self.cfg["retry_wait_seconds"] * attempt)

    def angles(self, point, code, times):
        """{"YYYY-MM-DDTHH:MM": (az, el)} for one point and body code at the given minutes, in batches."""
        times = sorted(set(times))
        size = self.cfg["batch_max_times"]
        out = {}
        for i in range(0, len(times), size):
            batch = times[i:i + size]
            url = self.eph["api_url"] + "?" + urllib.parse.urlencode(tlist_params(self.eph, point, code, batch))
            key = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
            if key not in self.cache:
                self.cache[key] = {"url": url, "retrieved_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                                   "result": self._get(url)}
                self.save()
            self.used.add(key)
            got = parse_tlist(self.cache[key]["result"])
            missing = [t for t in batch if t.replace(" ", "T") not in got]
            if missing:
                raise ValueError(f"Horizons answer for {point['id']} body {code} lacks {missing[:3]}")
            out.update(got)
        return out

    def save(self):
        """Keep only the answers this run used (once a run is complete), sorted, one line per entry."""
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(dict(sorted(self.cache.items())), indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

    def prune(self):
        self.cache = {k: v for k, v in self.cache.items() if k in self.used}
        self.save()
