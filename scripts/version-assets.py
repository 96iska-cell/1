"""Give each deployed asset URL a version derived from its file contents.

This script is safe to run repeatedly. A changed image, stylesheet or script
gets a new URL; unchanged files keep the same URL and can stay cached.
"""

from hashlib import sha256
from pathlib import Path
import re


SITE = Path(__file__).resolve().parent.parent / "site"
IMAGE = re.compile(r"assets/images/[A-Za-z0-9._/-]+\.(?:jpe?g|png|webp|svg|gif)(?:\?v=[A-Za-z0-9._-]+)?")
SCRIPT_AND_STYLE = re.compile(r"assets/(?:products\.js|app\.js|style\.css)(?:\?v=[A-Za-z0-9._-]+)?")


def versioned(match):
    url = match.group(0).split("?", 1)[0]
    path = SITE / url
    if not path.is_file():
        raise FileNotFoundError(f"Missing site asset: {url}")
    digest = sha256(path.read_bytes()).hexdigest()[:12]
    return f"{url}?v={digest}"


def update(path, pattern):
    before = path.read_text(encoding="utf-8")
    after = pattern.sub(versioned, before)
    if after != before:
        path.write_text(after, encoding="utf-8")


# Image URLs inside JavaScript must be final before the script's own hash is
# calculated. HTML is handled last so it points at those final script bytes.
for source in (SITE / "assets/products.js", SITE / "assets/app.js"):
    update(source, IMAGE)

for page in SITE.glob("*.html"):
    update(page, IMAGE)
    update(page, SCRIPT_AND_STYLE)
