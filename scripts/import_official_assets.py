#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "assets" / "official"
OUT.mkdir(parents=True, exist_ok=True)
UA = "Mozilla/5.0 (RIMA preview asset importer)"

# Only imagery that is intentionally used as imagery remains imported.
# Hero, TAIGA, tariff cards and the final Sputnik mark are rendered natively
# in each concept instead of reproducing source-site screenshots.
ASSETS = {
    "team-dasha.png": (
        "https://static.tildacdn.com/tild3766-6161-4965-a132-663832376465/noroot.png",
        "b4a84bccddbcafdef64193e4a8e242e1a27a53a631e704c23ff9a98ff9ab5942",
    ),
    "team-vitaliy.png": (
        "https://static.tildacdn.com/tild6138-6431-4466-a461-663663363134/noroot.png",
        "0a9820b9295baccc8383a06a8f51459ee637274bf98637bd57de8335090cd89c",
    ),
    "team-rimma.png": (
        "https://static.tildacdn.com/tild3536-3664-4230-b133-666538323362/noroot.png",
        "409bf8d7206e7d3cb50cc503367571fdc5fe57de6ad3a06033290a6da234f62f",
    ),
    "case-designerskaya.svg": (
        "https://static.tildacdn.com/tild3161-3363-4866-a634-306361363966/photo.svg",
        "42c91f7a3cd2469a2f15f32ba916fb6de970e8e1c7a0d98411ea1950d5f3d6ea",
    ),
    "case-blackwork.svg": (
        "https://static.tildacdn.com/tild3162-6536-4164-a439-616166666161/photo.svg",
        "6492035fdd3360caa3f1b73cf61e760f4526a2e70e4f2c4ed0e44edfa114b9d2",
    ),
    "case-sofia.svg": (
        "https://static.tildacdn.com/tild6133-3730-4866-b833-363833383839/sofia_school.svg",
        "e4660f05f9677f61538d96b25a7a6a1b0dc019ce0b372484f21d1a39c9092a4b",
    ),
    "case-dental.svg": (
        "https://static.tildacdn.com/tild3162-3732-4763-b136-393336646564/photo.svg",
        "f9d8b53a960d046a0157b6ef85a7c0606b5c5967f76bbc42b849ee0adc420191",
    ),
    "case-focus.svg": (
        "https://static.tildacdn.com/tild3034-3436-4238-a232-303231393935/_.svg",
        "d34d793fd4471fde78f4a6f1453980647f87bd823c63f7a4716626a2240f5e8e",
    ),
}


def download(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=45) as response:
        return response.read()


manifest = []
for name, (url, expected) in ASSETS.items():
    target = OUT / name
    body = target.read_bytes() if target.exists() else download(url)
    digest = hashlib.sha256(body).hexdigest()
    if digest != expected:
        raise SystemExit(f"Checksum mismatch for {name}: {digest} != {expected}")
    target.write_bytes(body)
    manifest.append({"file": name, "source": url, "sha256": expected, "bytes": len(body)})

# Remove stale assets from previous preview revisions when running locally.
allowed = set(ASSETS) | {"manifest.json"}
for target in OUT.iterdir():
    if target.is_file() and target.name not in allowed:
        target.unlink()

(OUT / "manifest.json").write_text(
    json.dumps({"source_site": "https://xn--h1aehhjhg.agency/", "assets": manifest}, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
print(f"Imported {len(manifest)} pinned official assets into {OUT}")
