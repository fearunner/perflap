/* Performance Lab 3.1: Übungsbibliothek und Workout-Parser. Reine Daten und Funktionen ohne DOM.
   Video-Links führen auf eine YouTube-Suche (immer aktuell, kein toter Einzellink). Keine Einbettung: kein Datenabfluss beim Öffnen der App. */
(function (G) {
"use strict";
const yt = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);

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
function exercise(k) { const e = EX[k]; return e ? Object.assign({ key: k, video: yt(e.q) }, e) : null; }
/* Sätze/Wiederholungen zu einer Übung aus dem Text (z. B. "Kniebeuge 4x5", "je 3x10–12 @ RPE 6–7"). */
function doseFor(text, k) {
  const t = String(text || ""), e = EX[k]; if (!e) return "";
  const m = t.match(e.re); if (!m) return "";
  const after = t.slice(m.index, m.index + 60).match(/(\d+\s*x\s*\d+(?:[–-]\d+)?(?:\s*\/\s*Seite)?(?:\s*@\s*RPE\s*\d+(?:[–-]\d+)?)?)/i);
  if (after) return after[1].replace(/\s+/g, " ");
  const je = t.match(/je\s+(\d+\s*x\s*\d+(?:[–-]\d+)?(?:\s*@\s*RPE\s*\d+(?:[–-]\d+)?)?)/i); return je ? je[1] : "";
}

/* ---------- Workout-Parser: Beschreibung → Schritte mit Intensität (für Profil und Ablauf) ----------
   z: 1 locker, 2 Ausdauer/MP/MD, 3 Schwelle, 4 Intervall, 5 Sprint. dur in Minuten (geschätzt aus Pace, wenn nur km). */
const ZN = { 1: "Locker", 2: "Ausdauer", 3: "Schwelle", 4: "Intervall", 5: "Sprint" };
function paceOf(code) { return { E: 5.7, LR: 5.75, LRM: 5.6, MP: 4.5, T: 4.3, I: 4.1, HMZ: 4.27, MD: 4.9, AC: 5.6, TEST: 4.3 }[code] || 5.5; }
function workoutSteps(s, zoneTxt) {
  const d = String(s.desc || ""), code = s.code, steps = [], P = { e: 5.7, mp: 4.5, t: 4.25, i: 4.05, hm: 4.27, md: 4.9 };
  const push = (lab, dur, z, note) => { if (dur > 0) steps.push({ lab, dur: Math.round(dur * 10) / 10, z, note: note || "" }); };
  const kmToMin = (km, p) => km * p, dist = x => { const m = String(x).match(/(\d+(?:[.,]\d+)?)\s*(km|m)\b/); return m ? (m[2] === "km" ? +m[1].replace(",", ".") : +m[1] / 1000) : null; };
  if (s.sport === "Lauf") {
    let m;
    const total = (d.match(/^(\d+(?:[.,]\d+)?)\s*km/) || [])[1];
    const warm = d.match(/(\d+(?:[.,]\d+)?)\s*km ein/);
    if (/@\s*Marathontempo/i.test(d)) { /* zuerst: Long Run mit MP-Blöcken, unten */ }
    else if ((m = d.match(/(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*(km|m)\s*@\s*([A-Za-zä]+)[^/]*\/\s*(\d+(?:[.,]\d+)?)\s*(s|'|m|km)?\s*(traben|gehen)?/i))) {
      const n = +m[1], km = m[3] === "km" ? +m[2].replace(",", ".") : +m[2] / 1000, kind = m[4].toLowerCase(), p = /schwell/.test(kind) ? P.t : /marathon/.test(kind) ? P.mp : /intervall/.test(kind) ? P.i : P.t, z = /schwell/.test(kind) ? 3 : /marathon/.test(kind) ? 2 : 4;
      const rec = m[6] === "s" ? +m[5] / 60 : m[6] === "m" ? +m[5] / 1000 * 6.5 : m[6] === "km" ? +m[5].replace(",", ".") * P.e : +m[5];
      push("Einlaufen", warm ? kmToMin(+warm[1].replace(",", "."), P.e) : 12, 1, warm ? warm[1] + " km locker" : "locker");
      if (/steigerung/i.test(d.slice(0, m.index))) push("Steigerungen", 2, 5, "3–4 x 20 s");
      for (let i = 0; i < n; i++) { push((i + 1) + ". " + (km >= 1 ? km + " km" : Math.round(km * 1000) + " m"), kmToMin(km, p), z, zoneTxt || ""); if (i < n - 1) push("Trabpause", rec, 1, m[5] + (m[6] || "'")); }
      const used = steps.reduce((a, x) => a + x.dur, 0), tot = total ? kmToMin(+total.replace(",", "."), 5.2) : used + 10; push("Auslaufen", Math.max(8, tot - used), 1, "locker");
    } else if ((m = d.match(/(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*(['′]|min|s)\s*(?:@\s*([A-Za-zä]+))?[^/]*\/\s*(\d+(?:[.,]\d+)?)\s*(['′]|s|min)?/i))) {
      const n = +m[1], dur = m[3] === "s" ? +m[2] / 60 : +m[2], kind = (m[4] || (/zügig/.test(d) ? "zügig" : "")).toLowerCase(), z = /schwell/.test(kind) ? 3 : /marathon/.test(kind) ? 2 : dur <= 1.5 ? 4 : /zügig/.test(kind) ? 3 : 4, rec = m[6] === "s" ? +m[5] / 60 : +m[5];
      push("Einlaufen", warm ? kmToMin(+warm[1].replace(",", "."), P.e) : 12, 1, warm ? warm[1] + " km locker" : "locker");
      const hs = d.match(/(\d+)\s*x\s*10\s*s\s*hügelsprint/i); if (hs) push("Hügelsprints", +hs[1] * 2.2, 5, hs[1] + " x 10 s, 2' Pause");
      for (let i = 0; i < n; i++) { push((i + 1) + ". " + m[2] + (m[3] === "s" ? " s" : "'"), dur, z, zoneTxt || ""); if (i < n - 1) push("Trabpause", rec, 1, m[5] + (m[6] || "'")); }
      const used = steps.reduce((a, x) => a + x.dur, 0), tot = total ? kmToMin(+total.replace(",", "."), 5.3) : (s.min || used + 10); push("Auslaufen", Math.max(6, tot - used), 1, "locker");
    }
    if (!steps.length && /@\s*Marathontempo/i.test(d)) {
      const parts = d.split(/,|\./).map(x => x.trim()).filter(x => /\d/.test(x) && /km/.test(x));
      parts.forEach(pt => { let mm;
        if ((mm = pt.match(/(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*km\s*@\s*Marathontempo\s*\/\s*(\d+(?:[.,]\d+)?)\s*km/i))) { for (let i = 0; i < +mm[1]; i++) { push((i + 1) + ". " + mm[2] + " km MP", kmToMin(+mm[2].replace(",", "."), P.mp), 2, "Marathontempo"); if (i < +mm[1] - 1) push(mm[3] + " km locker", kmToMin(+mm[3].replace(",", "."), P.e), 1, ""); } }
        else if ((mm = pt.match(/(?:letzte\s+)?(\d+(?:[.,]\d+)?)\s*km\s*@\s*Marathontempo/i))) push(mm[1] + " km Marathontempo (MP)", kmToMin(+mm[1].replace(",", "."), P.mp), 2, "Marathontempo");
        else if ((mm = pt.match(/^(?:\d+\s*km:\s*)?(\d+(?:[.,]\d+)?)\s*km\s*locker/i))) push(mm[1] + " km locker", kmToMin(+mm[1].replace(",", "."), P.e), 1, "");
      });
    }
    if (!steps.length) {
      const strides = d.match(/(\d+)\s*x\s*20\s*s\s*steigerung/i), z = { E: 1, LR: 1, AC: 2, MD: 2, MP: 2, HMZ: 3, TEST: 4, M: 2, T: 3, I: 4 }[code] || 1, main = (s.min || 30) - (strides ? 4 : 0);
      if (["TEST", "HMZ", "M"].includes(code)) { push("Einlaufen", 15, 1, "locker + Steigerungen"); push(code === "M" ? "Marathon" : code === "HMZ" ? "Halbmarathon" : "Test", Math.max(10, main - 25), z, zoneTxt || ""); push("Auslaufen", 10, 1, ""); }
      else { push(ZN[z] === "Locker" ? "Lauf locker" : ZN[z], main, z, zoneTxt || ""); if (strides) push("Steigerungen", 4, 5, strides[1] + " x 20 s"); }
    }
  } else if (s.sport === "Schwimmen") {
    const segs = d.split(/,(?![^(]*\))/).map(x => x.trim()).filter(Boolean); let any = false;
    segs.forEach(sg => { const mm = sg.match(/^(?:[A-Za-zäöüÄÖÜ&\- ]+:\s*)?(\d+)\s*(?:'|min)?\s*(ein|aus)?\b|(\d+)\s*x\s*\(?(\d+)/i); const rep = sg.match(/(\d+)\s*x\s*(\d+)/);
      if (/\bein\b/.test(sg)) { const v = +(sg.match(/(\d+)/) || [])[1]; push("Einschwimmen", /'/.test(sg) ? v : v / 100 * 2.2, 1, sg); any = true; }
      else if (/\baus\b/.test(sg)) { const v = +(sg.match(/(\d+)/) || [])[1]; push("Ausschwimmen", v / 100 * 2.2, 1, sg); any = true; }
      else if (rep) { const n = +rep[1], m2 = +rep[2], z = /css|vollgas|schnell/i.test(sg) ? 3 : /drill|seitlage|6-1-6|abschlag|fingertip|einarmig/i.test(sg) ? 1 : 2; push(sg.replace(/\s*\(.*\)/, "").slice(0, 46), n * m2 / 100 * (z === 3 ? 1.9 : 2.3) + n * .3, z, ""); any = true; }
      else if (/vollgas/i.test(sg)) { const v = +(sg.match(/(\d+)/) || [])[1]; push(sg.slice(0, 40), v / 100 * 1.8, 4, ""); any = true; }
    });
    if (/css-test/i.test(d) && !/\bein\b/.test(d)) { steps.length = 0; push("Einschwimmen", 8, 1, "400 m locker"); push("400 m Vollgas", 7, 4, "gleichmäßig"); push("Pause", 10, 1, "locker"); push("200 m Vollgas", 3.5, 4, "gleichmäßig"); push("Ausschwimmen", 5, 1, "200 m locker"); any = true; }
    if (!any) push("Schwimmen", s.min || 30, 1, "");
  } else if (s.sport === "Rad") {
    const m = d.match(/(\d+)\s*x\s*(\d+)\s*['′]/); const z = { R2: 1, R3: 2, R4: 3 }[code] || 1;
    if (m && z > 1) { push("Einfahren", 15, 1, "locker"); for (let i = 0; i < +m[1]; i++) { push((i + 1) + ". " + m[2] + "'", +m[2], z, zoneTxt || ""); if (i < +m[1] - 1) push("Pause", Math.max(3, Math.round(+m[2] / 3)), 1, "locker"); } const used = steps.reduce((a, x) => a + x.dur, 0); push("Ausfahren", Math.max(10, (s.min || used + 10) - used), 1, ""); }
    else push(z === 1 ? "Rad locker" : "Rad", s.min || 60, z, zoneTxt || "");
    if (/koppel/i.test(s.name + " " + d)) { const k = (s.name + " " + d).match(/(\d+)\s*['′]?\s*koppel/i); if (k) push("Koppellauf", +k[1], 2, "direkt nach dem Rad"); }
  }
  /* Auf die geplante Dauer skalieren, damit Profil und Ablauf zur Planzeit passen (Pace-Annahmen sind Schätzungen). */
  const sum = steps.reduce((a, x) => a + x.dur, 0);
  if (s.min && sum > 0 && Math.abs(sum - s.min) > s.min * .15) { const f = s.min / sum; steps.forEach(x => x.dur = Math.round(x.dur * f * 10) / 10); }
  return steps;
}
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

G.Library = { exercisesFor, EX, exercisesIn, exercise, doseFor, workoutSteps, ZN, yt };
})(typeof window !== "undefined" ? window : globalThis);
