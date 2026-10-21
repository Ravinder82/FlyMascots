#!/usr/bin/env python3
"""
Post stage for the Sunny mascot renders.

The WebGL frame is captured with an alpha channel, so the background, contact
shadow, bloom, grade and grain are all authored here instead of in the render
loop. Deterministic, resolution-independent, and it never touches the mascot
itself.

    python3 marketing/tools/grade-pup.py in.png out.png [--size 7680]
"""
import sys
from PIL import Image, ImageFilter
import numpy as np

BG_TOP = np.array([64, 50, 40], np.float32)
BG_BOT = np.array([11, 9, 8], np.float32)
POOL = np.array([58, 40, 22], np.float32)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    src_path, out_path = sys.argv[1], sys.argv[2]
    target = None
    if '--size' in sys.argv:
        target = int(sys.argv[sys.argv.index('--size') + 1])

    src = Image.open(src_path).convert('RGBA')
    if target and src.width != target:
        h = round(target * src.height / src.width)
        src = src.resize((target, h), Image.LANCZOS)
    W, H = src.size

    rgb = np.asarray(src.convert('RGB'), np.float32)
    alpha = np.asarray(src.getchannel('A'), np.float32) / 255.0
    a_img = src.getchannel('A')

    # ---- studio background -------------------------------------------------
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = W * 0.50, H * 0.33
    r = np.sqrt(((xx - cx) / (W * 0.78)) ** 2 + ((yy - cy) / (H * 0.82)) ** 2)
    r = np.clip(r, 0, 1)[..., None]
    bg = BG_TOP * (1 - r) + BG_BOT * r

    tx, ty = W * 0.50, H * 0.30
    pool = np.exp(-((((xx - tx) / (W * 0.26)) ** 2 +
                     ((yy - ty) / (H * 0.26)) ** 2)) * 1.9)
    bg = bg + pool[..., None] * POOL

    # ---- contact shadow ----------------------------------------------------
    # Two layers: a tight ambient core that actually touches the feet, plus a
    # wide offset cast pool. One soft blob reads as fog, not contact.
    # Contact shadow: a blurred copy of the silhouette reads as fog. A real
    # product shot has a tight core under the feet plus a wide soft falloff.
    ys, xs = np.where(alpha > 0.5)
    y0 = float(ys.max())
    xl, xr = float(xs.min()), float(xs.max())
    scx = (xl + xr) * 0.5
    half = (xr - xl) * 0.52
    sh = np.zeros_like(alpha)
    ygrid = np.arange(H, dtype=np.float32)[:, None]
    xgrid = np.arange(W, dtype=np.float32)[None, :]
    for rw, rh, gain in ((0.55, 0.115, 0.90), (1.05, 0.30, 0.38)):
        wx = np.clip(1.0 - np.abs(xgrid - scx) / (half * rw), 0, 1) ** 1.6
        wy = np.clip(1.0 - np.abs(ygrid - (y0 - rh * H * 0.16)) / (rh * H), 0, 1) ** 1.6
        sh = np.maximum(sh, (wy * wx) * gain)
    bg = bg * (1 - sh[..., None] * 0.92)

    # ---- composite ---------------------------------------------------------
    a3 = alpha[..., None]
    comp = rgb * a3 + bg * (1 - a3)

    # ---- bloom: bright pass, wide blur, screen ------------------------------
    lum = comp.max(2, keepdims=True)
    bright = np.clip((comp - 168.0) / 87.0, 0, 1) * comp
    b = Image.fromarray(np.clip(bright, 0, 255).astype(np.uint8))
    b = b.filter(ImageFilter.GaussianBlur(W * 0.006))
    b = b.filter(ImageFilter.GaussianBlur(W * 0.004))
    bloom = np.asarray(b, np.float32) / 255.0
    comp = 1 - (1 - comp / 255.0) * (1 - bloom * 0.42)
    comp = comp * 255.0

    # ---- grade -------------------------------------------------------------
    x = comp / 255.0
    x = np.clip((x - 0.5) * 1.085 + 0.5, 0, 1)             # contrast
    # warm the highlights, cool the shadows a hair
    l = x.mean(2, keepdims=True)
    x = x + (l - 0.5) * np.array([0.035, 0.008, -0.030], np.float32)
    # saturation
    g = x.mean(2, keepdims=True)
    x = g + (x - g) * 1.10
    comp = np.clip(x, 0, 1) * 255.0

    # ---- vignette ----------------------------------------------------------
    vig = 1.0 - 0.34 * smoothstep(0.42, 1.05, r[..., 0] * 1.05)
    comp = comp * vig[..., None]

    # ---- grain -------------------------------------------------------------
    rng = np.random.default_rng(7)
    n = rng.normal(0, 1, (H, W, 1)).astype(np.float32)
    n = np.asarray(
        Image.fromarray(((n[..., 0] * 0.5 + 0.5) * 255).astype(np.uint8))
        .filter(ImageFilter.GaussianBlur(0.6)), np.float32)[..., None] / 255.0 - 0.5
    comp = comp + n * 3.4

    out = Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8))
    out.save(out_path)
    print(f'{out_path} {out.size[0]}x{out.size[1]}')


if __name__ == '__main__':
    main()
