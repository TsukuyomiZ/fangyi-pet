"""Turns the busts render-art.mjs drew into the terminal's PNG headshots.

py scripts/terminal_art.py <render dir>

Writes terminal-art/<name>.png, shown by terminals with the kitty graphics
protocol (kitty, Ghostty). Every other terminal draws the hand-drawn pixel
sprites in hooks/pixel-sprites.ts instead.
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RENDERED = Path(sys.argv[1])
PNG_PX = 160
MOODS = ['idle', 'thinking', 'working', 'speaking', 'done', 'waiting']

# Each bust's head (horns and antlers included), in the 400px-tall render.
HEAD_BOX = {
    'fangyi': (20, 30, 305, 330),
    'panda': (56, 9, 321, 242),
    'mifu': (32, 8, 242, 263),
}


def load(name):
    width, height = (int(v) for v in (RENDERED / f'{name}.box').read_text().split())
    return Image.open(RENDERED / f'{name}.png').convert('RGBA').crop((0, 0, width, height))


def head(name, image):
    return image.crop(HEAD_BOX['fangyi' if name.startswith('fangyi') else name])


def main():
    png_dir = ROOT / 'terminal-art'
    png_dir.mkdir(exist_ok=True)
    names = [f'fangyi-{mood}' for mood in MOODS] + ['panda', 'mifu']
    for name in names:
        image = head(name, load(name))
        width = max(1, round(image.width * PNG_PX / image.height))
        # A 128-colour palette keeps each PNG a few KB.
        image.resize((width, PNG_PX), Image.LANCZOS).quantize(128, method=Image.Quantize.FASTOCTREE).save(
            png_dir / f'{name}.png', optimize=True)
    print('wrote', len(names), 'PNGs')


main()
