from PIL import Image, ImageFilter
import numpy as np

def defringe(im):
    """Undo compositing over white. This is what killed the sticker look and
    it must survive into BOTH grades — brightness was never the cause."""
    a = np.asarray(im).astype(np.float32)
    rgb, alpha = a[..., :3].copy(), a[..., 3:4] / 255.0
    m = (alpha[..., 0] > 0.02) & (alpha[..., 0] < 0.98)
    rgb[m] = (rgb[m] - 255.0 * (1.0 - alpha[m])) / np.maximum(alpha[m], 1e-3)
    return np.clip(rgb, 0, 255), alpha

L = np.array([0.299, 0.587, 0.114], dtype=np.float32)

def grade(rgb, sat, gamma, ambient, tint, exposure, contrast=1.0, pivot=128.0):
    """`contrast`/`pivot` default to identity, so an aircraft that doesn't ask
    for them is graded exactly as before.

    They exist because gamma and exposure cannot separate LEVEL from RANGE.
    Both are monotonic squashes: pulling a too-bright aircraft down with them
    flattens it in the same motion, and a flat silhouette is precisely what
    reads as a sticker. Expanding around a pivot lets an aircraft be brought
    down to the scene's level while keeping — or regaining — its own modelling.

    PIVOT MATTERS. It should sit near the subject's OWN midpoint, not at 128.
    Taco's median is 165, so pivoting at 128 pushed most of the airframe upward
    into the ceiling and clipped its highlights flat: p95 and p99 came out
    identical, which is the signature of blown highlights."""
    lum = rgb @ L
    rgb = lum[..., None] + (rgb - lum[..., None]) * sat
    rgb = 255.0 * np.power(np.clip(rgb, 0, 255) / 255.0, gamma)
    if contrast != 1.0:
        rgb = np.clip(pivot + (rgb - pivot) * contrast, 0, 255)
    lum2 = rgb @ L
    w = (np.power(1.0 - lum2 / 255.0, 1.5) * tint)[..., None]
    rgb = rgb * (1.0 - w) + ambient * w
    return np.clip(rgb * exposure, 0, 255)

# Dark scene (#07091c): ambient is deep navy, exposure pulled down.
DARK = dict(sat=0.88, gamma=1.12, ambient=np.array([0x23,0x2a,0x55], np.float32),
            tint=0.35, exposure=0.90)
# Light scene (#f7f8ff ground #e8e8f9): ambient is a pale cool bounce, and the
# darks get LIFTED toward it — on a white floor an unlit object still receives
# a lot of bounced light, and crushing it to black is what makes it a blob.
# Lifting the darks toward a pale bounce at 0.30 washed all the contrast out —
# the aircraft went grey and flat. Ambient fill is real but small: keep the
# render's own tonal range, just don't darken it for a night scene.
LIGHT = dict(sat=0.97, gamma=1.0, ambient=np.array([0x8a,0x93,0xb0], np.float32),
             tint=0.10, exposure=1.15)

# Per-aircraft overrides. The shared grade suits a mid-tone subject; Do3soka is
# a dark red aircraft that lands much further down the tonal range than the
# grey quadcopter, so the same treatment leaves it nearly invisible against the
# night floor. It gets its own exposure and a gentler highlight rolloff — dark
# mode only, since on the pale floor it reads fine.
OVERRIDES = {
    ("do3soka", "dark"): dict(gamma=1.02, exposure=1.10),
    # Hotwing needs the OPPOSITE of Do3soka's dark override. Do3soka is a dark
    # red airframe that had to be rescued from vanishing; Hotwing is bright
    # sky-blue and starts at 119 luminance, so even the plain night grade left
    # it at 91 against 49 and 64 — the brightest thing on a near-black floor,
    # with a crisp rim and no fog on it (DOM overlays don't receive the scene's
    # fog the way the 3D geometry does). That combination is exactly what reads
    # as a sticker. Pulled down to ~63, level with Itay, it belongs to the scene.
    ("hotwing", "dark"): dict(gamma=1.30, tint=0.50, exposure=0.72),
    # ...but it is a BRIGHT sky-blue airframe that already sits light, so in
    # light mode it needs none of the lifting the darker aircraft do. Left
    # essentially as rendered: de-fringed, a whisper of ambient, nothing else.
    # Pushing exposure on something already this bright only clips the wings
    # to flat white and loses the panel lines.
    ("hotwing", "light"): dict(sat=1.0, gamma=1.0, tint=0.04, exposure=1.0),
    # Taco is the brightest airframe of the four — bare balsa and white film,
    # landing at 137 under the plain night grade where Itay and Hotwing sit at
    # 64 and 63.
    #
    # The first attempt treated that as Hotwing's problem and applied Hotwing's
    # medicine harder: gamma 1.60, exposure 0.55, down to a mean of 66. It read
    # as MUD. Matching Hotwing's mean was the wrong target, because the two
    # aircraft fail for opposite reasons — and the giveaway is in the spread,
    # not the average:
    #
    #     source spread (p95-p05)    dark p95
    #     Hotwing   79   flat        76    <- flat AND bright = sticker
    #     Itay     222   wide       192    <- far brighter, reads fine
    #     Taco     109   moderate   101    <- crushed to 101 by gamma 1.60
    #
    # Itay is the proof: the scene happily holds an aircraft whose highlights
    # reach 192, because it has real modelling. Hotwing had to come down
    # because it is a single flat tone. Taco has modelling of its own, and
    # gamma flattened it away while dragging the level down.
    #
    # So: gamma back to neutral, level set by exposure alone, and `contrast`
    # around Taco's own median to give back the range gamma took. Lands at
    # mean 94 with p05 46 / p95 136 — clearly lit, still under Itay's ceiling.
    ("taco", "dark"): dict(
        gamma=1.0, contrast=1.30, pivot=170.0, tint=0.50, exposure=0.60
    ),
    # ...and it is the ONLY aircraft that needs pulling DOWN in light mode too.
    # The others are darker than the pale floor and get lifted onto it; Taco is
    # a near-white aircraft that came out at 192, close enough to the #e8e8f9
    # ground to lose its silhouette against it. Backing exposure off to 0.92
    # (against the shared grade's 1.15) puts it at 149 — still clearly the
    # lightest of the four, but with an edge again.
    ("taco", "light"): dict(gamma=1.08, tint=0.12, exposure=0.92),
}

for name, size, q in (
    ("do3soka", (563, 563), 82),
    ("itay", (400, 400), 84),
    ("hotwing", (600, 600), 82),
    ("taco", (600, 600), 82),
):
    src = Image.open(f"art-source/vehicles/{name}.png").convert("RGBA")
    src = src.crop(src.getbbox())
    rgb0, alpha = defringe(src)
    solid = alpha[..., 0] >= 0.95
    for suffix, cfg in (("", DARK), ("-light", LIGHT)):
        cfg = {**cfg, **OVERRIDES.get((name, "dark" if suffix == "" else "light"), {})}
        rgb = grade(rgb0.copy(), **cfg)
        out = Image.fromarray(
            np.concatenate([rgb, alpha * 255.0], -1).astype(np.uint8), "RGBA")
        out.thumbnail(size, Image.LANCZOS)


        out.save(f"public/history/vehicles/{name}{suffix}.webp", "WEBP",
                 quality=q, method=6)
        print(f"  {name}{suffix}: {out.size} luminance {(rgb@L)[solid].mean():.1f}")

    # SHADOW MASK: the aircraft's own silhouette, squashed as though seen from
    # above and blurred into a soft pool. An ellipse under a fixed-wing reads
    # wrong; its actual outline does not.
    sil = (alpha[..., 0] * 255).astype(np.uint8)
    m = Image.fromarray(sil, "L")
    w0, h0 = m.size
    m = m.resize((256, max(1, int(256 * h0 / w0 * 0.55))), Image.LANCZOS)
    m = m.filter(ImageFilter.GaussianBlur(radius=max(2, m.size[0] // 40)))
    Image.merge("RGB", (m, m, m)).save(
        f"public/history/vehicles/{name}-shadow.webp", "WEBP",
        quality=70, method=6)
    print(f"  {name}-shadow: {m.size}")
