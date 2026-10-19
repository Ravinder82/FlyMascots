"""Stitch QA tiles into exact full-page review shots using the sidecar
scroll offsets (overlapping last tile is stamped, not appended)."""
from PIL import Image
import glob, json, os, sys

label = sys.argv[1] if len(sys.argv) > 1 else 'v2'
os.chdir(os.path.join(os.path.dirname(__file__), '../stills/site-review'))

for theme in ('light', 'dark'):
    for vp in ('mobile', 'tablet', 'desktop'):
        meta_path = f'{label}-{theme}-{vp}.json'
        if not os.path.exists(meta_path):
            continue
        meta = json.load(open(meta_path))
        tiles = [f'{label}-{theme}-{vp}-t{i}.png' for i in range(len(meta['ys']))]
        if not all(os.path.exists(t) for t in tiles):
            continue
        H = meta['viewportH']
        last_y = meta['ys'][-1]
        canvas = Image.new('RGB', (meta.get('w') or Image.open(tiles[0]).width, last_y + H), (255, 255, 255))
        for y, t in zip(meta['ys'], tiles):
            canvas.paste(Image.open(t), (0, y))
        out = f'{label}-{theme}-{vp}-full.png'
        canvas.save(out)
        print(out, canvas.size, f'{os.path.getsize(out)//1024}KB')
        for t in tiles:
            os.remove(t)
        os.remove(meta_path)
