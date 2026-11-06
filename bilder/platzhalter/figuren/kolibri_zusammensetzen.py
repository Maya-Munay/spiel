"""Kolibri-Bewegungsbilder mit FESTEM Körper: Nur die Flügel wechseln.
Aus jedem Bild (kolibri, kolibri-2, kolibri-3) werden die Flügel ausgeschnitten (Bild minus flügelloser Körper),
an Körper 1 ausgerichtet (Verschiebung per Vergleich der Körper-Umrisse) und unter den immer gleichen Körper 1 gelegt."""
import numpy as np
from PIL import Image, ImageFilter
from freistellen import freistellen

R = 'roh/'
NAMEN = ['kolibri', 'kolibri-2', 'kolibri-3']

def alpha(im): return np.asarray(im.getchannel('A')).astype(np.float32) / 255

def verschiebung(a, b, weite=48):
    """(dx, dy), die Maske b auf Maske a legt (grob, dann fein)."""
    best, bd = None, (0, 0)
    for schritt, mitte, w in ((4, (0, 0), weite), (1, None, 4)):
        cx, cy = mitte if mitte else bd
        for dy in range(cy - w, cy + w + 1, schritt):
            for dx in range(cx - w, cx + w + 1, schritt):
                d = np.abs(a - np.roll(np.roll(b, dy, 0), dx, 1)).sum()
                if best is None or d < best: best, bd = d, (dx, dy)
    return bd

koerper = [freistellen(R + n + '-koerper.png') for n in NAMEN]
bilder = [freistellen(R + n + '.png') for n in NAMEN]
k1 = alpha(koerper[0])
klein = lambda a: a[::4, ::4]
ergebnisse = []
for n, k, b in zip(NAMEN, koerper, bilder):
    dx, dy = verschiebung(klein(k1), klein(alpha(k)), 12)          # grob auf 1/4 Größe
    dx, dy = dx * 4, dy * 4
    # Flügel = Bild ohne den (leicht vergrößerten) eigenen Körper
    maske = k.getchannel('A').point(lambda v: 255 if v > 60 else 0).filter(ImageFilter.MaxFilter(9))
    fluegel = b.copy(); fa = np.asarray(fluegel).copy()
    fa[..., 3] = np.where(np.asarray(maske) > 0, 0, fa[..., 3])
    fluegel = Image.fromarray(fa)
    # Flügelrand leicht einziehen: nimmt den rosa Saum, den Muse an den verwischten Rändern gemalt hat
    fluegel.putalpha(fluegel.getchannel('A').filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1)))
    verschoben = Image.new('RGBA', b.size, (0, 0, 0, 0)); verschoben.paste(fluegel, (dx, dy), fluegel)
    bild = verschoben.copy(); bild.alpha_composite(koerper[0])
    ergebnisse.append(bild)
    print(n, 'Flügel verschoben um', dx, dy)

# gemeinsamer Ausschnitt, gleiche Größe wie bisher (Höhe 380)
kasten = None
for im in ergebnisse:
    k = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    kasten = k if not kasten else (min(kasten[0], k[0]), min(kasten[1], k[1]), max(kasten[2], k[2]), max(kasten[3], k[3]))
for n, im in zip(NAMEN, ergebnisse):
    im = im.crop(kasten); im = im.resize((round(im.width * 380 / im.height), 380), Image.LANCZOS)
    im.save(n + '.webp', quality=86, method=6)
print('Ausschnitt', kasten)
