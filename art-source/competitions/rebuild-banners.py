"""
Rebuild the Competitions banners — one per competition, per theme.

    cd alex-eagles-web && python art-source/competitions/rebuild-banners.py

Writes six 16:9 WebP banners into public/competitions/. Re-run after replacing
any source in this folder.

WHY THEY ARE REBUILT RATHER THAN USED AS SUPPLIED
The six source assets are wildly inconsistent: 4:3 and 16:9 and 1.2:1 mixed
together, and the logo inside each occupies anything from 35% of the frame
(SAE's dark banner) to 98% of it (the SUAS badge). Dropped into a row of equal
frames they read as a mistake — one competition looking shouted and another
whispered, for no reason a visitor could name.

So every banner is composed here to one canvas and one safe box, and the logo
in each is scaled to fill that box. The result is three frames whose logos carry
the same optical weight.

WHY THE SAFE BOX IS CAPPED ON BOTH AXES
`min(width cap, height cap)` rather than either alone. The SUAS badge is a
circle and the UAVC lockup is nearly 2:1 — matching them on width would make
the circle enormous, matching on height would shrink the lockup to a strip. Each
cap governs the logos it should: height for the squarish marks, width for the
wide ones.

WHERE EACH BACKGROUND COMES FROM
Nothing here invents brand artwork.
  · Light: flat white, as requested.
  · UAVC dark: the source's own navy, and since the target fill is that exact
    navy the logo is pasted WITH its surround — seamless, no keying needed.
  · SAE and SUAS dark: the supplied dark banner, blurred hard enough to erase
    its logo and leave only the background. That keeps the real gradient and its
    variation instead of approximating it with a flat fill.

THE ONE RECOLOUR
SAE's dark banner shows the mark in white and light grey; the clean art supplied
is the same mark in two blues. Rather than upscale the small, soft logo out of
the dark banner (it would need a 1.7x blow-up), the clean art is remapped to
those two greys. The mapping keys on (g-min)/(max-min), which is invariant to
how much white a pixel has been blended with — so antialiased edges resolve to
the same tone as the solid ink they belong to, instead of drifting.
"""

import os

from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "public", "competitions"))

CANVAS = (760, 428)          # 16:9, 2x the 380px the frame is capped at
SAFE_W, SAFE_H = 0.68, 0.66  # fraction of the canvas the logo may occupy
WHITE = (255, 255, 255)


def content_box(im, bg=None, threshold=28):
    """Bounding box of everything that isn't background."""
    rgba = im.convert("RGBA")
    alpha = rgba.getchannel("A")
    if alpha.getextrema()[0] < 250:
        return alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    rgb = rgba.convert("RGB")
    bg = bg or rgb.getpixel((1, 1))
    diff = ImageChops.difference(rgb, Image.new("RGB", rgb.size, bg)).convert("L")
    return diff.point(lambda v: 255 if v > threshold else 0).getbbox()


def fit(logo):
    """Scale a logo to the safe box, preserving aspect."""
    scale = min(
        SAFE_W * CANVAS[0] / logo.width, SAFE_H * CANVAS[1] / logo.height
    )
    return logo.resize(
        (max(1, round(logo.width * scale)), max(1, round(logo.height * scale))),
        Image.LANCZOS,
    )


def compose(logo, background):
    """Centre a logo on a background and save-ready RGB."""
    canvas = background.copy().convert("RGBA")
    logo = fit(logo)
    canvas.alpha_composite(
        logo.convert("RGBA"),
        ((CANVAS[0] - logo.width) // 2, (CANVAS[1] - logo.height) // 2),
    )
    return canvas.convert("RGB")


def blurred_backdrop(path):
    """A supplied banner with its logo blurred away — background only."""
    im = Image.open(os.path.join(HERE, path)).convert("RGB")
    im = im.resize(CANVAS, Image.LANCZOS)
    return im.filter(ImageFilter.GaussianBlur(radius=max(CANVAS) // 12))


def flat(colour):
    return Image.new("RGB", CANVAS, colour)


def crop_content(path, bg=None):
    im = Image.open(os.path.join(HERE, path))
    return im.crop(content_box(im, bg))


def circular(im):
    """Mask a square crop down to its inscribed circle, softened at the rim.

    The SUAS badge is a disc sitting on the dark banner's blue. Pasting its
    square crop onto a different blue would leave a visible corner patch; the
    mask drops everything outside the disc so only the badge lands."""
    im = im.convert("RGBA")
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, im.width - 1, im.height - 1), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1.2))
    im.putalpha(mask)
    return im


def sae_dark_logo():
    """The clean SAE mark, remapped from its two blues to the dark banner's
    white and light grey."""
    im = Image.open(os.path.join(HERE, "sae-light.png")).convert("RGB")
    im = im.crop(content_box(im, WHITE))
    src = im.load()
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    dst = out.load()

    # Measured off the supplied assets: the light art's two inks, and the two
    # greys they appear as on the dark banner.
    T_DARK_INK, T_LIGHT_INK = 0.556, 0.717
    GREY_DARK, GREY_LIGHT = 216, 250

    for y in range(im.height):
        for x in range(im.width):
            r, g, b = src[x, y]
            lo, hi = min(r, g, b), max(r, g, b)
            alpha = 255 - lo          # white background -> fully transparent
            if alpha <= 2 or hi == lo:
                continue
            t = (g - lo) / (hi - lo)  # invariant to white blending; see header
            span = (t - T_DARK_INK) / (T_LIGHT_INK - T_DARK_INK)
            span = max(0.0, min(1.0, span))
            tone = round(GREY_DARK + (GREY_LIGHT - GREY_DARK) * span)
            dst[x, y] = (tone, tone, tone, alpha)
    return out


BANNERS = {
    # Light: flat white, as requested.
    "suas-light": lambda: compose(crop_content("suas-light.png", WHITE), flat(WHITE)),
    "uavc-light": lambda: compose(crop_content("uavc-light.png"), flat(WHITE)),
    "sae-light": lambda: compose(crop_content("sae-light.png", WHITE), flat(WHITE)),
    # Dark: each competition's own background.
    "suas-dark": lambda: compose(
        circular(crop_content("suas-banner-dark.webp")),
        blurred_backdrop("suas-banner-dark.webp"),
    ),
    "uavc-dark": lambda: compose(
        crop_content("uavc-dark.png"), flat(NAVY)
    ),
    "sae-dark": lambda: compose(
        sae_dark_logo(), blurred_backdrop("sae-banner-dark.webp")
    ),
}

# The UAVC source's own field colour. Filling with the identical value is what
# lets its logo be pasted with its surround intact rather than keyed out.
NAVY = Image.open(os.path.join(HERE, "uavc-dark.png")).convert("RGB").getpixel((1, 1))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, make in BANNERS.items():
        path = os.path.join(OUT, f"{name}.webp")
        make().save(path, "WEBP", quality=90, method=6)
        print(f"{name:<12} {CANVAS[0]}x{CANVAS[1]}  {os.path.getsize(path) / 1024:5.1f}KB")
