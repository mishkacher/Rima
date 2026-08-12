#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "assets" / "official"
OUT.mkdir(parents=True, exist_ok=True)
UA = "Mozilla/5.0 (RIMA preview asset importer)"

ASSETS = {
    "hero.png": (
        "https://static.tildacdn.com/tild6264-3363-4164-b935-313764346135/hero.png",
        "c039e0c947a575c1d2cb3eb891b48176a571b12a070653bbb2d54eeadb92fd75",
    ),
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
    "plan-start.png": (
        "https://static.tildacdn.com/tild3536-3938-4837-b262-623336633565/2_2.png",
        "5c4726e397d8d1449d0d6731bd7b53ce5566eff38a3f218966db3a71341f018a",
    ),
    "plan-orbit.png": (
        "https://static.tildacdn.com/tild3438-3662-4065-b235-343838663539/2_3.png",
        "46fa618add85b23de007d21ad1d3f9a877f07afafe5a6520e70e44120173f08f",
    ),
    "plan-galaxy.png": (
        "https://static.tildacdn.com/tild3165-6538-4138-b938-656137626534/2_4.png",
        "17f8e7881faad6686445f9524d6a69968df81090b9202f11b519b2b9d2688e29",
    ),
    "agency-mark.png": (
        "https://static.tildacdn.com/tild3131-6366-4862-b634-656661643162/Frame_403.png",
        "48db13d85a6c88c0357ac21d61fcf3323499b2677cdf1ec6722539ce60c2a0c1",
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

(OUT / "manifest.json").write_text(
    json.dumps({"source_site": "https://xn--h1aehhjhg.agency/", "assets": manifest}, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
print(f"Imported {len(manifest)} pinned official assets into {OUT}")
