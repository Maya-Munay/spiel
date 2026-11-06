#!/usr/bin/env python3
"""Erzeugt die Stimmen (Kolibri, Wald) für alle Texte aus inhalt.js.

Aufruf:  python3 stimme_bauen.py          (nur neue/geänderte Sätze, Rest bleibt)
         python3 stimme_bauen.py --liste  (zeigt nur, was erzeugt würde – kostenlos)
         python3 stimme_bauen.py --proben (Hörproben für stimmen-auswahl.html)

Welche Stimme wer bekommt, steht in inhalt.js unter `stimme`. Sprecher ohne Eintrag bleiben stumm.
Nutzt ../../tts/tts (Gemini-TTS über OpenRouter, Cent-Bereich pro Satz) und ffmpeg.
Ergebnis: stimme/<kennung>.mp3 + stimme/stimmen.js (Zuordnung Text -> Datei).
"""
import hashlib, json, subprocess, sys, tempfile, wave
from pathlib import Path

HIER = Path(__file__).resolve().parent
TTS = HIER.parent.parent / 'tts' / 'tts'
ORDNER = HIER / 'stimme'

STIL_KOLIBRI = 'Sprich hell, fröhlich und lebendig, wie ein kleiner, freundlicher Vogel'
# Hinweis: „Flüstere …“ zusammen mit „Kakaosamen“ blockiert der Anbieter (leere Antwort) – so geht es:
STIL_WALD = 'Sprich wie ein alter, liebevoller Geschichtenerzähler: tief, warm und ruhig, mit kleinen Pausen, als würdest du einem Kind am Feuer eine Geschichte erzählen'
# Hörproben: (Nummer, Sprecher, Beschreibung, Einstellungen)
PROBEN = [
    ('k1', 'kolibri', 'Leda – jugendlich (bisherige Stimme)', dict(voice='Leda', stil=STIL_KOLIBRI, hoeher=1.05)),
    ('k2', 'kolibri', 'Zephyr – hell', dict(voice='Zephyr', stil=STIL_KOLIBRI, hoeher=1.05)),
    ('k3', 'kolibri', 'Laomedeia – beschwingt', dict(voice='Laomedeia', stil=STIL_KOLIBRI, hoeher=1.05)),
    ('k4', 'kolibri', 'Autonoe – klar und hell', dict(voice='Autonoe', stil=STIL_KOLIBRI, hoeher=1.05)),
    ('k5', 'kolibri', 'Sadachbia – lebendig', dict(voice='Sadachbia', stil=STIL_KOLIBRI, hoeher=1.05)),
    ('k6', 'kolibri', 'Puck – fröhlich, eher männlich', dict(voice='Puck', stil=STIL_KOLIBRI, hoeher=1.08)),
    ('k7', 'kolibri', 'Fenrir – aufgeweckt, eher männlich', dict(voice='Fenrir', stil=STIL_KOLIBRI, hoeher=1.08)),
    ('k8', 'kolibri', 'Leda – noch höher, wie ein Vögelchen', dict(voice='Leda', stil=STIL_KOLIBRI, hoeher=1.15)),
    # Wald wie ein alter Geschichtenerzähler (Wunsch Yilmaz 05.11.): etwas tiefer, ohne Nachhall
    ('b1', 'wald', 'Charon – tief und ruhig', dict(voice='Charon', stil=STIL_WALD, hoeher=0.93, tempo=0.96)),
    ('b2', 'wald', 'Algenib – rau wie Rinde', dict(voice='Algenib', stil=STIL_WALD, hoeher=0.93, tempo=0.96)),
    ('b3', 'wald', 'Gacrux – alt und weise', dict(voice='Gacrux', stil=STIL_WALD, hoeher=0.93, tempo=0.96)),
    ('b4', 'wald', 'Orus – fest und warm', dict(voice='Orus', stil=STIL_WALD, hoeher=0.93, tempo=0.96)),
    ('b5', 'wald', 'Sadaltager – bedächtig', dict(voice='Sadaltager', stil=STIL_WALD, hoeher=0.93, tempo=0.96)),
]
PROBE_TEXT = {
    'kolibri': 'Aloha! Ich habe deinen Baum von weit oben gesehen. Was für ein guter Platz – im Schatten, zwischen vielen anderen Pflanzen.',
    'wald': 'Aloha, wundervoll, dass du da bist. In deiner Hand liegt ein Kakaosamen.',
}


def inhalt_laden():
    js = "globalThis.window=globalThis; await import('file://%s'); console.log(JSON.stringify(window.INHALT));" % (HIER / 'inhalt.js')
    aus = subprocess.run(['deno', 'eval', js], capture_output=True, text=True, check=True).stdout
    return json.loads(aus)


def saetze(I):
    """Alle gesprochenen Sätze je Sprecher."""
    paare = I['pflanzen'] + I['wachsen'] + I['kolibriKommt'] + I['quest'] + I.get('ablegen', []) + I['bestaeubt'] + I['abschied']
    s = {'kolibri': [], 'wald': []}
    for w, t in paare:
        s.setdefault(w, []).append(t)
    s['wald'] += [o['text'] for o in I['orte'].values()]
    s['wald'] += [I['wissen'][k]['text'] for k in I.get('entdecken', [])]   # Klick-Überraschungen erzählt der Wald
    s['kolibri'] += [x['text'] for x in I['legende']]
    s['kolibri'] += [I['quiz']['frage']] + [a['echo'] for a in I['quiz']['antworten']]
    s['kolibri'] += list(I.get('suchenHinweis', {}).values()) + I.get('fundJubel', [])
    s['wald'] += I.get('baumRuf', [])
    for k in ('urkundeSatz', 'ortWaehlen', 'yantraSatz', 'segenVor', 'steinSatz'):
        if k in I: s['wald'].append(I[k][1])
    s['wald'] += [t for w, t in I.get('patenschaft', [])]
    if 'segen' in I: s['waldGesang'] = [I['segen']]
    for liste in I.get('kommentare', {}).values(): s['kolibri'] += liste
    s['kolibri'] += list(I.get('questSchon', {}).values()) + I['quiz'].get('frageNochmal', [])
    s['wald'] += I.get('fruehFund', [])
    if 'moment' in I.get('bohnen', {}): s['wald'].append(I['bohnen']['moment'])
    return {w: list(dict.fromkeys(l)) for w, l in s.items()}


def kennung(st, sprech):
    teile = [st['voice'], st['stil'], str(st.get('hoeher', 1.0)), sprech]
    if st.get('hall'): teile.insert(3, 'hall')
    if st.get('tempo', 1.0) != 1.0: teile.insert(3, f"tempo{st['tempo']}")
    return hashlib.sha1('|'.join(teile).encode()).hexdigest()[:10]


# Kosten (gemessen 05.11.2026 über OpenRouter): Ausgabe-Audio 25 Token je Sekunde × 20 $ je Mio. Token
# = 0,05 Cent je Sekunde Stimme; der Eingabetext (1 $ je Mio. Token) fällt kaum ins Gewicht.
KOSTEN = {'sekunden': 0.0}


def kosten_zeigen():
    sek = KOSTEN['sekunden']
    if sek:
        print(f'Gesprochen: {sek:.0f} Sekunden ≈ {sek * 25 * 20e-6:.3f} $ (ca. {sek * 25 * 20e-6 * 100:.1f} Cent)')


def sprechen(st, sprech, datei):
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / 'roh.wav'
        for versuch in range(3):   # die Schnittstelle stolpert ab und zu – dann einfach noch einmal
            r = subprocess.run([str(TTS), f"{st['stil']}: {sprech}", '--voice', st['voice'], '-o', str(wav)], capture_output=True, text=True)
            if r.returncode == 0 and wav.exists():
                with wave.open(str(wav)) as w: KOSTEN['sekunden'] += w.getnframes() / w.getframerate()
                break
            print(f'    (Versuch {versuch + 1} ging nicht: {(r.stderr or r.stdout).strip()[-160:]})')
        else:
            raise SystemExit(f'Stimme {st["voice"]} ging dreimal nicht – bitte später erneut starten.')
        h = float(st.get('hoeher', 1.0))
        kette = []
        tempo = float(st.get('tempo', 1.0))   # < 1 = langsamer sprechen
        if h != 1.0 or tempo != 1.0:
            kette.append(f'asetrate=24000*{h},aresample=24000,atempo={tempo/h:.4f}')
        if st.get('hall'):   # leiser Nachhall, als käme die Stimme aus dem Wald
            kette.append('aecho=0.8:0.7:70|140|230:0.22|0.14|0.08')
        kette += ['highpass=f=90', 'loudnorm=I=-18:TP=-2']
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-af', ','.join(kette),
                        '-ac', '1', '-b:a', '64k', str(datei)], check=True)


def proben():
    ziel = ORDNER / 'proben'
    ziel.mkdir(parents=True, exist_ok=True)
    liste = []
    for nr, wer, name, st in PROBEN:
        datei = ziel / f'{nr}-{kennung(st, PROBE_TEXT[wer])}.mp3'
        if not datei.exists():
            try:
                sprechen(st, PROBE_TEXT[wer], datei)
            except SystemExit as e:
                print('  ✗', nr, name, '–', e); continue
            for alt in ziel.glob(f'{nr}-*.mp3'):
                if alt != datei: alt.unlink()
            print('  ✓', nr, name)
        liste.append(dict(nr=nr, wer=wer, name=name, datei=f'stimme/proben/{datei.name}', einstellung=st))
    (ziel / 'proben.js').write_text('// automatisch erzeugt von stimme_bauen.py --proben\nwindow.PROBEN = '
                                    + json.dumps(dict(texte=PROBE_TEXT, liste=liste), ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
    genutzt = {Path(x['datei']).name for x in liste}
    for alt in ziel.glob('*.mp3'):
        if alt.name not in genutzt: alt.unlink()
    kosten_zeigen()
    print('stimme/proben/proben.js geschrieben – öffne stimmen-auswahl.html zum Anhören.')


def main():
    if '--proben' in sys.argv:
        return proben()
    I = inhalt_laden()
    ORDNER.mkdir(exist_ok=True)
    zuordnung, neu = {}, []
    for wer, liste in saetze(I).items():
        st = I.get('stimme', {}).get(wer)
        if not st:
            continue
        for text in liste:
            sprech = text
            for a, b in I.get('aussprache', {}).items():
                sprech = sprech.replace(a, b)
            k = kennung(st, sprech)
            datei = ORDNER / f'{k}.mp3'
            zuordnung[text] = f'stimme/{k}.mp3'
            if not datei.exists():
                neu.append((st, sprech, datei, wer))
    print(f'{len(zuordnung)} Sätze mit Stimme, davon {len(neu)} neu zu sprechen.')
    if '--liste' in sys.argv:
        for _, sprech, _, wer in neu: print(f'  • [{wer}]', sprech)
        return
    for st, sprech, datei, wer in neu:
        sprechen(st, sprech, datei)
        print('  ✓', wer, datei.name, sprech[:60])
    # aufräumen: Dateien, die zu keinem Text mehr gehören (Hörproben bleiben)
    genutzt = {Path(p).name for p in zuordnung.values()}
    for alt in ORDNER.glob('*.mp3'):
        if alt.name not in genutzt: alt.unlink(); print('  – entfernt', alt.name)
    (ORDNER / 'stimmen.js').write_text('// automatisch erzeugt von stimme_bauen.py\nwindow.STIMMEN = ' + json.dumps(zuordnung, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
    print('stimme/stimmen.js geschrieben.')
    kosten_zeigen()


if __name__ == '__main__':
    main()
