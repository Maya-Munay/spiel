#!/usr/bin/env python3
"""Packt alle Figuren, die die Welt braucht, in wenige große Bildblätter (schneller online: wenige Dateien statt 60).

Aufruf (im Ordner figuren/):  python3 bildblatt_bauen.py
Ergebnis: bildblatt-1.webp, bildblatt-2.webp … und bildblatt.json (wo welches Bild liegt).
welt.js lädt zuerst das Bildblatt; fehlt es, lädt es die Einzelbilder wie bisher.
Nach jedem neuen oder geänderten Figurenbild bitte neu bauen.
"""
import json
from pathlib import Path
from PIL import Image

HIER = Path(__file__).resolve().parent
# dieselbe Liste wie ALLE + VORN in welt.js
NAMEN = ['baum1', 'baum2', 'baum3', 'baum4', 'baum5', 'bananenstaude', 'palme', 'kolibri', 'kolibri-2', 'kolibri-3', 'baum-augen', 'baum-augen-zu', 'baum-mund', 'baum-mund-halb', 'baum-mund-offen',
         'patenschild', 'bohne', 'frosch', 'frosch-sprung', 'tukan', 'tukan-2', 'faultier', 'faultier-2', 'ameisen', 'morpho', 'bruellaffe', 'bruellaffe-ruhe', 'pilz', 'fisch', 'fisch-2',
         'decke-laub', 'decke-gras', 'decke-wurzel', 'decke-farn', 'ding-laub', 'ding-banane', 'ding-schalen', 'krabbel-kaefer', 'krabbel-wurm', 'krabbel-grille', 'frucht', 'kokosnuss',
         'ara-rot', 'ara-rot-2', 'ara-rot-3', 'ara-blau', 'ara-blau-2', 'ara-blau-3',
         'vorn-rechts-vorn', 'vorn-links-vorn', 'haengt-1-vorn', 'haengt-2-vorn']
BREITE, HOEHE, RAND = 4096, 4096, 2   # höchstens 4096 × 4096 (das schafft jedes iPhone), 2 px Abstand gegen Ausbluten


def main():
    bilder = {n: Image.open(HIER / f'{n}.webp').convert('RGBA') for n in NAMEN}
    reihenfolge = sorted(NAMEN, key=lambda n: -bilder[n].height)   # Regal-Packen: hohe Bilder zuerst
    blaetter, lage = [[]], {}
    x = y = zeile = 0
    for n in reihenfolge:
        w, h = bilder[n].size
        if x + w > BREITE: x, y, zeile = 0, y + zeile + RAND, 0
        if y + h > HOEHE:
            blaetter.append([]); x = y = zeile = 0
        blaetter[-1].append((n, x, y)); lage[n] = (len(blaetter) - 1, x, y, w, h)
        x += w + RAND; zeile = max(zeile, h)
    dateien = []
    for i, inhalt in enumerate(blaetter, 1):
        hoch = max(y + bilder[n].height for n, _, y in inhalt)
        blatt = Image.new('RGBA', (BREITE, hoch), (0, 0, 0, 0))
        for n, x, y in inhalt: blatt.paste(bilder[n], (x, y))
        name = f'bildblatt-{i}.webp'
        blatt.save(HIER / name, 'WEBP', quality=84, alpha_quality=90, method=6)
        dateien.append(name)
        print(f'{name}: {BREITE} × {hoch}, {len(inhalt)} Bilder, {(HIER / name).stat().st_size // 1024} KB')
    (HIER / 'bildblatt.json').write_text(json.dumps({'blaetter': dateien, 'bilder': lage}, ensure_ascii=False), encoding='utf-8')
    alt = sum((HIER / f'{n}.webp').stat().st_size for n in NAMEN) // 1024
    print(f'bildblatt.json geschrieben · Einzelbilder zusammen {alt} KB in {len(NAMEN)} Dateien')


if __name__ == '__main__':
    main()
