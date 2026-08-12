#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import html
import json
import mimetypes
import re
import urllib.parse
import urllib.request
from pathlib import Path

SOURCE = "https://xn--h1aehhjhg.agency/"
OUT = Path("artifacts/official-assets")
OUT.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/151 Safari/537.36"


def fetch(url: str) -> tuple[bytes, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read(), r.headers.get_content_type()


def normalize_url(raw: str) -> str | None:
    raw = html.unescape(raw).replace("\\/", "/").strip("'\" ")
    if raw.startswith("//"):
        raw = "https:" + raw
    if not raw.startswith("http"):
        return None
    parts = urllib.parse.urlsplit(raw)
    host = parts.netloc.lower()
    if host not in {"static.tildacdn.com", "thb.tildacdn.com", "optim.tildacdn.com"}:
        return None
    path = parts.path
    # Tilda thumbnails expose the canonical filename after /-/resize/<size>/.
    path = re.sub(r"/-/resize/[^/]+/", "/", path)
    path = re.sub(r"/-/format/webp/", "/", path)
    return urllib.parse.urlunsplit(("https", "static.tildacdn.com", path, "", ""))


def ext_for(url: str, content_type: str) -> str:
    suffix = Path(urllib.parse.urlsplit(url).path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}:
        return suffix
    return mimetypes.guess_extension(content_type) or ".bin"


page, page_type = fetch(SOURCE)
text = page.decode("utf-8", errors="replace")
(OUT / "source.html").write_text(text, encoding="utf-8")

# Capture absolute/protocol-relative Tilda CDN references from HTML, JS data attrs and inline CSS.
raw_urls = re.findall(r"(?:https?:)?//(?:static|thb|optim)\.tildacdn\.com/[^\"'<>\s)]+", text)
# Some Tilda blocks JSON-escape URLs.
raw_urls += re.findall(r"https?:\\/\\/(?:static|thb|optim)\.tildacdn\.com/[^\"'<>\s)]+", text)

urls: list[str] = []
seen: set[str] = set()
for raw in raw_urls:
    url = normalize_url(raw)
    if url and url not in seen:
        seen.add(url)
        urls.append(url)

manifest: list[dict] = []
for idx, url in enumerate(urls, 1):
    try:
        body, ctype = fetch(url)
    except Exception as exc:
        manifest.append({"url": url, "error": repr(exc)})
        continue
    if len(body) < 1024:
        manifest.append({"url": url, "content_type": ctype, "bytes": len(body), "skipped": "too-small"})
        continue
    ext = ext_for(url, ctype)
    stem = Path(urllib.parse.urlsplit(url).path).stem or f"asset-{idx:03d}"
    safe = re.sub(r"[^a-zA-Z0-9._-]+", "-", stem)[:50]
    digest = hashlib.sha1(url.encode()).hexdigest()[:8]
    name = f"{idx:03d}-{safe}-{digest}{ext}"
    (OUT / name).write_bytes(body)
    manifest.append({"url": url, "file": name, "content_type": ctype, "bytes": len(body)})

(OUT / "manifest.json").write_text(
    json.dumps({"source": SOURCE, "page_content_type": page_type, "assets": manifest}, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
print(f"Found {len(urls)} unique canonical Tilda asset URLs; downloaded {sum('file' in x for x in manifest)} files")
