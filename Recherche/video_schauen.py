"""Gemini schaut ein YouTube-Video (über OpenRouter) und beschreibt Gestaltung + Spielablauf.
Aufruf: python3 video_schauen.py URL ausgabe.md [modell] ["Spielname, kurze Beschreibung"]"""
import json, sys, time, urllib.request
from pathlib import Path

ENV = Path('/Users/yilmaz/Documents/Claude/tts/.env')
key = next(l.split('=', 1)[1].strip().strip('"\'') for l in ENV.read_text().splitlines() if l.startswith('OPENROUTER_API_KEY'))
url, ziel = sys.argv[1], Path(sys.argv[2])
modell = sys.argv[3] if len(sys.argv) > 3 else 'google/gemini-2.5-flash'
SPIEL = sys.argv[4] if len(sys.argv) > 4 else 'Monkey Island 2 Special Edition, das Remake mit neu gemalter HD-Grafik'

FRAGE = f"""Du bist ein erfahrener Spieleentwickler und Art Director. Schau dir dieses Gameplay-Video an
({SPIEL}). Wir bauen ein kleines,
eigenes Point-and-Click-Lernspiel für Kinder und Erwachsene (Thema Kakao im Regenwald, Browser, SVG-Grafik)
und wollen den GESTALTERISCHEN STIL und das SPIELGEFÜHL verstehen – nicht das Spiel nachbauen.

Beschreibe auf Deutsch, konkret und mit Zeitstempeln (mm:ss) als Belege:

1. Bildaufbau: Ebenen (Vordergrund/Mittelgrund/Hintergrund), Rahmung durch Vordergrund-Elemente,
   wo die Figur steht, wie viel Raum frei bleibt, Blickführung.
2. Farbe und Licht: typische Paletten je Ort (Tag/Nacht/Innenraum), Kontraste, Lichtquellen,
   Schatten, Atmosphäre (Dunst, Lichtstrahlen), wie Figuren sich vom Hintergrund abheben.
3. Malstil: Pinselführung, Konturen ja/nein, Detailgrad, wie Bäume, Blätter, Wasser, Felsen gemalt sind.
4. Bewegung: was im Hintergrund lebt (Wasser, Wolken, Tiere, Flackern), Figurenanimation,
   Kamerabewegung/Scrollen, Übergänge zwischen Orten.
5. Bedienung/UI: Mauszeiger, Namen beim Darüberfahren, Verben/Aktionsrad, Inventar (wie aufgerufen,
   wie Gegenstände gezeigt werden, Kombinieren), Dialogauswahl, Untertitel-Darstellung.
6. Spielablauf: wie Rätsel aufgebaut sind, wie der Spieler Hinweise bekommt, Belohnungsmomente,
   Humor, Tempo, wie Gespräche Informationen vermitteln.
7. Ton: Musik (Stimmung, Wechsel je Ort), Geräusche, Sprachausgabe.
7b. Figuren: wie Nebenfiguren gestaltet sind, was sie wollen, wie sie mit dem Spieler sprechen.
7c. Welt und Struktur: wie Orte verbunden sind, wie viel es pro Bildschirm zu entdecken gibt (Klick-Überraschungen), Belohnungen fürs Erkunden, Sammelobjekte, Speichern, Einstieg/Anleitung für Kinder.
8. Die 10 wichtigsten Dinge, die wir für ein kindgerechtes, farbenfrohes Lernspiel übernehmen
   sollten (Prinzipien, keine Kopie), und 3 Dinge, die für Kinder eher NICHT passen.

Erfinde nichts: wenn etwas im Video nicht zu sehen ist, schreib das."""

body = {
    'model': modell,
    'messages': [{'role': 'user', 'content': [
        {'type': 'text', 'text': FRAGE},
        {'type': 'video_url', 'video_url': {'url': url}},
    ]}],
    'provider': {'order': ['google-ai-studio'], 'allow_fallbacks': False},
    'usage': {'include': True},
}
req = urllib.request.Request('https://openrouter.ai/api/v1/chat/completions', json.dumps(body).encode(),
                             {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
t = time.time()
try:
    with urllib.request.urlopen(req, timeout=900) as r:
        d = json.load(r)
except urllib.error.HTTPError as e:
    print('Fehler', e.code, e.read().decode()[:1500]); sys.exit(1)
text = d['choices'][0]['message']['content']
u = d.get('usage', {})
ziel.write_text(f"# Gemini schaut: {url}\n\nModell: {modell} · Dauer {time.time() - t:.0f} s · "
                f"Tokens ein {u.get('prompt_tokens')} / aus {u.get('completion_tokens')} · Kosten ${u.get('cost')}\n\n{text}\n")
print('ok', u)
