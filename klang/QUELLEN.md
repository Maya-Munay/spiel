# Herkunft der Aufnahmen

Alle Aufnahmen stammen von **Pixabay** (`waldvoegel.mp3` laut Download-Herkunft, die drei Kolibri-Dateien laut Yilmaz am 05.11.2026).
Pixabay-Inhaltslizenz: frei nutzbar, auch geschäftlich, ohne Namensnennung; nicht erlaubt ist,
die Dateien unverändert als eigenständige Sounds weiterzugeben oder zu verkaufen. Im Spiel eingebaut passt das.

| Datei im Spiel | Original | Bearbeitung |
|---|---|---|
| `kolibri-fliegen.mp3` | Yilmaz: `KOLIBRI_FLYING.mp3` (05.11.2026) – Pixabay | Mono, nahtlose Schleife; beim Fliegen laut, beim Schweben in der Szene ganz leise |
| `kolibri-anflug.mp3` | Yilmaz: `KOLIBRI_FlyingIN.mp3` – Pixabay | Stereo, ein-/ausgeblendet, endet genau bei der Ankunft des Kolibris |
| `kolibri-abflug.mp3` | Yilmaz: `KOLIBRI_FlyingOUT.mp3` – Pixabay | Stereo, auf 1,7 s gekürzt (danach war Stille), ausgeblendet |
| `waldvoegel.mp3` | mind_out_of_office – „bird chirping in the forest among the trees“ (308623) | Brummen unter 1,2 kHz gefiltert, nahtlose Schleife |

Im Spiel werden sie über `klang/aufnahmen.js` geladen (erzeugt mit `python3 klang/einbetten.py`), damit sie auch beim Öffnen als Datei klingen.
Die Rohdateien liegen weiter in `~/Downloads/Kolibri and BIRDS/`; die Schnitte entstehen per ffmpeg (Befehle im Chatverlauf 05.11.2026).

## Tierlaute (05.11.2026, von Yilmaz)
- `tukan.mp3` ← `cry-of-a-toucan.mp3` (Pixabay), auf 3,6 s gekürzt, Lautstärke angeglichen
- `bruellaffe.mp3` ← `ElevenLabs_Morgendliches_Konzert_der_Brüllaffen…mp3` (mit ElevenLabs erzeugt), Lautstärke angeglichen
- `frosch.mp3` ← `freesound_community-frog-croak-80816.mp3` (Pixabay/freesound community), Stille am Anfang entfernt;
  im Froschkonzert viermal verschieden hoch abgespielt

## Stein ins Wasser (05.11.2026, von Yilmaz)
- `stein-wasser-1.mp3` ← `tanweraman-stone-in-water-265225.mp3` (Pixabay), Stille am Anfang entfernt, Lautstärke angeglichen
- `stein-wasser-2.mp3` ← `nematoki-water-splash-332078.mp3` (Pixabay), auf 2,4 s gekürzt, Lautstärke angeglichen
- `stein-wasser-3.mp3` ← `nematoki-water-splash-spray-bubbles-332076.mp3` (Pixabay), auf 2,8 s gekürzt, Lautstärke angeglichen
- im Spiel wird beim Steinwurf zufällig eine der drei abgespielt

## Vögel zum Segenslied (05.11.2026, von Yilmaz)
- `papageien.mp3` ← `freesound_community-parrots-in-tree-77185.mp3` (Pixabay/freesound community), Ausschnitt 4–18 s, ein- und ausgeblendet, leise (−26 LUFS)
- (Lori-/Kookaburra-Aufnahme bewusst nicht genutzt: Arten aus Australien, nicht aus Venezuela – Entscheidung Yilmaz)
