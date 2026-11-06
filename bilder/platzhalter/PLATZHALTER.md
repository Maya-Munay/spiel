# Platzhalterbilder (Muse), Stand 05.11.2026

Die Bilder hier sind **nur vorläufig**. Sie bleiben, bis Yilmaz mit Ekadashi gesprochen hat und sie ihr Go gibt, dass wir uns
an ihren Stil anlehnen dürfen. Ihr Aquarellstil wird hier bewusst **nicht** nachgeahmt.
Gewählt ist ein eigener, neutraler Malstil: Gouache-Look wie ein modernes Abenteuerspiel-Remake, kräftige Farben, weiche dunkle Umrisse.

- Erzeugt mit Muse (`../../../../muse/`, Modell `meta/muse-image`, je 1 Cent). Gesamt 25 Bilder ≈ 0,25 $,
  davon 5 neu erzeugt, weil sie dem Titelbild zu ähnlich waren, und 1 leer erzeugtes durch einen Skriptfehler.
- Stilvorlage war `titel.png`. Die übrigen Bilder sind mit ihr als Referenz entstanden, Frosch, Morphofalter, Faultier,
  Brüllaffe und Legende ohne Referenz als Nahaufnahme.
- `roh/` enthält die PNG-Originale. Im Spiel liegen verkleinerte JPGs: Titel 1920 px, Legende 1280 px, Wissensbuch 420 px.

| Datei | Wo im Spiel |
|---|---|
| `welt.jpg` | **Die ganze Spielwelt** (2600 × 900), gemalt nach einer Aufnahme der gezeichneten Welt (`?panorama`) in zwei Hälften (`roh/welt-links.png`, `roh/welt-rechts.png`), weich zusammengesetzt. Ohne das Bild oder mit `?svg` erscheint die gezeichnete Landschaft. |
| `titel.jpg` | Hintergrund der Startseite |
| `p1.jpg` … `p5.jpg` | Legende vom Kolibri (blenden weich ineinander); `p5` auch Hintergrund der Schlussseite |
| `guertel`, `schatten`, `blaetter`, `blueten`, `legende`, `gnitzen` | Wissensbuch |
| `frosch`, `tukan`, `faultier`, `ameisen`, `morpho`, `bruellaffe`, `banane` | Wissensbuch + Wissenskarte beim Entdecken |

**Austauschen:** Ein neues Bild mit demselben Namen hier ablegen, mehr ist nicht nötig. Fehlt ein Bild, zeigt das Spiel
von selbst die gezeichnete SVG-Fassung (Legende) bzw. den Eintrag ohne Bild.
Pfad im Code: `spiel.js` → `const bild = id => 'bilder/platzhalter/…'`; Titel/Schluss in `spiel.css` (`#titel`, `#ende`).

**Botanik-Hinweis:** Im Titelbild und auf `p1`/`p4`/`p5` hängen die Kakaofrüchte an den Zweigen.
In Wirklichkeit wachsen sie direkt am Stamm und an dicken Ästen. Das ist bei den endgültigen Bildern zu beachten.

**Weltbild neu malen:** `index.html?panorama` zeigt die ganze Welt ohne Figuren. Aufnahme mit Brave ohne Fenster:
`"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" --headless=new --window-size=2600,900 --screenshot=vorlage.png "http://localhost:8768/?panorama"`.
Muse liefert immer 3:2, deshalb wird die Welt in zwei Hälften gemalt. Die rechte bekommt den gemalten Übergangsstreifen der linken mit.

## Figuren (`figuren/`, Stand 05.11.)
Muse malt jede Figur auf reinem Magenta (#FF00FF). `figuren/freistellen.py` rechnet das Magenta heraus, auch an halbdurchsichtigen
Rändern, und speichert eine WebP-Datei mit Durchsicht. Bewegungsbilder werden mit `--rahmen` auf denselben Ausschnitt gebracht,
damit nichts springt.
- **Kakaobaum:** `baum1` … `baum5` (Keimling, junge Pflanze, Baum, Blüten am Stamm, Früchte am Stamm). 3–5 haben dieselbe Form und blenden ineinander.
- **Kolibri:** `kolibri`, `kolibri-3`, `kolibri-2` (Flügel oben/Mitte/unten), im Wechsel alle 50 ms.
- **Tiere mit Bewegungsbildern:** Morphofalter (3), Frosch + Sprung, Fisch (2), Brüllaffe Ruhe/Brüllen, Tukan Schnabel zu/offen, Faultier (klettert, blinzelt).
- **Weitere:** Pilz, Ameisen, 4 Verstecke (`decke-*`), 3 Sammeldinge (`ding-*`), 3 Krabbeltiere (`krabbel-*`), die beim Stöbern herauslaufen.
- **Weltbild ausgebessert:** Bromelien an den Stämmen und Helikonien-„Fähnchen“ entfernt, die Muse aus der alten Zeichnung übernommen hatte.
Kosten aller Figuren zusammen etwa 0,35 $.
