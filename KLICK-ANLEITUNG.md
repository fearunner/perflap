# Performance Lab 3.0: Klick-Anleitung

## Neu in 3.0

- **Fünf Bereiche:** Heute, Plan, **Daten**, **Leistung**, Profil.
- **Automatisch anpassen:** Krankheit, Reise, verpasste Einheiten und Warnsignale passen den Plan sofort an. Oben unter Heute erscheint die grüne Karte „Automatisch angepasst“ mit **Zurücknehmen**. Tests und Rennen verschiebt die App nie ohne deine Bestätigung. Ausschalten kannst du das unter **Profil**, **Coach**, **Automatisch anpassen**.
- **Daten:** Unter **Daten** importierst du deine Aktivitäten.
  - **Garmin:** connect.garmin.com, **Aktivitäten**, **Alle Aktivitäten**, scrollen, dann **Export CSV**.
  - **Strava:** **Einstellungen**, **Mein Konto**, **Konto herunterladen**, aus der ZIP-Datei die activities.csv wählen.
  - Die App ordnet jede Aktivität der passenden Einheit zu. Was nicht passt, wird freies Training. Doppelte Aktivitäten erkennt sie.
  - Darunter siehst du die Woche je Sportart, die Intensitätsverteilung, deine Bestwerte und alle Aktivitäten mit Ampel (grün = wie geplant).
- **Leistung:** Hier steht die Prognose für Linz als Spanne mit Abstand zum Ziel. Darunter folgen die Checkpoints (10-km-Tests, 38 km, HM Frankfurt, CSS, Bergtest), deine Verbesserungen seit Planstart, die Formkurve und die VO2max.
- **Warum diese Einheit?** In jeder Einheit und in jedem Wochenkopf (Phase) steht, wozu sie dient, wie du sie dosierst und wie gut das belegt ist (A, B, C), jeweils mit Quellen.
- **KI-Coach (optional, standardmäßig aus):** Einschalten unter **Profil**, **Coach**, **KI-Coach**. Danach hast du zwei Wege.
  - **Ohne Kosten:** **Anfrage kopieren**, in Claude einfügen, die Antwort zurück einfügen und **Prüfen** tippen.
  - **Direkt:** mit eigenem Anthropic-API-Schlüssel. Das kostet wenige Cent pro Anfrage.
  - In beiden Fällen prüft die App jeden Vorschlag gegen ihre Regeln, und du bestätigst ihn. Krankheitsart, Hotel, Gewicht und Notizen gehen nie mit.
- **Zurück ins Excel:** Unter **Profil**, **Zurück ins Excel schreiben** erzeugst du eine neue `Trainingsplan_2026-2027.xlsx` mit Status, Ist-Werten, Anpassungen, Check-ins und Tests. Damit ersetzt du die alte Datei im Ordner. Formatierung und Formeln bleiben erhalten. Beim ersten Mal fragt die App einmal nach der Excel-Datei.

## Neu in 2.1

- **Krank mit Kategorie:** Gehe auf **Profil** und dann **Ich bin krank**. Wähle, was ungefähr zutrifft: Erkältung oberhalb des Halses, Fieber oder Infekt, Magen-Darm, Verletzung (mit Körperregion) oder Sonstiges. Danach fragt die App nach Warnzeichen. Bei Fieber oder Warnzeichen zeigt sie einen Hinweis, das ärztlich abklären zu lassen. Mit Erkältung darfst du weiter locker trainieren, bei einer Verletzung pausieren nur die betroffenen Sportarten. Tippst du auf **Wieder gesund**, plant die App den Wiedereinstieg in drei Stufen.
- **Dienstreise mit Ausstattung:** Gehe auf **Profil** und dann **Reise eintragen**. Dort gibst du Anreise, Abreise, Ort und die Ausstattung vor Ort an (Fitnessraum, Laufband, Pool, Laufstrecke). Die App zeigt passende Ersatzeinheiten und schlägt den Umbau vor. An- und Abreisetag bleiben ohne harte Einheit.
- **Ernährung:** Unter **Heute** trägst du einmal dein Körpergewicht ein. Danach zeigt die Zeile „Ernährung“ den Tagesbedarf in g/kg und einen Beispieltag. In jeder Einheit ab 45 Minuten findest du **Verpflegung** mit den Abschnitten davor, währenddessen und danach. Lange Läufe und Rennen bekommen einen Gel- und Trinkplan. Den Plan für Linz erreichst du direkt über **Profil**, **Verpflegungsplan Linz**.
- **Long Run:** Liegt ein langer Lauf mehr als 10 % über deinem längsten Lauf der letzten 30 Tage, siehst du einen Hinweis und einen Vorschlag. Der Plan bleibt, wenn du **Plan lassen** tippst.
- **Quellen:** Jeder Info-Knopf (i) bei Krank, Reise, Ernährung, Verpflegung und Long Run nennt Regeln und Studien.
- **Datenschutz:** Krankheitsdetails, Reiseort und Gewicht bleiben auf dem Gerät und in deiner Sync-Datei. Ins Excel-Protokoll kommen sie nicht.

## Bisher in 2.0

- **Eintragen:** Nach dem Training tippst du auf „Erledigt“. Es öffnet sich ein Blatt mit Dauer, Distanz, Puls und Anstrengung (RPE), schon mit den Soll-Werten gefüllt. Pace, km/h oder /100 m rechnet die App selbst.
- **Freies Training:** Der Plus-Knopf erfasst nicht geplante Einheiten wie Radtour oder Skitag. Sie zählen für Umfang und Form.
- **Plan zoomen:** Unter Plan wechselst du zwischen Tag, Woche, Monat und Saison. Die Saison zeigt alle 45 Wochen mit Soll, Ist, Phasen, Tests und Rennen.
- **Fortschritt:** Formkurve (Fitness, Ermüdung, Form) mit Plan-Projektion bis zum Rennen, VO2max (Garmin und VDOT aus Tests) mit Zielband für Linz, dazu alle Tests und Verläufe.
- **Design:** Hell- und Dunkelmodus folgen dem System. Einheiten lassen sich nach rechts wischen, das trägt sie als „wie geplant“ ein. Auf dem Mac gibt es eine Seitenleiste und einen Detailbereich.

## Update auf GitHub (du hast Version 1 schon online)

1. Öffne github.com und dein Repository `perflab`.
2. Klicke auf **Add file** und dann **Upload files**.
3. Öffne im Finder `Laufen & Triathlon/App`, markiere alle Dateien mit cmd+A und ziehe sie ins Browserfenster. Vorhandene Dateien werden überschrieben.
4. Klicke auf **Commit changes**.
5. Öffne die App auf Mac und iPhone, wenn du Internet hast. Oben erscheint dann „Update verfügbar“. Tippe auf **Neu laden**.

Deine Einträge bleiben erhalten. Auch alte Sicherungsdateien lassen sich weiter laden. Eine alte Krankmeldung ohne Kategorie behandelt die App wie bisher, also mit voller Pause. Unter **Details** kannst du sie nachträglich einordnen.

## Erstmalig online stellen (falls noch nicht geschehen)

1. Lege auf github.com mit **Sign up** ein privates Konto an, nicht das PPI-Konto.
2. Klicke auf **+**, dann **New repository**. Als Name gibst du `perflab` ein, wählst **Public** und klickst **Create repository**. Öffentlich ist nur der Programmcode, nicht deine Daten.
3. Klicke auf **uploading an existing file**, ziehe den Inhalt des Ordners `App` hinein und klicke **Commit changes**.
4. Unter **Settings** und **Pages** wählst du **Deploy from a branch**, dann `main` und `/ (root)`, dann **Save**.
5. Nach 1 bis 2 Minuten steht oben deine Adresse, zum Beispiel `https://DEINNAME.github.io/perflab/`.

## Auf dem Mac installieren

1. Öffne die Adresse in **Chrome** oder Edge und tippe **Trainingsplan laden**.
2. Installiere die App: in Chrome über das Menü **⋮**, dann **Speichern und teilen**, dann **Seite als App installieren**.
3. Gehe auf **Profil**, dann **Sync-Datei anlegen**, und speichere die Datei in iCloud Drive.
   - Sperrt Chrome iCloud Drive, nimm den Ordner **Dokumente** mit iCloud-Abgleich.

## Auf dem iPhone installieren

1. Öffne die Adresse in **Safari**, tippe auf **Teilen** und dann **Zum Home-Bildschirm**.
2. Öffne die App und tippe **Sync-Datei oder Sicherung laden**. Wähle die Datei aus iCloud Drive.
3. Ab dann gleichst du von Hand ab:
   - **Vor dem Eintragen:** Profil, dann **Stand laden**.
   - **Nach dem Eintragen:** Profil, dann **Stand sichern**, dann **In Dateien sichern**, dann die bestehende Datei **ersetzen**.

## Täglich

1. Unter **Heute** zeigt die Startnummer oben, was als Nächstes ansteht: Uhrzeit, Ziel-Pace und Pulszone.
2. Nach dem Training tippst du auf **Erledigt**. Willst du nichts ändern, tippst du direkt auf **Speichern**.
3. Offene Einheiten der Vortage stehen in einer roten Zeile. **Alle erledigt** trägt sie wie geplant ein. Unter **Ansehen** wischst du einzelne nach rechts.
4. Verpasst? Tippe auf die Einheit, dann **Verpasst**, dann den Grund. Der Vorschlag erscheint direkt darunter. Du wählst **Übernehmen** oder **Plan lassen**.

## Sonntags

Unter **Heute** erscheint der **Check-in**. Darin trägst du Ruhepuls, Schmerz, Gefühl und deinen Garmin-VO2max ein. Daraus ergibt sich die Ampel, und bei Gelb oder Rot entlastet die App den Plan.

## Fürs Review mit Claude

Gehe auf **Profil** und dann **Excel-Protokoll**. Die Datei enthält alle Einträge mit Puls und RPE, außerdem Tests, VO2max, die Formkurve je Woche und die Anpassungen. Lade sie hoch und schreib „Review Wx“.

Die App gibt Empfehlungen nach festen Regeln (Profil, dann „Wie die App anpasst“). Formkurve und VDOT sind Schätzungen. Die Ernährungswerte dienen der Orientierung und sind keine Ernährungsberatung. Die App ersetzt keine ärztliche Abklärung.
