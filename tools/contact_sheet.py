# tools/contact_sheet.py — 2 fps contact sheet of a render, each tile stamped with its episode time.
# usage: python tools/contact_sheet.py out/day1_test.mp4 out/day1_contact.png [--t0 28.6] [--fps 2] [--cols 8] [--w 400]
import argparse, os, subprocess, tempfile, glob
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('out')
ap.add_argument('--t0', type=float, default=28.6); ap.add_argument('--fps', type=float, default=2)
ap.add_argument('--cols', type=int, default=8); ap.add_argument('--w', type=int, default=400)
ap.add_argument('--start', type=float, default=0); ap.add_argument('--dur', type=float, default=0)
a = ap.parse_args()
tmp = tempfile.mkdtemp()
cmd = ['ffmpeg', '-v', 'error', '-ss', str(a.start)]
if a.dur: cmd += ['-t', str(a.dur)]
cmd += ['-i', a.video, '-vf', f'fps={a.fps},scale={a.w}:-1', os.path.join(tmp, 'f%04d.png')]
subprocess.run(cmd, check=True)
files = sorted(glob.glob(os.path.join(tmp, 'f*.png')))
tw, th = Image.open(files[0]).size
rows = (len(files) + a.cols - 1) // a.cols
sheet = Image.new('RGB', (a.cols * tw, rows * (th + 22)), (20, 20, 20))
d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('arial.ttf', 16)
except OSError: font = ImageFont.load_default()
for i, f in enumerate(files):
    x, y = (i % a.cols) * tw, (i // a.cols) * (th + 22)
    sheet.paste(Image.open(f), (x, y + 22))
    d.text((x + 4, y + 3), f'{a.t0 + a.start + i / a.fps:.1f}s', fill=(255, 220, 120), font=font)
sheet.save(a.out)
print(a.out, len(files), 'frames')
