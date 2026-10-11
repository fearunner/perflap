/* Performance Lab: Plan-Logik (Import, effektiver Plan, Zonen, Anpassungsvorschläge).
   Reine Funktionen ohne DOM, damit sie testbar sind. Keine personenbezogenen Daten im Code:
   Plan, Termine und Texte kommen ausschließlich aus der importierten Excel. */
(function (G) {
"use strict";
const HMK = 21.0975, MK = 42.195, RIEGEL = Math.pow(2, 1.06);
const RACE_TYPES = ["HM", "M", "OD", "MD"];
const HARD_RUN = ["I", "T", "HMZ", "LR", "LRM", "MP", "M", "TEST"];
const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const WDL = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const num = v => typeof v === "number" && isFinite(v);
const sd = s => new Date((s - 25569) * 864e5);
const serialOf = d => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5) + 25569;
const fmtD = s => { const d = sd(s); return String(d.getUTCDate()).padStart(2, "0") + "." + String(d.getUTCMonth() + 1).padStart(2, "0") + "."; };
const wdD = s => WD[sd(s).getUTCDay()] + " " + fmtD(s);
const r1 = x => Math.round(x * 10) / 10;
const r5 = x => Math.max(5, Math.round(x / 5) * 5);
const mss = days => { if (!num(days)) return "–"; const t = Math.round(days * 86400); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
const hms = days => { if (!num(days)) return "–"; const t = Math.round(days * 86400), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s).padStart(2, "0"); };
const tStart = tm => { const m = String(tm || "").match(/(\d\d):(\d\d)/); return m ? (+m[1]) * 60 + (+m[2]) : null; };
const hhmm = m => String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const timeRange = (start, min) => start == null ? "" : hhmm(start) + "–" + hhmm(start + (min || 30));

/* ---------- Import ---------- */
function parseWorkbook(XLSX, buf) {
  const wb = XLSX.read(buf, { type: "array", cellDates: false });
  if (!wb.Sheets.Plan || !wb.Sheets.Einstellungen) throw new Error("Das ist nicht der Trainingsplan: Blatt Plan oder Einstellungen fehlt.");
  const get = (sh, a) => { const c = wb.Sheets[sh] && wb.Sheets[sh][a]; return c ? c.v : undefined; };
  const rows = n => { const ws = wb.Sheets[n]; if (!ws || !ws["!ref"]) return []; const e = XLSX.utils.decode_range(ws["!ref"]).e;
    return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: true, range: { s: { r: 0, c: 0 }, e } }); };
  const S = { start: get("Einstellungen", "B10"), hfmax: get("Einstellungen", "B5"), lthr0: get("Einstellungen", "B6"), cap: get("Einstellungen", "B7"),
    ac: get("Einstellungen", "B8"), rest: get("Einstellungen", "B9"), tgtM: get("Einstellungen", "B11"), tgtHM: get("Einstellungen", "B12"),
    lead: get("Einstellungen", "B13"), baseRef: get("Einstellungen", "B23") };
  if (!num(S.start)) throw new Error("Planstart (Einstellungen B10) fehlt.");
  S.events = [15, 16, 17, 18].map(r => ({ name: get("Einstellungen", "A" + r), date: get("Einstellungen", "B" + r) })).filter(e => e.name && num(e.date));
  const seed = {};
  const plan = [], cnt = {};
  rows("Plan").slice(4).forEach(r => {
    if (!num(r[16]) || !num(r[0])) return;
    const sport = String(r[4] || ""), date = r[16];
    const k = date + "-" + sport.slice(0, 3); cnt[k] = (cnt[k] || 0) + 1;
    const typ = r[22] ? String(r[22]) : "";
    const s = { id: k + "-" + cnt[k], w: r[0], date, prio: r[3] || "", sport, name: String(r[5] || ""), desc: String(r[6] || ""),
      km: num(r[8]) ? r[8] : 0, min: num(r[9]) ? r[9] : 0, code: String(r[15] || ""),
      time: ((String(r[2] || "").match(/\d\d:\d\d–\d\d:\d\d/) || [""])[0]),
      wake: ((String(r[21] || "").match(/Wecker (\d+:\d\d)/) || [, ""])[1]), hint: String(r[21] || "").replace(/Wecker \d+:\d\d\n?/, "").trim(),
      typ, test: typ ? (RACE_TYPES.includes(typ) ? "race" : "test") : "", tkey: typ ? date + "-" + typ : "", trip: /✈/.test(String(r[2] || "")) || /^Reise/.test(String(r[5] || "")) };
    plan.push(s);
    const st = String(r[10] || "").trim();
    if (["✓", "½", "✗"].includes(st) || num(r[11]) || num(r[12])) seed["log:" + s.id] = { st: ["✓", "½", "✗"].includes(st) ? st : "", ikm: num(r[11]) ? r[11] : null, imin: num(r[12]) ? r[12] : null };
  });
  if (!plan.length) throw new Error("Im Blatt Plan wurden keine Einheiten gefunden.");
  const tests = [];
  rows("Tests").slice(4).forEach(r => {
    if (!r[2] || !num(r[1])) return;
    const t = { key: r[1] + "-" + r[3], w: r[0], date: r[1], name: String(r[2]), typ: String(r[3] || ""), dist: num(r[4]) ? r[4] : null, how: String(r[8] || "") };
    if (tests.some(x => x.key === t.key)) t.key += "b";
    tests.push(t);
    if (num(r[5]) || num(r[6])) seed["test:" + t.key] = { time: num(r[5]) ? r[5] : null, hf: num(r[6]) ? r[6] : null };
  });
  const weeks = {};
  const wr = rows("Wochen");
  const painLabel = String((wr[3] && wr[3][4]) || "Schmerz 0–10").replace(/^✎\s*/, "");
  wr.slice(4, 60).forEach(r => { if (!num(r[0])) return; weeks[r[0]] = { phase: String(r[2] || "").replace(/^\d+\s*/, "") };
    if (num(r[3]) || num(r[4]) || num(r[5])) seed["chk:" + r[0]] = { puls: num(r[3]) ? r[3] : null, pain: num(r[4]) ? r[4] : null, feel: num(r[5]) ? r[5] : null }; });
  const shoes = []; rows("Schuhe").slice(4, 12).forEach(r => { if (r[0]) shoes.push({ name: String(r[0]), std: r[2] || "", start: num(r[3]) ? r[3] : 0, limit: num(r[6]) ? r[6] : 0 }); });
  const extras = {}; let cur = null;
  rows("Reise & Regeln").forEach(r => { const b = r[1], c = r[2];
    if (b && !c) { cur = String(b); extras[cur] = []; } else if (b && c && cur) extras[cur].push([String(b), String(c)]); else if (!b) cur = cur; });
  return { v: 1, importedAt: Date.now(), S, plan, tests, weeks, painLabel, shoes, extras, seed };
}

/* ---------- Zustand ---------- */
const val = (st, k) => st[k] ? st[k].v : undefined;
function activeAdj(st) { return Object.keys(st).filter(k => k.startsWith("adj:")).map(k => st[k].v).filter(a => a && !a.undone).sort((a, b) => a.created - b.created); }
function resolved(st, key) { if (val(st, "dis:" + key)) return true; return activeAdj(st).some(a => a.key === key); }

function effective(B, st) {
  const map = new Map(B.plan.map(p => [p.id, Object.assign({}, p)]));
  for (const a of activeAdj(st)) for (const op of a.ops || []) {
    if (op.type === "add") { map.set(op.s.id, Object.assign({}, op.s, { adj: a.id, added: true })); continue; }
    const s = map.get(op.id); if (!s) continue;
    if (op.type === "drop") { s.dropped = true; s.note = op.note || ""; s.adj = a.id; }
    if (op.type === "edit") { if (!s.orig) s.orig = { name: s.name, km: s.km, min: s.min, code: s.code, sport: s.sport }; Object.assign(s, op.patch); s.note = op.note || ""; s.adj = a.id; s.edited = true; }
  }
  return [...map.values()].sort((a, b) => a.date - b.date || (tStart(a.time) ?? 999) - (tStart(b.time) ?? 999));
}

function derive(B, st) {
  const S = B.S, R = {};
  const res = k => val(st, "test:" + k) || {};
  const done = B.tests.filter(t => { const r = res(t.key); return num(r.time) || num(r.hf); }).sort((a, b) => a.date - b.date);
  const last = f => done.filter(f).slice(-1)[0];
  const lt = last(t => t.typ === "LTHR" && num(res(t.key).hf));
  R.lthr = lt ? res(lt.key).hf : S.lthr0;
  const rt = last(t => t.typ === "RAD" && num(res(t.key).hf));
  R.radl = rt ? res(rt.key).hf : R.lthr - 7;
  const eq = t => { const x = res(t.key).time; if (!num(x)) return null; return t.typ === "10K" ? x * Math.pow(HMK / 10, 1.06) : t.typ === "HM" ? x : t.typ === "M" ? x / RIEGEL : null; };
  const ht = last(t => eq(t) != null);
  R.hasTest = !!ht; R.refTest = ht ? ht.name : null;
  R.refHM = ht ? eq(ht) : S.baseRef;
  const cssD = done.filter(t => t.typ === "CSS400" && num(res(t.key).time)).map(t => { const p = B.tests.find(x => x.typ === "CSS200" && x.date === t.date); const b = p && res(p.key).time; return num(b) ? (res(t.key).time - b) / 2 : null; }).filter(num);
  R.css = cssD.length ? cssD[cssD.length - 1] : null;
  R.prog = R.refHM * RIEGEL; R.needHM = S.tgtM / RIEGEL;
  const base = S.baseRef, tg = S.tgtHM, lead = num(S.lead) ? S.lead : 150 / 86400;
  R.stages = [R.refHM,
    R.hasTest ? Math.max(Math.min(R.refHM, (base + tg) / 2), R.refHM - lead) : (base + tg) / 2,
    R.hasTest ? Math.max(Math.min(R.refHM, tg), R.refHM - lead) : tg,
    R.hasTest ? R.refHM : tg];
  R.mpGoal = S.tgtM / MK; R.hmGoal = S.tgtHM / HMK;
  R.gate = !R.hasTest ? "offen bis zum ersten Test" : (R.refHM - tg <= lead ? "grün: Zielpaces trainierbar" : "gelb: Paces automatisch gebremst");
  return R;
}
const stageOf = w => w <= 9 ? 0 : w <= 18 ? 1 : w <= 26 ? 2 : 3;
function zone(s, B, R) {
  const st = stageOf(s.w), ref = R.stages[st], p = ref / HMK, L = R.lthr, rl = R.radl, rnd = Math.round;
  const mp = st < 2 ? ref * RIEGEL / MK : Math.max(R.mpGoal, ref * RIEGEL / MK), sec = x => x / 86400;
  const rg = (a, b) => mss(p * a) + "–" + mss(p * b) + " /km";
  const easy = s.w <= 8 ? "<" + B.S.cap : "<" + rnd(L * .89);
  switch (s.code) {
    case "E": return { pace: rg(1.18, 1.3), hf: easy };
    case "LR": return { pace: rg(1.2, 1.3), hf: "<" + rnd(L * .89) };
    case "LRM": return { pace: "locker " + mss(p * 1.2) + "–" + mss(p * 1.3) + ", Blöcke " + mss(mp) + " /km", hf: "locker <" + rnd(L * .89) + ", Blöcke " + rnd(L * .9) + "–" + rnd(L * .94) };
    case "MP": return { pace: mss(mp - sec(2)) + "–" + mss(mp + sec(2)) + " /km", hf: rnd(L * .9) + "–" + rnd(L * .94) };
    case "T": return { pace: rg(.97, .99), hf: rnd(L * .95) + "–" + rnd(L * .99) };
    case "I": return { pace: rg(.9, .92), hf: "nach Pace, HF hinkt nach" };
    case "HMZ": return { pace: mss(R.hmGoal - sec(2)) + "–" + mss(R.hmGoal + sec(2)) + " /km", hf: rnd(L * .97) + "–" + rnd(L * 1.02) };
    case "MD": return { pace: mss(mp + sec(15)) + "–" + mss(mp + sec(25)) + " /km", hf: rnd(L * .88) + "–" + rnd(L * .92) };
    case "AC": return { pace: "Pace messen", hf: "konstant " + B.S.ac };
    case "TEST": return { pace: "gleichmäßig, voll", hf: "" };
    case "M": return { pace: "Ziel " + mss(R.mpGoal) + " /km", hf: rnd(L * .9) + "–" + rnd(L * .94) };
    case "R2": return { pace: "Gefühl 3–4/10, 85–95 U/min", hf: rnd(rl * .81) + "–" + rnd(rl * .89) };
    case "R3": return { pace: "Gefühl 6/10", hf: rnd(rl * .9) + "–" + rnd(rl * .93) };
    case "R4": return { pace: "Gefühl 7–8/10", hf: rnd(rl * .94) + "–" + rnd(rl * .99) };
    case "SW": return { pace: num(R.css) ? "CSS " + mss(R.css) + " /100 m" : "Technik vor Tempo", hf: "" };
    case "OW": return { pace: "mit Neo, nie allein (Begleitung oder Schwimmboje)", hf: "" };
    case "TRI": return { pace: "Rennplan", hf: "" };
    default: return { pace: "", hf: "" };
  }
}

/* ---------- Status und Kennzahlen ---------- */
const isTrain = s => !s.dropped && s.sport !== "Ruhe" && s.sport !== "Mobility";
function isHard(s) {
  if (!isTrain(s)) return false;
  if (s.test) return s.typ !== "AC";
  if (s.sport === "Lauf") return HARD_RUN.includes(s.code) || (s.code === "MD" && s.prio === "A");
  if (s.sport === "Rad") return ["R3", "R4"].includes(s.code);
  return s.sport === "Triathlon" && s.code === "TRI";
}
function sickOn(st, d, t) { const k = val(st, "sick"); if (!k || !num(k.from)) return false; const to = num(k.to) ? k.to : t; return d >= k.from && d <= to; }
/* Pausiert die Krankheit diese Einheit? Erkältung oberhalb des Halses: nein (locker erlaubt). Verletzung: nur betroffene Sportarten. Alte Einträge ohne Kategorie: ja. */
function sickPauses(st, s) { const k = val(st, "sick") || {}; if (k.cat === "hals") return false; if (k.cat === "verletzung") return injAffects(k.region, s); return true; }
function statusOf(st, s, t) { const l = val(st, "log:" + s.id); if (l && l.st) return l.st; if (s.date <= t && sickOn(st, s.date, t) && isTrain(s) && sickPauses(st, s)) return "krank"; return ""; }
function actual(st, s, t) {
  const l = val(st, "log:" + s.id) || {}, x = statusOf(st, s, t), f = x === "✓" ? 1 : x === "½" ? .5 : 0;
  if (!f) return { km: 0, min: 0 };
  const km = num(l.dist) ? l.dist : num(l.ikm) ? l.ikm : s.km * f, min = num(l.dur) ? l.dur : num(l.imin) ? l.imin : s.min * f;
  return { km, min };
}
function raceWindows(E) { return E.filter(s => s.test === "race").map(s => ({ from: s.date - (["M", "MD"].includes(s.typ) ? 12 : 4), to: s.date, name: s.name })); }
const weekOf = (B, d) => Math.floor((d - B.S.start) / 7) + 1;
const weekEnd = (B, w) => B.S.start + 7 * w - 1;

/* ---------- Bausteine für Vorschläge ---------- */
function lockerPatch(s, f, why) {
  f = f || .7;
  const km = s.km ? r1(s.km * f) : 0, min = r5((s.min || 30) * f);
  const P = { Lauf: { code: "E", name: "Lauf locker" }, Rad: { code: "R2", name: "Rad locker" }, Schwimmen: { code: "SW", name: "Schwimmen locker" }, Kraft: { code: "GYM", name: "Kraft leicht" }, Triathlon: { code: "E", name: "Locker" } }[s.sport] || { code: s.code, name: "Locker" };
  return { name: P.name + " (statt " + s.name.replace(/^★\s*/, "") + ")", code: P.code, km, min, prio: s.prio === "A" ? "B" : s.prio, time: timeRange(tStart(s.time), min),
    desc: (why ? why + " " : "") + "Ursprünglich: " + s.name + ". Nur locker, HF unter dem Deckel.", test: "", typ: "", tkey: "" };
}
function cloneTo(s, d, start, tag) {
  const id = s.id + "~" + d + (tag || "");
  return Object.assign({}, s, { id, date: d, time: timeRange(start != null ? start : tStart(s.time), s.min), movedFrom: s.date, orig: undefined, edited: false, dropped: false });
}
function inReentry(st, d) { const k = val(st, "sick"); if (!k || !num(k.from) || !num(k.to)) return false; return d > k.to && d <= k.to + sickStages(sickCat(k), k.to - k.from + 1).T; }
function findSlot(ctx, s, from, to, opts) {
  opts = opts || {};
  const { E, st, t, B } = ctx, rw = raceWindows(E), hard = isHard(s);
  const excl = new Set([s.id].concat(opts.excl || []));
  const live = x => isTrain(x) && !excl.has(x.id) && statusOf(st, x, t) !== "✗";
  for (let d = Math.max(from, t); d <= to; d++) {
    if (opts.avoid && opts.avoid(d)) continue;
    if (sickOn(st, d, t)) continue;
    if (hard && inReentry(st, d)) continue;
    if (hard && rw.some(w => d >= w.from && d <= w.to)) continue;
    if (E.some(x => x.date === d && x.trip && !x.dropped)) continue;
    if (Object.keys(st).some(k => k.startsWith("trv:") && st[k].v && !st[k].v.del && d >= st[k].v.from && d <= st[k].v.to)) continue;
    const day = E.filter(x => x.date === d && live(x));
    if (day.some(x => x.test === "race")) continue;
    if (day.some(x => x.sport === s.sport && x.prio === "A")) continue;
    const rep = day.filter(x => x.sport === s.sport && x.prio !== "A" && !x.test && !isHard(x) && !statusOf(st, x, t)).sort((a, b) => b.min - a.min)[0];
    const rest = day.filter(x => !rep || x.id !== rep.id);
    if (hard) {
      if (rest.some(isHard)) continue;
      const nb = E.filter(x => (x.date === d - 1 || x.date === d + 1) && live(x) && x.sport === s.sport && isHard(x));
      if (nb.length) continue;
    }
    if (rest.filter(x => x.sport !== "Kraft").length >= 2) continue;
    if (opts.needRep && !rep) continue;
    return { d, rep };
  }
  return null;
}
function freeStart(E, d, start, min, excl) {
  if (start == null) return start;
  const day = E.filter(x => x.date === d && !x.dropped && x.time && x.sport !== "Ruhe" && !excl.includes(x.id)).map(x => [tStart(x.time), tStart(x.time.slice(6))]).filter(x => x[0] != null);
  let s0 = start, guard = 0;
  while (guard++ < 10) { const c = day.find(([a, b]) => s0 < b && s0 + (min || 30) > a); if (!c) break; s0 = c[1] + 10; }
  return s0 + (min || 30) > 22 * 60 ? start : s0;
}
function moveOps(s, slot, note, E) {
  let start = slot.rep ? tStart(slot.rep.time) : tStart(s.time);
  if (E) start = freeStart(E, slot.d, start, s.min, [s.id].concat(slot.rep ? [slot.rep.id] : []));
  const c = cloneTo(s, slot.d, start);
  c.note = note || ("Verschoben von " + wdD(s.date) + ".");
  const ops = [{ type: "add", s: c }];
  if (slot.rep) ops.push({ type: "drop", id: slot.rep.id, note: "Ersetzt durch " + s.name + "." });
  return ops;
}
function describeOps(ops, E) {
  const byId = id => E.find(x => x.id === id);
  return ops.map(o => {
    if (o.type === "add") return wdD(o.s.date) + (o.s.time ? " " + o.s.time.slice(0, 5) : "") + ": " + o.s.name + " neu";
    const s = byId(o.id); if (!s) return "";
    if (o.type === "drop") return wdD(s.date) + ": " + s.name + " entfällt";
    if (o.type === "edit") { const nm = o.patch.name && o.patch.name !== s.name ? " → " + o.patch.name : "";
      const amt = o.patch.km != null && o.patch.km !== s.km && s.km ? " " + s.km + " → " + o.patch.km + " km" : o.patch.min != null && o.patch.min !== s.min ? " " + s.min + " → " + o.patch.min + " min" : "";
      return wdD(s.date) + ": " + s.name + nm + (nm && amt ? "," : nm ? "" : ":") + amt; }
    return "";
  }).filter(Boolean);
}

/* ---------- Krankheit und Reise: Kataloge (Kategorien statt Diagnosen) ---------- */
const SICK_CAT = {
  hals: { lab: "Erkältung nur oberhalb des Halses", short: "Erkältung", sub: "Schnupfen, Halskratzen, kein Fieber", rule: "Erkältung ohne Fieber: locker ist meist möglich, harte Reize erst nach dem Abklingen." },
  infekt: { lab: "Fieber oder Infekt mit Allgemeinsymptomen", short: "Infekt", sub: "Fieber, Gliederschmerzen, Husten, Abgeschlagenheit", rule: "Infekt: erst 24 Stunden fieberfrei ohne fiebersenkende Mittel, dann stufenweise, mindestens 5 Tage." },
  magen: { lab: "Magen-Darm", short: "Magen-Darm", sub: "Übelkeit, Erbrechen, Durchfall", rule: "Magen-Darm: erst wieder normal essen und trinken, Flüssigkeit und Salz auffüllen, dann locker beginnen." },
  verletzung: { lab: "Verletzung oder Schmerz", short: "Verletzung", sub: "Mit Körperregion", rule: "Verletzung: nur schmerzfreie Belastung, betroffene Sportarten zuerst ersetzen, dann stufenweise zurück." },
  sonst: { lab: "Sonstiges", short: "Sonstiges", sub: "Pause nach Gefühl", rule: "Sonstiges: Pause, danach etwa 2 Tage locker pro Krankheitstag, höchstens eine Woche." }
};
const FLAGS = { fieber39: "Fieber über 39 °C oder länger als 3 Tage", brust: "Brustschmerz, Herzstolpern oder Atemnot", trinken: "Kann nicht trinken, Blut im Stuhl oder Durchfall länger als 3 Tage",
  ausstr: "Taubheit, Kribbeln oder ausstrahlender Schmerz", nacht: "Schmerz in Ruhe oder nachts", last: "Starke Schwellung oder Belasten nicht möglich" };
const FLAGS_BY = { hals: ["fieber39", "brust"], infekt: ["fieber39", "brust"], magen: ["trinken", "fieber39"], verletzung: ["ausstr", "nacht", "last"], sonst: ["brust", "fieber39"] };
const REGIONS = {
  fuss: { lab: "Fuß oder Sprunggelenk", leg: true, aff: ["Lauf", "Triathlon"], alt: "Rad" },
  wade: { lab: "Wade oder Achillessehne", leg: true, aff: ["Lauf", "Triathlon"], alt: "Rad" },
  knie: { lab: "Knie", leg: true, aff: ["Lauf", "Rad", "Triathlon"], alt: "Schwimmen" },
  huefte: { lab: "Hüfte, Leiste oder Oberschenkel", leg: true, aff: ["Lauf", "Rad", "Triathlon"], alt: "Schwimmen" },
  ruecken: { lab: "Rücken", leg: false, aff: ["Lauf", "Rad", "Kraft", "Triathlon"], alt: "Mobility" },
  schulter: { lab: "Schulter, Arm oder Nacken", leg: false, aff: ["Schwimmen", "Kraft"], alt: "Mobility" },
  sonst: { lab: "Andere Region", leg: false, aff: ["Lauf", "Rad", "Schwimmen", "Kraft", "Triathlon"], alt: "" }
};
const sickCat = sk => (sk && SICK_CAT[sk.cat]) ? sk.cat : "sonst";
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
/* Stufen-Wiedereinstieg: Gesamtdauer je Kategorie, geteilt in ca. 30 / 40 / 30 %. Eigene Regel, angelehnt an den gestuften, symptomgeführten Ansatz im IOC-Konsens 2022. */
function sickStages(cat, days) {
  const T = cat === "hals" ? clamp(days + 1, 2, 7) : cat === "infekt" ? clamp(2 * days, 5, 14) : cat === "magen" ? clamp(days + 2, 3, 7) : cat === "verletzung" ? clamp(2 * days, 4, 14) : clamp(2 * days, 2, 7);
  const s1 = Math.max(1, Math.round(T * .3)), s2 = Math.max(1, Math.round(T * .4)), s3 = Math.max(0, T - s1 - s2);
  return { T, s1, s2, s3 };
}
function injAffects(region, s) { const R = REGIONS[region] || REGIONS.sonst; return isTrain(s) && R.aff.includes(s.sport); }
function injAlt(region, s) {
  const R = REGIONS[region] || REGIONS.sonst, m = Math.min(s.min || 30, 60), base = { test: "", typ: "", tkey: "", km: 0, prio: s.prio === "A" ? "B" : s.prio, time: timeRange(tStart(s.time), m), min: m };
  const was = " (statt " + s.name.replace(/^★\s*/, "") + ")", pf = " Nur wenn schmerzfrei (höchstens 2 von 10, am nächsten Morgen nicht schlimmer), sonst streichen.";
  if (R.alt === "Rad" && s.sport !== "Rad") return { type: "edit", id: s.id, patch: Object.assign(base, { sport: "Rad", code: "R2", name: "Rad locker" + was, desc: "Alternative bei Beschwerden an " + R.lab + ": locker, gleichmäßig, Indoor-Bike geht auch." + pf }), note: "Verletzung: Alternative." };
  if (R.alt === "Schwimmen" && s.sport !== "Schwimmen") return { type: "edit", id: s.id, patch: Object.assign(base, { sport: "Schwimmen", code: "SW", name: "Schwimmen mit Pullbuoy" + was, desc: "Alternative bei Beschwerden an " + R.lab + ": Armzug mit Pullbuoy, kein Beinschlag, kein Brustschwimmen." + pf }), note: "Verletzung: Alternative." };
  if (s.sport === "Kraft") return { type: "edit", id: s.id, patch: Object.assign(base, { name: "Kraft ohne betroffene Region" + was, desc: "Nur Übungen, die " + R.lab + " nicht belasten." + pf }), note: "Verletzung: angepasst." };
  return { type: "edit", id: s.id, patch: Object.assign(base, { sport: "Mobility", code: "MOB", name: "Mobility oder Spaziergang 20–30'" + was, min: 30, time: timeRange(tStart(s.time), 30), desc: "Bewegung ohne Schmerz hält die Routine." + pf }), note: "Verletzung: Pause der Sportart." };
}
function longestDone(E, st, t, a, b) {
  const pl = E.filter(s => s.sport === "Lauf" && s.date >= a && s.date <= b).map(s => { const x = statusOf(st, s, t); return x === "✓" || x === "½" ? actual(st, s, t).km : 0; });
  const fr = freeList(st).filter(f => f.sport === "Lauf" && f.date >= a && f.date <= b).map(f => f.dist || 0);
  return Math.max(0, ...pl, ...fr);
}
/* Erster Long Run nach einer Pause: nicht länger als der längste Lauf davor, ab 7 Tagen Pause höchstens 80 % davon (eigene Ableitung aus Frandsen et al. 2025). */
function lrRampOp(ctx, since, from, to, why) {
  const { E, st, t } = ctx;
  const nx = E.find(s => s.date >= Math.max(from, t) && s.date <= to && s.sport === "Lauf" && (s.code === "LR" || s.code === "LRM") && s.km >= 12 && isTrain(s) && !statusOf(st, s, t));
  if (!nx) return null;
  const ref = longestDone(E, st, t, since - 30, since - 1); if (!ref) return null;
  const long = from - since >= 7, cap = Math.round(ref * (long ? .8 : 1));
  if (nx.km <= cap) return null;
  const min = r5(nx.min * cap / nx.km);
  return { type: "edit", id: nx.id, patch: { km: cap, min, name: "Long Run " + cap + " km (statt " + nx.km + ")", time: timeRange(tStart(nx.time), min) }, note: "Erster Long Run " + why + ": höchstens " + (long ? "80 % des" : "so lang wie der") + " längsten Laufs davor." };
}
/* Geplanter Sprung beim Long Run gegenüber dem längsten geplanten Lauf der 30 Tage davor (nur Hinweis). */
function lrSpike(E, s) {
  if (!s || s.sport !== "Lauf" || !["LR", "LRM", "M"].includes(s.code) || !(s.km >= 12)) return null;
  const ref = Math.max(0, ...E.filter(x => x.sport === "Lauf" && !x.dropped && x.date >= s.date - 30 && x.date < s.date).map(x => x.km || 0));
  return ref && s.km > ref * 1.1 ? { ref, pct: s.km / ref - 1 } : null;
}
const EQ_LAB = { gym: "Fitnessraum", tread: "Laufband", pool: "Pool", route: "Laufstrecke in der Nähe" };
function tripEq(tr) { if (!tr.eq) return { gym: true, tread: true, pool: true, route: false, legacy: true }; const e = tr.eq; return { gym: !!e.gym, tread: !!e.tread, pool: !!e.pool, route: !!e.route }; }
function eqText(eq) { const a = Object.keys(EQ_LAB).filter(k => eq[k]).map(k => EQ_LAB[k]); return a.length ? a.join(", ") : "nur Zimmer"; }
const SUBS = {
  outdoorQ: "Vor Ort draußen: Strecke vorher auf der Karte prüfen (flach, sicher, beleuchtet). Hauptteil nach HF und Gefühl statt nach Pace, Reisemüdigkeit und fremde Strecke kosten Tempo.",
  treadQ: "Laufband: 10' ein, Hauptteil auf 1 % Steigung, 10' aus. Pace nach Gefühl, HF zählt.",
  treadEasy: "Laufband locker, 1 % Steigung, HF unter dem Deckel.",
  outdoorEasy: "Locker draußen, HF unter dem Deckel. Runde vorher auf der Karte planen.",
  outdoorLR: "Long Run vor Ort: Runde mit Wasserstelle planen oder Flasche mitnehmen. Nach später Anreise lieber 10 % kürzer.",
  roomCardio: "Zimmer-Zirkel 20': 5' Mobilisation, dann 3 Runden mit 40 s Belastung und 20 s Pause: Kniebeugen, Ausfallschritte im Wechsel, Hampelmann, Bergsteiger, Liegestütz, Plank. Ersetzt den Laufreiz nicht, hält aber Routine und Kraft.",
  room: "Zimmer 20': Split Squat, einbeinige Brücke, Wadenheben einbeinig, Liegestütz, Plank, Dead Bug.",
  gym: "Hotel-Gym 30': Kniebeuge mit Kurzhanteln, Split Squat, RDL, Wadenheben, Rudern.",
  ergo: "Ergometer im Fitnessraum: bis 60', Intensität nach den HF-Zonen Rad. Intervalle nur, wenn sich der Widerstand fein regeln lässt.",
  pool: "Hotelpool: 20–30' Technik (Abschlag, Seitlage, Atmung). Bahnlänge egal, keine Zeiten."
};

/* ---------- Anpassungsvorschläge ---------- */
function proposals(B, st, t) {
  const E = effective(B, st), ctx = { B, st, t, E }, out = [];
  const touched = new Set();
  const baseId = o => o.type === "add" ? String(o.s.id).split("~")[0] : o.id;
  const add = p => { if (resolved(st, p.key)) return;
    const had = (p.ops || []).length, seen = new Set();
    /* Konflikte: Einheiten, die ein wichtigerer Vorschlag schon ändert, bleiben bei diesem. Der Rest des Vorschlags gilt weiter. */
    p.ops = (p.ops || []).filter(o => { const k = o.type + ":" + (o.type === "add" ? o.s.id : o.id); if (seen.has(k)) return false; seen.add(k); return !touched.has(baseId(o)); });
    if (had && !p.ops.length) return;
    p.ops.forEach(o => { if (o.type !== "add") touched.add(o.id); }); p.lines = describeOps(p.ops, E); out.push(p); };
  const open = s => isTrain(s) && !statusOf(st, s, t) && s.test !== "race";
  const rw = raceWindows(E), inTaper = d => rw.some(w => d >= w.from && d <= w.to);
  const ex = B.extras["Hotel-Varianten"] || [];
  const hv = i => (ex[i] || ["", ""]);

  // 1 Körpersignale aus dem Sonntags-Check-in
  const cw = weekOf(B, t), base = num(B.S.rest) ? B.S.rest : 60;
  let strained = false;
  for (const w of [cw, cw - 1]) {
    const c = val(st, "chk:" + w); if (!c) continue;
    const red = (num(c.puls) && c.puls >= base + 8) || c.feel === 1 || (num(c.pain) && c.pain >= 5);
    const yel = (num(c.puls) && c.puls >= base + 5) || c.feel === 2 || (num(c.pain) && c.pain >= 3);
    if (red || yel) strained = true;
    if (red) {
      const ops = [], nx = E.filter(s => s.date >= t && s.date < t + 3 && open(s) && isHard(s));
      nx.forEach(s => { if (s.test) { const sl = findSlot(ctx, s, t + 4, t + 12, { needRep: true }); ops.push({ type: "drop", id: s.id, note: "Test verschoben: erst erholt testen." }); if (sl) ops.push(...moveOps(s, sl, "Test nach Erholung verschoben.", E)); }
        else ops.push({ type: "edit", id: s.id, patch: lockerPatch(s, .7, "Erholung nach Check-in."), note: "Check-in W" + w + " rot." }); });
      if (num(c.pain) && c.pain >= 5) E.filter(s => s.date >= t && s.date < t + 7 && open(s) && s.sport === "Lauf" && !nx.includes(s)).forEach(s => ops.push({ type: "drop", id: s.id, note: "Laufpause bis ärztlich abgeklärt. Rad und Schwimmen nur schmerzfrei." }));
      if (ops.length) add({ key: "sig:" + w + ":r", sev: "bad", title: "Körpersignale rot: 3 Tage nur locker",
        why: (num(c.pain) && c.pain >= 5 ? B.painLabel + " " + c.pain + "/10: Laufpause und ärztlich abklären. " : "") + "Ruhepuls " + (c.puls ?? "–") + " (Normal " + base + "), Gefühl " + (c.feel ?? "–") + "/5. Harte Einheiten der nächsten 3 Tage werden locker.", ops });
    } else if (yel) {
      const ops = [], nx = E.find(s => s.date >= t && s.date < t + 4 && open(s) && isHard(s) && !s.test);
      if (nx) ops.push({ type: "edit", id: nx.id, patch: lockerPatch(nx, .8, "Warnsignal im Check-in."), note: "Check-in W" + w + " gelb." });
      if (num(c.pain) && c.pain >= 3) E.filter(s => s.date >= t && s.date < t + 7 && open(s) && s.sport === "Lauf" && s.code === "I" && (!nx || s.id !== nx.id)).forEach(s => ops.push({ type: "edit", id: s.id, patch: lockerPatch(s, .8, "Keine Intervalle bei Schmerz."), note: "" }));
      if (ops.length) add({ key: "sig:" + w + ":y", sev: "warn", title: "Warnsignal: nächste harte Einheit locker", why: "Ruhepuls " + (c.puls ?? "–") + ", Gefühl " + (c.feel ?? "–") + "/5" + (num(c.pain) ? ", " + B.painLabel + " " + c.pain + "/10" : "") + ". Eine Einheit entschärfen kostet nichts, ein Infekt oder eine Reizung kostet Wochen.", ops });
    }
    break;
  }

  // 3 Reisen (Dienstreise mit Ausstattung; alte Einträge ohne Ausstattung gelten als voll ausgestattet)
  Object.keys(st).filter(k => k.startsWith("trv:")).forEach(k => {
    const tr = st[k].v; if (!tr || tr.del || !num(tr.from) || tr.to < t) return;
    const eq = tripEq(tr), inTr = d => d >= tr.from && d <= tr.to, ops = [], used = [];
    const travelDay = d => !!tr.eq && (d === tr.from || d === tr.to);
    const tryMove = s => { const sl = findSlot(ctx, s, Math.max(t, tr.from - 3), tr.to + 4, { avoid: d => inTr(d) || used.includes(d) || used.some(u => Math.abs(u - d) === 1 && isHard(s)) }); if (!sl) return false; used.push(sl.d); ops.push({ type: "drop", id: s.id, note: "Reise: verschoben." }, ...moveOps(s, sl, "Wegen Reise verschoben.", E)); return true; };
    const ed = (s, p, note) => ops.push({ type: "edit", id: s.id, patch: Object.assign({ test: "", typ: "", tkey: "" }, p, p.min ? { time: timeRange(tStart(s.time), p.min) } : {}), note: note || "Reise." });
    const drop = (s, note) => ops.push({ type: "drop", id: s.id, note: note || "Reise." });
    E.filter(s => inTr(s.date) && s.date >= t && open(s)).forEach(s => {
      const d = s.date, td = travelDay(d), hard = isHard(s), lr = s.code === "LR" || s.code === "LRM";
      if (s.test) { const sl = findSlot(ctx, s, tr.to + 1, tr.to + 7, { needRep: s.typ !== "AC", avoid: d => used.includes(d) }); drop(s); if (sl) { used.push(sl.d); ops.push(...moveOps(s, sl, "Test nach der Reise.", E)); } return; }
      if (s.sport === "Lauf") {
        if (lr) { if (eq.route && !td) return ed(s, { name: s.name.replace(/^★\s*/, "") + " (vor Ort draußen)", desc: SUBS.outdoorLR + " " + s.desc });
          if (s.prio === "A" && tryMove(s)) return;
          if (eq.tread && !td) { const m = Math.min(s.min, 60); return ed(s, { name: "Laufband: Lauf locker " + m + "'", code: "E", min: m, km: r1(m / 5.8), desc: SUBS.treadEasy }); }
          return drop(s, "Reise: Long Run nicht möglich, nicht nachholen."); }
        if (hard) { if (!td && (eq.route || eq.tread)) return ed(s, { name: (eq.route ? "Vor Ort: " : "Laufband: ") + s.name.replace(/^★\s*/, ""), desc: (eq.route ? SUBS.outdoorQ : SUBS.treadQ) + " " + s.desc });
          if (s.prio === "A" && tryMove(s)) return;
          if (eq.route || eq.tread) return ed(s, lockerPatch(s, Math.min(1, 30 / (s.min || 30)), "Reisetag: nur kurz und locker."));
          return ed(s, { sport: "Kraft", code: "GYM", name: "Zimmer-Zirkel 20' (statt " + s.name.replace(/^★\s*/, "") + ")", min: 20, km: 0, prio: "B", desc: SUBS.roomCardio }); }
        if (eq.route || eq.tread) { const m = Math.min(s.min, td ? 30 : 45); return ed(s, { name: "Hotel: Lauf locker " + m + "' (" + (eq.route ? "draußen" : "Laufband") + ")", code: "E", min: m, km: r1(m / 5.9), desc: eq.route ? SUBS.outdoorEasy : SUBS.treadEasy }); }
        if (s.prio === "C" || td) return drop(s);
        return ed(s, { sport: "Kraft", code: "GYM", name: "Zimmer-Zirkel 20' (statt Lauf locker)", min: 20, km: 0, desc: SUBS.roomCardio });
      }
      if (s.sport === "Rad") { if (s.prio === "A" && tryMove(s)) return;
        if (eq.gym && !td) { const m = Math.min(s.min, 60); return ed(s, { name: "Ergometer im Fitnessraum " + m + "'", min: m, km: 0, desc: SUBS.ergo + " Ursprünglich: " + s.name + "." }); }
        return drop(s, "Reise: kein Rad vor Ort."); }
      if (s.sport === "Schwimmen") { if (s.prio === "A" && tryMove(s)) return;
        if (eq.pool && !td) return ed(s, { name: "Hotelpool: Technik 20–30'", min: 30, km: .8, desc: hv(4)[1] || SUBS.pool });
        return drop(s, "Reise: kein Pool."); }
      if (s.sport === "Kraft") { if (td && s.prio === "C") return drop(s);
        if (eq.gym && !td) return ed(s, { name: "Hotel-Gym 30'", min: 30, desc: hv(2)[1] || SUBS.gym });
        return ed(s, { name: "Zimmer-Kraft 20'", min: 20, desc: hv(3)[1] || SUBS.room }); }
      if (s.prio === "A" && tryMove(s)) return;
      drop(s);
    });
    const long = tr.to - tr.from + 1 >= 5 && !eq.route && !eq.tread;
    if (long) { const r = lrRampOp(ctx, tr.from, tr.to + 1, tr.to + 14, "nach der Reise"); if (r) ops.push(r); }
    const lab = tr.eq && tr.kind !== "privat" ? " (dienstlich)" : "";
    if (ops.length) add({ key: "trv:" + k.slice(4) + ":" + tr.from + "-" + tr.to, sev: "info", title: "Reise " + fmtD(tr.from) + "–" + fmtD(tr.to) + lab + ": Plan umbauen", sub: tr.place ? String(tr.place).slice(0, 40) : "",
      why: (tr.eq ? "Vor Ort: " + eqText(eq) + ". " : "") + "Schlüsseleinheiten bleiben vor Ort, wenn die Ausstattung passt, sonst auf einen Tag ohne Reise. " + (tr.eq ? "An- und Abreisetag nichts Hartes. " : "") + "Rad wird zum Ergometer oder fällt aus, Tests kommen nach der Reise. Nichts nachholen." + (long ? " Danach kein Sprung beim Long Run." : ""), ops });
  });

  // 2 Krankheit: während der Erkrankung (Kategorie hals/verletzung) und danach Wiedereinstieg in Stufen
  const sk = val(st, "sick");
  if (sk && num(sk.from)) {
    const cat = sickCat(sk), C0 = SICK_CAT[cat], flags = (sk.flags || []).filter(f => FLAGS[f]);
    if ((flags.length || cat === "infekt") && (!num(sk.to) || t <= sk.to + 7)) add({ key: "sickdoc:" + sk.from + ":" + flags.join(","), sev: "bad", kind: "info", title: flags.length ? "Bitte ärztlich abklären" : "Bei Fieber: kein Training",
      why: (flags.length ? "Du hast Warnzeichen angegeben (" + flags.map(f => FLAGS[f]).join("; ") + "). Lass das ärztlich abklären, bevor du wieder trainierst. " : "") + "Mit Fieber oder Allgemeinsymptomen nicht trainieren: Ein Infekt kann den Herzmuskel mitbetreffen. Bei Brustschmerz, Herzstolpern oder Atemnot sofort ärztlich abklären. Die App stellt keine Diagnose.", ops: [] });
    if (!num(sk.to)) {
      const ops = [], usedH = [];
      if (cat === "hals") E.filter(s => s.date >= t && s.date < t + 3 && open(s) && (isHard(s) || s.min > 45)).forEach(s => {
        if (s.test) { ops.push({ type: "drop", id: s.id, note: "Test erst nach der Erkältung." }); const sl = findSlot(ctx, s, t + 5, t + 14, { needRep: true, avoid: d => usedH.includes(d) }); if (sl) { usedH.push(sl.d); ops.push(...moveOps(s, sl, "Test nach Erkältung verschoben.", E)); } return; }
        ops.push({ type: "edit", id: s.id, patch: lockerPatch(s, Math.min(.7, 45 / (s.min || 45)), "Erkältung: nur locker, höchstens 45 Minuten."), note: "Erkältung." }); });
      if (cat === "verletzung") E.filter(s => s.date >= t && s.date < t + 7 && open(s) && injAffects(sk.region, s)).forEach(s => ops.push(injAlt(sk.region, s)));
      if (ops.length) add({ key: "sickact:" + sk.from + ":" + t, sev: "warn", title: cat === "hals" ? "Erkältung: nächste 3 Tage nur locker" : "Verletzung: betroffene Einheiten ersetzen",
        why: cat === "hals" ? "Symptome nur oberhalb des Halses und kein Fieber: lockeres Training ist meist möglich, harte Reize nicht. Wandern die Symptome nach unten (Husten, Gliederschmerzen) oder kommt Fieber dazu, Kategorie auf Infekt ändern und pausieren."
          : "Belastung, die schmerzt, verlängert die Pause. Alternativen nur, wenn sie schmerzfrei gehen (Schmerz höchstens 2 von 10, am nächsten Morgen nicht schlimmer). Hält der Schmerz länger als ein paar Tage an, physiotherapeutisch oder ärztlich abklären.", ops });
    } else {
      const days = sk.to - sk.from + 1, P0 = sickStages(cat, days), from = Math.max(t, sk.to + 1), to = sk.to + P0.T, ops = [];
      let firstHard = false; const usedS = [];
      E.filter(s => s.date >= from && s.date <= to && open(s)).forEach(s => {
        if (s.test) { const sl = findSlot(ctx, s, to + 1, to + 10, { needRep: true, avoid: d => usedS.includes(d) }); ops.push({ type: "drop", id: s.id, note: "Test nach dem Wiedereinstieg." }); if (sl) { usedS.push(sl.d); ops.push(...moveOps(s, sl, "Test nach Krankheit verschoben.", E)); } return; }
        if (cat === "verletzung" && !injAffects(sk.region, s)) return;
        const i = s.date - sk.to, stg = i <= P0.s1 ? 1 : i <= P0.s1 + P0.s2 ? 2 : 3, lr = s.code === "LR" || s.code === "LRM", leg = cat === "verletzung" && REGIONS[sk.region] && REGIONS[sk.region].leg;
        if (stg === 1) {
          if (s.prio === "C") { ops.push({ type: "drop", id: s.id, note: "Wiedereinstieg Stufe 1." }); return; }
          const m = Math.min(r5(s.min * .5), 40);
          if (leg && s.sport === "Lauf") { ops.push({ type: "edit", id: s.id, patch: { name: "Laufen und Gehen im Wechsel " + m + "'", code: "E", prio: "B", min: m, km: r1(m / 6.5), time: timeRange(tStart(s.time), m), desc: "Wiedereinstieg Stufe 1: 4 Minuten locker laufen, 1 Minute gehen, wiederholen. Nur schmerzfrei (höchstens 2 von 10, am nächsten Morgen nicht schlimmer). Ursprünglich: " + s.name + ".", test: "", typ: "", tkey: "" }, note: "Stufe 1." }); return; }
          ops.push({ type: "edit", id: s.id, patch: Object.assign(lockerPatch(s, m / (s.min || 30), "Wiedereinstieg Stufe 1: sehr locker und kurz."), { min: m, time: timeRange(tStart(s.time), m) }), note: "Stufe 1." }); return;
        }
        if (stg === 2) {
          if (isHard(s) || lr) ops.push({ type: "edit", id: s.id, patch: lockerPatch(s, lr ? .6 : .7, "Wiedereinstieg Stufe 2: locker, noch keine harten Reize."), note: "Stufe 2." });
          else if (s.min > 30) ops.push({ type: "edit", id: s.id, patch: { min: r5(s.min * .75), km: s.km ? r1(s.km * .75) : 0, time: timeRange(tStart(s.time), r5(s.min * .75)) }, note: "Stufe 2: 75 %." });
          return;
        }
        if (lr) { ops.push({ type: "edit", id: s.id, patch: { min: r5(s.min * .7), km: s.km ? r1(s.km * .7) : 0, name: s.name.replace(/^★\s*/, "") + " (70 %)", time: timeRange(tStart(s.time), r5(s.min * .7)) }, note: "Stufe 3: Long Run 70 %." }); return; }
        if (isHard(s) && !firstHard) { firstHard = true; ops.push({ type: "edit", id: s.id, patch: { min: r5(s.min * .8), km: s.km ? r1(s.km * .8) : 0, time: timeRange(tStart(s.time), r5(s.min * .8)) }, note: "Stufe 3: erste harte Einheit, 80 %." }); return; }
        if (isHard(s)) ops.push({ type: "edit", id: s.id, patch: lockerPatch(s, .75, "Wiedereinstieg Stufe 3: nur eine harte Einheit."), note: "Stufe 3." });
      });
      if (days >= 3) { const r = lrRampOp(ctx, sk.from, to + 1, to + 14, "nach Krankheit"); if (r) ops.push(r); }
      const race = E.find(s => s.test === "race" && s.date >= from && s.date <= to + 3);
      if (t <= to) add({ key: "sick:" + sk.from, sev: "warn", title: "Wiedereinstieg in Stufen: " + P0.T + " Tage", why: days + " Krankheitstag" + (days > 1 ? "e" : "") + " (" + C0.short + "). " + C0.rule + " Stufe 1 (" + P0.s1 + " T.): sehr locker und kurz. Stufe 2 (" + P0.s2 + " T.): locker, keine harten Reize." + (P0.s3 ? " Stufe 3 (" + P0.s3 + " T.): eine harte Einheit mit 80 %." : "") + " Verpasstes wird nicht nachgeholt, Tests kommen nach dem Wiedereinstieg. Verschlechtern sich die Symptome, eine Stufe zurück." + (race ? " Rennen im Zeitraum: nur starten, wenn ganz fit, im Zweifel ärztlich abklären." : ""), ops });
    }
  }

  // 4 Verpasste Einheiten
  const gapWin = E.filter(s => s.date >= t - 10 && s.date < t && isTrain(s) && (s.prio === "A" || s.prio === "B") && !sickOn(st, s.date, t));
  const gapMiss = gapWin.filter(s => statusOf(st, s, t) === "✗"), gapPm = gapWin.reduce((a, s) => a + s.min, 0), gapMm = gapMiss.reduce((a, s) => a + s.min, 0);
  const isGap = gapMiss.length >= 3 && gapPm >= 180 && gapMm >= .5 * gapPm;
  if (isGap) { /* Lücke: Einzelvorschläge entfallen, Block 5 übernimmt */ } else
  E.forEach(s => {
    const l = val(st, "log:" + s.id); if (!l || l.st !== "✗" || !isTrain(s) || s.test === "race" || s.added || s.date < t - 7) return;
    const why = l.why || "zeit";
    if (why === "krank") return;
    if (why === "muede") {
      const nx = E.find(x => x.date > s.date && x.date >= t && x.date <= Math.max(t, s.date) + 3 && open(x) && isHard(x));
      if (nx) add({ key: "tired:" + s.id, sev: "warn", title: "Müde oder Schmerz: " + nx.name + " locker", why: "Du hast " + s.name + " wegen Müdigkeit oder Schmerz ausgelassen. Die nächste harte Einheit wird locker, damit aus einem Tag Pause keine Woche wird.", ops: [{ type: "edit", id: nx.id, patch: lockerPatch(nx, .75, "Nach Müdigkeit oder Schmerz."), note: "" }] });
      return;
    }
    if (s.prio !== "A") return;
    const key = "miss:" + s.id;
    if (s.code === "LR" || s.code === "LRM") { add({ key, sev: "info", kind: "info", title: s.name + " fällt weg", why: "Ein langer Lauf passt nicht sinnvoll in die restliche Woche, die Regel lautet: nicht nachholen. Den nächsten langen Lauf deckelt die App, falls der Sprung zu groß wird (höchstens +3 km zum letzten erledigten).", ops: [] }); return; }
    if (inTaper(s.date) || inTaper(t)) { add({ key, sev: "info", kind: "info", title: s.name + " fällt weg (Taper)", why: "So kurz vor dem Rennen wird nichts nachgeholt. Frische schlägt Fitness.", ops: [] }); return; }
    if (strained && !s.test) { add({ key, sev: "info", kind: "info", title: s.name + " fällt weg", why: "Dein Check-in zeigt Warnsignale. Jetzt nichts nachholen, Erholung geht vor.", ops: [] }); return; }
    const lim = s.test ? t + 7 : Math.min(Math.max(weekEnd(B, s.w), s.date + 3), t + 5);
    const sl = findSlot(ctx, s, s.date + 1, lim, { needRep: !!s.test && s.typ !== "AC" ? false : false });
    if (sl) add({ key, sev: "info", title: s.name + " auf " + WDL[sd(sl.d).getUTCDay()] + " schieben", why: (s.test ? "Tests steuern deine Paces und Zonen, deshalb holen wir ihn nach. " : "Schlüsseleinheit, und es gibt einen freien Tag ohne harte Einheit daneben. ") + (sl.rep ? "Dafür entfällt " + sl.rep.name + ", der Umfang bleibt gleich." : ""), ops: moveOps(s, sl, undefined, E) });
    else add({ key, sev: "info", kind: "info", title: s.name + " fällt weg", why: "Kein freier Tag ohne harte Einheit daneben bis " + wdD(lim) + ". Regel: nicht nachholen, Woche normal fortsetzen.", ops: [] });
  });

  // 5 Große Lücke: Wiedereinstieg mit weniger Umfang
  {
    const pm = gapPm, mm = gapMm;
    if (isGap) {
      const ops = []; let keep = false;
      E.filter(s => s.date >= t && s.date < t + 7 && open(s) && !s.test).forEach(s => {
        if (isHard(s) && !keep && s.code !== "LR") { keep = true; ops.push({ type: "edit", id: s.id, patch: { min: r5(s.min * .8), km: s.km ? r1(s.km * .8) : 0, time: timeRange(tStart(s.time), r5(s.min * .8)) }, note: "Wiedereinstieg: einzige harte Einheit, 80 %." }); }
        else if (isHard(s) && s.code !== "LR") ops.push({ type: "edit", id: s.id, patch: lockerPatch(s, .75, "Wiedereinstieg nach Lücke."), note: "" });
        else if (s.min >= 30) ops.push({ type: "edit", id: s.id, patch: { min: r5(s.min * .75), km: s.km ? r1(s.km * .75) : 0, time: timeRange(tStart(s.time), r5(s.min * .75)) }, note: "Wiedereinstieg: 75 %." });
      });
      if (ops.length) add({ key: "gap:" + weekOf(B, t), sev: "warn", title: "Lücke erkannt: 7 Tage mit 75 % Umfang", why: Math.round(mm / pm * 100) + " % der Trainingszeit der letzten 10 Tage ausgefallen. Volle Last direkt nach einer Lücke ist der häufigste Verletzungsauslöser (Lastsprung). Eine Woche mit 75 % Umfang und nur einer harten Einheit, danach wieder Plan.", ops });
    }
  }

  // 6 Long-Run-Sprung: Hinweis mit Vorschlag, wenn der nächste lange Lauf > 10 % über dem längsten erledigten Lauf der letzten 30 Tage liegt (Frandsen et al. 2025)
  {
    const nx = E.find(s => s.date >= t && s.date <= t + 14 && open(s) && s.sport === "Lauf" && (s.code === "LR" || s.code === "LRM") && s.km >= 15);
    if (nx) {
      const prev = E.filter(s => s.date >= nx.date - 30 && s.date < t && s.sport === "Lauf" && isTrain(s) && !sickOn(st, s.date, t));
      const logged = prev.some(s => statusOf(st, s, t)) || freeList(st).some(f => f.sport === "Lauf" && f.date >= nx.date - 30 && f.date < t);
      if (logged) {
        const best = longestDone(E, st, t, nx.date - 30, t - 1);
        const cap = best > 0 ? Math.max(12, Math.round(best * 1.1)) : Math.max(12, Math.round(nx.km * .6));
        if (nx.km > cap) {
          const min = r5(nx.min * cap / nx.km);
          add({ key: "lrcap:" + nx.id + ":" + cap, sev: "info", title: "Long Run: Sprung " + (best ? "+" + Math.round((nx.km / best - 1) * 100) + " %" : "ohne Vorlauf") + ", Vorschlag " + cap + " km",
            why: (best > 0 ? "Dein längster erledigter Lauf der letzten 30 Tage: " + r1(best) + " km. " : "In den letzten 30 Tagen wurde kein Lauf erledigt. ") + "Geplant sind " + nx.km + " km. In einer Kohorte mit 5.200 Läufern stieg das Überlastungsrisiko, wenn ein einzelner Lauf mehr als 10 % über dem längsten der letzten 30 Tage lag (Frandsen et al. 2025, Beobachtungsstudie). Du entscheidest: übernehmen oder Plan lassen.",
            ops: [{ type: "edit", id: nx.id, patch: { km: cap, min, name: "Long Run " + cap + " km (statt " + nx.km + ")", time: timeRange(tStart(nx.time), min) }, note: "Höchstens +10 % zum längsten Lauf der letzten 30 Tage." }] });
        }
      }
    }
  }
  const order = { bad: 0, warn: 1, info: 2 };
  return out.sort((a, b) => order[a.sev] - order[b.sev]);
}

function manualMove(ctx, s, d) {
  const ops = [{ type: "drop", id: s.id, note: "Verschoben auf " + wdD(d) + "." }, { type: "add", s: Object.assign(cloneTo(s, d, tStart(s.time), "m"), { note: "Von " + wdD(s.date) + " verschoben." }) }];
  return { key: "man:" + s.id + ":" + d + ":" + Date.now(), title: s.name + " auf " + wdD(d), why: "Manuell verschoben.", ops };
}
function manualDrop(s) { return { key: "mand:" + s.id + ":" + Date.now(), title: s.name + " gestrichen", why: "Manuell gestrichen.", ops: [{ type: "drop", id: s.id, note: "Manuell gestrichen." }] }; }


/* ---------- v2: Belastung, Formkurve, VO2max/VDOT, freie Einheiten, Statistiken ---------- */
/* Geschätzte Anstrengung (RPE 1–10) je Code für geplante Einheiten und für Einträge ohne RPE. Annahme, im Info-Sheet offengelegt. */
const RPE_EST = { E: 3, LR: 4, LRM: 6, MP: 6, T: 7, I: 8, HMZ: 8, MD: 6, AC: 4, TEST: 9, M: 9, R2: 3, R3: 6, R4: 7, SW: 4, OW: 5, TRI: 8, GYM: 5, MOB: 2 };
const LOAD_SCALE = 10;           // Punkte = sRPE / 10, damit Werte handlich bleiben
const TRIMP_TO_SRPE = 2.5;       // grobe Angleichung Banister-TRIMP an sRPE-Skala (Annahme)
function estRpe(s) { if (s.test === "race") return 9; return RPE_EST[s.code] || (s.sport === "Kraft" ? 5 : s.sport === "Mobility" ? 2 : 4); }
/* Foster 2001: Session-RPE = Dauer (min) × RPE. Banister 1991: TRIMP = Dauer × HRr × 0,64 × e^(1,92 × HRr) (Männer). */
function sessionLoad(dur, rpe, hf, S) {
  if (!num(dur) || dur <= 0) return 0;
  if (num(rpe) && rpe > 0) return dur * rpe / LOAD_SCALE;
  if (num(hf) && num(S.rest) && num(S.hfmax) && S.hfmax > S.rest) {
    const r = Math.max(0, Math.min(1, (hf - S.rest) / (S.hfmax - S.rest)));
    return dur * r * 0.64 * Math.exp(1.92 * r) * TRIMP_TO_SRPE / LOAD_SCALE;
  }
  return 0;
}
function freeList(st) { return Object.keys(st).filter(k => k.startsWith("free:")).map(k => Object.assign({ id: k.slice(5) }, st[k].v)).filter(f => f && !f.del && num(f.date)).sort((a, b) => a.date - b.date); }
function vo2List(st) { return Object.keys(st).filter(k => k.startsWith("vo2:")).map(k => ({ date: +k.slice(4), v: st[k].v })).filter(x => num(x.date) && num(x.v)).sort((a, b) => a.date - b.date); }
function loadOf(st, s, t, S) {
  const x = statusOf(st, s, t); if (!(x === "✓" || x === "½")) return 0;
  const l = val(st, "log:" + s.id) || {}, a = actual(st, s, t);
  const ld = sessionLoad(a.min, l.rpe, l.hf, S);
  return ld || a.min * estRpe(s) / LOAD_SCALE;
}
/* Fitness (CTL, 42 Tage) und Ermüdung (ATL, 7 Tage) als exponentiell gewichtete Mittel, Form = CTL − ATL (Banister-Modell, Coggan-Notation). */
function formSeries(B, st, t, E) {
  E = E || effective(B, st);
  const S = B.S, last = Math.max(...E.map(s => s.date)), day = {};
  const add = (d, v, k) => { (day[d] = day[d] || { a: 0, p: 0 })[k] += v; };
  E.forEach(s => { if (s.dropped || s.sport === "Ruhe") return;
    if (s.date < t) add(s.date, loadOf(st, s, t, S), "a");
    else { const x = statusOf(st, s, t); add(s.date, (x === "✓" || x === "½") ? loadOf(st, s, t, S) : (x === "✗" || x === "krank") ? 0 : s.min * estRpe(s) / LOAD_SCALE, "p"); } });
  freeList(st).forEach(f => { const ld = sessionLoad(f.dur, f.rpe, f.hf, S) || (num(f.dur) ? f.dur * 4 / LOAD_SCALE : 0); add(f.date, ld, f.date < t ? "a" : "p"); });
  // Startwert: mittlere geplante Tageslast der Wochen 2–4 als Vorbelastung (Annahme, Felix trainierte vor Planstart).
  const seedW = E.filter(s => s.w >= 2 && s.w <= 4 && !s.dropped).reduce((a, s) => a + s.min * estRpe(s) / LOAD_SCALE, 0) / 21;
  const kc = 1 - Math.exp(-1 / 42), ka = 1 - Math.exp(-1 / 7);
  let ctl = seedW * .85, atl = seedW * .85; const out = [];
  for (let d = S.start - 1; d <= last + 1; d++) {
    const x = day[d] || { a: 0, p: 0 }, ld = d < t ? x.a : x.p;
    const tsb = ctl - atl;                 // Form am Morgen, vor der Einheit des Tages
    ctl += (ld - ctl) * kc; atl += (ld - atl) * ka;
    out.push({ d, load: ld, ctl, atl, tsb, proj: d >= t });
  }
  return out;
}
/* Daniels/Gilbert (Oxygen Power, 1979): VDOT aus Distanz (km) und Zeit (min). */
function vdot(km, min) {
  if (!num(km) || !num(min) || km <= 0 || min <= 0) return null;
  const v = km * 1000 / min, vo2 = -4.60 + 0.182258 * v + 0.000104 * v * v;
  const pct = 0.8 + 0.1894393 * Math.exp(-0.012778 * min) + 0.2989558 * Math.exp(-0.1932605 * min);
  return vo2 / pct;
}
function vdotPoints(B, st, t, E) {
  E = E || effective(B, st); const pts = [];
  B.tests.forEach(T => { const r = val(st, "test:" + T.key) || {}; if (!num(r.time)) return;
    const km = { "10K": 10, HM: 21.0975, M: 42.195 }[T.typ]; if (!km) return;
    const vd = vdot(km, r.time * 1440); if (vd) pts.push({ date: T.date, v: vd, name: T.name }); });
  E.forEach(s => { if (s.typ !== "LTHR") return; const l = val(st, "log:" + s.id) || {}; if (num(l.dist) && num(l.dur) && l.dur >= 25) { const vd = vdot(l.dist, l.dur); if (vd) pts.push({ date: s.date, v: vd, name: s.name.replace(/^★\s*/, "") }); } });
  return pts.sort((a, b) => a.date - b.date);
}
function vdotTargets(B) { return { m: vdot(42.195, B.S.tgtM * 1440), hm: vdot(21.0975, B.S.tgtHM * 1440) }; }
/* Wochenstatistik: Soll/Ist je Sportart, Schlüsseleinheiten, Erfüllung. */
function weekStats(B, st, t, E) {
  E = E || effective(B, st); const NW = Math.max(...B.plan.map(p => p.w)), W = [], fr = freeList(st);
  for (let w = 1; w <= NW; w++) {
    const a = E.filter(s => s.w === w && isTrain(s)), o = { w, start: B.S.start + 7 * (w - 1), so: 0, is: 0, sp: {}, keyTot: 0, keyDone: 0, past: B.S.start + 7 * w - 1 < t, cur: false };
    o.cur = t >= o.start && t <= o.start + 6;
    a.forEach(s => { const x = actual(st, s, t), k = s.sport; o.so += s.min; o.is += x.min; const z = o.sp[k] = o.sp[k] || { so: 0, is: 0, km: 0, kmIs: 0 };
      z.so += s.min; z.is += x.min; z.km += s.km; z.kmIs += x.km;
      if (s.prio === "A") { o.keyTot++; if (statusOf(st, s, t) === "✓") o.keyDone++; } });
    fr.filter(f => f.date >= o.start && f.date <= o.start + 6).forEach(f => { o.is += f.dur || 0; const z = o.sp[f.sport] = o.sp[f.sport] || { so: 0, is: 0, km: 0, kmIs: 0 }; z.is += f.dur || 0; z.kmIs += f.dist || 0; });
    o.fulfil = o.so ? o.is / o.so : 0; W.push(o);
  }
  let streak = 0; for (let i = W.length - 1; i >= 0; i--) { const o = W[i]; if (!o.past) continue; if (o.keyTot && o.keyDone / o.keyTot >= .8) streak++; else break; }
  return { weeks: W, streak };
}
/* Zusätzliche Regeln mit v2-Daten: Form deutlich negativ und mehr gemacht als geplant, lockere Einheiten fühlen sich hart an. */
function proposalsV2(B, st, t, E, base) {
  const out = [], open = s => isTrain(s) && !statusOf(st, s, t) && s.test !== "race";
  const already = new Set(); (base || []).forEach(p => (p.ops || []).forEach(o => o.id && already.add(o.id)));
  const nextHard = () => E.find(s => s.date >= t && s.date < t + 7 && open(s) && isHard(s) && !s.test && !already.has(s.id));
  const F = formSeries(B, st, t, E), today = F.find(x => x.d === t);
  if (today) {
    const last3 = F.filter(x => x.d >= t - 2 && x.d <= t), neg = last3.length === 3 && last3.every(x => x.ctl > 5 && x.tsb < -0.3 * x.ctl);
    const plannedAtl = (() => { const kc = 1 - Math.exp(-1 / 7); let atl = 0; for (let d = t - 28; d < t; d++) { const ld = E.filter(s => s.date === d && !s.dropped && s.sport !== "Ruhe").reduce((a, s) => a + s.min * estRpe(s) / LOAD_SCALE, 0); atl += (ld - atl) * kc; } return atl; })();
    const nh = nextHard();
    if (neg && today.atl > plannedAtl * 1.15 && nh && !resolved(st, "form:" + nh.id))
      out.push({ key: "form:" + nh.id, sev: "warn", title: "Form stark im Minus: " + nh.name + " locker", why: "Deine Ermüdung liegt " + Math.round((today.atl / plannedAtl - 1) * 100) + " % über Plan und die Form seit drei Tagen deutlich im Minus (Schätzung aus RPE und Dauer). Die nächste harte Einheit locker zu laufen, kostet keine Fitness.", ops: [{ type: "edit", id: nh.id, patch: lockerPatch(nh, .8, "Form deutlich negativ."), note: "Entlastung nach Formkurve." }] });
  }
  const easy = E.filter(s => s.date < t && s.date >= t - 9 && ["E", "R2", "LR"].includes(s.code) && statusOf(st, s, t) === "✓").map(s => val(st, "log:" + s.id) || {}).filter(l => num(l.rpe));
  const nh2 = nextHard();
  if (easy.length >= 3 && easy.slice(-3).every(l => l.rpe >= 6) && nh2 && !resolved(st, "rpe:" + nh2.id) && !out.some(p => p.ops.some(o => o.id === nh2.id)))
    out.push({ key: "rpe:" + nh2.id, sev: "warn", title: "Locker fühlt sich hart an: " + nh2.name + " entschärfen", why: "Deine letzten drei lockeren Einheiten hattest du mit RPE 6 oder höher bewertet. Das spricht für Ermüdung, Schlafmangel oder einen beginnenden Infekt. Die nächste harte Einheit wird locker.", ops: [{ type: "edit", id: nh2.id, patch: lockerPatch(nh2, .8, "Hohe RPE bei lockeren Einheiten."), note: "" }] });
  out.forEach(p => p.lines = describeOps(p.ops, E));
  return out;
}
/* Verläufe für den Fortschritt-Tab. */
function trends(B, st, t, E) {
  E = E || effective(B, st); const res = k => val(st, "test:" + k) || {};
  const ac = B.tests.filter(T => T.typ === "AC" && num(res(T.key).time) && T.dist).map(T => ({ date: T.date, v: res(T.key).time / T.dist, hf: res(T.key).hf, name: T.name }));
  const prog = B.tests.map(T => { const x = res(T.key).time; if (!num(x)) return null; const eq = T.typ === "10K" ? x * Math.pow(HMK / 10, 1.06) : T.typ === "HM" ? x : T.typ === "M" ? x / RIEGEL : null; return eq ? { date: T.date, v: eq * RIEGEL, name: T.name } : null; }).filter(Boolean);
  const css = B.tests.filter(T => T.typ === "CSS400").map(T => { const p = B.tests.find(x => x.typ === "CSS200" && x.date === T.date), a = res(T.key).time, b = p && res(p.key).time; return num(a) && num(b) ? { date: T.date, v: (a - b) / 2 } : null; }).filter(Boolean);
  const berg = B.tests.filter(T => T.typ === "BERG" && num(res(T.key).time)).map(T => ({ date: T.date, v: res(T.key).time, hf: res(T.key).hf, name: T.name }));
  const NW = Math.max(...B.plan.map(p => p.w)), chk = [], lr = [], run = [];
  for (let w = 1; w <= NW; w++) {
    const c = val(st, "chk:" + w); if (c) chk.push({ w, date: B.S.start + 7 * w - 1, puls: c.puls, pain: c.pain, feel: c.feel });
    const a = E.filter(s => s.w === w && s.sport === "Lauf" && !s.dropped);
    const L = a.filter(s => ["LR", "LRM", "M"].includes(s.code)), K = a.filter(s => /Koppel/.test(s.name));
    const lrS = Math.max(0, ...L.map(s => s.km)), lrI = Math.max(0, ...L.map(s => actual(st, s, t).km)), kS = Math.max(0, ...K.map(s => s.min)), kI = Math.max(0, ...K.map(s => actual(st, s, t).min));
    lr.push({ w, so: lrS, is: lrI, kso: kS, kis: kI });
    run.push({ w, so: a.reduce((x, s) => x + s.km, 0), is: a.reduce((x, s) => x + actual(st, s, t).km, 0) + freeList(st).filter(f => f.sport === "Lauf" && weekOf(B, f.date) === w).reduce((x, f) => x + (f.dist || 0), 0) });
  }
  return { ac, prog, css, berg, chk, lr, run, vo2: vo2List(st), vdot: vdotPoints(B, st, t, E) };
}
const paceStr = (min, km) => num(min) && num(km) && km > 0 ? mss(min / km / 1440) : "";

/* ---------- Ernährung (Orientierung, keine Ernährungsberatung) ----------
   Tageswerte: ACSM/AND/DC 2016 (Thomas, Erdman, Burke), Protein ISSN 2017 (Jäger; Kerksick).
   Während der Einheit: Jeukendrup 2014 (KH nach Dauer), ACSM 2007 (Sawka: Flüssigkeit individuell, Natrium 20–30 mmol/l im Getränk). */
const DAY_T = {
  ruhe: { lab: "Ruhetag", kh: [3, 5], p: [1.4, 1.8], why: "Kein oder nur Mobility-Training. Kohlenhydrate im unteren Bereich, Eiweiß gleichmäßig über den Tag." },
  locker: { lab: "Lockerer Tag", kh: [5, 7], p: [1.4, 1.8], why: "Locker bis etwa 75 Minuten. Moderater Bedarf." },
  schluessel: { lab: "Schlüsseltag", kh: [6, 8], p: [1.6, 2.0], why: "Harte Einheit oder 75 bis 150 Minuten. Kohlenhydrate vor und nach der Einheit bündeln." },
  lang: { lab: "Langer Tag", kh: [8, 10], p: [1.6, 2.0], why: "Long Run, Koppeltraining oder mehr als 150 Minuten. Glykogen auffüllen, unterwegs verpflegen." },
  laden: { lab: "Kohlenhydrate laden", kh: [8, 12], p: [1.4, 1.8], why: "Vor dem Rennen: Glykogenspeicher füllen, ballaststoff- und fettarm, gewohnte Lebensmittel." }
};
const FOOD = { hafer: ["Haferflocken", 59, 13.5], milch: ["Milch 1,5 %", 4.8, 3.4, "ml"], banane: ["Banane", 21, 1.1], honig: ["Honig", 80, .4], beeren: ["Beeren", 8, 1], nuss: ["Nüsse", 6, 20],
  kartoffel: ["Kartoffeln", 15, 2], lachs: ["Lachs", 0, 20], gemuese: ["Gemüse", 5, 2], vkbrot: ["Vollkornbrot", 40, 7], quark: ["Magerquark", 4, 12], ei: ["Eier", 1, 13], tomate: ["Tomaten", 3, 1],
  skyr: ["Skyr", 4, 11], apfel: ["Apfel", 12, .3], reis: ["Reis (roh)", 78, 7], haehnchen: ["Hähnchenbrust", 0, 23], vknudeln: ["Vollkornnudeln (roh)", 62, 14], nudeln: ["Nudeln (roh)", 71, 12],
  hack: ["Rinderhack mager", 0, 21], sauce: ["Tomatensauce", 7, 1.5], parmesan: ["Parmesan", 0, 33], joghurt: ["Joghurt 1,5 %", 4.5, 3.5], muesli: ["Müsli", 65, 9], broetchen: ["Brötchen", 50, 9],
  kakao: ["Kakao (Milch)", 10, 3.4, "ml"], saft: ["Orangensaft", 9, .7, "ml"], toast: ["Weißbrot/Toast", 48, 8], marmelade: ["Marmelade", 60, .3], moehren: ["Möhren gegart", 6, 1], reiswaffel: ["Reiswaffeln", 80, 8], iso: ["Iso-Getränk", 6, 0, "ml"] };
/* Rolle: c = Kohlenhydratträger (skaliert auf das Mahlzeitenziel), p = Eiweißträger (skaliert mit Gewicht), f = fest. Basisportionen für 75 kg. */
const MEALS = {
  ruhe: { Frühstück: [["hafer", 50, "c"], ["milch", 250, "p"], ["beeren", 100, "f"], ["nuss", 15, "f"]], Mittag: [["kartoffel", 250, "c"], ["lachs", 150, "p"], ["gemuese", 250, "f"]], Abend: [["vkbrot", 100, "c"], ["quark", 150, "p"], ["ei", 120, "p"], ["tomate", 150, "f"]], Snacks: [["skyr", 150, "p"], ["apfel", 150, "c"]] },
  locker: { Frühstück: [["hafer", 70, "c"], ["banane", 120, "c"], ["honig", 10, "c"], ["milch", 250, "p"]], Mittag: [["reis", 80, "c"], ["haehnchen", 150, "p"], ["gemuese", 250, "f"]], Abend: [["vknudeln", 90, "c"], ["hack", 120, "p"], ["sauce", 200, "f"], ["parmesan", 15, "f"]], Snacks: [["joghurt", 200, "p"], ["muesli", 40, "c"], ["apfel", 150, "c"]] },
  schluessel: { Frühstück: [["hafer", 80, "c"], ["banane", 120, "c"], ["honig", 15, "c"], ["milch", 300, "p"]], Mittag: [["reis", 100, "c"], ["haehnchen", 150, "p"], ["gemuese", 200, "f"]], Abend: [["nudeln", 110, "c"], ["lachs", 150, "p"], ["gemuese", 200, "f"]], Snacks: [["broetchen", 80, "c"], ["honig", 20, "c"], ["kakao", 400, "p"], ["banane", 120, "c"]] },
  lang: { Frühstück: [["hafer", 100, "c"], ["banane", 120, "c"], ["honig", 20, "c"], ["saft", 200, "c"], ["milch", 300, "p"]], Mittag: [["reis", 120, "c"], ["haehnchen", 150, "p"], ["gemuese", 150, "f"]], Abend: [["nudeln", 130, "c"], ["hack", 120, "p"], ["sauce", 200, "f"]], Snacks: [["kakao", 400, "p"], ["broetchen", 80, "c"], ["marmelade", 25, "c"], ["reiswaffel", 40, "c"]] },
  laden: { Frühstück: [["toast", 120, "c"], ["marmelade", 40, "c"], ["saft", 300, "c"], ["joghurt", 150, "p"]], Mittag: [["reis", 150, "c"], ["haehnchen", 120, "p"], ["moehren", 150, "f"]], Abend: [["nudeln", 160, "c"], ["sauce", 200, "f"], ["parmesan", 15, "f"]], Snacks: [["reiswaffel", 50, "c"], ["banane", 240, "c"], ["iso", 500, "c"], ["toast", 60, "c"], ["honig", 20, "c"]] }
};
const MEAL_SPLIT = { Frühstück: .25, Mittag: .3, Abend: .3, Snacks: .15 }, MEAL_SPLIT_LOAD = { Frühstück: .25, Mittag: .25, Abend: .25, Snacks: .25 };
const LONG_CODES = ["LR", "LRM", "M"];
function dayItemsAll(E, st, d) {
  const pl = E.filter(s => s.date === d && isTrain(s));
  const fr = freeList(st).filter(f => f.date === d && num(f.dur)).map(f => ({ sport: f.sport, min: f.dur, code: "", name: f.name || "", free: true, rpe: f.rpe }));
  return pl.concat(fr);
}
function dayType(E, st, d) {
  const races = E.filter(s => s.test === "race" && !s.dropped);
  const rNext = races.find(r => (["M", "MD"].includes(r.typ) && (r.date - d === 1 || r.date - d === 2)) || (["HM", "OD"].includes(r.typ) && r.date - d === 1));
  if (rNext && !E.some(s => s.date === d && s.test === "race")) return { key: "laden", race: rNext, kh: ["M", "MD"].includes(rNext.typ) ? [8, 12] : [7, 10], items: dayItemsAll(E, st, d), min: 0 };
  const it = dayItemsAll(E, st, d), min = it.reduce((a, s) => a + (s.min || 0), 0), hard = it.some(s => !s.free && isHard(s)) || it.some(s => s.free && num(s.rpe) && s.rpe >= 7);
  const long = it.some(s => s.test === "race" || (s.sport === "Lauf" && LONG_CODES.includes(s.code) && s.min >= 90) || (s.sport === "Rad" && s.min >= 150) || /Koppel/i.test(s.name)) || min >= 150;
  const key = !it.length || min < 20 ? "ruhe" : long ? "lang" : hard || min > 75 ? "schluessel" : "locker";
  return { key, items: it, min, hard, kh: DAY_T[key].kh };
}
const rnd10 = x => Math.round(x / 10) * 10, rnd5 = x => Math.round(x / 5) * 5;
function dayNeeds(dt, kg) {
  const T = DAY_T[dt.key], kh = dt.kh || T.kh, mid = a => (a[0] + a[1]) / 2;
  return { key: dt.key, lab: T.lab, why: T.why, khGkg: kh, pGkg: T.p, kh: [rnd10(kh[0] * kg), rnd10(kh[1] * kg)], khT: rnd10(mid(kh) * kg), p: [rnd5(T.p[0] * kg), rnd5(T.p[1] * kg)], pT: rnd5(mid(T.p) * kg) };
}
function mealPlan(dt, kg) {
  const N = dayNeeds(dt, kg), M = MEALS[dt.key], split = dt.key === "laden" ? MEAL_SPLIT_LOAD : MEAL_SPLIT, fw = kg / 75, out = [];
  let sk = 0, sp = 0;
  Object.keys(M).forEach(name => {
    const target = N.khT * split[name];
    const items = M[name].map(([k, g, r]) => ({ k, r, g: r === "p" ? g * fw : g }));
    const fixedKh = items.filter(i => i.r !== "c").reduce((a, i) => a + i.g * FOOD[i.k][1] / 100, 0);
    const cKh = items.filter(i => i.r === "c").reduce((a, i) => a + i.g * FOOD[i.k][1] / 100, 0);
    const f = cKh > 0 ? clamp((target - fixedKh) / cKh, .4, 3) : 1;
    items.forEach(i => { if (i.r === "c") i.g *= f; i.g = i.g >= 100 ? rnd10(i.g) : Math.max(5, rnd5(i.g)); });
    const kh = items.reduce((a, i) => a + i.g * FOOD[i.k][1] / 100, 0), p = items.reduce((a, i) => a + i.g * FOOD[i.k][2] / 100, 0);
    out.push({ name, items, kh, p });
  });
  /* Eiweißträger auf das Tagesziel skalieren (Getreide liefert schon viel Eiweiß). */
  const tot = (f, r) => out.reduce((a, m) => a + m.items.filter(i => r ? i.r === r : i.r !== "p").reduce((b, i) => b + i.g * FOOD[i.k][f] / 100, 0), 0);
  const pP = tot(2, "p"), pN = tot(2), fp = pP > 0 ? clamp((N.pT - pN) / pP, .5, 1.3) : 1;
  out.forEach(m => { m.items.forEach(i => { if (i.r === "p") { i.g *= fp; i.g = i.g >= 100 ? rnd10(i.g) : Math.max(5, rnd5(i.g)); } });
    m.kh = m.items.reduce((a, i) => a + i.g * FOOD[i.k][1] / 100, 0); m.p = m.items.reduce((a, i) => a + i.g * FOOD[i.k][2] / 100, 0); sk += m.kh; sp += m.p; });
  return { needs: N, meals: out.map(m => ({ name: m.name, items: m.items.map(i => ({ lab: FOOD[i.k][0], g: i.g, unit: FOOD[i.k][3] || "g" })), kh: Math.round(m.kh), p: Math.round(m.p) })), kh: Math.round(sk), p: Math.round(sp) };
}
const TEMP = { kalt: { lab: "unter 10 °C", ml: [300, 500] }, mild: { lab: "10–20 °C", ml: [400, 700] }, warm: { lab: "20–25 °C", ml: [500, 800] }, heiss: { lab: "über 25 °C", ml: [600, 900] } };
function tempDefault(d) { const m = sd(d).getUTCMonth(); return m >= 5 && m <= 7 ? "warm" : m === 4 || m === 8 ? "mild" : m === 3 || m === 9 ? "mild" : "kalt"; }
/* KH g/h nach Dauer (Jeukendrup 2014): < 45' keine, 45–75' Mundspülung oder wenig, 75–150' 30–60, > 150' 60–90 (nur Glukose+Fruktose und trainiert). Lockere Intensität: unterer Bereich. */
function gphFor(min, hard) { if (min < 45) return [0, 0]; if (min <= 75) return hard ? [0, 30] : [0, 0]; if (min <= 150) return hard ? [30, 60] : [30, 45]; return hard ? [60, 90] : [45, 75]; }
function fuelSession(s, kg, temp, opts) {
  opts = opts || {}; temp = TEMP[temp] ? temp : tempDefault(s.date);
  const min = s.min || 0, hard = isHard(s) || s.test === "race", st = tStart(s.time), early = st != null && st < 8 * 60, swim = s.sport === "Schwimmen";
  const pre = [], post = [];
  if (min >= 90 || s.test === "race") pre.push("2–4 h vorher: Mahlzeit mit " + rnd10(1.5 * kg) + "–" + rnd10(2.5 * kg) + " g Kohlenhydraten (1,5–2,5 g/kg), wenig Fett und Ballaststoffe. Bei frühem Start lieber 2 h vorher kleiner.");
  else if (hard) pre.push(early ? "Früh und hart: 30–60 min vorher 30–40 g Kohlenhydrate, z. B. Banane oder Toast mit Honig." : "2–3 h vorher normale Mahlzeit mit Kohlenhydraten, oder 30–60 min vorher 30–40 g als Snack.");
  else pre.push(early && min <= 75 ? "Locker und kurz: nüchtern geht, wenn es dir gut bekommt. Sonst kleiner Snack 30 min vorher." : "Keine besondere Vorbereitung. Letzte Mahlzeit 2–3 h vorher.");
  if (min >= 60 || hard) pre.push("Trinken: " + rnd10(5 * kg) + "–" + rnd10(7 * kg) + " ml etwa 4 h vorher (5–7 ml/kg), danach nach Durst.");
  const g = opts.gph ? [opts.gph, opts.gph] : gphFor(min, hard), ml = swim ? [0, 0] : min < 45 ? [0, 0] : TEMP[temp].ml;
  const na = min >= 90 || temp === "warm" || temp === "heiss" ? [Math.round(ml[0] * .46 / 10) * 10, Math.round(ml[1] * .69 / 10) * 10] : [0, 0];
  let dur = min < 45 ? "Unter 45 Minuten: keine Verpflegung nötig, Wasser nach Durst." : min <= 75 ? (hard ? "45–75 Minuten hart: Wasser, optional ein Schluck Iso oder Mundspülung mit Kohlenhydraten." : "45–75 Minuten locker: Wasser nach Durst reicht.") : "Ab " + (min > 150 ? "150" : "75") + " Minuten: " + g[0] + "–" + g[1] + " g Kohlenhydrate pro Stunde" + (g[1] > 60 ? ", Glukose-Fruktose-Mischung, nur wenn trainiert" : "") + ". Ab Minute 20–30 alle 20–30 Minuten.";
  if (swim) dur = min >= 75 ? "Am Beckenrand: Flasche mit Iso, " + g[0] + "–" + g[1] + " g/h bei langen Einheiten." : "Am Beckenrand eine Flasche Wasser.";
  if (s.sport === "Lauf" && LONG_CODES.includes(s.code) && min >= 90 && s.w >= 12) dur += " Darmtraining: Gels und Getränk wie im Rennen testen.";
  const quick = hard || min >= 90;
  if (quick) post.push("Innerhalb von 30–60 min: " + rnd5(.25 * kg) + "–" + rnd5(.4 * kg) + " g Eiweiß (0,25–0,4 g/kg) und " + rnd10(1 * kg) + " g Kohlenhydrate (1 g/kg), z. B. Kakao und Brötchen.");
  else post.push("Nächste normale Mahlzeit mit Eiweiß und Kohlenhydraten reicht.");
  if (opts.soon) post.push("Nächste Einheit in weniger als 8 h: in den ersten 4 h etwa " + rnd10(1 * kg) + "–" + rnd10(1.2 * kg) + " g Kohlenhydrate pro Stunde (1,0–1,2 g/kg/h).");
  if (min >= 60 && !swim) post.push("Flüssigkeit: 1,25–1,5 l je kg Gewichtsverlust über die nächsten Stunden, mit etwas Salz.");
  return { temp, tempLab: TEMP[temp].lab, pre, dur, gph: g, ml, na, post, min, hard };
}
/* Verpflegungsplan für lange Läufe und Rennen. Gel-Annahme 25 g KH (neutral), Stationen alle 5 km (Annahme, Veranstalterangaben prüfen). */
function racePlan(s, kg, o) {
  o = o || {}; const temp = TEMP[o.temp] ? o.temp : tempDefault(s.date), gel = o.gel || 25, tri = s.sport === "Triathlon" || ["OD", "MD"].includes(s.typ);
  const km = s.km || (s.typ === "M" ? MK : s.typ === "HM" ? HMK : 0), pace = o.pace || (s.min && km ? s.min / km : 4.6), dur = tri ? (s.typ === "MD" ? 300 : 140) : (o.min || (km ? km * pace : s.min));
  const race = s.test === "race", def = s.typ === "M" ? 70 : s.typ === "HM" ? 45 : tri ? 80 : s.code === "LRM" ? 60 : s.w >= 12 ? 60 : 40;
  const gph = clamp(o.gph || def, 0, 90), ml = TEMP[temp].ml, steps = [], pre = [];
  if (race) {
    const big = ["M", "MD"].includes(s.typ);
    pre.push((big ? "36–48 h vorher" : "Am Vortag") + ": " + (big ? "8–12" : "7–10") + " g Kohlenhydrate pro kg (" + rnd10((big ? 10 : 8) * kg) + " g als Richtwert), ballaststoffarm, nichts Neues.");
    pre.push("Etwa 4 h vorher " + rnd10(5 * kg) + "–" + rnd10(7 * kg) + " ml trinken, danach nur nach Durst.");
    pre.push("3 h vor dem Start: Frühstück mit " + rnd10(2 * kg) + "–" + rnd10(3 * kg) + " g Kohlenhydraten (2–3 g/kg), z. B. Toast mit Honig, Banane, Saft. Bei der Generalprobe testen.");
    pre.push("Koffein optional: höchstens " + Math.round(3 * kg / 10) * 10 + " mg gesamt (3 mg/kg), nur wenn im Training getestet.");
    if (!tri) steps.push({ t: -15, km: null, what: "1 Gel (" + gel + " g) mit einem Schluck Wasser" });
  }
  if (tri) {
    const bike = s.typ === "MD" ? 175 : 70, run = s.typ === "MD" ? 100 : 45, swim = s.typ === "MD" ? 40 : 30, gR = Math.min(gph, 60);
    steps.push({ t: swim + 5, km: null, what: "Rad: ab Minute 10 Flasche mit Kohlenhydrat-Getränk plus Gels, Ziel " + gph + " g/h und " + ml[0] + "–" + ml[1] + " ml/h. Gesamt Rad ca. " + Math.round(gph * bike / 60) + " g." });
    for (let m = 20; m < bike - 10; m += Math.round(60 * gel / gph)) steps.push({ t: swim + 5 + m, km: null, what: "Rad: " + gel + " g (Gel oder Getränk)" });
    steps.push({ t: swim + bike + 7, km: null, what: "Laufen: an jeder Station Wasser, " + gR + " g/h als Gel" });
    for (let m = 15; m < run - 10; m += Math.round(60 * gel / gR)) steps.push({ t: swim + bike + 7 + m, km: null, what: "Laufen: 1 Gel (" + gel + " g)" + (m > run * .6 ? ", optional mit Koffein" : "") });
  } else if (gph > 0) {
    const iv = 60 * gel / gph, first = dur >= 120 ? 30 : 25, ts = [];
    for (let m = first; m <= dur - 12; m += iv) ts.push(m);
    ts.forEach((m, i) => steps.push({ t: Math.round(m), km: Math.round(m / pace * 2) / 2, what: "1 Gel (" + gel + " g)" + (race && i >= ts.length - 2 && s.typ === "M" ? ", optional mit Koffein" : "") }));
    if (km >= 10) for (let k = 5; k < km; k += 5) steps.push({ t: Math.round(k * pace), km: k, what: "Station: " + rnd10(ml[0] * 5 * pace / 60) + "–" + rnd10(ml[1] * 5 * pace / 60) + " ml" + (temp === "warm" || temp === "heiss" || dur >= 150 ? ", bei starkem Schwitzen Iso statt Wasser" : ""), drink: true });
  }
  steps.sort((a, b) => a.t - b.t);
  const gels = steps.filter(x => /Gel/.test(x.what) && x.t >= 0 && !/Rad: ab/.test(x.what)).length, khTotal = Math.round(gph * dur / 60), rest = Math.max(0, khTotal - gels * gel);
  return { temp, tempLab: TEMP[temp].lab, gph, gel, gels, khTotal, rest, dur: Math.round(dur), pace, km, pre, steps, ml, na: [Math.round(ml[0] * .46 / 10) * 10, Math.round(ml[1] * .69 / 10) * 10], tri, race };
}

/* ---------- Synchronisation: Last-Writer-Wins je Schlüssel ---------- */
function merge(a, b) { const o = Object.assign({}, a); for (const k in b) if (!o[k] || (b[k].t || 0) > (o[k].t || 0)) o[k] = b[k]; return o; }

/* ---------- Kalender ---------- */
function ics(B, st, t) {
  const E = effective(B, st).filter(s => isTrain(s) && s.time && s.date >= t - 1);
  const pad = n => String(n).padStart(2, "0");
  const dt = (d, m) => { const x = sd(d); return x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate()) + "T" + pad(Math.floor(m / 60)) + pad(m % 60) + "00"; };
  const esc = s => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const R = derive(B, st), priv = new Set(activeAdj(st).filter(a => /^sick/.test(a.key || "")).map(a => a.id));
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PerformanceLab//DE", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Training"];
  E.forEach(s => { const a = tStart(s.time), b = tStart(s.time.slice(6)); if (a == null) return; const z = zone(s, B, R);
    L.push("BEGIN:VEVENT", "UID:" + s.id.replace(/[^\w~-]/g, "") + "@perflab", "DTSTAMP:" + dt(t, 0) + "Z", "DTSTART:" + dt(s.date, a), "DTEND:" + dt(s.date, b != null && b > a ? b : a + (s.min || 30)),
      "SUMMARY:" + esc((s.test === "test" ? "TEST · " : s.test === "race" ? "RENNEN · " : "") + s.sport + ": " + (priv.has(s.adj) ? "angepasst" : s.name) + (s.km ? " (" + s.km + " km)" : "")),
      "DESCRIPTION:" + esc((priv.has(s.adj) ? "Angepasst. Details in der App." : s.desc) + (z.pace ? "\nZiel: " + z.pace : "") + (z.hf ? " | HF " + z.hf : "") + (s.note && !priv.has(s.adj) ? "\n" + s.note : "")), "END:VEVENT"); });
  L.push("END:VCALENDAR"); return L.join("\r\n");
}

G.Engine = { DAY_T, TEMP, dayType, dayNeeds, mealPlan, fuelSession, racePlan, tempDefault, gphFor, SICK_CAT, FLAGS, FLAGS_BY, REGIONS, EQ_LAB, SUBS, sickCat, sickStages, sickPauses, injAffects, tripEq, eqText, lrSpike, longestDone, estRpe, sessionLoad, freeList, vo2List, loadOf, formSeries, vdot, vdotPoints, vdotTargets, weekStats, proposalsV2, trends, paceStr, LOAD_SCALE, parseWorkbook, effective, derive, zone, proposals, manualMove, manualDrop, merge, ics, statusOf, actual, isTrain, isHard, sickOn, weekOf, weekEnd, activeAdj, resolved, val,
  util: { timeRange, hhmm, sd, serialOf, fmtD, wdD, mss, hms, r1, WD, WDL, tStart, RACE_TYPES, stageOf } };
})(typeof window !== "undefined" ? window : globalThis);
