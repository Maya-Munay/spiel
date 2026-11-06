#!/usr/bin/env python3
"""Packt die Aufnahmen aus klang/*.mp3 in klang/aufnahmen.js (Base64).

Warum: Wird das Spiel als Datei geöffnet (Doppelklick auf index.html), verbieten alle Browser
das Nachladen von Tondateien für Web Audio – dann klängen nur die Ersatz-Töne.
Als Skript eingebunden funktionieren die Aufnahmen überall (Datei, GitHub Pages, Odoo-iframe).

Aufruf nach jeder Änderung an klang/*.mp3:  python3 klang/einbetten.py
"""
import base64, json
from pathlib import Path

HIER = Path(__file__).resolve().parent
NAMEN = {  # Name im Spiel -> Datei
    'voegel': 'waldvoegel.mp3',
    'fliegen': 'kolibri-fliegen.mp3',
    'anflug': 'kolibri-anflug.mp3',
    'abflug': 'kolibri-abflug.mp3',
    'tukan': 'tukan.mp3',
    'affe': 'bruellaffe.mp3',
    'frosch': 'frosch.mp3',
    'stein1': 'stein-wasser-1.mp3',
    'stein2': 'stein-wasser-2.mp3',
    'stein3': 'stein-wasser-3.mp3',
    'papageien': 'papageien.mp3',
}
daten = {n: base64.b64encode((HIER / d).read_bytes()).decode() for n, d in NAMEN.items() if (HIER / d).exists()}
(HIER / 'aufnahmen.js').write_text(
    '// automatisch erzeugt von klang/einbetten.py – nicht von Hand ändern\nwindow.AUFNAHMEN_DATEN = '
    + json.dumps(daten) + ';\n', encoding='utf-8')
print('klang/aufnahmen.js:', ', '.join(daten), f'({sum(len(v) for v in daten.values()) / 1e6:.1f} MB)')
