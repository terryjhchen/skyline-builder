"""Draws the home-screen icons (no dependencies). Run: python3 tools/make_icons.py"""
import struct
import zlib
from pathlib import Path


def png(path, size, pixel):
    rows = b''
    for y in range(size):
        rows += b'\x00' + b''.join(bytes(pixel(x / size, y / size)) for x in range(size))
    chunk = lambda tag, data: struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data))
    Path(path).write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
                           + chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b''))


# (left, right, top, wall colour, window colour) in 0..1 icon space
TOWERS = [
    (0.14, 0.34, 0.45, (246, 189, 96), (255, 243, 176)),
    (0.38, 0.62, 0.18, (142, 202, 230), (224, 251, 252)),
    (0.66, 0.86, 0.34, (212, 163, 115), (255, 243, 176)),
]
GROUND = 0.8


def pixel(u, v):
    if v > GROUND:
        return (156, 204, 101)
    for left, right, top, wall, window in TOWERS:
        if left <= u <= right and v >= top:
            wu = (u - left) / (right - left) * 3 % 1
            wv = (v - top) / 0.07 % 1
            if 0.25 < wu < 0.75 and 0.3 < wv < 0.75 and v < GROUND - 0.04:
                return window
            return wall
    k = v / GROUND
    return (int(189 - 27 * k), int(224 - 14 * k), 254)


out = Path(__file__).resolve().parent.parent / 'icons'
out.mkdir(exist_ok=True)
for size in (180, 512):
    png(out / f'icon-{size}.png', size, pixel)
