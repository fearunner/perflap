/* Performance Lab 3.2: Übungsbibliothek und Workout-Parser. Reine Daten und Funktionen ohne DOM.
   Video-Links führen auf eine YouTube-Suche (immer aktuell, kein toter Einzellink). Keine Einbettung: kein Datenabfluss beim Öffnen der App. */
(function (G) {
"use strict";
const yt = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);


/* Geprüfte Technikvideos (YouTube-oEmbed bestätigt am 12.10.2026). Einbettung über youtube-nocookie erst nach Tippen. */
const VIDEOS = {"seitlage":{"id":"1VQVfo0icr0","t":"How to swim a Side-Kick Drill","c":"FORM"},"sechseins":{"id":"ShRT_dQxgEs","t":"6/1/6 Drill","c":"TriDot"},"abschlag":{"id":"SVbjlTRSkxY","t":"Beginner Swim Drill: Catch-Up","c":"MySwimPro"},"fingertip":{"id":"O_muRVVNpaQ","t":"Finger-Tip Drag Drill","c":"TriDot"},"einarmig":{"id":"S0ruyow45WE","t":"Single Arm Drill","c":"Effortless Swimming"},"pullbuoy":{"id":"ITK0chbKegI","t":"How To Swim With A Pull Buoy","c":"Global Triathlon Network"},"dreieratmung":{"id":"IeUUuAyVu9s","t":"How To Breathe On Both Sides","c":"Global Triathlon Network"},"csstest":{"id":"75PaBO4cxEk","t":"The CSS Swim Test Explained","c":"MyProCoach"},"css":{"id":"wooLaOhLg6U","t":"What Is Critical Swim Speed?","c":"Global Triathlon Network"},"sighting":{"id":"w7iIf192S4w","t":"How To Sight Whilst Open Water Swimming","c":"Global Triathlon Network"},"neo":{"id":"KXE7S9ub4jI","t":"How To Put On A Wetsuit","c":"Global Triathlon Network"},"kraul":{"id":"AQy_c30lNjI","t":"How To Swim Freestyle","c":"Global Triathlon Network"},"kniebeuge":{"id":"7v_V6xiA_AA","t":"How to Perform A Back Squat","c":"Squat University"},"rdl":{"id":"_oyxCn2iSjU","t":"How To Do Romanian Deadlifts","c":"Jeff Nippard"},"split":{"id":"hPlKPjohFS0","t":"The Perfect Bulgarian Split Squat","c":"Squat University"},"waden":{"id":"e547vdG9BFA","t":"3 Exercises to Strengthen the Soleus","c":"Rehab Science"},"exzentr":{"id":"fHHbn_Odk4E","t":"Alfredson Achilles Protocol","c":"Physiotutors"},"rudern":{"id":"djKXLt7kv7Q","t":"How To Do Dumbbell Rows","c":"Jeff Nippard"},"plank":{"id":"A2b2EmIg0dA","t":"How To Plank","c":"E3 Rehab"},"sideplank":{"id":"44ND4bOB-T0","t":"How to do a Side Plank","c":"NASM"},"copenhagen":{"id":"YRRnnZsRs9U","t":"Copenhagen Planks","c":"E3 Rehab"},"deadbug":{"id":"GbSC02oU3To","t":"How to Do a Dead Bug","c":"Hinge Health"},"bridge":{"id":"b1zTCyGJXCQ","t":"Single Leg Glute Bridge","c":"Dr. Carl Baird"},"liegestuetz":{"id":"GX87fbBd78A","t":"Perfect Push Ups","c":"E3 Rehab"},"pogo":{"id":"j0nl5dWuqN4","t":"Pogo Jumps Tutorial","c":"Runna"},"boxjump":{"id":"kNIInK_Le8I","t":"Beginner Box Jump","c":"NASM"},"shortfoot":{"id":"mRC_3U2XBP0","t":"Short Foot Exercise","c":"Dr Emily Splichal"},"zehenyoga":{"id":"QVZpBSVV9js","t":"Toe Yoga Exercise","c":"Hinge Health"},"hallux":{"id":"It6vngBeRFg","t":"Big Toe Mobility Exercises","c":"Rehab Science"},"hueftmob":{"id":"t4Zz6-aG8Iw","t":"90 90 Hip Stretch","c":"Jack Hanrahan Fitness"},"wademob":{"id":"YH7xjrkq7ic","t":"Ankle Mobility: Knee to Wall","c":"The Basketball Doctors"},"steigerung":{"id":"1i2ZPpXtuOk","t":"How To Run Strides","c":"The Run Experience"},"huegelsprint":{"id":"t62tRpLCBaA","t":"8 Second Hill Sprints","c":"Run Elite"},"lauftechnik":{"id":"_kGESn8ArrU","t":"How To Run Properly","c":"Global Triathlon Network"},"lauf_abc":{"id":"HvH5WZk0f90","t":"Lauf-ABC Part I","c":"Training & Testing"},"trittfrequenz":{"id":"QLe3mvC_SXs","t":"Improve Your High Cadence Cycling","c":"Global Cycling Network"},"einbeinig_rad":{"id":"VYQNApn-_v4","t":"Single-Leg Drill","c":"TriDot"},"rad_berg":{"id":"4zvP4DQgwQE","t":"Riding Seated Vs Standing Uphill","c":"Global Cycling Network"},"koppel":{"id":"F7WE0SARL4E","t":"Brick Workout 101","c":"Global Triathlon Network"},"wechsel":{"id":"KkUjNZnTaUQ","t":"How To Do A Triathlon Transition","c":"Global Triathlon Network"}};
/* k: Kategorie, how: Ausführung (Schritte), cue: worauf achten, err: typische Fehler, why: Nutzen für dich, alt: leichter/ohne Gerät, q: Videosuche */
const EX = {
  kniebeuge: { n: "Kniebeuge (Back Squat)", k: "Kraft", re: /kniebeuge|squat(?!.*split)/i,
    how: ["Stange auf dem oberen Rücken, Füße schulterbreit, Zehen leicht nach außen.", "Tief einatmen, Bauch fest, Hüfte nach hinten und unten schieben.", "Bis mindestens Oberschenkel parallel, Knie folgen den Zehen.", "Kraftvoll über den ganzen Fuß hochdrücken, oben ausatmen."],
    cue: ["Rücken neutral, Brust offen", "Knie nicht nach innen", "Fersen bleiben am Boden"], err: ["Knie fallen nach innen", "Fersen heben ab", "Rundrücken in der Tiefe"],
    why: "Kräftigt Oberschenkel und Gesäß, verbessert Laufökonomie und Stabilität bergab.", alt: "Goblet Squat mit Kurzhantel oder Kniebeuge ohne Gewicht", q: "back squat technik anleitung" },
  rdl: { n: "Rumänisches Kreuzheben (RDL)", k: "Kraft", re: /rdl|rumänisch|kreuzheben/i,
    how: ["Stange oder Kurzhanteln vor den Oberschenkeln, Knie leicht gebeugt.", "Hüfte nach hinten schieben, Gewicht nah am Bein nach unten führen.", "Bis Dehnung in der hinteren Oberschenkelmuskulatur, Rücken bleibt gerade.", "Hüfte nach vorn bringen, Gesäß oben anspannen."],
    cue: ["Bewegung kommt aus der Hüfte", "Gewicht nah am Körper", "Schultern hinten"], err: ["Rundrücken", "Zu viel Kniebeugung (wird zur Kniebeuge)", "Überstrecken oben"],
    why: "Stärkt die hintere Kette (Gesäß, Beinbeuger), schützt vor Zerrungen und gibt Vortrieb.", alt: "Einbeinig mit Kurzhantel oder Hip Hinge mit Besenstiel", q: "rumänisches kreuzheben rdl technik" },
  split: { n: "Bulgarian Split Squat", k: "Kraft", re: /split squat|bulgarian/i,
    how: ["Hinterer Fuß auf einer Bank, vorderer Fuß gut einen Schritt davor.", "Oberkörper leicht nach vorn, senkrecht nach unten absenken.", "Hinteres Knie fast am Boden, vorderes Knie über dem Fuß.", "Über die vordere Ferse hochdrücken."],
    cue: ["Hüfte gerade halten", "Vorderes Knie stabil", "Kontrolliert ab, zügig hoch"], err: ["Knie kippt nach innen", "Schritt zu kurz", "Abstoßen mit dem hinteren Bein"],
    why: "Einbeinige Kraft und Stabilität, genau wie beim Laufen. Deckt Seitenunterschiede auf.", alt: "Ausfallschritt am Ort ohne Bank", q: "bulgarian split squat technik" },
  waden: { n: "Wadenheben (schwer, auch einbeinig)", k: "Kraft", re: /wadenheben(?!.*exzentr)/i,
    how: ["Fußballen auf einer Stufe, Ferse frei.", "Langsam ganz nach unten (Dehnung), dann so hoch wie möglich.", "Oben kurz halten, 2–3 Sekunden absenken.", "Auch mit gebeugtem Knie für den Soleus."],
    cue: ["Volle Bewegungsamplitude", "Druck über den Großzeh", "Langsam ablassen"], err: ["Wippen ohne Kontrolle", "Nur halbe Bewegung", "Gewicht über die Außenkante"],
    why: "Wade und Achillessehne tragen beim Laufen ein Vielfaches des Körpergewichts. Wichtig für den Hallux und gegen Achillesbeschwerden.", alt: "Einbeinig ohne Gewicht an der Treppe", q: "wadenheben einbeinig stufe technik soleus" },
  exzentr: { n: "Exzentrisches Wadenheben einbeinig", k: "Prävention", re: /exzentr/i,
    how: ["Mit beiden Beinen auf die Zehenspitzen hoch.", "Ein Bein anheben, mit dem anderen 3–4 Sekunden langsam unter Stufenniveau absenken.", "Mit beiden Beinen wieder hoch.", "Je Seite 3x10–15."],
    cue: ["Langsam absenken", "Knie gestreckt, dann gebeugt"], err: ["Zu schnell", "Schmerz über 3/10"], why: "Bewährtes Programm für die Achillessehne (Alfredson-Protokoll).", alt: "Am Boden ohne Stufe", q: "exzentrisches wadenheben alfredson" },
  rudern: { n: "Rudern (Kurzhantel oder Kabel)", k: "Kraft", re: /rudern/i,
    how: ["Oberkörper nach vorn geneigt, Rücken gerade.", "Gewicht Richtung Hüfte ziehen, Ellbogen nah am Körper.", "Schulterblätter zusammen, kurz halten.", "Kontrolliert ablassen."], cue: ["Schultern weg von den Ohren", "Rumpf stabil"], err: ["Schwung aus dem Rücken", "Schultern hochziehen"],
    why: "Aufrechte Haltung auf langen Läufen und kräftiger Armzug beim Schwimmen.", alt: "Rudern mit Theraband", q: "kurzhantel rudern technik" },
  plank: { n: "Plank (Unterarmstütz)", k: "Rumpf", re: /(?<!side |copenhagen )plank|unterarmstütz/i,
    how: ["Unterarme unter den Schultern, Körper gerade Linie.", "Gesäß und Bauch anspannen, Becken leicht einrollen.", "Ruhig atmen, 30–60 Sekunden."], cue: ["Kein Hohlkreuz", "Blick zum Boden"], err: ["Hüfte hängt", "Gesäß zu hoch"], why: "Rumpfstabilität hält die Laufform, wenn du müde wirst.", alt: "Auf den Knien", q: "plank richtig ausführen" },
  sideplank: { n: "Side Plank (Seitstütz)", k: "Rumpf", re: /side plank|seitstütz/i,
    how: ["Seitlich auf dem Unterarm, Ellbogen unter der Schulter.", "Hüfte hoch, Körper gerade Linie.", "30–45 Sekunden je Seite."], cue: ["Hüfte nicht nach hinten", "Oberer Arm in die Hüfte"], err: ["Hüfte sinkt ab"], why: "Seitliche Hüft- und Rumpfmuskeln stabilisieren das Becken beim Laufen.", alt: "Mit gebeugten Knien", q: "side plank technik" },
  copenhagen: { n: "Copenhagen Plank", k: "Prävention", re: /copenhagen/i,
    how: ["Seitstütz, oberes Bein auf einer Bank (Knie oder Fuß).", "Unteres Bein frei, Hüfte hochdrücken.", "10–30 Sekunden je Seite."], cue: ["Körper gerade", "Kraft aus der Innenseite des Oberschenkels"], err: ["Zu schnell zu lang"], why: "Kräftigt die Adduktoren und senkt das Risiko für Leistenprobleme (Studienlage gut im Fußball).", alt: "Kurzer Hebel: Knie auf der Bank", q: "copenhagen plank anleitung" },
  deadbug: { n: "Dead Bug", k: "Rumpf", re: /dead bug/i,
    how: ["Rückenlage, Arme zur Decke, Knie 90° über der Hüfte.", "Gegenarm und Gegenbein langsam strecken, Lendenwirbel bleibt am Boden.", "Zurück, Seite wechseln, 2x10 je Seite."], cue: ["Unterer Rücken am Boden", "Ausatmen beim Strecken"], err: ["Hohlkreuz"], why: "Koordination von Rumpf und Gliedmaßen wie beim Laufschritt.", alt: "Nur Beine bewegen", q: "dead bug übung" },
  bridge: { n: "Einbeinige Brücke", k: "Kraft", re: /brücke|glute bridge|hip thrust/i,
    how: ["Rückenlage, ein Fuß aufgestellt, anderes Bein gestreckt.", "Über die Ferse Hüfte heben, bis Knie, Hüfte und Schulter eine Linie bilden.", "Oben halten, langsam ab, 3x10–12 je Seite."], cue: ["Becken bleibt waagerecht", "Gesäß anspannen"], err: ["Hohlkreuz statt Gesäß"], why: "Aktiviert das Gesäß, das bei vielen Läufern zu wenig arbeitet.", alt: "Beidbeinig", q: "einbeinige glute bridge" },
  liegestuetz: { n: "Liegestütz", k: "Kraft", re: /liegestütz|push.?up/i,
    how: ["Hände etwas breiter als schulterbreit, Körper gerade.", "Brust bis kurz über den Boden, Ellbogen etwa 45° zum Körper.", "Hochdrücken, Rumpf fest."], cue: ["Körperspannung"], err: ["Hüfte hängt"], why: "Oberkörper und Rumpf, gut als Hotel-Übung.", alt: "An der Wand oder auf den Knien", q: "liegestütz richtig" },
  pogo: { n: "Pogo Jumps", k: "Plyometrie", re: /pogo/i,
    how: ["Aufrecht, Knie fast gestreckt.", "Schnelle, kleine Sprünge nur aus den Sprunggelenken.", "Bodenkontakt so kurz wie möglich, 3x15."], cue: ["Leise landen", "Auf dem Vorfuß bleiben"], err: ["In die Knie gehen", "Zu hoch springen"], why: "Trainiert die Federwirkung der Sehnen, das verbessert die Laufökonomie. Erst nach Freigabe des Hallux.", alt: "Seilspringen locker", q: "pogo jumps läufer" },
  boxjump: { n: "Box Jumps", k: "Plyometrie", re: /box jump/i,
    how: ["Vor einer stabilen Box, Arme zurück.", "Explosiv hochspringen, weich in der Hocke landen.", "Heruntersteigen, nicht springen, 3x5."], cue: ["Leise Landung", "Volle Hüftstreckung"], err: ["Zu hohe Box", "Herunterspringen"], why: "Explosivkraft für kraftvollen Abdruck, auch am Berg.", alt: "Strecksprung am Boden", q: "box jumps technik" },
  shortfoot: { n: "Short Foot", k: "Fuß", re: /short foot/i,
    how: ["Sitzend oder stehend, Fuß flach.", "Fußgewölbe anheben, indem du die Ballen Richtung Ferse ziehst, ohne Zehen zu krallen.", "5 Sekunden halten, 10 Wiederholungen."], cue: ["Zehen bleiben lang"], err: ["Zehen krallen"], why: "Stärkt die kleinen Fußmuskeln, wichtig für den Hallux und die Stabilität.", alt: "Im Sitzen", q: "short foot übung fußgewölbe" },
  zehenyoga: { n: "Zehen-Yoga", k: "Fuß", re: /zehen-yoga|toe yoga/i,
    how: ["Großzeh heben, kleine Zehen am Boden lassen.", "Dann umgekehrt: kleine Zehen heben, Großzeh unten.", "Je 10 Wiederholungen."], cue: ["Langsam und isoliert"], err: ["Ganzer Fuß hebt mit"], why: "Kontrolle über den Großzeh, direkt relevant für den Hallux.", alt: "Mit Hilfe der Hand", q: "toe yoga übung großzeh" },
  hallux: { n: "Hallux-Mobility", k: "Mobility", re: /hallux|großzeh/i,
    how: ["Großzeh vorsichtig nach oben und unten mobilisieren.", "Im Kniestand Zehen aufstellen und sanft nach hinten setzen.", "Nur bis zur Spannung, nicht in den Schmerz."], cue: ["Schmerz höchstens 2/10"], err: ["Zu viel Druck"], why: "Beweglichkeit im Großzehengrundgelenk für den Abdruck. Ersetzt keine ärztliche Abklärung.", alt: "Mit der Hand im Sitzen", q: "großzeh mobilisation hallux rigidus übungen" },
  hueftmob: { n: "Hüft-Mobility", k: "Mobility", re: /hüfte/i,
    how: ["Kniender Hüftbeuger-Stretch: hinteres Knie am Boden, Becken nach vorn schieben, 30–45 s.", "90-90-Sitz: Hüfte rotieren, je Seite 5 Wechsel.", "Hüftkreisen im Vierfüßlerstand, je Richtung 8."], cue: ["Becken aufrecht"], err: ["Hohlkreuz beim Stretch"], why: "Freie Hüftstreckung verlängert den Schritt und entlastet den unteren Rücken.", alt: "Im Stehen", q: "hüftbeuger mobility läufer 90 90" },
  wademob: { n: "Wade/Soleus-Mobility", k: "Mobility", re: /wade\/soleus|soleus/i,
    how: ["An der Wand: hinteres Bein gestreckt, Ferse am Boden, 30 s.", "Dann Knie beugen (Soleus), 30 s.", "Knie-zur-Wand-Test: Fuß so weit weg, dass das Knie gerade noch die Wand berührt."], cue: ["Ferse bleibt unten"], err: ["Fuß dreht aus"], why: "Beweglichkeit im Sprunggelenk für einen sauberen Abdruck.", alt: "Auf der Treppenstufe", q: "soleus dehnen knie zur wand" },
  /* Schwimmen */
  seitlage: { n: "Seitlage-Beinschlag", k: "Schwimmen", re: /seitlage/i,
    how: ["Auf der Seite liegen, unterer Arm nach vorn gestreckt, oberer am Körper.", "Gesicht nach unten, zum Atmen Kopf drehen.", "Gleichmäßiger, kleiner Beinschlag aus der Hüfte."], cue: ["Kopf auf dem Arm ablegen", "Hüfte an der Oberfläche"], err: ["Kopf heben", "Kniebeinschlag"], why: "Grundlage für Wasserlage und Rotation im Kraul.", alt: "Mit Flossen, falls vorhanden", q: "kraul drill seitlage beinschlag side kick" },
  sechseins: { n: "6-1-6-Drill", k: "Schwimmen", re: /6-1-6/i,
    how: ["6 Beinschläge in Seitlage.", "1 Armzug, dabei auf die andere Seite rotieren.", "6 Beinschläge in Seitlage auf der neuen Seite."], cue: ["Rotation aus der Hüfte", "Ruhig atmen"], err: ["Rotation nur mit den Schultern"], why: "Lehrt die Rotation, die den Armzug lang und kraftvoll macht.", alt: "3-1-3 bei Ermüdung", q: "6 1 6 drill freestyle swimming" },
  abschlag: { n: "Abschlagschwimmen", k: "Schwimmen", re: /abschlag|catch.?up/i,
    how: ["Ein Arm bleibt vorne gestreckt.", "Der andere zieht durch und schlägt vorne an der Hand ab.", "Erst dann startet der vordere Arm."], cue: ["Langes Gleiten", "Vorn lang machen"], err: ["Arm sinkt vorn ab"], why: "Verlängert den Zug und verbessert das Timing.", alt: "Mit Pullbuoy", q: "abschlagschwimmen catch up drill kraul" },
  fingertip: { n: "Fingertip Drag", k: "Schwimmen", re: /fingertip/i,
    how: ["Beim Rückführen des Arms Fingerspitzen durch das Wasser ziehen.", "Ellbogen hoch, Hand nah am Körper.", "Eintauchen vor der Schulter."], cue: ["Hoher Ellbogen"], err: ["Gestreckter Arm über Wasser"], why: "Lockere, effiziente Überwasserphase, schont die Schulter.", alt: "Langsam", q: "fingertip drag drill freestyle" },
  einarmig: { n: "Einarmig Kraul", k: "Schwimmen", re: /einarmig/i,
    how: ["Ein Arm vorne oder am Körper, der andere zieht.", "Atmung zur Seite des ruhenden Arms oder zur Zugseite.", "Nach 25 m wechseln."], cue: ["Rotation trotzdem mitnehmen"], err: ["Körper knickt seitlich"], why: "Isoliert den Armzug, deckt Schwächen einer Seite auf.", alt: "Mit Pullbuoy", q: "one arm freestyle drill" },
  pullbuoy: { n: "Kraul mit Pullbuoy", k: "Schwimmen", re: /pullbuoy/i,
    how: ["Pullbuoy zwischen die Oberschenkel klemmen.", "Nur Armzug, Beine ruhig.", "Hüfte bleibt oben, so spürst du die richtige Wasserlage."], cue: ["Lange Züge", "Ruhige Atmung"], err: ["Zu viel damit (max. ca. 25 % der Strecke)"], why: "Wasserlage spüren und Armzug trainieren, ohne dass die Beine absinken.", alt: "", q: "pull buoy freestyle technik" },
  dreieratmung: { n: "3er-Atmung", k: "Schwimmen", re: /3er-atmung|dreier/i,
    how: ["Alle drei Züge atmen, abwechselnd links und rechts.", "Unter Wasser ruhig durch Mund und Nase ausatmen.", "Kopf nur so weit drehen, dass ein Auge unter Wasser bleibt."], cue: ["Ausatmen nicht vergessen"], err: ["Kopf heben"], why: "Gleichmäßiger Zug, und im Freiwasser kannst du zu beiden Seiten atmen.", alt: "2er-Atmung bei Luftnot", q: "kraul atmung 3er atmung lernen" },
  csstest: { n: "CSS-Test", k: "Schwimmen", re: /css-test/i,
    how: ["Gründlich einschwimmen (400 m locker mit ein paar Steigerungen).", "400 m so schnell wie gleichmäßig möglich, Zeit stoppen.", "10 Minuten locker erholen.", "200 m Vollgas, Zeit stoppen. CSS = (Zeit 400 − Zeit 200) / 2."], cue: ["Gleichmäßig, nicht zu schnell starten", "Immer im 25-m-Becken"], err: ["Erste 100 m zu schnell", "Zu kurze Pause"], why: "Liefert dein Schwellentempo im Wasser, daraus berechnet die App die Schwimmzonen.", alt: "", q: "css test schwimmen anleitung critical swim speed" },
  css: { n: "CSS-Intervalle", k: "Schwimmen", re: /@ css|css\+/i,
    how: ["Wiederholungen im CSS-Tempo (dein Schwellentempo im Wasser).", "Kurze Pausen von 10–20 Sekunden.", "Gleichmäßig, alle Wiederholungen in derselben Zeit."], cue: ["Uhr am Beckenrand"], err: ["Erste zu schnell"], why: "Hebt die Schwelle im Wasser, Basis für 38–40 Minuten in Allgäu.", alt: "", q: "css swim training erklärt" },
  sighting: { n: "Orientieren (Sighting)", k: "Freiwasser", re: /orientierung|sighting/i,
    how: ["Alle 6–8 Züge kurz nach vorn schauen: Augen knapp über die Wasserlinie (Krokodilaugen).", "Direkt danach zur Seite drehen und atmen.", "Ziel: Boje oder markanter Punkt an Land."], cue: ["Kopf nur kurz heben", "Rhythmus halten"], err: ["Kopf zu hoch, Beine sinken"], why: "Gerade Linie spart im Rennen leicht 100–200 m.", alt: "Im Becken auf eine Flasche am Beckenrand üben", q: "sighting freiwasser schwimmen technik" },
  neo: { n: "Schwimmen im Neopren", k: "Freiwasser", re: /\bneo\b/i,
    how: ["Neo sorgfältig hochziehen, besonders an Schultern, damit die Arme frei sind.", "Ruhig ins Wasser gehen, Gesicht eintauchen, ausatmen.", "Erste Minuten bewusst ruhig, der Neo engt anfangs ein."], cue: ["Nie allein", "Schwimmboje"], err: ["Zu schnell starten, Atemnot"], why: "Mehr Auftrieb und Wärme. Gewöhnung vor dem Rennen ist Pflicht.", alt: "", q: "neoprenanzug anziehen triathlon tipps" },
  kraul: { n: "Kraul-Technik (Überblick)", k: "Schwimmen", re: /(?!)/, how: ["Lang machen: Hand taucht vor der Schulter ein und gleitet nach vorn.", "Hoher Ellbogen unter Wasser, Hand zieht unter dem Körper zur Hüfte.", "Rotation aus der Hüfte, Kopf ruhig, ein Auge bleibt beim Atmen im Wasser.", "Beinschlag klein aus der Hüfte."], cue: ["Ausatmen unter Wasser", "Hüfte oben"], err: ["Kopf heben", "Arm kreuzt die Mittellinie"], why: "Saubere Technik spart im Rennen mehr Zeit als Kraft.", alt: "", q: "kraul technik" },
  lauf_abc: { n: "Lauf-ABC", k: "Lauf", re: /lauf-abc|lauf abc/i, how: ["Fußgelenksarbeit: kleine, schnelle Schritte über den Vorfuß, 20 m.", "Skippings: Knie halbhoch, hohe Frequenz, 20 m.", "Anfersen: Ferse locker Richtung Gesäß, 20 m.", "Hopserlauf: rhythmisch mit Armeinsatz, 20 m. Je 2 Durchgänge."], cue: ["Aufrecht", "Aktiver Armeinsatz"], err: ["Rückenlage"], why: "Koordination und Laufökonomie, ideal vor Steigerungen.", alt: "", q: "lauf abc übungen" },
  koppel: { n: "Koppellauf (Rad → Lauf)", k: "Triathlon", re: /(?!)/, how: ["Schuhe und Startnummernband vorher bereitlegen.", "Rad abstellen, Helm erst nach dem Rad ab, Laufschuhe an.", "Erste Minuten bewusst kurze, schnelle Schritte.", "Nach 5–10' ins Zieltempo finden."], cue: ["Schrittfrequenz hoch", "Erste Minuten nicht nach Pace laufen"], err: ["Zu schnell loslaufen"], why: "Gewöhnt Beine und Kreislauf an den Wechsel.", alt: "", q: "koppeltraining triathlon" },
  trittfrequenz: { n: "Hohe Trittfrequenz", k: "Rad", re: /(?!)/, how: ["Leichten Gang wählen.", "Trittfrequenz über 30 s auf 110+ U/min steigern.", "Becken ruhig, Oberkörper locker."], cue: ["Nicht hüpfen"], err: ["Zu schwerer Gang"], why: "Runder, ökonomischer Tritt.", alt: "", q: "trittfrequenz training" },
  rad_berg: { n: "Bergauf im Sattel", k: "Rad", re: /(?!)/, how: ["Rechtzeitig schalten, bevor die Frequenz einbricht.", "Im Sattel, Oberkörper ruhig, Hände locker.", "Gleichmäßiger Druck über die ganze Kurbelumdrehung."], cue: ["HF-Obergrenze halten"], err: ["Am Anfang überziehen"], why: "Allgäu: Kalvarienberg und Anstiege kontrolliert fahren.", alt: "", q: "bergauf radfahren technik" },
  /* Lauf-Drills */
  steigerung: { n: "Steigerungen", k: "Lauf", re: /steigerung/i,
    how: ["Nach dem lockeren Lauf 15–20 Sekunden zügig beschleunigen.", "Bis etwa 5-km-Tempo, nicht sprinten.", "Komplett erholen (gehen oder traben), dann die nächste."], cue: ["Locker bleiben", "Hohe Schrittfrequenz"], err: ["Verkrampfen", "Zu schnell"], why: "Hält Laufökonomie und Schnelligkeit, ohne zu ermüden.", alt: "", q: "steigerungsläufe strides erklärt" },
  huegelsprint: { n: "Hügelsprints", k: "Lauf", re: /hügelsprint|hill sprint/i,
    how: ["Steilen Hügel suchen (6–10 %).", "8–10 Sekunden maximal bergauf, aufrechter Oberkörper.", "Langsam zurückgehen, volle Erholung (2 min)."], cue: ["Kräftiger Armeinsatz", "Kurze Kontakte"], err: ["Zu lang (dann wird es Laktattraining)"], why: "Kraft und Neuromuskulatur mit wenig Verletzungsrisiko.", alt: "Treppe", q: "hill sprints running technik" }
};

/* Übungen in einem Text finden, in Reihenfolge des Auftretens, ohne Doppel. Hotel-Kürzel H3/H4 werden aufgelöst. */
const HOTEL = { H3: ["kniebeuge", "split", "rdl", "waden", "rudern"], H4: ["split", "bridge", "waden", "liegestuetz", "plank", "deadbug"] };
function exercisesIn(text) {
  const t = String(text || ""), hits = [];
  Object.keys(EX).forEach(k => { const m = t.match(EX[k].re); if (m) hits.push([m.index, k]); });
  Object.keys(HOTEL).forEach(h => { const m = t.match(new RegExp("\\b" + h + "\\b")); if (m) HOTEL[h].forEach((k, i) => hits.push([m.index + i * .01, k])); });
  const seen = new Set(); return hits.sort((a, b) => a[0] - b[0]).map(h => h[1]).filter(k => !seen.has(k) && seen.add(k));
}
function exercise(k) { const e = EX[k]; if (!e) return null; const v = VIDEOS[k]; return Object.assign({ key: k, video: v ? "https://www.youtube.com/watch?v=" + v.id : yt(e.q), vid: v || null }, e); }
/* Sätze/Wiederholungen zu einer Übung aus dem Text (z. B. "Kniebeuge 4x5", "je 3x10–12 @ RPE 6–7"). */
function doseFor(text, k) {
  const t = String(text || ""), e = EX[k]; if (!e) return "";
  const m = t.match(e.re); if (!m) return "";
  const after = t.slice(m.index, m.index + 60).match(/(\d+\s*x\s*\d+(?:[–-]\d+)?(?:\s*\/\s*Seite)?(?:\s*@\s*RPE\s*\d+(?:[–-]\d+)?)?)/i);
  if (after) return after[1].replace(/\s+/g, " ");
  const je = t.match(/je\s+(\d+\s*x\s*\d+(?:[–-]\d+)?(?:\s*@\s*RPE\s*\d+(?:[–-]\d+)?)?)/i); return je ? je[1] : "";
}

/* ---------- Workout-Builder 3.2: Beschreibung → Abschnitte mit expliziten Anweisungen ----------
   zf(code) liefert die Zone der Woche aus der Engine: { pace: "4:08–4:13 /km", hf: "169–176" }. css: Sekunden pro 100 m oder null.
   Abschnitt: { kind, lab, n, dist (km), dur (min), z, target, hf, cad, rest {dur, how}, how, ex } */
const ZN = { 1: "Locker", 2: "Ausdauer", 3: "Schwelle", 4: "Intervall", 5: "Sprint" };
const num = v => typeof v === "number" && isFinite(v);
const nf = x => Number(String(x).replace(/\./g, "").replace(",", "."));
const nfd = x => Number(String(x).replace(",", "."));
function paceMid(p) { const m = String(p || "").match(/(\d+):(\d\d)\s*[–-]\s*(\d+):(\d\d)/); if (m) return ((+m[1] * 60 + +m[2]) + (+m[3] * 60 + +m[4])) / 120; const o = String(p || "").match(/(\d+):(\d\d)\s*\/km/); return o ? (+o[1] * 60 + +o[2]) / 60 : null; }
const mmss = sec => Math.floor(sec / 60) + ":" + String(Math.round(sec % 60)).padStart(2, "0");
const KIND = { warm: "Einlaufen", cool: "Auslaufen", main: "Hauptteil", easy: "Locker", rest: "Pause", strides: "Steigerungen", drill: "Drill" };
function runCode(t) { t = String(t || "").toLowerCase();
  if (/hm-ziel|hm @/.test(t)) return "HMZ"; if (/marathontempo|\bmp\b/.test(t)) return "MP"; if (/md-lauf|mitteldistanz/.test(t)) return "MD"; if (/intervall/.test(t)) return "I";
  if (/schwelle|od-lauf|od-tempo/.test(t)) return "T"; if (/renntempo|vollgas|so schnell wie/.test(t)) return "TEST"; if (/hf 145|konstant bei hf/.test(t)) return "AC"; if (/locker|ruhig|traben/.test(t)) return "E"; return null; }
const ZOF = { E: 1, LR: 1, AC: 2, MD: 2, MP: 2, HMZ: 3, T: 3, I: 4, TEST: 4, M: 2, R2: 1, R3: 2, R4: 3 };
const RUN_HOW = {
  E: "Locker, du kannst in ganzen Sätzen sprechen. HF-Deckel geht vor Pace.",
  MP: "Marathontempo: kontrolliert, gleichmäßig, Atmung ruhig. Nicht schneller werden, auch wenn es leicht wirkt.",
  T: "Schwelle: angenehm hart, nur kurze Sätze möglich (RPE 7). Gleichmäßig, nicht ins Rote gehen.",
  I: "Intervall: hart, aber kontrolliert (RPE 8–9). Die letzte Wiederholung muss so schnell sein wie die erste.",
  HMZ: "HM-Zielpace: genau im Zielfenster, nicht schneller. Rhythmus finden, Atmung tief.",
  MD: "Mitteldistanz-Laufpace: kontrolliert unter der Schwelle, wie im Rennen nach dem Rad.",
  AC: "Puls exakt halten, Tempo ergibt sich. Gleiche Strecke wie beim letzten Check.",
  TEST: "Gleichmäßig von Anfang bis Ende, erster Kilometer nicht zu schnell."
};
function addRunTargets(st, zf) { const code = st.code, z = zf(code === "LR" ? "E" : code) || {}; st.target = code === "AC" ? "HF konstant 145" : z.pace || ""; st.hf = code === "AC" ? "" : z.hf || ""; st.how = st.how || RUN_HOW[code] || ""; st.z = st.z || ZOF[code] || 1; return st; }
function splitDesc(d) {
  d = String(d || "").replace(/\s+/g, " ").trim();
  const parts = d.split(/(?<=[.!])\s+(?=[A-ZÄÖÜ])/), main = [], notes = [];
  parts.forEach(p => (/\d/.test(p) && /(km|m\b|'|x\d|\dx|ein\b|aus\b|locker|min)/i.test(p) ? main : notes).push(p.replace(/\.$/, "")));
  let body = main.join(", "); const lead = body.match(/^([^,]*?):\s+(.*)$/); let total = null, label = "";
  if (lead && !/\d+\s*x/.test(lead[1])) { label = lead[1]; body = lead[2]; const tk = label.match(/(\d+(?:[.,]\d+)?)\s*km/), tm = label.match(/(\d+)\s*'/); total = tk ? { km: nfd(tk[1]) } : tm ? { min: +tm[1] } : null;
    const inner = body.match(/^(\d+)\s*'\s*:\s+(.*)$/); if (inner) { total = { min: +inner[1] }; body = inner[2]; } }
  const tk2 = body.match(/^(\d+(?:[.,]\d+)?)\s*km gesamt:?\s*/); if (tk2) { total = { km: nfd(tk2[1]) }; body = body.slice(tk2[0].length); }
  const segs = []; let depth = 0, cur = ""; for (const ch of body) { if (ch === "(") depth++; if (ch === ")") depth--; if (ch === "," && depth <= 0) { segs.push(cur.trim()); cur = ""; } else cur += ch; } if (cur.trim()) segs.push(cur.trim());
  return { segs: segs.filter(Boolean), notes, total, label };
}
function restOf(txt) { const m = String(txt || "").replace(/\([^)]*\)/g, "").match(/\/\s*(\d+(?:[.,:]\d+)?)\s*(s|'|min|m|km)?\s*(traben|locker|gehen|pause)?/i); if (!m) return null;
  const v = m[1].includes(":") ? m[1].split(":").reduce((a, b) => a * 60 + +b, 0) / 60 : nfd(m[1]), u = m[2] || "'";
  const dur = u === "s" ? v / 60 : u === "m" ? v / 1000 * 6.5 : u === "km" ? v * 6 : v; const lab = u === "s" ? v + " s" : u === "m" ? v + " m" : u === "km" ? v + " km" : (m[1].includes(":") ? m[1] : v) + "'";
  return { dur, txt: lab + " " + (m[3] && m[3] !== "pause" ? m[3] : "traben") }; }
/* ---- Laufen ---- */
function buildRun(s, zf) {
  const D = splitDesc(s.desc), out = [], mainCode = s.code === "LR" ? "E" : s.code;
  const push = st => out.push(addRunTargets(st, zf));
  const segs = D.segs.length ? D.segs : [s.desc];
  segs.forEach(sg => { let m; const low = sg.toLowerCase();
    if ((m = sg.match(/^(\d+(?:[.,]\d+)?)\s*km\s+ein(laufen)?\b/i))) { push({ kind: "warm", lab: "Einlaufen", dist: nfd(m[1]), code: "E", how: "Locker einlaufen, letzte Minuten etwas zügiger." }); const k = sg.match(/(\d+)\s*steigerung/i); if (k || /steigerung/i.test(sg)) out.push({ kind: "strides", lab: "Steigerungen", n: k ? +k[1] : 3, dur: .35, z: 5, target: "bis ca. 5-km-Tempo", rest: { dur: 1, txt: "1' gehen/traben" }, how: "15–20 s zügig beschleunigen, locker bleiben, nicht sprinten.", ex: "steigerung" }); return; }
    if ((m = sg.match(/^(\d+(?:[.,]\d+)?)\s*km\s+aus(laufen)?\b/i))) { push({ kind: "cool", lab: "Auslaufen", dist: nfd(m[1]), code: "E", how: "Locker auslaufen." }); return; }
    if (/^(locker\s+)?aus(laufen)?$/i.test(sg.trim())) { push({ kind: "cool", lab: "Auslaufen", dist: null, code: "E", how: "Locker auslaufen." }); return; }
    if ((m = sg.match(/(\d+)\s*x\s*10\s*s\s*hügelsprint/i))) { out.push({ kind: "main", lab: "Hügelsprints", n: +m[1], dur: 10 / 60, z: 5, target: "maximal bergauf, 6–10 % Steigung", rest: { dur: 2, txt: "2' zurückgehen" }, how: "Aufrecht, kräftiger Armeinsatz, kurze Bodenkontakte. Volle Erholung.", ex: "huegelsprint" }); return; }
    if ((m = sg.match(/(\d+)\s*x\s*(\d+)\s*s\s*steigerung/i)) || (m = sg.match(/(\d+)\s*steigerung/i))) { out.push({ kind: "strides", lab: "Steigerungen", n: +m[1], dur: (m[2] ? +m[2] : 20) / 60, z: 5, target: "bis ca. 5-km-Tempo", rest: { dur: 1, txt: "1' gehen/traben" }, how: "Zügig, locker, nicht sprinten.", ex: "steigerung" }); return; }
    if ((m = sg.match(/(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*(km|m|'|s|min)(?!\w)\s*(.*)$/i))) {
      const n = +m[1], v = nfd(m[2]), u = m[3], rest = restOf(m[4]), tail = m[4] || "", head = tail.replace(/\([^)]*\)/g, "").split("/")[0], c0 = runCode(head) || (/zügig|bergauf/.test(tail) ? (u === "s" || (u !== "km" && u !== "m" && v <= 2) ? "I" : "T") : mainCode);
      const st = { kind: "main", lab: n + " × " + (u === "km" ? v + " km" : u === "m" ? v.toLocaleString("de-DE") + " m" : u === "s" ? v + " s" : v + "'"), n, code: c0, rest: rest || { dur: 2, txt: "2' traben" } };
      if (u === "km" || u === "m") st.dist = u === "km" ? v : v / 1000; else st.dur = u === "s" ? v / 60 : v;
      if (/bergauf/i.test(tail)) { st.target2 = (tail.match(/\((\d+[–-]\d+\s*%)\)/) || [])[1] || "bergauf"; st.how = "Bergauf nach Gefühl hart (RPE 8), Schritt kurz, Arme aktiv. Bergab locker zurück."; }
      push(st); if (/zügig/.test(head) && !runCode(head)) out[out.length - 1].target = "zügig, RPE 7–8 (" + (out[out.length - 1].target || "") + ")"; return; }
    if ((m = sg.match(/^hm\s*@/i))) { push({ kind: "main", lab: "Halbmarathon", dist: 21.0975, code: "HMZ", how: (D.notes.join(" ") || RUN_HOW.HMZ) }); return; }
    if ((m = sg.match(/(?:letzte\s+)?(\d+(?:[.,]\d+)?)\s*km\s*(?:@|bei|konstant|vollgas|so schnell)(.*)$/i))) { const c0 = runCode(sg) || mainCode;
      if (/letzte/i.test(sg)) { const prev = [...out].reverse().find(x => x.kind === "easy" && x.dist); if (prev) { prev.dist = Math.max(1, prev.dist - nfd(m[1])); prev.lab = prev.dist + " km locker"; prev.dur = null; } } push({ kind: "main", lab: nfd(m[1]) + " km " + ({ MP: "Marathontempo", T: "Schwelle", HMZ: "HM-Zielpace", MD: "MD-Laufpace", AC: "bei HF 145", TEST: "Vollgas", I: "Intervall" }[c0] || ""), dist: nfd(m[1]), code: c0 }); return; }
    if ((m = sg.match(/(\d+)\s*'\s*(?:@|im|so schnell)(.*)$/i))) { const c0 = runCode(sg) || mainCode; push({ kind: "main", lab: m[1] + "' " + ({ MP: "Marathontempo", T: "Schwelle", HMZ: "HM-Zielpace", MD: "MD-Laufpace", TEST: "gleichmäßig voll", I: "Intervall" }[c0] || ""), dur: +m[1], code: c0 }); return; }
    if ((m = sg.match(/^(\d+(?:[.,]\d+)?)\s*km\s+(locker|ruhig|sehr locker)/i))) { push({ kind: "easy", lab: nfd(m[1]) + " km locker", dist: nfd(m[1]), code: "E" }); return; }
    if ((m = sg.match(/^(\d+)\s*'\s+(locker|ruhig)/i))) { push({ kind: "easy", lab: m[1] + "' locker", dur: +m[1], code: "E" }); return; }
    if ((m = sg.match(/^42,2\s*km/i))) { push({ kind: "main", lab: "Marathon", dist: 42.195, code: "M", target: zf("M").pace, how: D.notes.join(" ") }); return; }
  });
  /* Nichts erkannt: eine Einheit im Code-Tempo, mit Steigerungen falls genannt */
  if (!out.some(x => x.kind === "main" || x.kind === "easy")) {
    const km = (s.desc.match(/^(\d+(?:[.,]\d+)?)\s*km/) || [])[1], mn = (s.desc.match(/(\d+)\s*'/) || [])[1];
    const st = { kind: s.code === "E" || s.code === "LR" ? "easy" : "main", lab: s.code === "LR" ? "Long Run" : /koppel/i.test(s.name) ? "Koppellauf" : ZN[ZOF[mainCode] || 1] === "Locker" ? "Lauf locker" : s.name.replace(/^★\s*/, ""), code: mainCode };
    if (km) st.dist = nfd(km); else st.dur = mn ? +mn : s.min || 30;
    if (/koppel/i.test(s.name + s.desc)) st.how = "Direkt nach dem Rad, Wechsel unter 3'. Die ersten Minuten fühlen sich schwer an, das ist normal. Schrittfrequenz hoch, Schritte kurz.";
    if (s.code === "LR") st.how = "Gleichmäßig locker, HF-Deckel. Ab 75–90' Verpflegung wie im Rennen testen.";
    out.unshift(addRunTargets(st, zf)); if (st.kind === "main" && !out.some(x => x.kind === "warm") && (s.min || 0) >= 30) out.unshift(addRunTargets({ kind: "warm", lab: "Einlaufen", dur: 10, code: "E", how: "Locker einlaufen." }, zf));
  }
  /* Koppel mit "10' locker, 20' @ MD" ist oben erfasst; Gesamtstrecke: fehlendes Auslaufen ergänzen */
  const pace = c => paceMid((zf(c === "LR" ? "E" : c) || {}).pace) || 5.6;
  out.forEach(x => { if (x.dist != null && x.dur == null) x.dur = x.dist * pace(x.code || "E"); if (x.dur != null && x.dist == null && (x.code)) x.dist = x.dur / pace(x.code); });
  const tot = st => st.reduce((a, x) => a + (x.n || 1) * (x.dist || 0) + (x.n > 1 && x.rest ? (x.n - 1) * x.rest.dur / 6.5 : 0), 0);
  const T = D.total && D.total.km ? D.total.km : null, cool = out.find(x => x.kind === "cool" && !x.dist0 && x.dist == null);
  if (T) { const used = tot(out.filter(x => x !== cool)); const restKm = Math.round(Math.max(0, T - used) * 10) / 10;
    if (cool) { cool.dist = Math.max(1, restKm); cool.dur = cool.dist * pace("E"); } else if (restKm >= 1 && out.some(x => x.kind === "main")) out.push(addRunTargets({ kind: "cool", lab: "Auslaufen", dist: restKm, dur: restKm * pace("E"), code: "E", how: "Locker auslaufen." }, zf)); }
  else if (cool && cool.dist == null) { cool.dist = 1.5; cool.dur = 1.5 * pace("E"); }
  return out;
}
/* ---- Rad ---- */
const BIKE_HOW = { R2: "Locker, Gefühl 3–4/10, runder Tritt 85–95 U/min. Lieber leichter Gang.", R3: "Rad-Tempo: kontrolliert zügig, Gefühl 6/10, 80–90 U/min. Renntempo Mitteldistanz.", R4: "Rad-Schwelle: hart, aber gleichmäßig, Gefühl 7–8/10, 85–95 U/min." };
const BIKE_CAD = { R2: "85–95 U/min", R3: "80–90 U/min", R4: "85–95 U/min" };
function bikeCode(t) { t = String(t || "").toLowerCase(); if (/schwelle|maximal/.test(t)) return "R4"; if (/tempo|zügig/.test(t)) return "R3"; return "R2"; }
function buildBike(s, zf) {
  const D = splitDesc(s.desc), out = [], push = st => { const z = zf(st.code) || {}; st.target = st.target || ("Gefühl " + ({ R2: "3–4", R3: "6", R4: "7–8" }[st.code]) + "/10"); st.hf = z.hf || ""; st.cad = st.cad || BIKE_CAD[st.code]; st.how = st.how || BIKE_HOW[st.code]; st.z = ZOF[st.code]; out.push(st); };
  let total = D.total && D.total.min ? D.total.min : null; const lead = s.desc.match(/^(\d+)\s*'/); if (!total && lead) total = +lead[1]; if (!total) total = s.min || 60;
  const segs = D.segs.length ? D.segs : [s.desc];
  segs.forEach(sg => { let m;
    if ((m = sg.match(/(\d+)\s*x\s*(\d+)\s*(s|')\s*(?:schnelle\s+)?trittfrequenz/i))) { push({ kind: "drill", lab: m[1] + " × " + m[2] + (m[3] === "s" ? " s" : "'") + " hohe Trittfrequenz", n: +m[1], dur: m[3] === "s" ? +m[2] / 60 : +m[2], code: "R2", cad: "110+ U/min", target: "leichter Gang, Becken ruhig", rest: { dur: 2, txt: "2' locker" }, how: "Trittfrequenz hochdrehen, ohne auf dem Sattel zu hüpfen. Schult einen runden, ökonomischen Tritt.", ex: "trittfrequenz" }); return; }
    if ((m = sg.match(/(\d+)\s*x\s*(\d+)\s*'\s*(.*)$/i))) { const tail = m[3] || "", c0 = bikeCode(tail), rest = restOf(tail); const st = { kind: "main", lab: m[1] + " × " + m[2] + "' " + ({ R4: "Rad-Schwelle", R3: "Rad-Tempo", R2: "locker" }[c0]), n: +m[1], dur: +m[2], code: c0, rest: rest || { dur: Math.max(3, Math.round(+m[2] / 3)), txt: Math.max(3, Math.round(+m[2] / 3)) + "' locker" } };
      if (/bergauf/i.test(tail)) { st.lab += " bergauf"; const cd = tail.match(/(\d+[–-]\d+)\s*U\/min/); if (cd) st.cad = cd[1] + " U/min"; st.how = "Bergauf im Sattel, Oberkörper ruhig, gleichmäßiger Druck. HF nicht über dem Band."; st.ex = "rad_berg"; }
      if (/antritt/i.test(tail)) st.how += " Dazwischen 2 × 30 s Antritt im Sattel."; push(st); return; }
    if ((m = sg.match(/^(\d+)\s*'\s*(locker|sehr locker|ein)/i))) { push({ kind: "warm", lab: m[1] + "' locker", dur: +m[1], code: "R2" }); return; }
    if ((m = sg.match(/(\d+)\s*'\s*gleichmäßig maximal/i))) { push({ kind: "main", lab: m[1] + "' gleichmäßig maximal (Test)", dur: +m[1], code: "R4", target: "so hart wie 30' gleichmäßig möglich", how: "Flach, ohne Ampeln oder Indoor-Bike. Erste 5' kontrolliert, dann steigern. Ø HF der letzten 20' notieren." }); return; }
    if ((m = sg.match(/letzte\s+(\d+)\s*'\s*.*(zügig|tempo)/i))) { push({ kind: "main", lab: "letzte " + m[1] + "' Rad-Tempo", dur: +m[1], code: "R3", atEnd: true }); return; }
    if ((m = sg.match(/(\d+)\s*'\s*rad-schwelle/i))) { push({ kind: "main", lab: m[1] + "' Rad-Schwelle", dur: +m[1], code: "R4" }); return; }
    if ((m = sg.match(/^(locker\s+)?aus$/i))) { out.push({ kind: "cool", marker: true }); return; }
  });
  /* Ein- und Ausfahren, Rest der Gesamtzeit */
  const hasMain = out.some(x => x.kind === "main" || x.kind === "drill");
  const filtered = out.filter(x => !x.marker);
  const work = filtered.reduce((a, x) => a + (x.n || 1) * (x.dur || 0) + (x.n > 1 && x.rest ? (x.n - 1) * x.rest.dur : 0), 0);
  const res = [];
  if (!hasMain) { const c0 = s.code === "R4" ? "R4" : s.code === "R3" ? "R3" : "R2"; const st = []; const tmp = out; out.length = 0; push({ kind: "easy", lab: /ausfahrt/i.test(s.desc) ? "Ausfahrt" : "Rad", dur: total, code: c0 === "R2" ? "R2" : "R2" }); if (c0 !== "R2") out[0].how = BIKE_HOW.R2; return out; }
  if (!filtered.some(x => x.kind === "warm")) { const w = Math.min(15, Math.max(10, (total - work) / 2)); const t0 = []; out.length = 0; push({ kind: "warm", lab: "Einfahren", dur: Math.round(w), code: "R2" }); filtered.forEach(x => out.push(x)); }
  else { out.length = 0; filtered.forEach(x => out.push(x)); }
  const used = out.reduce((a, x) => a + (x.n || 1) * (x.dur || 0) + (x.n > 1 && x.rest ? (x.n - 1) * x.rest.dur : 0), 0), rest = Math.round(total - used);
  const endBlock = out.find(x => x.atEnd);
  if (rest >= 5) { const st = { kind: "cool", lab: endBlock ? "Locker fahren" : "Ausfahren", dur: rest, code: "R2" }; const z = zf("R2") || {}; Object.assign(st, { target: "Gefühl 3–4/10", hf: z.hf || "", cad: BIKE_CAD.R2, how: endBlock ? "Locker im Grundlagenbereich." : "Locker ausrollen.", z: 1 }); if (endBlock) out.splice(out.indexOf(endBlock), 0, st); else out.push(st); }
  return out;
}
/* ---- Schwimmen ---- */
const DRILL_KEYS = [["seitlage", /seitlage/i], ["sechseins", /6-1-6/i], ["abschlag", /abschlag/i], ["fingertip", /fingertip/i], ["einarmig", /einarmig/i], ["dreieratmung", /3er-atmung/i], ["pullbuoy", /pullbuoy/i]];
function buildSwim(s, css) {
  const D = splitDesc(s.desc), out = [], sec100 = css || 140, cssKnown = !!css;
  const tgt = (kind, plus) => kind === "css" ? (cssKnown ? mmss(sec100 + (plus || 0)) + " /100 m" : "Schwellentempo, RPE 7") : kind === "fast" ? (cssKnown ? "schneller als " + mmss(sec100 - 3) + " /100 m" : "schnell, RPE 8–9") : kind === "drill" ? "Technik, ohne Uhr" : (cssKnown ? "ca. " + mmss(sec100 + 12) + "–" + mmss(sec100 + 18) + " /100 m" : "ruhig, RPE 3–4");
  const mins = (m, kind) => m / 100 * (kind === "drill" ? sec100 + 35 : kind === "css" ? sec100 : kind === "fast" ? sec100 - 5 : sec100 + 15) / 60;
  const push = st => { st.dur = st.dur ?? (st.n || 1) * mins(st.m || 0, st.k) + ((st.n || 1) - 1) * (st.rest ? st.rest.dur : 0); out.push(st); };
  let segs = D.segs.length ? D.segs : [s.desc];
  if (/css-test/i.test(s.desc) && !/\d+\s*ein/.test(s.desc)) segs = ["400 ein", "400 m Vollgas", "10' locker", "200 m Vollgas", "200 aus"];
  segs.forEach(sg => { let m; const low = sg.toLowerCase(), drill = DRILL_KEYS.find(([, re]) => re.test(sg));
    if ((m = sg.match(/^(\d+)\s*'\s*ein/i))) { push({ kind: "warm", lab: m[1] + "' einschwimmen", dur: +m[1], z: 1, target: tgt("easy"), how: "Locker Kraul oder Brust im Wechsel, Atmung ruhig, Wasser spüren." }); return; }
    if ((m = sg.match(/^(\d+)\s*ein/i))) { push({ kind: "warm", lab: m[1] + " m einschwimmen", m: +m[1], k: "easy", z: 1, target: tgt("easy"), how: "Locker gemischt: 100 Kraul, 50 Rücken, 50 Kraul mit Fokus Ausatmen." }); return; }
    if ((m = sg.match(/^(\d+)\s*aus/i))) { push({ kind: "cool", lab: m[1] + " m ausschwimmen", m: +m[1], k: "easy", z: 1, target: tgt("easy"), how: "Ganz locker, gern Rücken oder Brust." }); return; }
    if ((m = sg.match(/(\d+)\s*x\s*\(\s*(\d+)\s*x\s*(\d+)\s*@\s*css(?:\s*\+\s*(\d+)\s*s)?\s*\/\s*(\d+)\s*s\s*\)\s*\/\s*(\d+)\s*'/i))) { const n = +m[1] * +m[2]; push({ kind: "main", lab: m[1] + " × (" + m[2] + " × " + m[3] + " m) @ CSS", n, m: +m[3], k: "css", z: 3, target: tgt("css", +(m[4] || 0)), rest: { dur: +m[5] / 60, txt: m[5] + " s am Rand, nach jedem Block " + m[6] + "'" }, how: "Alle Wiederholungen in derselben Zeit. Uhr am Beckenrand, Zeiten notieren.", ex: "css" }); return; }
    if ((m = sg.match(/(\d+)\s*x\s*(\d+)\s*(?:m\s*)?(.*)$/i))) {
      const n = +m[1], mm = +m[2], tail = m[3] || "", rest = (tail.match(/\/\s*(\d+)\s*s/) || [])[1], restM = (tail.match(/\/\s*(\d+)\s*'/) || [])[1];
      const k = /css/i.test(tail) ? "css" : /schnell|vollgas|renntempo|zügig/i.test(tail) ? "fast" : drill || /drill|technikfokus/i.test(tail) ? "drill" : "easy";
      const plus = +((tail.match(/css\s*\+\s*(\d+)/i) || [])[1] || 0);
      const lab = n + " × " + mm + " m " + (drill ? EX[drill[0]].n : k === "css" ? "@ CSS" + (plus ? "+" + plus + " s" : "") : k === "fast" ? "schnell" : /technikfokus/i.test(tail) ? "Technikfokus" : /drill/i.test(tail) ? "Drill" : "Kraul ruhig") + (/pullbuoy/i.test(tail) && !drill ? " (mit Pullbuoy)" : "");
      const rd = rest ? +rest / 60 : restM ? +restM : k === "drill" ? .5 : k === "css" ? .25 : .4;
      const how = drill ? EX[drill[0]].cue.join(". ") + "." : k === "css" ? "Gleichmäßig, jede Wiederholung in derselben Zeit. Zeiten notieren." : k === "fast" ? "Zügig mit sauberer Technik, nicht verkrampfen." : /technikfokus/i.test(tail) ? "Je 50 m ein Fokus: lang machen, Ellbogen hoch, ausatmen unter Wasser, Rotation aus der Hüfte." : /nr\.\s*2 und 4 mit pullbuoy|mittlere mit pullbuoy/i.test(tail) ? "Ruhig, " + (tail.match(/\(([^)]*)\)/) || [, ""])[1] + ". Gleichmäßiger Rhythmus." : "Ruhig und gleichmäßig, auf lange Züge achten.";
      push({ kind: k === "drill" ? "drill" : "main", lab, n, m: mm, k, z: k === "css" ? 3 : k === "fast" ? 4 : k === "drill" ? 1 : 2, target: tgt(k, plus), rest: { dur: rd, txt: rest ? rest + " s Pause" : restM ? restM + "' Pause" : k === "drill" ? "20–30 s Pause" : "15–30 s Pause" }, how, ex: drill ? drill[0] : k === "css" ? "css" : /technikfokus/i.test(tail) ? "kraul" : null }); return; }
    if ((m = sg.match(/(\d+)\s*m\s*vollgas/i))) { push({ kind: "main", lab: m[1] + " m Vollgas", m: +m[1], k: "fast", z: 4, target: cssKnown ? "so schnell wie gleichmäßig möglich" : "gleichmäßig maximal", how: "Nicht zu schnell anschwimmen, Zeit stoppen und notieren.", ex: "csstest" }); return; }
    if ((m = sg.match(/^(\d+)\s*'\s*locker/i))) { push({ kind: "easy", lab: m[1] + "' locker", dur: +m[1], z: 1, target: tgt("easy"), how: "Locker schwimmen, bei Bedarf Pausen am Rand." }); return; }
  });
  if (!out.length) {
    const mn = (s.desc.match(/(\d+)\s*'/) || [])[1], mtot = (s.desc.match(/(\d[\d.]*)\s*m\b/) || [])[1];
    if (/drill/i.test(s.desc) || /technik/i.test(s.name)) {
      const T = s.min || 30; push({ kind: "warm", lab: "200 m einschwimmen", m: 200, k: "easy", z: 1, target: tgt("easy"), how: "Locker gemischt." });
      [["seitlage", 4], ["sechseins", 4], ["abschlag", 4]].forEach(([k, n]) => push({ kind: "drill", lab: n + " × 25 m " + EX[k].n, n, m: 25, k: "drill", z: 1, target: tgt("drill"), rest: { dur: .5, txt: "20–30 s Pause" }, how: EX[k].cue.join(". ") + ".", ex: k }));
      const rep = (s.desc.match(/(\d+)\s*x\s*(\d+)/) || []); if (rep.length) push({ kind: "main", lab: rep[1] + " × " + rep[2] + " m Kraul ruhig", n: +rep[1], m: +rep[2], k: "easy", z: 2, target: tgt("easy"), rest: { dur: .5, txt: "20–30 s Pause" }, how: "Ruhig, Technik aus den Drills mitnehmen." });
      push({ kind: "cool", lab: "100 m ausschwimmen", m: 100, k: "easy", z: 1, target: tgt("easy"), how: "Ganz locker." });
    } else if (/freiwasser|neo/i.test(s.desc) || s.code === "OW") {
      const reps = s.desc.match(/(\d+)\s*x\s*(\d+)\s*(?:m\s*)?(renntempo|zügig)?/i), repsMin = s.desc.match(/(\d+)\s*x\s*(\d+)\s*'\s*renntempo/i);
      push({ kind: "warm", lab: "Eingewöhnen", dur: 5, z: 1, target: "ruhig", how: "Neo richtig sitzen lassen, Gesicht ins Wasser, ausatmen. Erst ruhig anschwimmen.", ex: "neo" });
      if (repsMin) push({ kind: "main", lab: repsMin[1] + " × " + repsMin[2] + "' Renntempo", n: +repsMin[1], dur: +repsMin[2], z: 3, target: "Renntempo, RPE 7", rest: { dur: 1, txt: "1' ruhig" }, how: "Alle 6–8 Züge orientieren, gerade Linie halten.", ex: "sighting" });
      else if (reps) push({ kind: "main", lab: reps[1] + " × " + reps[2] + " m " + (reps[3] || "zügig"), n: +reps[1], m: +reps[2], k: reps[3] ? "fast" : "easy", z: 3, target: "Renntempo, RPE 7", rest: { dur: 1, txt: /boje/i.test(s.desc) ? "1' an der Boje" : "1' ruhig" }, how: "Orientierung alle 6–8 Züge. Wendepunkt eng um die Boje.", ex: "sighting" });
      const rest = Math.max(5, (s.min || 30) - out.reduce((a, x) => a + x.dur, 0) - 3); push({ kind: "easy", lab: (mtot ? mtot + " m" : rest + "'") + (/renntempo/i.test(s.desc) && !reps && !repsMin ? " im Renntempo" : " ruhig am Stück"), dur: rest, z: /renntempo/i.test(s.desc) && !reps ? 3 : 2, target: /renntempo/i.test(s.desc) && !reps ? "Renntempo" : "ruhig, gleichmäßig", how: "Orientierung alle 6–8 Züge, ruhige Atmung, nie allein (Begleitung oder Boje).", ex: "sighting" });
    } else push({ kind: "easy", lab: (mn ? mn + "'" : "Schwimmen") + " ruhig", dur: mn ? +mn : s.min || 30, z: 1, target: tgt("easy"), how: "Locker, auf lange Züge und ruhige Ausatmung achten.", ex: "kraul" });
  }
  return out;
}
/* Einstieg: Abschnitte je Sportart. Für Profil-Balken expandiert profileOf die Wiederholungen. */
function buildWorkout(s, zf, css) {
  let st = [];
  try {
    if (s.sport === "Lauf") st = buildRun(s, zf);
    else if (s.sport === "Rad") st = buildBike(s, zf);
    else if (s.sport === "Schwimmen") st = buildSwim(s, css);
  } catch (e) { return []; }
  const tot = totalMin(st);
  if (s.min && st.length && tot < s.min * .8) {
    if (s.sport === "Schwimmen") {
      const sec = css || 140, gap = s.min - tot, ez = css ? "ca. " + mmss(sec + 12) + "–" + mmss(sec + 18) + " /100 m" : "ruhig, RPE 3–4";
      if (!st.some(x => x.kind === "warm")) { const m0 = gap > 12 ? 300 : 200; st.unshift({ kind: "warm", lab: m0 + " m einschwimmen", m: m0, dur: m0 / 100 * (sec + 15) / 60, z: 1, target: ez, how: "Locker gemischt: Kraul, Rücken, Brust. Atmung ruhig." }); }
      if (!st.some(x => x.kind === "cool")) st.push({ kind: "cool", lab: "100 m ausschwimmen", m: 100, dur: (sec + 15) / 60, z: 1, target: ez, how: "Ganz locker." });
      const t2 = totalMin(st); if (t2 < s.min * .8) { const f = s.min / t2; st.forEach(x => { x.dur = x.dur * f; }); }
    }
    else if (s.sport === "Lauf" && st.some(x => x.kind === "main")) { const add = Math.round(s.min - tot), i = st.findIndex(x => x.kind === "main"); const z = zf("E") || {}; st.splice(i, 0, { kind: "easy", lab: add + "' locker", dur: add, code: "E", z: 1, target: z.pace || "", hf: z.hf || "", how: /koppel/i.test(s.name + s.desc) ? "Direkt nach dem Rad locker anlaufen, Schritte kurz, Frequenz hoch." : "Locker." }); }
  }
  return st;
}
function profileOf(steps) { const out = []; steps.forEach(x => { const n = x.n || 1; for (let i = 0; i < n; i++) { out.push({ dur: n > 1 ? (x.dur ? (x.n > 1 && x.m ? x.dur / n : x.dur) : 1) : x.dur || 1, z: x.z || 1 }); if (i < n - 1 && x.rest) out.push({ dur: x.rest.dur, z: 1 }); } }); return out; }
function totalMin(steps) { return steps.reduce((a, x) => a + (x.m != null ? x.dur : (x.n || 1) * (x.dur || 0) + ((x.n || 1) - 1) * (x.rest ? x.rest.dur : 0)), 0); }
/* Rückwärtskompatibel für bestehende Aufrufe */
function workoutSteps(s, zoneTxt) { const st = buildWorkout(s, c => ({ pace: zoneTxt || "", hf: "" }), null); const out = []; st.forEach(x => { const n = x.n || 1; for (let i = 0; i < n; i++) { out.push({ lab: n > 1 ? (i + 1) + ". " + x.lab.replace(/^\d+\s*×\s*/, "") : x.lab, dur: Math.round((x.m != null ? x.dur / n : x.dur || 1) * 10) / 10, z: x.z || 1, note: x.target || "" }); if (i < n - 1 && x.rest) out.push({ lab: x.rest.txt.includes("traben") ? "Trabpause" : "Pause", dur: Math.round(x.rest.dur * 10) / 10, z: 1, note: x.rest.txt }); } });
  const sum = out.reduce((a, x) => a + x.dur, 0); if (s.min && sum > 0 && Math.abs(sum - s.min) > s.min * .3) { const f = s.min / sum; out.forEach(x => x.dur = Math.round(x.dur * f * 10) / 10); } return out; }

/* Standardübungen, wenn der Plan nur allgemein formuliert ("Drills nach Lust", "Ganzkörper leicht", Freiwasser). */
const DEFAULTS = { Schwimmen: ["seitlage", "sechseins", "abschlag", "pullbuoy"], OW: ["sighting", "dreieratmung", "neo"], Kraft: ["kniebeuge", "rdl", "split", "waden", "plank"], Mobility: ["hueftmob", "wademob", "hallux"] };
function exercisesFor(s) {
  const e = exercisesIn(s.desc + " " + (s.code === "OW" || /freiwasser/i.test(s.desc) ? "" : ""));
  if (s.code === "OW" || /freiwasser/i.test(s.desc)) return [...new Set(DEFAULTS.OW.concat(e))];
  if (e.length) return e;
  if (s.sport === "Schwimmen" && /drill|locker|technik|erhalt/i.test(s.desc)) return DEFAULTS.Schwimmen;
  if (s.sport === "Kraft") return DEFAULTS.Kraft;
  if (s.sport === "Mobility") return DEFAULTS.Mobility;
  return [];
}

G.Library = { buildWorkout, profileOf, totalMin, paceMid, VIDEOS, exercisesFor, EX, exercisesIn, exercise, doseFor, workoutSteps, ZN, yt };
})(typeof window !== "undefined" ? window : globalThis);
