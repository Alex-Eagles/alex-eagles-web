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

def grade(rgb, sat, gamma, ambient, tint, exposure):
    lum = rgb @ L
    rgb = lum[..., None] + (rgb - lum[..., None]) * sat
    rgb = 255.0 * np.power(np.clip(rgb, 0, 255) / 255.0, gamma)
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
}

for name, size, q in (("do3soka", (563, 563), 82), ("itay", (400, 400), 84)):
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
