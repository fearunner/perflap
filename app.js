/* Gehhilfe 4.0 (vormals Triger, Performance Lab). Oberfläche. Ab 4.0 ohne Excel: Plan und Einträge leben nur in der App, Export auf Knopfdruck. Daten bleiben auf dem Gerät (IndexedDB) und in der Sync-Datei, die du selbst wählst.
   Keine externen Requests, kein Tracking. Planlogik ausschließlich in engine.js. */
(function () {
"use strict";
const E = window.Engine, U = E.util;
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = v => typeof v === "number" && isFinite(v);
const QS = new URLSearchParams(location.search);
const today = () => { const q = QS.get("heute"); return U.serialOf(q ? new Date(q + "T12:00:00") : new Date()); };
const nowMin = () => { if (QS.get("heute")) return QS.get("uhr") ? (+QS.get("uhr").split(":")[0]) * 60 + (+QS.get("uhr").split(":")[1] || 0) : 7 * 60; const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const MON = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const MONS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const FSA = !!window.showOpenFilePicker;
const de = (x, d) => (Math.round(x * Math.pow(10, d ?? 1)) / Math.pow(10, d ?? 1)).toLocaleString("de-DE");
const SYNCNAME = "PerformanceLab-Sync.json";
const WIDE = () => matchMedia("(min-width: 1000px)").matches;
const REDUCED = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const buzz = ms => { try { if (navigator.vibrate && !REDUCED()) navigator.vibrate(ms || 8); } catch (_) {} };
const durStr = m => { if (!num(m) || m <= 0) return "–"; m = Math.round(m); return m < 60 ? m + " min" : Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0") + " h"; };
const durShort = m => { m = Math.round(m || 0); return m < 60 ? m + "'" : Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); };
const kmStr = (km, sport) => !num(km) || km <= 0 ? "" : sport === "Schwimmen" ? Math.round(km * 1000).toLocaleString("de-DE") + " m" : de(km) + " km";
const dateVal = d => U.sd(d).toISOString().slice(0, 10);
const fromDateVal = v => v ? U.serialOf(new Date(v + "T12:00:00")) : null;
const longDate = d => { const x = U.sd(d); return U.WDL[x.getUTCDay()] + ", " + x.getUTCDate() + ". " + MON[x.getUTCMonth()]; };
const shortDate = d => { const x = U.sd(d); return x.getUTCDate() + ". " + MONS[x.getUTCMonth()]; };
const dayLabel = (d, t) => d === t ? "Heute" : d === t + 1 ? "Morgen" : d === t - 1 ? "Gestern" : U.WDL[U.sd(d).getUTCDay()];
const parseTime = s => { s = String(s || "").trim().replace(",", ":").replace(/\./g, ":"); if (!s) return null; let p;
  if (/^\d+$/.test(s)) { const z = s.length <= 2 ? s + "00" : s; p = z.length <= 4 ? [0, +z.slice(0, -2), +z.slice(-2)] : [+z.slice(0, -4), +z.slice(-4, -2), +z.slice(-2)]; }
  else { p = s.split(":").map(Number); if (p.some(isNaN)) return null; if (p.length === 2) p = [0, p[0], p[1]]; if (p.length !== 3) return null; }
  if (p[2] >= 60 || (p[1] >= 60 && p[0] > 0)) return null; return (p[0] * 3600 + p[1] * 60 + p[2]) / 86400; };
const parseDur = s => { s = String(s || "").trim(); if (!s) return null; if (/^\d+([.,]\d+)?$/.test(s)) return Number(s.replace(",", ".")); const m = s.match(/^(\d+):(\d{1,2})$/); return m ? (+m[1]) * 60 + (+m[2]) : null; };

/* ---------- Sport ---------- */
const SPORT = {
  Lauf: { c: "var(--run)", t: "var(--run-t)", lab: "Laufen" }, Rad: { c: "var(--bike)", t: "var(--bike-t)", lab: "Rad" },
  Schwimmen: { c: "var(--swim)", t: "var(--swim-t)", lab: "Schwimmen" }, Kraft: { c: "var(--gym)", t: "var(--gym-t)", lab: "Kraft" },
  Mobility: { c: "var(--mob)", t: "var(--mob-t)", lab: "Mobility" }, Ruhe: { c: "var(--rest)", t: "var(--rest-t)", lab: "Ruhe" },
  Triathlon: { c: "var(--race)", t: "var(--race-t)", lab: "Triathlon" }, Sonstiges: { c: "var(--other)", t: "var(--other-t)", lab: "Sonstiges" } };
const sp = k => SPORT[k] || SPORT.Sonstiges;
const ICON = {
  Lauf: '<path d="M13.5 4.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM9.6 21l1.3-5.6 2.4 2.3V21M7 12.2l1.7-4 3.6-.7 2.5 2.6 3 1M10.9 15.4l1.3-5.6"/>',
  Rad: '<circle cx="5.5" cy="16.5" r="3.6"/><circle cx="18.5" cy="16.5" r="3.6"/><path d="M5.5 16.5l3.8-7h6.2l3 7M9.3 9.5L12 16.5h3.5M13.5 6h2.6"/>',
  Schwimmen: '<path d="M2 17.5c1.7 0 1.7-1.2 3.3-1.2s1.7 1.2 3.4 1.2 1.7-1.2 3.3-1.2 1.7 1.2 3.3 1.2 1.7-1.2 3.4-1.2 1.6 1.2 3.3 1.2M2 21c1.7 0 1.7-1.2 3.3-1.2S7 21 8.7 21s1.7-1.2 3.3-1.2 1.7 1.2 3.3 1.2 1.7-1.2 3.4-1.2S20.3 21 22 21M7 13.5l4.5-4.8-2.6-2.2 4-1.5 4.6 5.2"/><circle cx="18" cy="6.2" r="1.7"/>',
  Kraft: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  Mobility: '<circle cx="12" cy="4.5" r="1.8"/><path d="M4 10.5l8-2 8 2M12 8.5v6l-4 6.5M12 14.5l4 6.5"/>',
  Ruhe: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  Triathlon: '<path d="M5 21V4M5 4.5c5-2.5 7 2.5 13 0v8c-6 2.5-8-2.5-13 0"/>',
  Sonstiges: '<path d="M3 20l6-11 4 6 3-4 5 9z"/>' };
const icon = (k, cls) => `<svg class="ico ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k] || ICON.Sonstiges}</svg>`;
const UI = { play: '<path d="M8 5.5v13l10.5-6.5z"/>', fork: '<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5a2 2 0 0 0 4 0V3M17 21V3c-2 1.5-3 4-3 7s1 4 3 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', half: '<path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/><circle cx="12" cy="12" r="8"/>',
  chev: '<path d="M9 5l7 7-7 7"/>', back: '<path d="M15 5l-7 7 7 7"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  today: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', plan: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>',
  prog: '<path d="M3 17l5.5-6 4 4L21 6.5M15.5 6.5H21V12"/>', data: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>', prof: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1.3-3.6 4.2-5.4 7.5-5.4s6.2 1.8 7.5 5.4"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 13a8 8 0 0 0 14.5 4.5L20 16M4 4v4h4M20 20v-4h-4"/>', move: '<path d="M4 12h15M14 7l5 5-5 5"/>', trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/>',
  undo: '<path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>', flag: '<path d="M5 21V4M5 4.5c5-2.5 7 2.5 13 0v8c-6 2.5-8-2.5-13 0"/>', star: '<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>',
  plane: '<path d="M10.5 13.5L3 11l1.5-1.5 7 1L16 6c1-1 2.6-1.5 3.3-.8s.2 2.3-.8 3.3l-4.5 4.5 1 7L13.5 21.5 11 14"/>', sick: '<path d="M12 3v11M9 6h6M8.5 14a3.5 3.5 0 1 0 7 0"/><circle cx="12" cy="17.5" r="3.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>', cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>',
  file: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5"/>', down: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>', up: '<path d="M12 20V8M7 13l5-5 5 5M5 4h14"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>' };
UI.watch = '<rect x="6.5" y="6" width="11" height="12" rx="3.2"/><path d="M9 6l.6-3h4.8l.6 3M9 18l.6 3h4.8l.6-3M12 9.5V12l1.6 1.2"/>';
UI.up = '<path d="M6 17L17 6M9 6h8v8"/>'; UI.dn = '<path d="M6 7l11 11M17 10v8H9"/>'; UI.flat = '<path d="M4 12h15M14 7l5 5-5 5"/>';
UI.pen = '<path d="M4.5 19.5h4l10-10-4-4-10 10zM13 7l4 4"/>';
UI.sidebar = '<rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M9.5 4.5v15M5.5 8h2M5.5 11h2"/>';
const ui = (k, cls) => `<svg class="ico ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true">${UI[k]}</svg>`;

/* ---------- Zustand und Speicher ---------- */
let B = null, ST = {}, PREF = { theme: "system" }, tab = "heute", planZoom = "woche", planWeek = null, planMonth = null, planDay = null, selId = null, LP = [], ALERT = "", planSel = false; /* planSel: im Plan-Tab hat der Nutzer bewusst eine Einheit gewählt (nur dann rechte Detailleiste) */
let syncState = "off", syncMsg = "Nur auf diesem Gerät";
const H = { sync: null, exp: null, expAt: 0, expState: "off" };
const dbP = new Promise((res, rej) => { const r = indexedDB.open("perflab-app", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const idbGet = async k => { const db = await dbP; return new Promise(r => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => r(q.result); q.onerror = () => r(undefined); }); };
const idbPut = async (k, v) => { const db = await dbP; return new Promise(r => { const tx = db.transaction("kv", "readwrite"); tx.objectStore("kv").put(v, k); tx.oncomplete = () => r(true); tx.onerror = () => r(false); }); };
const idbDel = async k => { const db = await dbP; db.transaction("kv", "readwrite").objectStore("kv").delete(k); };
let saveT = null;
const saveState = () => { clearTimeout(saveT); saveT = setTimeout(() => idbPut("state", ST), 120); scheduleSync(); scheduleExp(); scheduleCloud(); };
const get = k => E.val(ST, k);
function put(k, v) { ST[k] = { v, t: Date.now() }; MEMO.k = null; saveState(); }
function set(k, v) { put(k, v); render(); }

/* ---------- Memo: Plan einmal je Zustand berechnen ---------- */
const MEMO = { k: null };
const sig = () => { let n = 0, m = 0; for (const k in ST) { n++; if (ST[k].t > m) m = ST[k].t; } return n + ":" + m; };
function C() {
  const t = today(), key = (B && B.importedAt) + "|" + sig() + "|" + t;
  if (MEMO.k === key) return MEMO.c;
  const Ex = E.effective(B, ST), R = E.derive(B, ST), NW = Math.max(...B.plan.map(p => p.w));
  const c = { t, Ex, R, NW, cw: Math.min(NW, Math.max(1, E.weekOf(B, t))), pre: t < B.S.start, free: E.freeList(ST) };
  c.byDay = new Map(); Ex.forEach(s => { if (!c.byDay.has(s.date)) c.byDay.set(s.date, []); c.byDay.get(s.date).push(s); });
  let F = null, WS = null, TR = null, PR = null;
  Object.defineProperty(c, "F", { get: () => F || (F = E.formSeries(B, ST, t, Ex)) });
  Object.defineProperty(c, "WS", { get: () => WS || (WS = E.weekStats(B, ST, t, Ex)) });
  Object.defineProperty(c, "TR", { get: () => TR || (TR = E.trends(B, ST, t, Ex)) });
  Object.defineProperty(c, "P", { get: () => { if (PR) return PR; const a = E.proposals(B, ST, t); return PR = a.concat(E.proposalsV2(B, ST, t, Ex, a)); } });
  MEMO.k = key; MEMO.c = c; return c;
}
const dayItems = (c, d) => (c.byDay.get(d) || []).concat(c.free.filter(f => f.date === d).map(f => Object.assign({ isFree: true, w: E.weekOf(B, d), name: f.name || sp(f.sport).lab, km: f.dist || 0, min: f.dur || 0, prio: "" }, f, { id: "free:" + f.id })));
const needs = (s, t) => !s.isFree && s.date <= t && E.isTrain(s) && !E.statusOf(ST, s, t);
const log = s => get("log:" + s.id) || {};
function zoneOf(s, c) { if (s.isFree) return { pace: "", hf: "" }; return E.zone(s, B, c.R); }
function hfMid(z) { const m = String(z.hf || "").match(/(\d{2,3})\D+(\d{2,3})/); if (m) return Math.round((+m[1] + +m[2]) / 2); const n = String(z.hf || "").match(/<\s?(\d{2,3})/); return n ? +n[1] - 5 : null; }

/* ---------- Toast, Banner ---------- */
/* 4.4 G4: Kommt eine Meldung mit merge (Automatik) während eine andere noch steht, werden beide zusammengeführt. Rückgängig nimmt dann beides zurück. */
function toast(msg, opt) {
  opt = opt || {}; const el = $("#toast"), cur = toast.cur;
  if (opt.merge && cur && el.classList.contains("show") && Date.now() - cur.at < 6000 && !cur.opt.merged) {
    const u1 = cur.opt.undo, u2 = opt.undo;
    msg = String(cur.msg).replace(/[.!]\s*$/, "") + ". " + msg;
    opt = Object.assign({}, cur.opt, { icon: cur.opt.icon || opt.icon, cele: false, merge: false, merged: true, undo: u1 || u2 ? () => { if (u2) u2(); if (u1) u1(); } : null });
  }
  toast.cur = { msg, opt, at: Date.now() };
  el.innerHTML = `<span class="tmsg">${opt.icon ? ui(opt.icon) : ""}${esc(msg)}</span>${opt.undo ? '<button class="tbtn" id="tundo">Rückgängig</button>' : ""}${opt.action ? `<button class="tbtn" id="tact">${esc(opt.action[0])}</button>` : ""}`;
  el.className = "toast show" + (WIDE() && $("#insp") && !SHEETS.some(S => !S.side) ? " oncontent" : "") + (opt.cele ? " cele" : "") + (SHEETS.length || $(".sheet-wrap") ? " top" : ""); el.hidden = false;
  if (opt.undo) $("#tundo").onclick = () => { opt.undo(); hideToast(); };
  if (opt.action) $("#tact").onclick = () => { hideToast(); opt.action[1](); };
  clearTimeout(toast.t); toast.t = setTimeout(hideToast, opt.merged ? 9000 : opt.undo || opt.action ? 6500 : 3200);
}
function hideToast() { const el = $("#toast"); el.className = "toast"; setTimeout(() => { if (!el.className.includes("show")) el.hidden = true; }, 250); }

/* ---------- Sheets (Bottom Sheet auf dem iPhone, Dialog auf dem Mac) ---------- */
const SHEETS = []; let FROM_INSP = false, INSP_SHOWN = false;
/* Mac (ab 1000 px): Blätter erscheinen in der rechten Seitenleiste statt als Fenster. Stapel: oberstes Blatt sichtbar, Zurück schließt es. */
function openSheet(render, opt) {
  opt = opt || {};
  if (WIDE() && opt.side !== false && $("#insp") && (FROM_INSP || opt.side === true)) {
    const dummy = document.createElement("div");
    const S = { side: true, wrap: dummy, render, opt, prevFocus: document.activeElement, data: opt.data || {} };
    Object.defineProperty(S, "body", { get: () => $("#insp .panel-body") || dummy });
    Object.defineProperty(S, "el", { get: () => $("#insp") || dummy });
    SHEETS.push(S); paintInsp();
    setTimeout(() => { const f = $("#insp [autofocus]") || $("#insp .sheet-title"); f && f.focus({ preventScroll: true }); const i = $("#insp"); if (i) i.scrollTop = 0; }, 30);
    if (opt.mount) opt.mount(S);
    return S;
  }
  const pop = !!opt.pop && innerWidth >= 700;
  const wrap = document.createElement("div"); wrap.className = "sheet-wrap" + (pop ? " popv" : opt.pop ? " compact" : ""); wrap.innerHTML = `<div class="scrim"></div><section class="sheet${opt.tall ? " tall" : ""}" role="dialog" aria-modal="true" aria-label="${esc(opt.label || "Dialog")}" tabindex="-1"><div class="grab" aria-hidden="true"></div><div class="sheet-body"></div></section>`;
  document.body.append(wrap);
  const S = { wrap, el: $(".sheet", wrap), body: $(".sheet-body", wrap), render, opt, prevFocus: document.activeElement, data: opt.data || {} };
  SHEETS.push(S); S.body.innerHTML = render(S); if (pop) placePop(S); setTimeout(() => { if (typeof bindSwipes === "function") bindSwipes(); }, 0);
  requestAnimationFrame(() => wrap.classList.add("open"));
  setTimeout(() => { const f = $("[autofocus]", S.el) || $(".sheet-title", S.el) || S.el; f.focus({ preventScroll: true }); }, 60);
  $(".scrim", wrap).onclick = () => closeSheet(S);
  /* Popover: Seite darunter bleibt unverändert (kein Scroll-Sperren, das die Scrollleiste verschieben würde); Scrollen über dem Hintergrund schließt nicht, es passiert einfach nichts. */
  if (pop) { const stop = e => e.preventDefault(); $(".scrim", wrap).addEventListener("wheel", stop, { passive: false }); $(".scrim", wrap).addEventListener("touchmove", stop, { passive: false }); }
  else { dragClose(S); document.documentElement.classList.add("noscroll"); }
  if (opt.mount) opt.mount(S);
  return S;
}
/* Popover an das angetippte Element hängen: bevorzugt darunter, sonst darüber, sonst daneben; immer im Fenster. */
function placePop(S) {
  const a = S.opt.pop, el = S.el; if (!a || !el || !S.wrap.classList.contains("popv")) return;
  const Wv = innerWidth, Hv = innerHeight, m = 12, w = el.offsetWidth, h = el.offsetHeight; let top = a.bottom + 8, left = a.left + a.width / 2 - w / 2;
  if (S.opt.popSide) { top = Math.max(m, Math.min(Hv - m - h, a.top + a.height / 2 - h / 2)); left = a.right + 10 + w <= Wv - m ? a.right + 10 : a.left - 10 - w; }
  else if (top + h > Hv - m) { if (a.top - 8 - h >= m) top = a.top - 8 - h; else { top = Math.max(m, Math.min(Hv - m - h, a.top + a.height / 2 - h / 2)); left = a.right + 10 + w <= Wv - m ? a.right + 10 : a.left - 10 - w; } }
  el.style.left = Math.max(m, Math.min(Wv - m - w, left)) + "px"; el.style.top = Math.max(m, top) + "px";
}
const rectOf = el => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
/* Neuaufbau (Sync, Garmin) darf ein Eingabefeld nicht aus dem Fokus reißen: Fokus und Cursor wiederherstellen. */
function focusSnap(root) { const a = document.activeElement; if (!a || !a.id || !root || !root.contains(a) || !/^(INPUT|TEXTAREA)$/.test(a.tagName)) return () => {}; const id = a.id, s0 = a.selectionStart, s1 = a.selectionEnd;
  return () => { const n = document.getElementById(id); if (!n || n === document.activeElement) return; n.focus({ preventScroll: true }); try { n.setSelectionRange(s0, s1); } catch (_) {} }; }
function rerenderSheet(S) { if (S.side) { const i = $("#insp"), sc0 = i ? i.scrollTop : 0; paintInsp(); if (i) $("#insp").scrollTop = sc0; return; } const sc = S.body.scrollTop, fz = focusSnap(S.body); S.body.innerHTML = S.render(S); S.body.scrollTop = sc; fz(); placePop(S); if (S.opt.mount) S.opt.mount(S); if (typeof bindSwipes === "function") bindSwipes(); }
/* 4.4 G5: Entwürfe. Wer im Eintragen-Formular etwas eingibt und dann Esc, X, außerhalb tippt oder den Tab wechselt, findet die Eingaben beim nächsten Öffnen wieder. Speichern oder Verwerfen löscht den Entwurf. */
const DRAFT = {};
const draftKey = (D, id) => D && D.f && D.dirty ? (D.mode === "log" && (id || D.id) ? "log:" + (id || D.id) : D.free && !D.edit ? "free" : null) : null;
function keepDraft(D, id, say) { const k = draftKey(D, id); if (k) { DRAFT[k] = JSON.parse(JSON.stringify(D.f)); D.dirty = false; if (say) setTimeout(() => toast("Entwurf gemerkt. Beim nächsten Öffnen ist er wieder da.", { icon: "check" }), 30); } return k; }
const takeDraft = k => DRAFT[k] ? Object.assign(JSON.parse(JSON.stringify(DRAFT[k])), { fromDraft: true }) : null;
function closeSheet(S, quiet) {
  S = S || SHEETS[SHEETS.length - 1]; if (!S) return; keepDraft(S.data, null, !quiet); const i = SHEETS.indexOf(S); if (i >= 0) SHEETS.splice(i, 1);
  if (S.side) { if (!SHEETS.some(x => x.side) && !selId) render(); else paintInsp(); if (S.opt.onClose && !quiet) S.opt.onClose(); return; }
  S.wrap.classList.remove("open"); setTimeout(() => S.wrap.remove(), REDUCED() ? 0 : 260);
  if (!SHEETS.some(x => !x.side && !x.wrap.classList.contains("popv"))) document.documentElement.classList.remove("noscroll");
  if (S.prevFocus && S.prevFocus.focus && document.contains(S.prevFocus)) S.prevFocus.focus({ preventScroll: true });
  if (S.opt.onClose && !quiet) S.opt.onClose();
}
function dragClose(S) {
  const g = $(".grab", S.el); let y0 = null, dy = 0;
  const down = e => { if (WIDE()) return; y0 = e.clientY; dy = 0; S.el.style.transition = "none"; g.setPointerCapture && g.setPointerCapture(e.pointerId); };
  const move = e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); S.el.style.transform = `translateY(${dy}px)`; };
  const up = () => { if (y0 == null) return; S.el.style.transition = ""; S.el.style.transform = ""; if (dy > 110) closeSheet(S); y0 = null; };
  g.addEventListener("pointerdown", down); g.addEventListener("pointermove", move); g.addEventListener("pointerup", up); g.addEventListener("pointercancel", up);
}
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && SHEETS.length) { e.preventDefault(); closeSheet(); return; }
  if (e.key === "Escape" && WIDE() && $("#insp")) { e.preventDefault(); closeInsp(); return; }
  if (e.key === "Tab" && SHEETS.length && !SHEETS[SHEETS.length - 1].side) { const S = SHEETS[SHEETS.length - 1], f = $$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', S.el).filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
});

/* ---------- Charts (handgebautes SVG) ---------- */
function chart(o) {
  const W = o.w || (WIDE() ? 640 : 360), Hh = Math.round((o.h || 220) * (WIDE() ? 1 : .72)) + ((o.marks || []).length ? 18 : 0), pl = o.pl ?? 38, pr = o.pr ?? 12, pt = (o.pt ?? 14) + ((o.marks || []).length ? 22 : 0), pb = o.pb ?? 26;
  const x0 = o.x0, x1 = o.x1, all = (o.series || []).flatMap(s => s.pts.map(p => p.y)).concat(o.band ? [o.band.y0, o.band.y1] : []).concat(o.yExtra || []).concat((o.bars || []).map(b => b.y)).filter(num);
  let y0 = o.yMin ?? (all.length ? Math.min(...all) : 0), y1 = o.yMax ?? (all.length ? Math.max(...all) : 1); if (!isFinite(y0)) y0 = 0; if (!isFinite(y1)) y1 = y0 + 1; if (y0 === y1) { y0 -= 1; y1 += 1; }
  const padY = (y1 - y0) * (o.padY ?? .08); if (o.yMin == null) y0 -= padY; if (o.yMax == null) y1 += padY;
  const X = x => pl + (W - pl - pr) * ((x - x0) / ((x1 - x0) || 1)), Y = y => pt + (Hh - pt - pb) * (1 - (o.invert ? (y1 - y) / (y1 - y0) : (y - y0) / (y1 - y0)));
  let g = "";
  const ticks = o.yTicks || (() => { const n = 4, st = (y1 - y0) / n, a = []; for (let i = 0; i <= n; i++) a.push(y0 + st * i); return a; })();
  ticks.forEach(v => { g += `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text class="gt" x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end">${esc(o.yFmt ? o.yFmt(v) : Math.round(v))}</text>`; });
  if (o.zero != null && o.zero > Math.min(y0, y1) && o.zero < Math.max(y0, y1)) g += `<line class="zl" x1="${pl}" x2="${W - pr}" y1="${Y(o.zero)}" y2="${Y(o.zero)}"/>`;
  if (o.band) g += `<rect class="band" x="${pl}" width="${W - pl - pr}" y="${Math.min(Y(o.band.y0), Y(o.band.y1))}" height="${Math.abs(Y(o.band.y0) - Y(o.band.y1))}" style="fill:${o.band.c || "var(--gold)"}"/>${o.band.label ? `<text class="bl" x="${W - pr - 4}" y="${Math.min(Y(o.band.y0), Y(o.band.y1)) - 4}" text-anchor="end" style="fill:${o.band.tc || "var(--gold-ink)"}">${esc(o.band.label)}</text>` : ""}`;
  (o.xTicks || []).forEach(xt => { g += `<text class="gt" x="${X(xt.x)}" y="${Hh - 6}" text-anchor="middle">${esc(xt.l)}</text>`; });
  (o.marks || []).forEach((m, i) => { const xx = X(m.x); if (xx < pl - 1 || xx > W - pr + 1) return; g += `<line class="mk" x1="${xx}" x2="${xx}" y1="${pt}" y2="${Hh - pb}" style="stroke:${m.c || "var(--race)"}"/>${m.l ? `<text class="ml" x="${xx + (xx > W - 90 ? -4 : 4)}" y="${pt + 10 + (i % 3) * 12}" text-anchor="${xx > W - 90 ? "end" : "start"}" style="fill:${m.c || "var(--race)"}">${esc(m.l)}</text>` : ""}`; });
  if (o.today != null && o.today >= x0 && o.today <= x1) g += `<line class="td" x1="${X(o.today)}" x2="${X(o.today)}" y1="${pt}" y2="${Hh - pb}"/><text class="tdl" x="${X(o.today)}" y="${Hh - pb + 0}" dy="-4" text-anchor="middle">heute</text>`;
  (o.bars || []).forEach(b => { const bw = Math.max(2, (W - pl - pr) / ((x1 - x0) || 1) * (b.wf || .7)); g += `<rect x="${X(b.x) - bw / 2}" y="${Math.min(Y(b.y), Y(b.base ?? 0))}" width="${bw}" height="${Math.abs(Y(b.y) - Y(b.base ?? 0))}" rx="${Math.min(3, bw / 3)}" style="fill:${b.c}" ${b.o ? `opacity="${b.o}"` : ""}><title>${esc(b.tip || "")}</title></rect>`; });
  (o.series || []).forEach(s => {
    if (!s.pts.length) return;
    const P = s.pts.filter(p => num(p.y)).map(p => [X(p.x), Y(p.y)]); if (!P.length) return;
    const d = P.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
    if (s.area) g += `<path d="${d}L${P[P.length - 1][0]} ${Y(s.areaBase ?? y0)}L${P[0][0]} ${Y(s.areaBase ?? y0)}Z" style="fill:${s.c}" opacity="${s.areaO || .14}"/>`;
    if (!s.noLine) g += `<path d="${d}" class="ln${s.dash ? " dash" : ""}" style="stroke:${s.c};stroke-width:${s.sw || 2.5}"/>`;
    if (s.dots) s.pts.filter(p => num(p.y)).forEach(p => { g += s.shape === "dia" ? `<path d="M${X(p.x)} ${Y(p.y) - 6}l6 6-6 6-6-6z" class="dt" style="stroke:${s.c}"><title>${esc(p.tip || "")}</title></path>` : `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${s.r || 4.5}" class="dt${s.fill ? " fill" : ""}" style="stroke:${s.c};${s.fill ? "fill:" + s.c : ""}"><title>${esc(p.tip || "")}</title></circle>`; });
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(o.label || "Diagramm")}">${g}</svg>`;
}
const monthTicks = (x0, x1, every) => { const a = []; let d = new Date((x0 - 25569) * 864e5); d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)); let i = 0;
  while (true) { const s = Math.floor(d.getTime() / 864e5) + 25569; if (s > x1) break; if (i++ % (every || 1) === 0) a.push({ x: s, l: MONS[d.getUTCMonth()] }); d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)); } return a; };
/* ---------- Ableitungen ---------- */
function verdict(cw) {
  const base = num(B.S.rest) ? B.S.rest : 60; let c = null, w = cw;
  for (; w >= Math.max(1, cw - 1); w--) { c = get("chk:" + w); if (c && (num(c.puls) || num(c.feel) || num(c.pain))) break; c = null; }
  if (!c) return { cls: "", txt: "Noch kein Check-in", sub: "Sonntags 30 Sekunden" };
  const pl = E.painLvl(c);
  const red = (num(c.puls) && c.puls >= base + 8) || c.feel === 1 || (pl != null && pl >= 4);
  const yel = (num(c.puls) && c.puls >= base + 5) || c.feel === 2 || (pl != null && pl >= 3);
  return red ? { cls: "bad", txt: "Rot: nur locker", sub: pl != null && pl >= 4 ? "Schmerz: ärztlich abklären" : "Erholung zuerst" } : yel ? { cls: "warn", txt: "Gelb: entschärfen", sub: "Nächste harte Einheit locker" } : { cls: "ok", txt: "Grün: Plan gilt", sub: "Check-in W" + w };
}
const TNEED = { AC: ["time", "hf"], LTHR: ["hf"], "10K": ["time"], HM: ["time"], M: ["time"], OD: ["time"], MD: ["time"], CSS400: ["time"], CSS200: ["time"], RAD: ["hf"], BERG: ["time", "hf"] };
function testDate(T) { const key = T.typ === "CSS200" ? T.date + "-CSS400" : T.date + "-" + T.typ; const s = C().Ex.find(x => x.tkey === key && !x.dropped); return s ? s.date : T.date; }
function testDone(T) { const r = get("test:" + T.key) || {}; return (TNEED[T.typ] || ["time"]).every(f => num(r[f])); }
function testGroups() { const g = []; B.tests.forEach(T => { if (T.typ === "CSS200") { const p = g.find(x => x.typ === "CSS400" && x.date === T.date); if (p) { p.pair = T; return; } } g.push(Object.assign({}, T)); }); return g; }
function testEffect(T) {
  const r = get("test:" + T.key) || {}, prev = typ => B.tests.filter(x => x.typ === typ && x.date < T.date && num((get("test:" + x.key) || {}).time)).slice(-1)[0];
  const tm = r.time, hf = r.hf;
  switch (T.typ) {
    case "AC": { if (!num(tm) || !T.dist) return ""; const p = tm / T.dist, pv = prev("AC"), pp = pv ? get("test:" + pv.key).time / pv.dist : null;
      return "Pace " + U.mss(p) + " /km" + (num(hf) ? " bei HF " + hf : "") + (pp ? (p < pp ? ", " + Math.round((pp - p) * 86400) + " s/km schneller als zuletzt. Die Basis wächst." : p > pp ? ", " + Math.round((p - pp) * 86400) + " s/km langsamer. Schlaf, Wärme und Müdigkeit prüfen." : ", gleich wie zuletzt.") : ". Erster Referenzwert."); }
    case "LTHR": return num(hf) ? "Schwellenpuls " + hf + " bpm. Alle Lauf-Zonen sind neu berechnet." : "";
    case "RAD": return num(hf) ? "Rad-Schwelle " + hf + " bpm. Rad-Zonen sind neu berechnet." : "";
    case "10K": case "HM": case "M": { if (!num(tm)) return ""; const km = { "10K": 10, HM: 21.0975, M: 42.195 }[T.typ], vd = E.vdot(km, tm * 1440);
      const eq = T.typ === "10K" ? tm * Math.pow(21.0975 / 10, 1.06) : T.typ === "HM" ? tm : tm / Math.pow(2, 1.06);
      return "VDOT " + de(vd) + ". Marathon-Prognose " + U.hms(eq * Math.pow(2, 1.06)) + ". Paces der nächsten Stufen angepasst."; }
    case "CSS400": return num(tm) ? "Jetzt noch die 200 m." : "";
    case "CSS200": { const a = B.tests.find(x => x.typ === "CSS400" && x.date === T.date), ta = a && (get("test:" + a.key) || {}).time; return num(tm) && num(ta) ? "CSS " + U.mss((ta - tm) / 2) + " /100 m. Schwimmzonen aktualisiert." : ""; }
    case "BERG": { if (!num(tm)) return ""; const pv = prev("BERG"), pt = pv && get("test:" + pv.key).time; return U.hms(tm) + (pt ? (tm < pt ? ", " + Math.round((pt - tm) * 86400) + " s schneller als " + pv.name : ", " + Math.round((tm - pt) * 86400) + " s langsamer als " + pv.name) : ", Referenz für Bergtest 2") + (num(hf) ? " bei Ø HF " + hf : "") + "."; }
    case "OD": case "MD": return num(tm) ? "Zielzeit " + U.hms(tm) + "." : "";
  }
  return "";
}

/* ---------- Kleine Bausteine ---------- */
function tags(s) {
  return (s.test === "test" ? '<span class="tag test">Test</span>' : s.test === "race" ? '<span class="tag race">Rennen</span>' : s.prio === "A" ? '<span class="tag key">Schlüssel</span>' : "") +
    (s.isFree ? '<span class="tag free">Frei</span>' : "") + (s.edited || s.added ? '<span class="tag adj">angepasst</span>' : "");
}
function stmark(s, t) {
  if (s.isFree) return `<span class="stmark ok" style="--c:${sp(s.sport).c}" aria-label="erledigt">${ui("check")}</span>`;
  const st = E.statusOf(ST, s, t), cl = st === "✓" ? "ok" : st === "½" ? "half" : st === "✗" ? "miss" : st === "krank" ? "sick" : (s.date <= t && E.isTrain(s)) ? "need" : "";
  const ic = st === "✓" ? ui("check") : st === "½" ? ui("half") : st === "✗" ? ui("x") : st === "krank" ? ui("sick") : "";
  const lab = st === "✓" ? "erledigt" : st === "½" ? "teilweise" : st === "✗" ? "verpasst" : st === "krank" ? "krank" : cl === "need" ? "offen" : "geplant";
  return `<span class="stmark ${cl}" style="--c:${sp(s.sport).c}" aria-label="${lab}">${ic}</span>`;
}
/* Verpasste Einheit, die an einem anderen Tag nachgeholt wird (Klon mit ~ in der ID). */
const nachOf = (c, s) => s && !s.added && !s.isFree ? c.Ex.find(y => y.added && !y.dropped && String(y.id).split("~")[0] === s.id) : null;
function sessRow(s, c, opt) {
  opt = opt || {}; const t = c.t, st = s.isFree ? "✓" : E.statusOf(ST, s, t), l = s.isFree ? s : log(s);
  if (s.sport === "Ruhe" && !opt.showRest) return "";
  const S = sp(s.sport), a = s.isFree ? { km: s.km, min: s.min } : E.actual(ST, s, t), doneish = st === "✓" || st === "½";
  const amt = doneish ? (a.km ? kmStr(a.km, s.sport) : durShort(a.min)) : (s.km ? kmStr(s.km, s.sport) : s.min ? durShort(s.min) : "");
  const sub = [opt.date ? U.wdD(s.date) : "", s.time ? s.time : "", doneish && a.km && a.min && s.sport === "Lauf" ? E.paceStr(a.min, a.km) + " /km" : "", doneish && num(l.hf) ? "Ø " + l.hf + " bpm" : "", doneish && num(l.rpe) ? "RPE " + l.rpe : "", s.dropped ? (s.note || "entfällt") : "", nachOf(c, s) ? "Nachgeholt am " + U.wdD(nachOf(c, s).date) : ""].filter(Boolean).join(" · ");
  const can = !s.isFree && !s.dropped && s.date <= t && E.isTrain(s) && st !== "krank" && !opt.noSwipe;
  const row = `<button class="row${st === "✓" ? " done" : ""}${s.dropped ? " dropped" : ""}${selId === s.id ? " sel" : ""}" data-act="sess" data-id="${esc(s.id)}" aria-label="${esc(s.name + ", " + (s.time || U.wdD(s.date)))}">
    <span class="badge-ic" style="--c:${S.c};--t:${S.t}">${icon(s.sport)}</span>
    <span class="tx"><span class="t1">${esc(s.name.replace(/^★\s*/, ""))}${tags(s)}</span><span class="t2">${esc(sub || S.lab)}</span></span>
    <span class="rv">${esc(amt)}</span>${s.sport === "Ruhe" ? "" : stmark(s, t)}</button>`;
  return can ? `<div class="sw" data-id="${esc(s.id)}"><div class="under ok"><span class="l">${ui("check")}Erledigt</span></div>${row}</div>` : row;
}
function propCard(p, i, ctxKey) {
  const k = p.sev === "bad" ? "Wichtig" : p.sev === "warn" ? "Empfehlung" : p.ops && p.ops.length ? "Vorschlag" : "Info";
  return `<article class="prop ${p.sev} rise"><span class="k">${ui(p.sev === "info" ? "info" : "heart")}${k}</span><h3>${esc(p.title)}</h3>${p.sub ? `<p class="muted" style="margin-top:2px">${esc(p.sub)}</p>` : ""}<p>${esc(p.why)}</p>
   ${p.lines && p.lines.length ? `<ul>${p.lines.map(l => `<li>${ui(/entfällt/.test(l) ? "x" : / neu$/.test(l) ? "plus" : "move")}<span>${esc(l)}</span></li>`).join("")}</ul>` : ""}
   <div class="acts">${p.ops && p.ops.length ? `<button class="btn lane sm" data-act="accept" data-v="${i}" data-ctx="${ctxKey || ""}">Übernehmen</button><button class="btn ghost sm" data-act="reject" data-v="${i}" data-ctx="${ctxKey || ""}">Plan lassen</button>` : `<button class="btn ghost sm" data-act="reject" data-v="${i}" data-ctx="${ctxKey || ""}">Verstanden</button>`}</div></article>`;
}
function trackSvg(pctH, pctK, label) {
  const W = 132, Hh = 96, so = 10, si = 8;
  const r1 = `x="${so / 2}" y="${so / 2}" width="${W - so}" height="${Hh - so}" rx="${(Hh - so) / 2}"`;
  const g2 = so + 5, r2 = `x="${g2}" y="${g2}" width="${W - 2 * g2}" height="${Hh - 2 * g2}" rx="${(Hh - 2 * g2) / 2}"`;
  const off = p => 100 - Math.max(0, Math.min(100, p * 100));
  return `<svg class="track" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(label)}">
   <rect class="lane-bg" ${r1} stroke-width="${so}"/><rect class="lane-fg" ${r1} stroke-width="${so}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${off(pctH)}" style="stroke:var(--tartan)"/>
   <rect class="lane-bg" ${r2} stroke-width="${si}"/><rect class="lane-fg" ${r2} stroke-width="${si}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${off(pctK)}" style="stroke:var(--gold-s)"/>
   <text x="${W / 2}" y="${Hh / 2 + 2}" text-anchor="middle" style="font-size:22px;font-weight:700;fill:var(--ink)">${Math.round(Math.min(9.99, pctH) * 100)}<tspan style="font-size:12px;fill:var(--mute)">%</tspan></text>
   <text x="${W / 2}" y="${Hh / 2 + 18}" text-anchor="middle" style="font-size:10px;font-weight:600;fill:var(--mute)">der Woche</text></svg>`;
}

/* ---------- Heute ---------- */
function heroPick(c) {
  const t = c.t, nm = nowMin(), it = dayItems(c, t).filter(s => !s.isFree && E.isTrain(s));
  const open = it.filter(s => !E.statusOf(ST, s, t));
  let s = open.find(x => { const e = U.tStart(String(x.time).slice(6)); return e == null || e + 90 > nm; }) || open[0];
  if (s) return { s, when: "Heute" };
  for (let d = t + 1; d < t + 14; d++) { const n = dayItems(c, d).filter(x => !x.isFree && E.isTrain(x) && !x.dropped && !E.statusOf(ST, x, t)); if (n.length) return { s: n[0], when: dayLabel(d, t) + (d > t + 1 ? " " + U.fmtD(d) : ""), doneToday: it.length > 0 }; }
  return null;
}

/* ---------- 4.4 Bereitschaft: Morgen-Check, Wochen-Check-in und Form als eine Ampel (Übersicht und Gesundheit) ---------- */
function readyOf(c) {
  const t = c.t, F = c.F.find(x => x.d === t), v = verdict(c.cw), sick = get("sick"), sickNow = !!(sick && num(sick.from) && !num(sick.to));
  const tsb = F ? F.tsb : 0, ctl = F ? F.ctl : 0, mcr = E.morningReady(B, ST, t);
  const r = sickNow ? { cls: "bad", lab: "Pause", txt: "Erst gesund werden." } : mcr && mcr.cls === "bad" ? { cls: "bad", lab: "Rot", txt: "Morgen-Check: " + mcr.why + "." } : mcr && mcr.cls === "warn" ? { cls: "warn", lab: "Gelb", txt: "Morgen-Check: " + mcr.why + "." } : v.cls === "bad" ? { cls: "bad", lab: "Niedrig", txt: "Check-in rot: heute nur locker." } : v.cls === "warn" ? { cls: "warn", lab: "Mittel", txt: "Warnsignal im Check-in, harte Reize dosieren." } : tsb < -0.3 * Math.max(ctl, 10) ? { cls: "warn", lab: "Müde", txt: "Ermüdung hoch, Lockeres wirklich locker." } : tsb > 5 ? { cls: "ok", lab: "Frisch", txt: "Gute Voraussetzungen für Qualität." } : { cls: "ok", lab: "Bereit", txt: "Belastung und Erholung im Gleichgewicht." };
  return Object.assign(r, { tsb, ctl, mc: mcr, sick: sickNow, form: (tsb > 0 ? "+" : "") + Math.round(tsb) });
}
/* ---------- 4.4 Briefing: eine Schlagzeile, ein Satz, Bereitschaft ---------- */
function briefing(c, h) {
  const R = readyOf(c), s = h && h.when === "Heute" ? h.s : null, wy = s && E.whyOf(s);
  const focus = s ? (wy ? wy.zweck.split(/[.:]/)[0] + "." : "") : "Schlaf, Essen und lockere Bewegung machen dich schneller.";
  const hard = s && E.isHard(s), headline = R.sick ? "Heute zählt Erholung" : !s ? (h ? "Ruhetag, morgen geht es weiter" : "Ruhetag") : R.cls === "bad" ? "Heute nur locker" : s.test === "race" ? "Renntag. Vertrau deiner Vorbereitung" : s.test === "test" ? "Testtag: ausgeruht und gleichmäßig" : s.code === "LR" ? "Heute zählt Ausdauer" : s.code === "LRM" ? "Heute zählt Ausdauer mit Marathontempo" : hard ? "Heute zählt Qualität" : "Heute locker bleiben";
  const line = R.cls !== "ok" || !focus ? R.txt : focus;
  return `<section class="brief tri rise" aria-label="Heute wichtig"><img class="tri-av" src="logo.png" alt=""><div class="tri-tx"><h2>${esc(headline)}</h2><p class="br-txt">${esc(line)}</p></div><button class="readyb ${R.cls}" data-tab="ges" aria-label="Bereitschaft ${esc(R.lab)}, Form ${esc(R.form)}. Gesundheit öffnen"><b>${esc(R.lab)}</b><span>Form ${esc(R.form)}</span></button></section>`;
}
function vHeute(c) {
  const t = c.t, h = heroPick(c), v = verdict(c.cw), sick = get("sick"), sickNow = sick && num(sick.from) && !num(sick.to);
  LP = c.P;
  const open = c.Ex.filter(s => s.date < t && s.date >= t - 14 && needs(s, t) && !s.dropped);
  let x = `<header class="lt"><div><div class="eyebrow">${esc(longDate(t))}${c.pre ? " · Start in " + (B.S.start - t) + " Tagen" : " · Woche " + c.cw + " von " + c.NW}</div><h1>Übersicht</h1></div><div class="acts">${streakChip(c)}${GAR_BTN()}<button class="avatar" data-tab="prof" aria-label="Profil"><img src="logo.png" alt=""></button></div></header>`;
  x += banners();
  if (sickNow) { const sc = E.SICK_CAT[sick.cat], hals = sick.cat === "hals", inj = sick.cat === "verletzung" && E.REGIONS[sick.region];
    x += `<div class="banner ${hals ? "" : "err"}">${ui("sick")}<div class="tx"><b>${esc(sc ? sc.short : "Krank")} seit ${esc(U.wdD(sick.from))}</b> ${hals ? "Nur locker, höchstens 45 Minuten." : inj ? "Pausiert: " + esc(inj.aff.join(", ")) + ". Rest nur schmerzfrei." : "Kein Training, nichts zählt als verpasst."}</div><span class="bt" style="display:flex;gap:6px">${sc ? "" : `<button class="btn sm ghost" data-act="sick">Details</button>`}<button class="btn sm" data-act="sickend">Wieder gesund</button></span></div>`; }
  x += briefing(c, h);
  x += chatBox(c);
  const goalHTML = goalCard(c);
  // Hero
  if (h) {
    const s = h.s, z = zoneOf(s, c), S = sp(s.sport), wake = s.wake && h.when === "Morgen" ? "Wecker " + s.wake : s.wake && h.when === "Heute" ? "Wecker " + s.wake : "";
    x += `<article class="bib rise" style="--c:${s.test === "race" ? "var(--gold-s)" : s.test === "test" ? "var(--tartan)" : S.c}">
      <div class="band"><span>${icon(s.sport)}${h.doneToday ? "Heute erledigt · Als Nächstes" : "Als Nächstes"}</span><span>${esc(h.when)}${s.time ? " · " + esc(s.time.slice(0, 5)) : ""}</span></div><i class="lanes" aria-hidden="true"></i>
      <div class="bd"><div class="when">${esc(S.lab)}${s.prio === "A" ? " · Schlüsseleinheit" : ""}${s.test === "test" ? " · Test" : ""}</div><h2>${esc(s.name.replace(/^★\s*/, ""))}</h2>
       <div class="big">${s.km ? `<b>${esc(s.sport === "Schwimmen" ? Math.round(s.km * 1000).toLocaleString("de-DE") : de(s.km))}<small>${s.sport === "Schwimmen" ? "m" : "km"}</small></b>` : ""}${s.min ? `<b>${esc(durShort(s.min))}<small>${s.min < 60 ? "min" : "h"}</small></b>` : ""}</div>
       ${z.pace || z.hf ? `<div class="zone">${z.pace ? `<span>${esc(z.pace)}</span>` : ""}${z.hf ? `<span>${ui("heart")}HF ${esc(z.hf)}</span>` : ""}</div>` : ""}
       ${wake ? `<p class="wake">${esc(wake)}</p>` : ""}
       <div class="acts">${h.when === "Heute" ? `<button class="btn pri" data-act="log" data-id="${esc(s.id)}">${ui("check")}Erledigt</button>` : `<button class="btn ink" data-act="sess" data-id="${esc(s.id)}">Einheit ansehen</button>`}<button class="btn" data-act="sess" data-id="${esc(s.id)}" aria-label="Mehr zur Einheit">${ui("more")}</button></div></div></article>`;
  } else x += `<div class="grp"><div class="empty"><img class="empty-logo" src="logo.png" alt=""><b>Saison abgeschlossen</b>Stark gemacht. Für die nächste Saison braucht es einen neuen Plan.</div></div>`;
  // Offene Einträge
  if (open.length) x += `<div class="openbar"><div class="tx"><b>${open.length} ${open.length === 1 ? "Einheit" : "Einheiten"} offen</b><span>${esc(open.slice(0, 3).map(s => U.WD[U.sd(s.date).getUTCDay()] + " " + s.name.replace(/^★\s*/, "")).join(", "))}${open.length > 3 ? " …" : ""}</span></div><span class="bt"><button class="btn sm" data-act="review">Ansehen</button><button class="btn sm ink" data-act="allok">${ui("check")}Alle erledigt</button></span></div>`;
  // 4.4: Was sich geändert hat (nur neue automatische Anpassungen), offene Vorschläge, Ringe, Heute und morgen, Körper, Termine
  x += goalHTML;
  x += weekCard(c);
  x += nutTip(c);
  x += ringsBlock(c);
  x += lastTake(c);
  x += weekReviewCard(c);
  x += changedBlock(c);
  x += LP.map((p, i) => propCard(p, i, "")).join("");
  x += dashGrid(c, h);
  return x;
}








/* ---------- 6.0 Klickbare Diagramme (eins zur Zeit, Balken und Punkte öffnen die Woche) ---------- */
let PCH = "std";
const ZC = ["#9FC5DE", "#5FA8D3", "#F5C451", "#F08A4B", "#FD6E88"];
function chartCard(c) {
  if (c.pre) return ""; const cw = c.cw, W = E.weeksOverview(B, ST, c.t, c.Ex, cw - 7, cw + 4), Wd = W.filter(o => !o.past && !o.cur ? false : true);
  const tabs = [["std", "Stunden"], ["zon", "Zonen"], ["lr", "Long Run"], ["frq", "Einheiten"]];
  const Wd2 = 340, H = 170, L = 30, R = 6, T = 10, Bt = 26, n = W.length, bw = (Wd2 - L - R) / n, xb = i => L + i * bw;
  let svg = "", leg = "", sum = "";
  if (PCH === "std" || PCH === "frq") {
    const val = o => PCH === "std" ? [o.plan / 60, o.done / 60] : [o.nPlan, o.nDone], mx = Math.max(PCH === "std" ? 10 : 6, ...W.map(o => Math.max(...val(o)))) * 1.08, y = v => T + (1 - v / mx) * (H - T - Bt);
    const grid = (PCH === "std" ? [2, 4, 6, 8, 10] : [2, 4, 6]).filter(v => v < mx);
    svg += grid.map(v => `<line x1="${L}" x2="${Wd2 - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="cg"/><text x="${L - 5}" y="${(y(v) + 3).toFixed(1)}" class="cy">${v}${PCH === "std" ? " h" : ""}</text>`).join("");
    if (PCH === "std") svg += `<rect x="${L}" width="${Wd2 - L - R}" y="${y(10).toFixed(1)}" height="${(y(8) - y(10)).toFixed(1)}" class="cband"/>`;
    W.forEach((o, i) => { const [p0, d0] = val(o), x0 = xb(i) + bw * .18, w0 = bw * .64;
      svg += `<g class="cbar${o.cur ? " cur" : ""}" data-act="wkdet" data-v="${o.w}" role="button" aria-label="Woche ${o.w}: ${PCH === "std" ? de(d0) + " von " + de(p0) + " Stunden" : d0 + " von " + p0 + " Einheiten"}"><rect x="${xb(i).toFixed(1)}" y="${T}" width="${bw.toFixed(1)}" height="${H - T - Bt + 18}" class="chit"/><rect x="${x0.toFixed(1)}" y="${y(p0).toFixed(1)}" width="${w0.toFixed(1)}" height="${(y(0) - y(p0)).toFixed(1)}" rx="3" class="cplan"/>`;
      if (PCH === "std" && (o.past || o.cur)) { let acc = 0; ["Lauf", "Rad", "Schwimmen", "Kraft", "Triathlon", "Sonstiges"].forEach(k => { const v = (o.by[k] || 0) / 60; if (!v) return; svg += `<rect x="${x0.toFixed(1)}" y="${y(acc + v).toFixed(1)}" width="${w0.toFixed(1)}" height="${(y(acc) - y(acc + v)).toFixed(1)}" style="fill:${sp(k).c}"/>`; acc += v; }); }
      else if (o.past || o.cur) svg += `<rect x="${x0.toFixed(1)}" y="${y(d0).toFixed(1)}" width="${w0.toFixed(1)}" height="${(y(0) - y(d0)).toFixed(1)}" rx="3" class="cdone"/>`;
      svg += `<text x="${(xb(i) + bw / 2).toFixed(1)}" y="${H - 8}" class="cx">${o.cur ? "jetzt" : "W" + o.w}</text></g>`; });
    const past = W.filter(o => o.past), avg = past.length ? past.reduce((a, o) => a + (PCH === "std" ? o.done / 60 : o.nDone), 0) / past.length : 0;
    sum = PCH === "std" ? `Ø ${de(avg)} h pro Woche in den letzten ${past.length} Wochen · Ziel 8 bis 10 h` : `Ø ${de(avg)} Einheiten pro Woche · geplant ${de(past.reduce((a, o) => a + o.nPlan, 0) / Math.max(1, past.length))}`;
    leg = PCH === "std" ? `<span><i style="background:var(--run)"></i>Lauf</span><span><i style="background:var(--bike)"></i>Rad</span><span><i style="background:var(--swim)"></i>Schwimmen</span><span><i style="background:var(--gym)"></i>Kraft</span><span><i class="pl"></i>Plan</span>` : `<span><i class="pl"></i>geplant</span><span><i style="background:var(--navy)"></i>erledigt</span>`;
  } else if (PCH === "zon") {
    const Z = W.filter(o => o.past || o.cur).slice(-6), tot = Z.map(o => o.zs.reduce((a, b) => a + b, 0)), any = tot.some(v => v > 0), bw2 = (Wd2 - L - R) / Math.max(1, Z.length);
    if (!any) svg = `<text x="${Wd2 / 2}" y="${H / 2}" class="cempty" text-anchor="middle">Noch keine Zonen-Daten. Garmin tippen, dann erscheinen sie hier.</text>`;
    else Z.forEach((o, i) => { let acc = 0; const tt = tot[i] || 1, x0 = L + i * bw2 + bw2 * .15, w0 = bw2 * .7, y = v => (H - Bt) - v * (H - T - Bt);
      svg += `<g class="cbar${o.cur ? " cur" : ""}" data-act="wkdet" data-v="${o.w}" role="button" aria-label="Woche ${o.w} Zonen"><rect x="${(L + i * bw2).toFixed(1)}" y="${T}" width="${bw2.toFixed(1)}" height="${H - T - Bt + 18}" class="chit"/>`;
      if (tot[i]) o.zs.forEach((z, k) => { const f = z / tt; svg += `<rect x="${x0.toFixed(1)}" y="${y(acc + f).toFixed(1)}" width="${w0.toFixed(1)}" height="${(y(acc) - y(acc + f)).toFixed(1)}" style="fill:${ZC[k]}"/>`; acc += f; });
      svg += `<text x="${(L + i * bw2 + bw2 / 2).toFixed(1)}" y="${H - 8}" class="cx">${o.cur ? "jetzt" : "W" + o.w}</text></g>`; });
    const all = [0, 0, 0, 0, 0]; Z.forEach(o => o.zs.forEach((z, k) => all[k] += z)); const ta = all.reduce((a, b) => a + b, 0) || 1, low = (all[0] + all[1]) / ta;
    sum = any ? `${Math.round(low * 100)} % in Zone 1 bis 2 · Ziel rund 80 % locker` : ""; leg = ZC.map((col, k) => `<span><i style="background:${col}"></i>Z${k + 1}${any ? " " + Math.round(all[k] / ta * 100) + " %" : ""}</span>`).join("");
  } else {
    const mx = Math.max(15, ...W.map(o => Math.max(o.lr, o.lrPlan))) * 1.1, y = v => T + (1 - v / mx) * (H - T - Bt), cx = i => xb(i) + bw / 2;
    svg += [10, 20, 30, 40].filter(v => v < mx).map(v => `<line x1="${L}" x2="${Wd2 - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="cg"/><text x="${L - 5}" y="${(y(v) + 3).toFixed(1)}" class="cy">${v}</text>`).join("");
    svg += `<polyline class="cpl" points="${W.filter(o => o.lrPlan).map((o) => cx(W.indexOf(o)).toFixed(1) + "," + y(o.lrPlan).toFixed(1)).join(" ")}"/>`;
    const dn = W.filter(o => (o.past || o.cur) && o.lr > 0); svg += `<polyline class="cln" points="${dn.map(o => cx(W.indexOf(o)).toFixed(1) + "," + y(o.lr).toFixed(1)).join(" ")}"/>`;
    W.forEach((o, i) => { svg += `<g class="cbar${o.cur ? " cur" : ""}" data-act="wkdet" data-v="${o.w}" role="button" aria-label="Woche ${o.w}: längster Lauf ${de(o.lr)} km, Plan ${de(o.lrPlan)} km"><rect x="${xb(i).toFixed(1)}" y="${T}" width="${bw.toFixed(1)}" height="${H - T - Bt + 18}" class="chit"/>${o.lr > 0 && (o.past || o.cur) ? `<circle cx="${cx(i).toFixed(1)}" cy="${y(o.lr).toFixed(1)}" r="4.5" class="cdot"/>` : ""}<text x="${cx(i).toFixed(1)}" y="${H - 8}" class="cx">${o.cur ? "jetzt" : "W" + o.w}</text></g>`; });
    const best = Math.max(0, ...dn.map(o => o.lr)); sum = `Längster Lauf zuletzt ${de(best)} km · Peak im Plan 38 km am 07.03.`; leg = `<span><i style="background:var(--crimson)"></i>gelaufen</span><span><i class="pl dash"></i>Plan</span>`;
  }
  return `<section class="pch" aria-label="Training im Blick"><div class="pch-h"><h3>Training im Blick</h3><div class="seg sm">${tabs.map(([k, l]) => `<button data-act="pchart" data-v="${k}" aria-pressed="${PCH === k}">${l}</button>`).join("")}</div></div>
   <svg class="pchart" viewBox="0 0 ${Wd2} ${H}">${svg}</svg><div class="pch-lg">${leg}</div>${sum ? `<p class="pch-s">${esc(sum)} · Balken antippen für die Woche</p>` : ""}</section>`;
}
function weekDetail(D) {
  const c = C(), w = +D.w, o = E.weeksOverview(B, ST, c.t, c.Ex, w, w)[0]; if (!o) return "";
  const its = c.Ex.filter(s => s.date >= o.from && s.date <= o.to && s.sport !== "Ruhe" && !(s.sport === "Mobility")).concat(c.free.filter(f => f.date >= o.from && f.date <= o.to).map(f => Object.assign({ isFree: true }, f, { id: "free:" + f.id })));
  const zt = o.zs.reduce((a, b) => a + b, 0);
  return `<div class="sh-head"><span class="badge-ic" style="--c:var(--navy);--t:var(--fill)">${ui("cal")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Woche ${w}</h2><p>${esc(rangeTxt(o.from, o.to))} · ${esc((B.weeks[w] || {}).phase || "")}</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>
   <div class="wrc-k"><div><span>Stunden</span><b>${de(o.done / 60)}<small> / ${de(o.plan / 60)}</small></b></div><div><span>Einheiten</span><b>${o.nDone}<small> / ${o.nPlan}</small></b></div><div><span>Längster Lauf</span><b>${de(o.lr)}<small> km</small></b></div></div>
   ${zt ? zoneBar(o.zs) : `<p class="note">Zonen erscheinen, sobald Garmin-Daten mit Pulszonen da sind.</p>`}
   <div class="grp" style="margin-top:12px">${its.map(s => sessRow(s, c, {})).join("") || `<div class="empty">Keine Einheiten</div>`}</div>`;
}
/* ---------- 6.0 Spaß: Serie, Feiern, Abzeichen ---------- */
UI.flame = '<path d="M12 3c1 3.5 4.5 5.2 4.5 9.6A4.5 4.5 0 0 1 12 17a4.5 4.5 0 0 1-4.5-4.4c0-2.2 1.2-3.4 2.2-4.6.2 1.6 1 2.6 2 3 0-3 .3-5.6.3-8z"/><path d="M8 20h8"/>';
UI.medal = '<circle cx="12" cy="14" r="5"/><path d="M8.5 3h7L13 9.4M8.5 3 11 9.4"/><path d="M12 12.3v3.4"/>';
function streakChip(c) { if (c.pre) return ""; const S = E.streaks(B, ST, c.t, c.Ex), late = S.openToday && nowMin() >= 18 * 60;
  return `<button class="streak${S.day ? " on" : ""}${late ? " late" : ""}" data-tab="fort" aria-label="Serie ${S.day} Tage${late ? ", heute noch offen" : ""}">${ui("flame")}<b class="num">${S.day}</b><span>${late ? "heute offen" : S.day === 1 ? "Tag" : "Tage"}</span></button>`; }
function confetti(big) {
  if (REDUCED()) return; const box = document.createElement("div"); box.className = "confetti" + (big ? " big" : ""); const cols = ["#FD6E88", "#072D59", "#5FA8D3", "#F5C451", "#DBF2FC"];
  for (let i = 0; i < (big ? 70 : 36); i++) { const p0 = document.createElement("i"); p0.style.cssText = `--x:${(Math.random() * 2 - 1) * (big ? 260 : 170)}px;--y:${-(120 + Math.random() * (big ? 360 : 220))}px;--r:${Math.random() * 720 - 360}deg;--d:${(.8 + Math.random() * .7).toFixed(2)}s;background:${cols[i % cols.length]};left:${45 + Math.random() * 10}%`; box.appendChild(p0); }
  document.body.prepend(box); setTimeout(() => box.remove(), 1800); }
function cheer(beforeBadges, beforeWeek, s) {
  const c = C(), S = E.streaks(B, ST, c.t, c.Ex), W = s ? c.WS.weeks[s.w - 1] : null, nb = E.badges(B, ST, c.t, c.Ex).filter(b => b.on && !beforeBadges.has(b.k));
  const weekDone = W && beforeWeek && W.keyTot && W.keyDone === W.keyTot && beforeWeek.keyDone < beforeWeek.keyTot;
  confetti(weekDone || nb.length > 0); buzz(weekDone ? 40 : 15);
  if (nb.length) return "Abzeichen: " + nb[0].lab + "!";
  if (weekDone) return "Woche " + W.w + ": alle Schlüsseleinheiten. Stark!";
  return S.todayDone ? (S.day > 1 ? "Erledigt. Serie: " + S.day + " Tage" : "Erledigt. Die Serie beginnt.") : "Erledigt. Heute noch " + S.openToday + " offen.";
}
const badgeSet = () => new Set(E.badges(B, ST, today(), C().Ex).filter(b => b.on).map(b => b.k));
function badgeCard(c) {
  const Bd = E.badges(B, ST, c.t, c.Ex), S = E.streaks(B, ST, c.t, c.Ex), n = Bd.filter(b => b.on).length;
  return `<section class="bdg" aria-label="Serie und Abzeichen"><div class="bdg-h"><div><span class="gk">Serie und Abzeichen</span><h3>${n} von ${Bd.length} geschafft</h3></div></div><div class="bdg-s"><div><b class="num">${S.day}</b><span>Tage Serie</span></div><div><b class="num">${S.best}</b><span>Bestwert</span></div><div><b class="num">${S.wk}</b><span>Wochen stark</span></div></div>
   <div class="bdg-g">${Bd.map(b => `<div class="bdgx ${b.on ? "on" : ""}" title="${esc(b.desc)}"><span class="bdgx-ic">${ui("medal")}</span><b>${esc(b.lab)}</b><small>${b.on ? esc(U.fmtD(b.d)) : b.p != null ? Math.round(b.p * 100) + " %" : esc(b.desc)}</small>${!b.on && b.p != null ? `<i style="width:${Math.round(b.p * 100)}%"></i>` : ""}</div>`).join("")}</div></section>`;
}
/* ---------- 5.3 Leistungsdiagnostik (Sportmedizin) ---------- */
function ldSheet(D) {
  const last = c0 => Object.keys(ST).filter(k => k.startsWith("ld:")).map(k => ST[k].v).filter(Boolean).sort((a, b) => b.date - a.date)[0];
  const F = D.f || (D.f = Object.assign({ date: today() }, last() || {}));
  const fld = (k, lab, sub, ph, mode) => `<div class="field"><div class="fl"><span>${lab}</span><b>${sub}</b></div><input class="inp num" data-in="ld_${k}" inputmode="${mode || "numeric"}" placeholder="${ph}" value="${esc(F[k] != null ? (/pace/.test(k) ? U.mss(F[k]) : F[k]) : "")}"></div>`;
  return `<div class="sh-head"><span class="badge-ic" style="--c:var(--bad);--t:var(--bad-t)">${ui("heart")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Leistungsdiagnostik</h2><p>Werte aus dem sportmedizinischen Test. Danach rechnet die App alle Zonen neu.</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>
   <div class="field"><div class="fl"><span>Datum</span></div><input type="date" class="inp" data-in="date" value="${dateVal(F.date)}"></div>
   <div class="two">${fld("lt1hf", "LT1 Puls", "bpm", "z. B. 152")}${fld("lt1pace", "LT1 Pace", "min/km", "5:45", "text")}</div>
   <div class="two">${fld("lt2hf", "LT2 Puls", "bpm", "z. B. 178")}${fld("lt2pace", "LT2 Pace", "min/km", "4:30", "text")}</div>
   <div class="two">${fld("hfmax", "HF max", "bpm", "z. B. 198")}${fld("vo2", "VO2max", "ml/kg", "z. B. 52")}</div>
   <p class="note">LT1 wird dein Puls-Deckel für lockere Einheiten, LT2 deine Schwelle (statt LTHR-Schätzung). Steht im Befund IANS oder 4 mmol, ist das LT2, bei 2 mmol oder LT/aerobe Schwelle ist es LT1.</p>
   <div class="sh-foot"><button class="btn" data-act="close">Abbrechen</button><button class="btn pri" data-act="saveld">${ui("check")}Speichern</button></div>`;
}
/* ---------- 5.2 Zielpfad und Tracking-Checks ---------- */
const hm5 = v => U.hms(v).replace(/:\d\d$/, ""), minDiff = v => { const m = Math.round(Math.abs(v) * 1440 * 10) / 10; return (m >= 1 ? de(m) + " min" : Math.round(Math.abs(v) * 86400) + " s"); };
function pathCard(c) {
  const G = E.goalPath(B, ST, c.t, c.Ex); if (!G) return "";
  const W = 340, Hh = 150, L = 34, Rr = 12, T = 14, Bt = 22, x = d => L + (d - G.s0) / (G.d1 - G.s0) * (W - L - Rr);
  const vals = [G.p0, G.p1, G.now, ...G.pts.map(p => p.v)], lo = Math.min(...vals) - 2 / 1440, hi = Math.max(...vals) + 2 / 1440, y = v => T + (v - lo) / (hi - lo) * (Hh - T - Bt);
  const act = [[G.s0, G.p0], ...G.pts.map(p => [p.d, p.v]), [c.t, G.now]], ticks = []; for (let m = Math.ceil(lo * 1440 / 5) * 5; m <= hi * 1440; m += 5) ticks.push(m / 1440);
  const svg = `<svg class="gpath" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Prognose heute ${hm5(G.now)}, Soll heute ${hm5(G.sNow)}, Ziel ${hm5(G.p1)}">
    ${ticks.map(v => `<line x1="${L}" x2="${W - Rr}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="gl"/><text x="${L - 6}" y="${(y(v) + 3).toFixed(1)}" class="gy">${hm5(v)}</text>`).join("")}
    <line x1="${x(G.s0)}" y1="${y(G.p0).toFixed(1)}" x2="${x(G.d1)}" y2="${y(G.p1).toFixed(1)}" class="gs"/>
    <polyline points="${act.map(([d, v]) => x(d).toFixed(1) + "," + y(v).toFixed(1)).join(" ")}" class="ga"/>
    <line x1="${x(c.t).toFixed(1)}" x2="${x(c.t).toFixed(1)}" y1="${T - 6}" y2="${Hh - Bt + 4}" class="gt"/><text x="${x(c.t).toFixed(1)}" y="${Hh - 6}" class="gx" text-anchor="middle">heute</text>
    ${G.pts.map(p => `<circle cx="${x(p.d).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="4" class="gpt"><title>${esc(p.name)}: ${hm5(p.v)}</title></circle>`).join("")}
    <circle cx="${x(c.t).toFixed(1)}" cy="${y(G.now).toFixed(1)}" r="6" class="gnow"/><circle cx="${x(c.t).toFixed(1)}" cy="${y(G.sNow).toFixed(1)}" r="4" class="gsoll"/>
    <rect x="${(x(G.d1) - 6).toFixed(1)}" y="${(y(G.p1) - 6).toFixed(1)}" width="12" height="12" transform="rotate(45 ${x(G.d1).toFixed(1)} ${y(G.p1).toFixed(1)})" class="gz"/>
    <text x="${L}" y="${Hh - 6}" class="gx">Start</text><text x="${W - 2}" y="${Hh - 6}" class="gx" style="text-anchor:end">${esc(G.race.replace("Marathon ", ""))}</text></svg>`;
  const st = G.behind > 1 / 1440 ? ["warn", minDiff(G.behind) + " hinter der Soll-Linie"] : G.behind < -1 / 1440 ? ["ok", minDiff(G.behind) + " vor der Soll-Linie"] : ["ok", "auf der Soll-Linie"];
  const need = G.need ? `Nächster Beweis: <b>${esc(G.need.name)}</b> am ${esc(U.wdD(G.need.d))} in <b>${esc(G.need.typ === "10K" ? U.mss(G.need.v) : hm5(G.need.v))}</b> oder schneller.` : "";
  const dC = Math.round(G.ctl.now - G.ctl.plan);
  return `<section class="pathc" aria-label="Dein Weg nach ${esc(G.race)}"><div class="pathc-h"><div><span class="gk">Dein Weg nach ${esc(G.race.replace("Marathon ", ""))} · noch ${G.days} Tage</span><h3>Marathon-Prognose</h3></div><span class="chip-st ${st[0]}">${esc(st[1])}</span></div>
   ${svg}<div class="pathc-k"><div><span>Heute</span><b>${hm5(G.now)}</b></div><div><span>Soll heute</span><b>${hm5(G.sNow)}</b></div><div class="z"><span>Ziel</span><b>${hm5(G.p1)}</b></div></div>
   <p class="pathc-t">${G.tested ? "" : "Seit Planstart gab es noch keinen Leistungstest. Die Prognose ist deshalb deine Bestzeit vom April, kein neuer Messwert. "}${need}</p>
   <div class="pathc-f"><span>Fitness (CTL)</span><b>${Math.round(G.ctl.now)}</b><span>laut Plan heute ${Math.round(G.ctl.plan)}</span><span class="${dC < -2 ? "neg" : "pos"}">${dC > 0 ? "+" : ""}${dC}</span><span class="pathc-fr">Renntag laut Plan ${Math.round(G.ctl.racePlan)}</span></div></section>`;
}
function checksCard(c, compact) {
  const K = E.trackingChecks(B, ST, c.t, c.Ex, Date.now()), openK = K.filter(k => k.lvl !== "ok"); if (compact) return openK.length;
  const btn = k => !k.act ? "" : k.act === "review" ? `<button class="btn sm" data-act="review">Nachtragen</button>` : k.act === "garmin" ? `<button class="btn sm" data-act="garmin">Garmin holen</button>` : k.act === "mc" ? `<button class="btn sm" data-act="mc" data-v="${c.t}">Morgen-Check</button>` : k.act === "ld" ? `<button class="btn sm" data-act="ld">Eintragen</button>` : /^test:/.test(k.act) ? `<button class="btn sm" data-act="test" data-k="${esc(k.act.slice(5))}">Eintragen</button>` : "";
  const okK = K.filter(k => k.lvl === "ok");
  return `<section class="chk" aria-label="Checks für ein realistisches Tracking"><div class="chk-h"><h3>Checks</h3><span>${openK.length ? openK.length + " offen" : "alles im grünen Bereich"}</span></div>${okK.length ? `<p class="chk-ok">${ui("check")}${okK.map(k => esc(k.title)).join(" · ")}</p>` : ""}${openK.map(k => `<div class="chk-r ${k.lvl}"><i></i><div class="tx"><b>${esc(k.title)}</b>${k.txt ? `<span>${esc(k.txt)}</span>` : ""}</div>${btn(k)}</div>`).join("")}</section>`;
}
/* ---------- 5.1 Hiron-Muster (Aufbau übernommen, Farben Gehhilfe) ---------- */
const MONK = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];
const rangeTxt = (a, b) => { const x = U.sd(a), y = U.sd(b); return x.getUTCMonth() === y.getUTCMonth() ? x.getUTCDate() + ".–" + y.getUTCDate() + ". " + MONK[y.getUTCMonth()] : x.getUTCDate() + ". " + MONK[x.getUTCMonth()] + " – " + y.getUTCDate() + ". " + MONK[y.getUTCMonth()]; };
const hDur = m => { m = Math.round(m || 0); if (!m) return ""; const h = Math.floor(m / 60), r = m % 60; return h ? h + "h" + (r ? String(r).padStart(2, "0") : "") : m + "′"; };
function weekCard(c) {
  if (c.pre) return ""; const F = E.weekFocus(B, ST, c.t, c.Ex), pct = F.so ? Math.min(1, F.is / F.so) : 0;
  const LAB = { Schwimmen: "Schwimmen", Rad: "Rad", Lauf: "Laufen", Kraft: "Kraft" };
  return `<section class="wkc" aria-label="Diese Woche"><div class="wkc-top"><span>Woche ${F.w} von ${F.NW}</span><span class="wkc-ph">${esc(F.rel ? "Entlastung" : F.phase)}</span><span>${esc(rangeTxt(F.from, F.to))}</span></div>
   <h2>${esc(F.title)}</h2><div class="wkc-tg"><span class="pill">Ziel ${esc(hDur(F.tgt[0]))}–${esc(hDur(F.tgt[1]))}</span><span class="wkc-done">${esc(hDur(F.is) || "0′")} erledigt</span></div>
   ${F.focus.length ? `<ul class="wkc-f">${F.focus.map(f => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
   <div class="wkc-days">${F.days.map(d => `<button class="wkc-d ${d.st}${d.today ? " today" : ""}" data-act="day" data-v="${d.d}" aria-label="${esc(U.WDL[U.sd(d.d).getUTCDay()])} ${d.day}., ${d.min ? hDur(d.min) : "Ruhetag"}"><span class="wd">${esc(d.wd.slice(0, 2))}</span><b>${d.day}</b><span class="du">${d.min ? esc(hDur(d.min)) : "Ruhe"}</span><i></i></button>`).join("")}</div>
   <div class="wkc-prog" role="img" aria-label="${Math.round(pct * 100)} Prozent der Woche"><i style="width:${Math.round(pct * 100)}%"></i></div></section>`;
}
function weekReviewCard(c, w, always) {
  const cw = c.cw, wd = U.sd(c.t).getUTCDay(); w = w || cw - 1; if (!always && !(wd === 1 || wd === 2 || wd === 0)) return "";
  if (!always && wd === 0) w = cw; const Rv = E.weekReview(B, ST, c.t + (wd === 0 && !always ? 1 : 0), w); if (!Rv) return "";
  return `<section class="wrc" aria-label="Wochenrückblick"><div class="wrc-h"><div><span class="gk">Wochenrückblick · ${esc(rangeTxt(Rv.from, Rv.to))}</span><h3>Woche ${Rv.w}</h3></div><div class="wrc-sc"><b>${String(Rv.score).replace(".", ",")}</b><small>/10</small><span>Score</span></div></div>
   <div class="wrc-k"><div><span>Erledigt</span><b>${esc(hDur(Rv.am) || "0′")}<small> / ${esc(hDur(Rv.pm))}</small></b></div><div><span>Einheiten</span><b>${Rv.nDone}<small> / ${Rv.n}</small></b></div><div><span>Schlüssel</span><b>${Rv.keyDone}<small> / ${Rv.key}</small></b></div></div>
   ${Rv.pos.length ? `<div class="take-s ok"><h4>Positives</h4><ul>${Rv.pos.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}${Rv.obs.length ? `<div class="take-s warn"><h4>Beobachtungspunkte</h4><ul>${Rv.obs.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}</section>`;
}
function raceCard(c, max) {
  const RT = E.raceTargets(B, ST, c.t).slice(0, max || 2); if (!RT.length) return "";
  return RT.map((r, i) => `<section class="rtc${i ? " sec2" : ""}" aria-label="Renntag-Ziele ${esc(r.name)}"><div class="rtc-h"><span class="gk">Renntag-Ziele</span><h3>${esc(r.name)}</h3><span class="pill">in ${r.days} Tagen</span></div>
    ${r.rows.map(o => `<div class="rtc-row" style="--c:${sp(o.sport).c}"><div class="rtc-l"><span class="rtc-ic">${icon(o.sport)}</span>${esc(o.lab)}</div><div class="rtc-v"><b>${esc(o.range)}</b>${o.est ? `<span>${esc(o.est)}</span>` : ""}<span class="rtc-g ${o.ok ? "ok" : ""}">${esc(o.goal)}</span></div>
      ${o.p ? `<div class="rtc-bar" aria-hidden="true"><i class="cur" style="left:${(o.p.cur * 100).toFixed(1)}%"></i><i class="goal" style="left:${(o.p.goal * 100).toFixed(1)}%"></i></div><div class="rtc-lg"><span>langsamer</span><span>● heute&nbsp;&nbsp;◆ Ziel</span><span>schneller</span></div>` : ""}</div>`).join("")}
    <p class="rtc-tip"><img src="logo.png" alt=""><span><b>Opas Tipp:</b> ${esc(r.tip)}</span></p></section>`).join("");
}
function chatBox(c) {
  const R = CHAT.r;
  let x = `<form class="chat" data-chat="1" onsubmit="return false"><img src="logo.png" alt=""><input class="inp" id="chatq" placeholder="Frag Opa … z. B. „heute nur 30 min“" autocomplete="off" enterkeyhint="send" value="${esc(CHAT.q || "")}"><button type="button" class="chat-go" data-act="chatgo" aria-label="Senden">${ui("chev")}</button></form>`;
  if (R) x += `<div class="chat-a"><p>${esc(R.msg)}</p>${R.act ? `<div class="chat-b"><button class="btn sm pri" data-act="chatok">${esc(R.act)}</button><button class="btn sm ghost" data-act="chatno">Lieber nicht</button></div>` : ""}</div>`;
  return x;
}
const CHAT = { q: "", r: null, it: null };
function chatAsk(q) {
  const c = C(), it = E.chatIntent(q, c.t, c.Ex); CHAT.q = q; CHAT.it = it;
  const nm = s => String(s.name).replace(/^★\s*/, "");
  CHAT.r = !it ? { msg: "Das verstehe ich noch nicht. Probier „heute nur 30 min“, „bin krank“, „Dienstreise“, „kein Gym“, „lieber morgen“ oder „bin platt“." }
    : it.kind === "none" ? { msg: it.msg }
    : it.kind === "short" ? { msg: "Klar. " + nm(it.s) + " wird auf " + it.min + " min gekürzt, den Hauptreiz behältst du. Der Rest der Woche bleibt, wie er ist.", act: "Auf " + it.min + " min kürzen" }
    : it.kind === "movetest" ? { msg: nm(it.s) + " ist ein Test und lässt sich nicht kürzen, sonst stimmen deine Zonen nicht. Ich schiebe ihn auf den nächsten passenden Tag.", act: "Test verschieben" }
    : it.kind === "easy" ? { msg: "Dann wird " + nm(it.s) + " locker. Eine harte Einheit auf müden Beinen bringt wenig und kostet viel.", act: "Locker machen" }
    : it.kind === "move" ? { msg: nm(it.s) + " auf morgen schieben?", act: "Auf morgen" }
    : it.kind === "nogym" ? { msg: "Kein Studio: " + nm(it.s) + " wird zum Zimmer-Workout mit dem eigenen Körpergewicht.", act: "Umstellen" }
    : it.kind === "sick" ? { msg: "Gute Besserung. Trag kurz ein, was du hast. Die App pausiert und plant den Wiedereinstieg.", act: "Krank melden" }
    : it.kind === "trip" ? { msg: "Wann und wohin? Mit Reisedaten und Ausstattung plant die App die Tage um.", act: "Reise eintragen" } : { msg: "" };
  typing = false; if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); doRender();
}
function chatApply() {
  const it = CHAT.it, c = C(); if (!it) return; let p = null; const s = it.s, nm = s ? String(s.name).replace(/^★\s*/, "") : "";
  if (it.kind === "sick") { CHAT.r = null; CHAT.q = ""; openSheet(S => sickSheet(S.data), { label: "Krank", data: {} }); return; }
  if (it.kind === "trip") { CHAT.r = null; CHAT.q = ""; openSheet(S => travelSheet(S.data), { label: "Reise", data: {} }); return; }
  if (it.kind === "short") { const min = it.min, km = s.km ? Math.round(s.km * min / s.min * 10) / 10 : 0; p = { key: "chat:short:" + s.id + ":" + min, title: nm + " auf " + min + " min", why: "Wunsch im Chat: wenig Zeit.", ops: [{ type: "edit", id: s.id, patch: { min, km, name: nm + " (kurz)", time: U.timeRange(U.tStart(s.time), min) }, note: "Im Chat gekürzt." }] }; }
  if (it.kind === "easy") p = { key: "chat:easy:" + s.id, title: nm + " locker", why: "Wunsch im Chat: müde.", ops: [{ type: "edit", id: s.id, patch: { code: "E", name: nm + " (locker)", prio: "B", desc: "Locker im Grundlagenbereich, Puls unter dem Deckel. " + (s.desc || "") }, note: "Im Chat auf locker gestellt." }] };
  if (it.kind === "move" || it.kind === "movetest") { const to = it.kind === "move" ? it.to : (() => { for (let d = s.date + 1; d < s.date + 6; d++) if (!c.Ex.some(y => y.date === d && E.isHard(y))) return d; return s.date + 2; })(); p = E.manualMove({ B, st: ST, t: c.t, E: c.Ex }, s, to); p.key = "chat:" + p.key; }
  if (it.kind === "nogym") p = { key: "chat:nogym:" + s.id, title: nm + " als Zimmer-Workout", why: "Wunsch im Chat: kein Studio.", ops: [{ type: "edit", id: s.id, patch: { name: "Zimmer-Workout (statt " + nm + ")", desc: "Körpergewicht, 3 Runden: 15 Kniebeugen, 10 Ausfallschritte je Seite, 10 Liegestütze, 20 Wadenheben einbeinig, 45 s Plank, 30 s Seitstütz je Seite." }, note: "Im Chat umgestellt." }] };
  if (!p) return; p.lines = []; const aid = applyAdj(p); CHAT.r = null; CHAT.q = ""; CHAT.it = null; render(); toast("Plan angepasst", { icon: "check", undo: () => setAdjUndone(aid, true) });
}
function zoneBar(zs) {
  if (!Array.isArray(zs)) return ""; const tot = zs.reduce((a, b) => a + b, 0); if (tot < 300) return "";
  return `<div class="zbar-w"><h4>HF-Zonen-Verteilung</h4><div class="zbar">${zs.map((z, i) => z ? `<i class="z${i + 1}" style="flex:${z}"></i>` : "").join("")}</div><div class="zbar-l">${zs.map((z, i) => `<span><i class="z${i + 1}"></i>Z${i + 1} ${Math.round(z / tot * 100)} %</span>`).join("")}</div></div>`;
}
function flowBlock(s, P) {
  const W = P.wsteps || []; if (!W.length) return "";
  const grp = { warm: [], main: [], cool: [] }; let seenMain = false;
  const hasMain = W.some(x0 => !["warm", "easy", "cool"].includes(x0.kind));
  W.forEach(x0 => { if (x0.kind === "cool" && hasMain) grp.cool.push(x0); else if (hasMain && !seenMain && (x0.kind === "warm" || x0.kind === "easy")) grp.warm.push(x0); else { seenMain = true; grp.main.push(x0); } });
  const zs = [...new Set(W.map(x0 => x0.z || 1))].sort(), zl = zs.length > 1 ? "Z" + zs[0] + " + Z" + zs[zs.length - 1] + (grp.main.some(x0 => x0.n > 1) ? "-Intervalle" : "") : "Z" + zs[0];
  const dur = a => Math.round(a.reduce((p, x0) => p + (x0.n || 1) * (x0.dur || 0) + (x0.n > 1 && x0.rest && x0.rest.dur ? (x0.n - 1) * x0.rest.dur : 0), 0));
  const row = x0 => `<div class="fl-r z${x0.z || 1}"><b>${x0.n > 1 ? x0.n + "× " : ""}${esc(x0.lab.replace(/^\d+\s*[×x]\s*/, ""))}</b><span>${esc([x0.target, x0.hf ? "HF " + x0.hf : "", x0.n > 1 && x0.rest ? (x0.rest.txt || "") : ""].filter(Boolean).join(" · "))}</span></div>`;
  const sec = (lab, a) => a.length ? `<div class="fl-g"><div class="fl-h"><span>${lab}</span><em>${dur(a) ? dur(a) + " min" : ""}</em></div>${a.map(row).join("")}</div>` : "";
  return `<section class="flow" aria-label="Ablauf"><div class="flow-h"><h3>Ablauf</h3><span class="pill">${esc(zl)}</span></div>${sec("Aufwärmen", grp.warm)}${sec("Hauptteil", grp.main)}${sec("Abwärmen", grp.cool)}</section>`;
}
/* ---------- 5.0 Coach-Einschätzung je Einheit, Zielkarte, letzte Einheit ---------- */
function takeCard(s, c) {
  const k = E.workoutTake(B, ST, c.t, s, c.Ex); if (!k) return ""; const l = log(s);
  const head = k.dev ? "Anders als geplant" : k.hit === "ok" ? "Erfüllt" : "Teilweise";
  const li = a => `<ul>${a.map(g => `<li>${esc(g)}</li>`).join("")}</ul>`;
  return `<section class="take ${k.hit}" aria-label="Coach-Einschätzung"><div class="take-h"><img src="logo.png" alt=""><div><span class="take-k">Einschätzung des Coaches</span><b>${esc(head)}</b></div></div>
   ${k.good.length ? `<div class="take-s ok"><h4>Positives</h4>${li(k.good)}</div>` : ""}${k.watch.length ? `<div class="take-s warn"><h4>Beobachtungspunkte</h4>${li(k.watch)}</div>` : ""}${zoneBar((l.gx || {}).zs)}
   ${k.next ? `<button class="take-next" data-act="sess" data-id="${esc(k.nextId)}"><span class="tx"><h4>Nächstes Mal</h4><span>${esc(k.next)}</span></span>${ui("chev", "chev")}</button>` : ""}
   <p class="take-goal">${ui("flag")}<span>${esc(k.goal)}</span></p>
   ${l.kiTake ? `<div class="take-ki"><h4>KI-Coach</h4><p>${esc(l.kiTake)}</p></div>` : PREF.aikey ? `<button class="btn sm ghost take-kibtn" data-act="kitake" data-id="${esc(s.id)}">${ui("sync")}Von der KI einordnen lassen</button>` : ""}</section>`;
}
function goalCard(c) {
  if (c.pre) return ""; const G = E.goalStatus(B, ST, c.t, c.Ex), P = E.goalPath(B, ST, c.t, c.Ex); if (!P) return "";
  const act = Object.keys(ST).filter(k => k.startsWith("adj:")).map(k => ST[k].v).find(a => a && !a.undone && /^goal:/.test(a.key || ""));
  const nOpen = checksCard(c, true), span = Math.max(P.p0, P.now) - P.p1 || 1, pos = v => Math.max(0, Math.min(100, (Math.max(P.p0, P.now) - v) / span * 100));
  const st = P.behind > 1 / 1440 ? "hinter Plan" : "auf Kurs";
  return `<section class="goalc ${G.lvl}" aria-label="Ziel"><button class="goalc-b" data-tab="fort"><span class="tx"><span class="gk">Ziel ${esc(P.race.replace("Marathon ", ""))} · noch ${P.days} Tage</span>
   <span class="gline"><b>${hm5(P.now)}</b><span class="gtrack"><i class="soll" style="left:${pos(P.sNow).toFixed(1)}%"></i><i class="now" style="left:${pos(P.now).toFixed(1)}%"></i><i class="goal" style="left:100%"></i></span><b class="gz">${hm5(P.p1)}</b></span>
   <span class="gl">Heute ${hm5(P.now)} · Soll heute ${hm5(P.sNow)} · ${esc(st)}</span>
   <span class="gchips"><span class="gc ${G.lvl}">Plantreue ${G.score} %</span>${nOpen ? `<span class="gc warn">${nOpen} Check${nOpen > 1 ? "s" : ""} offen</span>` : `<span class="gc ok">Checks grün</span>`}</span></span>${ui("chev", "chev")}</button>
   ${act ? `<div class="goalc-plan">${ui("sync")}<span><b>Aufholplan aktiv.</b> ${esc(act.title.replace(/^Ziel halten: /, ""))}</span><button class="lnkbtn" data-act="undoadj" data-v="${esc(act.id)}">Zurücknehmen</button></div>` : ""}</section>`;
}
function lastTake(c) {
  const t = c.t, L = c.Ex.filter(x => x.date <= t && x.date >= t - 7 && E.isTrain(x) && ["✓", "½"].includes(E.statusOf(ST, x, t))).sort((a, b) => b.date - a.date || String(b.time).localeCompare(String(a.time)));
  const s = L.find(x => ["Lauf", "Rad", "Schwimmen", "Triathlon"].includes(x.sport)) || L[0];
  if (!s) return ""; const k = E.workoutTake(B, ST, t, s, c.Ex); if (!k) return "";
  const first = k.watch[0] || k.good[0] || "";
  return `<button class="lastt ${k.hit}" data-act="sess" data-id="${esc(s.id)}"><img src="logo.png" alt=""><span class="tx"><span class="gk">Letzte Einheit · ${esc(dayLabel(s.date, t))}</span><b>${esc(String(s.name).replace(/^★\s*/, ""))}: ${esc(k.dev ? "anders als geplant" : k.hit === "ok" ? "Ziel erreicht" : "teilweise getroffen")}</b><span class="gl">${esc(first)}</span>${k.next ? `<span class="gl nx">Nächstes Mal: ${esc(k.next)}</span>` : ""}</span>${ui("chev", "chev")}</button>`;
}
async function kiTake(id) {
  const c = C(), s = findS(id); if (!s || !PREF.aikey) return; const k = E.workoutTake(B, ST, c.t, s, c.Ex), l = log(s);
  const pack = { einheit: { name: s.name, sport: s.sport, typ: s.code, soll_min: s.min, soll_km: s.km, beschreibung: s.desc, ziel: E.zone(s, B, c.R) }, ist: { min: l.dur, km: l.dist, hf: l.hf, hfmax: l.hfmax, rpe: l.rpe, gefuehl: l.feel, schmerz: l.pain, garmin: l.gx, struktur: l.segs, notiz: l.note ? String(l.note).slice(0, 400) : undefined }, regeln: k, ziele: { linz: "3:09", hm: "1:29:59", allgaeu: "sub 5" } };
  toast("KI ordnet ein …", { icon: "sync" });
  try { const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": PREF.aikey, "anthropic-version": "2023-06-01", "content-type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: PREF.aimodel || "claude-opus-5-5", max_tokens: 600, messages: [{ role: "user", content: "Du bist ein erfahrener Lauf- und Triathloncoach. Ordne diese eine Einheit kritisch ein, auf Deutsch, du-Form, höchstens 5 Sätze, keine Aufzählung, keine Geviertstriche: was sie gebracht hat, was auffällt, was sie für die Ziele heißt und worauf es bei der nächsten Einheit ankommt. Erfinde keine Werte, die nicht im JSON stehen. Keine Diagnosen.\n\n" + JSON.stringify(pack) }] }) });
    const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || "HTTP " + r.status);
    const txt = (j.content || []).filter(b => b.type === "text").map(b => b.text).join(" ").trim().slice(0, 1200);
    setLog(id, { kiTake: txt }); render(); toast("KI-Einschätzung gespeichert.", { icon: "check" });
  } catch (e) { toast("KI nicht erreichbar: " + String(e.message || e).slice(0, 120)); }
}
/* ---------- 4.4 Sportarten als Ringe (Wochen-Soll), Details im Blatt ---------- */
const RING_LAB = { Lauf: "Laufen", Rad: "Rad", Schwimmen: "Schwimmen" }, RING_GO = { Lauf: "m", Rad: "bike", Schwimmen: "swim" };
function sAmt(k, z) {
  if (k === "Schwimmen") { const f = v => Math.round(v * 1000).toLocaleString("de-DE"); return { v: f(z.kmIs), of: f(z.km), u: "m", q: z.km ? z.kmIs / z.km : z.so ? z.is / z.so : null }; }
  if (z.km) { const f = v => v >= 100 ? Math.round(v).toLocaleString("de-DE") : de(v); return { v: f(z.kmIs), of: f(z.km), u: "km", q: z.kmIs / z.km }; }
  return { v: de(z.is / 60), of: de(z.so / 60), u: "h", q: z.so ? z.is / z.so : null };
}
function perfShort(k, v) { if (!num(v)) return ""; return k === "Lauf" ? U.hms(v).replace(/:\d\d$/, "") + " h" : k === "Rad" ? de(v) + " km/h" : U.mss(v) + " /100 m"; }
function perfGoal(k, v) { if (!num(v)) return ""; return k === "Lauf" ? U.hms(v).replace(/:\d\d$/, "") : k === "Rad" ? de(v) : U.mss(v); }
/* 4.4 G6: Ring-Beschriftung ohne Missverständnis: "Prognose 3:22" statt "3:22 h". */
function ringPerf(k, p) { const hm = v => U.hms(v).replace(/:\d\d$/, ""), d1 = v => (Math.round(v * 10) / 10).toLocaleString("de-DE");
  const pre = k === "Lauf" ? "Prognose" : k === "Rad" ? "Ø" : /CSS/.test(p.lab || "") ? "CSS" : "Pace";
  const f = v => k === "Lauf" ? hm(v) : k === "Rad" ? d1(v) + " km/h" : U.mss(v);
  return { cur: num(p.cur) ? pre + " " + f(p.cur) : (k === "Rad" ? "Tempo" : pre) + " –", goal: num(p.goal) ? "Ziel " + f(p.goal) + (k === "Schwimmen" ? " /100 m" : "") : "" }; }
function perfTrend(p) { if (!num(p.cur)) return { cls: "", ic: "flat", lab: "noch keine Daten" }; if (!num(p.start) || Math.abs(p.cur - p.start) < 1e-9) return { cls: "", ic: "flat", lab: "unverändert" };
  const better = p.lower ? p.cur < p.start : p.cur > p.start; return better ? { cls: "ok", ic: "up", lab: "besser als zum Start" } : { cls: "bad", ic: "dn", lab: "schwächer als zum Start" }; }
function ringSvg(q, k) {
  const r = 42, f = q == null ? 0 : Math.max(0, Math.min(1, q)), full = q != null && q >= 1;
  return `<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="ring-bg" cx="50" cy="50" r="${r}"/>${f > 0 ? `<circle class="ring-fg" cx="50" cy="50" r="${r}" pathLength="100" stroke-dasharray="${(f * 100).toFixed(1)} 100" transform="rotate(-90 50 50)"/>` : ""}${full ? `<g class="ring-ok" transform="translate(50 8)"><circle r="7.5"/><path d="M-3.4 .2l2.3 2.3 4.6-4.8"/></g>` : ""}</svg>`;
}
function ringsBlock(c) {
  if (c.pre) return "";
  const S = E.sportSummary(B, ST, c.t, c.Ex);
  const card = k => { const o = S[k], a = sAmt(k, o.wk), p = o.perf, tr = perfTrend(p), pct = o.pct == null ? null : Math.round(o.pct * 100);
    const al = `${RING_LAB[k]}: diese Woche ${a.v} von ${a.of} ${a.u}${a.q != null ? ", " + Math.round(a.q * 100) + " Prozent" : ""}. Seit Start ${pct == null ? "noch kein Soll" : pct + " Prozent"}. ${p.lab} ${num(p.cur) ? "heute " + perfShort(k, p.cur) : "noch offen"}, Ziel ${perfShort(k, p.goal)}. Details öffnen`;
    const rp = ringPerf(k, p);
    return `<button class="rc${a.q == null ? " nosoll" : ""}" data-act="sport" data-v="${k}" style="--c:${sp(k).c};--t:${sp(k).t}" aria-label="${esc(al)}">
      <span class="rc-ring">${ringSvg(a.q, k)}<span class="rc-in"><span class="rc-ic">${icon(k)}</span>${a.q == null ? `<b class="num">${esc(a.v)}</b><small>ohne Soll</small>` : `<b class="num">${esc(a.v)}</b><small>von ${esc(a.of)} ${a.u}</small>`}</span></span>
      <b class="rc-n">${RING_LAB[k]}</b><span class="rc-l">seit Start ${pct == null ? "–" : pct + " %"}</span>
      <span class="rc-tr ${tr.cls}" title="${esc(p.lab + ": " + tr.lab)}">${num(p.cur) && tr.ic !== "flat" ? ui(tr.ic) : ""}<span>${esc(rp.cur)}</span></span>${rp.goal ? `<span class="rc-g">${esc(rp.goal)}</span>` : ""}</button>`; };
  return `<section class="rings" aria-label="Sportarten diese Woche"><div class="ov-h"><h2>Diese Woche</h2><span>Ring = Wochen-Soll</span></div><div class="rings-g">${["Lauf", "Rad", "Schwimmen"].map(card).join("")}</div></section>`;
}
function sportSheet(D) {
  const c = C(), k = D.k, o = E.sportSummary(B, ST, c.t, c.Ex)[k], p = o.perf, S = sp(k), pc = x => Math.round(Math.max(0, Math.min(1, x)) * 100);
  const line = (lab, z) => { const a = sAmt(k, z), q = a.q; return `<div class="ss-r"><div class="ss-t"><span>${lab}</span><b class="num">${esc(a.v)} <small>von ${esc(a.of)} ${a.u}</small></b></div><div class="ss-bar" aria-hidden="true"><i style="width:${q == null ? 0 : pc(q)}%"></i></div><div class="ss-s">${q == null ? "Noch kein Soll" : Math.round(q * 100) + " % erfüllt"} · ${esc(z.is > 0 ? durStr(z.is) : "0 min")} von ${esc(durStr(z.so))}</div></div>`; };
  const fr = c.free.filter(f => f.sport === k && f.date <= c.t).map(f => Object.assign({ isFree: true, w: E.weekOf(B, f.date), name: f.name || S.lab, km: f.dist || 0, min: f.dur || 0, prio: "" }, f, { id: "free:" + f.id }));
  const done = c.Ex.filter(s => s.sport === k && s.date <= c.t && !s.dropped && ["✓", "½"].includes(E.statusOf(ST, s, c.t))).concat(fr).sort((a, b) => b.date - a.date).slice(0, 5);
  const tr = perfTrend(p);
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:${S.c};--t:${S.t}">${icon(k)}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">${esc(S.lab)}</h2><p>Woche ${c.cw} von ${c.NW}</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<div class="ss" style="--c:${S.c};--t:${S.t}">${line("Diese Woche", o.wk)}${line("Seit Start", o.tot)}</div>`;
  x += `<h3 class="ss-h">${esc(p.lab)}</h3><div class="ss perf" style="--c:${S.c};--t:${S.t}"><span class="ptrack" aria-hidden="true"><i class="pfill" style="width:${p.frac != null ? pc(p.frac) : 0}%"></i>${p.frac != null ? `<i class="pdot" style="left:${pc(p.frac)}%"></i>` : ""}</span>
    <span class="pv"><span>${num(p.start) ? "Start " + esc(p.fmt(p.start)) : "Start offen"}</span><b>${num(p.cur) ? "<small>heute </small>" + esc(p.fmt(p.cur)) : "noch keine Daten"}</b><span>Ziel ${esc(p.fmt(p.goal))}</span></span>
    <p class="note">${num(p.cur) ? `<span class="rc-tr ${tr.cls}">${ui(tr.ic)}<span>${esc(tr.lab)}</span></span>` : ""}${p.reached ? " Ziel erreicht." : ""} Grundlage: ${esc(p.basis)}.</p></div>`;
  x += `<h3 class="ss-h">Letzte Einheiten</h3>` + (done.length ? `<div class="grp">${done.map(s => sessRow(s, c, { date: true, noSwipe: true })).join("")}</div>` : `<div class="grp"><div class="row plain"><span class="tx"><span class="t1">Noch nichts eingetragen</span><span class="t2">Erledigte Einheiten erscheinen hier.</span></span></div></div>`);
  x += `<div class="sh-foot"><button class="btn" data-act="sportgo" data-v="${RING_GO[k]}">Mehr in Fortschritt</button><button class="btn ink" data-act="close">Fertig</button></div>`;
  return x;
}

/* ---------- v3.3 Einklappbare Gruppen (wie iOS-Einstellungen). Zustand lokal in PREF.fold, nie im Sync. ---------- */
const FOLD_DEF = { "heute:Nächste 7 Tage": true, "fort:Disziplinen": true, "daten:Aktivitäten": true };
const foldOpen = (id, first) => { const f = PREF.fold || {}; return id in f ? !!f[id] : id in FOLD_DEF ? FOLD_DEF[id] : !!first && !/^prof:/.test(id); };
function fold(id, title, sum, body, opt) { opt = opt || {}; const o = foldOpen(id, opt.first);
  return `<section class="fold${o ? " open" : ""} ${opt.cls || ""}" data-fold="${esc(id)}"><button class="fold-h" data-act="fold" data-v="${esc(id)}" aria-expanded="${o}">${opt.ic ? `<span class="fic" style="--c:${opt.ic[1]}">${opt.ic[0].length > 12 ? opt.ic[0] : ui(opt.ic[0])}</span>` : ""}<span class="fold-t">${esc(title)}</span><span class="fold-s">${sum || ""}</span>${ui("chev", "fold-c")}</button><div class="fold-b"><div class="fold-i">${body}</div></div></section>`; }
/* Seiten mit .sec-Überschriften (Leistung, Daten, Profil) werden nachträglich zu Gruppen. */
function foldify(root) {
  if (!root || tab === "plan" || tab === "heute" || tab === "prof") return; /* 4.4 F: Profil ist kurz genug, alles sichtbar */
  const secs = [...root.children].filter(n => n.classList.contains("sec"));
  secs.forEach((h, i) => { const t = (h.querySelector("h2") || h).textContent.trim(), id = tab + ":" + t, o = foldOpen(id, i === 0);
    const sumEl = [...h.children].find(n => n.tagName !== "H2"); const sum = sumEl ? sumEl.outerHTML : "";
    const sec = document.createElement("section"); sec.className = "fold" + (o ? " open" : ""); sec.dataset.fold = id;
    sec.innerHTML = `<button class="fold-h" data-act="fold" data-v="${esc(id)}" aria-expanded="${o}"><span class="fold-t">${esc(t)}</span><span class="fold-s">${sumEl && !sumEl.matches("button,a") && !sumEl.querySelector("button,a") ? sumEl.innerHTML : ""}</span>${ui("chev", "fold-c")}</button><div class="fold-b"><div class="fold-i"></div></div>`;
    const inner = sec.querySelector(".fold-i"); if (sumEl && (sumEl.matches("button,a") || sumEl.querySelector("button,a"))) inner.appendChild(sumEl);
    let n = h.nextElementSibling; while (n && !n.classList.contains("sec") && !n.classList.contains("nofold")) { const nx = n.nextElementSibling; inner.appendChild(n); n = nx; }
    h.replaceWith(sec); });
}
function toggleFold(id) { PREF.fold = Object.assign({}, PREF.fold || {}); const el = document.querySelector(`.fold[data-fold="${CSS.escape(id)}"]`); const o = el ? !el.classList.contains("open") : !foldOpen(id); PREF.fold[id] = o; idbPut("pref", PREF);
  if (el) { el.classList.toggle("open", o); const b = el.querySelector(".fold-h"); if (b) b.setAttribute("aria-expanded", o); } buzz(3); }

/* ---------- 4.4 Übersicht: Heute und morgen, Körper heute, Nächste Termine, Was sich geändert hat ---------- */
function garDay(t) { for (let d = t; d >= t - 2; d--) { const x = get("gar:d:" + d); if (x) return Object.assign({ d }, x); } return null; }
function changedBlock(c) {
  const rec = Object.keys(ST).filter(k => k.startsWith("adj:")).map(k => ST[k].v).filter(a => a && a.auto && !a.undone && !a.seen && Date.now() - a.created < 4 * 864e5).sort((a, b) => b.created - a.created).slice(0, 5);
  if (!rec.length) return "";
  return `<section class="ov-sec ov-chg" aria-label="Was sich geändert hat"><div class="ov-h"><h2>Was sich geändert hat</h2><button class="lnk" data-act="adjseenall">Verstanden</button></div><div class="grp">${rec.map(a => `<div class="row plain chg"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("sync")}</span><span class="tx"><span class="t1">${esc(a.title)}</span><span class="t2">${esc((a.lines && a.lines.length ? a.lines.slice(0, 2).join(", ") + (a.lines.length > 2 ? " …" : "") : a.why || ""))}</span></span><button class="btn sm ghost" data-act="undoadj" data-v="${esc(a.id)}" aria-label="Rückgängig: ${esc(a.title)}">${ui("undo")}<span class="bl">Rückgängig</span></button></div>`).join("")}</div></section>`;
}
function todayBlock(c, h) {
  const t = c.t; let rows = "", canTick = false;
  [t, t + 1].forEach(d => { const it = dayItems(c, d).filter(s => s.sport !== "Ruhe" && !s.dropped), ab = E.absOn(ST, d, t);
    rows += `<div class="tm-d"><span>${d === t ? "Heute" : "Morgen"}</span><small>${esc(U.wdD(d))}</small>${ab.map(a => `<span class="abpill ab-${a.kind}">${esc(E.ABS_KIND[a.kind].lab)}</span>`).join("")}</div>`;
    if (it.length) { rows += `<div class="grp">${it.map(s => sessRow(s, c, {})).join("")}</div>`; if (d === t && it.some(s => needs(s, t) && !s.dropped)) canTick = true; }
    else rows += `<div class="grp"><div class="row plain rest"><span class="restmark" aria-hidden="true"></span><span class="tx"><span class="t1">${ab.length ? "Kein Training geplant" : "Ruhetag"}</span></span></div></div>`; });
  const dt = E.dayType(c.Ex, ST, t), kg = KG();
  let tip = "";
  if (["lang", "schluessel", "laden"].includes(dt.key)) { const N = kg ? E.dayNeeds(dt, kg) : null, lab = dt.key === "lang" ? "Langer Tag" : dt.key === "laden" ? "Kohlenhydrate laden" : "Harter Tag";
    tip = `<button class="ov-tip" data-act="${kg ? "nut" : "kg"}" data-v="${t}"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("fork")}</span><span class="tx"><b>${lab}</b> ${N ? `Rund ${N.khT} g Kohlenhydrate und ${N.pT} g Eiweiß über den Tag.` : "Für Mengen einmal das Gewicht eintragen."}</span>${ui("chev", "chev")}</button>`; }
  const hint = canTick ? `<p class="ov-hint">${ui("check")}${WIDE() ? "Abhaken: Einheit anklicken und Erledigt wählen." : "Abhaken: Zeile nach rechts wischen."}</p>` : "";
  return `<section class="ov-sec ov-today" aria-label="Heute und morgen"><div class="ov-h"><h2>Heute und morgen</h2><button class="lnk" data-tab="plan">Plan</button></div>${rows}${hint}${tip}</section>`;
}
/* 5.2: Ernährungstipp nur an harten/langen Tagen, eigenständig (Heute und morgen deckt jetzt die Wochenkarte ab) */
function nutTip(c) { const t = c.t, dt = E.dayType(c.Ex, ST, t), kg = KG(); if (!["lang", "schluessel", "laden"].includes(dt.key)) return "";
  const N = kg ? E.dayNeeds(dt, kg) : null, lab = dt.key === "lang" ? "Langer Tag" : dt.key === "laden" ? "Kohlenhydrate laden" : "Harter Tag";
  return `<button class="ov-tip solo" data-act="${kg ? "nut" : "kg"}" data-v="${t}"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("fork")}</span><span class="tx"><b>${lab}</b> ${N ? `Rund ${N.khT} g Kohlenhydrate und ${N.pT} g Eiweiß über den Tag.` : "Für Mengen einmal das Gewicht eintragen."}</span>${ui("chev", "chev")}</button>`; }
function bodyBlock(c) {
  const t = c.t, R = readyOf(c), GD = garDay(t), HV = GD ? E.hrvSignal(ST, GD.d) : null, v = verdict(c.cw);
  const chk = get("chk:" + c.cw), due = !c.pre && U.sd(t).getUTCDay() === 0 && !(chk && num(chk.puls));
  const tile = (lab, val, sub, attr, cls) => `<button class="kt ${cls || ""}" ${attr}><span>${lab}</span><b class="num">${val}</b><small>${esc(sub)}</small></button>`;
  let g = tile("Bereitschaft", esc(R.lab), R.mc ? "Morgen-Check erledigt" : "Morgen-Check offen", `data-act="mc" data-v="${t}" aria-label="Bereitschaft ${esc(R.lab)}. Morgen-Check ${R.mc ? "ansehen" : "machen"}"`, "rd " + R.cls);
  if (GD) {
    g += tile("Schlaf", num(GD.sleep) ? de(GD.sleep) + "<small> h</small>" : "–", num(GD.score) ? "Score " + GD.score : "kein Score", `data-tab="ges"`);
    g += tile("HRV", num(GD.hrv) ? Math.round(GD.hrv) + "<small> ms</small>" : "–", HV && HV.low ? "unter deinem Schnitt" : HV && HV.avg ? "Schnitt " + Math.round(HV.avg) : "Schnitt ab 4 Tagen", `data-tab="ges"`, HV && HV.low ? "warn" : "");
    g += tile("Body Battery", num(GD.bbHi) ? String(GD.bbHi) : "–", num(GD.bbLo) ? "Tiefst " + GD.bbLo : "Höchstwert", `data-tab="ges"`);
  } else g += `<div class="kt none"><span>Garmin</span><small>Noch keine Werte. Oben auf Garmin tippen.</small></div>`;
  const chkRow = `<button class="row kh-chk ${v.cls}${due ? " due" : ""}" data-act="checkin" data-w="${c.cw}"><span class="badge-ic" style="--c:var(--gold-s);--t:var(--gold)">${ui("heart")}</span><span class="tx"><span class="t1">${due ? "Sonntag: Check-in für Woche " + c.cw : "Wochen-Check-in"}</span><span class="t2">${due ? "30 Sekunden, steuert die Ampel" : esc(v.txt.split(":")[0])}</span></span>${ui("chev", "chev")}</button>`;
  return `<section class="ov-sec ov-body" aria-label="Körper heute"><div class="ov-h"><h2>Körper heute</h2><button class="lnk" data-tab="ges">Gesundheit</button></div><div class="ktiles">${g}</div><div class="grp">${chkRow}</div></section>`;
}
function nextBlock(c) {
  const t = c.t, it = [];
  const nt = testGroups().filter(T => !U.RACE_TYPES.includes(T.typ)).map(T => Object.assign(T, { ed: testDate(T) })).filter(T => T.ed >= t && !testDone(T)).sort((a, b) => a.ed - b.ed)[0];
  const inD = n => n === 0 ? "heute" : n === 1 ? "morgen" : "in " + n + " Tagen";
  if (nt) it.push({ d: nt.ed, h: `<button class="tc" data-act="test" data-k="${esc(nt.key)}">${ui("star")}<span>${esc(nt.name.replace(/:? ?400 m/, ""))} <b>${inD(nt.ed - t)}</b></span></button>` });
  B.S.events.filter(e => e.date >= t).sort((a, b) => a.date - b.date).slice(0, 2).forEach(e => { const s = c.Ex.find(x => x.test === "race" && x.date === e.date);
    it.push({ d: e.date, h: `<button class="tc race" ${s ? `data-act="sess" data-id="${esc(s.id)}"` : `data-tab="plan"`}>${ui("flag")}<span>${esc(String(e.name).replace("Olympische Distanz", "OD").replace("Triathlon Classic", "").trim())} <b>${inD(e.date - t)}</b></span></button>` }); });
  const A = E.absences(ST, t).filter(a => (a.to != null ? a.to : t) >= t).slice(0, 2);
  A.forEach(a => it.push({ d: Math.max(a.from, t), h: `<button class="tc" data-act="abs">${ui(a.kind === "krank" ? "sick" : "plane")}<span>${esc(absLabel(a))} <b>${esc(a.from > t ? "ab " + U.wdD(a.from) : a.to != null ? "bis " + U.wdD(a.to) : "seit " + U.wdD(a.from))}</b></span></button>` }));
  if (!it.length) return "";
  return `<section class="ov-next" aria-label="Nächste Termine"><span class="on-l">Nächste Termine</span><div class="chipline">${it.sort((a, b) => a.d - b.d).map(x => x.h).join("")}</div></section>`;
}
function dashGrid(c, h) {
  return `<div class="ov-grid one">${bodyBlock(c)}</div>`;
}
/* ---------- 4.4 Seite Gesundheit: Bereitschaft, Erkenntnisse, Verläufe 28 Tage (eigene SVG-Diagramme) ---------- */
let HG = null;
const HCOL = { hrv: "var(--h-hrv)", rhr: "var(--h-rhr)", sleep: "var(--h-sleep)", score: "var(--navy)", stress: "var(--h-stress)", bb: "var(--h-bb)", steps: "var(--h-steps)", load: "var(--h-load)", ctl: "var(--navy)", atl: "var(--crimson)" };
const hNum = (v, d) => num(v) ? de(v, d ?? 0) : "–";
function hLatest(D, k, t) { for (let i = D.length - 1; i >= 0 && D[i].d >= t - 2; i--) if (num(D[i][k])) return D[i]; return null; }
function hAvg(D, k, n) { const a = D.slice(-(n || 7) - 1, -1).map(x => x[k]).filter(num); return a.length >= 4 ? a.reduce((x, y) => x + y, 0) / a.length : null; }
function vGes(c) {
  const t = c.t, D = E.healthDays(ST, t, 28, c.F), I = E.healthInsights(D), R = readyOf(c), cnt = k => D.filter(x => num(x[k])).length; HG = { D, t };
  const when = d => d === t ? "" : d === t - 1 ? "gestern · " : U.wdD(d) + " · ";
  const tile = (lab, k, fmt, unit, sub) => { const x = hLatest(D, k, t), a = hAvg(D, k); return `<div class="gt-i"><span>${lab}</span><b class="num">${x ? fmt(x[k]) : "–"}${x && unit ? `<small> ${unit}</small>` : ""}</b><small>${x ? esc(when(x.d) + (sub ? sub(x) : a != null ? "Schnitt " + fmt(a) : "Schnitt ab 4 Tagen")) : "keine Werte"}</small></div>`; };
  let x = `<header class="lt"><div><div class="eyebrow">Letzte 28 Tage</div><h1>Gesundheit</h1></div><div class="acts">${GAR_BTN()}${LOGO_BTN}</div></header>`;
  x += banners();
  x += `<section class="g-ready ${R.cls}" aria-label="Bereitschaft heute"><div class="g-rs"><span class="g-st">${ui(R.cls === "ok" ? "check" : R.cls === "warn" ? "info" : "x")}</span><div class="g-rt"><span>Bereitschaft heute</span><b>${esc(R.lab)}</b></div><span class="g-form" title="Form = Fitness minus Ermüdung">Form <b class="num">${esc(R.form)}</b></span></div><p class="g-why">${esc(R.txt)}</p>
    <div class="g-tiles">${tile("Schlaf", "sleep", v => de(v), "h", d => num(d.score) ? "Score " + d.score : "kein Score")}${tile("HRV", "hrv", v => Math.round(v), "ms")}${tile("Ruhepuls", "rhr", v => Math.round(v), "bpm")}${tile("Body Battery", "bbHi", v => Math.round(v), "", d => num(d.bbLo) ? "Tiefst " + d.bbLo : "Höchstwert")}${tile("Stress", "stress", v => Math.round(v), "", null)}${tile("Schritte", "steps", v => Math.round(v).toLocaleString("de-DE"), "", null)}</div>
    <div class="g-acts"><button class="btn sm${R.mc ? "" : " pri"}" data-act="mc" data-v="${t}">${ui("sun")}${R.mc ? "Morgen-Check ansehen" : "Morgen-Check"}</button><button class="btn sm" data-act="checkin" data-w="${c.cw}">${ui("heart")}Wochen-Check-in</button></div></section>`;
  /* Erkenntnisse */
  x += `<section class="g-sec" aria-label="Erkenntnisse"><div class="ov-h"><h2>Erkenntnisse</h2>${I.enough ? `<span>aus ${I.n} Tagen</span>` : ""}</div>`;
  if (!I.enough) x += `<div class="g-empty"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("prog")}</span><div class="tx"><b>Noch zu wenig Daten</b><p>Auswertungen erscheinen ab 7 Tagen mit Garmin-Werten. Bisher ${I.n === 1 ? "1 Tag" : I.n + " Tage"}.</p><button class="btn sm pri" data-act="garmin">${ui("sync")}Garmin aktualisieren</button></div></div>`;
  else x += `<div class="grp">${(I.items.length ? I.items : [{ sev: "ok", txt: "Keine Auffälligkeiten. Deine Werte liegen im gewohnten Bereich.", basis: "Vergleich mit deinem eigenen Schnitt" }]).map(i => `<div class="row plain ins ${i.sev}"><span class="ins-ic">${ui(i.sev === "warn" ? "info" : i.sev === "ok" ? "check" : "prog")}</span><span class="tx"><span class="t1">${esc(i.txt)}</span><span class="t2">${esc(i.basis)}</span></span></div>`).join("")}</div>`;
  x += `</section>`;
  /* Verläufe */
  const card = (k, title, val, sub, lg, n) => `<article class="hcard"><div class="hc-h"><h3>${title}</h3><span class="hc-v">${val}</span></div><p class="hc-s">${sub}</p>${n >= 2 ? `<div class="hc" data-k="${k}"></div><div class="hc-lg">${lg}</div>` : `<p class="hc-none">Noch keine Werte. ${n === 1 ? "Ein Tag reicht nicht für einen Verlauf." : "Garmin aktualisieren holt sie."}</p>`}</article>`;
  const sw = (cl, col, lab) => `<span class="lg"><i class="${cl}" style="--k:${col}"></i>${lab}</span>`;
  const Ft = c.F.find(f => f.d === t), hv = E.bandOf(D.map(x => x.hrv)), hl = hLatest(D, "hrv", t), m7 = E.rollMean(D, "hrv"), rl = hLatest(D, "rhr", t), sl = hLatest(D, "sleep", t), stl = hLatest(D, "stress", t), stp = hLatest(D, "steps", t);
  let g = card("load", "Belastung und Form", Ft ? `Form <b class="num">${esc(R.form)}</b>` : "", "Balken: Trainingslast je Tag. Linien: Fitness (42 Tage) und Ermüdung (7 Tage).", sw("bar", HCOL.load, "Last") + sw("line", HCOL.ctl, "Fitness") + sw("line dash", HCOL.atl, "Ermüdung"), 28);
  if (I.n) {
    g += card("hrv", "HRV", hl ? `<b class="num">${Math.round(hl.hrv)}</b> ms` : "", m7[27] != null || hv ? [m7[27] != null ? "Schnitt 7 Tage " + Math.round(m7[27]) + " ms" : "", hv ? "Normalbereich " + Math.round(hv.lo) + " bis " + Math.round(hv.hi) + " ms" : ""].filter(Boolean).join(". ") + "." : "Herzratenvariabilität in der Nacht. Höher ist erholter.", sw("dot", HCOL.hrv, "Nacht") + sw("line", HCOL.hrv, "Schnitt 7 Tage") + (hv ? sw("band", HCOL.hrv, "Normalbereich") : ""), cnt("hrv"));
    g += card("rhr", "Ruhepuls", rl ? `<b class="num">${Math.round(rl.rhr)}</b> bpm` : "", hAvg(D, "rhr", 27) != null ? "Schnitt 4 Wochen " + Math.round(hAvg(D, "rhr", 27)) + " bpm. Niedriger ist erholter." : "Niedriger ist erholter.", sw("dot", HCOL.rhr, "Morgens") + sw("line", HCOL.rhr, "Schnitt 7 Tage"), cnt("rhr"));
    g += card("sleep", "Schlaf", sl ? `<b class="num">${de(sl.sleep)}</b> h` : "", "Balken: Dauer in Stunden. Linie: Schlaf-Score (rechte Achse).", sw("bar", HCOL.sleep, "Dauer") + sw("line", HCOL.score, "Score") + sw("ref", "var(--mute)", "7 h"), Math.max(cnt("sleep"), cnt("score")));
    g += card("stress", "Stress und Body Battery", stl ? `Stress <b class="num">${Math.round(stl.stress)}</b>` : "", "Balken: Body Battery von Tiefst- bis Höchstwert. Linie: Stress im Tagesschnitt. Beides 0 bis 100.", sw("bar", HCOL.bb, "Body Battery") + sw("line", HCOL.stress, "Stress"), Math.max(cnt("stress"), cnt("bbHi")));
    g += card("steps", "Schritte", stp ? `<b class="num">${Math.round(stp.steps).toLocaleString("de-DE")}</b>` : "", hAvg(D, "steps", 27) != null ? "Schnitt 4 Wochen " + Math.round(hAvg(D, "steps", 27)).toLocaleString("de-DE") + " Schritte am Tag." : "Schritte am Tag.", sw("bar", HCOL.steps, "Schritte"), cnt("steps"));
  }
  x += `<section class="g-sec" aria-label="Verläufe"><div class="ov-h"><h2>Verläufe</h2><span>28 Tage bis heute</span></div><div class="g-charts">${g}</div></section>`;
  /* Körper und Alltag */
  const WT = E.weightTrend(ST, t), kg = KG(), dt = E.dayType(c.Ex, ST, t), N = kg ? E.dayNeeds(dt, kg) : null;
  const row = (attr, ic, col, t1, t2) => `<button class="row" ${attr}><span class="badge-ic" style="--c:${col[0]};--t:${col[1]}">${ui(ic)}</span><span class="tx"><span class="t1">${t1}</span><span class="t2">${esc(t2)}</span></span>${ui("chev", "chev")}</button>`;
  x += `<section class="g-sec" aria-label="Körper und Alltag"><div class="ov-h"><h2>Körper und Alltag</h2></div><div class="grp">
    ${row(`data-act="wt"`, "data", ["var(--lane)", "var(--lane-t)"], "Gewicht", WT ? de(WT.cur) + " kg" + (WT.n >= 3 ? ", " + (WT.wk > 0 ? "+" : "") + de(WT.wk, 2) + " kg pro Woche" : "") : kg ? de(kg) + " kg" : "Noch nicht eingetragen")}
    ${row(`data-act="${kg ? "nut" : "kg"}" data-v="${t}"`, "fork", ["var(--ok)", "var(--ok-t)"], "Ernährung heute", N ? N.lab + ": " + N.khT + " g Kohlenhydrate, " + N.pT + " g Eiweiß" : "Für Mengen einmal das Gewicht eintragen")}
    ${row(`data-act="fd" data-v="${t}"`, "book", ["var(--gold-s)", "var(--gold)"], "Ernährungstagebuch", "Mahlzeiten notieren")}${(() => { const lz = c.Ex.find(s => s.test === "race" && s.typ === "M" && s.date >= t); return lz ? row(`data-act="fuel" data-id="${esc(lz.id)}"`, "flag", ["var(--gold-s)", "var(--gold)"], "Verpflegungsplan " + esc(lz.name.replace(/^★\s*/, "").replace(/^Marathon\s*/, "")), "Gel- und Trinkplan für das Rennen") : ""; })()}</div></section>`;
  return x;
}
/* Diagramm mit echten Pixelmaßen (Breite erst nach dem Rendern bekannt), damit Schrift nicht skaliert. */
function niceTicks(lo, hi, n) { const span = hi - lo || 1, s0 = span / (n || 3), mag = Math.pow(10, Math.floor(Math.log10(s0))), st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= s0 - 1e-12) || 10 * mag;
  const a0 = Math.floor(lo / st) * st, a1 = Math.ceil(hi / st) * st, a = []; for (let v = a0; v <= a1 + st / 1e6; v += st) a.push(Math.round(v * 1e6) / 1e6); return { a, lo: a0, hi: a1 }; }
function hChart(o, W) {
  const D = o.D, N = D.length, Hh = o.h || (W < 420 ? 150 : 170), pl = 38, pr = o.y2 ? 34 : 10, pt = 18, pb = 22, iw = W - pl - pr, sw = iw / N;
  const X = i => pl + (i + .5) * sw, fin = a => a.filter(num);
  const dom = (vals, fix) => { let lo = fix && fix.min != null ? fix.min : Math.min(...vals), hi = fix && fix.max != null ? fix.max : Math.max(...vals); if (!vals.length) { lo = 0; hi = 1; }
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; } if (!(fix && fix.min != null)) lo -= (hi - lo) * .12; if (!(fix && fix.max != null)) hi += (hi - lo) * .08;
    const T = niceTicks(lo, hi, 3); lo = fix && fix.min != null ? fix.min : T.lo; hi = fix && fix.max != null ? fix.max : T.hi; return { lo, hi, ticks: T.a.filter(v => v >= lo - 1e-9 && v <= hi + 1e-9) }; };
  const v1 = [].concat(...(o.lines || []).filter(l => !l.y2).map(l => fin(l.v)), ...(o.bars || []).filter(b => !b.y2).map(b => fin(b.v).concat(b.v0 ? fin(b.v0) : [])), o.band ? [o.band.lo, o.band.hi] : [], o.ref != null ? [o.ref] : []);
  const A = dom(v1, o.y), A2 = o.y2 ? dom([].concat(...(o.lines || []).filter(l => l.y2).map(l => fin(l.v))), o.y2) : null;
  const Yf = ax => v => pt + (Hh - pt - pb) * (1 - (v - ax.lo) / ((ax.hi - ax.lo) || 1)), Y = Yf(A), Y2 = A2 ? Yf(A2) : null, f1 = o.fmt || (v => de(v, 0));
  let g = `<rect class="hc-td" x="${(X(N - 1) - sw / 2).toFixed(1)}" y="${pt}" width="${sw.toFixed(1)}" height="${Hh - pt - pb}"/>`;
  A.ticks.forEach(v => { g += `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="gt" x="${pl - 6}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end">${esc(f1(v))}</text>`; });
  g += `<text class="gu" x="${pl - 6}" y="${pt - 7}" text-anchor="end">${esc(o.unit || "")}</text>`;
  if (A2) { A2.ticks.forEach(v => { g += `<text class="gt" x="${W - pr + 6}" y="${(Y2(v) + 3.5).toFixed(1)}">${esc((o.fmt2 || (z => de(z, 0)))(v))}</text>`; }); g += `<text class="gu" x="${W - pr + 6}" y="${pt - 7}">${esc(o.unit2 || "")}</text>`; }
  if (o.band) g += `<rect class="hc-band" style="--k:${o.band.c}" x="${pl}" width="${iw}" y="${Y(o.band.hi).toFixed(1)}" height="${Math.max(0, Y(o.band.lo) - Y(o.band.hi)).toFixed(1)}"/>`;
  if (o.ref != null) g += `<line class="hc-ref" x1="${pl}" x2="${W - pr}" y1="${Y(o.ref).toFixed(1)}" y2="${Y(o.ref).toFixed(1)}"/>`;
  (o.bars || []).forEach(b => { const bw = Math.max(2, sw * (b.w || .62)); b.v.forEach((v, i) => { if (!num(v)) return; const y0 = b.v0 && num(b.v0[i]) ? b.v0[i] : A.lo, ya = Y(Math.max(v, y0)), yb = Y(Math.min(v, y0)), h = Math.max(1.5, yb - ya);
    g += `<rect class="hc-bar${b.cls && b.cls(i) ? " " + b.cls(i) : ""}" style="--k:${b.c}" x="${(X(i) - bw / 2).toFixed(1)}" y="${(yb - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(3, bw / 2).toFixed(1)}"/>`; }); });
  (o.lines || []).forEach(l => { const YY = l.y2 ? Y2 : Y; let d = "", pen = false; l.v.forEach((v, i) => { if (!num(v)) { pen = l.gap ? false : pen; return; } d += (pen ? "L" : "M") + X(i).toFixed(1) + " " + YY(v).toFixed(1); pen = true; });
    if (d && !l.noLine) g += `<path class="hc-ln${l.dash ? " dash" : ""}" style="--k:${l.c};stroke-width:${l.w || 2}" d="${d}"/>`;
    if (l.dots) l.v.forEach((v, i) => { if (num(v)) g += `<circle class="hc-dot" style="--k:${l.c}" cx="${X(i).toFixed(1)}" cy="${YY(v).toFixed(1)}" r="${sw > 14 ? 3 : 2.4}"/>`; }); });
  for (let i = N - 1; i >= 0; i -= 7) { const lab = i === N - 1 ? "heute" : U.sd(D[i].d).getUTCDate() + "." + (U.sd(D[i].d).getUTCMonth() + 1) + "."; g += `<text class="gt" x="${X(i).toFixed(1)}" y="${Hh - 6}" text-anchor="${i === N - 1 && pr < 20 ? "end" : "middle"}">${lab}</text>`; }
  if (o.tip) D.forEach((x, i) => { g += `<rect class="hc-hit" x="${(X(i) - sw / 2).toFixed(1)}" y="${pt}" width="${sw.toFixed(1)}" height="${Hh - pt - pb}"><title>${esc(o.tip(i))}</title></rect>`; });
  return `<svg class="hsvg" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(o.label || "")}">${g}</svg>`;
}
function hSpec(k) {
  if (!HG) return null; const D = HG.D, t = HG.t, v = f => D.map(x => num(x[f]) ? x[f] : null), day = i => U.wdD(D[i].d), r = x => num(x) ? Math.round(x) : "–";
  const last = (a, f) => { for (let i = a.length - 1; i >= 0; i--) if (num(a[i])) return f(a[i]); return "keine Werte"; };
  if (k === "load") { const L = D.map(x => num(x.load) ? Math.round(x.load) : 0), ctl = D.map(x => x.ctl), atl = D.map(x => x.atl);
    return { D, unit: "Last", y: { min: 0 }, bars: [{ v: L, c: HCOL.load, cls: i => D[i].d === t ? "plan" : "" }], lines: [{ v: ctl, c: HCOL.ctl, w: 2.2 }, { v: atl, c: HCOL.atl, w: 2, dash: true }],
      tip: i => day(i) + ": Last " + L[i] + (D[i].d === t ? " (Plan)" : "") + ", Fitness " + r(ctl[i]) + ", Ermüdung " + r(atl[i]), label: "Trainingslast je Tag der letzten 28 Tage mit Fitness und Ermüdung. Heute Fitness " + r(ctl[27]) + ", Ermüdung " + r(atl[27]) + "." }; }
  if (k === "hrv") { const h = v("hrv"), m = E.rollMean(D, "hrv"), b = E.bandOf(h);
    return { D, unit: "ms", band: b ? { lo: b.lo, hi: b.hi, c: HCOL.hrv } : null, lines: [{ v: m, c: HCOL.hrv, w: 2.4 }, { v: h, c: HCOL.hrv, noLine: true, dots: true }],
      tip: i => day(i) + ": HRV " + r(h[i]) + " ms" + (num(m[i]) ? ", Schnitt " + r(m[i]) : ""), label: "HRV der letzten 28 Tage in Millisekunden. Zuletzt " + last(h, r) + " ms" + (b ? ", Normalbereich " + r(b.lo) + " bis " + r(b.hi) : "") + "." }; }
  if (k === "rhr") { const h = v("rhr"), m = E.rollMean(D, "rhr");
    return { D, unit: "bpm", lines: [{ v: m, c: HCOL.rhr, w: 2.4 }, { v: h, c: HCOL.rhr, noLine: true, dots: true }], tip: i => day(i) + ": Ruhepuls " + r(h[i]) + " bpm", label: "Ruhepuls der letzten 28 Tage. Zuletzt " + last(h, r) + " bpm." }; }
  if (k === "sleep") { const h = v("sleep"), s = v("score");
    return { D, unit: "h", y: { min: 0, max: Math.max(9, Math.ceil(Math.max(0, ...h.filter(num)))) }, fmt: z => de(z, 0), ref: 7, bars: [{ v: h, c: HCOL.sleep }], lines: [{ v: s, c: HCOL.score, w: 1.8, dots: true, y2: true, gap: true }], y2: { min: 0, max: 100 }, unit2: "Score",
      tip: i => day(i) + ": " + (num(h[i]) ? de(h[i]) + " h" : "keine Dauer") + (num(s[i]) ? ", Score " + s[i] : ""), label: "Schlafdauer und Schlaf-Score der letzten 28 Tage. Zuletzt " + last(h, z => de(z) + " Stunden") + "." }; }
  if (k === "stress") { const s = v("stress"), hi = v("bbHi"), lo = v("bbLo");
    return { D, unit: "0–100", y: { min: 0, max: 100 }, bars: [{ v: hi, v0: lo, c: HCOL.bb, w: .5 }], lines: [{ v: s, c: HCOL.stress, w: 2, dots: true, gap: true }],
      tip: i => day(i) + ": Stress " + r(s[i]) + (num(hi[i]) ? ", Body Battery " + (num(lo[i]) ? lo[i] + " bis " : "") + hi[i] : ""), label: "Stress im Tagesschnitt und Body Battery der letzten 28 Tage. Zuletzt Stress " + last(s, r) + "." }; }
  if (k === "steps") { const s = v("steps");
    return { D, unit: "Tsd.", y: { min: 0 }, fmt: z => de(z / 1000, z % 1000 ? 1 : 0), bars: [{ v: s, c: HCOL.steps, cls: i => D[i].d === t ? "plan" : "" }], tip: i => day(i) + ": " + (num(s[i]) ? Math.round(s[i]).toLocaleString("de-DE") : "–") + " Schritte" + (D[i].d === t ? " (bis jetzt)" : ""), label: "Schritte je Tag der letzten 28 Tage. Zuletzt " + last(s, z => Math.round(z).toLocaleString("de-DE")) + "." }; }
  return null;
}
function paintHealth() { if (tab !== "ges" || !HG) return; $$(".hc[data-k]").forEach(el => { const W = Math.max(240, Math.floor(el.clientWidth)), o = hSpec(el.dataset.k); if (o) el.innerHTML = hChart(o, W); }); }
let hgRz = null; addEventListener("resize", () => { if (tab !== "ges") return; clearTimeout(hgRz); hgRz = setTimeout(paintHealth, 120); });
/* ---------- Video: Vorschau, Einbettung erst nach Tippen ---------- */
function vidCard(key, lab) { const v = Library.VIDEOS[key]; if (!v) return ""; return `<button class="vthumb wide" data-act="vplay" data-v="${esc(v.id)}" aria-label="Video abspielen: ${esc(v.t)}"><span class="vt-ic">${ui("play")}</span><span><b>${esc(lab)}</b><small>Video · ${esc(v.c)}</small></span></button>`; }
function vidEmbed(btn) { const id = btn.dataset.v; if (!/^[\w-]{11}$/.test(id)) return;
  const w = document.createElement("div"); w.className = "vframe"; w.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe><a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer">In YouTube öffnen</a>`; btn.replaceWith(w); }
/* ---------- 4.4 Paket D: Einheit-Fenster. Oben das Wesentliche, ein Hauptknopf, Hintergrundwissen eingeklappt. ---------- */
const FEEL = [[1, "Platt"], [2, "Müde"], [3, "Okay"], [4, "Gut"], [5, "Top"]];
const RPE_LAB = ["", "sehr leicht", "leicht", "locker", "moderat", "etwas hart", "hart", "sehr hart", "sehr hart", "maximal", "maximal"];
function face(n) {
  const eyes = n === 1 ? '<path d="M7.4 9.2l2.2 1M16.6 9.2l-2.2 1"/>' : '<circle cx="9" cy="9.8" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="9.8" r="1" fill="currentColor" stroke="none"/>';
  const m = ["", "M8 16.8q4-3.4 8 0", "M8.6 16.2q3.4-1.6 6.8 0", "M8.6 15.2h6.8", "M8.4 14.4q3.6 2.8 7.2 0", "M7.8 13.6q4.2 4.8 8.4 0"][n];
  return `<svg class="ico face" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.3"/>${eyes}<path d="${m}"/></svg>`;
}
const SX_OPEN = new Set(); let SX_ID = null, JUST_DONE = null;
function paceOf(min, km, sport) { if (!num(km) || !num(min) || km <= 0 || min <= 0) return ""; if (sport === "Lauf") return E.paceStr(min, km) + " /km"; if (sport === "Rad") return de(Math.round(km / (min / 60) * 10) / 10) + " km/h"; if (sport === "Schwimmen") return U.mss(min / (km * 10) / 1440) + " /100 m"; return ""; }
/* Zielwerte aus dem tatsächlichen Hauptteil, nicht nur aus dem Einheitentyp (sonst stünde beim Fahrtspiel "locker"). */
function sxPlan(s, c) {
  const z = zoneOf(s, c), zf = code => E.zone(Object.assign({}, s, { code }), B, c.R), wsteps = ["Lauf", "Rad", "Schwimmen"].includes(s.sport) ? Library.buildWorkout(s, zf, c.R.css ? c.R.css * 86400 : null) : [];
  const mains = wsteps.filter(x0 => x0.kind === "main" || x0.kind === "drill"), core = mains.length ? mains.reduce((a0, b0) => ((b0.z || 1) > (a0.z || 1) ? b0 : a0)) : wsteps.find(x0 => x0.kind === "easy") || null;
  const mainZ = core ? core.z || 1 : ({ T: 3, I: 4, HMZ: 3, MP: 2, LRM: 2, MD: 2, TEST: 4, M: 2, R3: 2, R4: 3 }[s.code] || 1);
  const mixed = core && wsteps.some(x0 => (x0.z || 1) === 1 && x0.kind !== "strides") && (core.z || 1) > 1;
  return { z, wsteps, mainZ, mixed, pace: core && core.target ? core.target : z.pace, hf: core && core.hf ? core.hf : z.hf };
}
function goalLine(s, P) {
  const hf = P.hf ? "HF " + String(P.hf).replace(/^HF\s*/i, "").replace(/\s*bpm$/, "") : "";
  return [s.km ? kmStr(s.km, s.sport) : "", s.min ? durStr(s.min) : "", P.pace ? (P.mixed ? "Hauptteil " : "") + P.pace : "", hf].filter(Boolean);
}
function sxStatus(s, t) {
  const k = s.dropped ? "skip" : stKind(s, t), st = s.isFree ? "✓" : E.statusOf(ST, s, t);
  const lab = s.dropped ? "Gestrichen" : k === "done" ? "Erledigt" : k === "half" ? "Teilweise" : k === "sick" ? "Krank" : k === "miss" ? (st === "✗" ? "Verpasst" : "Nicht eingetragen") : k === "skip" ? "Vorbei" : s.date === t ? "Heute" : s.date === t + 1 ? "Morgen" : "Geplant";
  return { k, lab };
}
function sxHead(s, c, P, mini) {
  const S = sp(s.sport), q = sxStatus(s, c.t), goal = s.isFree ? [] : goalLine(s, P), st = s.isFree ? "✓" : E.statusOf(ST, s, c.t);
  const tags = st === "✓" || st === "½" || st === "✗" ? [] : [`<span class="sx-st k-${q.k}">${sdot(S.c, q.k)}${esc(q.lab)}</span>`];
  if (!s.isFree && E.isTrain(s)) tags.push(`<span class="sx-tag zt z${P.mainZ}">${esc(Library.ZN[P.mainZ])}</span>`);
  if (s.test) tags.push(`<span class="sx-tag">${ui("flag")}${s.test === "race" ? "Rennen" : "Test"}</span>`);
  else if (s.prio === "A") tags.push(`<span class="sx-tag key">${ui("star")}Schlüssel</span>`);
  else if (s.prio === "C") tags.push(`<span class="sx-tag">Optional</span>`);
  return `<header class="sx-head" style="--c:${S.c};--t:${S.t}"><div class="sh-head sx-top"><span class="sx-ic">${icon(s.sport)}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">${esc(String(s.name || S.lab).replace(/^★\s*/, ""))}</h2><p>${esc(longDate(s.date))}${s.time ? " · " + esc(s.time) : ""}</p></div><button class="closebtn sx-x" data-act="close" aria-label="Schließen">${ui("x")}</button></div>${goal.length ? `<p class="sx-goal num${mini ? " mini" : ""}">${mini ? "<span>Geplant</span> " : ""}${goal.map(g => `<span class="gp">${esc(g)}</span>`).join(" · ")}</p>` : ""}${mini || !tags.length ? "" : `<div class="sx-tags">${tags.join("")}</div>`}</header>`;
}
function sxResult(s, a, l, st) {
  const S = sp(s.sport), half = st === "½", src = l.src === "garmin" ? ["watch", "Aus Garmin übernommen"] : (num(l.dur) || num(l.dist) || num(l.imin) || s.isFree) ? ["check", "Selbst eingetragen"] : ["check", "Wie geplant abgehakt"];
  const kv = [["Dauer", num(a.min) && a.min > 0 ? durStr(a.min) : ""], ["Distanz", a.km ? kmStr(a.km, s.sport) : ""], [s.sport === "Rad" ? "Tempo" : "Pace", paceOf(a.min, a.km, s.sport)], ["Ø Puls", num(l.hf) ? l.hf + " bpm" : ""]].filter(x0 => x0[1]);
  const fe = num(l.feel) && FEEL[l.feel - 1], pain = num(l.pain) ? l.pain : null;
  const mood = (fe ? `<span class="sx-chip">${face(fe[0])}${esc(fe[1])}</span>` : "") + (pain ? `<span class="sx-chip${pain >= 3 ? " warn" : ""}">Schmerz ${pain}, ${esc(PAIN_LAB[pain])}</span>` : "") + (num(l.rpe) ? `<span class="sx-chip">Anstrengung ${l.rpe}</span>` : "") + (num(l.hm) ? `<span class="sx-chip">${l.hm} Hm</span>` : "");
  const foot = s.isFree ? `<div class="sx-res-f"><button class="lnkbtn" data-act="freeedit" data-id="${esc(s.id)}">${ui("pen")}Bearbeiten</button><button class="lnkbtn bad" data-act="freedel" data-id="${esc(s.id)}">${ui("trash")}Löschen</button></div>` : `<div class="sx-res-f"><button class="lnkbtn mute" data-act="clearst" data-id="${esc(s.id)}">${ui("undo")}Eintrag löschen</button></div>`;
  return `<section class="sx-res${JUST_DONE === s.id ? " fresh" : ""}" style="--c:${S.c};--t:${S.t}" aria-label="Ergebnis"><div class="sx-res-h">${sdot(S.c, half ? "half" : "done")}<div class="tx"><b>${half ? "Teilweise erledigt" : "Erledigt"}</b><span>${ui(src[0])}${esc(src[1])}</span></div>${s.isFree ? "" : `<button class="btn sm" data-act="mode" data-v="log">${ui("pen")}Ändern</button>`}</div>${kv.length ? `<div class="sx-kv">${kv.map(([k, v]) => `<div><span>${k}</span><b class="num">${esc(v)}</b></div>`).join("")}</div>` : ""}${mood ? `<div class="sx-mood">${mood}</div>` : ""}${l.note ? `<p class="sx-note">${esc(l.note)}</p>` : ""}${foot}</section>`;
}
function sxSec(k, ic, title, sub, body) {
  return `<details class="sx-sec" data-sx="${k}"${SX_OPEN.has(k) ? " open" : ""}><summary><span class="sx-si">${ui(ic)}</span><span class="tx"><span class="t1">${esc(title)}</span>${sub ? `<span class="t2">${esc(sub)}</span>` : ""}</span>${ui("chev", "chev")}</summary><div class="sx-sb">${body}</div></details>`;
}
function sessView(id, D) {
  const c = C(), s = findS(id); if (!s) return `<div class="empty"><b>Einheit nicht gefunden</b></div>`;
  if (SX_ID !== id) { SX_ID = id; SX_OPEN.clear(); }
  const t = c.t, S = sp(s.sport), st = s.isFree ? "✓" : E.statusOf(ST, s, t), l = s.isFree ? s : log(s);
  const P = s.isFree ? { mainZ: 1, wsteps: [] } : sxPlan(s, c);
  if (D.mode === "log") return sxHead(s, c, P, true) + logForm(s, D, c);
  if (D.mode === "miss") return sxHead(s, c, P, true) + missForm(s, D, c);
  if (s.isFree) return sxHead(s, c, P) + sxResult(s, { min: s.min, km: s.km }, s, "✓");
  const a = E.actual(ST, s, t), doneish = st === "✓" || st === "½";
  const can = !s.dropped && s.date <= t && E.isTrain(s) && st !== "krank", canMove = !s.dropped && s.date >= t && s.test !== "race" && s.sport !== "Ruhe";
  let x = sxHead(s, c, P);
  if (s.orig) x += `<div class="sx-info">${ui("info")}<span>Angepasst. Ursprünglich ${esc(s.orig.name)}${s.orig.km ? ", " + de(s.orig.km) + " km" : s.orig.min ? ", " + s.orig.min + " min" : ""}.${s.note ? " " + esc(s.note) : ""}</span>${s.adj ? `<button class="lnkbtn" data-act="undoadj" data-v="${esc(s.adj)}">Zurücknehmen</button>` : ""}</div>`;
  if (s.movedFrom) x += `<div class="sx-info">${ui("move")}<span>Verschoben von ${esc(U.wdD(s.movedFrom))}.</span>${s.adj && !s.orig ? `<button class="lnkbtn" data-act="undoadj" data-v="${esc(s.adj)}">Zurücknehmen</button>` : ""}</div>`;
  if (s.dropped && s.adj && !s.orig) x += `<div class="sx-info">${ui("trash")}<span>Gestrichen.</span><button class="lnkbtn" data-act="undoadj" data-v="${esc(s.adj)}">Zurücknehmen</button></div>`;
  const nach = nachOf(c, s); if (nach) x += `<div class="banner info">${ui("move")}<div class="tx">Nachgeholt am ${esc(U.wdD(nach.date))}${nach.time ? " · " + esc(nach.time) : ""}. Ergebnis wird dort eingetragen.</div><button class="btn sm" data-act="sess" data-id="${esc(nach.id)}">Öffnen</button></div>`;
  if (doneish) x += sxResult(s, a, l, st) + takeCard(s, c);
  else if (!s.dropped && st !== "✗" && st !== "krank") x += flowBlock(s, P);
  else if (st === "✗") x += `<section class="sx-res miss" aria-label="Ergebnis"><div class="sx-res-h">${sdot(S.c, "miss")}<div class="tx"><b>Verpasst</b><span>${esc({ zeit: "Keine Zeit", muede: "Müde oder Schmerz", krank: "Krank", reise: "Reise" }[l.why] || "Grund offen")}</span></div><button class="btn sm" data-act="mode" data-v="miss">${ui("pen")}Ändern</button></div><div class="sx-res-f"><button class="lnkbtn mute" data-act="clearst" data-id="${esc(s.id)}">${ui("undo")}Eintrag löschen</button></div></section>`;
  else if (st === "krank") x += `<div class="sx-info">${ui("sick")}<span>Krank gemeldet. Diese Einheit fällt weg und zählt nicht als verpasst.</span></div>`;
  // Aktionen: ein großer Hauptknopf, daneben Eintragen, dezent Verpasst und Verschieben
  if (can && !doneish && st !== "✗") x += `<div class="sx-acts"><button class="btn sx-done" data-act="pdone" data-id="${esc(s.id)}">${ui("check")}<span><b>Erledigt</b><small>wie geplant</small></span></button><button class="btn sx-log" data-act="mode" data-v="log">${ui("pen")}Eintragen</button></div>`;
  const minor = [];
  if (can && !doneish && st !== "✗") minor.push(`<button class="sx-mn" data-act="mode" data-v="miss">${ui("x")}Verpasst</button>`);
  if (canMove && !doneish) minor.push(`<button class="sx-mn" data-act="sxmv" aria-expanded="${!!D.mv}">${ui("move")}Verschieben</button>`);
  if (canMove && !doneish && !can) minor.push(`<button class="sx-mn" data-act="drop" data-id="${esc(s.id)}">${ui("trash")}Streichen</button>`);
  if (minor.length) x += `<div class="sx-minor">${minor.join("")}</div>`;
  if (D.mv && canMove) x += `<div class="sx-mv"><label class="fl" for="mvdate">Auf welchen Tag?</label><div class="sx-mvr"><input type="date" class="inp" id="mvdate" value="${dateVal(Math.max(t, s.date + 1))}"><button class="btn sm pri" data-act="move" data-id="${esc(s.id)}">Verschieben</button></div>${can ? `<button class="lnkbtn bad" data-act="drop" data-id="${esc(s.id)}">${ui("trash")}Lieber ganz streichen</button>` : ""}</div>`;
  if (s.test) x += `<button class="btn lane wide sx-test" data-act="test" data-k="${esc((B.tests.find(T => T.date + "-" + T.typ === s.tkey) || {}).key || "")}">${ui("star")}Testergebnis eintragen</button>`;
  // Hintergrundwissen, eingeklappt
  const wy = E.whyOf(s), exs = Library.exercisesFor(s), wsteps = P.wsteps, secs = [];
  if (wy) secs.push(sxSec("why", "book", "Warum diese Einheit", wy.t, `<div class="coachnote"><p>${esc(wy.zweck)}</p><p class="dos"><b>So läufst du richtig:</b> ${esc(wy.dos)}</p>${wy.hint ? `<p class="hint">${esc(wy.hint)}</p>` : ""}</div>`));
  if (wsteps.length) {
    const tot = Library.totalMin(wsteps), prof = Library.profileOf(wsteps), dsum = s.sport === "Schwimmen" ? wsteps.reduce((a0, x0) => a0 + (x0.n || 1) * (x0.m || 0), 0) : 0;
    let h = prof.length > 1 ? `<div class="wprof" role="img" aria-label="Intensitätsprofil">${prof.map(p0 => `<i class="z${p0.z}" style="flex:${Math.max(.3, p0.dur)};height:${18 + p0.z * 14}%"></i>`).join("")}</div>` : "";
    h += `<div class="wsteps">${wsteps.map((x0, i0) => { const meta = [];
        if (x0.m != null && !x0.n) meta.push(x0.m.toLocaleString("de-DE") + " m");
        if (x0.dist != null && s.sport === "Lauf" && x0.kind !== "strides") meta.push((x0.n ? "je " : "") + de(Math.round(x0.dist * 10) / 10) + " km");
        if (x0.dur != null && (x0.dist == null || s.sport !== "Lauf") && x0.m == null) meta.push((x0.n ? "je " : "") + (x0.dur >= 1 ? Math.round(x0.dur) + " min" : Math.round(x0.dur * 60) + " s"));
        else if (x0.dur != null && x0.kind !== "strides") meta.push("ca. " + Math.round((x0.m != null ? x0.dur : (x0.n || 1) * x0.dur)) + " min");
        const v = x0.ex && Library.VIDEOS[x0.ex];
        return `<div class="wst z${x0.z || 1}"><div class="wst-h"><span class="sn z${x0.z || 1}">${i0 + 1}</span><b>${esc(x0.lab)}</b><span class="wst-m">${esc(meta.join(" · "))}</span></div>
          <div class="wst-g">${x0.target ? `<div><span>${s.sport === "Schwimmen" ? "Tempo" : s.sport === "Rad" ? "Intensität" : "Pace"}</span><b>${esc(x0.target)}</b></div>` : ""}${x0.hf ? `<div><span>Puls</span><b>${esc(x0.hf)}</b></div>` : ""}${x0.cad ? `<div><span>Trittfrequenz</span><b>${esc(x0.cad)}</b></div>` : ""}${x0.rest ? `<div><span>Pause</span><b>${esc(x0.rest.txt)}</b></div>` : ""}</div>
          ${x0.how ? `<p>${esc(x0.how)}</p>` : ""}${v ? `<button class="vthumb" data-act="vplay" data-v="${esc(v.id)}" aria-label="Video abspielen: ${esc(v.t)}"><span class="vt-ic">${ui("play")}</span><span><b>${esc(Library.EX[x0.ex] ? Library.EX[x0.ex].n : v.t)}</b><small>Video · ${esc(v.c)}</small></span></button>` : ""}</div>`; }).join("")}</div>`;
    if (s.sport === "Lauf" && /koppel/i.test(s.name + s.desc)) h += vidCard("koppel", "Koppeltraining");
    h += `<details class="orig"><summary>Original aus dem Trainingsplan</summary><p>${esc(s.desc)}</p></details>`;
    secs.push(sxSec("how", "today", "So trainierst du", `ca. ${Math.round(tot)} min${dsum ? ", " + dsum.toLocaleString("de-DE") + " m" : ""}, ${wsteps.length} Abschnitt${wsteps.length === 1 ? "" : "e"}`, h));
  } else if (!exs.length && s.desc && E.isTrain(s)) secs.push(sxSec("how", "today", "So trainierst du", "aus dem Trainingsplan", `<p class="sx-p">${esc(s.desc)}</p>`));
  if (exs.length) {
    let h = `<div class="grp">`;
    exs.forEach(k => { const e0 = Library.exercise(k), dz = Library.doseFor(s.desc, k);
      h += `<details class="exc"><summary><span class="badge-ic" style="--c:${S.c};--t:${S.t}">${icon(s.sport === "Mobility" ? "Mobility" : s.sport)}</span><span class="tx"><span class="t1">${esc(e0.n)}</span><span class="t2">${esc([dz, e0.k].filter(Boolean).join(" · "))}</span></span>${ui("chev", "chev")}</summary>
        <div class="exb"><ol>${e0.how.map(h0 => `<li>${esc(h0)}</li>`).join("")}</ol>
        <div class="excols"><div><b>Darauf achten</b><ul>${e0.cue.map(h0 => `<li>${esc(h0)}</li>`).join("")}</ul></div><div><b>Typische Fehler</b><ul>${e0.err.map(h0 => `<li>${esc(h0)}</li>`).join("")}</ul></div></div>
        <p class="exwhy">${esc(e0.why)}${e0.alt ? " <b>Leichter oder ohne Gerät:</b> " + esc(e0.alt) + "." : ""}</p>
        ${e0.vid ? `<button class="vthumb" data-act="vplay" data-v="${esc(e0.vid.id)}" aria-label="Video abspielen: ${esc(e0.vid.t)}"><span class="vt-ic">${ui("play")}</span><span><b>Video ansehen</b><small>${esc(e0.vid.c)} · ${esc(e0.vid.t)}</small></span></button>` : `<a class="btn sm lane vid" href="${esc(e0.video)}" target="_blank" rel="noopener noreferrer">${ui("play")}Videos suchen</a>`}</div></details>`; });
    h += `</div>${!["Lauf", "Rad", "Schwimmen"].includes(s.sport) || !wsteps.length ? `<p class="note"><b>Plan:</b> ${esc(s.desc)}</p>` : ""}`;
    const nv = exs.filter(k => (Library.exercise(k) || {}).vid).length;
    secs.push(sxSec("ex", "play", s.sport === "Schwimmen" ? "Drills und Technik" : s.sport === "Lauf" ? "Technik" : "Übungen", exs.length + " Übungen" + (nv ? ", " + nv + " mit Video" : ""), h));
  }
  if (wy) secs.push(sxSec("src", "shield", "Evidenz und Quellen", "Stufe " + wy.ev + ": " + String(E.EV_LAB[wy.ev] || "").split(/[.,(]/)[0], `<p class="note">${esc(E.EV_LAB[wy.ev])}.</p><ul class="srcl">${wy.src.map(k => `<li>${esc(E.SRC[k])}</li>`).join("")}</ul>`));
  const hints = [];
  const spk = !s.dropped && E.lrSpike(c.Ex, s); if (spk) hints.push(`<div class="banner">${ui("info")}<div class="tx">Geplanter Sprung: +${Math.round(spk.pct * 100)} % zum längsten Lauf der 30 Tage davor (${de(spk.ref)} km). Ab 10 % steigt laut Studie das Überlastungsrisiko.</div>${infoBtn("lrspike")}</div>`);
  if (s.hint) hints.push(`<p class="sx-p">${esc(s.hint)}</p>`);
  if (exs.length || wsteps.some(x0 => x0.ex)) hints.push(`<p class="note">Videos laden erst, wenn du tippst (youtube-nocookie). Vorher geht keine Verbindung zu YouTube.</p>`);
  if (hints.length) secs.push(sxSec("hint", "info", "Hinweise", spk ? "Long-Run-Sprung beachten" : hints.length === 1 && !s.hint ? "Videos und Datenschutz" : "zur Einheit", hints.join("")));
  if (!s.dropped && E.isTrain(s) && (s.min >= 45 || s.test)) secs.push(`<button class="sx-sec sx-row" data-act="fuel" data-id="${esc(s.id)}"><span class="sx-si">${ui("fork")}</span><span class="tx"><span class="t1">Verpflegung</span><span class="t2">${s.test === "race" || (s.sport === "Lauf" && ["LR", "LRM", "M"].includes(s.code) && s.min >= 90) ? "Davor, unterwegs, danach, mit Gelplan" : "Davor, währenddessen, danach"}</span></span>${ui("chev", "chev")}</button>`);
  if (secs.length) x += `<div class="sx-secs">${secs.join("")}</div>`;
  if (s.adj && !s.orig && !s.movedFrom && !s.dropped) x += `<div class="sx-res-f"><button class="lnkbtn" data-act="undoadj" data-v="${esc(s.adj)}">${ui("undo")}Anpassung zurücknehmen</button></div>`;
  return x;
}
function prefill(s, c) {
  const l = log(s), a = E.actual(ST, s, c.t), z = zoneOf(s, c), st = E.statusOf(ST, s, c.t), had = st === "✓" || st === "½";
  return { st: st === "½" ? "½" : "✓", dur: had ? Math.round(a.min) : s.min || 30, dist: had ? a.km : s.km || 0, hf: num(l.hf) ? l.hf : null, hfmax: l.hfmax ?? null, rpe: num(l.rpe) ? l.rpe : null, feel: l.feel ?? null, shoe: l.shoe || "", hm: l.hm ?? null, pull: l.pull ?? null, pain: num(l.pain) ? l.pain : 1, note: l.note || "", hfHint: hfMid(z), more: false, vals: false, src: l.src || "", had };
}
function stepper(f, val, o) {
  return `<div class="stepper"><button type="button" data-act="step" data-f="${f}" data-v="-${o.step}" aria-label="${esc(o.lab)} weniger">−</button><input id="in-${f}" data-in="${f}" inputmode="${o.mode || "decimal"}" autocomplete="off" value="${esc(val)}" placeholder="${esc(o.ph || "")}" aria-label="${esc(o.lab)}"><button type="button" data-act="step" data-f="${f}" data-v="${o.step}" aria-label="${esc(o.lab)} mehr">+</button></div>`;
}
const fmtDurIn = m => !num(m) ? "" : m >= 60 ? Math.floor(m / 60) + ":" + String(Math.round(m % 60)).padStart(2, "0") : String(Math.round(m));
const fmtDistIn = (km, sport) => !num(km) || km <= 0 ? "" : sport === "Schwimmen" ? String(Math.round(km * 1000)) : String(Math.round(km * 100) / 100).replace(".", ",");
function derivedTxt(D, sport) {
  const km = D.dist, m = D.dur; if (!num(km) || !num(m) || km <= 0 || m <= 0) return "";
  if (sport === "Lauf") return `Pace <b>${E.paceStr(m, km)}</b> /km`;
  if (sport === "Rad") return `Tempo <b>${de(km / (m / 60))}</b> km/h`;
  if (sport === "Schwimmen") return `<b>${U.mss(m / (km * 10) / 1440)}</b> /100 m`;
  return "";
}
/* 4.1: Schmerz 1–5. 1 = schmerzfrei ist immer voreingestellt, ändern nur aktiv. Ab 3 schlägt die App einen lockeren Folgetag vor. */
const PAIN_LAB = ["", "schmerzfrei", "leicht spürbar", "störend", "deutlich", "stark"];
function painScale(v, lab) { v = num(v) ? v : 1; const col = n => n === 1 ? "var(--ok)" : n === 2 ? "var(--ok)" : n === 3 ? "var(--warn)" : "var(--bad)";
  return `<div class="field painf"><div class="fl"><span>${esc(lab || "Schmerz")}</span><b>${v} · ${PAIN_LAB[v]}${v >= 3 ? ", Folgetag wird locker" : ""}</b></div><div class="scale s5" role="radiogroup" aria-label="Schmerz 1 bis 5">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="${v === n}" class="${v === n ? "on" : ""}" style="--sc:${col(n)}" data-act="setf" data-f="pain" data-v="${n}">${n}</button>`).join("")}</div></div>`; }
function rpeScale(f, v, lab) {
  const col = n => n <= 3 ? "var(--ok)" : n <= 6 ? "var(--warn)" : "var(--bad)";
  return `<div class="field"><div class="fl"><span>${lab || "Anstrengung (RPE)"}</span><b>${num(v) ? RPE_LAB[v] : "1 leicht … 10 maximal"}</b></div><div class="scale" role="radiogroup" aria-label="${esc(lab || "Anstrengung")}">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<button type="button" role="radio" aria-checked="${v === n}" class="${v === n ? "on" : ""}" style="--sc:${col(n)}" data-act="setf" data-f="${f}" data-v="${n}">${n}</button>`).join("")}</div></div>`;
}
/* 4.4: Anstrengung als Schieberegler (antippen oder ziehen, Pfeiltasten). Ohne Eingabe bleibt der Wert leer. */
const rpeTxt = v => num(v) ? v + " · " + RPE_LAB[v] : "antippen oder ziehen";
function rpeSlider(f, v) { const on = num(v);
  return `<div class="field rpef"><div class="fl"><span>Anstrengung</span><b class="rpel">${esc(rpeTxt(v))}</b></div><div class="rpes${on ? "" : " unset"}" role="slider" tabindex="0" data-f="${f}" aria-label="Anstrengung von 1 bis 10" aria-valuemin="1" aria-valuemax="10"${on ? ` aria-valuenow="${v}"` : ""} aria-valuetext="${on ? v + ", " + RPE_LAB[v] : "nicht angegeben"}" style="--p:${on ? (v - 1) / 9 : .5}"><span class="rt"></span><span class="rk num">${on ? v : ""}</span></div><div class="scale-lab"><span>sehr leicht</span><span>maximal</span></div></div>`; }
function paintRpe(el, v) { const on = num(v); el.classList.toggle("unset", !on); el.style.setProperty("--p", on ? (v - 1) / 9 : .5); if (on) el.setAttribute("aria-valuenow", v); else el.removeAttribute("aria-valuenow"); el.setAttribute("aria-valuetext", on ? v + ", " + RPE_LAB[v] : "nicht angegeben"); const k = $(".rk", el); if (k) k.textContent = on ? v : ""; const w = el.closest(".rpef"), lb = w && $(".rpel", w); if (lb) lb.textContent = rpeTxt(v); }
function feelField(F) { const cur = num(F.feel) && FEEL[F.feel - 1];
  return `<div class="field feelf"><div class="fl"><span>Gefühl</span><b>${cur ? esc(cur[1]) : "optional"}</b></div><div class="faces" role="radiogroup" aria-label="Gefühl">${FEEL.map(([n, lab]) => `<button type="button" class="face-b${F.feel === n ? " on" : ""}" role="radio" aria-checked="${F.feel === n}" aria-pressed="${F.feel === n}" data-act="setf" data-f="feel" data-v="${n}">${face(n)}<span>${lab}</span></button>`).join("")}</div></div>`; }
const VAL_KEYS = ["dur", "dist", "hf"];
function valSrc(F) { if (F.touch && VAL_KEYS.some(k => F.touch[k])) return "eigene Werte"; if (F.auto && VAL_KEYS.some(k => F.auto[k])) return "aus deinem Text"; if (F.src === "garmin") return "aus Garmin"; return F.had ? "bisheriger Eintrag" : "wie geplant"; }
function valSumHTML(F, sport) {
  const endu = ["Lauf", "Rad", "Schwimmen", "Triathlon"].includes(sport), swim = sport === "Schwimmen";
  const it = [["Dauer", num(F.dur) && F.dur > 0 ? durStr(F.dur) : "–"]];
  if (endu) it.push(["Distanz", num(F.dist) && F.dist > 0 ? kmStr(F.dist, sport) : "–"]);
  const pc = endu ? paceOf(F.dur, F.dist, sport) : ""; if (pc) it.push([sport === "Rad" ? "Tempo" : "Pace", pc]);
  if (endu && !swim) it.push(["Ø Puls", num(F.hf) ? F.hf + " bpm" : "–"]);
  return it.map(([k, v]) => `<div><span>${k}</span><b class="num">${esc(v)}</b></div>`).join("");
}
function paintVals(root, F, sport) { const v = $("#valsum", root); if (v) v.innerHTML = valSumHTML(F, sport); const r = $("#valsrc", root); if (r) r.textContent = valSrc(F); }
const draftNote = F => F.fromDraft ? `<div class="draftnote">${ui("undo")}<span>Entwurf von vorhin wiederhergestellt.</span><button class="lnk" data-act="draftdel">Verwerfen</button></div>` : "";
function logForm(s, D, c) {
  if (!D.f) { const dr = takeDraft("log:" + s.id); D.f = dr || prefill(s, c); if (dr) D.dirty = true; }
  const F = D.f, sport = s.sport, endu = ["Lauf", "Rad", "Schwimmen", "Triathlon"].includes(sport), swim = sport === "Schwimmen";
  let x = draftNote(F) + noteField(F, sport);
  x += feelField(F);
  x += painScale(F.pain);
  x += rpeSlider("rpe", F.rpe);
  x += `<div class="field valsf"><div class="fl"><span>Werte</span><b id="valsrc">${esc(valSrc(F))}</b></div>`;
  x += `<div class="seg" role="group" aria-label="Wie viel geschafft"><button type="button" data-act="setf" data-f="st" data-v="✓" aria-pressed="${F.st === "✓"}">Ganz geschafft</button><button type="button" data-act="setf" data-f="st" data-v="½" aria-pressed="${F.st === "½"}">Teilweise</button></div>`;
  if (!F.vals) x += `<div class="vsum" id="valsum">${valSumHTML(F, sport)}</div>`;
  else {
    x += `<div class="vrow"><span class="vl">Dauer <small>min oder h:mm</small></span>${stepper("dur", fmtDurIn(F.dur), { step: 5, lab: "Dauer", mode: "numeric" })}</div>`;
    if (endu) x += `<div class="vrow"><span class="vl">Distanz <small>${swim ? "Meter" : "km"}</small></span>${stepper("dist", fmtDistIn(F.dist, sport), { step: swim ? 100 : sport === "Rad" ? 5 : .5, lab: "Distanz" })}</div><div class="derived" id="derived" aria-live="polite">${derivedTxt(F, sport)}</div>`;
    if (endu && !swim) x += `<div class="vrow"><span class="vl">Ø Puls <small>bpm, optional</small></span>${stepper("hf", F.hf ?? "", { step: 1, lab: "Durchschnittspuls", mode: "numeric", ph: F.hfHint ? String(F.hfHint) : "–" })}</div>`;
  }
  x += `<button type="button" class="lnkbtn vtog" data-act="setf" data-f="vals" data-v="${F.vals ? 0 : 1}" aria-expanded="${!!F.vals}">${F.vals ? ui("check") + "Fertig" : ui("pen") + "Werte ändern"}</button></div>`;
  const hasMore = sport === "Lauf" || sport === "Rad" || swim;
  if (hasMore) {
    x += `<button type="button" class="more-tog" data-act="setf" data-f="more" data-v="${F.more ? 0 : 1}" aria-expanded="${!!F.more}">${F.more ? "Weniger" : "Mehr"}</button>`;
    if (F.more) {
      if (sport === "Lauf") x += `<div class="field"><div class="fl"><span>Max HF</span><b>optional</b></div>${stepper("hfmax", F.hfmax ?? "", { step: 1, lab: "Maximalpuls", mode: "numeric", ph: "–" })}</div>`;
      if (sport === "Rad") x += `<div class="field"><div class="fl"><span>Höhenmeter</span><b>optional</b></div>${stepper("hm", F.hm ?? "", { step: 50, lab: "Höhenmeter", mode: "numeric", ph: "–" })}</div>`;
      if (swim) x += `<div class="field"><div class="fl"><span>Anteil mit Pullbuoy</span><b>${num(F.pull) ? F.pull + " %" : "optional"}</b></div><div class="seg">${[0, 25, 50, 75].map(n => `<button type="button" data-act="setf" data-f="pull" data-v="${n}" aria-pressed="${F.pull === n}">${n} %</button>`).join("")}</div></div>`;
      if (sport === "Lauf" && B.shoes.length) x += `<div class="field"><div class="fl"><span>Schuh</span></div><select class="inp" data-in="shoe"><option value="">Standard</option>${B.shoes.map(z => `<option${F.shoe === z.name ? " selected" : ""}>${esc(z.name)}</option>`).join("")}</select></div>`;
    }
  }
  x += `<div class="sh-foot"><button class="btn" data-act="mode" data-v="">Abbrechen</button><button class="btn pri" data-act="savelog" data-id="${esc(s.id)}">${ui("check")}Speichern</button></div>`;
  return x;
}
/* 4.0: Freitext ist die Haupteingabe. Die App liest Struktur, Distanz, Dauer, Puls, Gefühl, Schmerz und Erholung heraus
   und füllt die Felder darunter. Was du selbst in einem Feld änderst, überschreibt der Text nicht mehr. */
const NOTE_PH = { Lauf: "z. B. 2 km WU, 5×1 km @4:50, 1 km CD, Puls 152, gut, keine Schmerzen", Rad: "z. B. 62 km in 2:10 h, 650 Hm, Puls 138, top", Schwimmen: "z. B. 1.500 m, 6×100 @2:05, Technik gut, Schulter frei", Kraft: "z. B. 40 min Ganzkörper, schwere Beine, danach Sauna", Mobility: "z. B. 20 min Dehnen, Hüfte locker" };
function noteField(F, sport) {
  return `<div class="field notef"><div class="fl"><span>Wie lief es?</span><b>füllt die Felder selbst</b></div><textarea class="inp" id="in-note" data-in="note" rows="3" maxlength="600" placeholder="${esc(NOTE_PH[sport] || NOTE_PH.Lauf)}" aria-describedby="parsed">${esc(F.note)}</textarea><div class="parsed" id="parsed" aria-live="polite">${parsedHTML(F)}</div></div>`;
}
function parsedHTML(F) { const P = F.P; if (!P || !P.chips || !P.chips.length) return ""; return `<span class="pl">${ui("check")}Erkannt</span>${P.chips.map(c => `<span class="pc">${esc(c)}</span>`).join("")}`; }
const NOTE_KEYS = ["dur", "dist", "hf", "hfmax", "rpe", "feel", "hm", "pain"];
function easyPaceFor(s, sport) { if (s && s.km && s.min && sport === "Lauf") return Math.max(4.5, Math.min(7.5, s.min / s.km + .25)); return null; }
function applyNote(cur, opts) {
  const F = cur.D.f; if (!F) return; const s = formS(cur), sport = s ? s.sport : F.sport;
  F.touch = F.touch || {}; F.auto = F.auto || {}; if (!F.base) F.base = Object.fromEntries(NOTE_KEYS.concat("st").map(k => [k, F[k]]));
  const P = E.parseNote(F.note, { sport, easyPace: easyPaceFor(s, sport) }); F.P = P;
  NOTE_KEYS.forEach(k => { if (F.touch[k]) return; let v = P[k]; if (k === "dur" && num(v)) v = Math.round(v);
    if (v != null) { F[k] = v; F.auto[k] = 1; } else if (F.auto[k]) { F[k] = F.base[k]; delete F.auto[k]; } });
  if (!F.touch.st && "st" in F) { if (P.st === "½") { F.st = "½"; F.auto.st = 1; } else if (F.auto.st) { F.st = F.base.st; delete F.auto.st; } }
  let resport = false; if (!s && P.sport && !F.touch.sport && P.sport !== F.sport) { F.sport = P.sport; resport = true; }
  if (resport || (opts && opts.full)) { const pos = $("#in-note") ? $("#in-note").selectionStart : null; cur.re(); const ta = $("#in-note", ($(".sheet-wrap:last-child .sheet") || $("#insp") || document)); if (ta) { ta.focus(); if (pos != null) ta.setSelectionRange(pos, pos); } return; }
  const root = $(".sheet-wrap:last-child .sheet") || $("#insp") || document;
  syncInputs(F, sport);
  $$("[data-act=setf][data-f=rpe]", root).forEach(b => { const on = +b.dataset.v === F.rpe; b.setAttribute("aria-checked", on); b.classList.toggle("on", on); });
  $$(".rpes[data-f=rpe]", root).forEach(el => paintRpe(el, F.rpe));
  const ff = $(".feelf", root); if (ff) ff.outerHTML = feelField(F); else $$("[data-act=setf][data-f=feel]", root).forEach(b => b.setAttribute("aria-pressed", +b.dataset.v === F.feel));
  const pf = $(".painf", root); if (pf) pf.outerHTML = painScale(F.pain);
  $$("[data-act=setf][data-f=st]", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.v === F.st));
  const pz = $("#parsed", root); if (pz) pz.innerHTML = parsedHTML(F);
}
const noteExtra = F => { const P = F.P || (F.note ? E.parseNote(F.note, { sport: F.sport }) : null) || {};
  return { pain: num(F.pain) ? F.pain : 1, painTxt: num(F.pain) && F.pain > 1 ? P.painTxt : undefined, tags: P.tags && P.tags.length ? P.tags : undefined, segs: P.segs && P.segs.length ? P.segs.map(({ pos, ...x }) => x) : undefined }; };
function missForm(s, D, c) {
  const l = log(s), why = D.why || (l.st === "✗" ? l.why : "");
  let x = `<p style="color:var(--ink2);margin:0 2px 12px">Was ist passiert? Die App schlägt danach vor, wie es weitergeht.</p><div class="chips" role="group" aria-label="Grund">${[["zeit", "Keine Zeit", "cal"], ["muede", "Müde oder Schmerz", "heart"], ["krank", "Krank", "sick"], ["reise", "Reise", "plane"]].map(([k, lab, ic]) => `<button type="button" class="chip" data-act="why" data-id="${esc(s.id)}" data-v="${k}" aria-pressed="${why === k}">${ui(ic)}${lab}</button>`).join("")}</div>`;
  if (why) {
    const P = C().P, i = P.findIndex(p => (p.ops || []).some(o => o.id === s.id) || p.key === "miss:" + s.id || p.key === "tired:" + s.id || (why === "krank" && p.key.startsWith("sick:")));
    if (why === "krank") x += `<div class="banner err" style="margin-top:14px">${ui("sick")}<div class="tx">Krank ab ${esc(U.wdD(s.date))} gemeldet. Sobald du gesund bist, tippe unter Heute auf „Wieder gesund“, dann plant die App den Wiedereinstieg.</div><button class="btn sm" data-act="sick">Details</button></div>`;
    if (why === "reise") x += `<div class="banner info" style="margin-top:14px">${ui("plane")}<div class="tx">Mehrere Tage unterwegs? Trag die Reise ein, dann baut die App die ganze Woche um.</div><button class="btn sm" data-act="travel">Reise</button></div>`;
    const aa = Object.keys(ST).filter(k => k.startsWith("adj:")).map(k => ST[k].v).filter(a => a && a.auto && !a.undone && Date.now() - a.created < 6e5 && ((a.ops || []).some(o => o.id === s.id || (o.s && o.s.id && o.s.id.startsWith(s.id))) || a.key === "miss:" + s.id || a.key === "tired:" + s.id || (why === "krank" && /^sick/.test(a.key))));
    aa.forEach(a => { x += `<article class="prop auto" style="margin-top:14px"><span class="k">${ui("sync")}Automatisch angepasst</span><h3>${esc(a.title)}</h3><p>${esc(a.why)}</p>${(a.lines || []).length ? `<ul>${a.lines.map(l => `<li>${ui("move")}<span>${esc(l)}</span></li>`).join("")}</ul>` : ""}<div class="acts"><button class="btn ghost sm" data-act="undoadj" data-v="${esc(a.id)}">${ui("undo")}Zurücknehmen</button></div></article>`; });
    if (i >= 0) { LP = P; x += propCard(P[i], i, "sheet"); }
    else if (why !== "krank" && !aa.length) x += `<div class="banner info" style="margin-top:14px">${ui("info")}<div class="tx">Keine Anpassung nötig. Regel: nicht nachholen, Woche normal fortsetzen.</div></div>`;
  }
  x += `<div class="sh-foot"><button class="btn" data-act="mode" data-v="">Zurück</button><button class="btn ink" data-act="close">Fertig</button></div>`;
  return x;
}

/* ---------- Freies Training ---------- */
function freeForm(D) {
  if (!D.f && !D.edit && DRAFT.free) D.dirty = true;
  const F = D.f || (D.f = (!D.edit && takeDraft("free")) || { sport: "Lauf", date: today(), dur: 45, dist: null, hf: null, rpe: null, hm: null, name: "", note: "", pain: 1 });
  const swim = F.sport === "Schwimmen";
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:${sp(F.sport).c};--t:${sp(F.sport).t}">${icon(F.sport)}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">${D.edit ? "Training bearbeiten" : "Training hinzufügen"}</h2><p>Nicht geplant, zählt trotzdem für Umfang und Form</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>` + draftNote(F);
  x += `<div class="chipline" style="margin-bottom:12px"><div class="chips" style="flex-wrap:nowrap">${["Lauf", "Rad", "Schwimmen", "Kraft", "Mobility", "Sonstiges"].map(k => `<button type="button" class="chip" data-act="setf" data-f="sport" data-v="${k}" aria-pressed="${F.sport === k}">${icon(k)}${sp(k).lab}</button>`).join("")}</div></div>`;
  x += noteField(F, F.sport);
  x += `<div class="two"><div class="field"><div class="fl"><span>Datum</span></div><input type="date" class="inp" data-in="date" value="${dateVal(F.date)}"></div><div class="field"><div class="fl"><span>Name</span></div><input class="inp" data-in="name" value="${esc(F.name)}" placeholder="${F.sport === "Sonstiges" ? "z. B. Skitour" : "optional"}"></div></div>`;
  x += `<div class="field" style="margin-top:10px"><div class="fl"><span>Dauer</span><b>min oder h:mm</b></div>${stepper("dur", fmtDurIn(F.dur), { step: 5, lab: "Dauer", mode: "numeric" })}</div>`;
  if (["Lauf", "Rad", "Schwimmen", "Sonstiges"].includes(F.sport)) x += `<div class="field"><div class="fl"><span>Distanz</span><b>${swim ? "Meter" : "km"}, optional</b></div>${stepper("dist", fmtDistIn(F.dist, F.sport), { step: swim ? 100 : F.sport === "Rad" ? 5 : .5, lab: "Distanz", ph: "–" })}<div class="derived" id="derived">${derivedTxt(F, F.sport)}</div></div>`;
  if (F.sport === "Rad" || F.sport === "Sonstiges") x += `<div class="field"><div class="fl"><span>Höhenmeter</span><b>optional</b></div>${stepper("hm", F.hm ?? "", { step: 50, lab: "Höhenmeter", mode: "numeric", ph: "–" })}</div>`;
  if (!["Kraft", "Mobility"].includes(F.sport)) x += `<div class="field"><div class="fl"><span>Ø Herzfrequenz</span><b>optional</b></div>${stepper("hf", F.hf ?? "", { step: 1, lab: "Durchschnittspuls", mode: "numeric", ph: "–" })}</div>`;
  x += rpeSlider("rpe", F.rpe);
  x += painScale(F.pain);
  x += `<div class="sh-foot"><button class="btn" data-act="close">Abbrechen</button><button class="btn pri" data-act="savefree">${ui("check")}Speichern</button></div>`;
  return x;
}

/* ---------- Check-in ---------- */
function checkinForm(D) {
  const w = D.w, c0 = get("chk:" + w) || {}, base = num(B.S.rest) ? B.S.rest : 60;
  const F = D.f || (D.f = { puls: c0.puls ?? null, pain: E.painLvl(c0) ?? 1, feel: c0.feel ?? null, vo2: (E.vo2List(ST).slice(-1)[0] || {}).v ?? null, vo2touched: false });
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--tartan);--t:var(--tartan-t)">${ui("heart")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Check-in Woche ${w}</h2><p>30 Sekunden. Steuert Ampel und Vorschläge.</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<div class="field"><div class="fl"><span>Ruhepuls morgens, Ø der Woche</span><b>normal ${base}</b></div>${stepper("puls", F.puls ?? "", { step: 1, lab: "Ruhepuls", mode: "numeric", ph: String(base) })}</div>`;
  x += painScale(F.pain, "Schmerz (z. B. Hallux)");
  x += `<div class="field"><div class="fl"><span>Gefühl</span></div><div class="chips">${[[1, "Platt"], [2, "Müde"], [3, "Okay"], [4, "Gut"], [5, "Top"]].map(([n, lab]) => `<button type="button" class="chip" data-act="setf" data-f="feel" data-v="${n}" aria-pressed="${F.feel === n}">${lab}</button>`).join("")}</div></div>`;
  x += `<div class="field"><div class="fl"><span>VO2max laut Garmin</span><b>optional</b></div>${stepper("vo2", F.vo2 ?? "", { step: 1, lab: "VO2max", mode: "numeric", ph: "–" })}</div>`;
  x += `<div class="sh-foot"><button class="btn" data-act="close">Abbrechen</button><button class="btn pri" data-act="savechk" data-w="${w}">${ui("check")}Speichern</button></div>`;
  return x;
}

/* ---------- Test eintragen ---------- */
function testForm(D) {
  const T = testGroups().find(x => x.key === D.k) || B.tests.find(x => x.key === D.k); if (!T) return "";
  const ed = testDate(T), race = U.RACE_TYPES.includes(T.typ), need = TNEED[T.typ] || ["time"];
  const inp = (TT, f, lab) => { const v = (get("test:" + TT.key) || {})[f];
    return `<div class="field"><div class="fl"><span>${lab}</span><b>${f === "time" ? "z. B. " + (T.typ.startsWith("CSS") ? "745 = 7:45" : race && T.typ !== "10K" ? "13059 = 1:30:59" : "2830 = 28:30") : "bpm"}</b></div>
      <input class="inp num" style="font-size:1.75rem;font-weight:700;text-align:center;min-height:56px" data-in="${f === "time" ? "ttime" : "thf"}" data-k="${esc(TT.key)}" inputmode="numeric" autocomplete="off" value="${num(v) ? (f === "time" ? U.hms(v) : v) : ""}" placeholder="–"></div>`; };
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:${race ? "var(--gold-s)" : "var(--tartan)"};--t:${race ? "var(--gold)" : "var(--tartan-t)"}">${ui(race ? "flag" : "star")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">${esc(T.pair ? T.name.replace(/:? ?400 m/, "") : T.name)}</h2><p>${esc(longDate(ed))}</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<p style="color:var(--ink2);margin:0 2px 12px;line-height:1.5">${esc(T.how)}</p>`;
  x += T.pair ? inp(T, "time", "Zeit 400 m") + inp(T.pair, "time", "Zeit 200 m") : need.map(f => inp(T, f, f === "time" ? "Zeit" : T.typ === "LTHR" ? "Ø HF der letzten 20 min" : "Ø HF")).join("");
  const eff = T.pair ? (testEffect(T.pair) || testEffect(T)) : testEffect(T);
  x += `<div id="teff" aria-live="polite">${eff ? `<div class="banner info" style="margin-top:12px">${ui("prog")}<div class="tx">${esc(eff)}</div></div>` : ""}</div>`;
  x += `<div class="sh-foot"><button class="btn ink" data-act="close">Fertig</button></div>`;
  return x;
}

/* ---------- VO2max ---------- */
function vo2Form(D) {
  const F = D.f || (D.f = { v: (E.vo2List(ST).slice(-1)[0] || {}).v || 50, date: today() });
  const list = E.vo2List(ST).slice(-6).reverse();
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("heart")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">VO2max eintragen</h2><p>Wert von deiner Forerunner 965</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<div class="field"><div class="fl"><span>VO2max</span><b>ml/kg/min</b></div>${stepper("v", F.v, { step: 1, lab: "VO2max", mode: "numeric" })}</div>`;
  x += `<div class="field"><div class="fl"><span>Datum</span></div><input type="date" class="inp" data-in="date" value="${dateVal(F.date)}"></div>`;
  if (list.length) x += `<div class="sec"><h2 style="font-size:1rem">Zuletzt</h2></div><div class="grp">${list.map(e => `<div class="row plain"><span class="tx"><span class="t1">${e.v}</span><span class="t2">${esc(U.wdD(e.date))}</span></span><button class="closebtn" data-act="vo2del" data-v="${e.date}" aria-label="Eintrag löschen">${ui("trash")}</button></div>`).join("")}</div>`;
  x += `<div class="sh-foot"><button class="btn" data-act="close">Abbrechen</button><button class="btn pri" data-act="savevo2">${ui("check")}Speichern</button></div>`;
  return x;
}

/* ---------- Nachtragen ---------- */
function reviewForm() {
  const c = C(), t = c.t, open = c.Ex.filter(s => s.date < t && s.date >= t - 14 && !s.dropped && E.isTrain(s) && (needs(s, t) || (ST["log:" + s.id] && Date.now() - ST["log:" + s.id].t < 180000)));
  let x = `<div class="sh-head"><div class="tx"><h2 class="sheet-title" tabindex="-1">Nachtragen</h2><p>Nach rechts wischen = wie geplant erledigt. Antippen für Details.</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += open.length ? `<div class="grp">${open.map(s => sessRow(s, c, { date: true })).join("")}</div>` : `<div class="grp"><div class="empty"><b>Alles eingetragen</b>Stark. Nichts offen.</div></div>`;
  x += `<div class="sh-foot">${open.some(s => needs(s, t)) ? `<button class="btn ink" data-act="allok">${ui("check")}Alle wie geplant</button>` : `<button class="btn ink" data-act="close">Fertig</button>`}</div>`;
  return x;
}

/* ---------- Info und Methoden ---------- */
const INFO = () => ({
  form: ["Formkurve", `<p>Die Formkurve schätzt, wie fit und wie frisch du bist. Sie ist eine Schätzung, kein Messwert.</p>
   <p><b>Belastung je Einheit:</b> Dauer in Minuten × Anstrengung (RPE 1–10), geteilt durch 10. Das ist die Session-RPE-Methode nach Foster et al. (2001). Trägst du keine RPE, aber einen Puls ein, nutzt die App Banisters TRIMP, angeglichen an dieselbe Skala. Ohne beides schätzt die App die RPE aus dem Einheitentyp (locker 3, Schwelle 7, Intervall 8).</p>
   <p><b>Fitness</b> ist das gleitende Mittel der Belastung über 42 Tage, <b>Ermüdung</b> über 7 Tage. <b>Form = Fitness − Ermüdung</b>. Das Modell geht auf Banister zurück und ist durch das Performance Management Chart von TrainingPeaks bekannt.</p>
   <p>Gestrichelt: so verläuft die Kurve, wenn du den Plan wie geplant absolvierst. Vor Rennen soll die Form wieder ins Plus steigen, das macht der Taper.</p>
   <p class="note">Quellen: Foster C. et al. (2001), A new approach to monitoring exercise training, J Strength Cond Res 15(1): <a href="https://pubmed.ncbi.nlm.nih.gov/11708692/" target="_blank" rel="noopener">PubMed</a>. Banister E.W. (1991), Modeling elite athletic performance. Der Startwert ist eine Annahme aus deinen ersten Planwochen.</p>`],
  vo2: ["VO2max und VDOT", `<p><b>Garmin-VO2max</b> trägst du selbst ein, am einfachsten sonntags im Check-in. Die Uhr schätzt ihn aus Pace und Puls.</p>
   <p><b>VDOT</b> berechnet die App aus jedem 10-km-Test, HM oder Marathon nach den Formeln von Daniels und Gilbert: VO2 = −4,60 + 0,182258·v + 0,000104·v², %max = 0,8 + 0,1894393·e^(−0,012778·t) + 0,2989558·e^(−0,1932605·t), VDOT = VO2 / %max (v in m/min, t in min).</p>
   <p><b>Zielband:</b> Linz in 3:09 entspricht VDOT ${de(E.vdotTargets(B).m)}, HM in 1:29:59 VDOT ${de(E.vdotTargets(B).hm)}. Laut Daniels-Tabellen liegt ein 3:09-Marathon zwischen VDOT 50 (3:10:49) und 51 (3:07:39).</p>
   <p>Garmin-Wert und VDOT sind nicht identisch. Wichtig ist der Trend, nicht der absolute Abstand.</p>
   <p class="note">Quellen: Daniels J., Gilbert J. (1979), Oxygen Power. Daniels J., Daniels' Running Formula. Rechner: <a href="https://vdoto2.com/calculator" target="_blank" rel="noopener">vdoto2.com</a>.</p>`],
  prog: ["Marathon-Prognose", `<p>Aus deinem letzten 10-km-Test, HM oder Marathon rechnet die App eine HM-Äquivalenz und daraus die Marathonzeit nach Riegel: T2 = T1 × (D2/D1)^k.</p><p><b>Spanne statt Punktwert:</b> k = 1,06 ist Riegels Originalwert und für Freizeitläufer eher optimistisch. In einer Studie mit 2.303 Freizeitläufern lag Riegel bis zum HM gut, schätzte den Marathon aber für die Hälfte der Läufer mindestens 10 Minuten zu schnell (Vickers & Vertosick 2016). Die App zeigt deshalb 1,06 bis 1,08, bei 1:30 im HM sind das 3:07:39 bis 3:10:16. Auch die vorsichtige Grenze kann für dich noch zu schnell sein, weil die Studie Abweichungen von 10 Minuten und mehr zeigt. Die Checkpoints nutzen den optimistischen Wert, damit ein erfülltes Gate noch Luft lässt.</p><p>Ohne Test gilt deine Bestzeit aus dem Plan. Für 3:09 brauchst du einen HM von etwa ${U.hms(C().R.needHM)}.</p><p class="note">Quellen: Riegel P.S. (1981), Athletic Records and Human Endurance, American Scientist 69:285–90. Vickers A.J., Vertosick E.A. (2016), An empirical study of race times in recreational endurance runners, BMC Sports Sci Med Rehabil 8:26, <a href="https://pubmed.ncbi.nlm.nih.gov/27570626/" target="_blank" rel="noopener">PubMed</a>.</p>`],
  intens: ["Intensitätsverteilung", `<p>Die App ordnet die Trainingszeit drei Bereichen zu. <b>Locker</b> liegt unter etwa 89 % deines Schwellenpulses, <b>mittel</b> bei 89–95 %, <b>hart</b> darüber. Ohne Puls nutzt sie deine RPE (bis 4 locker, 5–6 mittel, ab 7 hart), sonst den Einheitentyp.</p><p><b>Einordnung:</b> Gute Ausdauersportler trainieren überwiegend locker. Eine starre Quote wie 80/20 ist aber nicht belegt. Eine Metaanalyse fand Vorteile der polarisierten Verteilung nur kurzfristig und nur bei Hochtrainierten (Silva Oliveira et al. 2024). In den Strava-Daten von 119.452 Marathonläufern unterschieden sich Schnelle vor allem im lockeren Umfang (Muniz-Pumares et al. 2025). Entscheidend ist also der Umfang. Viel mittlere Intensität in lockeren Läufen kostet trotzdem Frische für die harten Tage.</p><p class="note">Quellen: Seiler S. (2010), Int J Sports Physiol Perform 5(3):276–91. Silva Oliveira P. et al. (2024), Sports Med 54:2071–95, PMID 38717713. Muniz-Pumares D. et al. (2025), Sports Med 55(4):1023–35, PMID 39616560.</p>`],
sick: ["Krank: Regeln und Quellen", `<p><b>Kategorien statt Diagnosen.</b> Du wählst, was ungefähr zutrifft. Die App leitet daraus nur Trainingsregeln ab und stellt keine Diagnose.</p><p><b>Erkältung oberhalb des Halses:</b> lockeres Training bis 45 Minuten bleibt erlaubt, harte Einheiten werden entschärft. Grundlage ist der „Neck-Check“, eine verbreitete klinische Faustregel, die nicht in Studien validiert ist. Gestützt wird sie durch einen kleinen Versuch, in dem moderates Training während eines Rhinovirus-Schnupfens Dauer und Schwere nicht veränderte (Weidner et al. 1998).</p><p><b>Fieber oder Allgemeinsymptome:</b> kein Training. Der IOC-Konsens 2022 empfiehlt bei Infekten einen gestuften, symptomgeführten Wiedereinstieg und ärztliche Abklärung bei Warnzeichen wie Brustschmerz, Herzstolpern oder Atemnot. Hintergrund ist das seltene, aber ernste Risiko einer Herzmuskelbeteiligung. Die App beginnt erst nach dem Ende der Symptome und plant mindestens 5 Tage Wiedereinstieg.</p><p><b>Magen-Darm:</b> erst wieder normal essen und trinken. Flüssigkeit und Salz auffüllen. Dafür gibt es keine spezifische Studienlage, die Regel ist eine vorsichtige Ableitung.</p><p><b>Verletzung oder Schmerz:</b> Die betroffenen Sportarten werden ersetzt, zum Beispiel Laufen durch Rad bei Wade oder Fuß und Rad durch Schwimmen mit Pullbuoy beim Knie. Die Grenze „Schmerz höchstens 2 von 10, am nächsten Morgen nicht schlimmer“ ist bewusst vorsichtig gewählt. Im Schmerzmonitoring-Modell von Silbernagel et al. (2007) für die Achillessehne waren bis 5 von 10 zulässig, allerdings unter physiotherapeutischer Anleitung.</p><p><b>Wiedereinstieg in Stufen:</b> Die Gesamtdauer hängt von Kategorie und Krankheitstagen ab: Erkältung Tage + 1 (2–7), Infekt 2 × Tage (5–14), Magen-Darm Tage + 2 (3–7), Verletzung 2 × Tage (4–14). Sie ist geteilt in ca. 30 % sehr locker und kurz, 40 % locker ohne harte Reize und 30 % mit einer harten Einheit zu 80 %. Diese Aufteilung ist eine eigene Regel und keine Studienvorgabe. Sie folgt dem Prinzip des IOC-Konsenses: Steigern, solange die Symptome wegbleiben, sonst eine Stufe zurück.</p><p><b>Folgewochen:</b> Verpasstes wird nicht nachgeholt, weil Nachholen Belastung staut. Tests rücken hinter den Wiedereinstieg, denn ein Test im angeschlagenen Zustand würde deine Paces falsch kalibrieren. Rennen werden nie verschoben, die App weist nur auf das Risiko hin. Der erste Long Run danach wird gedeckelt: höchstens so lang wie der längste Lauf vor der Krankheit, nach mehr als 7 Tagen Pause höchstens 80 % davon. Das ist abgeleitet aus Frandsen et al. (2025), wonach einzelne Läufe mit mehr als 10 % über dem längsten der letzten 30 Tage das Überlastungsrisiko erhöhen.</p><p><b>Datenschutz:</b> Kategorie, Region und Warnzeichen liegen nur in der App-Datenbank auf dem Gerät und in deiner Sync- oder Sicherungsdatei. Im Export stehen sie nicht.</p><p class="note">Quellen: Schwellnus M. et al. (2022), IOC consensus statement on acute respiratory illness in athletes, part 1, Br J Sports Med, <a href="https://doi.org/10.1136/bjsports-2022-105759" target="_blank" rel="noopener">doi</a>. Weidner T.G. et al. (1998), Med Sci Sports Exerc 30(11):1578–83, <a href="https://pubmed.ncbi.nlm.nih.gov/9813869/" target="_blank" rel="noopener">PubMed</a>. Silbernagel K.G. et al. (2007), Am J Sports Med 35(6):897–906. Frandsen J.S.B. et al. (2025), Br J Sports Med 59(17):1203–10, <a href="https://pubmed.ncbi.nlm.nih.gov/40623829/" target="_blank" rel="noopener">PubMed</a>. Keine ärztliche Beratung.</p>`],
travel: ["Reise: Regeln und Quellen", `<p><b>Ausstattung bestimmt den Ersatz.</b> Mit Laufstrecke bleiben Läufe draußen, auch der Long Run. Mit Laufband werden Qualitätseinheiten zu Laufband-Einheiten, ein Long Run wird auf höchstens 60 Minuten locker gekürzt oder auf einen Tag ohne Reise geschoben. Fitnessraum bedeutet Hotel-Gym und Ergometer statt Rad, Pool bedeutet Techniktraining. Gibt es nur das Zimmer, ersetzt ein Zimmer-Zirkel den lockeren Lauf und Kraft wird zur Zimmer-Kraft.</p><p><b>Laufband auf 1 % Steigung</b> gleicht den fehlenden Luftwiderstand ungefähr aus (Jones & Doust 1996). Die Pace auf dem Band ist trotzdem nicht 1:1 übertragbar, deshalb steuert die HF.</p><p><b>An- und Abreisetag nichts Hartes.</b> Reisemüdigkeit, wenig Schlaf und langes Sitzen mindern Leistung und Erholung. Der Konsens von Janse van Rensburg et al. (2021) empfiehlt Schlaf zu schützen, ausreichend zu trinken und sich zu bewegen. Pro überquerter Zeitzone in Richtung Osten rechnet er mit etwa einem Tag Anpassung, in Richtung Westen mit einem halben.</p><p><b>Schlüsseleinheiten:</b> Passt die Ausstattung, bleiben sie vor Ort, sonst rücken sie auf einen Tag ohne Reise und ohne harte Einheit derselben Sportart daneben. Gibt es keinen solchen Tag, fallen sie weg. Tests kommen nach der Reise, Rennen werden nie verschoben.</p><p><b>Danach:</b> Reisen ab 5 Tagen ohne Lauf-Möglichkeit deckeln den ersten Long Run danach (wie nach Krankheit). Kurze Pausen von wenigen Tagen kosten kaum Fitness, vor allem wenn die Intensität erhalten bleibt (Mujika & Padilla 2000). Deshalb holt die App nichts nach.</p><p class="note">Quellen: Janse van Rensburg D.C. et al. (2021), Managing Travel Fatigue and Jet Lag in Athletes, Sports Med 51:2029–50, <a href="https://doi.org/10.1007/s40279-021-01502-0" target="_blank" rel="noopener">doi</a>. Jones A.M., Doust J.H. (1996), J Sports Sci 14(4):321–7, <a href="https://pubmed.ncbi.nlm.nih.gov/8887211/" target="_blank" rel="noopener">PubMed</a>. Mujika I., Padilla S. (2000), Detraining, Sports Med 30(2):79–87. Frandsen et al. (2025), <a href="https://pubmed.ncbi.nlm.nih.gov/40623829/" target="_blank" rel="noopener">PubMed</a>. Ort und Ausstattung bleiben auf dem Gerät.</p>`],
lrspike: ["Long Run: Sprung über 10 %", `<p>Die App vergleicht jeden langen Lauf mit dem längsten Lauf der 30 Tage davor. Liegt er mehr als 10 % darüber, zeigt sie einen Hinweis.</p><p>Grundlage ist eine Kohorte mit 5.205 Läufern über 18 Monate. Einzelne Läufe mit mehr als 10 % über dem längsten Lauf der letzten 30 Tage gingen mit einem höheren Risiko für Überlastungsverletzungen einher: +64 % bei 10–30 % Sprung, +52 % bei 30–100 %, +128 % bei mehr als dem Doppelten. Wochenkennzahlen wie die Acute:Chronic Workload Ratio zeigten dort keinen klaren Zusammenhang.</p><p><b>Einordnung:</b> Das ist eine Beobachtungsstudie mit überwiegend Männern mittleren Alters und kein Beweis für Ursache und Wirkung. Die 10 % sind ein Schwellenwert aus der Auswertung, keine getestete Trainingsregel. Dein Plan liegt in 10 Wochen darüber, zum Beispiel W15 mit +18 % oder W39 mit +38 %. Er bleibt, wie er ist. Die App bietet vor diesen Läufen einen Deckel als Vorschlag an, die Entscheidung liegt bei dir.</p><p class="note">Quelle: Frandsen J.S.B. et al. (2025), How much running is too much? Br J Sports Med 59(17):1203–10, <a href="https://doi.org/10.1136/bjsports-2024-109380" target="_blank" rel="noopener">doi</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/40623829/" target="_blank" rel="noopener">PubMed</a>.</p>`],
food: ["Ernährung: Werte und Quellen", `<p><b>Tagestypen.</b> Die App ordnet jeden Tag nach geplanten Einheiten ein und gibt Kohlenhydrate (KH) und Eiweiß in g pro kg Körpergewicht an.</p><ul style="margin:0;padding-left:18px;line-height:1.6"><li>Ruhetag: 3–5 g/kg KH</li><li>Locker bis 75 min: 5–7 g/kg</li><li>Schlüsseltag (hart oder 75–150 min): 6–8 g/kg</li><li>Langer Tag (Long Run ab 90 min, Koppel, über 150 min): 8–10 g/kg</li><li>Laden vor Marathon und Mitteldistanz: 8–12 g/kg, 36–48 h vorher</li></ul><p>Die Spannen stammen aus dem Positionspapier von ACSM, Academy of Nutrition and Dietetics und Dietitians of Canada (Thomas et al. 2016) sowie aus Burke et al. (2011). Diese Quellen staffeln nach Trainingsumfang, nämlich leicht 3–5, moderat etwa 1 h am Tag 5–7, 1–3 h am Tag 6–10 und 4–5 h am Tag 8–12 g/kg. <b>Die Zuordnung zu deinen Einheitentypen ist eine eigene Ableitung.</b> Dass ein langer Tag bei 8–10 g/kg liegt, also im oberen Bereich, ist bewusst so gewählt, damit vor dem Long Run und dem Koppeltraining genug Glykogen da ist.</p><p><b>Eiweiß:</b> 1,4–2,0 g/kg am Tag. Am besten verteilt auf 3–5 Portionen zu je 0,25–0,4 g/kg, alle 3–4 Stunden (Jäger et al. 2017, Kerksick et al. 2017). Für Ausdauersportler gilt eher der untere bis mittlere Bereich, an harten Tagen der obere.</p><p><b>Beispielmahlzeiten:</b> Mischkost, Mengen werden auf dein Gewicht und das KH-Ziel skaliert. Die Nährwerte sind gerundete Tabellenwerte, die Summe liegt meist innerhalb von ±5 % zum Ziel. Eiweiß liegt in den Beispielen oft etwas über der Spanne. Das ist unkritisch, die Kohlenhydrate sind die Steuergröße.</p><p class="note">Quellen: Thomas D.T., Erdman K.A., Burke L.M. (2016), Position of the ACSM, AND and DC: Nutrition and Athletic Performance, Med Sci Sports Exerc 48(3):543–68, <a href="https://pubmed.ncbi.nlm.nih.gov/26891166/" target="_blank" rel="noopener">PubMed</a>. Burke L.M. et al. (2011), Carbohydrates for training and competition, J Sports Sci 29 Suppl 1:S17–27. Jäger R. et al. (2017), ISSN position stand: protein and exercise, JISSN 14:20, <a href="https://doi.org/10.1186/s12970-017-0177-8" target="_blank" rel="noopener">doi</a>. Kerksick C.M. et al. (2017), ISSN position stand: nutrient timing, JISSN 14:33, <a href="https://doi.org/10.1186/s12970-017-0189-4" target="_blank" rel="noopener">doi</a>. Orientierung, keine Ernährungsberatung.</p>`],
fuel: ["Verpflegung: Werte und Quellen", `<p><b>Davor:</b> Vor langen oder harten Einheiten 1–4 g/kg KH, 1–4 Stunden vorher. Die App nennt 1,5–2,5 g/kg 2–4 h vorher, am Renntag 2–3 g/kg 3 h vorher. Trinken: 5–7 ml/kg etwa 4 Stunden vorher (Sawka et al. 2007). Bei kurzen, lockeren Einheiten ist keine Vorbereitung nötig.</p><p><b>Währenddessen, Kohlenhydrate nach Dauer</b> (Jeukendrup 2014): unter 45 min keine. 45–75 min hart: Mundspülung oder wenig. 1–2,5 h: 30–60 g pro Stunde. Über 2,5 h: bis 90 g pro Stunde, dann aber nur als Glukose-Fruktose-Mischung und mit trainiertem Darm. Bei lockerer Intensität liegt die App am unteren Rand. Der Darm ist trainierbar (Jeukendrup 2017), deshalb ab W12 Gels im Long Run testen.</p><p><b>Flüssigkeit:</b> Die ACSM betont, dass eine einzige Trinkrate nicht für alle passt. Ziel ist, weniger als 2 % Körpergewicht zu verlieren, ohne mehr zu trinken, als man schwitzt, denn sonst droht eine Hyponatriämie. Die Spannen der App nach Temperatur sind Startwerte, die du mit einer Schweißrate-Messung anpasst: wiegen vor und nach 60 Minuten, 1 kg entspricht 1 l. <b>Natrium:</b> 20–30 mmol/l im Getränk (460–690 mg/l), die App rechnet daraus mg pro Stunde.</p><p><b>Danach:</b> 0,25–0,4 g/kg Eiweiß und etwa 1 g/kg KH. Folgt die nächste Einheit nach weniger als 8 Stunden, 1,0–1,2 g/kg KH pro Stunde über 4 Stunden (Thomas et al. 2016, Kerksick et al. 2017). Flüssigkeit: 1,25–1,5 l je kg Gewichtsverlust.</p><p><b>Rennen und Linz:</b> Laden 36–48 h vorher, Frühstück 3 h vorher. Unterwegs 60–90 g/h, die App startet für Linz bei 70 g/h und 25-g-Gels (neutral, ohne Marke). Koffein ist optional, 3 mg/kg, nur wenn getestet (ISSN: 3–6 mg/kg, Guest et al. 2021). Getränkestationen alle 5 km sind eine Annahme, bitte beim Veranstalter prüfen.</p><p class="note">Quellen: Jeukendrup A. (2014), A step towards personalized sports nutrition, Sports Med 44 Suppl 1:S25–33, <a href="https://pubmed.ncbi.nlm.nih.gov/24791914/" target="_blank" rel="noopener">PubMed</a>. Jeukendrup A. (2017), Training the gut for athletes, Sports Med 47 Suppl 1:101–10. Sawka M.N. et al. (2007), ACSM position stand: exercise and fluid replacement, Med Sci Sports Exerc 39(2):377–90, <a href="https://pubmed.ncbi.nlm.nih.gov/17277604/" target="_blank" rel="noopener">PubMed</a>. Thomas et al. (2016), <a href="https://pubmed.ncbi.nlm.nih.gov/26891166/" target="_blank" rel="noopener">PubMed</a>. Kerksick et al. (2017), <a href="https://doi.org/10.1186/s12970-017-0189-4" target="_blank" rel="noopener">doi</a>. Guest N.S. et al. (2021), ISSN position stand: caffeine and exercise performance, JISSN 18:1, <a href="https://doi.org/10.1186/s12970-020-00383-4" target="_blank" rel="noopener">doi</a>. Orientierung, keine medizinische Beratung.</p>`],
  mc: ["Morgen-Check: so wirkt er", `<p>Schlaf, Gefühl, Muskelkater und Ruhepuls ergeben eine Bereitschaft. <b>Grün</b> heißt Plan wie geplant. Bei <b>Gelb</b> wird die harte Einheit von heute locker, bei <b>Rot</b> auch die von morgen.</p><p><b>Punkte:</b> Ruhepuls +4 bis +6 über deinem Median der letzten 28 Tage gibt 1 Punkt, ab +7 sind es 2. Schlaf unter 6,5 h gibt 1 Punkt, unter 5,5 h 2. Gefühl „müde“ gibt 1 Punkt, „platt“ 2. Starker Muskelkater und schlechter Schlaf geben je 1 Punkt. Ab 2 Punkten steht die Ampel auf Gelb, ab 3 auf Rot.</p><p><b>Einordnung:</b> Ein erhöhter Ruhepuls am Morgen und schlechter Schlaf hängen mit Ermüdung und beginnenden Infekten zusammen. Einzelwerte schwanken aber stark. Die Schwellen sind eigene, vorsichtige Regeln und keine validierten Grenzwerte. Den Ausschlag gibt dein Trend. HRV wäre genauer, braucht aber eine tägliche Messung unter gleichen Bedingungen.</p><p class="note">Hintergrund: Buchheit M. (2014), Monitoring training status with HR measures, Front Physiol 5:73. Fullagar H.H. et al. (2015), Sleep and athletic performance, Sports Med 45(2):161–86.</p>`],
  ai: ["Zweite Meinung: so funktioniert sie", `<p><b>Wofür?</b> Die festen Regeln der App passen den Plan schon selbst an. Die zweite Meinung hilft, wenn mehreres zusammenkommt, das keine Regel abdeckt, etwa Reise, Infekt und mehrere verpasste Einheiten. Der Sonntags-Check-in fragt nur Gefühl, Ruhepuls und Schmerz ab und ändert nichts am Plan.</p><p><b>Ablauf:</b> Anfrage kopieren, in Claude einfügen und senden, Antwort zurück in die App kopieren. Die App zeigt eine Vorschau, du übernimmst oder verwirfst. Mit eigenem API-Schlüssel fragt die App direkt bei Anthropic (api.anthropic.com), das kostet wenige Cent pro Anfrage.</p><p><b>Was rausgeht:</b> Planeinheiten der nächsten 14 Tage, Ist-Werte der letzten 21 Tage (Dauer, Distanz, Puls, RPE), Form, Zonen und Tage, an denen du nicht trainieren konntest, ohne Grund. <b>Was nicht rausgeht:</b> Krankheitsart, Körperregion, Warnzeichen, Reiseort, Gewicht, Notizen, Schmerzwerte.</p><p><b>Leitplanken:</b> Die App prüft jede Antwort. Ändert werden dürfen nur die nächsten 14 Tage, Tests und Rennen bleiben unberührt. Pro Woche sind höchstens 110 % Umfang erlaubt, beim Long Run höchstens +10 % zum längsten Lauf der letzten 30 Tage, insgesamt höchstens 12 Änderungen. Verstöße werden gekürzt oder verworfen und angezeigt. KI-Vorschläge gelten erst nach deiner Bestätigung und lassen sich zurücknehmen.</p><p class="note">KI kann sich irren. Die Regeln der App bleiben das Sicherheitsnetz. Keine medizinische Beratung.</p>`],
  cons: ["Konsistenz", `<p><b>Serie:</b> Wochen in Folge, in denen du mindestens 80 % der Schlüsseleinheiten erledigt hast.</p><p><b>Erfüllung:</b> absolvierte Trainingszeit geteilt durch geplante Zeit, inklusive freier Einheiten.</p><p>Konsistenz schlägt Einzelleistung. Dein Muster in der Vergangenheit waren steile Blöcke mit Pausen, deshalb ist sie hier die wichtigste Kennzahl.</p>`]
});
function infoSheet(k) { const [h, body] = INFO()[k]; return `<div class="sh-head"><div class="tx"><h2 class="sheet-title" tabindex="-1">${esc(h)}</h2></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div><div class="infotext" style="display:grid;gap:12px;line-height:1.55;color:var(--ink2)">${body}</div><div class="sh-foot"><button class="btn ink" data-act="close">Verstanden</button></div>`; }

/* ---------- Ernährung (Orientierung) ---------- */
const KG = () => { const v = E.bodyKg(ST, today()); return num(v) && v >= 35 && v <= 160 ? v : null; };
const NUT_NOTE = `<p class="note" style="display:flex;gap:8px">${ui("shield")}<span>Orientierung aus Konsensempfehlungen, keine medizinische oder ernährungstherapeutische Beratung. Bei Erkrankungen, Unverträglichkeiten oder Gewichtszielen fachlich beraten lassen.</span></p>`;
function nutRow(c, d) {
  const kg = KG();
  if (!kg) return `<div class="grp" style="margin-top:12px"><button class="row" data-act="kg"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("fork")}</span><span class="tx"><span class="t1">Ernährung passend zum Training</span><span class="t2">Einmal Körpergewicht eintragen</span></span>${ui("chev", "chev")}</button></div>`;
  const dt = E.dayType(c.Ex, ST, d), N = E.dayNeeds(dt, kg);
  return `<div class="grp" style="margin-top:12px"><button class="row" data-act="nut" data-v="${d}"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("fork")}</span><span class="tx"><span class="t1">${esc(N.lab)}: ${N.khT} g KH · ${N.pT} g Eiweiß</span><span class="t2">${de(N.khGkg[0], 0)}–${de(N.khGkg[1], 0)} g/kg KH · Beispielmahlzeiten</span></span>${ui("chev", "chev")}</button></div>`;
}
function kgSheet(D) {
  const F = D.f || (D.f = { kg: KG() ?? 75 });
  return `<div class="sh-head"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("fork")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Körpergewicht</h2><p>Für Kohlenhydrate und Eiweiß in g/kg.</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>
   <div class="field"><div class="fl"><span>Gewicht</span><b>kg, ungefähr reicht</b></div>${stepper("kg", F.kg ?? "", { step: 1, lab: "Körpergewicht", mode: "decimal" })}</div>
   <p class="note" style="display:flex;gap:8px">${ui("shield")}<span>Bleibt auf dem Gerät und in deiner Sicherungsdatei. Nicht im Export.</span></p>
   <div class="sh-foot"><button class="btn" data-act="close">Abbrechen</button><button class="btn pri" data-act="savekg">${ui("check")}Speichern</button></div>`;
}
function nutSheet(D) {
  const c = C(), d = D.d, kg = KG(); if (!kg) return kgSheet(D);
  const dt = E.dayType(c.Ex, ST, d), P = E.mealPlan(dt, kg), N = P.needs;
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("fork")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Ernährung ${esc(dayLabel(d, c.t))}</h2><p>${esc(N.lab)} · ${esc(longDate(d))}</p></div>${infoBtn("food")}<button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<div class="kpis nutk" style="margin-top:0"><div class="kpi"><div class="kl">Kohlenhydrate</div><div class="kv">${N.kh[0]}–${N.kh[1]}<small> g</small></div><div class="ks">${de(N.khGkg[0], 0)}–${de(N.khGkg[1], 0)} g/kg</div></div><div class="kpi"><div class="kl">Eiweiß</div><div class="kv">${N.p[0]}–${N.p[1]}<small> g</small></div><div class="ks">${de(N.pGkg[0])}–${de(N.pGkg[1])} g/kg · ${de(kg)} kg</div></div></div>`;
  x += `<p style="color:var(--ink2);margin:10px 2px;line-height:1.5">${esc(N.why)}${dt.race ? " Rennen: " + esc(dt.race.name.replace(/^★\s*/, "")) + "." : ""}</p>`;
  if (dt.items.length) x += `<div class="chips" style="margin-bottom:6px">${dt.items.filter(s => s.sport !== "Ruhe").map(s => `<span class="chip" style="min-height:32px">${icon(s.sport)}${esc(String(s.name || sp(s.sport).lab).replace(/^★\s*/, "").slice(0, 28))} · ${s.min}'</span>`).join("")}</div>`;
  x += `<div class="sec"><h2 style="font-size:1rem">Beispieltag</h2><span class="muted" style="font-size:.8125rem">≈ ${P.kh} g KH · ${P.p} g Eiweiß</span></div><div class="grp">${P.meals.map(m => `<div class="row plain"><span class="tx"><span class="t1">${esc(m.name)}</span><span class="t2" style="white-space:normal">${esc(m.items.map(i => i.g + " " + i.unit + " " + i.lab).join(", "))}</span></span><span class="rv">${m.kh}<small>g KH · ${m.p} g E</small></span></div>`).join("")}</div>`;
  x += `<p class="note">Mengen roh bzw. ungekocht, Nährwerte gerundet. Gemüse, Obst und Öl nach Hunger ergänzen. Trainiert du morgens, rückt ein Teil des Frühstücks nach die Einheit.</p>`;
  const sess = dt.items.filter(s => !s.free && s.sport !== "Ruhe" && (s.min >= 45 || s.test));
  if (sess.length) x += `<div class="sec"><h2 style="font-size:1rem">Rund um die Einheit</h2></div><div class="grp">${sess.map(s => `<button class="row" data-act="fuel" data-id="${esc(s.id)}"><span class="badge-ic" style="--c:${sp(s.sport).c};--t:${sp(s.sport).t}">${icon(s.sport)}</span><span class="tx"><span class="t1">${esc(s.name.replace(/^★\s*/, ""))}</span><span class="t2">Davor, währenddessen, danach</span></span>${ui("chev", "chev")}</button>`).join("")}</div>`;
  x += NUT_NOTE + `<div class="sh-foot"><button class="btn" data-act="kg">Gewicht</button><button class="btn ink" data-act="close">Fertig</button></div>`;
  return x;
}
function fuelSheet(D) {
  const c = C(), s = findS(D.id), kg = KG(); if (!s) return ""; if (!kg) return kgSheet(D);
  const temp = D.temp || E.tempDefault(s.date), soon = c.Ex.some(x => x.id !== s.id && x.date === s.date && E.isTrain(x) && U.tStart(x.time) != null && U.tStart(s.time) != null && U.tStart(x.time) > U.tStart(s.time) && U.tStart(x.time) - U.tStart(s.time) < 480 && (E.isHard(x) || x.min >= 60));
  const F = E.fuelSession(s, kg, temp, { soon }), long = s.test === "race" || (s.sport === "Lauf" && ["LR", "LRM", "M"].includes(s.code) && s.min >= 90);
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:${sp(s.sport).c};--t:${sp(s.sport).t}">${icon(s.sport)}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Verpflegung</h2><p>${esc(s.name.replace(/^★\s*/, ""))} · ${s.min ? s.min + " min" : ""}</p></div>${infoBtn("fuel")}<button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<div class="field"><div class="fl"><span>Temperatur</span><b>Voreinstellung nach Jahreszeit</b></div><div class="seg">${Object.keys(E.TEMP).map(k => `<button data-act="settemp" data-v="${k}" aria-pressed="${F.temp === k}">${esc(E.TEMP[k].lab.replace("unter ", "<").replace("über ", ">"))}</button>`).join("")}</div></div>`;
  const blk = (h, arr) => `<div class="sec"><h2 style="font-size:1rem">${h}</h2></div><div class="grp">${arr.map(t => `<div class="row plain"><span class="tx"><span class="t2" style="white-space:normal;color:var(--ink2);font-size:.9375rem">${esc(t)}</span></span></div>`).join("")}</div>`;
  x += blk("Davor", F.pre);
  const during = [F.dur]; if (F.ml[1]) during.push("Flüssigkeit: " + F.ml[0] + "–" + F.ml[1] + " ml pro Stunde, nach Durst innerhalb dieser Spanne. Nicht mehr trinken, als du schwitzt."); if (F.na[1]) during.push("Natrium: " + F.na[0] + "–" + F.na[1] + " mg pro Stunde (20–30 mmol/l im Getränk), mehr bei salzigen Rändern auf der Kleidung.");
  x += blk("Währenddessen", during) + blk("Danach", F.post);
  if (long) { const R = E.racePlan(s, kg, { temp: F.temp, gph: D.gph, pace: s.test === "race" && s.typ === "M" ? B.S.tgtM * 1440 / 42.195 : undefined });
    x += `<div class="sec"><h2 style="font-size:1rem">${s.test === "race" ? "Rennplan" : "Verpflegungsplan"}</h2><span class="muted" style="font-size:.8125rem">${R.gels} Gels · ${R.khTotal} g KH</span></div>`;
    x += `<div class="field"><div class="fl"><span>Kohlenhydrate pro Stunde</span><b>steigern, was der Magen verträgt</b></div><div class="seg">${[30, 45, 60, 70, 80, 90].map(g => `<button data-act="setgph" data-v="${g}" aria-pressed="${R.gph === g}">${g}</button>`).join("")}</div></div>`;
    if (R.pre.length) x += blk("Vorher", R.pre);
    x += `<div class="grp" style="margin-top:10px">${R.steps.map(st => `<div class="row plain"><span class="rv" style="min-width:58px;text-align:left">${st.t < 0 ? st.t + "'" : st.t + "'"}<small>${st.km != null ? "km " + de(st.km) : st.t < 0 ? "vor Start" : ""}</small></span><span class="tx"><span class="t2" style="white-space:normal;color:var(--ink2);font-size:.9375rem">${esc(st.what)}</span></span></div>`).join("")}</div>`;
    x += `<p class="note">Annahmen: Gel = ${R.gel} g Kohlenhydrate, Getränkestationen alle 5 km${s.test === "race" ? ", Pace nach Zielzeit" : ", Pace aus der Planzeit"}. Die Gels decken ${R.gels * R.gel} von ${R.khTotal} g ab${R.rest ? ", den Rest liefern Iso-Getränke an den Stationen" : ""}. Stationen und Getränk beim Veranstalter prüfen. Alles im Long Run testen, nichts Neues am Renntag.</p>`; }
  x += NUT_NOTE + `<div class="sh-foot"><button class="btn ink" data-act="close">Fertig</button></div>`;
  return x;
}

/* ---------- v3.2 Morgen-Check, Gewicht, Ernährungstagebuch ---------- */
function mcSheet(D) {
  const t = D.d || today(), m0 = get("mc:" + t) || {}, F = D.f || (D.f = { sleep: m0.sleep ?? null, sq: m0.sq ?? null, feel: m0.feel ?? null, puls: m0.puls ?? null, sore: m0.sore ?? null, wt: get("wt:" + t) ?? null });
  const base = E.restBase(B, ST, t), scale = (f, n0, n1, labs) => `<div class="chips">${Array.from({ length: n1 - n0 + 1 }, (_, i) => n0 + i).map(n => `<button type="button" class="chip" data-act="setf" data-f="${f}" data-v="${n}" aria-pressed="${F[f] === n}">${labs ? labs[n - n0] : n}</button>`).join("")}</div>`;
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("sun")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Morgen-Check</h2><p>${esc(longDate(t))} · 10 Sekunden, steuert deine Bereitschaft</p></div>${infoBtn("mc")}<button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<div class="field"><div class="fl"><span>Schlaf</span><b>Stunden</b></div><div class="chips">${[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(n => `<button type="button" class="chip" data-act="setf" data-f="sleep" data-v="${n}" aria-pressed="${F.sleep === n}">${de(n)}</button>`).join("")}</div></div>`;
  x += `<div class="field"><div class="fl"><span>Schlafqualität</span></div>${scale("sq", 1, 5, ["Schlecht", "Mäßig", "Okay", "Gut", "Top"])}</div>`;
  x += `<div class="field"><div class="fl"><span>Gefühl</span></div>${scale("feel", 1, 5, ["Platt", "Müde", "Okay", "Gut", "Top"])}</div>`;
  x += `<div class="field"><div class="fl"><span>Muskelkater</span></div>${scale("sore", 0, 3, ["Keiner", "Leicht", "Deutlich", "Stark"])}</div>`;
  x += `<div class="two" style="margin-top:10px"><div class="field"><div class="fl"><span>Ruhepuls</span><b>Basis ${base}</b></div>${stepper("puls", F.puls ?? "", { step: 1, lab: "Ruhepuls", mode: "numeric", ph: String(base) })}</div><div class="field"><div class="fl"><span>Gewicht</span><b>kg, optional</b></div>${stepper("wt", F.wt ?? "", { step: .1, lab: "Gewicht", mode: "decimal", ph: KG() ? de(KG()) : "–" })}</div></div>`;
  x += `<p class="note">Ruhepuls am besten direkt nach dem Aufwachen von der Uhr ablesen. Bei Rot oder Gelb macht die App harte Einheiten von heute (und bei Rot auch morgen) automatisch locker.</p>`;
  x += `<div class="sh-foot"><button class="btn" data-act="close">Abbrechen</button><button class="btn pri" data-act="savemc" data-v="${t}">${ui("check")}Speichern</button></div>`;
  return x;
}
function wtSheet() {
  const t = today(), W = E.weightTrend(ST, t), L = E.weightList(ST);
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("prog")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Gewicht</h2><p>Trend statt Tageswert, wirkt auf Ernährung</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  if (W) { x += `<div class="kpis nutk" style="margin-top:0"><div class="kpi"><div class="kl">Trend</div><div class="kv">${de(W.cur)}<small> kg</small></div><div class="ks">zuletzt gewogen ${de(W.last)} kg</div></div><div class="kpi"><div class="kl">Pro Woche</div><div class="kv">${W.wk > 0 ? "+" : ""}${de(W.wk, 2)}<small> kg</small></div><div class="ks ${Math.abs(W.wk) > .5 ? "warn" : "ok"}">${Math.abs(W.wk) > .5 ? "schnelle Änderung" : "stabil"}</div></div></div>`;
    if (W.ser.length >= 2) x += `<div class="card">${chart({ x0: W.ser[0].date, x1: t, h: 170, label: "Gewicht", yFmt: v => de(v), series: [{ pts: W.ser.map(p => ({ x: p.date, y: p.v, tip: de(p.v) + " kg " + U.wdD(p.date) })), c: "var(--mute)", dots: true, noLine: true }, { pts: W.ser.map(p => ({ x: p.date, y: p.tr })), c: "var(--ok)", sw: 3 }] })}</div>`;
    x += `<p class="note">${Math.abs(W.wk) > .5 ? "Mehr als 0,5 kg pro Woche Veränderung: Im Marathonblock ist Abnehmen riskant (Energiedefizit kostet Leistung und erhöht das Verletzungsrisiko). Prüfe, ob du an harten Tagen genug Kohlenhydrate isst." : "Stabiles Gewicht im Aufbau ist gut: Leistung entsteht aus Training und Erholung, nicht aus Defizit."} Die Ernährungsziele rechnen mit dem Trend (${de(W.cur)} kg).</p>`; }
  else x += `<div class="grp"><div class="empty"><b>Noch keine Werte</b>Trag dein Gewicht im Morgen-Check ein, am besten 2–3 Mal pro Woche morgens nüchtern.</div></div>`;
  if (L.length) x += `<div class="sec"><h2 style="font-size:1rem">Einträge</h2></div><div class="grp">${L.slice(-10).reverse().map(e => `<div class="row plain"><span class="tx"><span class="t1">${de(e.v)} kg</span><span class="t2">${esc(U.wdD(e.date))}</span></span><button class="iconbtn sm" data-act="wtdel" data-v="${e.date}" aria-label="Löschen">${ui("trash")}</button></div>`).join("")}</div>`;
  x += `<div class="sh-foot"><button class="btn ink" data-act="mc">${ui("plus")}Heute eintragen</button></div>`;
  return x;
}
const MEALS = [["f", "Frühstück"], ["m", "Mittagessen"], ["a", "Abendessen"], ["s", "Snacks"], ["n", "Notiz (Trinken, Gefühl, Verdauung)"]];
function fdSheet(D) {
  const c = C(), d = D.d || c.t, f0 = get("fd:" + d) || {}, F = D.f || (D.f = Object.assign({ f: "", m: "", a: "", s: "", n: "" }, f0));
  const kg = KG(), N = kg ? E.dayNeeds(E.dayType(c.Ex, ST, d), kg) : null;
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("fork")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Ernährungstagebuch</h2><p>${esc(longDate(d))}${N ? " · " + esc(N.lab) + ", Ziel " + N.khT + " g KH" : ""}</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<div class="dnav"><button class="iconbtn" data-act="fdday" data-v="${d - 1}" aria-label="Vortag">${ui("back")}</button><span>${esc(dayLabel(d, c.t))}</span><button class="iconbtn" data-act="fdday" data-v="${d + 1}" aria-label="Nächster Tag" ${d >= c.t ? "disabled" : ""}>${ui("chev")}</button></div>`;
  x += MEALS.map(([k, lab]) => `<div class="field"><div class="fl"><span>${lab}</span></div><textarea class="inp" data-in="fd_${k}" rows="2" placeholder="${k === "f" ? "z. B. Haferflocken, Banane, Kaffee" : k === "n" ? "z. B. 2,5 l getrunken, Magen ok" : "frei mitschreiben"}">${esc(F[k] || "")}</textarea></div>`).join("");
  x += `<p class="note" style="display:flex;gap:8px">${ui("shield")}<span>Bleibt auf dem Gerät. Im Export steht es im Blatt „Tagebuch“, damit das Wochen-Review es mit auswerten kann.</span></p>`;
  x += `<div class="sh-foot"><button class="btn" data-act="nut" data-v="${d}">Empfehlung</button><button class="btn pri" data-act="savefd" data-v="${d}">${ui("check")}Speichern</button></div>`;
  return x;
}
/* ---------- Plan ---------- */
/* 4.4 Statussprache: ein Symbol pro Einheit. Die Form trägt den Status, die Farbe die Sportart.
   erledigt = gefüllt mit Haken, teilweise = halb gefüllt, verpasst = roter Ring mit Kreuz (auch vergangen ohne Eintrag), geplant = Ring. */
const ST_LAB = { done: "erledigt", half: "teilweise", miss: "verpasst", open: "geplant", sick: "krank", skip: "optional" };
const SPORT_ORDER = ["Lauf", "Rad", "Schwimmen", "Kraft", "Mobility", "Triathlon", "Sonstiges"];
function stKind(s, t) { if (s.isFree) return "done"; const st = E.statusOf(ST, s, t); return st === "✓" ? "done" : st === "½" ? "half" : st === "✗" ? "miss" : st === "krank" ? "sick" : s.date < t ? (E.isTrain(s) ? "miss" : "skip") : "open"; }
function sdot(c, k) {
  const R = 'cx="8" cy="8" r="6.7"';
  const g = k === "done" ? `<circle ${R} style="fill:${c};stroke:${c}" stroke-width="1.6"/><path d="M4.8 8.3l2.2 2.2 4.2-4.7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    : k === "half" ? `<circle ${R} style="fill:#fff;stroke:${c}" stroke-width="1.8"/><path d="M8 1.3a6.7 6.7 0 0 0 0 13.4z" style="fill:${c}"/>`
    : k === "miss" ? `<circle ${R} style="fill:#fff;stroke:var(--bad)" stroke-width="1.8"/><path d="M5.7 5.7l4.6 4.6M10.3 5.7l-4.6 4.6" style="stroke:var(--bad)" stroke-width="1.8" stroke-linecap="round"/>`
    : k === "sick" ? `<circle ${R} style="fill:var(--rest-t);stroke:var(--rest)" stroke-width="1.6" stroke-dasharray="2.2 2"/>`
    : k === "skip" ? `<circle ${R} style="fill:#fff;stroke:${c}" stroke-width="1.6" opacity=".45"/>`
    : `<circle ${R} style="fill:#fff;stroke:${c}" stroke-width="2.1"/>`;
  return `<svg class="sd sd-${k}" viewBox="0 0 16 16" aria-hidden="true">${g}</svg>`;
}
/* Markierungen eines Tages für Woche und Monat: Symbole, Ruhetag-Strich, roter Punkt bei geplantem Tag ohne Training. */
function dayMarks(c, d) {
  const all = dayItems(c, d), it = all.filter(s => s.sport !== "Ruhe" && !s.dropped), t = c.t;
  const ks = it.map(s => ({ s, k: stKind(s, t) })), tr = ks.filter(x => x.s.isFree || E.isTrain(x.s));
  const inPlan = d >= B.S.start && E.weekOf(B, d) <= c.NW, rest = !it.length && (all.length > 0 || inPlan);
  const gap = d < t && tr.length > 0 && !tr.some(x => x.k === "done" || x.k === "half" || x.k === "sick");
  const dots = rest ? `<span class="rdash"></span>` : ks.map(x => sdot(sp(x.s.sport).c, x.k)).join("");
  const lab = rest ? "Ruhetag" : ks.map(x => sp(x.s.sport).lab + " " + ST_LAB[x.k]).join(", ") + (gap ? ", nicht trainiert" : "");
  return { dots, lab, gap, rest, alldone: tr.length > 0 && tr.every(x => x.k === "done") };
}
function stLegend(extra) {
  const n = "var(--ink2)";
  return `<div class="legend stleg">${["Lauf", "Rad", "Schwimmen", "Kraft"].map(k => `<span><i style="--c:${sp(k).c}"></i>${sp(k).lab}</span>`).join("")}<span class="br" aria-hidden="true"></span>${[["done", "erledigt"], ["half", "teilweise"], ["miss", "verpasst"], ["open", "geplant"]].map(([k, l]) => `<span>${sdot(n, k)}${l}</span>`).join("")}<span><span class="rdash"></span>Ruhetag</span><span><span class="gapdot"></span>kein Training</span>${extra || ""}</div>`;
}
/* Wochenbilanz in einer Karte: Stunden als gestapelter Balken nach Sport, Strecken und Schlüsseleinheiten als Chips. */
function wsum(W) {
  const run = W.past || W.cur, pct = W.so ? Math.round(W.is / W.so * 100) : 0, full = Math.max(W.so, W.is) || 1;
  const segs = run ? SPORT_ORDER.filter(k => W.sp && W.sp[k] && W.sp[k].is > 0).map(k => `<i style="width:${(W.sp[k].is / full * 100).toFixed(1)}%;background:${sp(k).c}"></i>`).join("") : "";
  const swim = v => Math.round(v * 1000).toLocaleString("de-DE"), amt = (k, v) => k === "Schwimmen" ? swim(v) + " m" : de(v) + " km";
  const chips = ["Lauf", "Rad", "Schwimmen"].filter(k => W.sp && W.sp[k] && (W.sp[k].km || W.sp[k].kmIs)).map(k => `<span class="wchip" role="img" aria-label="${sp(k).lab}: ${run ? (k === "Schwimmen" ? swim(W.sp[k].kmIs) : de(W.sp[k].kmIs)) + " von " : ""}${amt(k, W.sp[k].km)}"><span class="wci" style="color:${sp(k).c}">${icon(k)}</span><span>${run ? `<b>${k === "Schwimmen" ? swim(W.sp[k].kmIs) : de(W.sp[k].kmIs)}</b> von ` : ""}${amt(k, W.sp[k].km)}</span></span>`).join("");
  const key = W.keyTot ? `<span class="wchip"><span class="wci key">${ui("star")}</span><span>${run ? `<b>${W.keyDone}</b> von ${W.keyTot}` : W.keyTot} Schlüssel</span></span>` : "";
  return `<div class="wsum"><div class="ws-h">${run ? `<b class="num">${de(W.is / 60)} h</b><span>von ${de(W.so / 60)} h trainiert</span><span class="ws-p num">${pct} %</span>` : `<b class="num">${de(W.so / 60)} h</b><span>geplant</span>`}</div>${run ? `<div class="ws-bar" role="img" aria-label="${pct} % vom Wochensoll">${segs}</div>` : ""}${chips || key ? `<div class="ws-chips">${chips}${key}</div>` : ""}</div>`;
}
function vPlan(c) {
  let x = `<header class="lt"><div><div class="eyebrow">${c.pre ? "Start " + esc(shortDate(B.S.start)) : "Woche " + c.cw + " von " + c.NW}</div><h1>Plan</h1></div><div class="acts"><button class="iconbtn" data-act="free" aria-label="Training hinzufügen">${ui("plus")}</button></div></header>`;
  x += `<div class="zoom"><div class="seg" role="group" aria-label="Zoom">${[["tag", "Tag"], ["woche", "Woche"], ["monat", "Monat"], ["saison", "Saison"]].map(([k, l]) => `<button data-act="zoom" data-v="${k}" aria-pressed="${planZoom === k}">${l}</button>`).join("")}</div></div>`;
  if (planZoom === "saison") return x + vSeason(c);
  if (planZoom === "monat") return x + vMonth(c);
  if (planZoom === "tag") return x + vDay(c);
  return x + vWeek(c);
}
function vWeek(c) {
  const w = planWeek || c.cw, ws = B.S.start + 7 * (w - 1), W = c.WS.weeks[w - 1] || {}, ph = (B.weeks[w] || {}).phase || "";
  let x = `<div class="wkhead"><button class="iconbtn" data-act="wk" data-v="${w - 1}" ${w <= 1 ? "disabled" : ""} aria-label="Vorwoche">${ui("back")}</button><div class="mid"><b>Woche ${w}</b><span>${esc(shortDate(ws))} bis ${esc(shortDate(ws + 6))}</span></div><button class="iconbtn" data-act="wk" data-v="${w + 1}" ${w >= c.NW ? "disabled" : ""} aria-label="Nächste Woche">${ui("chev")}</button></div>`;
  if (w !== c.cw) x += `<p style="text-align:center;margin:-6px 0 10px"><button class="lnk" data-act="wk" data-v="${c.cw}">Zur aktuellen Woche</button></p>`;
  x += `<div class="wkbars" id="wkswipe">${[0, 1, 2, 3, 4, 5, 6].map(i => { const d = ws + i, tst = dayItems(c, d).some(s => s.test), m = dayMarks(c, d);
    return `<button data-act="day" data-v="${d}" class="${d === c.t ? "today" : ""}${tst ? " isT" : ""}${m.alldone ? " alldone" : ""}" aria-haspopup="dialog" aria-label="${esc(longDate(d) + ": " + m.lab)}"><span class="wd">${U.WD[U.sd(d).getUTCDay()]}</span><span class="dn">${U.sd(d).getUTCDate()}</span><span class="gapdot${m.gap ? "" : " no"}"></span><span class="dots">${m.dots}</span></button>`; }).join("")}</div>`;
  x += stLegend(`<span><i class="tq"></i>Test oder Rennen</span>`);
  x += wsum(W);
  const pw = E.phaseWhy(ph); if (pw) x += `<details class="why" style="margin-top:12px;margin-bottom:12px"><summary>${ui("book")}<span>Phase: ${esc(ph.replace(/\s*\(E\)\s*$/, ""))}${/\(E\)/.test(ph) ? " · Entlastungswoche" : ""}</span><span class="ev ev${pw.ev}">${pw.ev}</span></summary><p>${esc(pw.zweck)}${/\(E\)/.test(ph) ? " Entlastungswoche: weniger Umfang, damit sich die Anpassungen der letzten Wochen festigen." : ""}</p><p class="note">Evidenz: ${esc(E.EV_LAB[pw.ev])}. Quellen: ${esc(pw.src.map(k => E.SRC[k]).join(" · "))}</p></details>`;
  for (let i = 0; i < 7; i++) { const d = ws + i, it = dayItems(c, d), rest = it.length && it.every(s => s.sport === "Ruhe");
    const ab = E.absOn(ST, d, c.t);
    x += `<div class="dayhead${d === c.t ? " today" : ""}"><b>${esc(dayLabel(d, c.t) === U.WDL[U.sd(d).getUTCDay()] ? U.WDL[U.sd(d).getUTCDay()] : dayLabel(d, c.t))}</b>${ab.map(a => `<button class="abpill ab-${a.kind}" data-act="absedit" data-v="${esc(a.key)}" aria-label="${esc(absLabel(a))} bearbeiten">${ui(a.kind === "krank" ? "sick" : "plane")}${esc(absLabel(a))}</button>`).join("")}<span>${esc(U.wdD(d))}</span></div>`;
    x += `<div class="grp">${rest || !it.length ? `<div class="row plain"><span class="badge-ic" style="--c:var(--rest);--t:var(--rest-t)">${icon("Ruhe")}</span><span class="tx"><span class="t1">Ruhetag</span><span class="t2">${esc((it[0] && it[0].desc) || "Erholung")}</span></span></div>` : it.filter(s => s.sport !== "Ruhe").map(s => sessRow(s, c)).join("")}</div>`; }
  return x;
}
function vDay(c) {
  const d = planDay || c.t, it = dayItems(c, d);
  let x = `<div class="wkhead"><button class="iconbtn" data-act="dayn" data-v="${d - 1}" aria-label="Vortag">${ui("back")}</button><div class="mid"><b>${esc(dayLabel(d, c.t))}</b><span>${esc(longDate(d))} · Woche ${E.weekOf(B, d)}</span></div><button class="iconbtn" data-act="dayn" data-v="${d + 1}" aria-label="Nächster Tag">${ui("chev")}</button></div>`;
  if (d !== c.t) x += `<p style="text-align:center;margin:-6px 0 10px"><button class="lnk" data-act="dayn" data-v="${c.t}">Heute</button></p>`;
  const rest = !it.length || it.every(s => s.sport === "Ruhe");
  if (rest) return x + `<div class="grp"><div class="empty"><b>Ruhetag</b>${esc((it[0] && it[0].desc) || "Erholung ist Training.")}</div></div>`;
  it.filter(s => s.sport !== "Ruhe").forEach(s => { const z = zoneOf(s, c), S = sp(s.sport);
    x += `<div class="card tap" role="button" tabindex="0" data-act="sess" data-id="${esc(s.id)}" aria-label="${esc(s.name)} öffnen"><div class="ch"><div style="display:flex;gap:12px;align-items:center"><span class="badge-ic" style="--c:${S.c};--t:${S.t}">${icon(s.sport)}</span><div><h3>${esc(s.name.replace(/^★\s*/, ""))}${tags(s)}</h3><p>${esc(s.time || S.lab)}${s.wake ? " · Wecker " + esc(s.wake) : ""}</p></div></div>${s.sport !== "Ruhe" && !s.isFree ? stmark(s, c.t) : ""}</div>
      <div class="planned" style="margin:8px 0">${s.km ? `<span><b>${esc(kmStr(s.km, s.sport))}</b></span>` : ""}${s.min ? `<span><b>${esc(durStr(s.min))}</b></span>` : ""}${z.pace ? `<span>${esc(z.pace)}</span>` : ""}${z.hf ? `<span>HF <b>${esc(z.hf)}</b></span>` : ""}</div>
      <p style="color:var(--ink2);line-height:1.5">${esc(s.desc || "")}</p><div class="more">Details, Ablauf und Übungen ${ui("chev")}</div></div>`; });
  return x;
}

/* 4.4 Tagesfenster (aus Woche und Monat): Popover am Mac/iPad, Bottom-Sheet am iPhone. Die Ansicht darunter bleibt stehen. */
function dayPop(D) {
  const c = C(), d = D.d, all = dayItems(c, d), it = all.filter(s => s.sport !== "Ruhe"), w = E.weekOf(B, d), ph = ((B.weeks[w] || {}).phase || "").replace(/\s*\(E\)\s*$/, ""), rest = all.find(s => s.sport === "Ruhe");
  const rel = dayLabel(d, c.t), relTxt = rel !== U.WDL[U.sd(d).getUTCDay()] ? rel + ", " : "";
  let x = `<div class="sh-head pop-h"><div class="tx"><h2 class="sheet-title" tabindex="-1">${esc(longDate(d))}</h2><p>${esc(relTxt)}Woche ${w}${ph && w >= 1 && w <= c.NW ? ", " + esc(ph) : ""}</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  const abD = E.absOn(ST, d, c.t); if (abD.length) x += abD.map(a => `<div class="banner ${a.kind === "krank" ? "err" : "info"}">${ui(a.kind === "krank" ? "sick" : "plane")}<div class="tx"><b>${esc(absLabel(a))}</b> ${esc(absRange(a, c.t))}</div><button class="btn sm" data-act="absedit" data-v="${esc(a.key)}">Ändern</button></div>`).join("");
  if (it.length) x += `<div class="grp pgrp">${it.map(s => { const k = s.dropped ? "open" : stKind(s, c.t), S = sp(s.sport), raw = s.isFree ? "✓" : E.statusOf(ST, s, c.t);
      const can = !s.isFree && !s.dropped && s.date <= c.t && E.isTrain(s) && !raw;
      const a = s.isFree ? { km: s.km, min: s.min } : E.actual(ST, s, c.t), dn = k === "done" || k === "half";
      const amt = dn ? (a.km ? kmStr(a.km, s.sport) : a.min ? durShort(a.min) : "") : (s.km ? kmStr(s.km, s.sport) : s.min ? durShort(s.min) : "");
      const stl = s.dropped ? (s.note || "entfällt") : can && s.date === c.t ? "offen" : can ? "nicht eingetragen" : ST_LAB[k];
      const sub = [s.time || "", amt, stl].filter(Boolean).join(" · ");
      return `<div class="prow${dn ? " done" : ""}${s.dropped ? " dropped" : ""}"><button class="row" data-act="sess" data-id="${esc(s.id)}" aria-label="${esc(s.name.replace(/^★\s*/, "") + ", " + stl + ", öffnen")}"><span class="badge-ic" style="--c:${S.c};--t:${S.t}">${icon(s.sport)}</span><span class="tx"><span class="t1">${esc(s.name.replace(/^★\s*/, ""))}${tags(s)}</span><span class="t2">${esc(sub)}</span></span>${can ? "" : sdot(S.c, s.dropped ? "open" : k)}</button>${can ? `<button class="pchk" data-act="pdone" data-id="${esc(s.id)}" aria-label="${esc(s.name.replace(/^★\s*/, ""))} abhaken">${ui("check")}</button>` : ""}</div>`; }).join("")}</div>`;
  else x += `<div class="grp pgrp"><div class="row plain"><span class="badge-ic" style="--c:var(--rest);--t:var(--rest-t)">${icon("Ruhe")}</span><span class="tx"><span class="t1">Ruhetag</span><span class="t2" style="white-space:normal">${esc((rest && rest.desc) || "Erholung ist Training.")}</span></span></div></div>`;
  if (it.some(s => !s.isFree && !s.dropped && s.date <= c.t && E.isTrain(s) && !E.statusOf(ST, s, c.t))) x += `<p class="pop-hint">Haken tippen, wenn erledigt. Für Werte und Gefühl die Einheit öffnen.</p>`;
  const showW = planZoom !== "woche" || (planWeek || c.cw) !== w;
  x += `<div class="pop-f"><button class="iconbtn" data-act="dsh" data-v="${d - 1}" aria-label="Vortag">${ui("back")}</button>${showW && w >= 1 && w <= c.NW ? `<button class="btn sm" data-act="mday2w" data-v="${d}">Woche ${w} öffnen</button>` : `<span></span>`}<button class="iconbtn" data-act="dsh" data-v="${d + 1}" aria-label="Nächster Tag">${ui("chev")}</button></div>`;
  return x;
}
function vMonth(c) {
  const base = planMonth != null ? planMonth : (() => { const d = U.sd(c.t); return d.getUTCFullYear() * 12 + d.getUTCMonth(); })();
  const y = Math.floor(base / 12), m = base % 12, first = U.serialOf(new Date(y, m, 1, 12)), days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const lead = (U.sd(first).getUTCDay() + 6) % 7, start = first - lead, cells = Math.ceil((lead + days) / 7) * 7;
  let x = `<div class="wkhead"><button class="iconbtn" data-act="mon" data-v="${base - 1}" aria-label="Vormonat">${ui("back")}</button><div class="mid"><b>${MON[m]} ${y}</b><span>Tag antippen für Einheiten</span></div><button class="iconbtn" data-act="mon" data-v="${base + 1}" aria-label="Nächster Monat">${ui("chev")}</button></div>`;
  x += `<div class="month"><div class="mh">${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => `<span>${d}</span>`).join("")}</div><div class="mg">`;
  for (let i = 0; i < cells; i++) { const d = start + i, it = dayItems(c, d), out = U.sd(d).getUTCMonth() !== m, race = it.some(s => s.test === "race"), ab = E.absOn(ST, d, c.t), a0 = ab[0], mk = dayMarks(c, d);
    const abCls = a0 ? " ab-" + a0.kind : "";
    x += `<button class="md${out ? " out" : ""}${d === c.t ? " today" : ""}${race ? " race" : ""}${mk.alldone ? " alldone" : ""}${abCls}" data-act="mday" data-v="${d}" aria-haspopup="dialog" aria-label="${esc(longDate(d) + ": " + mk.lab + (race ? ", Rennen" : "") + (a0 ? ", " + E.ABS_KIND[a0.kind].lab : ""))}"><b>${U.sd(d).getUTCDate()}</b><span class="gapdot${mk.gap ? "" : " no"}"></span><span class="dots">${mk.dots}</span>${a0 ? `<span class="abbar"></span>` : ""}</button>`; }
  x += `</div></div>${stLegend(`<span><i class="sq" style="--c:var(--gold-s)"></i>Rennen</span><span><i class="ln" style="--c:var(--lane)"></i>Dienstreise</span><span><i class="ln" style="--c:var(--gold-s)"></i>Urlaub</span><span><i class="ln" style="--c:var(--bad)"></i>Krank</span>`)}`;
  return x;
}

/* ---------- Saison ---------- */
const PH_SHORT = [[/Wiedereinstieg/i, "Start"], [/Basis & HF/i, "Basis"], [/Grundlage/i, "Tempo"], [/Marathonspez/i, "Marathon"], [/Taper/i, "Taper"], [/Regeneration/i, "Erholung"], [/Triathlon-Basis/i, "Tri-Basis"], [/Olympische/i, "OD"], [/Übergang/i, "Pause"], [/Allgäu-Aufbau/i, "Berg"], [/Allgäu-spez/i, "Allgäu"]];
const phShort = p => (PH_SHORT.find(([r]) => r.test(p)) || [0, p])[1];
const raceShort = (n, s) => { n = String(n); if (s) return n.replace(/HM Frankfurt/, "HM").replace(/Marathon /, "").replace(/Olympische Distanz.*/, "OD").replace(/Allgäu.*/, "Allgäu"); return n.replace(/Olympische Distanz/, "OD").replace(/Allgäu Triathlon Classic/, "Allgäu").replace(/Marathon /, ""); };
const testShort = n => /Aerob/i.test(n) ? "Aerob" : /LTHR/i.test(n) ? (/Rad/i.test(n) ? "Rad" : "LTHR") : /10.?km/i.test(n) ? "10 km" : /CSS/i.test(n) ? "CSS" : /Berg/i.test(n) ? "Berg" : String(n).split(/[\s:-]/)[0];
const PH_OPEN = new Set();
function phaseList(c) {
  const phs = []; for (let w = 1; w <= c.NW; w++) { const raw = (B.weeks[w] || {}).phase || "", p = raw.replace(/\s*\(E\)\s*$/, ""), en = raw !== p;
    if (!phs.length || phs[phs.length - 1].p !== p) phs.push({ p, a: w, b: w, e: en ? [w] : [] }); else { phs[phs.length - 1].b = w; if (en) phs[phs.length - 1].e.push(w); } }
  phs.forEach(p => { p.st = c.pre || c.cw < p.a ? "next" : c.cw > p.b ? "past" : "now"; });
  return phs;
}
function seasonLead(c) {
  const nx = B.S.events.filter(e => e.date >= c.t).sort((a, b) => a.date - b.date)[0], rTxt = nx ? ` Nächstes Rennen: <b>${esc(raceShort(nx.name))}</b> in <b>${nx.date - c.t} Tagen</b>.` : "";
  if (c.pre) return `Der Plan startet am <b>${esc(shortDate(B.S.start))}</b> und läuft ${c.NW} Wochen.${rTxt}`;
  const cur = phaseList(c).find(p => p.st === "now"), WS = c.WS.weeks, cw = c.cw;
  const soCur = c.Ex.filter(s => s.w === cw && s.date < c.t && E.isTrain(s) && !s.dropped && !String(s.id).includes("~")).reduce((a, s) => a + (s.min || 0), 0);
  const so = WS.filter(w => w.past).reduce((a, w) => a + w.so, 0) + soCur, is = WS.filter(w => w.past || w.cur).reduce((a, w) => a + w.is, 0);
  const pTxt = cur ? `Phase <b>${esc(cur.p)}</b>, Woche ${cw - cur.a + 1} von ${cur.b - cur.a + 1}.` : "";
  const hTxt = so > 0 || is > 0 ? ` Bisher <b>${de(is / 60, is >= 600 ? 0 : 1)} h</b> trainiert${so > 0 ? `, <b>${Math.round(is / so * 100)} %</b> vom Soll` : ""}.` : " Noch nichts eingetragen.";
  return pTxt + hTxt + rTxt;
}
/* Saison-Grafik: eigenes SVG. Je Woche Soll-Säule (hell, Rahmen) und Ist gestapelt nach Sport; Rennen als Fahnen, Tests als Rauten, Phasen als Band. */
function seasonW() { const w = innerWidth; if (w >= 1000) { const side = PREF.side === "rail" ? 72 : w < 1280 ? 208 : 232; return Math.max(560, Math.min(860, w - side - 68) - 30); } return Math.max(260, Math.min(728, w - 32) - 28); }
function seasonSvg(c) {
  const WS = c.WS.weeks, NW = c.NW, Wd = Math.round(seasonW()), small = Wd < 520;
  const pl = 30, pr = 6, top = 40, bh = small ? 132 : 176, colW = (Wd - pl - pr) / NW, bw = Math.max(3, Math.min(14, colW * .64));
  const mxh = Math.max(1, ...WS.map(w => Math.max(w.so, w.is) / 60)), step = mxh <= 6 ? 2 : mxh <= 12 ? 4 : 5, ymax = Math.ceil(mxh / step) * step;
  const base = top + bh, Y = h => base - h / ymax * bh, X = w => pl + (w - 1) * colW, Xd = d => pl + (d - B.S.start) / 7 * colW;
  const fw = (s, f) => String(s).length * (f || 6.1);
  let g = `<defs><pattern id="sgH" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" style="fill:var(--seal)"/><line x1="0" y1="0" x2="0" y2="4" style="stroke:rgba(7,45,89,.38)" stroke-width="1.6"/></pattern></defs>`;
  for (let v = 0; v <= ymax; v += step) g += `<line class="sg-gl" x1="${pl}" x2="${Wd - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pl - 5}" y="${Y(v) + 3.5}" text-anchor="end">${v ? v + " h" : "0"}</text>`;
  const cw = WS.find(w => w.cur);
  if (cw) g += `<rect class="sg-now" x="${X(cw.w)}" y="${top - 6}" width="${colW}" height="${bh + 6}" rx="2"/>`;
  /* Rennen: Leitlinie, Fahne, Name in zwei Zeilen ohne Überlappung */
  const rows = [-1e9, -1e9];
  B.S.events.slice().sort((a, b) => a.date - b.date).forEach(e => { const wi = E.weekOf(B, e.date); if (wi < 1 || wi > NW) return; const cx = X(wi) + colW / 2, lab = raceShort(e.name, small), lw = fw(lab, 6.9) + 14;
    let x0 = cx - 4; if (x0 + lw > Wd - pr) x0 = Wd - pr - lw; let r = 0; if (x0 < rows[0] + 6) { r = 1; if (x0 < rows[1] + 6) x0 = rows[1] + 6; } rows[r] = x0 + lw;
    const fy = 4 + r * 15;
    g += `<line class="sg-rl" x1="${cx}" x2="${cx}" y1="${fy + 12}" y2="${base}"/><path class="sg-flag" d="M${x0 + 1} ${fy + 1}v11M${x0 + 1} ${fy + 1.5}h7l-1.6 2.6 1.6 2.6h-7"/><text class="sg-race" x="${x0 + 11}" y="${fy + 10}">${esc(lab)}</text>`; });
  WS.forEach(w => { const x = X(w.w) + (colW - bw) / 2, ent = /\(E\)/.test((B.weeks[w.w] || {}).phase || ""), ys = Y(w.so / 60);
    g += `<rect class="sg-so${ent ? " ent" : ""}" x="${x}" y="${ys}" width="${bw}" height="${Math.max(1, base - ys)}" rx="1.5"/>`;
    if (w.past || w.cur) { let y = base; SPORT_ORDER.forEach(k => { const z = w.sp[k]; if (!z || !(z.is > 0)) return; const hh = z.is / 60 / ymax * bh; y -= hh; g += `<rect x="${x}" y="${y}" width="${bw}" height="${hh}" style="fill:${sp(k).c}"/>`; }); } });
  g += `<line class="sg-ax" x1="${pl}" x2="${Wd - pr}" y1="${base}" y2="${base}"/>`;
  if (cw) g += `<text class="sg-nowt" x="${Math.min(Wd - pr - 14, Math.max(pl + 14, X(cw.w) + colW / 2))}" y="${top - 10}" text-anchor="middle">jetzt</text>`;
  /* Tests: Raute je Woche unter der Achse */
  const tw = new Map(); c.Ex.filter(s => s.test === "test" && !s.dropped).forEach(s => { if (!tw.has(s.w)) tw.set(s.w, []); tw.get(s.w).push(s); });
  tw.forEach((a, w) => { const cx = X(w) + colW / 2, ty = base + 10; g += `<path class="sg-test" d="M${cx} ${ty - 4.5}l4.5 4.5-4.5 4.5-4.5-4.5z"/>`; });
  /* Monatsachse */
  const my = base + 28; let lastX = -1e9; const st = U.sd(B.S.start), endD = B.S.start + 7 * NW;
  for (let k = 0; ; k++) { const dt = new Date(Date.UTC(st.getUTCFullYear(), st.getUTCMonth() + k + 1, 1)), s0 = Math.floor(dt.getTime() / 864e5) + 25569; if (s0 >= endD) break;
    const xx = Xd(s0), mo = dt.getUTCMonth(), lab = MONS[mo] + (mo === 0 && !small ? " " + String(dt.getUTCFullYear()).slice(2) : ""), lw = fw(lab, 6.6);
    g += `<line class="sg-mt" x1="${xx}" x2="${xx}" y1="${base}" y2="${base + 4}"/>`;
    if ((small && k % 2) || xx + 2 - lastX < 8 || xx + 2 + lw > Wd - pr) continue; g += `<text class="sg-mo" x="${xx + 2}" y="${my}">${lab}</text>`; lastX = xx + 2 + lw; }
  /* Phasenband */
  const py = base + 36, phH = 20;
  phaseList(c).forEach(p => { const x = X(p.a) + 1, wd = (p.b - p.a + 1) * colW - 2, lab = p.p ? phShort(p.p) : "", fits = fw(lab, small ? 5.3 : 6.2) + 5 <= wd;
    g += `<rect class="sg-ph ${p.st}" x="${x}" y="${py}" width="${wd}" height="${phH}" rx="4"><title>${esc(p.p)}: Woche ${p.a}${p.b > p.a ? " bis " + p.b : ""}</title></rect>${fits ? `<text class="sg-pht ${p.st}${small ? " sm" : ""}" x="${x + wd / 2}" y="${py + 13.5}" text-anchor="middle">${esc(lab)}</text>` : ""}`; });
  /* Trefferflächen: ganze Spalte, damit Antippen auch auf dem iPhone klappt */
  WS.forEach(w => { const ph = ((B.weeks[w.w] || {}).phase || "").replace(/\s*\(E\)\s*$/, "");
    g += `<rect class="sg-hit" data-act="swk" data-v="${w.w}" x="${X(w.w)}" y="${top - 8}" width="${colW}" height="${bh + 22}"><title>Woche ${w.w}, ${esc(ph)}: ${de(w.so / 60)} h geplant${w.past || w.cur ? ", " + de(w.is / 60) + " h trainiert" : ""}</title></rect>`; });
  const Hh = py + phH + 4;
  return `<svg class="sg" viewBox="0 0 ${Wd} ${Hh}" role="img" aria-label="Saison: geplante und trainierte Stunden je Woche, ${NW} Wochen">${g}</svg>`;
}
function seasonLegend(c) {
  const used = SPORT_ORDER.filter(k => ["Lauf", "Rad", "Schwimmen", "Kraft"].includes(k) || c.WS.weeks.some(w => (w.past || w.cur) && w.sp[k] && w.sp[k].is > 0));
  const sw = (inner) => `<svg class="lg-sw" viewBox="0 0 14 14" aria-hidden="true">${inner}</svg>`;
  return `<div class="legend sgleg"><span>${sw('<rect x="2" y="1" width="10" height="12" rx="1.5" style="fill:var(--seal);stroke:rgba(7,45,89,.4)"/>')}Soll (geplant)</span>${used.map(k => `<span><i style="--c:${sp(k).c}"></i>${sp(k).lab}</span>`).join("")}<span>${sw('<rect x="2" y="1" width="10" height="12" rx="1.5" style="fill:url(#sgH);stroke:rgba(7,45,89,.4)"/>')}Entlastungswoche</span><span>${sw('<path d="M7 2.5l4.5 4.5L7 11.5 2.5 7z" style="fill:var(--navy)"/>')}Test</span><span>${sw('<path d="M3 1.5v11M3 2h7l-1.6 2.6L10 7.2H3" style="fill:var(--gold-s);stroke:var(--gold-s)" stroke-width="1.4" stroke-linejoin="round"/>')}Rennen</span><span>${sw('<rect x="3" y="0" width="8" height="14" rx="2" style="fill:var(--tartan-t)"/>')}aktuelle Woche</span></div>`;
}
/* Wochen-Popover aus der Saison-Grafik */
function weekPop(D) {
  const c = C(), w = Math.max(1, Math.min(c.NW, D.w)), W = c.WS.weeks[w - 1], ph = (B.weeks[w] || {}).phase || "", ent = /\(E\)/.test(ph), ws = B.S.start + 7 * (w - 1);
  let x = `<div class="sh-head pop-h"><div class="tx"><h2 class="sheet-title" tabindex="-1">Woche ${w}${W.cur ? " (jetzt)" : ""}</h2><p>${esc(shortDate(ws))} bis ${esc(shortDate(ws + 6))}, ${esc(ph.replace(/\s*\(E\)\s*$/, ""))}</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  if (ent) x += `<p class="pop-note">Entlastungswoche: weniger Umfang, damit sich die Anpassungen festigen.</p>`;
  x += wsum(W);
  const races = B.S.events.filter(e => e.date >= ws && e.date <= ws + 6), tests = c.Ex.filter(s => s.w === w && s.test === "test" && !s.dropped);
  if (races.length || tests.length) x += `<div class="grp pgrp" style="margin-top:10px">${races.map(e => `<div class="row plain"><span class="badge-ic" style="--c:var(--gold-ink);--t:var(--gold)">${ui("flag")}</span><span class="tx"><span class="t1">${esc(e.name)}</span><span class="t2">Rennen, ${esc(U.wdD(e.date))}</span></span></div>`).join("")}${tests.map(s => `<button class="row" data-act="sess" data-id="${esc(s.id)}"><span class="badge-ic" style="--c:${sp(s.sport).c};--t:${sp(s.sport).t}">${icon(s.sport)}</span><span class="tx"><span class="t1">${esc(s.name.replace(/^★\s*/, ""))}</span><span class="t2">Test, ${esc(U.wdD(s.date))}</span></span>${sdot(sp(s.sport).c, stKind(s, c.t))}</button>`).join("")}</div>`;
  x += `<div class="pop-f"><button class="iconbtn" data-act="swkn" data-v="${w - 1}" ${w <= 1 ? "disabled" : ""} aria-label="Vorwoche">${ui("back")}</button><button class="btn sm" data-act="wkgo" data-v="${w}">Woche ${w} öffnen</button><button class="iconbtn" data-act="swkn" data-v="${w + 1}" ${w >= c.NW ? "disabled" : ""} aria-label="Nächste Woche">${ui("chev")}</button></div>`;
  return x;
}
function vSeason(c) {
  const WS = c.WS;
  const tot = ["Lauf", "Rad", "Schwimmen"].map(k => ({ k, is: WS.weeks.reduce((a, w) => a + ((w.sp[k] || {}).kmIs || 0), 0), so: WS.weeks.reduce((a, w) => a + ((w.sp[k] || {}).km || 0), 0) }));
  let x = `<p class="slead">${seasonLead(c)}</p>`;
  x += `<div class="sec nofold"><h2>Wochen im Überblick</h2></div><div class="season2"><p class="sg-cap">Jede Säule ist eine Woche. Der helle Rahmen zeigt die geplanten Stunden, die Farbe, was du davon trainiert hast. Woche antippen für Details.</p>${seasonSvg(c)}${seasonLegend(c)}</div>`;
  const phs = phaseList(c), wd = (w, e) => shortDate(B.S.start + 7 * (w - 1) + (e ? 6 : 0));
  x += `<div class="sec nofold"><h2>Phasen</h2><span class="muted" style="font-size:.8125rem">antippen für Details</span></div><div class="grp phl">${phs.map(p => { const pw = E.phaseWhy(p.p), open = PH_OPEN.has(String(p.a)), go = p.st === "now" ? c.cw : p.a;
    return `<details class="ph ${p.st}" data-ph="${p.a}"${open ? " open" : ""}><summary><span class="ph-s" aria-hidden="true">${p.st === "past" ? ui("check") : ""}</span><span class="tx"><span class="t1">${esc(p.p || "Phase")}${p.st === "now" ? '<span class="tag now">jetzt</span>' : ""}</span><span class="t2">Woche ${p.a}${p.b > p.a ? " bis " + p.b : ""}, ${esc(wd(p.a))} bis ${esc(wd(p.b, 1))}${p.st === "past" ? ", vorbei" : ""}</span></span>${ui("chev", "chev")}</summary><div class="ph-b">${pw ? `<p>${esc(pw.zweck)}</p>` : ""}<p class="ph-e">${p.e.length ? `Entlastung in Woche ${p.e.join(" und ")}: weniger Umfang, damit sich die Anpassungen festigen.` : "Keine Entlastungswoche in dieser Phase."}</p><button class="btn sm" data-act="wkgo" data-v="${go}">Woche ${go} öffnen</button></div></details>`; }).join("")}</div>`;
  x += `<div class="sec nofold"><h2>Saisonsummen</h2></div><div class="grp">${tot.map(t => `<div class="row plain"><span class="badge-ic" style="--c:${sp(t.k).c};--t:${sp(t.k).t}">${icon(t.k)}</span><span class="tx"><span class="t1">${sp(t.k).lab}</span><span class="t2">Plan ${t.k === "Schwimmen" ? de(t.so, 1) : Math.round(t.so)} km</span></span><span class="rv">${t.k === "Schwimmen" ? de(t.is, 1) : de(t.is, 0)} km</span></div>`).join("")}</div>`;
  return x;
}

/* ---------- Fortschritt ---------- */
let progRange = "saison";
function vProg(c) {
  const t = c.t, F = c.F, TR = c.TR, R = c.R, today = F.find(x => x.d === t) || F[F.length - 1];
  const vo2 = TR.vo2, vd = TR.vdot, tg = E.vdotTargets(B), lastVo2 = vo2.slice(-1)[0], lastVd = vd.slice(-1)[0];
  const tsbTxt = !today ? "" : today.tsb > 5 ? ["frisch", "ok"] : today.tsb > -10 ? ["ausgewogen", "ok"] : today.tsb > -25 ? ["im Aufbau", "warn"] : ["sehr müde", "bad"];
  let x = `<header class="lt"><div><div class="eyebrow">Prognose, Form und Aktivitäten</div><h1>Fortschritt</h1></div><div class="acts">${GAR_BTN(1)}<button class="iconbtn" data-act="imp" aria-label="Aktivitäten importieren">${ui("down")}</button><button class="iconbtn" data-act="vo2" aria-label="VO2max eintragen">${ui("plus")}</button></div></header>`;
  x += pathCard(c) + chartCard(c) + badgeCard(c) + checksCard(c) + raceCard(c, 1) + weekReviewCard(c, c.cw - 1, true);
  x += `<div class="kpis" style="margin-top:0">
    <button class="kpi" data-act="info" data-v="form"><span class="info">${ui("info")}</span><div class="kl">Form</div><div class="kv">${today ? (today.tsb > 0 ? "+" : "") + Math.round(today.tsb) : "–"}</div><div class="ks ${tsbTxt[1] || ""}">${tsbTxt[0] || ""}</div></button>
    <button class="kpi" data-act="info" data-v="form"><span class="info">${ui("info")}</span><div class="kl">Fitness</div><div class="kv">${today ? Math.round(today.ctl) : "–"}</div><div class="ks">Ermüdung ${today ? Math.round(today.atl) : "–"}</div></button>
    <button class="kpi" data-act="vo2"><span class="info">${ui("plus")}</span><div class="kl">VO2max</div><div class="kv">${lastVo2 ? lastVo2.v : "–"}${lastVd ? `<small> · VDOT ${de(lastVd.v)}</small>` : ""}</div><div class="ks">Ziel Linz VDOT ${de(tg.m)}</div></button>
    <button class="kpi" data-act="info" data-v="prog"><span class="info">${ui("info")}</span><div class="kl">Prognose Marathon</div><div class="kv">${U.hms(R.prog).replace(/:\d\d$/, "")}</div><div class="ks ${R.prog <= B.S.tgtM ? "ok" : R.prog - B.S.tgtM < 6 / 1440 ? "warn" : ""}">Ziel ${U.hms(B.S.tgtM).replace(/:\d\d$/, "")}</div></button></div>`;
  x += perfBlock(c);
  x += `<div class="sec"><h2>Form und VO2max</h2></div>`;
  // Formkurve
  const x0 = progRange === "8w" ? t - 42 : B.S.start, x1 = progRange === "8w" ? t + 14 : F[F.length - 1].d;
  const FF = F.filter(p => p.d >= x0 && p.d <= x1), past = FF.filter(p => !p.proj), proj = FF.filter(p => p.proj || p.d === t - 1);
  const marks = B.S.events.map(e => ({ x: e.date, l: String(e.name).replace(/Olympische Distanz.*|OD .*/, "OD").replace("Allgäu Triathlon Classic", "Allgäu").replace("Marathon ", "").replace("HM Frankfurt", "HM"), c: "var(--gold-s)" }));
  x += `<div class="card"><div class="ch"><div><h3>Formkurve</h3><p>Fitness, Ermüdung und Form. Gestrichelt: Plan bis zum Rennen.</p></div><button class="iconbtn" style="width:36px;height:36px" data-act="info" data-v="form" aria-label="Erklärung Formkurve">${ui("info")}</button></div>
   <div class="seg rangesel" role="group" aria-label="Zeitraum"><button data-act="range" data-v="8w" aria-pressed="${progRange === "8w"}">8 Wochen</button><button data-act="range" data-v="saison" aria-pressed="${progRange === "saison"}">Saison</button></div>
   ${chart({ x0, x1, h: 230, label: "Formkurve", zero: 0, today: t, marks, xTicks: progRange === "8w" ? [] : monthTicks(x0, x1, 2), yFmt: v => Math.round(v),
     series: [{ pts: past.map(p => ({ x: p.d, y: p.tsb })), c: "var(--gold-s)", area: true, areaBase: 0, areaO: .18, sw: 2 }, { pts: proj.map(p => ({ x: p.d, y: p.tsb })), c: "var(--gold-s)", dash: true, sw: 2 },
       { pts: past.map(p => ({ x: p.d, y: p.atl })), c: "var(--tartan)", sw: 2 }, { pts: proj.map(p => ({ x: p.d, y: p.atl })), c: "var(--tartan)", dash: true, sw: 1.6 },
       { pts: past.map(p => ({ x: p.d, y: p.ctl })), c: "var(--lane)", sw: 3 }, { pts: proj.map(p => ({ x: p.d, y: p.ctl })), c: "var(--lane)", dash: true, sw: 2.4 }] })}
   <div class="lg"><span><i style="--c:var(--lane)"></i>Fitness</span><span><i style="--c:var(--tartan)"></i>Ermüdung</span><span><i style="--c:var(--gold-s)"></i>Form</span><span><i class="d" style="--c:var(--mute)"></i>Plan</span></div>
   ${(() => { const L = F.find(p => p.d === (B.S.events.find(e => /Linz/.test(e.name)) || {}).date), A = F.find(p => p.d === (B.S.events.find(e => /Allgäu/.test(e.name)) || {}).date); return L || A ? `<p class="note">Am Renntag laut Plan: ${L ? "Linz Form " + (L.tsb > 0 ? "+" : "") + Math.round(L.tsb) : ""}${L && A ? ", " : ""}${A ? "Allgäu Form " + (A.tsb > 0 ? "+" : "") + Math.round(A.tsb) : ""}. Positiv heißt frisch.</p>` : ""; })()}</div>`;
  // VO2max
  const vx0 = B.S.start, vx1 = Math.max(...B.S.events.map(e => e.date));
  const allV = vo2.map(p => p.v).concat(vd.map(p => p.v), [tg.m, tg.hm]);
  x += `<div class="card"><div class="ch"><div><h3>VO2max</h3><p>Garmin-Wert und VDOT aus Tests. Band: nötig für Linz 3:09.</p></div><button class="iconbtn" style="width:36px;height:36px" data-act="info" data-v="vo2" aria-label="Erklärung VO2max">${ui("info")}</button></div>
   ${vo2.length || vd.length ? chart({ x0: vx0, x1: vx1, h: 200, label: "VO2max-Verlauf", today: t, xTicks: monthTicks(vx0, vx1, 2), yMin: Math.floor(Math.min(...allV) - 2), yMax: Math.ceil(Math.max(...allV) + 2), band: { y0: Math.min(tg.m, tg.hm), y1: Math.max(tg.m, tg.hm) + .01, label: "Ziel Linz" }, marks: marks.filter(m => /Linz|HM/.test(m.l)),
     series: [{ pts: vo2.map(p => ({ x: p.date, y: p.v, tip: "Garmin " + p.v + " am " + U.wdD(p.date) })), c: "var(--lane)", dots: true, shape: "dia", sw: 2 }, { pts: vd.map(p => ({ x: p.date, y: p.v, tip: p.name + ": VDOT " + de(p.v) })), c: "var(--tartan)", dots: true, fill: true, noLine: vd.length < 2, sw: 2 }] })
     + `<div class="lg"><span><i class="q" style="--c:var(--lane)"></i>Garmin</span><span><i class="p" style="--c:var(--tartan)"></i>VDOT aus Test</span><span><i class="b" style="--c:var(--gold)"></i>Zielband</span></div>`
     : `<div class="empty" style="padding:18px 0 8px"><b>Noch keine Werte</b>Trag deinen Garmin-VO2max ein. VDOT kommt automatisch mit dem ersten 10-km-Test.</div>`}
   <button class="btn sm lane" data-act="vo2" style="margin-top:10px">${ui("plus")}VO2max eintragen</button></div>`;
  // Tests
  const G = testGroups();
  x += `<div class="sec"><h2>Tests</h2><span class="muted" style="font-size:.8125rem">${G.filter(testDone).length} von ${G.length} erledigt</span></div><div class="grp">${G.map(T => { const ed = testDate(T), dn = testDone(T) && (!T.pair || testDone(T.pair)), miss = !dn && ed < t, nxt = !dn && !miss && G.filter(g => !testDone(g) && testDate(g) >= t).sort((a, b) => testDate(a) - testDate(b))[0] === T, race = U.RACE_TYPES.includes(T.typ);
    const eff = T.pair ? testEffect(T.pair) : testEffect(T);
    return `<button class="row" data-act="test" data-k="${esc(T.key)}"><span class="test"><span class="st ${dn ? "done" : nxt ? "next" : miss ? "miss" : ""}">${ui(dn ? "check" : race ? "flag" : "star")}</span></span><span class="tx"><span class="t1">${esc(T.pair ? T.name.replace(/:? ?400 m/, "") : T.name)}</span><span class="t2">${esc(dn ? eff || "erledigt" : miss ? "Ergebnis nachtragen" : U.wdD(ed) + " · in " + (ed - t) + " Tagen")}</span></span>${ui("chev", "chev")}</button>`; }).join("")}</div>`;
  // Verläufe
  x += `<div class="sec"><h2>Verläufe</h2></div>`;
  x += trendCards(c);
  return x;
}
function trendCards(c) {
  const TR = c.TR, t = c.t, x0 = B.S.start, x1 = Math.max(...B.S.events.map(e => e.date)), xt = monthTicks(x0, x1, 2);
  const wk = w => B.S.start + 7 * (w - 1) + 3;
  let x = "";
  // Laufumfang
  x += `<div class="card"><div class="ch"><div><h3>Laufumfang pro Woche</h3><p>hell geplant, kräftig gelaufen</p></div></div>${chart({ x0: x0, x1: x1, h: 170, label: "Laufumfang", today: t, xTicks: xt, yMin: 0, yFmt: v => Math.round(v), bars: TR.run.flatMap(r => [{ x: wk(r.w), y: r.so, c: "var(--run-t)", wf: 4.2, tip: "W" + r.w + " Plan " + de(r.so) + " km" }, { x: wk(r.w), y: r.is, c: "var(--run)", wf: 2.2, tip: "W" + r.w + " gelaufen " + de(r.is) + " km" }]) })}</div>`;
  // Long Run + Koppel
  x += `<div class="card"><div class="ch"><div><h3>Long Run und Koppel</h3><p>längster Lauf je Woche (km), Linie bei HM-Distanz</p></div></div>${chart({ x0: x0, x1: x1, h: 170, label: "Long-Run-Progression", today: t, xTicks: xt, yMin: 0, yMax: 44, yTicks: [0, 10, 20, 30, 40], band: { y0: 21.0, y1: 21.2, c: "var(--tartan)", label: "HM", tc: "var(--tartan)" }, bars: TR.lr.flatMap(r => [{ x: wk(r.w), y: r.so, c: "var(--run-t)", wf: 4.2, tip: "W" + r.w + " Plan " + de(r.so) + " km" }, { x: wk(r.w), y: r.is, c: "var(--run)", wf: 2.2, tip: "W" + r.w + " gelaufen " + de(r.is) + " km" }]) })}
   <div class="lg"><span><i class="b" style="--c:var(--run-t)"></i>Plan</span><span><i class="b" style="--c:var(--run)"></i>gelaufen</span></div></div>`;
  // Aerob-Check
  x += `<div class="card"><div class="ch"><div><h3>Aerob-Check</h3><p>Pace bei HF ${esc(B.S.ac)}. Höher ist schneller.</p></div>${TR.ac.length ? `<span class="big">${U.mss(TR.ac[TR.ac.length - 1].v)}<small> /km</small></span>` : ""}</div>${TR.ac.length ? chart({ x0: x0, x1: Math.max(t, ...TR.ac.map(a => a.date)) + 14, h: 150, label: "Aerob-Check", invert: true, yFmt: v => U.mss(v), xTicks: monthTicks(x0, Math.max(t, ...TR.ac.map(a => a.date)) + 14), series: [{ pts: TR.ac.map(a => ({ x: a.date, y: a.v, tip: a.name + " " + U.mss(a.v) })), c: "var(--run)", dots: true }] }) : `<div class="empty" style="padding:12px 0">Kommt mit dem ersten Aerob-Check.</div>`}</div>`;
  // Ruhepuls + Gefühl
  if (TR.chk.length) x += `<div class="card"><div class="ch"><div><h3>Ruhepuls, Gefühl, Schmerz</h3><p>aus dem Sonntags-Check-in</p></div></div>${chart({ x0: x0, x1: Math.max(t, TR.chk[TR.chk.length - 1].date) + 7, h: 150, label: "Ruhepuls", yFmt: v => Math.round(v), xTicks: monthTicks(x0, Math.max(t, TR.chk[TR.chk.length - 1].date) + 7), band: { y0: (B.S.rest || 60) - 3, y1: (B.S.rest || 60) + 4, c: "var(--ok-t)", label: "normal", tc: "var(--ok)" }, series: [{ pts: TR.chk.filter(k => num(k.puls)).map(k => ({ x: k.date, y: k.puls, tip: "W" + k.w + " " + k.puls + " bpm" })), c: "var(--tartan)", dots: true }] })}
   <div class="chipline" style="margin-top:8px"><div class="chips" style="flex-wrap:nowrap">${TR.chk.slice(-8).map(k => `<span class="chip" style="min-height:34px;font-size:.8125rem">W${k.w} · ${num(k.feel) ? ["", "Platt", "Müde", "Okay", "Gut", "Top"][k.feel] : "–"} · ${num(k.pain) ? "Schmerz " + k.pain : "–"}</span>`).join("")}</div></div></div>`;
  // Prognose
  if (TR.prog.length) x += `<div class="card"><div class="ch"><div><h3>Marathon-Prognose</h3><p>aus Tests und Rennen (Riegel)</p></div></div>${chart({ x0: x0, x1: x1, h: 150, label: "Prognose", yFmt: v => U.hms(v).replace(/:\d\d$/, ""), xTicks: xt, band: { y0: B.S.tgtM - .5 / 1440, y1: B.S.tgtM + .5 / 1440, c: "var(--gold)", label: "Ziel" }, invert: true, series: [{ pts: TR.prog.map(p => ({ x: p.date, y: p.v, tip: p.name + " " + U.hms(p.v) })), c: "var(--ink)", dots: true }] })}</div>`;
  // CSS + Berg
  if (TR.css.length || TR.berg.length) x += `<div class="card"><div class="ch"><div><h3>Schwimmen und Rad</h3><p>CSS und Bergtest</p></div></div><div class="grp" style="background:transparent">${TR.css.map(p => `<div class="row plain" style="background:transparent;padding:8px 0"><span class="badge-ic" style="--c:var(--swim);--t:var(--swim-t)">${icon("Schwimmen")}</span><span class="tx"><span class="t1">CSS ${esc(U.mss(p.v))} /100 m</span><span class="t2">${esc(U.wdD(p.date))}</span></span></div>`).join("")}${TR.berg.map(p => `<div class="row plain" style="background:transparent;padding:8px 0"><span class="badge-ic" style="--c:var(--bike);--t:var(--bike-t)">${icon("Rad")}</span><span class="tx"><span class="t1">${esc(p.name)} ${esc(U.hms(p.v))}</span><span class="t2">${esc(U.wdD(p.date))}${num(p.hf) ? " · Ø " + p.hf + " bpm" : ""}</span></span></div>`).join("")}</div></div>`;
  return x;
}


/* ---------- v3.0 Daten ---------- */
let dataSport = "alle", dataDays = 28;
const SPORT_F = [["alle", "Alle"], ["Lauf", "Lauf"], ["Rad", "Rad"], ["Schwimmen", "Schwimmen"], ["Kraft", "Kraft"]];
function vData(c) {
  const t = c.t, L = E.activityList(B, ST, t, c.Ex, dataDays).filter(a => dataSport === "alle" || a.sport === dataSport), ID = E.intensityDist(B, ST, t, c.Ex, 28), BE = E.bests(B, ST, t, c.Ex);
  const last = get("set:lastimp");
  let x = `<header class="lt"><div><div class="eyebrow">Garmin, Strava oder von Hand</div><h1>Daten</h1></div><div class="acts"><button class="iconbtn" data-act="imp" aria-label="Aktivitäten importieren">${ui("down")}</button></div></header>`;
  x += `<div class="grp"><button class="row" data-act="imp"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("down")}</span><span class="tx"><span class="t1">Aktivitäten importieren</span><span class="t2">${last ? "Zuletzt " + new Date(last.at).toLocaleDateString("de-DE") + ": " + last.n + " aus " + (last.src === "strava" ? "Strava" : "Garmin") : "Garmin Activities.csv oder Strava activities.csv"}</span></span>${ui("chev", "chev")}</button><button class="row" data-act="free"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("plus")}</span><span class="tx"><span class="t1">Von Hand eintragen</span><span class="t2">Freies Training, geplante Einheiten unter Plan</span></span>${ui("chev", "chev")}</button></div>`;
  // Diese Woche je Sport
  const W = c.WS.weeks[c.cw - 1] || { sp: {} };
  x += `<div class="sec"><h2>Diese Woche</h2><span class="muted" style="font-size:.8125rem">Ist / Soll</span></div><div class="kpis" style="margin-top:0">${["Lauf", "Rad", "Schwimmen", "Kraft"].map(k => { const z = W.sp[k] || { so: 0, is: 0, km: 0, kmIs: 0 }; const cp = E.compliance(z.so, z.is, z.so || z.is ? "✓" : "");
    return `<div class="kpi"><div class="kl"><span style="color:${sp(k).c}">${icon(k)}</span>${sp(k).lab}</div><div class="kv">${de(z.is / 60)}<small> / ${de(z.so / 60)} h</small></div><div class="ks"><span class="cdot ${cp.cls}"></span>${k === "Kraft" ? (z.so ? Math.round(z.is / z.so * 100) + " % erfüllt" : "") : de(z.kmIs) + " / " + de(z.km) + " km"}</div></div>`; }).join("")}</div>`;
  // Intensität
  const pc = ID.pct.map(v => Math.round(v * 100));
  x += `<div class="card"><div class="ch"><div><h3>Intensität, letzte 4 Wochen</h3><p>Zeit in Zonen nach Puls, sonst RPE oder Einheitentyp</p></div><button class="iconbtn" style="width:36px;height:36px" data-act="info" data-v="intens" aria-label="Erklärung Intensität">${ui("info")}</button></div>
    ${ID.tot ? `<div class="zbar" role="img" aria-label="Locker ${pc[0]} Prozent, mittel ${pc[1]} Prozent, hart ${pc[2]} Prozent"><i style="flex:${ID.min[0] || .001};--c:var(--ok)"></i><i style="flex:${ID.min[1] || .001};--c:var(--warn)"></i><i style="flex:${ID.min[2] || .001};--c:var(--bad)"></i></div>
    <div class="lg"><span><i style="--c:var(--ok)"></i>Locker ${pc[0]} % · ${durStr(ID.min[0])}</span><span><i style="--c:var(--warn)"></i>Mittel ${pc[1]} %</span><span><i style="--c:var(--bad)"></i>Hart ${pc[2]} %</span></div>
    <p class="note">${pc[1] > 25 ? "Viel mittlere Intensität: lockere Einheiten eher langsamer laufen, damit die harten wirklich hart sein können." : pc[0] >= 70 ? "Überwiegend locker, so trägt der Umfang die Fitness." : "Mehr Zeit im lockeren Bereich gibt dir Umfang ohne viel Ermüdung."}</p>` : `<div class="empty" style="padding:12px 0">Noch keine erledigten Einheiten in den letzten 4 Wochen.</div>`}</div>`;
  // Bestwerte
  const bw = [BE.longRun && ["Längster Lauf", de(BE.longRun.km) + " km", U.wdD(BE.longRun.date)], BE.fast && ["Schnellster Lauf ab 10 km", U.mss(BE.fast.min / BE.fast.km / 1440) + " /km", de(BE.fast.km) + " km · " + U.wdD(BE.fast.date)], BE.longRide && BE.longRide.min && ["Längste Radfahrt", durStr(BE.longRide.min), (BE.longRide.km ? de(BE.longRide.km) + " km · " : "") + U.wdD(BE.longRide.date)], BE.topKm && ["Laufwoche mit meisten km", de(BE.topKm.km) + " km", "Woche " + BE.topKm.w], BE.topH && ["Trainingsreichste Woche", de(BE.topH.h) + " h", "Woche " + BE.topH.w]].filter(Boolean);
  if (bw.length) x += `<div class="sec"><h2>Bestwerte</h2></div><div class="grp">${bw.map(([a, b, d]) => `<div class="row plain"><span class="badge-ic" style="--c:var(--gold-s);--t:var(--gold)">${ui("star")}</span><span class="tx"><span class="t1">${esc(a)}</span><span class="t2">${esc(d)}</span></span><span class="rv">${esc(b)}</span></div>`).join("")}</div>`;
  // Liste
  x += `<div class="sec"><h2>Aktivitäten</h2><span class="muted" style="font-size:.8125rem">${dataDays === 28 ? "letzte 4 Wochen" : dataDays === 90 ? "letzte 3 Monate" : "ganze Saison"}</span></div><div class="seg dseg" role="group" aria-label="Zeitraum">${[[28, "4 Wochen"], [90, "3 Monate"], [400, "Saison"]].map(([d, l]) => `<button data-act="ddays" data-v="${d}" aria-pressed="${dataDays === d}">${l}</button>`).join("")}</div>`;
  x += `<div class="chipline" style="margin-bottom:8px"><div class="chips" style="flex-wrap:nowrap">${SPORT_F.map(([k, l]) => `<button class="chip" data-act="dsport" data-v="${k}" aria-pressed="${dataSport === k}">${k === "alle" ? "" : icon(k)}${l}</button>`).join("")}</div></div>`;
  x += L.length ? `<div class="grp">${L.slice(0, 120).map(a => { const S = sp(a.sport); return `<button class="row" data-act="sess" data-id="${esc(a.id)}"><span class="badge-ic" style="--c:${S.c};--t:${S.t}">${icon(a.sport)}</span><span class="tx"><span class="t1">${esc(String(a.name).replace(/^★\s*/, ""))}</span><span class="t2">${esc(U.wdD(a.date))}${a.dur ? " · " + durStr(a.dur) : ""}${a.dist ? " · " + kmStr(a.dist, a.sport) : ""}${num(a.hf) ? " · Ø " + a.hf + " bpm" : ""}${a.dist && a.dur && a.sport === "Lauf" ? " · " + E.paceStr(a.dur, a.dist) + " /km" : ""}${a.src && a.src !== "manuell" ? " · " + (a.src === "strava" ? "Strava" : "Garmin") : ""}</span></span><span class="comp ${a.comp.cls}">${esc(a.comp.lab || "")}</span></button>`; }).join("")}</div>
    <p class="note">Farben wie bei TrainingPeaks: grün 80–120 % der geplanten Dauer, gelb 50–79 oder 121–150 %, orange darunter oder darüber, rot verpasst, grau ungeplant.</p>` : `<div class="grp"><div class="empty"><b>Keine Aktivitäten</b>Importiere deine Garmin- oder Strava-Daten oder trag Einheiten ein.</div></div>`;
  return x;
}
function impSheet(D) {
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("down")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Aktivitäten importieren</h2><p>Die Datei wird nur auf dem Gerät gelesen.</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  if (D.res) { const r = D.res;
    x += `<div class="banner info">${ui("check")}<div class="tx"><b>${r.acts} Aktivitäten gelesen</b> (${r.src === "strava" ? "Strava" : "Garmin"}). ${r.logs} geplanten Einheiten zugeordnet, ${r.free} als freies Training, ${r.skip} schon vorhanden${r.bad ? ", " + r.bad + " Zeilen ohne Datum oder Dauer übersprungen" : ""}.</div></div>`;
    if (r.lines.length) x += `<div class="grp">${r.lines.slice(0, 30).map(l => `<div class="row plain"><span class="badge-ic" style="--c:${sp(l.sport).c};--t:${sp(l.sport).t}">${icon(l.sport)}</span><span class="tx"><span class="t1">${esc(l.t1)}</span><span class="t2">${esc(l.t2)}</span></span></div>`).join("")}</div>`;
    x += `<div class="sh-foot"><button class="btn" data-act="impundo">${ui("undo")}Rückgängig</button><button class="btn ink" data-act="close">Fertig</button></div>`; return x; }
  x += `<div class="grp"><div class="row plain"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">1</span><span class="tx"><span class="t1">Garmin Connect (Browser)</span><span class="t2" style="white-space:normal">connect.garmin.com, Aktivitäten, Alle Aktivitäten. Bis zum gewünschten Zeitraum scrollen, dann oben rechts <b>Export CSV</b>. Datei: Activities.csv</span></span></div>
    <div class="row plain"><span class="badge-ic" style="--c:var(--bike);--t:var(--bike-t)">2</span><span class="tx"><span class="t1">Strava</span><span class="t2" style="white-space:normal">strava.com, Einstellungen, Mein Konto, <b>Konto herunterladen</b>. Aus der ZIP-Datei die activities.csv wählen.</span></span></div></div>`;
  x += `<p class="note">Zuordnung: gleicher Tag und gleiche Sportart, die Einheit mit der passendsten Dauer. Ist-Werte (Dauer, Distanz, Puls, Höhenmeter) werden übernommen, deine RPE und Notizen bleiben. Was nicht passt, wird freies Training. Doppelt importierte Aktivitäten erkennt die App.</p>`;
  x += `<div class="sh-foot"><button class="btn" data-act="close">Abbrechen</button><button class="btn pri" data-act="impfile">${ui("file")}CSV wählen</button></div>`;
  return x;
}
function doImport(text, S) {
  const p = E.parseActivities(text), t = today(), m = E.matchActivities(B, ST, p.acts.filter(a => a.date <= t), t), keys = [];
  m.logs.forEach(l => { const k = "log:" + l.id; keys.push([k, ST[k]]); put(k, l.log); });
  m.free.forEach(f => { const k = "free:" + newId(); keys.push([k, undefined]); put(k, f); });
  put("set:lastimp", { at: Date.now(), n: m.logs.length + m.free.length, src: p.src });
  const lines = m.logs.map(l => ({ sport: l.s.sport, t1: l.s.name.replace(/^★\s*/, "") + " " + l.log.st, t2: U.wdD(l.s.date) + " · " + durStr(l.log.dur) + (l.log.dist ? " · " + kmStr(l.log.dist, l.s.sport) : "") + (l.log.hf ? " · Ø " + l.log.hf : "") })).concat(m.free.map(f => ({ sport: f.sport, t1: (f.name || sp(f.sport).lab) + " (frei)", t2: U.wdD(f.date) + " · " + durStr(f.dur) + (f.dist ? " · " + kmStr(f.dist, f.sport) : "") })));
  S.data.undo = keys; S.data.res = { acts: p.acts.length, src: p.src, logs: m.logs.length, free: m.free.length, skip: m.skip, bad: p.bad.length, lines };
  rerenderSheet(S); render();
}

/* v3.2: Leistung je Disziplin */
let discSel = "hm";
function discBlock(c) {
  const t = c.t, D = E.disciplines(B, ST, t, c.Ex), d = D.find(x => x.key === discSel) || D[0];
  const ic = { hm: "Lauf", m: "Lauf", swim: "Schwimmen", bike: "Rad", od: "Triathlon", md: "Triathlon" };
  let x = `<div class="sec"><h2>Disziplinen</h2><span class="muted" style="font-size:.8125rem">Ziel und Stand</span></div>`;
  x += `<div class="dgrid">${D.map(q => { const ok = q.gap != null && q.gap <= 0, cl = q.gap == null ? "" : ok ? "ok" : q.unit === "pace100" ? (q.gap * 86400 <= 10 ? "warn" : "bad") : (q.gap * 1440 <= 5 ? "warn" : "bad");
      return `<button class="dcard${q.key === d.key ? " on" : ""}" data-act="disc" data-v="${q.key}" aria-pressed="${q.key === d.key}"><span class="dc-h"><span style="color:${sp(ic[q.key]).c}">${icon(ic[q.key])}</span>${esc(q.lab)}</span><b>${esc(q.curTxt)}</b><span class="dc-g ${cl}">Ziel ${esc(q.goalTxt || (q.goal ? U.hms(q.goal) : "–"))}</span></button>`; }).join("")}</div>`;
  const days = d.date ? d.date - t : null;
  x += `<div class="card"><div class="ch"><div><h3>${esc(d.lab)}${d.race ? " · " + esc(d.race) : ""}</h3><p>${days != null && days >= 0 ? "noch " + days + " Tage · " : ""}${esc(d.basis)}</p></div></div>`;
  x += `<div class="pspan"><div><span class="kl">Aktuell</span><b>${esc(d.curTxt)}</b>${d.pace ? `<span class="kl">${esc(d.pace)}</span>` : ""}</div><div style="text-align:right"><span class="kl">Ziel</span><b style="color:var(--gold-ink)">${esc(d.goalTxt || (d.goal ? U.hms(d.goal) : "–"))}</b>${d.goalPace ? `<span class="kl">${esc(d.goalPace)}</span>` : ""}</div></div>`;
  if (d.gap != null) x += `<p class="note">${d.gap <= 0 ? "Auf Zielkurs." : d.unit === "pace100" ? "Abstand: " + Math.round(d.gap * 86400) + " s pro 100 m." : d.key === "bike" ? "Bergtest " + (d.gap < 0 ? Math.round(-d.gap * 86400) + " s schneller" : Math.round(d.gap * 86400) + " s langsamer") + " als beim ersten Test." : "Abstand: " + Math.round(d.gap * 1440) + " min."}</p>`;
  if (d.hist && d.hist.length >= 1) { const x0 = Math.min(B.S.start, d.hist[0].date), x1 = Math.max(d.date || t, t) + 7;
    x += chart({ x0, x1, h: 150, label: d.lab + " Verlauf", invert: true, today: t, yFmt: v => d.unit === "pace100" ? U.mss(v) : U.hms(v).replace(/:\d\d$/, ""), xTicks: monthTicks(x0, x1, 2), band: d.goal ? { y0: d.goal - (d.unit === "pace100" ? 1 / 86400 : .5 / 1440), y1: d.goal + (d.unit === "pace100" ? 1 / 86400 : .5 / 1440), c: "var(--gold)", label: "Ziel" } : null,
      series: [{ pts: d.hist.map(p0 => ({ x: p0.date, y: p0.v, tip: p0.name + ": " + (d.unit === "pace100" ? U.mss(p0.v) + " /100 m" : U.hms(p0.v)) })), c: "var(--ink)", dots: true, noLine: d.hist.length < 2 }] }); }
  else x += `<div class="empty" style="padding:10px 0">Verlauf erscheint mit dem ersten Test.</div>`;
  x += `<div class="grp" style="background:transparent;margin-top:8px"><div class="row plain" style="background:transparent;padding:6px 0"><span class="badge-ic" style="--c:var(--gold-s);--t:var(--gold)">${ui("flag")}</span><span class="tx"><span class="t1">Was es braucht</span><span class="t2" style="white-space:normal">${esc(d.need)}</span></span></div>${d.extra ? `<div class="row plain" style="background:transparent;padding:6px 0"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("info")}</span><span class="tx"><span class="t2" style="white-space:normal">${esc(d.extra)}</span></span></div>` : ""}</div></div>`;
  return x;
}
/* ---------- v3.0 Leistung: Prognose, Gates, Verbesserungen ---------- */
function perfBlock(c) {
  const t = c.t, P = E.progSpan(c.R, B.S), G = E.gates(B, ST, t, c.Ex), I = E.improvements(B, ST, t, c.Ex), ramp = E.rampRate(c.F, t), linz = B.S.events.find(e => /Linz/.test(e.name));
  const hm = v => U.hms(v).replace(/:\d\d$/, ""), ok = P.opt <= P.tg;
  let x = discBlock(c);
  x += `<div class="sec"><h2>Checkpoints</h2><span class="muted" style="font-size:.8125rem">${G.filter(g => g.st === "ok").length} von ${G.length} erfüllt</span></div><div class="grp">${G.map(g => `<div class="row plain"><span class="gst ${g.st}">${ui(g.st === "ok" ? "check" : g.st === "miss" ? "x" : g.st === "open" ? "info" : "flag")}</span><span class="tx"><span class="t1">${esc(g.name)}</span><span class="t2" style="white-space:normal">${esc(U.wdD(g.date))} · Ziel ${esc(g.target)}${g.val ? " · Ergebnis " + esc(g.val) : g.st === "open" ? " · Ergebnis fehlt" : ""}. ${esc(g.how)}</span></span></div>`).join("")}</div>`;
  x += `<div class="sec"><h2>Verbesserungen</h2><span class="muted" style="font-size:.8125rem">seit Planstart</span></div>`;
  x += I.length ? `<div class="grp">${I.map(i => `<div class="row plain"><span class="tx"><span class="t1">${esc(i.lab)}</span><span class="t2" style="white-space:normal">${esc(i.from)} → ${esc(i.to)}${i.info ? " · " + esc(i.info) : ""}</span></span><span class="delta ${i.good == null ? "" : i.good ? "up" : "down"}">${esc(i.txt)}</span></div>`).join("")}</div>` : `<div class="grp"><div class="empty"><b>Noch zu früh</b>Verbesserungen erscheinen nach den ersten Tests, Check-ins und Wochen mit Pulsdaten.</div></div>`;
  if (num(ramp) && ramp > 8) x += `<div class="banner" style="margin-top:12px">${ui("info")}<div class="tx">Fitness steigt um ${Math.round(ramp)} Punkte pro Woche. Über etwa 8 wird es steil: Schlaf und lockere Tage ernst nehmen. Das ist eine Praxisregel, keine Studie.</div></div>`;
  return x;
}

/* ---------- v3.0 KI-Coach (optional, Standard aus) ---------- */
function aiSheet(D) {
  /* 4.4 F: Ein klarer Ablauf statt Weg A/B und Ein-Schalter. Daten verlassen das Gerät nur, wenn du kopierst oder (mit eigenem Schlüssel) fragst. */
  const c = C(), pk = D.pk || (D.pk = E.aiPacket(B, ST, c.t, c.Ex)), key = PREF.aikey || "", model = PREF.aimodel || "claude-opus-5-5"; if (!D.f) D.f = {};
  const st = (n, done, on, t1, t2, body) => `<li class="ais${done ? " done" : ""}${on ? " on" : ""}"><span class="ais-n">${done ? ui("check") : n}</span><div class="ais-b"><b>${t1}</b>${t2 ? `<p>${t2}</p>` : ""}${body || ""}</div></li>`;
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("sync")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Zweite Meinung von Claude</h2><p>Optional. Ergänzt die festen Regeln der App.</p></div>${infoBtn("ai")}<button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<p class="ai-lead">Claude prüft deine letzten 21 Tage und die nächsten 14 Tage und schlägt Änderungen vor. Sinnvoll, wenn mehreres zusammenkommt, etwa Reise, Infekt und verpasste Einheiten. Nichts ändert sich ohne deine Bestätigung.</p>`;
  const r = D.res, okRes = r && r.ok;
  let res = "";
  if (r && !r.ok) res = `<div class="banner err">${ui("info")}<div class="tx">${esc(r.errs.join(" "))} Bitte die ganze Antwort von Claude einfügen.</div></div>`;
  else if (okRes) res = `<article class="prop info"><span class="k">${ui("sync")}Vorschau</span><h3>${esc(r.p.title.replace(/^KI-Coach: /, ""))}</h3><p>${esc(r.p.why)}</p>${r.p.lines.length ? `<ul>${r.p.lines.map(l => `<li>${ui(/entfällt/.test(l) ? "x" : / neu$/.test(l) ? "plus" : "move")}<span>${esc(l)}</span></li>`).join("")}</ul>` : ""}${r.errs.length ? `<p class="note">Von der App gekürzt: ${esc(r.errs.join(" · "))}</p>` : ""}<div class="acts">${r.p.ops.length ? `<button class="btn lane sm" data-act="aiaccept">${ui("check")}Übernehmen</button>` : ""}<button class="btn ghost sm" data-act="aireset">Verwerfen</button></div></article>`;
  x += `<ol class="aisteps">`;
  x += st(1, D.copied, !D.copied, "Anfrage kopieren", `${pk.plan_14_tage.length} geplante Einheiten und ${pk.ist_21_tage.length + pk.frei_21_tage.length} Einträge. Ohne Krankheitsart, Orte, Gewicht, Notizen.`, `<button class="btn lane sm" data-act="aicopy">${ui("file")}${D.copied ? "Nochmal kopieren" : "Kopieren"}</button>`);
  x += st(2, D.copied && !!(D.f && D.f.airesp), D.copied && !(D.f && D.f.airesp), "In Claude einfügen und senden", "Neuen Chat öffnen, einfügen, abschicken. Claude antwortet mit einem Datenblock.", `<a class="btn sm" href="https://claude.ai/new" target="_blank" rel="noopener" data-act="aiopen">${ui("up")}Claude öffnen</a>`);
  x += st(3, okRes, D.copied && !okRes, "Antwort hier einfügen", "Die ganze Antwort kopieren und hier einfügen.", `<textarea class="inp" data-in="airesp" rows="3" placeholder="Antwort von Claude">${esc(D.f && D.f.airesp || "")}</textarea><button class="btn sm" data-act="aicheck">${ui("check")}Vorschau zeigen</button>`);
  x += st(4, false, okRes, "Vorschau prüfen und übernehmen", okRes ? "" : "Die App prüft die Antwort gegen ihre Leitplanken, du entscheidest.", res);
  x += `</ol>`;
  if (r && !r.ok) x += res;
  x += `<details class="sx-sec ai-pro"><summary><span class="sx-si">${ui("shield")}</span><span class="tx"><span class="t1">Mit eigenem API-Schlüssel</span><span class="t2">Für Fortgeschrittene, ohne Kopieren</span></span>${ui("chev", "chev")}</summary><div class="sx-sb"><p class="note">Statt Kopieren und Einfügen fragt die App Claude direkt über deinen Anthropic-Schlüssel. Kostet wenige Cent pro Anfrage.</p>${key ? `<div class="grp"><button class="row" data-act="aiask" ${D.busy ? "disabled" : ""}><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("sync")}</span><span class="tx"><span class="t1">${D.busy ? "Frage Claude …" : "Jetzt direkt fragen"}</span><span class="t2">${esc(model)} · Schlüssel …${esc(key.slice(-4))}</span></span></button></div>` : ""}<div class="grp" style="margin-top:8px"><button class="row" data-act="aikey"><span class="badge-ic" style="--c:var(--mute);--t:var(--fill)">${ui("shield")}</span><span class="tx"><span class="t1">${key ? "Schlüssel ändern" : "Schlüssel hinterlegen"}</span><span class="t2">Bleibt auf diesem Gerät</span></span>${ui("chev", "chev")}</button></div></div></details>`;
  return x;
}
function aiKeySheet(D) {
  const F = D.f || (D.f = { aikey: PREF.aikey || "", aimodel: PREF.aimodel || "claude-opus-5-5" });
  return `<div class="sh-head"><div class="tx"><h2 class="sheet-title" tabindex="-1">API-Schlüssel</h2><p>Optional für die zweite Meinung. Bleibt auf diesem Gerät.</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>
   <div class="field"><div class="fl"><span>Anthropic API-Schlüssel</span><b>console.anthropic.com</b></div><input class="inp" type="password" data-in="aikey" value="${esc(F.aikey)}" placeholder="sk-ant-..." autocomplete="off"></div>
   <div class="field"><div class="fl"><span>Modell</span></div><input class="inp" data-in="aimodel" value="${esc(F.aimodel)}" autocomplete="off"></div>
   <p class="note" style="display:flex;gap:8px">${ui("shield")}<span>Der Schlüssel wird nicht in die Sync-Datei, Sicherung oder Exporte geschrieben. Auf jedem Gerät einzeln eintragen. Nutze einen privaten Schlüssel mit Ausgabenlimit, keinen Firmenzugang.</span></p>
   <div class="sh-foot"><button class="btn" data-act="aikeydel">Löschen</button><button class="btn pri" data-act="aikeysave">${ui("check")}Speichern</button></div>`;
}
async function aiAsk(S) {
  const model = PREF.aimodel || "claude-opus-5-5"; S.data.busy = true; rerenderSheet(S);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": PREF.aikey, "anthropic-version": "2023-06-01", "content-type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model, max_tokens: 4000, messages: [{ role: "user", content: E.AI_PROMPT + "\n\n" + JSON.stringify(S.data.pk) }] }) });
    const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || "HTTP " + r.status);
    const txt = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    S.data.res = E.aiValidate(B, ST, today(), txt);
  } catch (e) { S.data.res = { ok: false, errs: ["Anfrage fehlgeschlagen: " + String(e.message || e).slice(0, 200)] }; }
  S.data.busy = false; rerenderSheet(S);
}
/* ---------- Profil ---------- */
function syncPill() { if (CLOUD) { const st = !CL.s ? "" : CL.state === "ok" || CL.state === "busy" ? "ok" : "err"; return `<button class="syncpill ${st}" data-act="synctap" title="${esc(CL.msg)}"><i></i>${!CL.s ? "Lokal" : CL.state === "busy" ? "Gleicht ab" : st === "ok" ? "Synchron" : navigator.onLine === false ? "Offline" : "Sync prüfen"}</button>`; }
  return `<button class="syncpill ${syncState === "ok" ? "ok" : syncState === "wait" ? "wait" : syncState === "err" ? "err" : ""}" data-act="synctap" title="${esc(syncMsg)}"><i></i>${syncState === "ok" ? "Synchron" : syncState === "wait" ? "Freigeben" : syncState === "err" ? "Sync prüfen" : "Lokal"}</button>`; }
function vProf(c) {
  const adj = Object.keys(ST).filter(k => k.startsWith("adj:")).map(k => ST[k].v).filter(Boolean).sort((a, b) => b.created - a.created);
  const trv = Object.keys(ST).filter(k => k.startsWith("trv:")).map(k => [k, ST[k].v]).filter(([, v]) => v && !v.del && v.to >= c.t - 30).sort((a, b) => a[1].from - b[1].from);
  const sick = get("sick"), sickNow = sick && num(sick.from) && !num(sick.to), standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone, ios = /iPhone|iPad/.test(navigator.userAgent);
  const row = (ic, col, t1, t2, act, extra) => `<button class="row" data-act="${act}" ${extra || ""}><span class="badge-ic" style="--c:${col};--t:color-mix(in srgb,${col} 14%,var(--surface))">${ui(ic)}</span><span class="tx"><span class="t1">${t1}</span>${t2 ? `<span class="t2">${t2}</span>` : ""}</span>${ui("chev", "chev")}</button>`;
  let x = `<header class="lt"><div><div class="eyebrow">Einstellungen und Daten</div><h1>Profil</h1></div></header>`;
  x += `<div class="prof-hero"><span class="av logo-av"><img src="logo.png" alt=""></span><div class="tx" style="flex:1"><b style="font-size:1.0625rem">Saison 2026/27</b><div class="muted" style="font-size:.8125rem">${B.plan.length} Einheiten · Plan vom ${new Date(B.importedAt).toLocaleDateString("de-DE")}</div></div>${syncPill()}</div>`;
  if (!standalone) x += `<div class="banner info" style="margin-top:12px">${ui("down")}<div class="tx"><b>Als App installieren.</b> ${ios ? "Safari: Teilen, dann Zum Home-Bildschirm." : "Chrome: Menü ⋮, Speichern und teilen, Seite als App installieren."}</div></div>`;
  const absN = E.absences(ST, c.t).filter(a => (a.to != null ? a.to : c.t) >= c.t).length;
  x += `<div class="sec"><h2>Abwesenheiten</h2></div><div class="grp">${row("plane", "var(--lane)", "Reisen, Urlaub, Krankheit", sickNow ? ((E.SICK_CAT[sick.cat] || {}).short || "Krank") + " seit " + U.wdD(sick.from) + (absN > 1 ? ", " + (absN - 1) + " weitere" : "") : absN ? absN + " aktuell oder geplant" : "Eintragen, bearbeiten, löschen", "abs")}</div>`;
  const slot = get("set:slot") || "plan";
  x += `<div class="sec"><h2>Plan anpassen</h2></div><div class="grp"><div class="row plain slotrow"><span class="badge-ic" style="--c:var(--gold-s);--t:var(--gold)">${ui("sun")}</span><span class="tx"><span class="t1">Trainingszeit</span><span class="t2" style="white-space:normal">Morgens: Laufen und Kraft ab 6:00, Schwimmen um 7:00, Rest abends. Wochenende ab 8:00.</span></span><div class="seg"><button data-act="slot" data-v="morgen" aria-pressed="${slot === "morgen"}">Morgens</button><button data-act="slot" data-v="plan" aria-pressed="${slot !== "morgen"}">Wie im Plan</button></div></div></div><div class="grp" style="margin-top:10px"><div class="row plain autorow"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("sync")}</span><span class="tx"><span class="t1">Plan automatisch anpassen</span><span class="t2" style="white-space:normal">${AUTO() ? "An: Greift eine Regel, ändert die App den Plan selbst. Jede Änderung steht auf der Übersicht und lässt sich zurücknehmen." : "Aus: Die App schlägt Änderungen nur vor. Du bestätigst sie auf der Übersicht."}</span></span><button class="switch" role="switch" aria-checked="${AUTO()}" aria-label="Plan automatisch anpassen" data-act="autotog"><i></i></button></div>${row("book", "var(--ink2)", "Wie die App anpasst", "Alle Regeln mit Quellen", "rules")}${row("sync", "var(--lane)", "Zweite Meinung von Claude", "Optional: nächste 14 Tage prüfen lassen", "ai")}</div>`;
  /* 4.4 F: Gewicht und Ernährung stehen unter Gesundheit, nicht doppelt im Profil. */
  x += `<div class="sec"><h2>Daten und Geräte</h2></div><div class="grp">${CLOUD ? row("sync", CL.s ? "var(--ok)" : "var(--lane)", CL.s ? "Geräte abgleichen: an" : "Geräte abgleichen", CL.s ? esc((CL.s.email || "") + " · " + (CL.msg || "")) : "Mit E-Mail und Passwort anmelden, dann automatisch", "cloud") + (CL.s ? row("down", "var(--ok)", "Garmin aktualisieren", esc(garLine()), "garmin") : "") : ""}${!CLOUD && FSA ? (H.sync ? row("sync", "var(--ok)", "Jetzt abgleichen", esc(syncMsg + " · " + H.sync.name), "syncnow") + row("x", "var(--mute)", "Sync trennen", "Datei bleibt erhalten", "syncoff") : row("sync", "var(--lane)", "Sync-Datei anlegen", "Einmal in iCloud Drive speichern, danach automatisch", "synccreate") + row("file", "var(--lane)", "Vorhandene Sync-Datei wählen", "", "syncopen")) : ""}${row("file", "var(--ok)", "Export (Excel)", "Plan, Ist-Werte, Wochen, Tests, Tagebuch" + (H.exp ? " · " + esc(expLine()) : ""), "xlsx")}${EXP_OK ? (H.exp ? row("x", "var(--mute)", "Automatischen Export beenden", esc(H.exp.name) + " bleibt, wie sie ist", "expoff") : row("sync", "var(--ok)", "Automatisch exportieren", "Einmal Speicherort wählen, danach nach jeder Änderung", "exppick")) : ""}${row("cal", "var(--accent-ink)", "Kalender (.ics)", "Ab heute, inklusive Anpassungen", "ics")}${row("up", "var(--lane)", FSA ? "Sicherung speichern" : "Stand sichern", FSA ? "Kompletter Stand als Datei" : "Als Sync-Datei in iCloud Drive sichern und ersetzen", "sharejson")}${row("down", "var(--lane)", FSA ? "Sicherung laden" : "Stand laden", FSA ? "Führt mit dem Stand hier zusammen" : "Sync-Datei aus iCloud Drive öffnen", "loadjson")}</div>`;
  x += `<div class="sec"><h2>Hilfe</h2></div><div class="grp">${row("info", "var(--ink2)", "So funktioniert die App", "Status, Anpassungen, Daten in Kürze", "help")}${row("trash", "var(--bad)", "Alle Daten löschen", "Nur auf diesem Gerät", "reset")}</div>`;
  x += `<div class="brandfoot nofold"><img src="logo.png" alt=""><b>Gehhilfe 4.4</b><span>Deine Stütze bis zur Ziellinie</span></div>`;
  x += `<p class="note nofold" style="display:flex;gap:8px;margin-top:16px">${ui("shield")}<span>Plan und Einträge liegen auf deinen Geräten und, wenn Geräte abgleichen an ist, in deiner eigenen Supabase-Datenbank (Frankfurt). Garmin-Daten holt die App nur, wenn du auf Garmin tippst. Empfehlungen folgen festen Trainingsregeln und ersetzen keine ärztliche Abklärung.</span></p>`;
  return x;
}
/* 4.4 F: Hilfe in Kürze. Statussprache wie im Plan. */
function helpSheet() {
  const mk = (cl, ic, lab, txt) => `<div class="row plain"><span class="stmark ${cl}" style="--c:var(--run)">${ic ? ui(ic) : ""}</span><span class="tx"><span class="t1">${lab}</span><span class="t2" style="white-space:normal">${txt}</span></span></div>`;
  return `<div class="sh-head"><div class="tx"><h2 class="sheet-title" tabindex="-1">So funktioniert die App</h2><p>Das Wichtigste in einer Minute.</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>
  <div class="sec"><h2 style="font-size:1rem">Status im Plan</h2></div><div class="grp">${mk("ok", "check", "Erledigt", "Gefüllter Kreis mit Haken in Sportfarbe.")}${mk("half", "half", "Teilweise", "Halb gefüllt.")}${mk("miss", "x", "Verpasst", "Roter Ring mit Kreuz.")}${mk("", "", "Offen", "Ring in Sportfarbe, die Einheit kommt noch.")}</div>
  <div class="sec"><h2 style="font-size:1rem">Im Alltag</h2></div><div class="grp"><div class="row plain"><span class="tx"><span class="t1">Abhaken</span><span class="t2" style="white-space:normal">Einheit antippen, dann Erledigt. Auf dem iPhone geht auch Wischen nach rechts.</span></span></div><div class="row plain"><span class="tx"><span class="t1">Eintragen</span><span class="t2" style="white-space:normal">Unter Wie lief es? frei schreiben, etwa „10 km in 52 min, Puls 148, schwere Beine“. Die App füllt die Felder selbst.</span></span></div><div class="row plain"><span class="tx"><span class="t1">Plan passt sich an</span><span class="t2" style="white-space:normal">Nach Krankheit, Reise, verpassten oder sehr harten Einheiten. Änderungen stehen auf der Übersicht unter Was sich geändert hat und lassen sich zurücknehmen.</span></span></div><div class="row plain"><span class="tx"><span class="t1">Garmin</span><span class="t2" style="white-space:normal">Pille oben auf der Übersicht antippen. Trainings werden zugeordnet, Schlaf, HRV und Ruhepuls landen unter Gesundheit.</span></span></div></div>
  <div class="sh-foot"><button class="btn" data-act="rules">Alle Regeln</button><button class="btn ink" data-act="close">Verstanden</button></div>`;
}
function rulesSheet() {
  const L = [["Verpasste Schlüsseleinheit", "Wird auf einen freien Tag der Woche geschoben, ohne harte Einheit derselben Sportart davor oder danach. Sonst fällt sie weg: nicht nachholen."],
    ["Verpasster Long Run", "Fällt weg, nicht nachholen."], ["Long-Run-Sprung", "Liegt der nächste lange Lauf mehr als 10 % über dem längsten erledigten Lauf der letzten 30 Tage, kommt ein Deckel als Vorschlag (Frandsen et al. 2025). Der Plan bleibt, wenn du ablehnst.", "lrspike"], ["Verpasster Test", "Wird nachgeholt, er steuert Paces und Zonen."],
    ["Taper", "12 Tage vor Marathon und Mitteldistanz, 4 Tage vor HM und OD: nichts nachholen, nichts Hartes hineinschieben."],
    ["Lücke", "Mehr als die Hälfte der Trainingszeit der letzten 10 Tage verpasst: 7 Tage mit 75 % Umfang und nur einer harten Einheit."],
    ["Krank", "Kategorie bestimmt die Regel: Erkältung oberhalb des Halses locker erlaubt, Fieber oder Infekt Pause, Verletzung nur betroffene Sportarten. Danach Wiedereinstieg in 3 Stufen, Tests danach, nichts nachholen, erster Long Run gedeckelt.", "sick"], ["Reise", "Ersatz nach Ausstattung (Laufstrecke, Laufband, Fitnessraum, Pool, Zimmer). An- und Abreisetag nichts Hartes, Schlüsseleinheit vor Ort oder auf einen Tag ohne Reise, Tests danach.", "travel"],
    ["Check-in", "Gelb: nächste harte Einheit locker. Rot: 3 Tage locker. Schmerz ab 5/10: Laufpause und ärztlich abklären."],
    ["Formkurve", "Form drei Tage deutlich im Minus und Ermüdung über Plan: nächste harte Einheit locker."], ["Hohe RPE", "Drei lockere Einheiten mit RPE 6 oder mehr: nächste harte Einheit locker."]];
  return `<div class="sh-head"><div class="tx"><h2 class="sheet-title" tabindex="-1">Wie die App anpasst</h2><p>Jeder Vorschlag lässt sich ablehnen oder zurücknehmen.</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div><div class="grp">${L.map(([a, b, k]) => `<div class="row plain"><span class="tx"><span class="t1">${esc(a)}</span><span class="t2" style="white-space:normal">${esc(b)}</span></span>${k ? infoBtn(k, "Quellen zu " + a) : ""}</div>`).join("")}</div><p class="note">Regeln ohne Info-Knopf sind eigene Trainerregeln ohne direkte Studiengrundlage. Der Prüfbericht im Entwicklungsordner listet das im Detail.</p><div class="sh-foot"><button class="btn ink" data-act="close">Verstanden</button></div>`;
}
const infoBtn = (k, lab) => `<button class="closebtn" data-act="info" data-v="${k}" aria-label="${esc(lab || "Erklärung und Quellen")}">${ui("info")}</button>`;
const chipK = (f, k, lab, on, ic) => `<button type="button" class="chip" data-act="setk" data-f="${f}" data-v="${esc(k)}" aria-pressed="${!!on}">${ic ? ui(ic) : ""}${esc(lab)}</button>`;
const chipT = (f, k, lab, on) => `<button type="button" class="chip" data-act="tog" data-f="${f}" data-v="${esc(k)}" aria-pressed="${!!on}">${on ? ui("check") : ""}${esc(lab)}</button>`;
function travelSheet(D) {
  const t = today(), ex = D.key ? get(D.key) : null, F = D.f || (D.f = ex ? { from: ex.from, to: ex.to, kind: ex.kind === "urlaub" ? "urlaub" : ex.kind === "privat" ? "privat" : "dienst", place: ex.place || "", eq: Object.assign({ gym: false, tread: false, pool: false, route: false }, ex.eq || {}) } : { from: t + 1, to: t + 2, kind: ["dienst", "urlaub", "privat"].includes(D.kind) ? D.kind : "dienst", place: "", eq: { gym: false, tread: false, pool: false, route: false } });
  const eq = F.eq, S = E.SUBS, subs = [];
  if (eq.route) subs.push(["Lauf draußen", "Lockere Läufe und Qualität vor Ort, Long Run mit geplanter Runde."]);
  if (eq.tread) subs.push(["Laufband-Intervalle", S.treadQ]);
  if (eq.gym) subs.push(["Hotel-Gym und Ergometer", "Kraft 30', Rad als Ergometer bis 60'."]);
  if (eq.pool) subs.push(["Schwimmen", S.pool]);
  subs.push(["Hotelzimmer-Kraft", S.room]);
  if (!eq.route && !eq.tread) subs.push(["Zimmer-Zirkel statt Lauf", S.roomCardio]);
  return `<div class="sh-head"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("plane")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">${D.key ? (F.kind === "urlaub" ? "Urlaub" : "Reise") + " bearbeiten" : F.kind === "urlaub" ? "Urlaub eintragen" : "Reise eintragen"}</h2><p>Die App schlägt Ersatzeinheiten vor und baut den Plan um.</p></div>${infoBtn("travel")}<button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>
   <div class="seg" style="margin-bottom:10px">${[["dienst", "Dienstreise"], ["urlaub", "Urlaub"], ["privat", "Privat"]].map(([k, l]) => `<button data-act="setk" data-f="kind" data-v="${k}" aria-pressed="${F.kind === k}">${l}</button>`).join("")}</div>
   <div class="two"><div class="field"><div class="fl"><span>Anreise</span></div><input type="date" class="inp" data-in="from" value="${dateVal(F.from)}"></div><div class="field"><div class="fl"><span>Abreise</span></div><input type="date" class="inp" data-in="to" value="${dateVal(F.to)}"></div></div>
   <div class="field" style="margin-top:10px"><div class="fl"><span>Ort oder Hotel</span><b>optional, bleibt auf dem Gerät</b></div><input class="inp" data-in="place" value="${esc(F.place)}" placeholder="z. B. Frankfurt, Hotel am Main" maxlength="60" autocomplete="off"></div>
   <div class="field"><div class="fl"><span>Vor Ort vorhanden</span><b>${E.eqText(eq) === "nur Zimmer" ? "nur Zimmer" : "Mehrfachauswahl"}</b></div><div class="chips">${Object.keys(E.EQ_LAB).map(k => chipT("eq", k, E.EQ_LAB[k], eq[k])).join("")}</div></div>
   <div class="sec"><h2 style="font-size:1rem">Ersatzeinheiten vor Ort</h2></div><div class="grp">${subs.map(([a, b]) => `<div class="row plain"><span class="tx"><span class="t1">${esc(a)}</span><span class="t2" style="white-space:normal">${esc(b)}</span></span></div>`).join("")}</div>
   <p class="note">An- und Abreisetag: nichts Hartes. Schlüsseleinheiten bleiben vor Ort, wenn die Ausstattung passt, sonst rücken sie auf einen Tag ohne Reise. Tests kommen nach der Reise.</p>
   <div class="sh-foot">${D.key ? `<button class="btn ghost bad" data-act="absdel" data-v="${esc(D.key)}">${ui("trash")}Löschen</button>` : `<button class="btn" data-act="close">Abbrechen</button>`}<button class="btn lane" data-act="savetrv">${ui(D.key ? "check" : "plane")}${D.key ? "Speichern" : "Eintragen"}</button></div>`;
}

/* ---------- 4.4 Paket E: Reisen und Abwesenheiten in einem Fenster. Liste, neu, bearbeiten, löschen. ---------- */
function absLabel(a) { const K = E.ABS_KIND[a.kind]; return a.kind === "krank" ? ((E.SICK_CAT[a.cat] || {}).short || "Krank") + (a.cat === "verletzung" && E.REGIONS[a.region] ? " · " + E.REGIONS[a.region].lab : "") : K.lab + (a.place ? " · " + a.place : ""); }
function absRange(a, t) { return U.fmtD(a.from) + "–" + (a.to != null ? U.fmtD(a.to) : "offen") + (a.to != null ? " · " + (a.to - a.from + 1) + " Tage" : " · seit " + (t - a.from + 1) + " Tagen"); }
const ABS_NEW = [["dienst", "Dienstreise", "plane"], ["urlaub", "Urlaub", "sun"], ["privat", "Privat", "cal"], ["krank", "Krank", "sick"]];
const absIc = a => a.kind === "krank" ? "sick" : a.kind === "urlaub" ? "sun" : a.kind === "privat" ? "cal" : "plane";
function absSheet() {
  const t = today(), A = E.absences(ST, t), cur = A.filter(a => (a.to != null ? a.to : t) >= t).sort((a, b) => a.from - b.from), past = A.filter(a => a.to != null && a.to < t).sort((a, b) => b.from - a.from);
  const row = (a, old) => { const now = a.from <= t && (a.to == null || a.to >= t), lab = absLabel(a);
    return `<div class="abrow ab-${a.kind}${old ? " past" : ""}${now ? " now" : ""}"><button class="abmain" data-act="absedit" data-v="${esc(a.key)}" aria-label="${esc(lab)} bearbeiten"><span class="abic">${ui(absIc(a))}</span><span class="tx"><span class="t1">${esc(lab)}</span><span class="t2">${now ? '<b class="abnow">läuft</b> ' : ""}${esc(absRange(a, t))}${a.eq ? " · " + esc(E.eqText(E.tripEq({ eq: a.eq }))) : ""}</span></span>${ui("chev", "chev")}</button>${a.open ? `<button class="btn sm" data-act="sickend">Gesund</button>` : ""}<button class="iconbtn abdel" data-act="absdel" data-v="${esc(a.key)}" aria-label="${esc(lab)} löschen">${ui("trash")}</button></div>`; };
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("plane")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Reisen und Abwesenheiten</h2><p>Unterwegs, Urlaub, krank. Der Plan passt sich an.</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<div class="abnew" role="group" aria-label="Neu eintragen"><span class="abnew-l">Neu eintragen</span><div class="abkinds">${ABS_NEW.map(([k, l, ic]) => `<button class="abk ab-${k}" data-act="${k === "krank" ? "sick" : "travel"}" data-v="${k}">${ui(ic)}<span>${l}</span></button>`).join("")}</div></div>`;
  x += `<div class="sec"><h2 style="font-size:1rem">Aktuell und geplant</h2></div><div class="grp ablist">${cur.length ? cur.map(a => row(a, false)).join("") : `<div class="empty">Nichts geplant. Oben eine Art wählen.</div>`}</div>`;
  if (past.length) x += `<div class="sec"><h2 style="font-size:1rem">Vergangen</h2></div><div class="grp ablist">${past.slice(0, 20).map(a => row(a, true)).join("")}</div>`;
  x += `<p class="note">Steht im Plan (Tag, Woche, Monat, Saison) und im Kalender-Export als ganztägiger Termin. Krankheitsdetails gehen nicht in den Kalender.</p>`;
  return x;
}
function sickSheet(D) {
  const t = today(), ex = D.key ? get(D.key) : null, cur = get("sick"), curOpen = cur && num(cur.from) && !num(cur.to);
  const F = D.f || (D.f = ex && num(ex.to) ? { from: ex.from, to: ex.to, cat: ex.cat || "", region: ex.region || "", flags: (ex.flags || []).slice(), edit: true, closed: true } : curOpen ? { from: cur.from, cat: cur.cat || "", region: cur.region || "", flags: (cur.flags || []).slice(), edit: true } : { from: D.from || t, cat: "", region: "", flags: [] });
  const SC = E.SICK_CAT, fl = F.cat ? E.FLAGS_BY[F.cat] : [];
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--bad);--t:var(--bad-t)">${ui("sick")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">${F.edit ? "Krankmeldung ändern" : "Ich bin krank"}</h2><p>Kategorie statt Diagnose. Steuert Pause und Wiedereinstieg.</p></div>${infoBtn("sick")}<button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += F.closed ? `<div class="two"><div class="field"><div class="fl"><span>Von</span></div><input type="date" class="inp" data-in="from" value="${dateVal(F.from)}"></div><div class="field"><div class="fl"><span>Bis</span></div><input type="date" class="inp" data-in="to" value="${dateVal(F.to)}"></div></div>` : `<div class="field"><div class="fl"><span>Seit</span></div><input type="date" class="inp" data-in="from" value="${dateVal(F.from)}"></div>`;
  x += `<div class="grp" style="margin-top:10px" role="radiogroup" aria-label="Was hast du?">${Object.keys(SC).map(k => `<button class="row" role="radio" aria-checked="${F.cat === k}" data-act="setk" data-f="cat" data-v="${k}"><span class="stmark ${F.cat === k ? "ok" : ""}">${F.cat === k ? ui("check") : ""}</span><span class="tx"><span class="t1">${esc(SC[k].lab)}</span><span class="t2" style="white-space:normal">${esc(SC[k].sub)}</span></span></button>`).join("")}</div>`;
  if (F.cat === "verletzung") x += `<div class="field" style="margin-top:10px"><div class="fl"><span>Körperregion</span></div><div class="chips">${Object.keys(E.REGIONS).map(k => chipK("region", k, E.REGIONS[k].lab, F.region === k)).join("")}</div></div>`;
  if (F.cat) {
    const st = E.sickStages(F.cat, 3), what = F.cat === "hals" ? "Locker trainieren ist erlaubt, höchstens 45 Minuten, nichts Hartes." : F.cat === "verletzung" ? (F.region ? "Pausiert: " + E.REGIONS[F.region].aff.join(", ") + ". Alternative: " + (E.REGIONS[F.region].alt || "Pause") + ", nur schmerzfrei." : "Bitte Körperregion wählen.") : "Kein Training, bis die Symptome weg sind.";
    x += `<div class="banner ${F.cat === "hals" ? "info" : "err"}" style="margin-top:12px">${ui("info")}<div class="tx"><b>${esc(what)}</b> ${esc(SC[F.cat].rule)} Beispiel: nach 3 Krankheitstagen ${st.T} Tage Wiedereinstieg in ${st.s3 ? 3 : 2} Stufen.</div></div>`;
    x += `<div class="field"><div class="fl"><span>Trifft etwas davon zu?</span><b>Warnzeichen</b></div><div class="chips">${fl.map(k => chipT("flags", k, E.FLAGS[k], F.flags.includes(k))).join("")}</div></div>`;
    if (F.flags.length || F.cat === "infekt") x += `<div class="banner err" style="margin-top:10px">${ui("heart")}<div class="tx">${F.flags.length ? "<b>Bitte ärztlich abklären,</b> bevor du wieder trainierst." : "<b>Mit Fieber nicht trainieren.</b>"} Bei Brustschmerz, Herzstolpern oder Atemnot sofort ärztliche Hilfe. Die App stellt keine Diagnose.</div></div>`;
  }
  x += `<p class="note" style="display:flex;gap:8px">${ui("shield")}<span>Diese Angaben bleiben auf dem Gerät und in deiner Sicherungsdatei. Sie gehen nicht in den Export.</span></p>`;
  x += `<div class="sh-foot">${D.key ? `<button class="btn ghost bad" data-act="absdel" data-v="${esc(D.key)}">${ui("trash")}Löschen</button>` : `<button class="btn" data-act="close">Abbrechen</button>`}<button class="btn pri" data-act="savesick" ${F.cat && (F.cat !== "verletzung" || F.region) ? "" : "disabled"}>${ui("check")}${F.edit ? "Speichern" : "Melden"}</button></div>`;
  return x;
}

/* ---------- Willkommen ---------- */
function vWelcome() {
  return `<main class="welcome"><img class="logo" src="logo.png" alt=""><h1>Gehhilfe</h1><p class="lead">Deine Stütze bis Linz und ins Allgäu. Abhaken mit einem Tipp, Training in eigenen Worten notieren, und verpasst du etwas, plant die App neu.</p>
   ${ALERT ? `<div class="banner err">${ui("info")}<div class="tx">${esc(ALERT)}</div></div>` : ""}
   <div class="steps"><div><b>1</b><span>Sync-Datei aus iCloud Drive laden. Beim allerersten Mal die Startdatei <i>Gehhilfe-Startplan.json</i>.</span></div><div><b>2</b><span>Auf dem zweiten Gerät dieselbe Sync-Datei laden.</span></div></div>
   <div class="acts">${CLOUD ? '<button class="btn pri wide" data-act="cloud">Anmelden und Daten holen</button><button class="btn wide" data-act="loadjson">Sicherung oder Startdatei laden</button>' : FSA ? '<button class="btn pri wide" data-act="syncopen">Sync-Datei verbinden</button><button class="btn wide" data-act="loadjson">Sicherung oder Startdatei laden</button>' : '<button class="btn pri wide" data-act="loadjson">Sync-Datei oder Startdatei laden</button>'}</div>
   <p class="fine">${ui("shield")}<span>Deine Daten liegen auf deinen Geräten und, wenn du dich anmeldest, in deiner eigenen Supabase-Datenbank in Frankfurt.</span></p></main>`;
}
/* ---------- 4.2 Cloud-Sync über Supabase (eigene Datenbank, Login per E-Mail-Code) ----------
   Jeder Schlüssel (log:, chk:, adj: …) wird einzeln abgeglichen, der neuere Zeitstempel gewinnt, auf Gerät und Server gleich.
   Gelöschte Schlüssel gehen als v:null hinaus. SENT merkt sich je Schlüssel den zuletzt abgeglichenen Zeitstempel. */
const CLOUD = (typeof window !== "undefined" && window.GH_CLOUD && window.GH_CLOUD.url && window.GH_CLOUD.key) ? window.GH_CLOUD : null;
const CL = { s: null, sent: {}, cursor: "1970-01-01T00:00:00Z", state: "off", msg: "", at: 0, busy: false, again: false, email: "", step: "mail" };
const clSave = () => idbPut("cloud", { s: CL.s, sent: CL.sent, cursor: CL.cursor, at: CL.at });
async function clFetch(path, o, noAuth) {
  o = o || {}; const h = Object.assign({ apikey: CLOUD.key, "Content-Type": "application/json" }, o.headers || {});
  if (!noAuth) { await clEnsure(); h.Authorization = "Bearer " + CL.s.access_token; }
  const r = await fetch(CLOUD.url.replace(/\/$/, "") + path, Object.assign({}, o, { headers: h }));
  if (r.status === 401 && !noAuth && !o._retry) { CL.s.expires_at = 0; return clFetch(path, Object.assign({}, o, { _retry: true })); }
  const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (_) {}
  if (!r.ok) { const e = new Error((j && (j.msg || j.message || j.error_description || j.error)) || ("HTTP " + r.status)); e.status = r.status; throw e; }
  return j;
}
const clSession = j => ({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, email: (j.user && j.user.email) || CL.email, uid: j.user && j.user.id });
async function clEnsure() {
  if (!CL.s) throw new Error("Nicht angemeldet");
  if (CL.s.expires_at - 60000 > Date.now()) return;
  try { const j = await clFetch("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: CL.s.refresh_token }) }, true); CL.s = Object.assign(CL.s, clSession(j)); clSave(); }
  catch (e) { if (e.status === 400 || e.status === 401) { CL.s = null; CL.state = "out"; CL.msg = "Bitte neu anmelden"; clSave(); paintChrome(); } throw e; }
}
/* 4.3.1: Anmeldung mit E-Mail und Passwort (Supabase erlaubt eigene Mail-Vorlagen im Gratis-Paket nur mit eigenem Mailserver). */
async function clSignIn(email, pw, create) {
  CL.email = email; let j;
  if (create) { j = await clFetch("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email, password: pw }) }, true);
    if (!j || !j.access_token) throw new Error("Konto angelegt, aber noch nicht bestätigt. In Supabase unter Authentication, Sign In / Providers, Email die Option „Confirm email“ ausschalten und erneut anmelden."); }
  else j = await clFetch("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password: pw }) }, true);
  CL.s = clSession(j); CL.sent = {}; CL.cursor = "1970-01-01T00:00:00Z"; await clSave(); return clSync(true);
}
const clErr = e => /invalid login|invalid_credentials|Invalid login credentials/i.test(e.message) ? "E-Mail oder Passwort stimmt nicht." : /already registered|already been registered|user_already_exists/i.test(e.message) ? "Für diese E-Mail gibt es schon ein Konto. Bitte „Anmelden“ nutzen." : /signups? not allowed|signup_disabled/i.test(e.message) ? "Neue Konten sind gesperrt. Bitte mit dem bestehenden Konto anmelden." : /password/i.test(e.message) && /6|short|weak/i.test(e.message) ? "Das Passwort ist zu kurz (mindestens 8 Zeichen)." : e.message;
function clMerge(rows) {
  let ch = false;
  rows.forEach(r => { const t = +r.t;
    if (r.k === "__base") { if (r.v && (!B || (r.v.importedAt || 0) > (B.importedAt || 0))) { B = r.v; idbPut("base", B); ch = true; } CL.sent.__base = Math.max(CL.sent.__base || 0, t); return; }
    const cur = ST[r.k];
    if (r.v === null) { if (cur && cur.t <= t) { delete ST[r.k]; ch = true; } }
    else if (cur ? cur.t < t : !(r.k in CL.sent) || CL.sent[r.k] < t) { ST[r.k] = { v: r.v, t }; ch = true; }
    CL.sent[r.k] = Math.max(CL.sent[r.k] || 0, t); });
  if (ch) { MEMO.k = null; idbPut("state", ST); }
  return ch;
}
async function clSync(interactive) {
  if (!CLOUD || !CL.s) return false;
  if (CL.busy) { CL.again = true; return false; }
  CL.busy = true; CL.state = "busy"; let changed = false;
  try {
    /* 1 Holen: mit 10 s Überlappung, damit gleichzeitig geschriebene Zeilen nicht verloren gehen */
    for (let i = 0; i < 50; i++) {
      const since = new Date(new Date(CL.cursor).getTime() - 10000).toISOString();
      const rows = await clFetch("/rest/v1/gh_kv?select=k,v,t,updated_at&updated_at=gt." + encodeURIComponent(since) + "&order=updated_at.asc&limit=1000");
      if (!rows || !rows.length) break;
      if (clMerge(rows)) changed = true;
      const last = rows[rows.length - 1].updated_at; if (last === CL.cursor && rows.length < 1000) break; CL.cursor = last;
      if (rows.length < 1000) break;
    }
    /* 2 Senden: alles, was hier neuer ist als zuletzt abgeglichen, plus Löschungen */
    const items = [];
    if (B && CL.sent.__base !== B.importedAt) items.push({ k: "__base", v: B, t: B.importedAt || 1 });
    for (const k in ST) { const e = ST[k]; if (e && e.v !== null && e.v !== undefined && (!(k in CL.sent) || e.t > CL.sent[k])) items.push({ k, v: e.v, t: e.t }); }
    for (const k in CL.sent) if (k !== "__base" && !ST[k]) { const tt = Math.max(Date.now(), CL.sent[k] + 1); items.push({ k, v: null, t: tt }); }
    for (let i = 0; i < items.length; i += 300) { const part = items.slice(i, i + 300); await clFetch("/rest/v1/rpc/gh_push", { method: "POST", body: JSON.stringify({ items: part }) }); part.forEach(x => { if (x.v === null) delete CL.sent[x.k]; else CL.sent[x.k] = x.t; }); }
    CL.state = "ok"; CL.at = Date.now(); CL.msg = "Abgeglichen " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }); await clSave();
    if (interactive) toast(changed ? "Abgeglichen, neue Einträge übernommen." : "Alles abgeglichen.", { icon: "sync" });
  } catch (e) { CL.state = CL.s ? "err" : "out"; CL.msg = navigator.onLine === false ? "Offline, gleicht später ab" : "Sync-Fehler: " + e.message; console.warn(e); if (interactive) toast(CL.msg); }
  finally { CL.busy = false; if (changed) render(); else paintChrome(); if (CL.again) { CL.again = false; setTimeout(() => clSync(false), 300); } }
  return changed;
}
let clTimer = null;
function scheduleCloud() { if (!CLOUD || !CL.s) return; clearTimeout(clTimer); clTimer = setTimeout(() => clSync(false), 1500); }
async function clSignOut() {
  if (!confirm("Abmelden und alle Daten auf diesem Gerät löschen? In der Cloud bleibt alles erhalten.")) return;
  try { await clFetch("/auth/v1/logout", { method: "POST" }); } catch (_) {}
  CL.s = null; CL.sent = {}; CL.cursor = "1970-01-01T00:00:00Z"; CL.state = "off"; await idbDel("cloud"); await idbDel("base"); await idbDel("state"); B = null; ST = {}; MEMO.k = null; render();
}
/* 4.3 Garmin: über die Supabase-Funktion "garmin" holen, auswerten, übernehmen. Rückgängig nimmt den ganzen Abruf zurück. */
const isoOf = ser => U.sd(ser).toISOString().slice(0, 10);
let garBusy = false;
async function garminRefresh() {
  if (!CLOUD || !CL.s) { toast("Garmin läuft über dein Konto. Erst anmelden, dann aktualisieren.", CLOUD ? { action: ["Anmelden", () => openSheet(S => cloudSheet(S.data), { label: "Geräte abgleichen", data: {} })] } : {}); return; }
  if (garBusy || !B) return; garBusy = true; $$("[data-act=garmin]").forEach(b => b.classList.add("spin")); $$(".gp-st").forEach(e => { e.textContent = "lädt …"; });
  try {
    await clSync(false);
    const last = get("set:gar"), t = today(), from = last && last.to ? isoOf(Math.max(B.S.start, fromIso(last.to) - 3)) : isoOf(B.S.start);
    const haveLaps = Object.keys(ST).filter(k => (k.startsWith("log:") || k.startsWith("free:")) && ST[k].v && ST[k].v.gid && ST[k].v.gx && ST[k].v.gx.laps).map(k => String(ST[k].v.gid));
    const res = await clFetch("/functions/v1/garmin", { method: "POST", body: JSON.stringify({ from, to: isoOf(t), haveLaps }) });
    const N = E.garminNormalize(res), { puts, sum } = E.garminApply(B, ST, t, N), prev = [], now = Date.now();
    puts.forEach(([k, v], i) => { prev.push([k, ST[k] ? ST[k] : null]); ST[k] = { v, t: now + i }; });
    put("set:gar", { at: now, to: isoOf(t), err: (res.errors || []).slice(0, 4), n: N.acts.length });
    MEMO.k = null; saveState(); render();
    const parts = []; if (sum.done) parts.push(sum.done + (sum.done === 1 ? " Einheit erledigt" : " Einheiten erledigt")); if (sum.enriched) parts.push(sum.enriched + " ergänzt"); if (sum.free) parts.push(sum.free + " freie" + (sum.free === 1 ? "s Training" : " Trainings")); if (sum.days) parts.push("Gesundheit " + sum.days + (sum.days === 1 ? " Tag" : " Tage"));
    const gids = N.acts.filter(a => puts.some(([k, v]) => v && v.gid === a.gid)).map(a => a.gid);
    toast(parts.length ? "Garmin: " + parts.join(", ") + "." + ((res.errors || []).length ? " Teilweise ohne " + res.errors.map(e => e.split(":")[0]).join(", ") + "." : "") : "Garmin: nichts Neues.", { icon: "sync", undo: puts.length ? () => { prev.forEach(([k, o]) => { if (o) ST[k] = { v: o.v, t: Date.now() }; else delete ST[k]; }); gids.forEach(g => { ST["gign:" + g] = { v: true, t: Date.now() }; }); MEMO.k = null; saveState(); render(); toast("Garmin-Abruf zurückgenommen."); } : null });
  } catch (e) { toast(/404/.test(e.message) ? "Garmin ist in Supabase noch nicht eingerichtet (Funktion garmin fehlt)." : "Garmin nicht erreichbar: " + e.message); console.warn(e); }
  finally { garBusy = false; $$("[data-act=garmin]").forEach(b => b.classList.remove("spin")); $$(".gp-st").forEach(e => { e.textContent = garAgo(); }); }
}
const fromIso = s => U.serialOf(new Date(s + "T12:00:00"));
/* 4.4 Garmin-Pille: beschriftet, mit Stand, dreht sich beim Laden. Ohne Konto führt sie zur Anmeldung. */
const garAgo = () => { const g = get("set:gar"); if (!g || !g.at) return "noch nie"; const m = Math.floor((Date.now() - g.at) / 6e4); return m < 1 ? "gerade eben" : m < 60 ? "vor " + m + " Min." : m < 1440 ? "vor " + Math.floor(m / 60) + " Std." : m < 2880 ? "gestern" : "vor " + Math.floor(m / 1440) + " Tagen"; };
const GAR_BTN = compact => { const on = !!(CLOUD && CL.s); if (compact) return on ? `<button class="iconbtn gbtn" data-act="garmin" aria-label="Garmin aktualisieren, Stand ${esc(garAgo())}" title="Garmin aktualisieren">${ui("sync")}</button>` : "";
  const st = garBusy ? "lädt …" : on ? garAgo() : "verbinden";
  return `<button class="gpill${garBusy ? " spin" : ""}${on ? "" : " off"}" data-act="garmin" aria-label="Garmin ${on ? "aktualisieren, Stand " + st : "verbinden"}" title="${on ? "Garmin-Daten holen" : "Für Garmin anmelden"}"><span class="gp-ic">${ui("watch", "gp-w")}${ui("sync", "gp-s")}</span><span class="gp-tx"><b>Garmin</b><span class="gp-st">${esc(st)}</span></span></button>`; };
function garLine() { const g = get("set:gar"); return g ? "Zuletzt " + new Date(g.at).toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" }) + (g.err && g.err.length ? " · teilweise" : "") : "Noch nie abgerufen"; }
function cloudSheet(D) {
  const head = `<div class="sh-head"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("sync")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Geräte abgleichen</h2><p>iPhone, Mac und Laptop mit einem Konto</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  if (!CLOUD) return head + `<p class="note">Die Cloud ist noch nicht eingerichtet. Die Anleitung steht in der Klick-Anleitung unter „Geräte abgleichen“.</p>`;
  if (CL.s) return head + `<div class="grp"><div class="row plain"><span class="tx"><span class="t1">${esc(CL.s.email || "Angemeldet")}</span><span class="t2">${esc(CL.msg || "Angemeldet")}</span></span></div></div>
    <p class="note" style="margin:12px 2px">Jede Änderung geht sofort in die Cloud. Andere Geräte holen sie beim Öffnen und jede halbe Minute.</p>
    <div class="sh-foot"><button class="btn" data-act="cloudout">Abmelden</button><button class="btn pri" data-act="cloudnow">${ui("sync")}Jetzt abgleichen</button></div>`;
  return head + `<p style="margin:0 2px 12px;color:var(--ink2)">Einmal pro Gerät anmelden, danach bleibst du angemeldet. Beim allerersten Mal auf „Konto anlegen“ tippen.</p>
    <div class="field"><div class="fl"><span>E-Mail</span></div><input class="inp" id="cl-mail" type="email" inputmode="email" autocomplete="username" value="${esc(CL.email)}" placeholder="name@gmx.de"></div>
    <div class="field"><div class="fl"><span>Passwort</span><b>mindestens 8 Zeichen</b></div><input class="inp" id="cl-pw" type="password" autocomplete="current-password" minlength="8"></div>
    <div class="sh-foot"><button class="btn" data-act="cloudnew">Konto anlegen</button><button class="btn pri" data-act="cloudlogin">${ui("check")}Anmelden</button></div>`;
}

/* ---------- Sync und Export ---------- */
/* 4.0: Keine Excel mehr als Quelle. Automatischer Export (Chrome/Edge am Mac): einmal Speicherort wählen, danach schreibt die App nach Änderungen selbst. */
const EXP_OK = typeof window !== "undefined" && "showSaveFilePicker" in window;
const EXPNAME = "Gehhilfe-Export.xlsx", XMIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
let expTimer = null;
function scheduleExp() { if (!H.exp) return; clearTimeout(expTimer); expTimer = setTimeout(() => expWrite(false), 4000); }
async function expPick() {
  try { const h = await showSaveFilePicker({ suggestedName: EXPNAME, types: [{ description: "Excel", accept: { [XMIME]: [".xlsx"] } }] });
    H.exp = h; await idbPut("expHandle", h); await expWrite(true); render();
  } catch (e) { if (e.name !== "AbortError") { ALERT = "Export nicht eingerichtet: " + e.message; render(); } }
}
async function expWrite(interactive) {
  const h = H.exp; if (!h || !B) return false;
  try {
    let p = await h.queryPermission({ mode: "readwrite" });
    if (p !== "granted") { if (!interactive) { H.expState = "wait"; return false; } p = await h.requestPermission({ mode: "readwrite" }); if (p !== "granted") { H.expState = "wait"; return false; } }
    const w = await h.createWritable(); await w.write(buildExport()); await w.close();
    H.expAt = Date.now(); H.expState = "ok"; idbPut("expLast", H.expAt);
    if (interactive) toast("Exportiert nach " + h.name, { icon: "check" });
    return true;
  } catch (e) { H.expState = "err"; if (interactive) { ALERT = "Export nicht geschrieben: " + (/lock|busy|NoModification|InvalidState/i.test(e.name + e.message) ? "Die Datei ist gerade in Excel geöffnet. Schließen und erneut tippen." : e.message); render(); } console.warn(e); return false; }
}
function expLine() { if (!H.exp) return ""; const at = H.expAt ? new Date(H.expAt).toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "noch nie"; return H.expState === "wait" ? "einmal tippen zum Freigeben" : H.expState === "err" ? "letzter Versuch fehlgeschlagen" : "automatisch, zuletzt " + at; }

function ingest(obj) {
  if (!obj || obj.app !== "perflab") throw new Error("Das ist keine Datei dieser App (Sync, Sicherung oder Startdatei).");
  if (obj.v && obj.v > 2) throw new Error("Datei stammt aus einer neueren App-Version. Bitte App aktualisieren.");
  let changed = false;
  if (obj.base && (!B || (obj.base.importedAt || 0) > (B.importedAt || 0))) { B = obj.base; idbPut("base", B); changed = true; }
  const before = sig(); ST = E.merge(ST, obj.state || {}); MEMO.k = null; idbPut("state", ST);
  return changed || before !== sig();
}
const payload = () => JSON.stringify({ app: "perflab", v: 2, savedAt: Date.now(), base: B, state: ST });
let syncTimer = null;
function scheduleSync() { if (!H.sync) return; clearTimeout(syncTimer); syncTimer = setTimeout(() => syncNow(false), 1500); }
async function syncNow(interactive) {
  const h = H.sync; if (!h) return;
  try {
    let p = await h.queryPermission({ mode: "readwrite" });
    if (p !== "granted") { if (!interactive) { syncState = "wait"; syncMsg = "Einmal tippen zum Freigeben"; paintChrome(); return; } p = await h.requestPermission({ mode: "readwrite" }); if (p !== "granted") { syncState = "wait"; paintChrome(); return; } }
    const f = await h.getFile(); let changed = false;
    if (f.size) { try { changed = ingest(JSON.parse(await f.text())); } catch (e) { console.warn(e); } }
    if (B) { const w = await h.createWritable(); await w.write(payload()); await w.close(); }
    syncState = "ok"; syncMsg = "Abgeglichen " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }); if (changed) render(); else paintChrome();
  } catch (e) { syncState = "err"; syncMsg = "Datei verschoben oder iCloud nicht erreichbar"; paintChrome(); console.warn(e); }
}
async function syncPick(create) {
  try { const types = [{ description: "Gehhilfe Sync", accept: { "application/json": [".json"] } }];
    const h = create ? await showSaveFilePicker({ suggestedName: SYNCNAME, types }) : (await showOpenFilePicker({ types }))[0];
    H.sync = h; await idbPut("syncHandle", h); await syncNow(true); render(); toast("Sync aktiv: " + h.name, { icon: "sync" });
  } catch (e) { if (e.name !== "AbortError") { ALERT = "Sync-Datei nicht nutzbar: " + e.message + ". Sperrt Chrome iCloud Drive, nimm den Ordner Dokumente (mit iCloud-Abgleich)."; render(); } }
}
async function shareFile(name, mime, data) {
  const file = new File([data], name, { type: mime });
  if (navigator.canShare && /iPhone|iPad|Android/i.test(navigator.userAgent) && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === "AbortError") return; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
/* Datenschutz: Krankheitskategorie, Region, Warnzeichen und Reiseort gehen nicht ins Excel-Protokoll. */
function privAdj(a) {
  if (/^sick/.test(String(a.key || ""))) return { title: "Anpassung wegen Krankheit", why: "Details nur in der App.", lines: [] };
  return { title: a.title, why: a.why, lines: a.lines || [] };
}
const privAdjIds = () => new Set(Object.keys(ST).filter(k => k.startsWith("adj:")).map(k => ST[k].v).filter(a => a && /^sick/.test(a.key || "")).map(a => a.id));
/* 4.0: Export als Excel. Enthält alles, was das Wochen-Review braucht, inklusive Einheiten-ID. Keine Krankheitsdetails, keine Reiseorte. */
function buildExport() {
  const c = C(), t = c.t, wb = XLSX.utils.book_new(), PV = privAdjIds(), D = d => U.wdD(d) + U.sd(d).getUTCFullYear();
  const info = [["Gehhilfe: Export", ""], ["Exportiert am", new Date().toLocaleString("de-DE")], ["Stand heute", D(t)], ["Woche", c.cw + " von " + c.NW], ["Schwellenpuls Laufen", Math.round(c.R.lthr)], ["Referenz-HM", U.hms(c.R.refHM)], ["Marathon-Prognose", U.hms(c.R.prog)], ["CSS /100 m", num(c.R.css) ? U.mss(c.R.css) : ""], [], ["Hinweis", "Datum als TT.MM.JJJJ, ID = Excel-Serienzahl-Sport-Nummer, wie in der App."]];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(info), "Info");
  const rows = [["ID", "Woche", "Datum", "Zeit", "Prio", "Sport", "Einheit", "Soll km", "Soll min", "Status", "Grund", "Ist km", "Ist min", "Pace/Tempo", "Ø HF", "Max HF", "RPE", "Gefühl 1–5", "Hm", "Schmerz 1–5", "Erholung", "Struktur", "Notiz", "Anpassung"]];
  const pace = (s, a) => a.km && a.min ? (s.sport === "Rad" ? de(a.km / (a.min / 60)) + " km/h" : s.sport === "Lauf" ? E.paceStr(a.min, a.km) + " /km" : s.sport === "Schwimmen" ? U.mss(a.min / (a.km * 10) / 1440) + " /100 m" : "") : "";
  c.Ex.filter(s => s.sport !== "Ruhe").forEach(s => { const l = log(s), a = E.actual(ST, s, t), st = s.dropped ? "entfällt" : E.statusOf(ST, s, t), done = st === "✓" || st === "½";
    rows.push([s.id, s.w, D(s.date), s.time, s.prio, s.sport, PV.has(s.adj) ? "Angepasste Einheit" : s.name, s.km || "", s.min || "", st, l.why || "", done && a.km ? Math.round(a.km * 100) / 100 : "", done && a.min ? Math.round(a.min) : "", done ? pace(s, a) : "", l.hf ?? "", l.hfmax ?? "", l.rpe ?? "", l.feel ?? "", l.hm ?? "", num(l.pain) ? l.pain + (l.painTxt ? " " + l.painTxt : "") : "", (l.tags || []).join(", "), E.segText(l.segs, s.sport), l.note || "", s.dropped || s.edited || s.added ? (PV.has(s.adj) ? "angepasst" : (s.note || "angepasst")) : ""]); });
  c.free.forEach(f => rows.push(["free:" + f.id, E.weekOf(B, f.date), D(f.date), "", "frei", f.sport, f.name || "Freies Training", "", "", "✓", "", f.dist ?? "", f.dur ?? "", "", f.hf ?? "", "", f.rpe ?? "", f.feel ?? "", f.hm ?? "", num(f.pain) ? f.pain + (f.painTxt ? " " + f.painTxt : "") : "", (f.tags || []).join(", "), E.segText(f.segs, f.sport), f.note || "", "frei"]));
  const ws = XLSX.utils.aoa_to_sheet(rows); ws["!cols"] = [14, 6, 11, 12, 5, 10, 34, 8, 8, 8, 10, 8, 8, 12, 6, 6, 5, 8, 6, 10, 18, 30, 40, 30].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, "Plan");
  const ck = [["Woche", "Ruhepuls", "Schmerz 1–5", "Gefühl 1–5", "Soll h", "Ist h", "Schlüssel", "Fitness", "Ermüdung", "Form"]];
  c.WS.weeks.forEach(w => { const k = get("chk:" + w.w) || {}, f = c.F.find(p => p.d === w.start + 6) || {}; ck.push([w.w, k.puls ?? "", E.painLvl(k) ?? "", k.feel ?? "", Math.round(w.so / 6) / 10, Math.round(w.is / 6) / 10, w.keyDone + "/" + w.keyTot, num(f.ctl) ? Math.round(f.ctl) : "", num(f.atl) ? Math.round(f.atl) : "", num(f.tsb) ? Math.round(f.tsb) : ""]); });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ck), "Wochen");
  const tr = [["Datum", "Test", "Zeit", "Ø HF", "VDOT", "Wirkung"]]; B.tests.forEach(T => { const r = get("test:" + T.key) || {}, km = { "10K": 10, HM: 21.0975, M: 42.195 }[T.typ]; tr.push([D(testDate(T)), T.name, num(r.time) ? U.hms(r.time) : "", r.hf ?? "", km && num(r.time) ? Math.round(E.vdot(km, r.time * 1440) * 10) / 10 : "", testEffect(T)]); });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tr), "Tests");
  const tb = [["Datum", "Schlaf h", "Schlafqualität 1–5", "Gefühl 1–5", "Ruhepuls", "Muskelkater 0–3", "Gewicht kg", "Frühstück", "Mittagessen", "Abendessen", "Snacks", "Notiz"]].concat(E.diaryRows(ST).map(r => [D(r[0])].concat(r.slice(1).map(v => v ?? ""))));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tb), "Tagebuch");
  const vo = [["Datum", "VO2max Garmin"]]; E.vo2List(ST).forEach(v => vo.push([D(v.date), v.v])); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(vo), "VO2max");
  const ad = [["Datum", "Anpassung", "Begründung", "Änderungen", "Status"]]; Object.keys(ST).filter(k => k.startsWith("adj:")).map(k => ST[k].v).filter(Boolean).sort((a, b) => a.created - b.created).forEach(a => { const pv = privAdj(a); ad.push([a.created > 1 ? new Date(a.created).toLocaleDateString("de-DE") : "", pv.title, pv.why, pv.lines.join(" | "), a.undone ? "zurückgenommen" : "aktiv"]); });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ad), "Anpassungen");
  return new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
}
function exportXlsx() {
  if (H.exp) { expWrite(true); return; }
  shareFile(EXPNAME, XMIME, buildExport()).then(() => toast("Export erstellt: " + EXPNAME, { icon: "check" }));
}

/* ---------- Render ---------- */
const findS = id => { const c = C(); if (String(id).startsWith("free:")) { const f = c.free.find(x => "free:" + x.id === id); return f ? dayItems(c, f.date).find(s => s.id === id) : null; } return c.Ex.find(s => s.id === id); };
function banners() {
  let x = "";
  if (ALERT) x += `<div class="banner err">${ui("info")}<div class="tx">${esc(ALERT)}</div><button class="closebtn" data-act="alertx" aria-label="Hinweis schließen">${ui("x")}</button></div>`;
  if (syncState === "wait" && H.sync) x += `<div class="banner">${ui("sync")}<div class="tx">Sync pausiert. Der Browser braucht nach dem Neustart einmal deine Freigabe.</div><button class="btn sm" data-act="syncnow">Freigeben</button></div>`;
  return x;
}
function navBadge(c) { return c.P.filter(p => p.ops && p.ops.length).length + c.Ex.filter(s => s.date < c.t && s.date >= c.t - 14 && needs(s, c.t) && !s.dropped).length; }
const LOGO_BTN = `<button class="avatar" data-tab="prof" aria-label="Profil"><img src="logo.png" alt=""></button>`;
const TABS = [["heute", "Übersicht", "today"], ["ges", "Gesundheit", "heart"], ["plan", "Plan", "plan"], ["fort", "Fortschritt", "prog"], ["prof", "Profil", "prof"]]; /* 4.1: Daten und Leistung zusammengelegt */
let typing = false, dirty = false, lastY = 0, tbIdle = null;
addEventListener("scroll", () => { document.body.classList.toggle("scrolled", window.scrollY > 52); if (WIDE()) return; const y = window.scrollY, tb = $(".tabbar"); if (!tb) return;
  if (y > lastY + 6 && y > 140) tb.classList.add("min"); else if (y < lastY - 6 || y < 80 || y + innerHeight >= document.documentElement.scrollHeight - 40) tb.classList.remove("min"); lastY = y;
  clearTimeout(tbIdle); tbIdle = setTimeout(() => tb.classList.remove("min"), 2500); }, { passive: true });
/* 4.4 G: "typing" kann hängen bleiben, wenn das fokussierte Feld durch einen Render verschwindet (kein focusout). Dann blockierte jeder Render, Knöpfe wirkten tot. */
function render() { const ae = document.activeElement; if (typing && !(ae && ae.matches("input,textarea,select") && document.contains(ae) && !ae.closest(".sheet,#insp"))) typing = false; if (typing) { dirty = true; return; } doRender(); }
function doRender() {
  dirty = false; applyTheme(); autoApply();
  const root = $("#root");
  if (!B) { root.innerHTML = vWelcome(); return; }
  const c = C(), n = navBadge(c), wide = WIDE();
  let body = tab === "heute" ? vHeute(c) : tab === "ges" ? vGes(c) : tab === "plan" ? vPlan(c) : tab === "fort" || tab === "daten" ? vProg(c) + vData(c).replace(/^<header class="lt">[\s\S]*?<\/header>/, '<div class="sec"><h2>Aktivitäten und Import</h2></div>') : vProf(c);
  if (tab === "plan" || tab === "fort") body = body.replace(/<header class="lt">([\s\S]*?)<\/header>/, (m, a) => a.includes('class="avatar"') ? m : '<header class="lt">' + (a.includes('<div class="acts">') ? a.replace('<div class="acts">', '<div class="acts">' + LOGO_BTN) : a + '<div class="acts">' + LOGO_BTN + '</div>') + '</header>');
  const nx = B.S.events.filter(e => e.date >= c.t).sort((a, b) => a.date - b.date)[0];
  const rail = PREF.side === "rail";
  const side = `<aside class="side" aria-label="Navigation"><div class="brand"><img src="logo.png" alt=""><span>Gehhilfe</span><button class="sidetog" data-act="sidetog" aria-label="${rail ? "Seitenleiste einblenden" : "Seitenleiste einklappen"}" title="Seitenleiste">${ui("sidebar")}</button></div><nav>${TABS.map(([k, l, ic]) => `<button data-tab="${k}" aria-current="${tab === k ? "page" : "false"}" title="${l}">${ui(ic)}<span class="nl">${l}</span>${k === "heute" && n ? `<span class="dot">${n}</span>` : ""}</button>`).join("")}</nav>
    <button class="btn pri sm addbtn" data-act="free" title="Training hinzufügen">${ui("plus")}<span class="nl">Training<span class="nl2"> hinzufügen</span></span></button><div class="foot">${nx ? `<div class="cdmini"><b class="num">${nx.date - c.t}</b><span>Tage bis ${esc(nx.name)}</span></div>` : ""}${syncPill()}</div></aside>`;
  if (!wide) { for (let k = SHEETS.length - 1; k >= 0; k--) if (SHEETS[k].side) SHEETS.splice(k, 1); }
  if (wide) resolveSel(c); else selId = null;
  const showInsp = wide && (SHEETS.some(S => S.side) || !!(selId && findS(selId))), insp = showInsp ? `<aside class="insp flt${INSP_SHOWN ? "" : " enter"}" id="insp" role="dialog" aria-label="Einheit">${inspHTML(c)}</aside>` : "";
  INSP_SHOWN = showInsp;
  const sc = window.scrollY, isc = $("#insp") ? $("#insp").scrollTop : 0, fz = focusSnap($("#insp"));
  const ttl = (TABS.find(t => t[0] === tab) || [, ""])[1];
  root.innerHTML = `<div class="shell${rail ? " rail" : ""}${wide && !showInsp ? " noinsp" : ""}${" t-" + tab}">${side}<main class="content" id="main"><div class="navbar" aria-hidden="true"><span>${esc(ttl)}</span></div>${body}</main>${insp}</div>
   <div class="tabbar"><nav class="tabs" aria-label="Tabs">${TABS.map(([k, l, ic]) => `<button data-tab="${k}" aria-current="${tab === k ? "page" : "false"}" aria-label="${l}${k === "heute" && n ? ", " + n + " offen" : ""}">${ui(ic)}<span>${l}</span>${k === "heute" && n ? `<span class="dot">${n}</span>` : ""}</button>`).join("")}</nav><button class="fab" data-act="free" aria-label="Training hinzufügen">${ui("plus")}</button></div>`;
  foldify($("#main")); if (!doRender.once) { doRender.once = true; document.body.classList.add("intro"); setTimeout(() => document.body.classList.remove("intro"), 1200); } document.body.classList.toggle("scrolled", sc > 52); window.scrollTo(0, sc); bindSwipes(); bindWeekSwipe();
  SHEETS.forEach(S => { if (S.opt.live && !S.side) rerenderSheet(S); }); bindSwipes();
  if ($("#insp")) { $("#insp").scrollTop = isc; fz(); }
  if (tab === "ges") paintHealth();
}
/* Ausgewählte Einheit verschoben/ersetzt? Dann die Nachfolge-Einheit (ID mit ~) zeigen statt still auf eine andere zu springen. */
function resolveSel(c) {
  if (selId && !findS(selId)) { const nx = c.Ex.find(x => String(x.id).startsWith(String(selId).split("~")[0] + "~") && !x.dropped); selId = nx ? nx.id : null; }
  if (selId) { const cur = findS(selId); if (cur && cur.dropped) { const nx = c.Ex.find(x => String(x.id).startsWith(String(selId).split("~")[0] + "~") && !x.dropped); if (nx) selId = nx.id; } }
}
function closeInsp() { keepDraft(INSP, selId, true); for (let k = SHEETS.length - 1; k >= 0; k--) if (SHEETS[k].side) SHEETS.splice(k, 1); selId = null; planSel = false; INSP = { mode: "" }; render(); }
function inspHTML(c) {
  const top = [...SHEETS].reverse().find(S => S.side);
  if (top) return `<div class="panel-bar"><button class="lnk" data-act="close">${ui("back")}Zurück</button></div><div class="panel-body">${top.render(top)}</div>`;
  resolveSel(c);
  return selId && findS(selId) ? `<div class="panel-body">${sessView(selId, INSP)}</div>` : "";
}
function paintInsp() { const i = $("#insp"); if (!i || !B) return; i.innerHTML = inspHTML(C()); $$(".content .row.sel").forEach(r => r.classList.remove("sel")); if (selId && !SHEETS.some(S => S.side)) $$(`.content [data-act=sess][data-id="${CSS.escape(selId)}"]`).forEach(r => r.classList.add("sel")); if (typeof bindSwipes === "function") bindSwipes(); }
function paintChrome() { $$(".syncpill").forEach(el => { el.outerHTML = syncPill(); }); }
let INSP = {};
function applyTheme() { /* 4.0: nur hell (Wunsch Felix) */ document.documentElement.setAttribute("data-theme", "light"); }

/* ---------- Sheets öffnen ---------- */
function openSess(id, mode) {
  keepDraft(INSP, selId); if (!mode && DRAFT["log:" + id]) mode = "log";
  if (WIDE() && !SHEETS.some(S => !S.side && !S.opt.pop)) { for (let k = SHEETS.length - 1; k >= 0; k--) if (SHEETS[k].side) SHEETS.splice(k, 1); else if (SHEETS[k].opt.pop) closeSheet(SHEETS[k], true); if (tab === "plan") planSel = true; selId = id; INSP = { mode: mode || "" }; render(); setTimeout(() => { const i = $("#insp"); if (i) i.scrollTop = 0; const h = $("#insp .sheet-title"); h && h.focus({ preventScroll: true }); }, 30); return; }
  const S = openSheet(s => sessView(id, s.data), { label: "Einheit", data: { mode: mode || "", id }, live: true, tall: false, side: false });
  S.kind = "sess";
}
/* Einheit des offenen Formulars: Sheet (iPhone) trägt die ID, die Mac-Seitenleiste nutzt selId. */
const formS = cur => cur && cur.D.id ? findS(cur.D.id) : cur && !cur.S && selId ? findS(selId) : null;
const curForm = () => { const S = SHEETS[SHEETS.length - 1]; if (S) return { D: S.data, re: () => rerenderSheet(S), S }; if (WIDE() && selId) return { D: INSP, re: () => paintInsp(), S: null }; return null; };

/* ---------- Gesten ---------- */
function bindSwipes() {
  $$(".sw").forEach(w => {
    if (w.dataset.bound) return; w.dataset.bound = "1";
    const row = $(".row", w); let x0 = null, y0 = null, dx = 0, lock = null;
    w.addEventListener("pointerdown", e => { if (e.pointerType === "mouse") return; x0 = e.clientX; y0 = e.clientY; dx = 0; lock = null; });
    w.addEventListener("pointermove", e => { if (x0 == null) return; const ddx = e.clientX - x0, ddy = e.clientY - y0;
      if (!lock) { if (Math.abs(ddx) > 10 && Math.abs(ddx) > Math.abs(ddy) * 1.3) lock = "x"; else if (Math.abs(ddy) > 10) { lock = "y"; x0 = null; return; } else return; }
      dx = Math.max(0, Math.min(ddx, w.clientWidth * .6)); w.classList.add("drag"); row.style.transform = `translateX(${dx}px)`; e.preventDefault(); });
    const end = () => { if (x0 == null) return; w.classList.remove("drag"); const id = w.dataset.id;
      if (dx > 90) { row.style.transform = `translateX(100%)`; buzz(12); setTimeout(() => quickDone(id), 180); } else row.style.transform = "";
      if (lock === "x") { w.dataset.swiped = "1"; setTimeout(() => delete w.dataset.swiped, 300); } x0 = null; };
    w.addEventListener("pointerup", end); w.addEventListener("pointercancel", end);
  });
}
function bindWeekSwipe() {
  const el = $("#wkswipe"); if (!el) return; let x0 = null;
  el.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  el.addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) < 60) return; const c = C(), w = (planWeek || c.cw) + (dx < 0 ? 1 : -1); if (w >= 1 && w <= c.NW) { planWeek = w; buzz(6); render(); } }, { passive: true });
}

/* ---------- Aktionen ---------- */
const newId = () => "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const keyId = k => { let h = 2166136261; for (const ch of String(k)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return "k" + h.toString(36); };
function applyAdj(p, auto) { const id = p.key ? keyId(p.key) : newId(); put("adj:" + id, { id, key: p.key, title: p.title, why: p.why, ops: p.ops, lines: p.lines, created: Date.now(), auto: !!auto }); return id; }
/* Zurücknehmen merkt sich den Vorschlag als abgelehnt, sonst würde die Automatik ihn sofort wieder anwenden. */
function setAdjUndone(id, u) { const k = "adj:" + id, a = get(k); if (!a) return; put(k, Object.assign({}, a, { undone: u })); if (u) put("dis:" + a.key, true); else if (get("dis:" + a.key)) put("dis:" + a.key, false);
  /* Betroffene Einheiten merken: die Automatik fasst sie danach nicht mehr ungefragt an. */
  (a.ops || []).forEach(o => { const bid = o.type === "add" ? String(o.s.id).split("~")[0] : o.id; if (u) put("nou:" + bid, true); else if (get("nou:" + bid)) put("nou:" + bid, false); }); render(); }
const AUTO = () => get("set:auto") !== false;
/* Beim Gesundmelden oder Ändern: Anpassungen "während der Krankheit" für Folgetage zurücknehmen, der Wiedereinstieg plant neu. */
function undoSickAct() { Object.keys(ST).filter(k => k.startsWith("adj:")).forEach(k => { const a = ST[k].v; if (a && !a.undone && /^sickact:/.test(a.key || "")) ST[k] = { v: Object.assign({}, a, { undone: true }), t: Date.now() }; }); MEMO.k = null; saveState(); }
let autoBusy = false;
function autoApply() {
  if (!B || autoBusy || !AUTO() || typing) return;
  autoBusy = true;
  try {
    const c = C(), el = c.P.filter(p => E.autoOk(p, c.Ex, ST)); if (!el.length) return;
    const ids = el.map(p => applyAdj(p, true)); MEMO.k = null;
    setTimeout(() => toast(el.length === 1 ? "Plan angepasst: " + el[0].title : el.length + " Anpassungen am Plan", { icon: "sync", merge: true, undo: () => ids.forEach(id => setAdjUndone(id, true)) }), 50);
  } finally { autoBusy = false; }
}
function coachCards(c) {
  const rec0 = Object.keys(ST).filter(k => k.startsWith("adj:")).map(k => ST[k].v).filter(a => a && a.auto && !a.undone && !a.seen && Date.now() - a.created < 4 * 864e5).sort((a, b) => b.created - a.created), rec = rec0.slice(0, 6);
  return rec.map(a => `<article class="prop auto rise"><span class="k">${ui("sync")}Automatisch angepasst</span><h3>${esc(a.title)}</h3><p>${esc(a.why)}</p>${a.lines && a.lines.length ? `<ul>${a.lines.slice(0, 6).map(l => `<li>${ui(/entfällt/.test(l) ? "x" : / neu$/.test(l) ? "plus" : "move")}<span>${esc(l)}</span></li>`).join("")}${a.lines.length > 6 ? `<li><span>… ${a.lines.length - 6} weitere</span></li>` : ""}</ul>` : ""}<div class="acts"><button class="btn ghost sm" data-act="adjseen" data-v="${esc(a.id)}">Verstanden</button><button class="btn ghost sm" data-act="undoadj" data-v="${esc(a.id)}">${ui("undo")}Zurücknehmen</button></div></article>`).join("");
}
function setLog(id, patch) { put("log:" + id, Object.assign({}, get("log:" + id) || {}, patch)); }
function milestone(s, before) {
  const c = C();
  if (s && s.sport === "Lauf" && ["LR", "LRM"].includes(s.code) && E.actual(ST, s, c.t).km >= 35) return "Long Run " + Math.round(E.actual(ST, s, c.t).km) + " km. Großer Schritt Richtung Linz.";
  const W = c.WS.weeks[(s ? s.w : c.cw) - 1]; if (W && W.keyTot && W.keyDone === W.keyTot && before && before.keyDone < before.keyTot) return "Woche " + W.w + ": alle Schlüsseleinheiten erledigt.";
  return null;
}
function quickDone(id) {
  const s = findS(id); if (!s) return; const before = Object.assign({}, C().WS.weeks[s.w - 1]), prev = get("log:" + id), bb = badgeSet();
  JUST_DONE = id; setTimeout(() => { JUST_DONE = null; }, 1500); setLog(id, { st: "✓" }); render();
  const m = milestone(s, before) || cheer(bb, before, s);
  toast(m, { icon: "check", cele: true, undo: () => { if (prev) put("log:" + id, prev); else { delete ST["log:" + id]; MEMO.k = null; saveState(); } render(); } });
}
function readField(f, raw, sport) {
  raw = String(raw ?? "").trim(); if (raw === "") return null;
  if (f === "dur") return parseDur(raw);
  if (f === "dist") { const n = Number(raw.replace(",", ".")); return num(n) ? (sport === "Schwimmen" ? n / 1000 : n) : null; }
  const n = Number(raw.replace(",", ".")); return num(n) ? n : null;
}
function stepField(F, f, delta, sport) {
  const base = { wt: F.wt ?? KG() ?? 75, kg: F.kg ?? 75, dur: F.dur || 0, dist: F.dist || 0, hf: F.hf ?? F.hfHint ?? 140, hfmax: F.hfmax ?? 175, hm: F.hm || 0, puls: F.puls ?? (num(B.S.rest) ? B.S.rest : 60), vo2: F.vo2 ?? 50, v: F.v ?? 50 }[f];
  let d = delta; if (f === "dist" && sport === "Schwimmen") d = delta / 1000;
  let v = Math.max(0, Math.round((base + d) * 1000) / 1000); if (f === "dist" && sport !== "Schwimmen") v = Math.round(v * 2) / 2 === v ? v : Math.round(v * 10) / 10;
  F[f] = v;
}
function syncInputs(F, sport) {
  $$("[data-in]", ($(".sheet-wrap:last-child .sheet") || $("#insp") || document)).forEach(el => {
    const f = el.dataset.in; if (!(f in F) || el === document.activeElement || f === "note") return;
    el.value = f === "dur" ? fmtDurIn(F.dur) : f === "dist" ? fmtDistIn(F.dist, sport) : f === "date" || f === "from" || f === "to" ? dateVal(F[f]) : (F[f] ?? "");
  });
  const root = $(".sheet-wrap:last-child .sheet") || $("#insp") || document, dv = $("#derived", root); if (dv) dv.innerHTML = derivedTxt(F, sport); paintVals(root, F, sport);
}

document.addEventListener("click", async e => {
  const tb = e.target.closest("[data-tab]"); if (tb) { keepDraft(INSP, selId); tab = tb.dataset.tab; planSel = false; selId = null; INSP = { mode: "" }; for (let k = SHEETS.length - 1; k >= 0; k--) if (SHEETS[k].side) SHEETS.splice(k, 1); else closeSheet(SHEETS[k], true); window.scrollTo(0, 0); buzz(4); doRender(); return; }
  const b = e.target.closest("[data-act]");
  /* Schwebendes Einheit-Fenster: Tippen auf eine freie Stelle außerhalb schließt es. */
  if (!b && $("#insp") && WIDE() && !e.target.closest("#insp,.sheet-wrap,.toast,button,a,input,select,textarea,label,summary,details,[role=button],[role=slider]")) { closeInsp(); return; }
  if (!b) return;
  const sw = b.closest(".sw"); if (sw && sw.dataset.swiped) return;
  FROM_INSP = !!b.closest("#insp"); setTimeout(() => { FROM_INSP = false; }, 0);
  const a = b.dataset.act, id = b.dataset.id, v = b.dataset.v, t = today(), cf = () => curForm();
  if (["setf", "step", "setk", "tog"].includes(a)) { const f0 = cf(); if (f0) f0.D.dirty = true; }
  switch (a) {
    case "draftdel": { const f = cf(); if (!f) break; const s0 = formS(f); if (f.D.free) delete DRAFT.free; else if (s0) delete DRAFT["log:" + s0.id]; f.D.f = null; f.D.dirty = false; f.re(); break; }
    case "sess": if (WIDE() && selId === id && $("#insp") && !SHEETS.length && !b.closest("#insp")) { closeInsp(); break; } openSess(id); break;
    case "log": openSess(id, "log"); break;
    case "close": if (SHEETS.length) closeSheet(); else if (!WIDE()) { selId = null; render(); } else closeInsp(); break;
    case "sxmv": { const f = cf(); if (!f) break; f.D.mv = !f.D.mv; f.re(); if (f.D.mv) setTimeout(() => { const i = $("#mvdate"); i && i.focus({ preventScroll: true }); }, 40); break; }
    case "mode": { const f = cf(); if (!f) break; if (f.D.mode === "log" && v !== "log") { const sid = (formS(f) || {}).id; if (sid) delete DRAFT["log:" + sid]; } f.D.mode = v; f.D.f = null; f.D.why = null; f.D.dirty = false; f.re(); break; }
    case "setf": { const f = cf(); if (!f) break; const F = f.D.f, raw = v; const nv = ["st", "sport"].includes(b.dataset.f) ? raw : Number(raw);
      if (b.dataset.f !== "more" && b.dataset.f !== "vals") (F.touch = F.touch || {})[b.dataset.f] = 1;
      if (b.dataset.f === "vals") { F.vals = !!nv; f.re(); if (F.vals) setTimeout(() => { const i = $("#in-dur", (f.S && f.S.el) || $("#insp") || document); i && i.focus({ preventScroll: true }); }, 40); break; }
      if (b.dataset.f === "pain") { F.pain = nv; buzz(4); f.re(); break; }
      if (b.dataset.f === "more") F.more = !!nv; else F[b.dataset.f] = F[b.dataset.f] === nv && !["st", "sport"].includes(b.dataset.f) ? null : nv; buzz(4); f.re(); break; }
    case "step": { const f = cf(); if (!f) break; const F = f.D.f, s = formS(f), sport = s ? s.sport : F.sport; (F.touch = F.touch || {})[b.dataset.f] = 1; stepField(F, b.dataset.f, Number(v), sport); buzz(3); syncInputs(F, sport); break; }
    case "savelog": { const f = cf(); if (!f) break; const s = findS(id), F = f.D.f; f.D.dirty = false; delete DRAFT["log:" + id]; const before = Object.assign({}, C().WS.weeks[s.w - 1]), bb = badgeSet();
      setLog(id, Object.assign({ st: F.st, dur: F.dur, dist: ["Lauf", "Rad", "Schwimmen", "Triathlon"].includes(s.sport) ? (s.sport === "Schwimmen" && num(F.dist) && F.dist > 20 ? F.dist / 1000 : F.dist) : null, hf: F.hf, hfmax: F.hfmax, rpe: F.rpe, feel: F.feel, shoe: F.shoe, hm: F.hm, pull: F.pull, note: F.note, why: undefined, ikm: undefined, imin: undefined }, noteExtra(Object.assign({ sport: s.sport }, F))));
      buzz(15); JUST_DONE = s.id; setTimeout(() => { JUST_DONE = null; }, 1500); if (f.S && f.S.opt.label !== "Einheit") closeSheet(f.S, true); else if (f.S) { f.S.data.mode = ""; f.S.data.f = null; } else { INSP = { mode: "" }; } render(); const m = milestone(s, before) || (F.st === "✗" ? "" : cheer(bb, before, s)); toast(m || "Gespeichert.", { icon: "check", cele: !!m }); break; }
    case "why": { const f = cf(); const s = findS(id); setLog(id, { st: "✗", why: v });
      if (v === "krank") { const sk = get("sick"); if (!(sk && num(sk.from) && !num(sk.to))) put("sick", { from: s ? s.date : t, to: null }); }
      if (f) { f.D.mode = "miss"; f.D.why = v; } render(); if (f && f.S) rerenderSheet(f.S); else if (f) f.re(); break; }
    case "allok": { const c = C(); c.Ex.filter(s => s.date < t && s.date >= t - 14 && needs(s, t) && !s.dropped).forEach(s => { ST["log:" + s.id] = { v: Object.assign({}, get("log:" + s.id) || {}, { st: "✓" }), t: Date.now() }; }); MEMO.k = null; saveState(); buzz(15); if (SHEETS.length) closeSheet(); render(); toast("Alles nachgetragen.", { icon: "check" }); break; }
    case "review": openSheet(() => reviewForm(), { label: "Nachtragen", live: true }); break;
    case "accept": { const P = C().P, p = P[+v] || LP[+v]; if (!p) break; const aid = applyAdj(p); buzz(12); render(); toast("Übernommen", { icon: "check", undo: () => setAdjUndone(aid, true) }); break; }
    case "reject": { const P = C().P, p = P[+v] || LP[+v]; if (!p) break; set("dis:" + p.key, true); toast(p.ops && p.ops.length ? "Plan bleibt, wie er ist." : "Okay.", { undo: () => set("dis:" + p.key, false) }); break; }
    case "undoadj": setAdjUndone(v, true); toast("Anpassung zurückgenommen.", { icon: "undo", undo: () => setAdjUndone(v, false) }); break;
    case "adjseen": { const a = get("adj:" + v); if (a) set("adj:" + v, Object.assign({}, a, { seen: true })); break; }
    case "autotog": set("set:auto", !AUTO()); toast(AUTO() ? "Automatik an: Regeln wirken sofort, alles bleibt rücknehmbar." : "Automatik aus: jeder Vorschlag braucht deine Bestätigung.", { icon: "sync" }); break;
    case "redoadj": setAdjUndone(v, false); break;
    case "clearst": { const prev = get("log:" + id); set("log:" + id, Object.assign({}, prev || {}, { st: "" })); toast("Eintrag gelöscht.", { undo: () => set("log:" + id, prev) }); break; }
    case "move": { const s = findS(id), d = fromDateVal(($("#mvdate") || {}).value); if (!s || !d) break; if (d < t) { toast("Bitte ein Datum ab heute wählen."); break; }
      const mv = E.manualMove({ B, st: ST, t, E: C().Ex }, s, d), aid = applyAdj(mv), nid = (mv.ops.find(o => o.type === "add") || {}).s; if (SHEETS.length && !SHEETS[SHEETS.length - 1].side) closeSheet(); selId = nid ? nid.id : null; INSP = { mode: "" }; render(); toast("Verschoben auf " + U.wdD(d), { icon: "move", undo: () => setAdjUndone(aid, true) }); break; }
    case "drop": { const s = findS(id); if (!s) break; const aid = applyAdj(E.manualDrop(s)); if (SHEETS.length && !SHEETS[SHEETS.length - 1].side) closeSheet(); selId = s.id; INSP = { mode: "" }; render(); toast(s.name.replace(/^★\s*/, "") + " gestrichen", { undo: () => setAdjUndone(aid, true) }); break; }
    case "free": openSheet(S => freeForm(S.data), { label: "Training hinzufügen", data: { free: true } }); break;
    case "freeedit": { const f = get(id); closeSheet(); openSheet(S => freeForm(S.data), { label: "Training bearbeiten", data: { free: true, edit: id, f: Object.assign({}, f) } }); break; }
    case "freedel": { const f = get(id); set(id, Object.assign({}, f, { del: true })); closeSheet(); selId = null; render(); toast("Gelöscht", { undo: () => set(id, f) }); break; }
    case "savefree": { const S = SHEETS[SHEETS.length - 1], F = S.data.f; if (!num(F.dur) || F.dur <= 0) { toast("Bitte eine Dauer eintragen."); break; } S.data.dirty = false; if (!S.data.edit) delete DRAFT.free;
      const key = S.data.edit || "free:" + newId(); set(key, Object.assign({ date: F.date, sport: F.sport, dur: F.dur, dist: F.dist, hf: F.hf, rpe: F.rpe, hm: F.hm, name: F.name, note: F.note, feel: F.feel }, noteExtra(F))); closeSheet(S, true); buzz(15); toast((F.name || sp(F.sport).lab) + " gespeichert", { icon: "check" }); break; }
    case "checkin": openSheet(S => checkinForm(S.data), { label: "Check-in", data: { w: +(b.dataset.w || C().cw) } }); break;
    case "savechk": { const S = SHEETS[SHEETS.length - 1], F = S.data.f, w = S.data.w, last = E.vo2List(ST).slice(-1)[0];
      put("chk:" + w, { puls: F.puls, pain: num(F.pain) ? F.pain : 1, ps: 5, feel: F.feel });
      if (num(F.vo2) && (!last || last.v !== F.vo2 || F.vo2touched)) { const prevMax = Math.max(0, ...E.vo2List(ST).map(x => x.v)); put("vo2:" + today(), F.vo2); if (prevMax && F.vo2 > prevMax) { closeSheet(S, true); render(); toast("Neuer VO2max-Bestwert: " + F.vo2, { cele: true, icon: "star" }); break; } }
      closeSheet(S, true); render(); const vv = verdict(C().cw); toast("Check-in gespeichert. " + vv.txt, { icon: "heart" }); break; }
    case "test": if (!b.dataset.k) break; openSheet(S => testForm(S.data), { label: "Test", data: { k: b.dataset.k }, live: true }); break;
    case "vo2": openSheet(S => vo2Form(S.data), { label: "VO2max", data: {} }); break;
    case "savevo2": { const S = SHEETS[SHEETS.length - 1], F = S.data.f; if (!num(F.v) || F.v < 20 || F.v > 95) { toast("Wert zwischen 20 und 95 eintragen."); break; } const prevMax = Math.max(0, ...E.vo2List(ST).map(x => x.v)); set("vo2:" + F.date, F.v); closeSheet(S, true); toast(prevMax && F.v > prevMax ? "Neuer Bestwert: VO2max " + F.v : "VO2max " + F.v + " gespeichert", { icon: "check", cele: prevMax && F.v > prevMax }); break; }
    case "vo2del": { const k = "vo2:" + v, old = get(k); set(k, null); const S = SHEETS[SHEETS.length - 1]; if (S) rerenderSheet(S); toast("Gelöscht", { undo: () => set(k, old) }); break; }
    case "info": openSheet(() => infoSheet(v), { label: "Erklärung" }); break;
    case "rules": openSheet(() => rulesSheet(), { label: "Regeln" }); break;
    case "help": openSheet(() => helpSheet(), { label: "Hilfe" }); break;
    case "aiopen": { const S = SHEETS[SHEETS.length - 1]; if (S && S.data) { S.data.copied = true; setTimeout(() => rerenderSheet(S), 300); } break; }
    case "travel": { const T = SHEETS[SHEETS.length - 1]; if (T && T.opt.pop) closeSheet(T, true); openSheet(S => travelSheet(S.data), { label: "Reise", side: false, data: { kind: v } }); break; }
    case "setk": { const f = cf(); if (!f || !f.D.f) break; const F = f.D.f, k = b.dataset.f; F[k] = F[k] === v && k === "region" ? "" : v; if (k === "cat") { F.flags = []; if (v !== "verletzung") F.region = ""; } buzz(4); f.re(); break; }
    case "tog": { const f = cf(); if (!f || !f.D.f) break; const F = f.D.f, k = b.dataset.f; if (k === "eq") F.eq[v] = !F.eq[v]; else { const L = F[k] || (F[k] = []); const i = L.indexOf(v); if (i >= 0) L.splice(i, 1); else L.push(v); } buzz(4); f.re(); break; }
    case "vplay": vidEmbed(b); break;
    case "ai": openSheet(S => aiSheet(S.data), { label: "KI-Coach", data: {} }); break;
    case "aikey": openSheet(S => aiKeySheet(S.data), { label: "API-Schlüssel", data: {} }); break;
    case "aikeysave": { const S = SHEETS[SHEETS.length - 1], F = S.data.f; PREF.aikey = String(F.aikey || "").trim(); PREF.aimodel = String(F.aimodel || "").trim() || "claude-opus-5-5"; await idbPut("pref", PREF); closeSheet(S, true); render(); toast("Gespeichert, nur auf diesem Gerät.", { icon: "shield" }); break; }
    case "aikeydel": { delete PREF.aikey; await idbPut("pref", PREF); closeSheet(SHEETS[SHEETS.length - 1], true); render(); toast("Schlüssel gelöscht."); break; }
    case "aicopy": { const S = SHEETS[SHEETS.length - 1], txt = E.AI_PROMPT + "\n\n" + JSON.stringify(S.data.pk, null, 1);
      S.data.copied = true; try { await navigator.clipboard.writeText(txt); toast("Kopiert. Jetzt in Claude einfügen.", { icon: "check" }); } catch (e) { await shareFile("Anfrage-Claude.txt", "text/plain", txt); } rerenderSheet(S); break; }
    case "aicheck": { const S = SHEETS[SHEETS.length - 1], raw = (S.data.f && S.data.f.airesp) || ($(".sheet [data-in=airesp]") || {}).value || ""; S.data.res = E.aiValidate(B, ST, today(), raw); rerenderSheet(S); break; }
    case "kitake": kiTake(id); break;
    case "pchart": PCH = v; render(); break;
    case "wkdet": openSheet(S => weekDetail(S.data), { label: "Woche", data: { w: +v }, live: true, side: false }); break;
    case "slot": set("set:slot", v); toast(v === "morgen" ? "Trainingszeiten auf morgens gestellt." : "Trainingszeiten wie im Plan.", { icon: "check" }); break;
    case "ld": openSheet(S => ldSheet(S.data), { label: "Leistungsdiagnostik", data: {} }); break;
    case "saveld": { const S = SHEETS[SHEETS.length - 1], F = S.data.f, okHf = v => num(v) && v >= 90 && v <= 220;
      if (!okHf(F.lt2hf) && !okHf(F.lt1hf)) { toast("Mindestens LT1 oder LT2 als Puls eintragen (90 bis 220)."); break; }
      if (okHf(F.lt1hf) && okHf(F.lt2hf) && F.lt1hf >= F.lt2hf) { toast("LT1 muss unter LT2 liegen."); break; }
      const rec = { date: F.date || today(), lt1hf: okHf(F.lt1hf) ? F.lt1hf : null, lt2hf: okHf(F.lt2hf) ? F.lt2hf : null, lt1pace: num(F.lt1pace) ? F.lt1pace : null, lt2pace: num(F.lt2pace) ? F.lt2pace : null, hfmax: okHf(F.hfmax) ? F.hfmax : null, vo2: num(F.vo2) && F.vo2 > 20 && F.vo2 < 95 ? F.vo2 : null };
      put("ld:" + rec.date, rec); if (rec.vo2) put("vo2:" + rec.date, rec.vo2); closeSheet(S, true); render(); toast("Gespeichert. Zonen neu berechnet" + (rec.lt1hf ? ": locker unter " + rec.lt1hf : "") + ".", { icon: "check" }); break; }
    case "chatgo": { const q = ($("#chatq") || {}).value || ""; if (q.trim()) chatAsk(q.trim()); break; }
    case "chatok": chatApply(); break;
    case "chatno": CHAT.r = null; CHAT.q = ""; CHAT.it = null; render(); break;
    case "aiask": { const S = SHEETS[SHEETS.length - 1]; if (S && PREF.aikey && !S.data.busy) aiAsk(S); break; }
    case "aireset": { const S = SHEETS[SHEETS.length - 1]; S.data.res = null; rerenderSheet(S); break; }
    case "aiaccept": { const S = SHEETS[SHEETS.length - 1], r = S.data.res; if (!r || !r.ok) break; const aid = applyAdj(r.p); closeSheet(S, true); render(); toast("KI-Vorschlag übernommen", { icon: "check", undo: () => setAdjUndone(aid, true) }); break; }
    case "mc": openSheet(S => mcSheet(S.data), { label: "Morgen-Check", data: { d: +(v || t) } }); break;
    case "savemc": { const S = SHEETS[SHEETS.length - 1], F = S.data.f, d = +v; const m = { sleep: F.sleep, sq: F.sq, feel: F.feel, puls: num(F.puls) ? F.puls : null, sore: F.sore };
      if (![m.sleep, m.sq, m.feel, m.puls, m.sore, F.wt].some(num)) { toast("Bitte mindestens einen Wert wählen."); break; }
      put("mc:" + d, m); if (num(F.wt) && F.wt > 30 && F.wt < 200) put("wt:" + d, Math.round(F.wt * 10) / 10); closeSheet(S, true); render();
      const R0 = E.morningReady(B, ST, d); toast(R0.cls === "ok" ? "Bereit. Viel Erfolg heute." : R0.cls === "warn" ? "Gelb: " + R0.why + ". Harte Einheit wird locker." : "Rot: " + R0.why + ". Heute und morgen locker.", { icon: "sun" }); break; }
    case "wt": openSheet(() => wtSheet(), { label: "Gewicht", live: true }); break;
    case "wtdel": { const k = "wt:" + v, old = get(k); set(k, null); const S = SHEETS[SHEETS.length - 1]; if (S) rerenderSheet(S); toast("Gelöscht", { undo: () => set(k, old) }); break; }
    case "fd": openSheet(S => fdSheet(S.data), { label: "Tagebuch", data: { d: +(v || t) } }); break;
    case "fdday": { const S = SHEETS[SHEETS.length - 1]; if (!S) break; S.data.d = +v; S.data.f = null; rerenderSheet(S); break; }
    case "savefd": { const S = SHEETS[SHEETS.length - 1], F = S.data.f, d = +v; const o = {}; MEALS.forEach(([k]) => o[k] = String(F[k] || "").slice(0, 600)); set("fd:" + d, Object.values(o).some(x => x.trim()) ? o : null); closeSheet(S, true); toast("Tagebuch gespeichert.", { icon: "check" }); break; }
    case "imp": openSheet(S => impSheet(S.data), { label: "Import", data: {} }); break;
    case "impfile": $("#fc").click(); break;
    case "impundo": { const S = SHEETS[SHEETS.length - 1]; if (!S || !S.data.undo) break; S.data.undo.forEach(([k, old]) => { if (old) ST[k] = { v: old.v, t: Date.now() }; else if (k.startsWith("free:")) ST[k] = { v: Object.assign({}, get(k), { del: true }), t: Date.now() }; else ST[k] = { v: Object.assign({}, get(k) || {}, { st: "", aid: undefined, dur: undefined, dist: undefined }), t: Date.now() }; }); MEMO.k = null; saveState(); closeSheet(S, true); render(); toast("Import zurückgenommen."); break; }
    case "dsport": dataSport = v; render(); break;
    case "disc": discSel = v; render(); break;
    case "discgo": discSel = v; tab = "fort"; window.scrollTo(0, 0); render(); break;
    case "ddays": dataDays = +v; render(); break;
    case "kg": openSheet(S => kgSheet(S.data), { label: "Körpergewicht", data: {} }); break;
    case "savekg": { const S = SHEETS[SHEETS.length - 1], F = S.data.f; if (!num(F.kg) || F.kg < 35 || F.kg > 160) { toast("Bitte ein Gewicht zwischen 35 und 160 kg eintragen."); break; } set("set:kg", Math.round(F.kg * 10) / 10); if (S.data.d != null || S.data.id) { S.data.f = null; rerenderSheet(S); } else { closeSheet(S, true); SHEETS.forEach(rerenderSheet); } toast("Gespeichert: " + de(F.kg) + " kg", { icon: "check" }); break; }
    case "nut": openSheet(S => nutSheet(S.data), { label: "Ernährung", data: { d: +(v || t) } }); break;
    case "fuel": openSheet(S => fuelSheet(S.data), { label: "Verpflegung", data: { id } }); break;
    case "settemp": { const S = SHEETS[SHEETS.length - 1]; if (!S) break; S.data.temp = v; rerenderSheet(S); break; }
    case "setgph": { const S = SHEETS[SHEETS.length - 1]; if (!S) break; S.data.gph = +v; rerenderSheet(S); break; }
    case "savesick": { const S = SHEETS[SHEETS.length - 1], F = S.data.f; if (!F.cat || (F.cat === "verletzung" && !F.region)) break;
      if (F.closed) { if (!F.from || !F.to || F.to < F.from || F.to > t) { toast("Bitte Von und Bis prüfen."); break; } const key = S.data.key, prev = get(key); set(key, Object.assign({}, prev, { from: F.from, to: F.to, cat: F.cat, region: F.region || "", flags: F.flags.slice() })); closeSheet(S, true); toast("Gespeichert.", { icon: "check", undo: () => set(key, prev) }); break; }
      if (!F.from || F.from > t) { toast("Bitte ein Datum bis heute wählen."); break; }
      const prev = get("sick"); undoSickAct(); if (prev && num(prev.from) && num(prev.to) && !F.edit) put("sickh:" + prev.from, Object.assign({}, prev)); set("sick", { from: F.from, to: null, cat: F.cat, region: F.region || "", flags: F.flags.slice() }); closeSheet(S, true); render();
      toast(F.edit ? "Gespeichert." : F.cat === "hals" ? "Gute Besserung. Locker geht, Hartes nicht." : "Gute Besserung. Pause, bis du fit bist.", { icon: "sick", undo: () => set("sick", prev || null) }); break; }
    case "savetrv": { const S = SHEETS[SHEETS.length - 1], F = S.data.f; if (!F.from || !F.to || F.to < F.from) { toast("Bitte Von und Bis prüfen."); break; }
      const clash = E.absences(ST, t).find(a => a.key !== S.data.key && a.kind !== "krank" && F.from <= (a.to != null ? a.to : F.to) && F.to >= a.from); if (clash) toast("Überschneidet sich mit " + E.ABS_KIND[clash.kind].lab + " " + U.fmtD(clash.from) + "–" + U.fmtD(clash.to) + ". Beide bleiben gespeichert.");
      if (S.data.key) { put(S.data.key, Object.assign({}, get(S.data.key), { del: true })); }
      set("trv:" + newId(), { from: F.from, to: F.to, kind: F.kind, place: String(F.place || "").trim().slice(0, 60), eq: Object.assign({}, F.eq) }); closeSheet(S, true); render();
      toast((S.data.key ? "Gespeichert. " : F.kind === "urlaub" ? "Urlaub eingetragen. " : "Reise eingetragen. ") + (AUTO() ? "Plan angepasst." : "Vorschlag in der Übersicht."), { icon: "plane", action: ["Ansehen", () => { while (SHEETS.length) closeSheet(SHEETS[SHEETS.length - 1], true); selId = null; tab = "heute"; window.scrollTo(0, 0); render(); }] }); break; }
    case "abs": { const T = SHEETS[SHEETS.length - 1]; if (T && T.opt.pop) closeSheet(T, true); openSheet(() => absSheet(), { label: "Abwesenheiten", live: true, side: false }); break; }
    case "absedit": { if (!get(v)) break; const T = SHEETS[SHEETS.length - 1]; if (T && T.opt.pop) closeSheet(T, true);
      if (v === "sick" || v.startsWith("sickh:")) { openSheet(S => sickSheet(S.data), { label: "Krank", side: false, data: { key: v } }); break; } openSheet(S => travelSheet(S.data), { label: "Reise", side: false, data: { key: v } }); break; }
    case "absdel": { const old = get(v); if (!old) break; const T = SHEETS[SHEETS.length - 1]; if (T && T.data && T.data.key === v) closeSheet(T, true);
      if (v === "sick") { undoSickAct(); set("sick", null); } else set(v, Object.assign({}, old, { del: true })); SHEETS.forEach(S => { if (S.opt.live) rerenderSheet(S); });
      toast("Gelöscht. Der Plan ist wieder wie vorher, Anpassungen dazu bleiben, bis du sie zurücknimmst.", { undo: () => set(v, old) }); break; }
    case "sick": { const T = SHEETS[SHEETS.length - 1]; if (T && T.opt.pop) closeSheet(T, true); openSheet(S => sickSheet(S.data), { label: "Krank", side: false, data: {} }); break; }
    case "sickend": { undoSickAct(); const s = get("sick"); set("sick", Object.assign({}, s, { to: Math.max(s.from, t - 1) })); tab = "heute"; render(); toast("Willkommen zurück. Dein Wiedereinstieg steht unter Heute.", { icon: "check" }); break; }
    case "zoom": planSel = false; selId = null; for (let k = SHEETS.length - 1; k >= 0; k--) if (SHEETS[k].side) SHEETS.splice(k, 1); planZoom = v; if (v === "woche") planWeek = null; if (v === "tag") planDay = null; if (v === "monat") planMonth = null; render(); break;
    case "wk": planWeek = +v; render(); break;
    case "wkgo": { const T = SHEETS[SHEETS.length - 1]; if (T && T.opt.pop) closeSheet(T, true); if (planZoom !== "woche") { planSel = false; selId = null; for (let k = SHEETS.length - 1; k >= 0; k--) if (SHEETS[k].side) SHEETS.splice(k, 1); } planZoom = "woche"; planWeek = +v; window.scrollTo(0, 0); render(); break; }
    case "day": openSheet(S => dayPop(S.data), { label: "Tag", data: { d: +v }, live: true, side: false, pop: rectOf(b) }); break;
    case "pdone": quickDone(id); break;
    case "swk": openSheet(S => weekPop(S.data), { label: "Woche", data: { w: +v }, live: true, side: false, pop: rectOf(b), popSide: true }); break;
    case "swkn": { const S = SHEETS[SHEETS.length - 1]; if (S) { S.data.w = Math.max(1, Math.min(C().NW, +v)); rerenderSheet(S); } break; }
    case "dayn": planDay = +v; render(); break;
    case "mon": planMonth = +v; render(); break;
    case "mday": openSheet(S => dayPop(S.data), { label: "Tag", data: { d: +v }, live: true, side: false, pop: rectOf(b) }); break;
    case "dsh": { const S = SHEETS[SHEETS.length - 1]; if (S) { S.data.d = +v; rerenderSheet(S); } break; }
    case "mday2w": { closeSheet(SHEETS[SHEETS.length - 1], true); if (planZoom !== "woche") { planSel = false; selId = null; for (let k = SHEETS.length - 1; k >= 0; k--) if (SHEETS[k].side) SHEETS.splice(k, 1); } planZoom = "woche"; planWeek = Math.max(1, Math.min(C().NW, E.weekOf(B, +v))); render(); break; }
    case "range": progRange = v; render(); break;
    case "alertx": ALERT = ""; render(); break;
    case "synctap": if (CLOUD) openSheet(S => cloudSheet(S.data), { label: "Geräte abgleichen", data: {} }); else if (H.sync) syncNow(true); else { tab = "prof"; render(); } break;
    case "cloud": openSheet(S => cloudSheet(S.data), { label: "Geräte abgleichen", data: {} }); break;
    case "cloudlogin": case "cloudnew": { const m = (($("#cl-mail") || {}).value || "").trim(), pw = ($("#cl-pw") || {}).value || "";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) { toast("Bitte eine gültige E-Mail-Adresse eingeben."); break; } if (pw.length < 8) { toast("Das Passwort braucht mindestens 8 Zeichen."); break; }
      b.disabled = true; try { await clSignIn(m, pw, a === "cloudnew"); if (SHEETS.length) closeSheet(); ALERT = ""; render(); toast(a === "cloudnew" ? "Konto angelegt. Deine Daten sind jetzt in der Cloud." : "Angemeldet. Deine Geräte gleichen sich jetzt ab.", { icon: "check" }); } catch (e) { toast(clErr(e)); b.disabled = false; } break; }
    case "cloudnow": clSync(true).then(() => { const S = SHEETS[SHEETS.length - 1]; if (S) rerenderSheet(S); }); break;
    case "cloudout": closeSheet(); clSignOut(); break;
    case "garmin": garminRefresh(); break;
    case "sport": openSheet(S => sportSheet(S.data), { label: sp(v).lab, data: { k: v }, side: false }); break;
    case "sportgo": closeSheet(); discSel = v; tab = "fort"; window.scrollTo(0, 0); render(); break;
    case "adjseenall": { const ids = Object.keys(ST).filter(k => k.startsWith("adj:")).filter(k => { const a = ST[k].v; return a && a.auto && !a.undone && !a.seen; }); ids.forEach(k => put(k, Object.assign({}, ST[k].v, { seen: true }))); render(); break; }
    case "loadjson": $("#fj").click(); break;
    case "sharejson": if (B) await shareFile(SYNCNAME, "application/json", payload()); break;
    case "synccreate": syncPick(true); break;
    case "syncopen": syncPick(false); break;
    case "syncnow": syncNow(true); break;
    case "syncoff": H.sync = null; idbDel("syncHandle"); syncState = "off"; syncMsg = "Nur auf diesem Gerät"; render(); break;
    case "ics": await shareFile("Training.ics", "text/calendar", E.ics(B, ST, t)); break;
    case "xlsx": exportXlsx(); break;
    case "exppick": expPick(); break;
    case "fold": toggleFold(v); break;
    case "sidetog": PREF.side = PREF.side === "rail" ? "full" : "rail"; idbPut("pref", PREF); doRender(); break;
    case "insptog": PREF.insp = PREF.insp === false; idbPut("pref", PREF); doRender(); break;
    case "expoff": H.exp = null; H.expState = "off"; await idbDel("expHandle"); render(); toast("Automatischer Export beendet."); break;
    case "reset": if (confirm("Alle Daten in dieser App löschen? Die Sync-Datei bleibt erhalten.")) { await idbDel("base"); await idbDel("state"); await idbDel("syncHandle"); await idbDel("expHandle"); H.exp = null; B = null; ST = {}; H.sync = null; MEMO.k = null; render(); } break;
    case "upd": navigator.serviceWorker.getRegistration().then(r => { if (r && r.waiting) r.waiting.postMessage("skip"); setTimeout(() => location.reload(), 300); }); break;
  }
});
document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches("[role=button]")) { e.preventDefault(); e.target.click(); } if (e.key === "Enter" && e.target.id === "chatq") { e.preventDefault(); const q = e.target.value.trim(); if (q) chatAsk(q); } });
document.addEventListener("focusin", e => { if (e.target.matches("input,textarea,select") && !e.target.closest(".sheet") && !e.target.closest("#insp")) typing = true; });
document.addEventListener("focusout", () => setTimeout(() => { typing = false; if (dirty) doRender(); }, 80));
let noteT = null;
document.addEventListener("input", e => {
  const el = e.target, f = el.dataset.in; if (!f) return; const cur = curForm(); if (!cur || !cur.D.f) return; cur.D.dirty = true;
  const s = formS(cur), sport = s ? s.sport : cur.D.f.sport;
  if (f === "note" && el.closest(".notef")) { cur.D.f.note = el.value; clearTimeout(noteT); noteT = setTimeout(() => applyNote(cur), 220); return; }
  if (["dur", "dist", "hf", "hfmax", "hm", "puls", "vo2", "v", "kg", "wt"].includes(f)) { cur.D.f[f] = readField(f, el.value, sport); (cur.D.f.touch = cur.D.f.touch || {})[f] = 1; if (f === "vo2") cur.D.f.vo2touched = true; const r0 = el.closest(".sheet") || el.closest("#insp") || document, dv = $("#derived", r0); if (dv) dv.innerHTML = derivedTxt(cur.D.f, sport); paintVals(r0, cur.D.f, sport); }
  else if (["note", "name", "shoe", "place", "airesp", "aikey", "aimodel"].includes(f)) { if (!cur.D.f) cur.D.f = {}; cur.D.f[f] = el.value; }
  else if (f.startsWith("fd_")) { if (!cur.D.f) cur.D.f = {}; cur.D.f[f.slice(3)] = el.value; }
  else if (f.startsWith("ld_")) { const k = f.slice(3), v = el.value.trim(); cur.D.f[k] = !v ? null : /pace/.test(k) ? (parseTime(v) != null ? parseTime(v) : null) : Number(v.replace(",", ".")); }
  else if (["date", "from", "to"].includes(f)) cur.D.f[f] = fromDateVal(el.value);
});
document.addEventListener("change", e => {
  const el = e.target, f = el.dataset.in; if (!f) return;
  if (f === "shoe") { const cur = curForm(); if (cur && cur.D.f) cur.D.f.shoe = el.value; }
  if (f === "dur" || f === "dist") { const cur = curForm(); if (cur && cur.D.f) { const s = formS(cur); syncInputs(cur.D.f, s ? s.sport : cur.D.f.sport); } }
  if (f === "ttime" || f === "thf") { const k = el.dataset.k, r = get("test:" + k) || {}, raw = el.value.trim();
    if (f === "ttime") { const tm = parseTime(raw); if (raw && tm == null) { el.style.boxShadow = "inset 0 0 0 2px var(--bad)"; toast("Zeit nicht erkannt. Beispiel: 4230 für 42:30."); return; } el.style.boxShadow = ""; put("test:" + k, Object.assign({}, r, { time: tm })); if (tm) el.value = U.hms(tm); }
    else { const n = raw === "" ? null : Number(raw); put("test:" + k, Object.assign({}, r, { hf: num(n) ? n : null })); }
    const S = SHEETS[SHEETS.length - 1]; if (S) { const T = B.tests.find(x => x.key === S.data.k), TT = T && (B.tests.find(x => x.typ === "CSS200" && x.date === T.date && T.typ === "CSS400") || T); const eff = TT ? (testEffect(TT) || testEffect(T)) : ""; $("#teff", S.el).innerHTML = eff ? `<div class="banner info" style="margin-top:12px">${ui("prog")}<div class="tx">${esc(eff)}</div></div>` : ""; }
    render(); if (num((get("test:" + k) || {}).time) || num((get("test:" + k) || {}).hf)) toast("Gespeichert. Paces und Zonen sind aktualisiert.", { icon: "check" }); }
});
$("#fc").addEventListener("change", async e => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; const S = SHEETS[SHEETS.length - 1] || openSheet(SS => impSheet(SS.data), { label: "Import", data: {} });
  try { doImport(await f.text(), S); } catch (err) { toast(err.message.slice(0, 220)); } });
$("#fj").addEventListener("change", async e => { const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try { ALERT = ""; const ch = ingest(JSON.parse(await f.text())); render(); scheduleCloud(); toast(ch ? "Stand übernommen und zusammengeführt." : "Schon aktuell.", { icon: "check" }); } catch (err) { ALERT = "Datei nicht lesbar: " + err.message; render(); } });
let wasWide = WIDE(), sgRz = null; addEventListener("resize", () => { if (WIDE() !== wasWide) { wasWide = WIDE(); render(); return; } if (tab === "plan" && planZoom === "saison") { clearTimeout(sgRz); sgRz = setTimeout(render, 150); } });
/* Phasen-Details: offenen Zustand über Neuzeichnen hinweg halten */
document.addEventListener("toggle", e => { const d = e.target; if (d && d.matches && d.matches("details.ph")) { if (d.open) PH_OPEN.add(d.dataset.ph); else PH_OPEN.delete(d.dataset.ph); }
  if (d && d.matches && d.matches("details.sx-sec")) { if (d.open) SX_OPEN.add(d.dataset.sx); else SX_OPEN.delete(d.dataset.sx); } }, true);
/* Schieberegler Anstrengung: Maus setzt sofort, Touch erst bei waagerechter Bewegung oder Tippen (senkrecht = scrollen). */
(() => { let drag = null;
  const val = (el, x) => { const r = el.getBoundingClientRect(), pad = 22; return Math.max(1, Math.min(10, Math.round(1 + (x - r.left - pad) / Math.max(1, r.width - 2 * pad) * 9))); };
  const commit = (el, v) => { const f = curForm(); if (!f || !f.D.f) return; const F = f.D.f, k = el.dataset.f; (F.touch = F.touch || {})[k] = 1; if (F[k] === v) return; F[k] = v; paintRpe(el, v); buzz(3); };
  document.addEventListener("pointerdown", e => { const el = e.target.closest && e.target.closest(".rpes"); if (!el) return; drag = { el, x0: e.clientX, live: e.pointerType === "mouse" }; if (drag.live) { e.preventDefault(); commit(el, val(el, e.clientX)); el.focus({ preventScroll: true }); } try { el.setPointerCapture(e.pointerId); } catch (_) {} });
  document.addEventListener("pointermove", e => { if (!drag) return; if (!drag.live && Math.abs(e.clientX - drag.x0) > 4) drag.live = true; if (drag.live) commit(drag.el, val(drag.el, e.clientX)); });
  document.addEventListener("pointerup", e => { if (drag) commit(drag.el, val(drag.el, e.clientX)); drag = null; });
  document.addEventListener("pointercancel", () => { drag = null; });
  document.addEventListener("keydown", e => { const el = e.target && e.target.closest && e.target.closest(".rpes"); if (!el) return; const f = curForm(); if (!f || !f.D.f) return; const cur = f.D.f[el.dataset.f]; let v = num(cur) ? cur : 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") v = Math.min(10, v + 1); else if (e.key === "ArrowLeft" || e.key === "ArrowDown") v = Math.max(1, (v || 2) - 1); else if (e.key === "Home") v = 1; else if (e.key === "End") v = 10; else return; e.preventDefault(); commit(el, v); });
})();

/* ---------- Start ---------- */
(async () => {
  try { B = (await idbGet("base")) || null; ST = (await idbGet("state")) || {}; if (B && !ST["set:slot"] && !QS.get("heute")) ST["set:slot"] = { v: "morgen", t: 1 }; PREF = Object.assign(PREF, (await idbGet("pref")) || {}); H.sync = (await idbGet("syncHandle")) || null; H.exp = (await idbGet("expHandle")) || null; H.expAt = (await idbGet("expLast")) || 0; idbDel("xlHandle"); idbDel("srcxlsx"); /* 4.0: Excel-Altlasten entfernen */ } catch (e) { console.warn(e); }
  for (const k in ST) if (ST[k] && ST[k].v === null) delete ST[k];
  if (H.sync) { syncState = "wait"; syncMsg = "Einmal tippen zum Freigeben"; }
  if (CLOUD) { try { const cs = await idbGet("cloud"); if (cs) { CL.s = cs.s || null; CL.sent = cs.sent || {}; CL.cursor = cs.cursor || CL.cursor; CL.at = cs.at || 0; CL.state = CL.s ? "wait" : "off"; } } catch (_) {} }
  doRender(); document.body.classList.add("ready");
  if (H.sync) syncNow(false);
  if (CLOUD && CL.s) clSync(false);
  if (CLOUD) { setInterval(() => { if (CL.s && !document.hidden) clSync(false); }, 30000); addEventListener("online", () => clSync(false)); }
  let lastDay = today();
  setInterval(() => { if (today() !== lastDay) { lastDay = today(); MEMO.k = null; render(); } if (H.sync && syncState === "ok") syncNow(false); }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { if (H.sync) syncNow(false); if (CLOUD && CL.s) clSync(false); MEMO.k = null; render(); } });
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    /* 3.4: Neue Version übernimmt sofort. Einmal neu laden, aber nie mitten in einer Eingabe. */
    let reloaded = false; const hadCtl = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (reloaded || !hadCtl) return; reloaded = true; const go = () => { if (typing || SHEETS.some(S => !S.side)) return setTimeout(go, 1500); location.reload(); }; go(); });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(reg => {
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); });
      const show = () => { if ($(".upd")) return; const d = document.createElement("div"); d.className = "upd"; d.innerHTML = `Update verfügbar <button data-act="upd">Neu laden</button>`; document.body.append(d); };
      if (reg.waiting && navigator.serviceWorker.controller) show();
      reg.addEventListener("updatefound", () => { const w = reg.installing; w && w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) show(); }); });
    }).catch(() => {});
  }
})();
window.__perflab = { get B() { return B; }, get ST() { return ST; }, ingest, buildExport, CL, clSync, render: doRender, C };
})();
