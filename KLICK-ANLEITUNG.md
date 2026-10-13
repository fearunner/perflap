# Performance Lab 3.2: Klick-Anleitung

## Neu in 3.2

- **Übersicht statt Heute:** Die erste Seite ist dein Dashboard. Ganz oben steht das Coach-Briefing mit Bereitschaft, darunter das nächste Training, auch wenn es erst morgen oder übermorgen ist. Danach kommen Kacheln:
  - Nächste 7 Tage
  - Woche
  - Ernährung heute mit Tagebuch
  - Körper (Morgen-Check, Gewicht)
  - Fortschritt aller Disziplinen
  - Termine und Abwesenheiten
  - Nächster Test
- **Mac:** Einheiten, Tage, Eintragen, Verpflegung und Ernährung öffnen sich rechts in der Seitenleiste statt in einem Fenster. **Zurück** führt eine Ebene zurück. Verschiebst du eine Einheit, folgt die Seitenleiste ihr an den neuen Tag.
- **So trainierst du:** Jede Lauf-, Rad- und Schwimmeinheit ist in Abschnitte zerlegt:
  - **Schwimmen:** Meter, Tempo pro 100 m (nach dem CSS-Test exakt), Pause am Rand und Technikfokus.
  - **Laufen:** Strecke, Pace, Puls und Pause.
  - **Rad:** Dauer, Gefühl, Puls, Trittfrequenz und Pause.
  - Den Originaltext aus dem Plan findest du darunter.
- **Videos:** 40 geprüfte Technikvideos (Schwimmdrills, CSS, Freiwasser, Neo, Lauf-ABC, Steigerungen, Hügelsprints, Trittfrequenz, Bergauffahren, Koppel, Kraft, Fuß, Mobility). Sie laden erst, wenn du auf das Vorschaubild tippst, und spielen dann direkt in der App.
- **Leistung je Disziplin:** Zu Halbmarathon, Marathon, Schwimmen, Radfahren, Olympischer Distanz und Mitteldistanz siehst du jeweils den aktuellen Stand, das Ziel, den Abstand, den Verlauf und was es dafür braucht.
- **Abwesenheiten:** Unter **Profil**, **Alle Abwesenheiten** oder über die Kachel **Termine** trägst du beliebig viele ein: Krank, Dienstreise, Urlaub oder privat unterwegs, auch überlappend. Du kannst sie bearbeiten und löschen. Alte Krankheiten bleiben im Archiv. Sie erscheinen farbig in Monat, Woche, Tag und in den nächsten 7 Tagen und im Kalender-Export als ganztägige Termine.
- **Morgen-Check:** Schlaf, Schlafqualität, Gefühl, Muskelkater, Ruhepuls und Gewicht dauern 10 Sekunden. Bei Gelb wird die harte Einheit von heute locker, bei Rot auch die von morgen.
- **Gewicht:** Die App zeigt den Trend statt Tageswerten. Die Ernährungsziele rechnen mit dem Trend und warnen, wenn du im Aufbau zu schnell abnimmst.
- **Ernährungstagebuch:** Pro Tag schreibst du Frühstück, Mittag, Abend, Snacks und eine Notiz frei mit. Beim Zurückschreiben landet das im neuen Blatt **App-Tagebuch** der Excel.
- **Wochen-Review mit Claude:** Jeden Sonntag um 19 Uhr prüft Claude die zurückgeschriebene Excel. Das Review liegt dann in `App-Entwicklung/Reviews`, mit einer fertigen KI-Antwort zum Einfügen. Vorher in der App **Zurück ins Excel schreiben** und die Datei ersetzen.

## Neu in 3.1

- **Coach-Briefing unter Heute:** Ganz oben steht, worauf es heute ankommt, deine Bereitschaft (Bereit, Frisch, Müde oder Pause) und dein Essen für den Tag. Dazu kommen die Verpflegung zur Einheit, der Countdown und der Knopf **KI-Coach fragen**.
- **KI-Coach direkt sichtbar:** Ein Tipp auf **KI-Coach fragen** erklärt, was er macht und welche Daten er sieht. Mit **Einschalten** geht es los.
- **Einheit als Workout-Karte:**
  - Oben stehen Distanz, Dauer, Zielpace, Puls und Intensität.
  - Darunter folgt „darum geht es“ mit „So läufst du richtig“, die Quellen sind aufklappbar.
  - Der **Ablauf** zeigt Schritte und ein Intensitätsprofil, zum Beispiel Einlaufen, 5 × 1 km mit Zielpace und Trabpause, dann Auslaufen.
- **Übungen mit Anleitung und Video:** Kraft, Mobility, Schwimmdrills und Freiwasser zeigen jede Übung einzeln. Ein Tipp öffnet Ausführung, Hinweise, typische Fehler, den Nutzen für dich und eine leichtere Variante. **Video ansehen** öffnet eine YouTube-Suche zur Übung.
- **Monat:** Ein Tipp auf einen Tag öffnet den Tag mit allen Einheiten zum Antippen, statt in die Woche zu springen.
- **Tag:** Die Karten lassen sich als Ganzes antippen.
- **Mac:** Der Detailbereich rechts zeigt sofort die heutige Einheit.

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
