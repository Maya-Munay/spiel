"""Figuren freistellen: Muse malt sie auf reinem Magenta (#FF00FF), hier wird das Magenta durchsichtig.
Aufruf: python3 freistellen.py roh/baum5.png baum5.webp [--hoehe 900] [--rahmen roh/baum3.png roh/baum4.png …]
--rahmen: gemeinsamer Bildausschnitt für mehrere Stufen (damit sie beim Überblenden genau übereinander liegen)."""
import argparse
import numpy as np
from PIL import Image


def alpha_von(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    magenta = np.minimum(r, b) - g                      # wie „magenta-artig“ ein Pixel ist
    a = np.clip((150 - magenta) / 90, 0, 1)             # ≥150 durchsichtig, ≤60 deckend, dazwischen weich
    return a, magenta


def freistellen(pfad):
    rgb = np.asarray(Image.open(pfad).convert('RGB')).astype(np.float32)
    a, magenta = alpha_von(rgb)
    # Farbsaum entfernen: halbdurchsichtige Pixel sind Figur und Magenta gemischt (C = a·F + (1−a)·M) → Figur F zurückrechnen
    M = np.array([255, 0, 255], np.float32)
    aa = np.maximum(a, 0.08)[..., None]
    rgb = np.where(a[..., None] < 0.999, (rgb - (1 - aa) * M) / aa, rgb)
    rest = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0, None)[..., None] * 0.5 * (1 - a[..., None])   # leichter Rest-Stich, nur an halbdurchsichtigen Rändern
    rgb[..., 0:1] -= rest; rgb[..., 2:3] -= rest
    rgb = np.clip(rgb, 0, 255)
    rgba = np.dstack([rgb, a * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


def kasten(im):
    return im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('ein'); p.add_argument('aus')
    p.add_argument('--hoehe', type=int, default=700)
    p.add_argument('--rahmen', nargs='*', default=[])
    o = p.parse_args()
    im = freistellen(o.ein)
    k = kasten(im)
    for andere in o.rahmen:                              # gemeinsamer Ausschnitt
        k2 = kasten(freistellen(andere))
        k = (min(k[0], k2[0]), min(k[1], k2[1]), max(k[2], k2[2]), max(k[3], k2[3]))
    im = im.crop(k)
    if im.height > o.hoehe:
        im = im.resize((round(im.width * o.hoehe / im.height), o.hoehe), Image.LANCZOS)
    im.save(o.aus, quality=86, method=6)
    print(f'{o.aus}: {im.width}×{im.height}, Ausschnitt {k}')
