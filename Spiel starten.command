#!/bin/bash
# Kakao-Reise lokal starten: kleiner Webserver in diesem Ordner, dann öffnet sich der Browser.
# (Direkt als Datei geöffnet lässt der Browser die WebGL-Zeichenfläche nicht an die Bilder.)
# Beenden: dieses Terminal-Fenster schließen.
cd "$(dirname "$0")"
PORT=8780
while lsof -i :$PORT >/dev/null 2>&1; do PORT=$((PORT+1)); done
echo "Die Kakao-Reise läuft unter http://localhost:$PORT/ – zum Beenden dieses Fenster schließen."
( sleep 1; open "http://localhost:$PORT/" ) &
exec python3 -m http.server $PORT --bind 127.0.0.1
