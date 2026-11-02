# Gehhilfe 4.3: Klick-Anleitung

## Neu in 4.3: Garmin automatisch

Ein Tipp auf **Aktualisieren** (Kreispfeil oben rechts in Übersicht und Fortschritt) holt deine Garmin-Daten über die offizielle Garmin Connect Personal API:

- **Trainings:** Ein Lauf, eine Radfahrt oder ein Schwimmen am selben Tag wie eine geplante Einheit derselben Sportart gilt als erledigt, mit Distanz, Dauer, Puls und Höhenmetern. Was du schon von Hand eingetragen hast, bleibt stehen, Garmin ergänzt nur fehlende Werte wie den Puls.
- **Alles andere,** zum Beispiel Padel, wird ein freies Training. Es zählt mit Dauer und Puls für Belastung, Formkurve und die Anpassungen.
- **Gesundheit:** Schlaf, Schlaf-Score und Ruhepuls füllen den Morgen-Check. HRV, Stress, Body Battery und Schritte stehen unter **Körper**. Liegt die HRV deutlich unter deinem 7-Tage-Schnitt, wird der Morgen-Check gelb und harte Einheiten werden entschärft.
- **Rückgängig:** Die Meldung nach dem Abruf hat **Rückgängig**. Damit wird der ganze Abruf zurückgenommen, und diese Aktivitäten kommen auch beim nächsten Mal nicht wieder.
- **Erster Abruf:** Er holt alles ab dem Planstart (12.10.), danach jeweils nur die letzten Tage. Mehrfaches Tippen legt nichts doppelt an.
- **Andere Geräte:** Sie bekommen die Garmin-Daten über den Geräteabgleich, dort musst du nicht noch einmal aktualisieren.
- **VO2max:** Garmin liefert den VO2max über diese Schnittstelle nicht mit. Den trägst du weiter im Check-in ein.

### Einmalig einrichten (nach dem Supabase-Konto, ca. 10 Minuten)

1. **Garmin-Schlüssel erzeugen:** Am Mac connect.garmin.com öffnen, **Einstellungen**, ganz unten **Personal API Key**, **Create Key**. Bedingungen bestätigen und als Laufzeit **1 Jahr** wählen. Den Schlüssel sofort kopieren, Garmin zeigt ihn nur einmal. Bitte nicht in den Chat schicken.
2. **Supabase, SQL:** Im **SQL Editor** die Datei `App-Entwicklung/supabase_setup.sql` noch einmal komplett ausführen. Sie enthält jetzt auch die Ablage für das Garmin-Zugangstoken.
3. **Supabase, Funktion:** Links **Edge Functions**, **Deploy a new function**, **Via Editor**. Als Name genau `garmin` eintragen. Den Inhalt von `App-Entwicklung/supabase/garmin/index.ts` hineinkopieren und **Deploy function** klicken. „Verify JWT“ bleibt eingeschaltet.
4. **Supabase, Secrets:** **Edge Functions**, **Secrets** (bzw. **Manage secrets**). Zwei Einträge anlegen: `GARMIN_API_KEY` mit deinem Garmin-Schlüssel und `ALLOWED_EMAIL` mit deiner Login-Adresse. Speichern.
5. In der App **Aktualisieren** tippen. Der erste Abruf dauert ein paar Sekunden.

**Schlüssel abgelaufen?** Die App meldet dann „Garmin-Schlüssel abgelehnt“. Erzeuge in Garmin Connect einen neuen Schlüssel und ersetze in Supabase den Wert von `GARMIN_API_KEY`. Mehr ist nicht zu tun.

## Gehhilfe 4.2

### Geräte abgleichen

iPhone, Mac und Laptop arbeiten mit denselben Daten. Jede Änderung geht sofort in deine eigene Datenbank bei Supabase (Server in Frankfurt). Die anderen Geräte holen sie beim Öffnen und alle 30 Sekunden. Offline trägst du weiter ein, abgeglichen wird, sobald wieder Netz da ist. Bei gleichzeitigen Änderungen am selben Eintrag gewinnt der neuere. Der angepasste Plan ist auf allen Geräten gleich, weil jedes Gerät ihn aus denselben Einträgen berechnet.

### Einmalig einrichten (ca. 10 Minuten, am Mac)

Supabase ändert seine Oberfläche gelegentlich. Wenn ein Menüpunkt anders heißt, such nach dem fett gedruckten Begriff.

1. **supabase.com** öffnen, **Start your project**, mit deinem GitHub-Konto (fearunner) oder deiner privaten E-Mail anmelden.
2. **New project**: Name `gehhilfe`. Das **Database Password** generieren lassen und im Passwort-Manager speichern, du brauchst es im Alltag nicht. **Region: Central EU (Frankfurt)**, Plan **Free**. Dann **Create new project** und 1 bis 2 Minuten warten.
3. Links **SQL Editor**, **New query**. Den Inhalt der Datei `App-Entwicklung/supabase_setup.sql` hineinkopieren und **Run** klicken. Es muss „Success“ erscheinen.
4. Links **Authentication**, dann **Sign In / Providers**, dort **Email** öffnen. Den Schalter **Confirm email** ausschalten und **Save** klicken. (Eigene Mail-Vorlagen gehen im Gratis-Paket nur mit eigenem Mailserver, deshalb meldet sich die App mit E-Mail und Passwort an.)
5. Links **Project Settings**, dann **API** (oder **API Keys** und **Data API**). Kopiere die **Project URL** und den Schlüssel **anon public** (heißt teils **publishable**). Schick mir beides hier im Chat, ich trage es in `cloud-config.js` ein. Diese beiden Werte sind für den Browser gedacht und dürfen öffentlich sein. Den Schlüssel **service_role** bzw. **secret** schickst du nie, auch nicht mir.
6. Danach die App wie gewohnt auf GitHub hochladen.

### Auf jedem Gerät anmelden

1. Am Gerät mit deinen aktuellen Daten zuerst: **Profil**, **Sync und Export**, **Geräte abgleichen**. Private E-Mail und ein neues Passwort (mindestens 8 Zeichen) eingeben, **Konto anlegen**. Jetzt lädt die App deinen kompletten Stand hoch.
2. Auf dem iPhone und dem Laptop: Beim Öffnen erscheint **Anmelden und Daten holen**. Dieselbe E-Mail und dasselbe Passwort eingeben, **Anmelden**. Der Stand kommt automatisch.
3. Wenn alle Geräte angemeldet sind: In Supabase unter **Authentication**, **Sign In / Providers** die Option **Allow new users to sign up** ausschalten. Dann kann sich niemand sonst ein Konto in deiner Datenbank anlegen.

### Gut zu wissen

- **Kostenloses Paket:** Supabase pausiert kostenlose Projekte nach etwa einer Woche ohne jede Nutzung. Benutzt du die App regelmäßig, passiert das nicht. Falls doch: im Supabase-Dashboard **Restore** klicken, die Daten bleiben erhalten.
- **Passwort vergessen:** In Supabase unter **Authentication**, **Users** dein Konto öffnen und ein neues Passwort setzen. Deine Daten bleiben erhalten.
- **Abmelden** löscht die Daten auf dem jeweiligen Gerät, in der Cloud bleibt alles. Sinnvoll zum Beispiel am Arbeitslaptop.
- **Datenschutz:** Deine Gesundheitsdaten (Schmerz, Krankheit, Gewicht) liegen dann bei Supabase in Frankfurt, geschützt durch dein Konto. Ob du das möchtest, entscheidest du. Ob die private Nutzung am Firmenlaptop erlaubt ist, regelt die PPI.
- Die Sync-Datei in iCloud brauchst du nicht mehr. **Sicherung speichern** bleibt als Notfallkopie.

## Gehhilfe 4.1


- **Dein Logo:** Opa mit Rollator und den drei Disziplinen, als App-Icon und in der App: in jeder Kopfzeile, in der Seitenleiste, im Coach-Satz, im Profil und beim Start.
- **Sportarten auf der Übersicht:** Je eine Karte für Laufen, Radfahren und Schwimmen. Sie zeigt, wie viel vom Soll du diese Woche und seit Planstart geschafft hast, und darunter die Leistung als Strecke von Start über heute bis zum Ziel. Laufen zeigt die Marathon-Prognose gegen 3:09. Radfahren zeigt dein Ø-Tempo der letzten 4 Wochen gegen das nötige Renntempo im Allgäu. Schwimmen zeigt deine Pace pro 100 m und ab dem ersten CSS-Test den CSS gegen 1:50. Ein Tipp auf eine Karte öffnet die Details.
- **Schmerz 1 bis 5:** 1 heißt schmerzfrei und ist immer voreingestellt. Ändern musst du es aktiv, per Tipp oder im Text („Knie zieht, Schmerz 3/5“). Ab 3 macht die App den nächsten Tag locker, ab 4 empfiehlt sie, das ärztlich abklären zu lassen. Das gilt auch im Wochen-Check-in.
- **Weniger Tabs:** Daten und Leistung heißen jetzt zusammen **Fortschritt**, es gibt nur noch 4 Tabs. Im Profil sind Sync und Export eine Gruppe. Die Anpassungen findest du jetzt auf der Übersicht.
- **Aufgeräumt:** Die Kacheln „Diese Woche“ und „Fortschritt“ auf der Übersicht sind weg, die Sportarten-Karten ersetzen sie. Den Wochen-Check-in findest du unter **Körper**.
- **Text überlappt nicht mehr:** Gruppentitel und Kurzinfo lagen in schmalen Spalten übereinander. Ein automatischer Prüflauf über alle Seiten bei 320, 390 und 1280 px findet jetzt keine Überlappung mehr.
- **Nur Distanz eingetragen?** Dann schätzt die App die Dauer mit deinem lockeren Tempo und markiert sie mit ≈.

Beim Hochladen neu: `logo.png`. Die Dateien `gehhilfe.svg`, `gehhilfe-mark.svg` und `triger.svg` kannst du auf GitHub löschen.

## Gehhilfe 4.0

Gehhilfe ist der neue Name von Triger. Deine Daten bleiben erhalten. Das Icon zeigt jetzt einen Opa mit Rollator.

## Hochladen (einmal)

1. github.com öffnen, als **fearunner** anmelden, Repo **perflap** öffnen.
2. **Add file**, dann **Upload files**.
3. Im Finder `Claude/Privat & Test/Laufen & Triathlon/App` öffnen, alle Dateien markieren (Cmd + A) und ins Upload-Feld ziehen. Neu sind `gehhilfe.svg` und `gehhilfe-mark.svg`, geändert sind alle `.js`, `style.css`, `index.html`, `manifest.webmanifest`, `sw.js` und die drei Icons.
4. Unten **Commit changes** klicken, 1 bis 2 Minuten warten.
5. Die alte Datei `triger.svg` kannst du auf GitHub löschen. Sie stört aber nicht.
6. Mac: Seite in Edge einmal mit Cmd + Shift + R neu laden. iPhone: altes Icon löschen, Seite in Safari öffnen, **Teilen**, **Zum Home-Bildschirm**. Erst dann siehst du dort Opa und Namen.

## Neu in 4.0

- **Nur noch die App:** Es gibt keine Trainingsplan-Excel mehr, die du laden, verbinden oder ersetzen musst. Plan, Anpassungen und Einträge leben in der App und werden über die Sync-Datei zwischen Mac und iPhone abgeglichen.
- **Export statt Zurückschreiben:** Unter **Profil**, **Export und Sicherung** erzeugt **Export (Excel)** die Datei `Gehhilfe-Export.xlsx`. Sie enthält die Blätter Plan (mit ID je Einheit), Wochen, Tests, Tagebuch, VO2max und Anpassungen. Am Mac in Edge oder Chrome kannst du einmal **Automatisch exportieren** wählen und die Datei im Ordner „Laufen & Triathlon“ speichern. Danach aktualisiert die App sie nach jeder Änderung selbst.
- **Sonntags-Review:** Es liest ab jetzt die neueste `Gehhilfe-Export*.xlsx` im Ordner „Laufen & Triathlon“. Ohne aktuellen Export weist dich das Review darauf hin.
- **Wie lief es?** Beim Eintragen steht das Textfeld ganz oben. Schreib einfach, wie du trainiert hast, zum Beispiel: `0,5km WU 5x1km@5:30 + 5x0,5km@7:30, 0,5km CD, gutes Training, keine Schmerzen, danach Sauna`. Die App füllt dann Distanz (8,5 km), Dauer (etwa 52 min), Puls, RPE, Gefühl, Schmerz und Erholung selbst aus und zeigt dir darunter, was sie erkannt hat. Ein Wert, den du selbst änderst, bleibt stehen. Geschätzte Werte sind mit „≈“ markiert.
- **Training hinzufügen (+):** Auch hier reicht der Text. Aus „Rad 62 km in 2:10 h, 650 hm, top“ wählt die App selbst die Sportart Rad und übernimmt die Werte.
- **Design:** Farben aus deinem Referenzbild (Seal Blue, Navy, Crimson Pink), nur hell. Die Karte „Als Nächstes“ trägt die Bahnen-Optik aus dem Bild. Crimson steht nur dort, wo du etwas tun sollst.

## Neues Gerät oder alles gelöscht

Die App startet mit der Sync-Datei aus iCloud Drive. Ganz ohne Sync-Datei lädst du einmal die Startdatei `App-Entwicklung/Gehhilfe-Startplan.json` (enthält den Ausgangsplan). Diese Datei liegt bewusst nicht auf GitHub, weil sie persönliche Daten wie Termine und Hinweise enthält.

## Frühere Versionen (Excel-Hinweise darin gelten ab 4.0 nicht mehr)

### Triger 3.4

Triger ist der neue Name von Performance Lab. Deine Daten bleiben erhalten. Neuen Namen und neues Icon auf dem iPhone bekommst du so: das alte Icon löschen und die Seite in Safari wieder über **Teilen**, **Zum Home-Bildschirm** hinzufügen. Erst neu laden, dann löschen, damit nichts verloren geht. Deine Daten liegen im Browser und bleiben.

## Neu in 3.4

- **Updates kommen von selbst:** Eine neue Version lädt die App beim nächsten Öffnen automatisch. Das Tippen auf „Neu laden“ entfällt. Einmalig musst du die alte Version noch selbst ablösen, siehe unten.
- **Scrollen:** Die große Überschrift wird beim Scrollen zu einer schmalen, unscharfen Kopfleiste, wie in den Apple-Apps.
- **Maus und Trackpad:** Zeilen, Gruppen und Knöpfe reagieren auf Hover und beim Drücken.
- **Detailleiste am Mac:** Oben rechts in der Detailleiste blendet **Ausblenden** sie aus, **Details** holt sie zurück.
- **Excel, in beide Richtungen geprüft:** Verschiebungen werden jetzt auch beim Laden auf einem anderen Gerät wiederhergestellt. Deine eigenen Hinweise in der Spalte Hinweise (Wecker, Bad-Zeiten) bleiben beim Zurückschreiben erhalten.

**Einmalig nach dem Upload:** Am Mac in Edge die Seite einmal mit Cmd + Shift + R neu laden. Auf dem iPhone die App komplett schließen (vom unteren Rand hochwischen und wegschieben) und neu öffnen. Ab dann aktualisiert sie sich selbst.

## Neu in 3.3

- **Triger:** Der Tiger ist dein Coach. Oben in der Übersicht sagt er dir in einem Satz, worum es heute geht. Daneben siehst du deine Bereitschaft. Darunter stehen nur der Morgen-Check, die Verpflegung und der KI-Coach.
- **Weniger auf einmal:** Unter dem nächsten Training liegen einklappbare Gruppen wie in den iPhone-Einstellungen: Nächste 7 Tage, Diese Woche, Ernährung, Körper, Fortschritt, Termine und Nächster Test. Rechts in jeder Zeile steht die Kurzinfo. Ein Tipp klappt die Gruppe auf, die App merkt sich das. Leistung, Daten und Profil funktionieren genauso.
- **Mac:** Das Symbol oben in der linken Seitenleiste klappt sie auf eine schmale Symbolleiste ein. Das Symbol oben rechts in der Detailleiste blendet diese aus. Sobald du eine Einheit öffnest, kommt sie von selbst zurück.
- **iPhone:** Beim Runterscrollen verschwindet die Tab-Leiste. Beim Hochscrollen, am Seitenende oder nach kurzer Pause ist sie wieder da.
- **Plan passt sich selbst an:** Die langen Läufe der nächsten drei Wochen baut Triger ab deinem längsten eingetragenen Lauf neu auf, mit höchstens 10 % mehr pro Woche. Das passiert automatisch, und die Gruppe **Triger hat deinen Plan angepasst** zeigt, was sich geändert hat. Mit **Zurücknehmen** machst du es rückgängig. Läufst du wieder länger, zieht der Plan von selbst an.
- **Excel direkt verbinden (Mac, Edge oder Chrome):** Gehe zu **Profil**, **Export**, **Excel verbinden** und wähle einmal die Datei `Trainingsplan_2026-2027.xlsx` im Ordner „Laufen & Triathlon“. Danach speichert Triger nach jeder Änderung selbst hinein. Du musst nichts mehr herunterladen oder ersetzen. Fragt Edge nach einem Neustart nach Erlaubnis, tippe einmal auf die Zeile. Ist die Datei gerade in Excel geöffnet, schließe sie kurz.
- **Wichtig:** **Protokoll als eigene Datei** ist nur eine Ansicht und ändert den Plan nicht. Für Claude zählt die verbundene Excel.

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
