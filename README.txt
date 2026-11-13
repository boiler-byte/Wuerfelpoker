Покер на костях – Russisches Würfelpoker (PWA)

INSTALLATION / START
1. ZIP-Datei entpacken und alle Dateien zusammen auf einen HTTPS-Webserver laden.
2. Die URL zu index.html im Browser öffnen.
3. Unterstützte Browser bieten „Als App installieren“ an (auf iOS: Safari > Teilen > Zum Home-Bildschirm).
4. Nach dem ersten erfolgreichen Online-Aufruf funktioniert das Spiel auch offline.

LOKAL TESTEN
In diesem Verzeichnis im Terminal ausführen:
    python3 -m http.server 8000
Dann http://localhost:8000/ öffnen. Localhost unterstützt PWA-Funktionen.
Eine beliebige file://-Adresse genügt NICHT für PWA-Installation und Service Worker.
Das Spiel selbst lässt sich weiterhin auch per Doppelklick auf index.html spielen.

DATEIEN
- index.html / style.css: Benutzeroberfläche
- game.js: Spiellogik und Computergegner (unverändert)
- sound.js: Soundeffekte (unverändert)
- regeln.html: Spielregeln
- manifest.webmanifest: App-Name, Start-URL, Icons und Darstellung
- pwa.js: Installationsdialog und Service-Worker-Registrierung
- service-worker.js: Offline-Zwischenspeicherung sämtlicher Spieldateien
- icons/: App-Symbole für Android, Desktop, iOS und maskierbare Icons

HINWEISE
PWA-Installation ist von Browser/Plattform abhängig. Die Installationsschaltfläche
erscheint, wenn der Browser ein Installationsereignis anbietet oder auf iOS.
Der Service Worker speichert Dateien im Browser, nicht Partien bzw. Spielstände.
Neue Versionen: CACHE_VERSION in service-worker.js ändern, wenn die Spieldateien
aktualisiert werden. Keine externen Bibliotheken oder Netzwerkaufrufe nötig.
