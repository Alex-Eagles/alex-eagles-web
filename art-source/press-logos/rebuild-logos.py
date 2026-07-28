"""
Rebuild the Media Coverage outlet logos.

    cd alex-eagles-web && python art-source/press-logos/rebuild-logos.py

Reads the brand originals in this folder and writes optimised WebP into
public/press/outlets/. Nothing else in the site touches these files, so re-run
it whenever a logo is replaced or a new outlet is added — never hand-place a
raw brand logo in public/, because an untreated mark is unreadable on at least
some of the video stills it has to sit on.

WHAT IT DOES, AND WHY EACH STEP EXISTS

 1. ALPHA-THRESHOLD TRIM — not PIL's getbbox(). MBC's original has stray
    alpha=1 pixels in three corners, so getbbox() calls the whole 1280x1280
    canvas "content" and trims nothing, which then shrinks the visible mark to
    a speck during step 3. Anything at or below alpha 8 counts as empty.

 2. LIGHTNESS FLOOR — the contrast lift. ONLY lightness moves, and only where a
    pixel is too dark to read on the tile's dark scrim. Hue and saturation are
    untouched, so MBC stays MBC red and DMC keeps its orange-to-purple ring.
    Ink that is black or near-black has no hue to preserve and goes near-white;
    that is confined to type that was already colourless.

    A logo can OPT OUT (see SOURCES). Youm7 does, because its file is the
    app-icon artwork — an opaque white rounded square carrying black and red
    type. It brings its own light ground, so it reads on the scrim untouched,
    and lifting it is destructive: raising the black type toward white dissolves
    it into the white square underneath, leaving a blank tile with three red
    glyphs floating on it.

 3. OPTICAL BALANCE — so ONE css height can draw all five. The geometric mean of
    two normalisations, because neither works alone: matching INK AREA alone
    collapses a mark with very heavy letterforms (Youm7's bold Arabic carries so
    much painted area it fell to half the size of its neighbours), while
    matching HEIGHT alone lets a thin wide wordmark like CBC dominate the row.

 4. ENCODE BOTH WAYS — hard-edged marks often compress smaller lossless, and
    gradients (DMC's ring) smaller lossy. Rather than guess per file, encode
    both and keep whichever came out smaller.
"""

import colorsys
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "public", "press", "outlets")

# name -> (source file in this folder, apply the lightness lift?)
SOURCES = {
    "youm7": ("youm7.png", False),  # see step 2 — brings its own white ground
    "mbc": ("mbc.png", True),
    "cbc": ("cbc.png", True),
    "dmc": ("dmc.webp", True),
    "ontv": ("ontv.png", True),
}

ALPHA_FLOOR = 8         # at or below this, a pixel is empty
L_FLOOR_COLOUR = 0.56   # lightness floor for ink that has a hue
L_FLOOR_NEUTRAL = 0.88  # lightness floor for black / near-black ink

# Saturation at which a pixel counts as fully coloured. Between 0 and this, the
# floor RAMPS between the two values above — it is not a switch.
#
# It used to be a hard threshold at 0.15, and that wrecked DMC. Its wordmark's
# ink has a saturation median of 0.147, straddling the line: 31% of the pixels
# in a letterform tested above it and 69% below, so neighbouring pixels were
# assigned floors 0.32 lightness apart on the strength of source noise. The
# letters came out speckled, and it looked for all the world like a bad WebP
# encode. Any hard threshold has this failure mode; it only shows when real
# artwork happens to sit on the line.
S_NEUTRAL = 0.35

# Export height. Drawn at 40px css, so this is 5x — which is the point: at the
# old 120 it was exactly 1:1 on a 3x phone, leaving no headroom at all, and
# DMC's wordmark was visibly soft. The files are single-digit KB either way.
CANVAS_H = 200

# The two halves of the optical balance, as fractions of the canvas, so CANVAS_H
# stays a pure quality knob — changing it rescales both and every mark keeps its
# relative size.
INK_RATIO = 62 / 120
HEIGHT_RATIO = 112 / 120


def trim(im):
    """Bounding box of every pixel above ALPHA_FLOOR."""
    w, h = im.size
    data = im.getchannel("A").tobytes()
    xs, ys = [], []
    for y in range(h):
        row = data[y * w:(y + 1) * w]
        hit = [x for x, v in enumerate(row) if v > ALPHA_FLOOR]
        if hit:
            ys.append(y)
            xs += (hit[0], hit[-1])
    return im if not ys else im.crop((min(xs), ys[0], max(xs) + 1, ys[-1] + 1))


def lift_pixel(rgb, memo):
    """Raise one colour to its lightness floor. Memoised — a logo is a handful
    of flat colours plus gradient ramps, so the same RGB recurs constantly and
    an HLS round-trip per pixel would be almost entirely repeat work."""
    if rgb in memo:
        return memo[rgb]
    r, g, b = rgb
    hue, light, sat = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)

    # Smoothstep from the neutral floor to the colour floor. Continuous, so two
    # pixels with almost the same saturation always get almost the same floor.
    t = min(1.0, sat / S_NEUTRAL)
    t = t * t * (3 - 2 * t)
    floor = L_FLOOR_NEUTRAL + (L_FLOOR_COLOUR - L_FLOOR_NEUTRAL) * t

    out = rgb
    if light < floor:
        nr, ng, nb = colorsys.hls_to_rgb(hue, floor, sat)
        out = (round(nr * 255), round(ng * 255), round(nb * 255))
    memo[rgb] = out
    return out


def build(name, src_file, do_lift):
    im = trim(Image.open(os.path.join(HERE, src_file)).convert("RGBA"))

    # The lift runs at FULL source resolution and the image is resized exactly
    # ONCE, at the end. The previous order — downscale, lift, downscale again —
    # cost quality twice over: two resamples softened every edge, and the lift
    # was being applied to pixels that had already been blended by the first
    # one, so an anti-aliased edge got pushed to the floor as if it were solid
    # ink. DMC's wordmark showed both, as mottling inside the letterforms.
    memo = {}
    src = im.load()
    lifted = Image.new("RGBA", im.size, (0, 0, 0, 0))
    dst = lifted.load()

    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = src[x, y]
            if a <= ALPHA_FLOOR:
                continue
            dst[x, y] = (*lift_pixel((r, g, b), memo), a) if do_lift else (r, g, b, a)

    # Both factors are ratios of the image being scaled, so this is
    # resolution-independent — it gives the same answer whatever size the
    # source happens to be.
    ink = sum(lifted.getchannel("A").tobytes()) / 255.0
    scale = (
        (CANVAS_H * INK_RATIO / ink**0.5) * (CANVAS_H * HEIGHT_RATIO / lifted.height)
    ) ** 0.5
    w, h = max(1, round(lifted.width * scale)), max(1, round(lifted.height * scale))
    if h > CANVAS_H:
        w, h = max(1, round(w * CANVAS_H / h)), CANVAS_H
    lifted = lifted.resize((w, h), Image.LANCZOS)

    canvas = Image.new("RGBA", (w, CANVAS_H), (0, 0, 0, 0))
    canvas.alpha_composite(lifted, (0, (CANVAS_H - h) // 2))

    # Lossless first. Lossy WebP subsamples chroma and blocks, and on flat
    # near-white type over transparency that shows up as exactly the grey-blue
    # mottling that ruined DMC at q88. Lossy is still allowed to win, but only
    # at q95 with alpha untouched, and only when it is genuinely smaller.
    final = os.path.normpath(os.path.join(OUT, f"{name}.webp"))
    a_path, b_path = final + ".a", final + ".b"
    canvas.save(a_path, "WEBP", lossless=True, method=6)
    canvas.save(b_path, "WEBP", quality=95, alpha_quality=100, method=6)
    smaller = a_path if os.path.getsize(a_path) <= os.path.getsize(b_path) else b_path
    os.replace(smaller, final)
    os.remove(b_path if smaller == a_path else a_path)

    note = "lossless" if smaller == a_path else "lossy q95"
    if not do_lift:
        note += ", no lift"
    print(f"{name:<8} {w}x{CANVAS_H}  {os.path.getsize(final) / 1024:5.1f}KB  ({note})")


if __name__ == "__main__":
    for logo, (source, lift) in SOURCES.items():
        build(logo, source, lift)
