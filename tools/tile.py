# tools/tile.py — tiles the stills made by tools/sheet.mjs into one time-stamped sheet.
import sys, json, glob, os
from PIL import Image, ImageDraw, ImageFont
tmp, out, cols, w, crop = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5] if len(sys.argv) > 5 else ''
times = json.load(open(os.path.join(tmp, 'times.json'))); files = sorted(glob.glob(os.path.join(tmp, 'f*.jpeg')))
ims = []
for f in files:
    im = Image.open(f).convert('RGB')
    if crop: x, y, cw, ch = map(int, crop.split(',')); im = im.crop((x, y, x + cw, y + ch))
    ims.append(im.resize((w, round(im.height * w / im.width))))
tw, th = ims[0].size; rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 22)), (20, 20, 20)); d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except OSError: font = ImageFont.load_default()
for i, im in enumerate(ims):
    x, y = (i % cols) * tw, (i // cols) * (th + 22); sheet.paste(im, (x, y + 22)); d.text((x + 4, y + 3), f'{times[i]:.2f}s', fill=(255, 220, 120), font=font)
sheet.save(out); print(out, len(ims), 'frames')
