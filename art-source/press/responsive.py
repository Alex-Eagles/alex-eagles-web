"""
responsive.py - generate the small variants of each press still.

The tiles are drawn at roughly 300-355 CSS px wide, so the committed 800px
master is the RETINA source and nothing smaller existed. A phone at DPR 2 needs
about 610px and a DPR 1 tablet about 355, and both were being handed the 800.

Run from the repo root after dropping a new still into public/press/:

    python art-source/press/responsive.py

It writes <name>-400.webp and <name>-640.webp beside each master, skipping any
that are already current, and never touches the master itself. The widths match
RESPONSIVE_WIDTHS in src/data/mediaCoverage.ts - change them in both places or
the srcset will point at files that do not exist.
"""

import pathlib
from PIL import Image

WIDTHS = (400, 640)
PRESS = pathlib.Path("public/press")
# Matches the quality the masters were encoded at; visually lossless at these
# sizes and still well under half the master's bytes.
QUALITY = 82


def variants(master: pathlib.Path) -> None:
    with Image.open(master) as image:
        for width in WIDTHS:
            if width >= image.width:
                continue
            out = master.with_name(f"{master.stem}-{width}.webp")
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.LANCZOS)
            resized.save(out, "WEBP", quality=QUALITY, method=6)
            print(f"  {out.name:<32} {width}x{height}  {out.stat().st_size // 1024}KB")


def main() -> None:
    masters = sorted(
        path
        for path in PRESS.glob("*.webp")
        # Skip our own output, so a second run does not make -400-400.webp.
        if not any(path.stem.endswith(f"-{w}") for w in WIDTHS)
    )
    for master in masters:
        print(f"{master.name} ({master.stat().st_size // 1024}KB)")
        variants(master)


if __name__ == "__main__":
    main()
