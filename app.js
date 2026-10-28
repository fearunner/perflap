/* Triger 3.3 (vormals Performance Lab). Oberfläche. Daten bleiben auf dem Gerät (IndexedDB) und in der Sync-Datei, die du selbst wählst.
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
UI.sidebar = '<rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M9.5 4.5v15M5.5 8h2M5.5 11h2"/>';
const ui = (k, cls) => `<svg class="ico ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true">${UI[k]}</svg>`;

/* ---------- Zustand und Speicher ---------- */
let B = null, ST = {}, PREF = { theme: "system" }, tab = "heute", planZoom = "woche", planWeek = null, planMonth = null, planDay = null, selId = null, LP = [], ALERT = "";
let syncState = "off", syncMsg = "Nur auf diesem Gerät";
const H = { sync: null, xl: null, xlAt: 0, xlState: "off" };
const dbP = new Promise((res, rej) => { const r = indexedDB.open("perflab-app", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const idbGet = async k => { const db = await dbP; return new Promise(r => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => r(q.result); q.onerror = () => r(undefined); }); };
const idbPut = async (k, v) => { const db = await dbP; return new Promise(r => { const tx = db.transaction("kv", "readwrite"); tx.objectStore("kv").put(v, k); tx.oncomplete = () => r(true); tx.onerror = () => r(false); }); };
const idbDel = async k => { const db = await dbP; db.transaction("kv", "readwrite").objectStore("kv").delete(k); };
let saveT = null;
const saveState = () => { clearTimeout(saveT); saveT = setTimeout(() => idbPut("state", ST), 120); scheduleSync(); scheduleXl(); };
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
function toast(msg, opt) {
  opt = opt || {}; const el = $("#toast");
  el.innerHTML = `<span class="tmsg">${opt.icon ? ui(opt.icon) : ""}${esc(msg)}</span>${opt.undo ? '<button class="tbtn" id="tundo">Rückgängig</button>' : ""}${opt.action ? `<button class="tbtn" id="tact">${esc(opt.action[0])}</button>` : ""}`;
  el.className = "toast show" + (opt.cele ? " cele" : "") + (SHEETS.length || $(".sheet-wrap") ? " top" : ""); el.hidden = false;
  if (opt.undo) $("#tundo").onclick = () => { opt.undo(); hideToast(); };
  if (opt.action) $("#tact").onclick = () => { hideToast(); opt.action[1](); };
  clearTimeout(toast.t); toast.t = setTimeout(hideToast, opt.undo || opt.action ? 6500 : 3200);
}
function hideToast() { const el = $("#toast"); el.className = "toast"; setTimeout(() => { if (!el.className.includes("show")) el.hidden = true; }, 250); }

/* ---------- Sheets (Bottom Sheet auf dem iPhone, Dialog auf dem Mac) ---------- */
const SHEETS = [];
/* Mac (ab 1000 px): Blätter erscheinen in der rechten Seitenleiste statt als Fenster. Stapel: oberstes Blatt sichtbar, Zurück schließt es. */
function openSheet(render, opt) {
  opt = opt || {};
  if (WIDE() && opt.side !== false && PREF.insp === false && B) { PREF.insp = true; idbPut("pref", PREF); doRender(); }
  if (WIDE() && opt.side !== false && $("#insp")) {
    const dummy = document.createElement("div");
    const S = { side: true, wrap: dummy, render, opt, prevFocus: document.activeElement, data: opt.data || {} };
    Object.defineProperty(S, "body", { get: () => $("#insp .panel-body") || dummy });
    Object.defineProperty(S, "el", { get: () => $("#insp") || dummy });
    SHEETS.push(S); paintInsp();
    setTimeout(() => { const f = $("#insp [autofocus]") || $("#insp .sheet-title"); f && f.focus({ preventScroll: true }); const i = $("#insp"); if (i) i.scrollTop = 0; }, 30);
    if (opt.mount) opt.mount(S);
    return S;
  }
  const wrap = document.createElement("div"); wrap.className = "sheet-wrap"; wrap.innerHTML = `<div class="scrim"></div><section class="sheet${opt.tall ? " tall" : ""}" role="dialog" aria-modal="true" aria-label="${esc(opt.label || "Dialog")}" tabindex="-1"><div class="grab" aria-hidden="true"></div><div class="sheet-body"></div></section>`;
  document.body.append(wrap);
  const S = { wrap, el: $(".sheet", wrap), body: $(".sheet-body", wrap), render, opt, prevFocus: document.activeElement, data: opt.data || {} };
  SHEETS.push(S); S.body.innerHTML = render(S); setTimeout(() => { if (typeof bindSwipes === "function") bindSwipes(); }, 0);
  requestAnimationFrame(() => wrap.classList.add("open"));
  setTimeout(() => { const f = $("[autofocus]", S.el) || $(".sheet-title", S.el) || S.el; f.focus({ preventScroll: true }); }, 60);
  $(".scrim", wrap).onclick = () => closeSheet(S);
  dragClose(S); document.documentElement.classList.add("noscroll");
  if (opt.mount) opt.mount(S);
  return S;
}
function rerenderSheet(S) { if (S.side) { const i = $("#insp"), sc0 = i ? i.scrollTop : 0; paintInsp(); if (i) $("#insp").scrollTop = sc0; return; } const sc = S.body.scrollTop; S.body.innerHTML = S.render(S); S.body.scrollTop = sc; if (S.opt.mount) S.opt.mount(S); if (typeof bindSwipes === "function") bindSwipes(); }
function closeSheet(S, quiet) {
  S = S || SHEETS[SHEETS.length - 1]; if (!S) return; const i = SHEETS.indexOf(S); if (i >= 0) SHEETS.splice(i, 1);
  if (S.side) { paintInsp(); if (S.opt.onClose && !quiet) S.opt.onClose(); return; }
  S.wrap.classList.remove("open"); setTimeout(() => S.wrap.remove(), REDUCED() ? 0 : 260);
  if (!SHEETS.length) document.documentElement.classList.remove("noscroll");
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
  const red = (num(c.puls) && c.puls >= base + 8) || c.feel === 1 || (num(c.pain) && c.pain >= 5);
  const yel = (num(c.puls) && c.puls >= base + 5) || c.feel === 2 || (num(c.pain) && c.pain >= 3);
  return red ? { cls: "bad", txt: "Rot: nur locker", sub: num(c.pain) && c.pain >= 5 ? "Schmerz: ärztlich abklären" : "Erholung zuerst" } : yel ? { cls: "warn", txt: "Gelb: entschärfen", sub: "Nächste harte Einheit locker" } : { cls: "ok", txt: "Grün: Plan gilt", sub: "Check-in W" + w };
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
  if (s.isFree) return `<span class="stmark ok" aria-label="erledigt">${ui("check")}</span>`;
  const st = E.statusOf(ST, s, t), cl = st === "✓" ? "ok" : st === "½" ? "half" : st === "✗" ? "miss" : st === "krank" ? "sick" : (s.date <= t && E.isTrain(s)) ? "need" : "";
  const ic = st === "✓" ? ui("check") : st === "½" ? ui("half") : st === "✗" ? ui("x") : st === "krank" ? ui("sick") : "";
  const lab = st === "✓" ? "erledigt" : st === "½" ? "teilweise" : st === "✗" ? "verpasst" : st === "krank" ? "krank" : cl === "need" ? "offen" : "geplant";
  return `<span class="stmark ${cl}" aria-label="${lab}">${ic}</span>`;
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

/* ---------- v3.1 Coach-Briefing (Heute): Tageslage in Klartext wie Whoop/Garmin Morning Report ---------- */
function briefing(c, h) {
  const t = c.t, F = c.F.find(x => x.d === t), v = verdict(c.cw), sick = get("sick"), sickNow = sick && num(sick.from) && !num(sick.to);
  const tsb = F ? F.tsb : 0, ctl = F ? F.ctl : 0;
  const mcr = E.morningReady(B, ST, t);
  const ready = sickNow ? { cls: "bad", lab: "Pause", txt: "Erst gesund werden." } : mcr && mcr.cls === "bad" ? { cls: "bad", lab: "Rot", txt: "Morgen-Check: " + mcr.why + "." } : mcr && mcr.cls === "warn" ? { cls: "warn", lab: "Gelb", txt: "Morgen-Check: " + mcr.why + "." } : v.cls === "bad" ? { cls: "bad", lab: "Niedrig", txt: "Check-in rot: heute nur locker." } : v.cls === "warn" ? { cls: "warn", lab: "Mittel", txt: "Warnsignal im Check-in, harte Reize dosieren." } : tsb < -0.3 * Math.max(ctl, 10) ? { cls: "warn", lab: "Müde", txt: "Ermüdung hoch, Lockeres wirklich locker." } : tsb > 5 ? { cls: "ok", lab: "Frisch", txt: "Gute Voraussetzungen für Qualität." } : { cls: "ok", lab: "Bereit", txt: "Belastung und Erholung im Gleichgewicht." };
  const s = h && h.when === "Heute" ? h.s : null, wy = s && E.whyOf(s);
  const N = KG() ? E.dayNeeds(E.dayType(c.Ex, ST, t), KG()) : null;
  const autoN = Object.keys(ST).filter(k => k.startsWith("adj:")).map(k => ST[k].v).filter(a => a && a.auto && !a.undone && Date.now() - a.created < 7 * 864e5).length;
  const nx = B.S.events.filter(e => e.date >= t).sort((a, b) => a.date - b.date)[0];
  const focus = s ? (wy ? wy.zweck.split(/[.:]/)[0] + "." : "") : "Schlaf, Essen und lockere Bewegung machen dich schneller.";
  const hard = s && E.isHard(s), headline = sickNow ? "Heute zählt Erholung" : !s ? (h ? "Ruhetag, morgen geht es weiter" : "Ruhetag") : ready.cls === "bad" ? "Heute nur locker" : s.test === "race" ? "Renntag. Vertrau deiner Vorbereitung" : s.test === "test" ? "Testtag: ausgeruht und gleichmäßig" : s.code === "LR" ? "Heute zählt Ausdauer" : s.code === "LRM" ? "Heute zählt Ausdauer mit Marathontempo" : hard ? "Heute zählt Qualität" : "Heute locker bleiben";
  const mcR = E.morningReady(B, ST, t);
  let x = `<section class="brief tri rise" aria-label="Triger, dein Coach"><img class="tri-av" src="triger.svg" alt=""><div class="tri-tx"><span class="tri-k">Triger</span><h2>${esc(headline)}</h2><p class="br-txt">${esc(focus)} ${esc(ready.txt)}</p></div><button class="readyb ${ready.cls}" data-act="checkin" data-w="${c.cw}" aria-label="Bereitschaft ${esc(ready.lab)}, Check-in öffnen"><b>${esc(ready.lab)}</b><span>Form ${tsb > 0 ? "+" : ""}${Math.round(tsb)}</span></button>
    <div class="tri-acts">${mcR ? "" : `<button class="bchip cta" data-act="mc" data-v="${t}">${ui("sun")}<span><b>Morgen-Check</b> · 10 Sekunden</span></button>`}${s && (s.min >= 45 || s.test) ? `<button class="bchip" data-act="fuel" data-id="${esc(s.id)}">${ui("fork")}<span>Verpflegung</span></button>` : ""}<button class="bchip" data-act="ai">${ui("sync")}<span>KI-Coach</span></button></div></section>`;
  return x;
}
function vHeute(c) {
  const t = c.t, h = heroPick(c), v = verdict(c.cw), sick = get("sick"), sickNow = sick && num(sick.from) && !num(sick.to);
  LP = c.P;
  const open = c.Ex.filter(s => s.date < t && s.date >= t - 14 && needs(s, t) && !s.dropped);
  let x = `<header class="lt"><div><div class="eyebrow">${esc(longDate(t))}${c.pre ? " · Start in " + (B.S.start - t) + " Tagen" : " · Woche " + c.cw + " von " + c.NW}</div><h1>Übersicht</h1></div><div class="acts"><button class="avatar" data-tab="prof" aria-label="Profil"><img src="triger.svg" alt=""></button></div></header>`;
  x += banners();
  if (sickNow) { const sc = E.SICK_CAT[sick.cat], hals = sick.cat === "hals", inj = sick.cat === "verletzung" && E.REGIONS[sick.region];
    x += `<div class="banner ${hals ? "" : "err"}">${ui("sick")}<div class="tx"><b>${esc(sc ? sc.short : "Krank")} seit ${esc(U.wdD(sick.from))}</b> ${hals ? "Nur locker, höchstens 45 Minuten." : inj ? "Pausiert: " + esc(inj.aff.join(", ")) + ". Rest nur schmerzfrei." : "Kein Training, nichts zählt als verpasst."}</div><span class="bt" style="display:flex;gap:6px">${sc ? "" : `<button class="btn sm ghost" data-act="sick">Details</button>`}<button class="btn sm" data-act="sickend">Wieder gesund</button></span></div>`; }
  x += briefing(c, h);
  // Hero
  if (h) {
    const s = h.s, z = zoneOf(s, c), S = sp(s.sport), wake = s.wake && h.when === "Morgen" ? "Wecker " + s.wake : s.wake && h.when === "Heute" ? "Wecker " + s.wake : "";
    x += `<article class="bib rise" style="--c:${s.test === "race" ? "var(--gold-s)" : s.test === "test" ? "var(--tartan)" : S.c}">
      <div class="band"><span>${icon(s.sport)}${h.doneToday ? "Heute erledigt · Als Nächstes" : "Als Nächstes"}</span><span>${esc(h.when)}${s.time ? " · " + esc(s.time.slice(0, 5)) : ""}</span></div><div class="holes" aria-hidden="true"><i></i><i></i></div>
      <div class="bd"><div class="when">${esc(S.lab)}${s.prio === "A" ? " · Schlüsseleinheit" : ""}${s.test === "test" ? " · Test" : ""}</div><h2>${esc(s.name.replace(/^★\s*/, ""))}</h2>
       <div class="big">${s.km ? `<b>${esc(s.sport === "Schwimmen" ? Math.round(s.km * 1000).toLocaleString("de-DE") : de(s.km))}<small>${s.sport === "Schwimmen" ? "m" : "km"}</small></b>` : ""}${s.min ? `<b>${esc(durShort(s.min))}<small>${s.min < 60 ? "min" : "h"}</small></b>` : ""}</div>
       ${z.pace || z.hf ? `<div class="zone">${z.pace ? `<span>${esc(z.pace)}</span>` : ""}${z.hf ? `<span>${ui("heart")}HF ${esc(z.hf)}</span>` : ""}</div>` : ""}
       ${wake ? `<p class="wake">${esc(wake)}</p>` : ""}
       <div class="acts">${h.when === "Heute" ? `<button class="btn pri" data-act="log" data-id="${esc(s.id)}">${ui("check")}Erledigt</button>` : `<button class="btn ink" data-act="sess" data-id="${esc(s.id)}">Einheit ansehen</button>`}<button class="btn" data-act="sess" data-id="${esc(s.id)}" aria-label="Mehr zur Einheit">${ui("more")}</button></div></div></article>`;
  } else x += `<div class="grp"><div class="empty"><b>Saison abgeschlossen</b>Lade einen neuen Plan unter Profil.</div></div>`;
  // Offene Einträge
  if (open.length) x += `<div class="openbar"><div class="tx"><b>${open.length} ${open.length === 1 ? "Einheit" : "Einheiten"} offen</b><span>${esc(open.slice(0, 3).map(s => U.WD[U.sd(s.date).getUTCDay()] + " " + s.name.replace(/^★\s*/, "")).join(", "))}${open.length > 3 ? " …" : ""}</span></div><span class="bt"><button class="btn sm" data-act="review">Ansehen</button><button class="btn sm ink" data-act="allok">${ui("check")}Alle erledigt</button></span></div>`;
  // Coach: automatische Anpassungen, danach offene Vorschläge
  const cc = coachCards(c), ccN = (cc.match(/class="prop auto/g) || []).length;
  if (ccN) x += fold("heute:Plan angepasst", "Triger hat deinen Plan angepasst", ccN + " neu", cc, { ic: ["sync", "var(--tartan)"], cls: "hot" });
  x += LP.map((p, i) => propCard(p, i, "")).join("");
  x += dashGrid(c, h);
  return x;
}


/* ---------- v3.3 Einklappbare Gruppen (wie iOS-Einstellungen). Zustand lokal in PREF.fold, nie im Sync. ---------- */
const FOLD_DEF = { "heute:Nächste 7 Tage": true, "fort:Disziplinen": true, "daten:Aktivitäten": true };
const foldOpen = (id, first) => { const f = PREF.fold || {}; return id in f ? !!f[id] : id in FOLD_DEF ? FOLD_DEF[id] : !!first && !/^prof:/.test(id); };
function fold(id, title, sum, body, opt) { opt = opt || {}; const o = foldOpen(id, opt.first);
  return `<section class="fold${o ? " open" : ""} ${opt.cls || ""}" data-fold="${esc(id)}"><button class="fold-h" data-act="fold" data-v="${esc(id)}" aria-expanded="${o}">${opt.ic ? `<span class="fic" style="--c:${opt.ic[1]}">${opt.ic[0].length > 12 ? opt.ic[0] : ui(opt.ic[0])}</span>` : ""}<span class="fold-t">${esc(title)}</span><span class="fold-s">${sum || ""}</span>${ui("chev", "fold-c")}</button><div class="fold-b"><div class="fold-i">${body}</div></div></section>`; }
/* Seiten mit .sec-Überschriften (Leistung, Daten, Profil) werden nachträglich zu Gruppen. */
function foldify(root) {
  if (!root || tab === "plan" || tab === "heute") return;
  const secs = [...root.children].filter(n => n.classList.contains("sec"));
  secs.forEach((h, i) => { const t = (h.querySelector("h2") || h).textContent.trim(), id = tab + ":" + t, o = foldOpen(id, i === 0);
    const sumEl = [...h.children].find(n => n.tagName !== "H2"); const sum = sumEl ? sumEl.outerHTML : "";
    const sec = document.createElement("section"); sec.className = "fold" + (o ? " open" : ""); sec.dataset.fold = id;
    sec.innerHTML = `<button class="fold-h" data-act="fold" data-v="${esc(id)}" aria-expanded="${o}"><span class="fold-t">${esc(t)}</span><span class="fold-s">${sumEl && !sumEl.matches("button,a") ? sumEl.innerHTML : ""}</span>${ui("chev", "fold-c")}</button><div class="fold-b"><div class="fold-i"></div></div>`;
    const inner = sec.querySelector(".fold-i"); if (sumEl && sumEl.matches("button,a")) inner.appendChild(sumEl);
    let n = h.nextElementSibling; while (n && !n.classList.contains("sec") && !n.classList.contains("nofold")) { const nx = n.nextElementSibling; inner.appendChild(n); n = nx; }
    h.replaceWith(sec); });
}
function toggleFold(id) { PREF.fold = Object.assign({}, PREF.fold || {}); const el = document.querySelector(`.fold[data-fold="${CSS.escape(id)}"]`); const o = el ? !el.classList.contains("open") : !foldOpen(id); PREF.fold[id] = o; idbPut("pref", PREF);
  if (el) { el.classList.toggle("open", o); const b = el.querySelector(".fold-h"); if (b) b.setAttribute("aria-expanded", o); } buzz(3); }

/* ---------- v3.2 Dashboard-Kacheln (3.3: als Gruppen) ---------- */
function dashGrid(c, h) {
  const t = c.t, v = verdict(c.cw), W = c.WS.weeks[c.cw - 1] || { so: 0, is: 0, keyTot: 0, keyDone: 0, sp: {} }, kg = KG();
  const tile = (cls, head, body, act, sum, ic) => { const title = head.replace(/<[^>]+>/g, ""); return fold("heute:" + title.replace(/ \d+$/, ""), title, sum || "", body + (act ? `<div class="fold-more">${act}</div>` : ""), { cls, ic }); };
  let g = "";
  // Nächste 7 Tage
  let up = ""; for (let d = t; d < t + 7; d++) { const it = dayItems(c, d).filter(s => s.sport !== "Ruhe" && !s.dropped), ab = E.absOn(ST, d, t);
    up += `<div class="up-d${d === t ? " today" : ""}"><button class="up-day" data-act="mday" data-v="${d}"><b>${esc(U.WD[U.sd(d).getUTCDay()])}</b><span>${U.sd(d).getUTCDate()}.</span></button><div class="up-it">${ab.map(a => `<span class="abpill ab-${a.kind}">${esc(E.ABS_KIND[a.kind].lab)}</span>`).join("")}${it.length ? it.map(s => { const st = s.isFree ? "✓" : E.statusOf(ST, s, t); return `<button class="up-s" data-act="sess" data-id="${esc(s.id)}" style="--c:${sp(s.sport).c}"><i></i><span>${esc(s.name.replace(/^★\s*/, ""))}</span><small>${esc(s.km ? kmStr(s.km, s.sport) : durShort(s.min))}${st === "✓" ? " ✓" : st === "✗" ? " ✗" : ""}</small></button>`; }).join("") : ab.length ? "" : `<span class="muted" style="font-size:.8125rem">Ruhetag</span>`}</div></div>`; }
  const n7 = (() => { let n = 0; for (let d = t; d < t + 7; d++) n += dayItems(c, d).filter(s => E.isTrain(s) && !s.dropped).length; return n; })();
  g += tile("t-up", `<h3>Nächste 7 Tage</h3>`, `<div class="up">${up}</div>`, `<button class="lnk" data-tab="plan">Ganzer Plan ${ui("chev")}</button>`, n7 + " Einheiten", ["cal", "var(--lane)"]);
  // Woche
  const kv = (lab, col, a, b, u) => `<div class="k"><span><i style="--c:${col}"></i>${lab}</span><b>${a}<small> / ${b}${u}</small></b></div>`;
  g += tile("t-week", `<h3>Diese Woche</h3>`, `<div class="trackcard flat">${trackSvg(W.so ? W.is / W.so : 0, W.keyTot ? W.keyDone / W.keyTot : 0, "Woche")}<div class="tstat">${kv("Stunden", "var(--tartan)", de(W.is / 60), de(W.so / 60), " h")}${kv("Schlüssel", "var(--gold-s)", W.keyDone, W.keyTot, "")}<button class="light ${v.cls}" data-act="checkin" data-w="${c.cw}"><i></i><span>${esc(v.txt)}</span></button></div></div>
    <div class="spl">${["Lauf", "Rad", "Schwimmen"].map(k => { const z = W.sp[k] || { km: 0, kmIs: 0 }; return `<span style="--c:${sp(k).c}">${icon(k)}${de(z.kmIs)}<small>/${de(z.km)} km</small></span>`; }).join("")}</div>`, "", Math.round(W.so ? W.is / W.so * 100 : 0) + " % · " + W.keyDone + "/" + W.keyTot + " Schlüssel", ["target", "var(--tartan)"]);
  // Ernährung + Tagebuch
  const N = kg ? E.dayNeeds(E.dayType(c.Ex, ST, t), kg) : null, fd = get("fd:" + t) || {}, filled = MEALS.slice(0, 4).filter(([k]) => (fd[k] || "").trim()).length;
  g += tile("t-food", `<h3>Ernährung</h3>`, N ? `<div class="food-n"><button data-act="nut" data-v="${t}"><b>${N.khT}<small> g</small></b><span>Kohlenhydrate · ${esc(N.lab)}</span></button><button data-act="nut" data-v="${t}"><b>${N.pT}<small> g</small></b><span>Eiweiß</span></button></div>
    <div class="meals">${MEALS.slice(0, 4).map(([k, lab]) => `<button class="meal${(fd[k] || "").trim() ? " on" : ""}" data-act="fd" data-v="${t}"><b>${esc(lab)}</b><span>${esc((fd[k] || "").trim() || "eintragen")}</span></button>`).join("")}</div><p class="note">${filled}/4 Mahlzeiten notiert · fließt ins Wochen-Review</p>`
    : `<button class="btn wide" data-act="kg">${ui("fork")}Gewicht eintragen für Ernährungsziele</button>`, `<button class="lnk" data-act="fd" data-v="${t}">Tagebuch ${ui("chev")}</button>`, N ? N.khT + " g KH · " + filled + "/4 notiert" : "Gewicht fehlt", ["fork", "var(--ok)"]);
  // Körper: Morgen-Check + Gewicht
  const R0 = E.morningReady(B, ST, t), WT = E.weightTrend(ST, t);
  g += tile("t-body", `<h3>Körper</h3>`, `<div class="body2"><button class="bodyb ${R0 ? R0.cls : ""}" data-act="mc" data-v="${t}"><span>Morgen-Check</span><b>${R0 ? (R0.cls === "ok" ? "Bereit" : R0.cls === "warn" ? "Gelb" : "Rot") : "Offen"}</b><small>${esc(R0 ? R0.why : "10 Sekunden, steuert den Plan")}</small></button>
    <button class="bodyb" data-act="wt"><span>Gewicht (Trend)</span><b>${WT ? de(WT.cur) + " kg" : kg ? de(kg) + " kg" : "–"}</b><small>${WT && WT.n >= 3 ? (WT.wk > 0 ? "+" : "") + de(WT.wk, 2) + " kg/Woche" : "Verlauf ab 3 Werten"}</small></button></div>`, "", R0 ? (R0.cls === "ok" ? "Bereit" : R0.cls === "warn" ? "Gelb" : "Rot") : "Morgen-Check offen", ["heart", "var(--bad)"]);
  // Fortschritt alle Disziplinen
  const D = E.disciplines(B, ST, t, c.Ex), ic = { hm: "Lauf", m: "Lauf", swim: "Schwimmen", bike: "Rad", od: "Triathlon", md: "Triathlon" };
  g += tile("t-prog", `<h3>Fortschritt</h3>`, `<div class="dmini">${D.filter(d => ["hm", "m", "swim", "bike", "md"].includes(d.key)).map(d => { const ok = d.gap != null && d.gap <= 0; return `<button class="dm" data-act="discgo" data-v="${d.key}"><span style="color:${sp(ic[d.key]).c}">${icon(ic[d.key])}</span><span class="dm-t"><b>${esc(d.lab)}</b><small>${esc(d.curTxt)}</small></span><span class="dm-g ${d.gap == null ? "" : ok ? "ok" : "warn"}">${esc(d.goalTxt || (d.goal ? U.hms(d.goal).replace(/:00$/, "") : ""))}</span></button>`; }).join("")}</div>`, `<button class="lnk" data-tab="fort">Leistung ${ui("chev")}</button>`, (D.find(d => d.key === "hm") || {}).curTxt ? "HM " + D.find(d => d.key === "hm").curTxt : "", ["prog", "var(--other)"]);
  // Abwesenheiten + Rennen
  const A = E.absences(ST, t).filter(a => (a.to != null ? a.to : t) >= t).slice(0, 3), fut = B.S.events.filter(e => e.date >= t).sort((a, b) => a.date - b.date);
  g += tile("t-abs", `<h3>Termine</h3>`, `<div class="cd" role="list">${fut.map((e, i) => `<div class="it${i ? "" : " first"}" role="listitem"><b>${e.date - t}</b><span>Tage · ${esc(String(e.name).replace("Olympische Distanz", "OD").replace("Triathlon Classic", "").replace("Marathon ", ""))}</span></div>`).join("")}</div>
    <div class="grp" style="margin-top:10px">${A.map(a => `<button class="row" data-act="abs"><span class="badge-ic" style="--c:var(--${a.kind === "krank" ? "bad" : a.kind === "urlaub" ? "gold-s" : "lane"});--t:var(--${a.kind === "krank" ? "bad-t" : a.kind === "urlaub" ? "gold" : "lane-t"})">${ui(a.kind === "krank" ? "sick" : "plane")}</span><span class="tx"><span class="t1">${esc(absLabel(a))}</span><span class="t2">${esc(absRange(a, t))}</span></span>${ui("chev", "chev")}</button>`).join("")}<button class="row" data-act="abs"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("plus")}</span><span class="tx"><span class="t1">Abwesenheit eintragen</span><span class="t2">Krank, Dienstreise, Urlaub</span></span></button></div>`, "", fut.length ? (fut[0].date - t) + " Tage bis " + String(fut[0].name).replace("Marathon ", "").replace("HM Frankfurt", "HM") : "", ["flag", "var(--gold-s)"]);
  // Nächster Test
  const nt = testGroups().filter(T => !U.RACE_TYPES.includes(T.typ)).map(T => Object.assign(T, { ed: testDate(T) })).filter(T => T.ed >= t && !testDone(T)).sort((a, b) => a.ed - b.ed)[0];
  if (nt) g += tile("t-test", `<h3>Nächster Test</h3>`, `<button class="row" data-act="test" data-k="${esc(nt.key)}" style="border-radius:12px"><span class="badge-ic" style="--c:var(--tartan);--t:var(--tartan-t)">${ui("star")}</span><span class="tx"><span class="t1">${esc(nt.name.replace(/:? ?400 m/, ""))}</span><span class="t2" style="white-space:normal">${esc(nt.how)}</span></span><span class="rv">${nt.ed - t === 0 ? "heute" : nt.ed - t}<small>${nt.ed - t === 0 ? "" : nt.ed - t === 1 ? "Tag" : "Tage"}</small></span></button>`, "", nt.ed - t === 0 ? "heute" : "in " + (nt.ed - t) + " Tagen", ["star", "var(--tartan)"]);
  // Sonntag: Check-in fällig
  const chk = get("chk:" + c.cw), due = !c.pre && U.sd(t).getUTCDay() === 0 && !(chk && num(chk.puls));
  return (due ? `<div class="prop" style="border-left-color:var(--gold-s)"><span class="k" style="color:var(--gold-ink)">${ui("heart")}Sonntag</span><h3>Check-in für Woche ${c.cw}</h3><p>Ruhepuls, Schmerz, Gefühl und dein Garmin-VO2max. Dauert 30 Sekunden und steuert die Ampel.</p><div class="acts"><button class="btn sm pri" data-act="checkin" data-w="${c.cw}">Check-in starten</button></div></div>` : "") + `<div class="folds">${g}</div>`;
}
/* ---------- Video: Vorschau, Einbettung erst nach Tippen ---------- */
function vidCard(key, lab) { const v = Library.VIDEOS[key]; if (!v) return ""; return `<button class="vthumb wide" data-act="vplay" data-v="${esc(v.id)}" aria-label="Video abspielen: ${esc(v.t)}"><span class="vt-ic">${ui("play")}</span><span><b>${esc(lab)}</b><small>Video · ${esc(v.c)}</small></span></button>`; }
function vidEmbed(btn) { const id = btn.dataset.v; if (!/^[\w-]{11}$/.test(id)) return;
  const w = document.createElement("div"); w.className = "vframe"; w.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe><a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer">In YouTube öffnen</a>`; btn.replaceWith(w); }
/* ---------- Session-Detail und Eintragen ---------- */
function sessView(id, D) {
  const c = C(), s = findS(id); if (!s) return `<div class="empty"><b>Einheit nicht gefunden</b></div>`;
  const t = c.t, S = sp(s.sport), st = s.isFree ? "✓" : E.statusOf(ST, s, t), l = s.isFree ? s : log(s), z = zoneOf(s, c);
  const head = `<div class="sh-head"><span class="badge-ic" style="--c:${S.c};--t:${S.t}">${icon(s.sport)}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">${esc(s.name.replace(/^★\s*/, ""))}</h2><p>${esc(longDate(s.date))}${s.time ? " · " + esc(s.time) : ""}</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  if (D.mode === "log") return head + logForm(s, D, c);
  if (D.mode === "miss") return head + missForm(s, D, c);
  if (s.isFree) return head + `<div class="grp"><div class="row plain"><span class="tx"><span class="t1">${esc(S.lab)}</span><span class="t2">${[s.min ? durStr(s.min) : "", s.km ? kmStr(s.km, s.sport) : "", num(s.hf) ? "Ø " + s.hf + " bpm" : "", num(s.rpe) ? "RPE " + s.rpe : "", num(s.hm) ? s.hm + " Hm" : ""].filter(Boolean).join(" · ")}</span></span></div></div>${s.note ? `<p class="note">${esc(s.note)}</p>` : ""}<div class="sh-foot"><button class="btn" data-act="freeedit" data-id="${esc(s.id)}">Bearbeiten</button><button class="btn ghost" data-act="freedel" data-id="${esc(s.id)}">${ui("trash")}Löschen</button></div>`;
  const a = E.actual(ST, s, t), doneish = st === "✓" || st === "½";
  let x = head;
  const wy = E.whyOf(s), exs = Library.exercisesFor(s);
  const zf = code => E.zone(Object.assign({}, s, { code }), B, c.R), wsteps = ["Lauf", "Rad", "Schwimmen"].includes(s.sport) ? Library.buildWorkout(s, zf, c.R.css ? c.R.css * 86400 : null) : [];
  /* Kopfzeile aus dem tatsächlichen Hauptteil, nicht nur aus dem Einheitentyp (sonst stünde beim Fahrtspiel "locker"). */
  const mains = wsteps.filter(x0 => x0.kind === "main" || x0.kind === "drill"), core = mains.length ? mains.reduce((a0, b0) => ((b0.z || 1) > (a0.z || 1) ? b0 : a0)) : wsteps.find(x0 => x0.kind === "easy") || null;
  const mainZ = core ? core.z || 1 : ({ T: 3, I: 4, HMZ: 3, MP: 2, LRM: 2, MD: 2, TEST: 4, M: 2, R3: 2, R4: 3 }[s.code] || 1);
  const easyZ = s.sport === "Lauf" ? zf("E") : null, mixed = core && wsteps.some(x0 => (x0.z || 1) === 1 && x0.kind !== "strides") && (core.z || 1) > 1;
  const headPace = core && core.target ? core.target : z.pace, headHf = core && core.hf ? core.hf : z.hf;
  x += `<div class="wkstats">${s.km ? `<div><span>Distanz</span><b>${esc(kmStr(s.km, s.sport))}</b></div>` : ""}${s.min ? `<div><span>Dauer</span><b>${esc(durStr(s.min))}</b></div>` : ""}${headPace ? `<div class="wide"><span>${mixed ? "Hauptteil" : s.sport === "Schwimmen" ? "Tempo" : s.sport === "Rad" ? "Intensität" : "Ziel"}</span><b>${esc(headPace)}</b></div>` : ""}${mixed && easyZ && easyZ.pace ? `<div class="wide"><span>Locker (Ein-/Auslaufen)</span><b>${esc(easyZ.pace)} · HF ${esc(easyZ.hf)}</b></div>` : ""}${headHf ? `<div class="wide"><span>Puls${mixed ? " Hauptteil" : ""}</span><b>${esc(headHf)}</b></div>` : ""}<div><span>Intensität</span><b class="zt z${mainZ}">${esc(Library.ZN[mainZ])}</b></div>${s.prio ? `<div><span>Priorität</span><b>${s.prio === "A" ? "Schlüssel" : s.prio === "B" ? "Wichtig" : "Optional"}</b></div>` : ""}</div>`;
  if (doneish) x += `<div class="grp" style="margin-bottom:12px"><div class="row plain"><span class="stmark ${st === "✓" ? "ok" : "half"}">${ui(st === "✓" ? "check" : "half")}</span><span class="tx"><span class="t1">${st === "✓" ? "Erledigt" : "Teilweise"}</span><span class="t2">${[durStr(a.min), a.km ? kmStr(a.km, s.sport) : "", a.km && s.sport === "Lauf" ? E.paceStr(a.min, a.km) + " /km" : "", num(l.hf) ? "Ø " + l.hf + " bpm" : "", num(l.rpe) ? "RPE " + l.rpe : ""].filter(Boolean).join(" · ")}</span></span><button class="btn sm" data-act="mode" data-v="log">Ändern</button></div></div>`;
  if (st === "✗") x += `<div class="grp" style="margin-bottom:12px"><div class="row plain"><span class="stmark miss">${ui("x")}</span><span class="tx"><span class="t1">Verpasst</span><span class="t2">${esc({ zeit: "Keine Zeit", muede: "Müde oder Schmerz", krank: "Krank", reise: "Reise" }[l.why] || "Grund offen")}</span></span><button class="btn sm" data-act="mode" data-v="miss">Ändern</button></div></div>`;
  if (s.orig) x += `<div class="banner info">${ui("info")}<div class="tx">Angepasst. Ursprünglich ${esc(s.orig.name)}${s.orig.km ? ", " + de(s.orig.km) + " km" : s.orig.min ? ", " + s.orig.min + " min" : ""}.${s.note ? " " + esc(s.note) : ""}</div></div>`;
  if (s.movedFrom) x += `<div class="banner info">${ui("move")}<div class="tx">Verschoben von ${esc(U.wdD(s.movedFrom))}.</div></div>`;
  const nach = nachOf(c, s); if (nach) x += `<div class="banner info">${ui("move")}<div class="tx">Nachgeholt am ${esc(U.wdD(nach.date))}${nach.time ? " · " + esc(nach.time) : ""}. Ergebnis wird dort eingetragen und landet beim Zurückschreiben in dieser Excel-Zeile.</div><button class="btn sm" data-act="sess" data-id="${esc(nach.id)}">Öffnen</button></div>`;
  const spk = !s.dropped && E.lrSpike(c.Ex, s); if (spk) x += `<div class="banner">${ui("info")}<div class="tx">Geplanter Sprung: +${Math.round(spk.pct * 100)} % zum längsten Lauf der 30 Tage davor (${de(spk.ref)} km). Ab 10 % steigt laut Studie das Überlastungsrisiko.</div>${infoBtn("lrspike")}</div>`;
  // Warum: sichtbar als Coach-Notiz, Quellen aufklappbar
  if (wy) x += `<div class="coachnote"><div class="cn-h">${ui("book")}<b>${esc(wy.t)}: darum geht es</b><span class="ev ev${wy.ev}" title="${esc(E.EV_LAB[wy.ev])}">${wy.ev}</span></div><p>${esc(wy.zweck)}</p><p class="dos"><b>So läufst du richtig:</b> ${esc(wy.dos)}</p>${wy.hint ? `<p class="hint">${esc(wy.hint)}</p>` : ""}<details><summary>Evidenz und Quellen</summary><p class="note">${esc(E.EV_LAB[wy.ev])}.</p><ul class="srcl">${wy.src.map(k => `<li>${esc(E.SRC[k])}</li>`).join("")}</ul></details></div>`;
  // Ablauf mit expliziten Anweisungen (3.2)
  if (wsteps.length) {
    const tot = Library.totalMin(wsteps), prof = Library.profileOf(wsteps), unit = s.sport === "Schwimmen" ? "m" : "km";
    const dsum = s.sport === "Schwimmen" ? wsteps.reduce((a0, x0) => a0 + (x0.n || 1) * (x0.m || 0), 0) : 0;
    x += `<div class="sec"><h2 style="font-size:1.0625rem">So trainierst du</h2><span class="muted" style="font-size:.8125rem">ca. ${Math.round(tot)} min${dsum ? " · " + dsum.toLocaleString("de-DE") + " m" : ""}</span></div>`;
    if (prof.length > 1) x += `<div class="wprof" role="img" aria-label="Intensitätsprofil">${prof.map(p0 => `<i class="z${p0.z}" style="flex:${Math.max(.3, p0.dur)};height:${18 + p0.z * 14}%"></i>`).join("")}</div>`;
    x += `<div class="wsteps">${wsteps.map((x0, i0) => { const meta = [];
        if (x0.m != null && !x0.n) meta.push(x0.m.toLocaleString("de-DE") + " m");
        if (x0.dist != null && s.sport === "Lauf" && x0.kind !== "strides") meta.push((x0.n ? "je " : "") + de(Math.round(x0.dist * 10) / 10) + " km");
        if (x0.dur != null && (x0.dist == null || s.sport !== "Lauf") && x0.m == null) meta.push((x0.n ? "je " : "") + (x0.dur >= 1 ? Math.round(x0.dur) + " min" : Math.round(x0.dur * 60) + " s"));
        else if (x0.dur != null && x0.kind !== "strides") meta.push("ca. " + Math.round((x0.m != null ? x0.dur : (x0.n || 1) * x0.dur)) + " min");
        const v = x0.ex && Library.VIDEOS[x0.ex];
        return `<div class="wst z${x0.z || 1}"><div class="wst-h"><span class="sn z${x0.z || 1}">${i0 + 1}</span><b>${esc(x0.lab)}</b><span class="wst-m">${esc(meta.join(" · "))}</span></div>
          <div class="wst-g">${x0.target ? `<div><span>${s.sport === "Schwimmen" ? "Tempo" : s.sport === "Rad" ? "Intensität" : "Pace"}</span><b>${esc(x0.target)}</b></div>` : ""}${x0.hf ? `<div><span>Puls</span><b>${esc(x0.hf)}</b></div>` : ""}${x0.cad ? `<div><span>Trittfrequenz</span><b>${esc(x0.cad)}</b></div>` : ""}${x0.rest ? `<div><span>Pause</span><b>${esc(x0.rest.txt)}</b></div>` : ""}</div>
          ${x0.how ? `<p>${esc(x0.how)}</p>` : ""}${v ? `<button class="vthumb" data-act="vplay" data-v="${esc(v.id)}" aria-label="Video abspielen: ${esc(v.t)}"><span class="vt-ic">${ui("play")}</span><span><b>${esc(Library.EX[x0.ex] ? Library.EX[x0.ex].n : v.t)}</b><small>Video · ${esc(v.c)}</small></span></button>` : ""}</div>`; }).join("")}</div>`;
    if (s.sport === "Lauf" && /koppel/i.test(s.name + s.desc)) x += vidCard("koppel", "Koppeltraining");
    x += `<details class="orig"><summary>Original aus dem Trainingsplan</summary><p>${esc(s.desc)}</p></details>`;
  } else if (!exs.length) x += `<p style="font-size:1rem;line-height:1.5;color:var(--ink2);margin:4px 2px 10px">${esc(s.desc)}</p>`;
  // Übungen mit Anleitung und Video
  if (exs.length) {
    x += `<div class="sec"><h2 style="font-size:1.0625rem">${s.sport === "Schwimmen" ? "Drills und Technik" : s.sport === "Lauf" ? "Technik" : "Übungen"}</h2><span class="muted" style="font-size:.8125rem">antippen für Anleitung</span></div><div class="grp">`;
    exs.forEach(k => { const e0 = Library.exercise(k), dz = Library.doseFor(s.desc, k);
      x += `<details class="exc"><summary><span class="badge-ic" style="--c:${S.c};--t:${S.t}">${icon(s.sport === "Mobility" ? "Mobility" : s.sport)}</span><span class="tx"><span class="t1">${esc(e0.n)}</span><span class="t2">${esc([dz, e0.k].filter(Boolean).join(" · "))}</span></span>${ui("chev", "chev")}</summary>
        <div class="exb"><ol>${e0.how.map(h => `<li>${esc(h)}</li>`).join("")}</ol>
        <div class="excols"><div><b>Darauf achten</b><ul>${e0.cue.map(h => `<li>${esc(h)}</li>`).join("")}</ul></div><div><b>Typische Fehler</b><ul>${e0.err.map(h => `<li>${esc(h)}</li>`).join("")}</ul></div></div>
        <p class="exwhy">${esc(e0.why)}${e0.alt ? " <b>Leichter oder ohne Gerät:</b> " + esc(e0.alt) + "." : ""}</p>
        ${e0.vid ? `<button class="vthumb" data-act="vplay" data-v="${esc(e0.vid.id)}" aria-label="Video abspielen: ${esc(e0.vid.t)}"><span class="vt-ic">${ui("play")}</span><span><b>Video ansehen</b><small>${esc(e0.vid.c)} · ${esc(e0.vid.t)}</small></span></button>` : `<a class="btn sm lane vid" href="${esc(e0.video)}" target="_blank" rel="noopener noreferrer">${ui("play")}Videos suchen</a>`}</div></details>`; });
    x += `</div>${!["Lauf", "Rad", "Schwimmen"].includes(s.sport) || !wsteps.length ? `<p class="note"><b>Plan:</b> ${esc(s.desc)}</p>` : ""}<p class="note">Videos laden erst, wenn du tippst (youtube-nocookie). Vorher geht keine Verbindung zu YouTube.</p>`;
  }
  if (s.hint) x += `<p class="note">${esc(s.hint)}</p>`;
  if (l.note) x += `<p class="note">Notiz: ${esc(l.note)}</p>`;
  // Aktionen
  const can = !s.dropped && s.date <= t && E.isTrain(s) && st !== "krank";
  if (can && !doneish && st !== "✗") x += `<div class="quick" style="margin-top:16px"><button class="btn pri" data-act="mode" data-v="log">${ui("check")}Erledigt</button><button class="btn" data-act="mode" data-v="miss">${ui("x")}Verpasst</button></div>`;
  if (s.test) x += `<button class="btn lane wide" data-act="test" data-k="${esc((B.tests.find(T => T.date + "-" + T.typ === s.tkey) || {}).key || "")}" style="margin-top:10px">${ui("star")}Testergebnis eintragen</button>`;
  const grpA = [];
  if (!s.dropped && E.isTrain(s) && (s.min >= 45 || s.test)) grpA.push(`<button class="row" data-act="fuel" data-id="${esc(s.id)}"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("fork")}</span><span class="tx"><span class="t1">Verpflegung</span><span class="t2">${s.test === "race" || (s.sport === "Lauf" && ["LR", "LRM", "M"].includes(s.code) && s.min >= 90) ? "Davor, unterwegs, danach, mit Gel- und Trinkplan" : "Davor, währenddessen, danach"}</span></span>${ui("chev", "chev")}</button>`);
  if (!s.dropped && s.date >= t && s.test !== "race" && s.sport !== "Ruhe") grpA.push(`<div class="row plain" style="gap:8px"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("move")}</span><input type="date" class="inp" id="mvdate" value="${dateVal(Math.max(t, s.date + 1))}" aria-label="Neues Datum" style="flex:1"><button class="btn sm" data-act="move" data-id="${esc(s.id)}">Verschieben</button></div>`,
    `<button class="row" data-act="drop" data-id="${esc(s.id)}"><span class="badge-ic" style="--c:var(--bad);--t:var(--bad-t)">${ui("trash")}</span><span class="tx"><span class="t1">Streichen</span><span class="t2">Fällt ersatzlos weg, rückgängig möglich</span></span></button>`);
  if (s.adj) grpA.push(`<button class="row" data-act="undoadj" data-v="${esc(s.adj)}"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("undo")}</span><span class="tx"><span class="t1">Anpassung zurücknehmen</span><span class="t2">Ursprünglichen Plan wiederherstellen</span></span></button>`);
  if (st && st !== "krank" && !s.isFree) grpA.push(`<button class="row" data-act="clearst" data-id="${esc(s.id)}"><span class="badge-ic" style="--c:var(--mute);--t:var(--fill)">${ui("undo")}</span><span class="tx"><span class="t1">Eintrag löschen</span><span class="t2">Status zurück auf offen</span></span></button>`);
  if (grpA.length) x += `<div class="grp" style="margin-top:16px">${grpA.join("")}</div>`;
  return x;
}
function prefill(s, c) {
  const l = log(s), a = E.actual(ST, s, c.t), z = zoneOf(s, c), st = E.statusOf(ST, s, c.t), had = st === "✓" || st === "½";
  return { st: st === "½" ? "½" : "✓", dur: had ? Math.round(a.min) : s.min || 30, dist: had ? a.km : s.km || 0, hf: num(l.hf) ? l.hf : null, hfmax: l.hfmax ?? null, rpe: num(l.rpe) ? l.rpe : null, feel: l.feel ?? null, shoe: l.shoe || "", hm: l.hm ?? null, pull: l.pull ?? null, note: l.note || "", hfHint: hfMid(z), more: false };
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
function rpeScale(f, v, lab) {
  const col = n => n <= 3 ? "var(--ok)" : n <= 6 ? "var(--warn)" : "var(--bad)";
  return `<div class="field"><div class="fl"><span>${lab || "Anstrengung (RPE)"}</span><b>${num(v) ? ["", "sehr leicht", "leicht", "locker", "moderat", "etwas hart", "hart", "sehr hart", "sehr hart", "maximal", "maximal"][v] : "1 leicht … 10 maximal"}</b></div><div class="scale" role="radiogroup" aria-label="${esc(lab || "Anstrengung")}">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<button type="button" role="radio" aria-checked="${v === n}" class="${v === n ? "on" : ""}" style="--sc:${col(n)}" data-act="setf" data-f="${f}" data-v="${n}">${n}</button>`).join("")}</div></div>`;
}
function logForm(s, D, c) {
  if (!D.f) D.f = prefill(s, c);
  const F = D.f, sport = s.sport, endu = ["Lauf", "Rad", "Schwimmen", "Triathlon"].includes(sport), swim = sport === "Schwimmen";
  let x = `<div class="planned" style="margin-bottom:12px"><span>Geplant ${s.km ? "<b>" + esc(kmStr(s.km, sport)) + "</b> · " : ""}<b>${esc(durStr(s.min))}</b></span>${F.hfHint ? `<span>Zone ~<b>${F.hfHint}</b> bpm</span>` : ""}</div>`;
  x += `<div class="seg" role="group" aria-label="Status" style="margin-bottom:12px"><button type="button" data-act="setf" data-f="st" data-v="✓" aria-pressed="${F.st === "✓"}">Erledigt</button><button type="button" data-act="setf" data-f="st" data-v="½" aria-pressed="${F.st === "½"}">Teilweise</button></div>`;
  x += `<div class="field"><div class="fl"><span>Dauer</span><b>min oder h:mm</b></div>${stepper("dur", fmtDurIn(F.dur), { step: 5, lab: "Dauer", mode: "numeric" })}</div>`;
  if (endu) x += `<div class="field"><div class="fl"><span>Distanz</span><b>${swim ? "Meter" : "km"}</b></div>${stepper("dist", fmtDistIn(F.dist, sport), { step: swim ? 100 : sport === "Rad" ? 5 : .5, lab: "Distanz" })}<div class="derived" id="derived" aria-live="polite">${derivedTxt(F, sport)}</div></div>`;
  if (endu && !swim) x += `<div class="field"><div class="fl"><span>Ø Herzfrequenz</span><b>bpm, optional</b></div>${stepper("hf", F.hf ?? "", { step: 1, lab: "Durchschnittspuls", mode: "numeric", ph: F.hfHint ? String(F.hfHint) : "–" })}</div>`;
  x += rpeScale("rpe", F.rpe);
  x += `<button type="button" class="more-tog" data-act="setf" data-f="more" data-v="${F.more ? 0 : 1}" aria-expanded="${!!F.more}">${F.more ? "Weniger" : "Mehr Details"}</button>`;
  if (F.more) {
    if (sport === "Lauf") x += `<div class="field"><div class="fl"><span>Max HF</span><b>optional</b></div>${stepper("hfmax", F.hfmax ?? "", { step: 1, lab: "Maximalpuls", mode: "numeric", ph: "–" })}</div>`;
    if (sport === "Rad") x += `<div class="field"><div class="fl"><span>Höhenmeter</span></div>${stepper("hm", F.hm ?? "", { step: 50, lab: "Höhenmeter", mode: "numeric", ph: "–" })}</div>`;
    if (swim) x += `<div class="field"><div class="fl"><span>Anteil mit Pullbuoy</span><b>${num(F.pull) ? F.pull + " %" : "optional"}</b></div><div class="seg">${[0, 25, 50, 75].map(n => `<button type="button" data-act="setf" data-f="pull" data-v="${n}" aria-pressed="${F.pull === n}">${n} %</button>`).join("")}</div></div>`;
    x += `<div class="field"><div class="fl"><span>Gefühl</span></div><div class="chips">${[[1, "Platt"], [2, "Müde"], [3, "Okay"], [4, "Gut"], [5, "Top"]].map(([n, lab]) => `<button type="button" class="chip" data-act="setf" data-f="feel" data-v="${n}" aria-pressed="${F.feel === n}">${lab}</button>`).join("")}</div></div>`;
    if (sport === "Lauf" && B.shoes.length) x += `<div class="field"><div class="fl"><span>Schuh</span></div><select class="inp" data-in="shoe"><option value="">Standard</option>${B.shoes.map(z => `<option${F.shoe === z.name ? " selected" : ""}>${esc(z.name)}</option>`).join("")}</select></div>`;
    x += `<div class="field"><div class="fl"><span>Notiz</span></div><textarea class="inp" data-in="note" rows="2" placeholder="Wie lief es?">${esc(F.note)}</textarea></div>`;
  }
  x += `<div class="sh-foot"><button class="btn" data-act="mode" data-v="">Abbrechen</button><button class="btn pri" data-act="savelog" data-id="${esc(s.id)}" autofocus>${ui("check")}Speichern</button></div>`;
  return x;
}
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
  const F = D.f || (D.f = { sport: "Lauf", date: today(), dur: 45, dist: null, hf: null, rpe: null, hm: null, name: "", note: "" });
  const swim = F.sport === "Schwimmen";
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:${sp(F.sport).c};--t:${sp(F.sport).t}">${icon(F.sport)}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">${D.edit ? "Training bearbeiten" : "Training hinzufügen"}</h2><p>Nicht geplant, zählt trotzdem für Umfang und Form</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<div class="chipline" style="margin-bottom:12px"><div class="chips" style="flex-wrap:nowrap">${["Lauf", "Rad", "Schwimmen", "Kraft", "Mobility", "Sonstiges"].map(k => `<button type="button" class="chip" data-act="setf" data-f="sport" data-v="${k}" aria-pressed="${F.sport === k}">${icon(k)}${sp(k).lab}</button>`).join("")}</div></div>`;
  x += `<div class="two"><div class="field"><div class="fl"><span>Datum</span></div><input type="date" class="inp" data-in="date" value="${dateVal(F.date)}"></div><div class="field"><div class="fl"><span>Name</span></div><input class="inp" data-in="name" value="${esc(F.name)}" placeholder="${F.sport === "Sonstiges" ? "z. B. Skitour" : "optional"}"></div></div>`;
  x += `<div class="field" style="margin-top:10px"><div class="fl"><span>Dauer</span><b>min oder h:mm</b></div>${stepper("dur", fmtDurIn(F.dur), { step: 5, lab: "Dauer", mode: "numeric" })}</div>`;
  if (["Lauf", "Rad", "Schwimmen", "Sonstiges"].includes(F.sport)) x += `<div class="field"><div class="fl"><span>Distanz</span><b>${swim ? "Meter" : "km"}, optional</b></div>${stepper("dist", fmtDistIn(F.dist, F.sport), { step: swim ? 100 : F.sport === "Rad" ? 5 : .5, lab: "Distanz", ph: "–" })}<div class="derived" id="derived">${derivedTxt(F, F.sport)}</div></div>`;
  if (F.sport === "Rad" || F.sport === "Sonstiges") x += `<div class="field"><div class="fl"><span>Höhenmeter</span><b>optional</b></div>${stepper("hm", F.hm ?? "", { step: 50, lab: "Höhenmeter", mode: "numeric", ph: "–" })}</div>`;
  if (!["Kraft", "Mobility"].includes(F.sport)) x += `<div class="field"><div class="fl"><span>Ø Herzfrequenz</span><b>optional</b></div>${stepper("hf", F.hf ?? "", { step: 1, lab: "Durchschnittspuls", mode: "numeric", ph: "–" })}</div>`;
  x += rpeScale("rpe", F.rpe);
  x += `<div class="sh-foot"><button class="btn" data-act="close">Abbrechen</button><button class="btn pri" data-act="savefree">${ui("check")}Speichern</button></div>`;
  return x;
}

/* ---------- Check-in ---------- */
function checkinForm(D) {
  const w = D.w, c0 = get("chk:" + w) || {}, base = num(B.S.rest) ? B.S.rest : 60;
  const F = D.f || (D.f = { puls: c0.puls ?? null, pain: c0.pain ?? null, feel: c0.feel ?? null, vo2: (E.vo2List(ST).slice(-1)[0] || {}).v ?? null, vo2touched: false });
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--tartan);--t:var(--tartan-t)">${ui("heart")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Check-in Woche ${w}</h2><p>30 Sekunden. Steuert Ampel und Vorschläge.</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<div class="field"><div class="fl"><span>Ruhepuls morgens, Ø der Woche</span><b>normal ${base}</b></div>${stepper("puls", F.puls ?? "", { step: 1, lab: "Ruhepuls", mode: "numeric", ph: String(base) })}</div>`;
  x += `<div class="field"><div class="fl"><span>${esc(B.painLabel)}</span><b>${num(F.pain) ? F.pain + " von 10" : "0 = nichts"}</b></div><div class="scale" style="grid-template-columns:repeat(11,1fr)">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<button type="button" class="${F.pain === n ? "on" : ""}" style="--sc:${n <= 2 ? "var(--ok)" : n <= 4 ? "var(--warn)" : "var(--bad)"}" data-act="setf" data-f="pain" data-v="${n}" aria-pressed="${F.pain === n}">${n}</button>`).join("")}</div></div>`;
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
sick: ["Krank: Regeln und Quellen", `<p><b>Kategorien statt Diagnosen.</b> Du wählst, was ungefähr zutrifft. Die App leitet daraus nur Trainingsregeln ab und stellt keine Diagnose.</p><p><b>Erkältung oberhalb des Halses:</b> lockeres Training bis 45 Minuten bleibt erlaubt, harte Einheiten werden entschärft. Grundlage ist der „Neck-Check“, eine verbreitete klinische Faustregel, die nicht in Studien validiert ist. Gestützt wird sie durch einen kleinen Versuch, in dem moderates Training während eines Rhinovirus-Schnupfens Dauer und Schwere nicht veränderte (Weidner et al. 1998).</p><p><b>Fieber oder Allgemeinsymptome:</b> kein Training. Der IOC-Konsens 2022 empfiehlt bei Infekten einen gestuften, symptomgeführten Wiedereinstieg und ärztliche Abklärung bei Warnzeichen wie Brustschmerz, Herzstolpern oder Atemnot. Hintergrund ist das seltene, aber ernste Risiko einer Herzmuskelbeteiligung. Die App beginnt erst nach dem Ende der Symptome und plant mindestens 5 Tage Wiedereinstieg.</p><p><b>Magen-Darm:</b> erst wieder normal essen und trinken. Flüssigkeit und Salz auffüllen. Dafür gibt es keine spezifische Studienlage, die Regel ist eine vorsichtige Ableitung.</p><p><b>Verletzung oder Schmerz:</b> Die betroffenen Sportarten werden ersetzt, zum Beispiel Laufen durch Rad bei Wade oder Fuß und Rad durch Schwimmen mit Pullbuoy beim Knie. Die Grenze „Schmerz höchstens 2 von 10, am nächsten Morgen nicht schlimmer“ ist bewusst vorsichtig gewählt. Im Schmerzmonitoring-Modell von Silbernagel et al. (2007) für die Achillessehne waren bis 5 von 10 zulässig, allerdings unter physiotherapeutischer Anleitung.</p><p><b>Wiedereinstieg in Stufen:</b> Die Gesamtdauer hängt von Kategorie und Krankheitstagen ab: Erkältung Tage + 1 (2–7), Infekt 2 × Tage (5–14), Magen-Darm Tage + 2 (3–7), Verletzung 2 × Tage (4–14). Sie ist geteilt in ca. 30 % sehr locker und kurz, 40 % locker ohne harte Reize und 30 % mit einer harten Einheit zu 80 %. Diese Aufteilung ist eine eigene Regel und keine Studienvorgabe. Sie folgt dem Prinzip des IOC-Konsenses: Steigern, solange die Symptome wegbleiben, sonst eine Stufe zurück.</p><p><b>Folgewochen:</b> Verpasstes wird nicht nachgeholt, weil Nachholen Belastung staut. Tests rücken hinter den Wiedereinstieg, denn ein Test im angeschlagenen Zustand würde deine Paces falsch kalibrieren. Rennen werden nie verschoben, die App weist nur auf das Risiko hin. Der erste Long Run danach wird gedeckelt: höchstens so lang wie der längste Lauf vor der Krankheit, nach mehr als 7 Tagen Pause höchstens 80 % davon. Das ist abgeleitet aus Frandsen et al. (2025), wonach einzelne Läufe mit mehr als 10 % über dem längsten der letzten 30 Tage das Überlastungsrisiko erhöhen.</p><p><b>Datenschutz:</b> Kategorie, Region und Warnzeichen liegen nur in der App-Datenbank auf dem Gerät und in deiner Sync- oder Sicherungsdatei. Im Excel-Protokoll stehen sie nicht.</p><p class="note">Quellen: Schwellnus M. et al. (2022), IOC consensus statement on acute respiratory illness in athletes, part 1, Br J Sports Med, <a href="https://doi.org/10.1136/bjsports-2022-105759" target="_blank" rel="noopener">doi</a>. Weidner T.G. et al. (1998), Med Sci Sports Exerc 30(11):1578–83, <a href="https://pubmed.ncbi.nlm.nih.gov/9813869/" target="_blank" rel="noopener">PubMed</a>. Silbernagel K.G. et al. (2007), Am J Sports Med 35(6):897–906. Frandsen J.S.B. et al. (2025), Br J Sports Med 59(17):1203–10, <a href="https://pubmed.ncbi.nlm.nih.gov/40623829/" target="_blank" rel="noopener">PubMed</a>. Keine ärztliche Beratung.</p>`],
travel: ["Reise: Regeln und Quellen", `<p><b>Ausstattung bestimmt den Ersatz.</b> Mit Laufstrecke bleiben Läufe draußen, auch der Long Run. Mit Laufband werden Qualitätseinheiten zu Laufband-Einheiten, ein Long Run wird auf höchstens 60 Minuten locker gekürzt oder auf einen Tag ohne Reise geschoben. Fitnessraum bedeutet Hotel-Gym und Ergometer statt Rad, Pool bedeutet Techniktraining. Gibt es nur das Zimmer, ersetzt ein Zimmer-Zirkel den lockeren Lauf und Kraft wird zur Zimmer-Kraft.</p><p><b>Laufband auf 1 % Steigung</b> gleicht den fehlenden Luftwiderstand ungefähr aus (Jones & Doust 1996). Die Pace auf dem Band ist trotzdem nicht 1:1 übertragbar, deshalb steuert die HF.</p><p><b>An- und Abreisetag nichts Hartes.</b> Reisemüdigkeit, wenig Schlaf und langes Sitzen mindern Leistung und Erholung. Der Konsens von Janse van Rensburg et al. (2021) empfiehlt Schlaf zu schützen, ausreichend zu trinken und sich zu bewegen. Pro überquerter Zeitzone in Richtung Osten rechnet er mit etwa einem Tag Anpassung, in Richtung Westen mit einem halben.</p><p><b>Schlüsseleinheiten:</b> Passt die Ausstattung, bleiben sie vor Ort, sonst rücken sie auf einen Tag ohne Reise und ohne harte Einheit derselben Sportart daneben. Gibt es keinen solchen Tag, fallen sie weg. Tests kommen nach der Reise, Rennen werden nie verschoben.</p><p><b>Danach:</b> Reisen ab 5 Tagen ohne Lauf-Möglichkeit deckeln den ersten Long Run danach (wie nach Krankheit). Kurze Pausen von wenigen Tagen kosten kaum Fitness, vor allem wenn die Intensität erhalten bleibt (Mujika & Padilla 2000). Deshalb holt die App nichts nach.</p><p class="note">Quellen: Janse van Rensburg D.C. et al. (2021), Managing Travel Fatigue and Jet Lag in Athletes, Sports Med 51:2029–50, <a href="https://doi.org/10.1007/s40279-021-01502-0" target="_blank" rel="noopener">doi</a>. Jones A.M., Doust J.H. (1996), J Sports Sci 14(4):321–7, <a href="https://pubmed.ncbi.nlm.nih.gov/8887211/" target="_blank" rel="noopener">PubMed</a>. Mujika I., Padilla S. (2000), Detraining, Sports Med 30(2):79–87. Frandsen et al. (2025), <a href="https://pubmed.ncbi.nlm.nih.gov/40623829/" target="_blank" rel="noopener">PubMed</a>. Ort und Ausstattung bleiben auf dem Gerät.</p>`],
lrspike: ["Long Run: Sprung über 10 %", `<p>Die App vergleicht jeden langen Lauf mit dem längsten Lauf der 30 Tage davor. Liegt er mehr als 10 % darüber, zeigt sie einen Hinweis.</p><p>Grundlage ist eine Kohorte mit 5.205 Läufern über 18 Monate. Einzelne Läufe mit mehr als 10 % über dem längsten Lauf der letzten 30 Tage gingen mit einem höheren Risiko für Überlastungsverletzungen einher: +64 % bei 10–30 % Sprung, +52 % bei 30–100 %, +128 % bei mehr als dem Doppelten. Wochenkennzahlen wie die Acute:Chronic Workload Ratio zeigten dort keinen klaren Zusammenhang.</p><p><b>Einordnung:</b> Das ist eine Beobachtungsstudie mit überwiegend Männern mittleren Alters und kein Beweis für Ursache und Wirkung. Die 10 % sind ein Schwellenwert aus der Auswertung, keine getestete Trainingsregel. Dein Plan liegt in 10 Wochen darüber, zum Beispiel W15 mit +18 % oder W39 mit +38 %. Er bleibt, wie er ist. Die App bietet vor diesen Läufen einen Deckel als Vorschlag an, die Entscheidung liegt bei dir.</p><p class="note">Quelle: Frandsen J.S.B. et al. (2025), How much running is too much? Br J Sports Med 59(17):1203–10, <a href="https://doi.org/10.1136/bjsports-2024-109380" target="_blank" rel="noopener">doi</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/40623829/" target="_blank" rel="noopener">PubMed</a>.</p>`],
food: ["Ernährung: Werte und Quellen", `<p><b>Tagestypen.</b> Die App ordnet jeden Tag nach geplanten Einheiten ein und gibt Kohlenhydrate (KH) und Eiweiß in g pro kg Körpergewicht an.</p><ul style="margin:0;padding-left:18px;line-height:1.6"><li>Ruhetag: 3–5 g/kg KH</li><li>Locker bis 75 min: 5–7 g/kg</li><li>Schlüsseltag (hart oder 75–150 min): 6–8 g/kg</li><li>Langer Tag (Long Run ab 90 min, Koppel, über 150 min): 8–10 g/kg</li><li>Laden vor Marathon und Mitteldistanz: 8–12 g/kg, 36–48 h vorher</li></ul><p>Die Spannen stammen aus dem Positionspapier von ACSM, Academy of Nutrition and Dietetics und Dietitians of Canada (Thomas et al. 2016) sowie aus Burke et al. (2011). Diese Quellen staffeln nach Trainingsumfang, nämlich leicht 3–5, moderat etwa 1 h am Tag 5–7, 1–3 h am Tag 6–10 und 4–5 h am Tag 8–12 g/kg. <b>Die Zuordnung zu deinen Einheitentypen ist eine eigene Ableitung.</b> Dass ein langer Tag bei 8–10 g/kg liegt, also im oberen Bereich, ist bewusst so gewählt, damit vor dem Long Run und dem Koppeltraining genug Glykogen da ist.</p><p><b>Eiweiß:</b> 1,4–2,0 g/kg am Tag. Am besten verteilt auf 3–5 Portionen zu je 0,25–0,4 g/kg, alle 3–4 Stunden (Jäger et al. 2017, Kerksick et al. 2017). Für Ausdauersportler gilt eher der untere bis mittlere Bereich, an harten Tagen der obere.</p><p><b>Beispielmahlzeiten:</b> Mischkost, Mengen werden auf dein Gewicht und das KH-Ziel skaliert. Die Nährwerte sind gerundete Tabellenwerte, die Summe liegt meist innerhalb von ±5 % zum Ziel. Eiweiß liegt in den Beispielen oft etwas über der Spanne. Das ist unkritisch, die Kohlenhydrate sind die Steuergröße.</p><p class="note">Quellen: Thomas D.T., Erdman K.A., Burke L.M. (2016), Position of the ACSM, AND and DC: Nutrition and Athletic Performance, Med Sci Sports Exerc 48(3):543–68, <a href="https://pubmed.ncbi.nlm.nih.gov/26891166/" target="_blank" rel="noopener">PubMed</a>. Burke L.M. et al. (2011), Carbohydrates for training and competition, J Sports Sci 29 Suppl 1:S17–27. Jäger R. et al. (2017), ISSN position stand: protein and exercise, JISSN 14:20, <a href="https://doi.org/10.1186/s12970-017-0177-8" target="_blank" rel="noopener">doi</a>. Kerksick C.M. et al. (2017), ISSN position stand: nutrient timing, JISSN 14:33, <a href="https://doi.org/10.1186/s12970-017-0189-4" target="_blank" rel="noopener">doi</a>. Orientierung, keine Ernährungsberatung.</p>`],
fuel: ["Verpflegung: Werte und Quellen", `<p><b>Davor:</b> Vor langen oder harten Einheiten 1–4 g/kg KH, 1–4 Stunden vorher. Die App nennt 1,5–2,5 g/kg 2–4 h vorher, am Renntag 2–3 g/kg 3 h vorher. Trinken: 5–7 ml/kg etwa 4 Stunden vorher (Sawka et al. 2007). Bei kurzen, lockeren Einheiten ist keine Vorbereitung nötig.</p><p><b>Währenddessen, Kohlenhydrate nach Dauer</b> (Jeukendrup 2014): unter 45 min keine. 45–75 min hart: Mundspülung oder wenig. 1–2,5 h: 30–60 g pro Stunde. Über 2,5 h: bis 90 g pro Stunde, dann aber nur als Glukose-Fruktose-Mischung und mit trainiertem Darm. Bei lockerer Intensität liegt die App am unteren Rand. Der Darm ist trainierbar (Jeukendrup 2017), deshalb ab W12 Gels im Long Run testen.</p><p><b>Flüssigkeit:</b> Die ACSM betont, dass eine einzige Trinkrate nicht für alle passt. Ziel ist, weniger als 2 % Körpergewicht zu verlieren, ohne mehr zu trinken, als man schwitzt, denn sonst droht eine Hyponatriämie. Die Spannen der App nach Temperatur sind Startwerte, die du mit einer Schweißrate-Messung anpasst: wiegen vor und nach 60 Minuten, 1 kg entspricht 1 l. <b>Natrium:</b> 20–30 mmol/l im Getränk (460–690 mg/l), die App rechnet daraus mg pro Stunde.</p><p><b>Danach:</b> 0,25–0,4 g/kg Eiweiß und etwa 1 g/kg KH. Folgt die nächste Einheit nach weniger als 8 Stunden, 1,0–1,2 g/kg KH pro Stunde über 4 Stunden (Thomas et al. 2016, Kerksick et al. 2017). Flüssigkeit: 1,25–1,5 l je kg Gewichtsverlust.</p><p><b>Rennen und Linz:</b> Laden 36–48 h vorher, Frühstück 3 h vorher. Unterwegs 60–90 g/h, die App startet für Linz bei 70 g/h und 25-g-Gels (neutral, ohne Marke). Koffein ist optional, 3 mg/kg, nur wenn getestet (ISSN: 3–6 mg/kg, Guest et al. 2021). Getränkestationen alle 5 km sind eine Annahme, bitte beim Veranstalter prüfen.</p><p class="note">Quellen: Jeukendrup A. (2014), A step towards personalized sports nutrition, Sports Med 44 Suppl 1:S25–33, <a href="https://pubmed.ncbi.nlm.nih.gov/24791914/" target="_blank" rel="noopener">PubMed</a>. Jeukendrup A. (2017), Training the gut for athletes, Sports Med 47 Suppl 1:101–10. Sawka M.N. et al. (2007), ACSM position stand: exercise and fluid replacement, Med Sci Sports Exerc 39(2):377–90, <a href="https://pubmed.ncbi.nlm.nih.gov/17277604/" target="_blank" rel="noopener">PubMed</a>. Thomas et al. (2016), <a href="https://pubmed.ncbi.nlm.nih.gov/26891166/" target="_blank" rel="noopener">PubMed</a>. Kerksick et al. (2017), <a href="https://doi.org/10.1186/s12970-017-0189-4" target="_blank" rel="noopener">doi</a>. Guest N.S. et al. (2021), ISSN position stand: caffeine and exercise performance, JISSN 18:1, <a href="https://doi.org/10.1186/s12970-020-00383-4" target="_blank" rel="noopener">doi</a>. Orientierung, keine medizinische Beratung.</p>`],
  mc: ["Morgen-Check: so wirkt er", `<p>Schlaf, Gefühl, Muskelkater und Ruhepuls ergeben eine Bereitschaft. <b>Grün</b> heißt Plan wie geplant. Bei <b>Gelb</b> wird die harte Einheit von heute locker, bei <b>Rot</b> auch die von morgen.</p><p><b>Punkte:</b> Ruhepuls +4 bis +6 über deinem Median der letzten 28 Tage gibt 1 Punkt, ab +7 sind es 2. Schlaf unter 6,5 h gibt 1 Punkt, unter 5,5 h 2. Gefühl „müde“ gibt 1 Punkt, „platt“ 2. Starker Muskelkater und schlechter Schlaf geben je 1 Punkt. Ab 2 Punkten steht die Ampel auf Gelb, ab 3 auf Rot.</p><p><b>Einordnung:</b> Ein erhöhter Ruhepuls am Morgen und schlechter Schlaf hängen mit Ermüdung und beginnenden Infekten zusammen. Einzelwerte schwanken aber stark. Die Schwellen sind eigene, vorsichtige Regeln und keine validierten Grenzwerte. Den Ausschlag gibt dein Trend. HRV wäre genauer, braucht aber eine tägliche Messung unter gleichen Bedingungen.</p><p class="note">Hintergrund: Buchheit M. (2014), Monitoring training status with HR measures, Front Physiol 5:73. Fullagar H.H. et al. (2015), Sleep and athletic performance, Sports Med 45(2):161–86.</p>`],
  ai: ["KI-Coach: so funktioniert er", `<p><b>Standard ist aus.</b> Die festen Regeln der App passen den Plan automatisch an. Der KI-Coach ist eine zweite Meinung für Fälle, die keine Regel abdeckt, etwa mehrere kleine Abweichungen gleichzeitig.</p><p><b>Weg A</b> kopiert eine Anfrage, die du in Claude einfügst. <b>Weg B</b> schickt sie mit deinem eigenen API-Schlüssel direkt an Anthropic (api.anthropic.com). Das kostet bei Claude Opus 5.5 einige Cent pro Anfrage.</p><p><b>Was rausgeht:</b> Planeinheiten der nächsten 14 Tage, Ist-Werte der letzten 21 Tage (Dauer, Distanz, Puls, RPE), Form, Zonen und Tage, an denen du nicht trainieren konntest, ohne Grund. <b>Was nicht rausgeht:</b> Krankheitsart, Körperregion, Warnzeichen, Reiseort, Gewicht, Notizen, Schmerzwerte.</p><p><b>Leitplanken:</b> Die App prüft jede Antwort. Ändert werden dürfen nur die nächsten 14 Tage, Tests und Rennen bleiben unberührt. Pro Woche sind höchstens 110 % Umfang erlaubt, beim Long Run höchstens +10 % zum längsten Lauf der letzten 30 Tage, insgesamt höchstens 12 Änderungen. Verstöße werden gekürzt oder verworfen und angezeigt. KI-Vorschläge gelten erst nach deiner Bestätigung und lassen sich zurücknehmen.</p><p class="note">KI kann sich irren. Die Regeln der App bleiben das Sicherheitsnetz. Keine medizinische Beratung.</p>`],
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
   <p class="note" style="display:flex;gap:8px">${ui("shield")}<span>Bleibt auf dem Gerät und in deiner Sicherungsdatei. Kein Excel-Export.</span></p>
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
  x += `<p class="note" style="display:flex;gap:8px">${ui("shield")}<span>Bleibt auf dem Gerät. Beim Zurückschreiben landet es im Blatt „App-Tagebuch“ der Excel, damit Claude es im Wochen-Review mit auswerten kann.</span></p>`;
  x += `<div class="sh-foot"><button class="btn" data-act="nut" data-v="${d}">Empfehlung</button><button class="btn pri" data-act="savefd" data-v="${d}">${ui("check")}Speichern</button></div>`;
  return x;
}
/* ---------- Plan ---------- */
const PHASE_COL = p => /Wiedereinstieg|Basis/i.test(p) ? "var(--swim)" : /Aufbau|Marathon-Aufbau|Build/i.test(p) ? "var(--run)" : /Peak|Spezif|Allgäu|Renn/i.test(p) ? "var(--tartan)" : /Taper|Entlast|Übergang|Erhol/i.test(p) ? "var(--gold-s)" : /Tri/i.test(p) ? "var(--bike)" : "var(--mob)";
function weekDots(c, d) {
  return dayItems(c, d).filter(s => s.sport !== "Ruhe" && !s.dropped).map(s => { const st = s.isFree ? "✓" : E.statusOf(ST, s, c.t); return `<i class="${st === "✓" || st === "½" ? "" : "o"}" style="--c:${sp(s.sport).c}"></i>`; }).join("");
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
  let x = `<div class="wkhead"><button class="iconbtn" data-act="wk" data-v="${w - 1}" ${w <= 1 ? "disabled" : ""} aria-label="Vorwoche">${ui("back")}</button><div class="mid"><b>Woche ${w}</b><span>${esc(shortDate(ws))} – ${esc(shortDate(ws + 6))}${ph ? " · " + esc(ph) : ""}</span></div><button class="iconbtn" data-act="wk" data-v="${w + 1}" ${w >= c.NW ? "disabled" : ""} aria-label="Nächste Woche">${ui("chev")}</button></div>`;
  if (w !== c.cw) x += `<p style="text-align:center;margin:-6px 0 10px"><button class="lnk" data-act="wk" data-v="${c.cw}">Zur aktuellen Woche</button></p>`;
  const pw = E.phaseWhy(ph); if (pw) x += `<details class="why" style="margin-bottom:12px"><summary>${ui("book")}<span>Phase: ${esc(ph.replace(/\s*\(E\)\s*$/, ""))}${/\(E\)/.test(ph) ? " · Entlastungswoche" : ""}</span><span class="ev ev${pw.ev}">${pw.ev}</span></summary><p>${esc(pw.zweck)}${/\(E\)/.test(ph) ? " Entlastungswoche: weniger Umfang, damit sich die Anpassungen der letzten Wochen festigen." : ""}</p><p class="note">Evidenz: ${esc(E.EV_LAB[pw.ev])}. Quellen: ${esc(pw.src.map(k => E.SRC[k]).join(" · "))}</p></details>`;
  x += `<div class="wkbars" id="wkswipe">${[0, 1, 2, 3, 4, 5, 6].map(i => { const d = ws + i, tst = dayItems(c, d).some(s => s.test); return `<button data-act="day" data-v="${d}" aria-pressed="${d === c.t}" class="${tst ? "isT" : ""}" aria-label="${esc(longDate(d))}"><span class="wd">${U.WD[U.sd(d).getUTCDay()]}</span><span class="dn">${U.sd(d).getUTCDate()}</span><span class="dots">${weekDots(c, d)}</span></button>`; }).join("")}</div>`;
  const kv = (l, v, s) => `<div class="kpi"><div class="kl">${l}</div><div class="kv">${v}</div>${s ? `<div class="ks">${s}</div>` : ""}</div>`;
  x += `<div class="kpis" style="margin-top:0">${kv("Stunden", `${de(W.is / 60)}<small>/ ${de(W.so / 60)} h</small>`, W.past || W.cur ? Math.round(W.fulfil * 100) + " % erfüllt" : "geplant")}${kv("Schlüssel", `${W.keyDone}<small>/ ${W.keyTot}</small>`, "")}${["Lauf", "Rad", "Schwimmen"].filter(k => W.sp && W.sp[k]).map(k => kv(`<span style="color:${sp(k).c}">${icon(k)}</span>${sp(k).lab}`, `${k === "Schwimmen" ? Math.round(W.sp[k].kmIs * 1000).toLocaleString("de-DE") : de(W.sp[k].kmIs)}<small>/ ${k === "Schwimmen" ? Math.round(W.sp[k].km * 1000).toLocaleString("de-DE") + " m" : de(W.sp[k].km) + " km"}</small>`, "")).join("")}</div>`;
  for (let i = 0; i < 7; i++) { const d = ws + i, it = dayItems(c, d), rest = it.length && it.every(s => s.sport === "Ruhe");
    const ab = E.absOn(ST, d, c.t);
    x += `<div class="dayhead${d === c.t ? " today" : ""}"><b>${esc(dayLabel(d, c.t) === U.WDL[U.sd(d).getUTCDay()] ? U.WDL[U.sd(d).getUTCDay()] : dayLabel(d, c.t))}</b>${ab.map(a => `<button class="abpill ab-${a.kind}" data-act="abs">${ui(a.kind === "krank" ? "sick" : "plane")}${esc(absLabel(a))}</button>`).join("")}<span>${esc(U.wdD(d))}</span></div>`;
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

/* Tagesblatt (aus Monat und Saison): alle Einheiten des Tages antippbar, Wochen-Sprung, Ernährung */
function daySheet(D) {
  const c = C(), d = D.d, it = dayItems(c, d).filter(s => s.sport !== "Ruhe"), ph = (B.weeks[E.weekOf(B, d)] || {}).phase || "";
  const rest = dayItems(c, d).find(s => s.sport === "Ruhe");
  let x = `<div class="sh-head"><div class="tx"><h2 class="sheet-title" tabindex="-1">${esc(longDate(d))}</h2><p>Woche ${E.weekOf(B, d)}${ph ? " · " + esc(ph.replace(/\s*\(E\)\s*$/, "")) : ""}</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  const abD = E.absOn(ST, d, c.t); if (abD.length) x += abD.map(a => `<div class="banner ${a.kind === "krank" ? "err" : "info"}">${ui(a.kind === "krank" ? "sick" : "plane")}<div class="tx"><b>${esc(absLabel(a))}</b> ${esc(absRange(a, c.t))}</div><button class="btn sm" data-act="abs">Ändern</button></div>`).join("");
  x += `<div class="dnav"><button class="iconbtn" data-act="dsh" data-v="${d - 1}" aria-label="Vortag">${ui("back")}</button><span>${esc(dayLabel(d, c.t))}</span><button class="iconbtn" data-act="dsh" data-v="${d + 1}" aria-label="Nächster Tag">${ui("chev")}</button></div>`;
  x += it.length ? `<div class="grp">${it.map(s => sessRow(s, c, { noSwipe: true })).join("")}</div>` : `<div class="grp"><div class="row plain"><span class="badge-ic" style="--c:var(--rest);--t:var(--rest-t)">${icon("Ruhe")}</span><span class="tx"><span class="t1">Ruhetag</span><span class="t2" style="white-space:normal">${esc((rest && rest.desc) || "Erholung ist Training.")}</span></span></div></div>`;
  if (KG()) { const N = E.dayNeeds(E.dayType(c.Ex, ST, d), KG()); x += `<div class="grp" style="margin-top:12px"><button class="row" data-act="nut" data-v="${d}"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("fork")}</span><span class="tx"><span class="t1">${esc(N.lab)}: ${N.khT} g KH · ${N.pT} g Eiweiß</span><span class="t2">Beispielmahlzeiten</span></span>${ui("chev", "chev")}</button></div>`; }
  x += `<div class="sh-foot"><button class="btn" data-act="mday2w" data-v="${d}">Woche ${E.weekOf(B, d)} öffnen</button><button class="btn ink" data-act="close">Fertig</button></div>`;
  return x;
}
function vMonth(c) {
  const base = planMonth != null ? planMonth : (() => { const d = U.sd(c.t); return d.getUTCFullYear() * 12 + d.getUTCMonth(); })();
  const y = Math.floor(base / 12), m = base % 12, first = U.serialOf(new Date(y, m, 1, 12)), days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const lead = (U.sd(first).getUTCDay() + 6) % 7, start = first - lead, cells = Math.ceil((lead + days) / 7) * 7;
  let x = `<div class="wkhead"><button class="iconbtn" data-act="mon" data-v="${base - 1}" aria-label="Vormonat">${ui("back")}</button><div class="mid"><b>${MON[m]} ${y}</b><span>Tag antippen für Details</span></div><button class="iconbtn" data-act="mon" data-v="${base + 1}" aria-label="Nächster Monat">${ui("chev")}</button></div>`;
  x += `<div class="month"><div class="mh">${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => `<span>${d}</span>`).join("")}</div><div class="mg">`;
  for (let i = 0; i < cells; i++) { const d = start + i, it = dayItems(c, d), out = U.sd(d).getUTCMonth() !== m, race = it.some(s => s.test === "race"), ab = E.absOn(ST, d, c.t), a0 = ab[0];
    const abCls = a0 ? " ab-" + a0.kind : "";
    x += `<button class="md${out ? " out" : ""}${d === c.t ? " today" : ""}${race ? " race" : ""}${abCls}" data-act="mday" data-v="${d}" aria-label="${esc(longDate(d) + (a0 ? ", " + E.ABS_KIND[a0.kind].lab : ""))}"><b>${U.sd(d).getUTCDate()}</b><span class="dots">${weekDots(c, d)}</span>${a0 ? `<span class="abbar"></span>` : ""}</button>`; }
  x += `</div></div><div class="legend">${["Lauf", "Rad", "Schwimmen", "Kraft"].map(k => `<span><i style="--c:${sp(k).c}"></i>${sp(k).lab}</span>`).join("")}<span><i style="--c:var(--gold)"></i>Rennen</span><span><i style="--c:var(--lane)"></i>Dienstreise</span><span><i style="--c:var(--gold-s)"></i>Urlaub</span><span><i style="--c:var(--bad)"></i>Krank</span><span>gefüllt = erledigt</span></div>`;
  return x;
}
function vSeason(c) {
  const WS = c.WS, NW = c.NW, mx = Math.max(...WS.weeks.map(w => Math.max(w.so, w.is))) || 1;
  const done = WS.weeks.filter(w => w.past), ful = done.length ? done.reduce((a, w) => a + w.is, 0) / Math.max(1, done.reduce((a, w) => a + w.so, 0)) : null;
  const tot = ["Lauf", "Rad", "Schwimmen"].map(k => ({ k, is: WS.weeks.reduce((a, w) => a + ((w.sp[k] || {}).kmIs || 0), 0), so: WS.weeks.reduce((a, w) => a + ((w.sp[k] || {}).km || 0), 0) }));
  const hrs = WS.weeks.reduce((a, w) => a + w.is, 0) / 60;
  const nx = B.S.events.filter(e => e.date >= c.t).sort((a, b) => a.date - b.date)[0];
  let x = `<div class="kpis" style="margin-top:0"><button class="kpi" data-act="info" data-v="cons"><span class="info">${ui("info")}</span><div class="kl">Erfüllung</div><div class="kv">${ful == null ? "–" : Math.round(ful * 100)}<small>%</small></div><div class="ks ${ful == null ? "" : ful >= .9 ? "ok" : ful >= .7 ? "warn" : "bad"}">${ful == null ? "ab Woche 2" : ful >= .9 ? "Stark" : ful >= .7 ? "Solide" : "Lücken"}</div></button>
    <button class="kpi" data-act="info" data-v="cons"><span class="info">${ui("info")}</span><div class="kl">Serie</div><div class="kv">${WS.streak}<small>${WS.streak === 1 ? " Woche" : " Wochen"}</small></div><div class="ks">≥ 80 % Schlüssel</div></button>
    <div class="kpi"><div class="kl">Trainiert</div><div class="kv">${de(hrs, 0)}<small> h</small></div><div class="ks">${tot.map(t => sp(t.k).lab.slice(0, 4) + ". " + de(t.is, 0)).join(" · ")} km</div></div>
    <div class="kpi"><div class="kl">Nächstes Rennen</div><div class="kv">${nx ? nx.date - c.t : "–"}<small> Tage</small></div><div class="ks">${nx ? esc(String(nx.name).replace("Olympische Distanz", "OD")) : "–"}</div></div></div>`;
  // Heatmap
  const Hh = 92;
  x += `<div class="sec"><h2>Saison</h2><span class="muted" style="font-size:.8125rem">antippen = Woche</span></div><div class="season">`;
  x += `<div class="rl">${B.S.events.map(e => { const wi = (e.date - B.S.start) / 7; if (wi < 0 || wi > NW) return ""; const pc = (wi + .5) / NW * 100; return `<span class="fl${B.S.events.indexOf(e) % 2 ? " lo" : ""}" style="left:${pc}%;${pc > 92 ? "transform:translateX(-85%)" : ""}">${ui("flag")}${esc(String(e.name).replace("Olympische Distanz", "OD").replace("Allgäu Triathlon Classic", "Allgäu").replace("Marathon ", "").replace("HM Frankfurt", "HM"))}</span>`; }).join("")}</div>`;
  x += `<div class="heat">${WS.weeks.map(w => { const h = Math.max(4, w.so / mx * Hh), ih = w.so ? Math.min(1, w.is / w.so) : 0, ph = (B.weeks[w.w] || {}).phase || "", tst = c.Ex.some(s => s.w === w.w && s.test === "test");
    const sports = ["Lauf", "Rad", "Schwimmen"].map(k => { const z = w.sp[k]; if (!z || !z.so) return `<span class="cell"></span>`; const f = w.past || w.cur ? Math.min(1, z.is / z.so) : 0; return `<span class="cell" style="background:color-mix(in srgb,${sp(k).c} ${w.past || w.cur ? Math.round(18 + 82 * f) : 14}%,var(--fill))" title="${sp(k).lab} ${Math.round(f * 100)} %"></span>`; }).join("");
    return `<button class="col${w.cur ? " cur" : ""}" data-act="wkgo" data-v="${w.w}" aria-label="Woche ${w.w}, ${de(w.so / 60)} Stunden geplant, ${de(w.is / 60)} absolviert"><span class="bar" style="height:${h}px"><i style="height:${(w.past || w.cur ? ih : 0) * 100}%;${!w.past && !w.cur ? "" : ih < .7 && w.past ? "background:var(--warn)" : ""}"></i></span>${sports}<span class="ph" style="background:${PHASE_COL(ph)}" title="${esc(ph)}"></span>${tst ? `<span style="height:5px;border-radius:50%;width:5px;margin:0 auto;background:var(--tartan)"></span>` : `<span style="height:5px"></span>`}</button>`; }).join("")}</div>`;
  x += `<div class="lab">${WS.weeks.filter(w => (w.w - 1) % 8 === 0 && w.w < NW - 4).map(w => `<span>${esc(MONS[U.sd(w.start).getUTCMonth()] + " " + String(U.sd(w.start).getUTCFullYear()).slice(2))}</span>`).join("")}</div></div>`;
  x += `<div class="legend"><span><i style="--c:var(--fill2)"></i>Soll h</span><span><i style="--c:var(--ink)"></i>Ist</span>${["Lauf", "Rad", "Schwimmen"].map(k => `<span><i style="--c:${sp(k).c}"></i>${sp(k).lab}</span>`).join("")}<span><i style="--c:var(--tartan);border-radius:50%"></i>Test</span></div>`;
  // Phasen
  const phs = []; for (let w = 1; w <= NW; w++) { const raw = (B.weeks[w] || {}).phase || "", p = raw.replace(/\s*\(E\)\s*$/, ""), en = raw !== p; if (!phs.length || phs[phs.length - 1].p !== p) phs.push({ p, a: w, b: w, e: en ? 1 : 0 }); else { phs[phs.length - 1].b = w; if (en) phs[phs.length - 1].e++; } }
  x += `<div class="sec"><h2>Phasen</h2></div><div class="grp">${phs.map(p => `<button class="row" data-act="wkgo" data-v="${p.a}"><span class="badge-ic" style="--c:#fff;--t:${PHASE_COL(p.p)}"><span class="num" style="font-weight:700;font-size:.8125rem">${p.a}</span></span><span class="tx"><span class="t1">${esc(p.p || "Phase")}</span><span class="t2">W${p.a}${p.b > p.a ? "–" + p.b : ""} · ab ${esc(shortDate(B.S.start + 7 * (p.a - 1)))}${p.e ? " · " + p.e + " Entlastungswoche" + (p.e > 1 ? "n" : "") : ""}</span></span>${c.cw >= p.a && c.cw <= p.b ? '<span class="tag key">jetzt</span>' : ""}${ui("chev", "chev")}</button>`).join("")}</div>`;
  // Summen
  x += `<div class="sec"><h2>Saisonsummen</h2></div><div class="grp">${tot.map(t => `<div class="row plain"><span class="badge-ic" style="--c:${sp(t.k).c};--t:${sp(t.k).t}">${icon(t.k)}</span><span class="tx"><span class="t1">${sp(t.k).lab}</span><span class="t2">Plan ${t.k === "Schwimmen" ? de(t.so, 1) : Math.round(t.so)} km</span></span><span class="rv">${t.k === "Schwimmen" ? de(t.is, 1) : de(t.is, 0)} km</span></div>`).join("")}</div>`;
  return x;
}

/* ---------- Fortschritt ---------- */
let progRange = "saison";
function vProg(c) {
  const t = c.t, F = c.F, TR = c.TR, R = c.R, today = F.find(x => x.d === t) || F[F.length - 1];
  const vo2 = TR.vo2, vd = TR.vdot, tg = E.vdotTargets(B), lastVo2 = vo2.slice(-1)[0], lastVd = vd.slice(-1)[0];
  const tsbTxt = !today ? "" : today.tsb > 5 ? ["frisch", "ok"] : today.tsb > -10 ? ["ausgewogen", "ok"] : today.tsb > -25 ? ["im Aufbau", "warn"] : ["sehr müde", "bad"];
  let x = `<header class="lt"><div><div class="eyebrow">Prognose, Verbesserungen, Form</div><h1>Leistung</h1></div><div class="acts"><button class="iconbtn" data-act="vo2" aria-label="VO2max eintragen">${ui("plus")}</button></div></header>`;
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
  x += `<div class="sec"><h2>Aktivitäten</h2><div class="seg" style="width:auto">${[[28, "4 W"], [90, "3 M"], [400, "Saison"]].map(([d, l]) => `<button data-act="ddays" data-v="${d}" aria-pressed="${dataDays === d}">${l}</button>`).join("")}</div></div>`;
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
const AION = () => get("set:ai") === true;
function aiSheet(D) {
  if (!AION()) return `<div class="sh-head"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("sync")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">KI-Coach</h2><p>Zweite Meinung zu deinem Plan</p></div>${infoBtn("ai")}<button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>
    <div class="grp"><div class="row plain"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("check")}</span><span class="tx"><span class="t1">Was er macht</span><span class="t2" style="white-space:normal">Prüft deine letzten 21 Tage und die nächsten 14 Tage und schlägt Änderungen vor, etwa bei Ermüdung, vielen kleinen Ausfällen oder nach Reisen. Du bestätigst jede Änderung.</span></span></div>
    <div class="row plain"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("shield")}</span><span class="tx"><span class="t1">Was er sieht</span><span class="t2" style="white-space:normal">Plan, Dauer, Distanz, Puls, RPE, Form und Abwesenheitstage ohne Grund. Nicht: Krankheitsart, Hotel, Gewicht, Notizen, Schmerz.</span></span></div>
    <div class="row plain"><span class="badge-ic" style="--c:var(--gold-s);--t:var(--gold)">${ui("info")}</span><span class="tx"><span class="t1">Zwei Wege</span><span class="t2" style="white-space:normal">Kostenlos über Claude im Chat (kopieren und einfügen) oder direkt mit eigenem Anthropic-API-Schlüssel (wenige Cent pro Anfrage).</span></span></div></div>
    <p class="note">Die festen Regeln der App passen den Plan schon automatisch an. Der KI-Coach ist eine Ergänzung.</p>
    <div class="sh-foot"><button class="btn" data-act="close">Später</button><button class="btn pri" data-act="aion">${ui("check")}Einschalten</button></div>`;
  const c = C(), pk = D.pk || (D.pk = E.aiPacket(B, ST, c.t, c.Ex)), key = PREF.aikey || "", model = PREF.aimodel || "claude-opus-5-5";
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("sync")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">KI-Coach</h2><p>Prüft die nächsten 14 Tage. Du bestätigst jede Änderung.</p></div>${infoBtn("ai")}<button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  if (D.res) { const r = D.res;
    if (!r.ok) x += `<div class="banner err">${ui("info")}<div class="tx">${esc(r.errs.join(" "))}</div></div>`;
    else { x += `<article class="prop info"><span class="k">${ui("sync")}Vorschlag KI-Coach</span><h3>${esc(r.p.title)}</h3><p>${esc(r.p.why)}</p>${r.p.lines.length ? `<ul>${r.p.lines.map(l => `<li>${ui(/entfällt/.test(l) ? "x" : / neu$/.test(l) ? "plus" : "move")}<span>${esc(l)}</span></li>`).join("")}</ul>` : ""}${r.errs.length ? `<p class="note">Leitplanken: ${esc(r.errs.join(" · "))}</p>` : ""}<div class="acts">${r.p.ops.length ? `<button class="btn lane sm" data-act="aiaccept">Übernehmen</button>` : ""}<button class="btn ghost sm" data-act="aireset">Verwerfen</button></div></article>`; }
  }
  x += `<div class="grp"><div class="row plain"><span class="tx"><span class="t1">Im Paket</span><span class="t2" style="white-space:normal">${pk.plan_14_tage.length} geplante Einheiten, ${pk.ist_21_tage.length + pk.frei_21_tage.length} Einträge der letzten 21 Tage, Form, Zonen, Abwesenheitstage ohne Grund. Nicht enthalten: Krankheitsart, Reiseort, Gewicht, Notizen, Schmerz.</span></span></div></div>`;
  x += `<div class="sec"><h2 style="font-size:1rem">Weg A: mit Claude im Chat</h2></div><div class="grp"><button class="row" data-act="aicopy"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("file")}</span><span class="tx"><span class="t1">Anfrage kopieren</span><span class="t2">Anweisung und Daten, in Claude einfügen</span></span></button></div>
    <div class="field" style="margin-top:10px"><div class="fl"><span>Antwort einfügen</span><b>JSON aus dem Chat</b></div><textarea class="inp" data-in="airesp" rows="4" placeholder='{"zusammenfassung": "...", "aenderungen": [...]}'>${esc(D.f && D.f.airesp || "")}</textarea><button class="btn sm" data-act="aicheck">${ui("check")}Prüfen</button></div>`;
  x += `<div class="sec"><h2 style="font-size:1rem">Weg B: direkt mit eigenem API-Schlüssel</h2></div>`;
  x += key ? `<div class="grp"><button class="row" data-act="aiask" ${D.busy ? "disabled" : ""}><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("sync")}</span><span class="tx"><span class="t1">${D.busy ? "Frage KI …" : "Jetzt fragen"}</span><span class="t2">${esc(model)} · Schlüssel …${esc(key.slice(-4))} · wenige Cent pro Anfrage</span></span></button></div>`
    : `<p class="note">Kein Schlüssel hinterlegt. Unter Profil, KI-Coach eintragen. Ohne Schlüssel funktioniert Weg A.</p>`;
  x += `<div class="sh-foot"><button class="btn ink" data-act="close">Fertig</button></div>`;
  return x;
}
function aiKeySheet(D) {
  const F = D.f || (D.f = { aikey: PREF.aikey || "", aimodel: PREF.aimodel || "claude-opus-5-5" });
  return `<div class="sh-head"><div class="tx"><h2 class="sheet-title" tabindex="-1">API-Schlüssel</h2><p>Nur für Weg B. Bleibt auf diesem Gerät.</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>
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
function syncPill() { return `<button class="syncpill ${syncState === "ok" ? "ok" : syncState === "wait" ? "wait" : syncState === "err" ? "err" : ""}" data-act="synctap" title="${esc(syncMsg)}"><i></i>${syncState === "ok" ? "Synchron" : syncState === "wait" ? "Freigeben" : syncState === "err" ? "Sync prüfen" : "Lokal"}</button>`; }
function vProf(c) {
  const adj = Object.keys(ST).filter(k => k.startsWith("adj:")).map(k => ST[k].v).filter(Boolean).sort((a, b) => b.created - a.created);
  const trv = Object.keys(ST).filter(k => k.startsWith("trv:")).map(k => [k, ST[k].v]).filter(([, v]) => v && !v.del && v.to >= c.t - 30).sort((a, b) => a[1].from - b[1].from);
  const sick = get("sick"), sickNow = sick && num(sick.from) && !num(sick.to), standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone, ios = /iPhone|iPad/.test(navigator.userAgent);
  const row = (ic, col, t1, t2, act, extra) => `<button class="row" data-act="${act}" ${extra || ""}><span class="badge-ic" style="--c:${col};--t:color-mix(in srgb,${col} 14%,var(--surface))">${ui(ic)}</span><span class="tx"><span class="t1">${t1}</span>${t2 ? `<span class="t2">${t2}</span>` : ""}</span>${ui("chev", "chev")}</button>`;
  let x = `<header class="lt"><div><div class="eyebrow">Einstellungen und Daten</div><h1>Profil</h1></div></header>`;
  x += `<div class="prof-hero"><span class="av tiger"><img src="triger.svg" alt=""></span><div class="tx" style="flex:1"><b style="font-size:1.0625rem">Saison 2026/27</b><div class="muted" style="font-size:.8125rem">${B.plan.length} Einheiten · Plan vom ${new Date(B.importedAt).toLocaleDateString("de-DE")}</div></div>${syncPill()}</div>`;
  if (!standalone) x += `<div class="banner info" style="margin-top:12px">${ui("down")}<div class="tx"><b>Als App installieren.</b> ${ios ? "Safari: Teilen, dann Zum Home-Bildschirm." : "Chrome: Menü ⋮, Speichern und teilen, Seite als App installieren."}</div></div>`;
  const absN = E.absences(ST, c.t).filter(a => (a.to != null ? a.to : c.t) >= c.t).length;
  x += `<div class="sec"><h2>Unterwegs und krank</h2></div><div class="grp">${row("cal", "var(--lane)", "Alle Abwesenheiten", absN ? absN + " aktuell oder geplant" : "Liste, bearbeiten, löschen", "abs")}${row("plane", "var(--lane)", "Reise eintragen", trv.length ? trv.map(([, v]) => U.fmtD(v.from) + "–" + U.fmtD(v.to) + (v.eq ? " (" + E.eqText(E.tripEq(v)) + ")" : "")).join(", ") : "Dienstreise mit Ausstattung, Ersatzeinheiten", "travel")}
    ${row("sick", "var(--bad)", sickNow ? "Wieder gesund" : "Ich bin krank", sickNow ? ((E.SICK_CAT[sick.cat] || {}).short || "Krank") + " seit " + U.wdD(sick.from) : "Kategorie wählen, Wiedereinstieg in Stufen", sickNow ? "sickend" : "sick")}</div>`;
  x += `<div class="sec"><h2>Coach</h2></div><div class="grp"><div class="row plain"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("sync")}</span><span class="tx"><span class="t1">Automatisch anpassen</span><span class="t2" style="white-space:normal">${AUTO() ? "An: Regeln wirken sofort, Tests und Rennen fragen nach" : "Aus: jeder Vorschlag braucht deine Bestätigung"}</span></span><button class="switch" role="switch" aria-checked="${AUTO()}" aria-label="Automatisch anpassen" data-act="autotog"><i></i></button></div>
    <div class="row plain"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("sync")}</span><span class="tx"><span class="t1">KI-Coach</span><span class="t2" style="white-space:normal">${AION() ? "An: Prüfung der nächsten 14 Tage auf Knopfdruck" : "Aus: keine Daten verlassen das Gerät"}</span></span><button class="switch" role="switch" aria-checked="${AION()}" aria-label="KI-Coach" data-act="aitog"><i></i></button></div>
    ${AION() ? `<button class="row" data-act="ai"><span class="badge-ic" style="--c:var(--ok);--t:var(--ok-t)">${ui("check")}</span><span class="tx"><span class="t1">Plan jetzt prüfen lassen</span><span class="t2">Vorschlag mit Leitplanken, du bestätigst</span></span>${ui("chev", "chev")}</button><button class="row" data-act="aikey"><span class="badge-ic" style="--c:var(--mute);--t:var(--fill)">${ui("shield")}</span><span class="tx"><span class="t1">API-Schlüssel (optional)</span><span class="t2">${PREF.aikey ? "Hinterlegt …" + esc(PREF.aikey.slice(-4)) : "Nicht hinterlegt, Weg A genügt"}</span></span>${ui("chev", "chev")}</button>` : ""}</div>`;
  x += `<div class="sec"><h2>Anpassungen</h2><span class="muted" style="font-size:.8125rem">${adj.filter(a => !a.undone).length} aktiv</span></div><div class="grp">${adj.length ? adj.slice(0, 8).map(a => `<div class="row plain" style="${a.undone ? "opacity:.5" : ""}"><span class="tx"><span class="t1">${esc(a.title)}</span><span class="t2">${new Date(a.created).toLocaleDateString("de-DE")}${a.auto ? " · automatisch" : ""}${a.undone ? " · zurückgenommen" : ""}</span></span><button class="btn sm ghost" data-act="${a.undone ? "redoadj" : "undoadj"}" data-v="${esc(a.id)}">${a.undone ? "Anwenden" : "Zurück"}</button></div>`).join("") : `<div class="empty">Noch keine Anpassungen.</div>`}</div>`;
  const linz = c.Ex.find(s => s.test === "race" && s.typ === "M" && s.date >= c.t);
  x += `<div class="sec"><h2>Ernährung</h2></div><div class="grp">${row("fork", "var(--ok)", "Körpergewicht", KG() ? de(KG()) + " kg" : "Noch nicht eingetragen", "kg")}${row("fork", "var(--ok)", "Ernährung heute", "Tagesbedarf und Beispielmahlzeiten", "nut", `data-v="${c.t}"`)}${linz ? row("flag", "var(--gold-s)", "Verpflegungsplan " + esc(linz.name.replace(/^★\s*/, "").replace(/^Marathon\s*/, "")), "Gel- und Trinkplan für das Rennen", "fuel", `data-id="${esc(linz.id)}"`) : ""}${row("book", "var(--ok)", "Ernährung: Quellen", "ACSM, IOC, ISSN", "info", 'data-v="food"')}</div>`;
  x += `<div class="sec"><h2>Mac und iPhone</h2></div><div class="grp">${FSA ? (H.sync ? row("sync", "var(--ok)", "Jetzt abgleichen", esc(syncMsg + " · " + H.sync.name), "syncnow") + row("x", "var(--mute)", "Sync trennen", "Datei bleibt erhalten", "syncoff") : row("sync", "var(--lane)", "Sync-Datei anlegen", "Einmal in iCloud Drive speichern, danach automatisch", "synccreate") + row("file", "var(--lane)", "Vorhandene Sync-Datei wählen", "", "syncopen"))
    : row("down", "var(--lane)", "Stand laden", "Sync-Datei aus iCloud Drive öffnen", "loadjson") + row("up", "var(--lane)", "Stand sichern", "In Dateien sichern und ersetzen", "sharejson")}</div>`;
  x += `<div class="sec"><h2>Export</h2></div><div class="grp">${row("cal", "var(--tartan)", "Kalender (.ics)", "Ab heute, inklusive Anpassungen", "ics")}${H.xl ? row("file", "var(--ok)", "Excel verbunden: " + H.xl.name, xlLine(), "wb") + row("x", "var(--mute)", "Verbindung trennen", "Die Datei bleibt, wie sie ist", "xloff") : XL_OK ? row("file", "var(--ok)", "Excel verbinden", "Einmal die Datei im Ordner wählen, danach speichert die App selbst", "xlpick") : ""}${H.xl ? "" : row("file", "var(--ok)", "Zurück ins Excel schreiben", get("set:lastwb") ? "Zuletzt " + new Date(get("set:lastwb").at).toLocaleDateString("de-DE") + " · danach alte Datei im Ordner ersetzen" : "Lädt die aktualisierte Datei herunter, alte im Ordner ersetzen", "wb")}${row("file", "var(--mute)", "Protokoll als eigene Datei", "Nur zum Ansehen, ändert den Plan nicht", "xlsx")}${row("up", "var(--mute)", "Sicherung speichern", "Kompletter Stand als Datei", "sharejson")}${row("down", "var(--mute)", "Sicherung laden", "", "loadjson")}</div>`;
  x += `<div class="sec"><h2>Darstellung</h2></div><div class="grp"><div class="row plain"><span class="badge-ic" style="--c:var(--gold-s);--t:var(--gold)">${ui("sun")}</span><span class="tx"><span class="t1">Erscheinungsbild</span></span><div class="seg" style="width:220px">${[["system", "Auto"], ["light", "Hell"], ["dark", "Dunkel"]].map(([k, l]) => `<button data-act="theme" data-v="${k}" aria-pressed="${PREF.theme === k}">${l}</button>`).join("")}</div></div></div>`;
  x += `<div class="sec"><h2>Plan</h2></div><div class="grp">${row("file", "var(--ink2)", "Neuen Plan laden", "Excel wählen, Einträge bleiben erhalten", "loadxlsx")}${row("book", "var(--ink2)", "Wie die App anpasst", "Regeln und Quellen", "rules")}${row("trash", "var(--bad)", "Alle Daten löschen", "Nur auf diesem Gerät", "reset")}</div>`;
  x += `<p class="note" style="display:flex;gap:8px;margin-top:16px">${ui("shield")}<span>Plan und Einträge liegen nur auf deinen Geräten und in der Sync-Datei, die du selbst wählst. Die App sendet nichts an Server. Empfehlungen folgen festen Trainingsregeln und ersetzen keine ärztliche Abklärung.</span></p>`;
  return x;
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
  const t = today(), ex = D.key ? get(D.key) : null, F = D.f || (D.f = ex ? { from: ex.from, to: ex.to, kind: ex.kind === "urlaub" ? "urlaub" : ex.kind === "privat" ? "privat" : "dienst", place: ex.place || "", eq: Object.assign({ gym: false, tread: false, pool: false, route: false }, ex.eq || {}) } : { from: t + 1, to: t + 2, kind: "dienst", place: "", eq: { gym: false, tread: false, pool: false, route: false } });
  const eq = F.eq, S = E.SUBS, subs = [];
  if (eq.route) subs.push(["Lauf draußen", "Lockere Läufe und Qualität vor Ort, Long Run mit geplanter Runde."]);
  if (eq.tread) subs.push(["Laufband-Intervalle", S.treadQ]);
  if (eq.gym) subs.push(["Hotel-Gym und Ergometer", "Kraft 30', Rad als Ergometer bis 60'."]);
  if (eq.pool) subs.push(["Schwimmen", S.pool]);
  subs.push(["Hotelzimmer-Kraft", S.room]);
  if (!eq.route && !eq.tread) subs.push(["Zimmer-Zirkel statt Lauf", S.roomCardio]);
  return `<div class="sh-head"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("plane")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Reise eintragen</h2><p>Die App schlägt Ersatzeinheiten vor und baut den Plan um.</p></div>${infoBtn("travel")}<button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>
   <div class="seg" style="margin-bottom:10px">${[["dienst", "Dienstreise"], ["urlaub", "Urlaub"], ["privat", "Privat"]].map(([k, l]) => `<button data-act="setk" data-f="kind" data-v="${k}" aria-pressed="${F.kind === k}">${l}</button>`).join("")}</div>
   <div class="two"><div class="field"><div class="fl"><span>Anreise</span></div><input type="date" class="inp" data-in="from" value="${dateVal(F.from)}"></div><div class="field"><div class="fl"><span>Abreise</span></div><input type="date" class="inp" data-in="to" value="${dateVal(F.to)}"></div></div>
   <div class="field" style="margin-top:10px"><div class="fl"><span>Ort oder Hotel</span><b>optional, bleibt auf dem Gerät</b></div><input class="inp" data-in="place" value="${esc(F.place)}" placeholder="z. B. Frankfurt, Hotel am Main" maxlength="60" autocomplete="off"></div>
   <div class="field"><div class="fl"><span>Vor Ort vorhanden</span><b>${E.eqText(eq) === "nur Zimmer" ? "nur Zimmer" : "Mehrfachauswahl"}</b></div><div class="chips">${Object.keys(E.EQ_LAB).map(k => chipT("eq", k, E.EQ_LAB[k], eq[k])).join("")}</div></div>
   <div class="sec"><h2 style="font-size:1rem">Ersatzeinheiten vor Ort</h2></div><div class="grp">${subs.map(([a, b]) => `<div class="row plain"><span class="tx"><span class="t1">${esc(a)}</span><span class="t2" style="white-space:normal">${esc(b)}</span></span></div>`).join("")}</div>
   <p class="note">An- und Abreisetag: nichts Hartes. Schlüsseleinheiten bleiben vor Ort, wenn die Ausstattung passt, sonst rücken sie auf einen Tag ohne Reise. Tests kommen nach der Reise.</p>
   <div class="sh-foot"><button class="btn" data-act="close">Abbrechen</button><button class="btn lane" data-act="savetrv">${ui("plane")}Eintragen</button></div>`;
}

/* ---------- v3.2 Abwesenheiten: Liste, bearbeiten, löschen ---------- */
function absLabel(a) { const K = E.ABS_KIND[a.kind]; return a.kind === "krank" ? ((E.SICK_CAT[a.cat] || {}).short || "Krank") + (a.cat === "verletzung" && E.REGIONS[a.region] ? " · " + E.REGIONS[a.region].lab : "") : K.lab + (a.place ? " · " + a.place : ""); }
function absRange(a, t) { return U.fmtD(a.from) + "–" + (a.to != null ? U.fmtD(a.to) : "offen") + (a.to != null ? " · " + (a.to - a.from + 1) + " Tage" : " · seit " + (t - a.from + 1) + " Tagen"); }
function absSheet() {
  const t = today(), A = E.absences(ST, t), fut = A.filter(a => (a.to != null ? a.to : t) >= t).sort((a, b) => a.from - b.from), past = A.filter(a => a.to != null && a.to < t).sort((a, b) => b.from - a.from);
  const row = a => { const K = E.ABS_KIND[a.kind]; return `<div class="row plain"><span class="badge-ic" style="--c:var(--${K.c === "gold" ? "gold-s" : K.c});--t:var(--${K.c === "gold" ? "gold" : K.c === "mute" ? "fill" : K.c + "-t"})">${ui(a.kind === "krank" ? "sick" : "plane")}</span><span class="tx"><span class="t1">${esc(absLabel(a))}</span><span class="t2">${esc(absRange(a, t))}${a.eq ? " · " + esc(E.eqText(E.tripEq({ eq: a.eq }))) : ""}</span></span>${a.open ? `<button class="btn sm" data-act="sickend">Gesund</button>` : ""}<button class="iconbtn sm" data-act="absedit" data-v="${esc(a.key)}" aria-label="Bearbeiten">${ui("more")}</button><button class="iconbtn sm" data-act="absdel" data-v="${esc(a.key)}" aria-label="Löschen">${ui("trash")}</button></div>`; };
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--lane);--t:var(--lane-t)">${ui("cal")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">Abwesenheiten</h2><p>Krank, Dienstreise, Urlaub. Beliebig viele, auch überlappend.</p></div><button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<div class="quick" style="margin-bottom:12px"><button class="btn" data-act="travel">${ui("plane")}Reise oder Urlaub</button><button class="btn" data-act="sick">${ui("sick")}Krank</button></div>`;
  x += `<div class="sec"><h2 style="font-size:1rem">Aktuell und geplant</h2></div><div class="grp">${fut.length ? fut.map(row).join("") : `<div class="empty">Nichts eingetragen.</div>`}</div>`;
  if (past.length) x += `<div class="sec"><h2 style="font-size:1rem">Vergangen</h2></div><div class="grp">${past.slice(0, 20).map(row).join("")}</div>`;
  x += `<p class="note">Abwesenheiten stehen im Plan (Monat, Woche, Tag, Saison) und im Kalender-Export als ganztägige Termine. Krankheitsdetails gehen nicht in den Kalender.</p>`;
  return x;
}
function sickSheet(D) {
  const t = today(), cur = get("sick"), curOpen = cur && num(cur.from) && !num(cur.to);
  const F = D.f || (D.f = curOpen ? { from: cur.from, cat: cur.cat || "", region: cur.region || "", flags: (cur.flags || []).slice(), edit: true } : { from: D.from || t, cat: "", region: "", flags: [] });
  const SC = E.SICK_CAT, fl = F.cat ? E.FLAGS_BY[F.cat] : [];
  let x = `<div class="sh-head"><span class="badge-ic" style="--c:var(--bad);--t:var(--bad-t)">${ui("sick")}</span><div class="tx"><h2 class="sheet-title" tabindex="-1">${F.edit ? "Krankmeldung ändern" : "Ich bin krank"}</h2><p>Kategorie statt Diagnose. Steuert Pause und Wiedereinstieg.</p></div>${infoBtn("sick")}<button class="closebtn" data-act="close" aria-label="Schließen">${ui("x")}</button></div>`;
  x += `<div class="field"><div class="fl"><span>Seit</span></div><input type="date" class="inp" data-in="from" value="${dateVal(F.from)}"></div>`;
  x += `<div class="grp" style="margin-top:10px" role="radiogroup" aria-label="Was hast du?">${Object.keys(SC).map(k => `<button class="row" role="radio" aria-checked="${F.cat === k}" data-act="setk" data-f="cat" data-v="${k}"><span class="stmark ${F.cat === k ? "ok" : ""}">${F.cat === k ? ui("check") : ""}</span><span class="tx"><span class="t1">${esc(SC[k].lab)}</span><span class="t2" style="white-space:normal">${esc(SC[k].sub)}</span></span></button>`).join("")}</div>`;
  if (F.cat === "verletzung") x += `<div class="field" style="margin-top:10px"><div class="fl"><span>Körperregion</span></div><div class="chips">${Object.keys(E.REGIONS).map(k => chipK("region", k, E.REGIONS[k].lab, F.region === k)).join("")}</div></div>`;
  if (F.cat) {
    const st = E.sickStages(F.cat, 3), what = F.cat === "hals" ? "Locker trainieren ist erlaubt, höchstens 45 Minuten, nichts Hartes." : F.cat === "verletzung" ? (F.region ? "Pausiert: " + E.REGIONS[F.region].aff.join(", ") + ". Alternative: " + (E.REGIONS[F.region].alt || "Pause") + ", nur schmerzfrei." : "Bitte Körperregion wählen.") : "Kein Training, bis die Symptome weg sind.";
    x += `<div class="banner ${F.cat === "hals" ? "info" : "err"}" style="margin-top:12px">${ui("info")}<div class="tx"><b>${esc(what)}</b> ${esc(SC[F.cat].rule)} Beispiel: nach 3 Krankheitstagen ${st.T} Tage Wiedereinstieg in ${st.s3 ? 3 : 2} Stufen.</div></div>`;
    x += `<div class="field"><div class="fl"><span>Trifft etwas davon zu?</span><b>Warnzeichen</b></div><div class="chips">${fl.map(k => chipT("flags", k, E.FLAGS[k], F.flags.includes(k))).join("")}</div></div>`;
    if (F.flags.length || F.cat === "infekt") x += `<div class="banner err" style="margin-top:10px">${ui("heart")}<div class="tx">${F.flags.length ? "<b>Bitte ärztlich abklären,</b> bevor du wieder trainierst." : "<b>Mit Fieber nicht trainieren.</b>"} Bei Brustschmerz, Herzstolpern oder Atemnot sofort ärztliche Hilfe. Die App stellt keine Diagnose.</div></div>`;
  }
  x += `<p class="note" style="display:flex;gap:8px">${ui("shield")}<span>Diese Angaben bleiben auf dem Gerät und in deiner Sicherungsdatei. Sie gehen nicht ins Excel-Protokoll.</span></p>`;
  x += `<div class="sh-foot"><button class="btn" data-act="close">Abbrechen</button><button class="btn pri" data-act="savesick" ${F.cat && (F.cat !== "verletzung" || F.region) ? "" : "disabled"}>${ui("check")}${F.edit ? "Speichern" : "Melden"}</button></div>`;
  return x;
}

/* ---------- Willkommen ---------- */
function vWelcome() {
  return `<main class="welcome"><img class="logo tiger" src="triger.svg" alt=""><h1>Triger</h1><p class="lead">Stark in drei Disziplinen. Dein Plan bis Linz und ins Allgäu: abhaken mit einem Tipp, und verpasst du etwas, plant Triger neu.</p>
   ${ALERT ? `<div class="banner err">${ui("info")}<div class="tx">${esc(ALERT)}</div></div>` : ""}
   <div class="steps"><div><b>1</b><span>Trainingsplan (Excel) laden</span></div><div><b>2</b><span>Unter Profil eine Sync-Datei in iCloud Drive anlegen</span></div><div><b>3</b><span>Auf dem iPhone dieselbe Sync-Datei laden</span></div></div>
   <div class="acts"><button class="btn pri wide" data-act="loadxlsx">Trainingsplan laden</button><button class="btn wide" data-act="loadjson">Sync-Datei oder Sicherung laden</button>${FSA ? '<button class="btn ghost wide" data-act="syncopen">Sync-Datei verbinden</button>' : ""}</div>
   <p class="fine">${ui("shield")}<span>Deine Daten bleiben auf dem Gerät. Die App sendet nichts an Server.</span></p></main>`;
}
/* ---------- Import, Sync, Export ---------- */
/* v3.3: Excel direkt verbinden (Chrome/Edge am Mac). Die App schreibt nach Änderungen selbst in die Datei im Ordner. */
const XL_OK = typeof window !== "undefined" && "showOpenFilePicker" in window;
let xlTimer = null;
function scheduleXl() { if (!H.xl) return; clearTimeout(xlTimer); xlTimer = setTimeout(() => xlWrite(false), 4000); }
async function xlPick() {
  try { const [h] = await showOpenFilePicker({ types: [{ description: "Trainingsplan", accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] } }] });
    if ((await h.requestPermission({ mode: "readwrite" })) !== "granted") return;
    const buf = new Uint8Array(await (await h.getFile()).arrayBuffer()); const nb = E.parseWorkbook(XLSX, buf);
    if (!nb.plan || !nb.plan.length) throw new Error("In der Datei steht kein Trainingsplan.");
    H.xl = h; await idbPut("xlHandle", h); await xlWrite(true); render();
  } catch (e) { if (e.name !== "AbortError") { ALERT = "Excel nicht verbunden: " + e.message; render(); } }
}
async function xlWrite(interactive) {
  const h = H.xl; if (!h || !B) return false;
  try {
    let p = await h.queryPermission({ mode: "readwrite" });
    if (p !== "granted") { if (!interactive) { H.xlState = "wait"; paintChrome(); return false; } p = await h.requestPermission({ mode: "readwrite" }); if (p !== "granted") { H.xlState = "wait"; paintChrome(); return false; } }
    const src = new Uint8Array(await (await h.getFile()).arrayBuffer());
    const r = await E.writeBack(XLSX, src, B, ST, today());
    const w = await h.createWritable(); await w.write(r.bytes); await w.close();
    H.xlAt = Date.now(); H.xlState = "ok"; idbPut("xlLast", H.xlAt); idbPut("srcxlsx", { bytes: r.bytes, at: H.xlAt });
    if (interactive) toast("In " + h.name + " gespeichert", { icon: "check" });
    paintChrome(); return true;
  } catch (e) { H.xlState = "err"; paintChrome(); if (interactive) { ALERT = "Excel nicht geschrieben: " + (/lock|busy|NoModification|InvalidState/i.test(e.name + e.message) ? "Die Datei ist gerade in Excel geöffnet. Schließen und erneut tippen." : e.message); render(); } console.warn(e); return false; }
}
function xlLine() { if (!H.xl) return ""; const at = H.xlAt ? new Date(H.xlAt).toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "noch nie"; return H.xlState === "wait" ? "Einmal tippen zum Freigeben" : H.xlState === "err" ? "Letzter Versuch fehlgeschlagen, tippen zum Wiederholen" : "Automatisch gespeichert · " + at; }
async function writeBackNow(buf) {
  if (H.xl && !buf) { await xlWrite(true); return; }
  try {
    const src = buf || ((await idbGet("srcxlsx")) || {}).bytes;
    if (!src) { WB_PENDING = true; $("#fx").click(); toast("Bitte einmal die aktuelle Trainingsplan-Excel wählen, die App schreibt dann hinein."); return; }
    const r = await E.writeBack(XLSX, new Uint8Array(src), B, ST, today());
    await shareFile("Trainingsplan_2026-2027.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", r.bytes);
    put("set:lastwb", { at: Date.now(), stat: r.stat }); render();
    toast("Excel geschrieben: " + r.stat.status + " Status, " + r.stat.changed + " Anpassungen, " + r.stat.moved + " Verschiebungen. Alte Datei ersetzen.", { icon: "check" });
  } catch (e) { ALERT = "Zurückschreiben nicht möglich: " + e.message; render(); }
}
let WB_PENDING = false;

function importXlsx(buf) {
  const nb = E.parseWorkbook(XLSX, buf), first = !B;
  idbPut("srcxlsx", { bytes: buf, at: Date.now() }); /* Original für das Zurückschreiben, nur lokal */
  for (const k in nb.seed) if (!ST[k]) ST[k] = { v: nb.seed[k], t: 1 };
  delete nb.seed; B = nb; MEMO.k = null; idbPut("base", B); saveState();
  toast(first ? "Plan geladen: " + B.plan.length + " Einheiten" : "Plan aktualisiert. Deine Einträge bleiben.", { icon: "check" }); ALERT = ""; render();
}
function ingest(obj) {
  if (!obj || obj.app !== "perflab") throw new Error("Das ist keine Performance-Lab-Datei.");
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
  try { const types = [{ description: "Triger Sync", accept: { "application/json": [".json"] } }];
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
function exportXlsx() {
  const c = C(), t = c.t, wb = XLSX.utils.book_new(), PV = privAdjIds();
  const rows = [["Woche", "Datum", "Zeit", "Prio", "Sport", "Einheit", "Soll km", "Soll min", "Status", "Grund", "Ist km", "Ist min", "Pace/Tempo", "Ø HF", "Max HF", "RPE", "Gefühl", "Hm", "Schuh", "Notiz", "Anpassung"]];
  c.Ex.filter(s => s.sport !== "Ruhe").forEach(s => { const l = log(s), a = E.actual(ST, s, t);
    rows.push([s.w, U.wdD(s.date) + U.sd(s.date).getUTCFullYear(), s.time, s.prio, s.sport, PV.has(s.adj) ? "Angepasste Einheit" : s.name, s.km || "", s.min || "", s.dropped ? "entfällt" : E.statusOf(ST, s, t), l.why || "", a.km ? Math.round(a.km * 100) / 100 : "", a.min ? Math.round(a.min) : "", a.km && a.min ? (s.sport === "Rad" ? de(a.km / (a.min / 60)) + " km/h" : s.sport === "Lauf" ? E.paceStr(a.min, a.km) + " /km" : "") : "", l.hf ?? "", l.hfmax ?? "", l.rpe ?? "", l.feel ?? "", l.hm ?? "", l.shoe || "", l.note || "", s.dropped || s.edited || s.added ? (PV.has(s.adj) ? "angepasst" : (s.note || "angepasst")) : ""]); });
  c.free.forEach(f => rows.push([E.weekOf(B, f.date), U.wdD(f.date) + U.sd(f.date).getUTCFullYear(), "", "frei", f.sport, f.name || "Freies Training", "", "", "✓", "", f.dist ?? "", f.dur ?? "", "", f.hf ?? "", "", f.rpe ?? "", "", f.hm ?? "", "", f.note || "", "frei"]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Protokoll");
  const tr = [["Datum", "Test", "Zeit", "Ø HF", "VDOT", "Wirkung"]]; B.tests.forEach(T => { const r = get("test:" + T.key) || {}, km = { "10K": 10, HM: 21.0975, M: 42.195 }[T.typ]; tr.push([U.wdD(testDate(T)), T.name, num(r.time) ? U.hms(r.time) : "", r.hf ?? "", km && num(r.time) ? Math.round(E.vdot(km, r.time * 1440) * 10) / 10 : "", testEffect(T)]); });
  tr.push([], ["Schwellenpuls Laufen", Math.round(c.R.lthr)], ["Referenz-HM", U.hms(c.R.refHM)], ["Marathon-Prognose", U.hms(c.R.prog)], ["CSS /100 m", num(c.R.css) ? U.mss(c.R.css) : ""]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tr), "Tests");
  const ck = [["Woche", "Ruhepuls", B.painLabel, "Gefühl 1–5", "Soll h", "Ist h", "Schlüssel", "Fitness", "Ermüdung", "Form"]];
  c.WS.weeks.forEach(w => { const k = get("chk:" + w.w) || {}, f = c.F.find(p => p.d === w.start + 6) || {}; ck.push([w.w, k.puls ?? "", k.pain ?? "", k.feel ?? "", Math.round(w.so / 6) / 10, Math.round(w.is / 6) / 10, w.keyDone + "/" + w.keyTot, num(f.ctl) ? Math.round(f.ctl) : "", num(f.atl) ? Math.round(f.atl) : "", num(f.tsb) ? Math.round(f.tsb) : ""]); });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ck), "Wochen");
  const vo = [["Datum", "VO2max Garmin"]]; E.vo2List(ST).forEach(v => vo.push([U.wdD(v.date) + U.sd(v.date).getUTCFullYear(), v.v])); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(vo), "VO2max");
  const ad = [["Datum", "Anpassung", "Begründung", "Änderungen", "Status"]]; Object.keys(ST).filter(k => k.startsWith("adj:")).map(k => ST[k].v).filter(Boolean).sort((a, b) => a.created - b.created).forEach(a => { const pv = privAdj(a); ad.push([new Date(a.created).toLocaleDateString("de-DE"), pv.title, pv.why, pv.lines.join(" | "), a.undone ? "zurückgenommen" : "aktiv"]); });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ad), "Anpassungen");
  shareFile("Trainingsprotokoll_" + new Date().toISOString().slice(0, 10) + ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", XLSX.write(wb, { type: "array", bookType: "xlsx" }));
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
const TABS = [["heute", "Übersicht", "today"], ["plan", "Plan", "plan"], ["daten", "Daten", "data"], ["fort", "Leistung", "target"], ["prof", "Profil", "prof"]];
let typing = false, dirty = false, lastY = 0, tbIdle = null;
addEventListener("scroll", () => { if (WIDE()) return; const y = window.scrollY, tb = $(".tabbar"); if (!tb) return;
  if (y > lastY + 6 && y > 140) tb.classList.add("min"); else if (y < lastY - 6 || y < 80 || y + innerHeight >= document.documentElement.scrollHeight - 40) tb.classList.remove("min"); lastY = y;
  clearTimeout(tbIdle); tbIdle = setTimeout(() => tb.classList.remove("min"), 2500); }, { passive: true });
function render() { if (typing) { dirty = true; return; } doRender(); }
function doRender() {
  dirty = false; applyTheme(); autoApply();
  const root = $("#root");
  if (!B) { root.innerHTML = vWelcome(); return; }
  const c = C(), n = navBadge(c), wide = WIDE();
  const body = tab === "heute" ? vHeute(c) : tab === "plan" ? vPlan(c) : tab === "daten" ? vData(c) : tab === "fort" ? vProg(c) : vProf(c);
  const nx = B.S.events.filter(e => e.date >= c.t).sort((a, b) => a.date - b.date)[0];
  const rail = PREF.side === "rail", inspOff = PREF.insp === false;
  const side = `<aside class="side" aria-label="Navigation"><div class="brand"><img src="triger.svg" alt=""><span>Triger</span><button class="sidetog" data-act="sidetog" aria-label="${rail ? "Seitenleiste einblenden" : "Seitenleiste einklappen"}" title="Seitenleiste">${ui("sidebar")}</button></div><nav>${TABS.map(([k, l, ic]) => `<button data-tab="${k}" aria-current="${tab === k ? "page" : "false"}" title="${l}">${ui(ic)}<span class="nl">${l}</span>${k === "heute" && n ? `<span class="dot">${n}</span>` : ""}</button>`).join("")}</nav>
    <button class="btn pri sm addbtn" data-act="free" title="Training hinzufügen">${ui("plus")}<span class="nl">Training hinzufügen</span></button><div class="foot">${nx ? `<div class="cdmini"><b class="num">${nx.date - c.t}</b><span>Tage bis ${esc(nx.name)}</span></div>` : ""}${syncPill()}</div></aside>`;
  if (!wide) { for (let k = SHEETS.length - 1; k >= 0; k--) if (SHEETS[k].side) SHEETS.splice(k, 1); }
  if (wide && inspOff && SHEETS.some(S => S.side)) PREF.insp = true;
  const insp = wide && PREF.insp !== false ? `<aside class="insp" id="insp" aria-label="Details">${inspHTML(c)}</aside>` : "";
  const sc = window.scrollY;
  root.innerHTML = `<div class="shell${rail ? " rail" : ""}${wide && PREF.insp === false ? " noinsp" : ""}">${side}<main class="content" id="main">${wide && PREF.insp === false ? `<button class="insptog" data-act="insptog" aria-label="Details einblenden" title="Details einblenden">${ui("sidebar")}</button>` : ""}${body}</main>${insp}</div>
   <div class="tabbar"><nav class="tabs" aria-label="Tabs">${TABS.map(([k, l, ic]) => `<button data-tab="${k}" aria-current="${tab === k ? "page" : "false"}" aria-label="${l}${k === "heute" && n ? ", " + n + " offen" : ""}">${ui(ic)}<span>${l}</span>${k === "heute" && n ? `<span class="dot">${n}</span>` : ""}</button>`).join("")}</nav><button class="fab" data-act="free" aria-label="Training hinzufügen">${ui("plus")}</button></div>`;
  foldify($("#main")); window.scrollTo(0, sc); bindSwipes(); bindWeekSwipe();
  SHEETS.forEach(S => { if (S.opt.live && !S.side) rerenderSheet(S); }); bindSwipes();
}
function inspHTML(c) {
  const top = [...SHEETS].reverse().find(S => S.side);
  if (top) { const n = SHEETS.filter(S => S.side).length; return `<div class="panel-bar">${n > 1 ? `<button class="lnk" data-act="close">${ui("back")}Zurück</button>` : `<span></span>`}<button class="sidetog" data-act="insptog" aria-label="Details ausblenden" title="Details ausblenden">${ui("sidebar")}</button></div><div class="panel-body">${top.render(top)}</div>`; }
  /* Ausgewählte Einheit verschoben/ersetzt? Dann die Nachfolge-Einheit (ID mit ~) zeigen statt still auf eine andere zu springen. */
  if (selId && !findS(selId)) { const nx = c.Ex.find(x => String(x.id).startsWith(String(selId).split("~")[0] + "~") && !x.dropped); selId = nx ? nx.id : null; }
  if (selId) { const cur = findS(selId); if (cur && cur.dropped) { const nx = c.Ex.find(x => String(x.id).startsWith(String(selId).split("~")[0] + "~") && !x.dropped); if (nx) selId = nx.id; } }
  if (!(selId && findS(selId))) { const h = heroPick(c); if (h) { selId = h.s.id; INSP = { mode: "" }; } }
  const bar = `<div class="panel-bar"><span></span><button class="sidetog" data-act="insptog" aria-label="Details ausblenden" title="Details ausblenden">${ui("sidebar")}</button></div>`;
  return bar + (selId && findS(selId) ? sessView(selId, INSP) : `<div class="empty"><b>Einheit wählen</b>Details, Eintragen und Verschieben erscheinen hier.</div>`);
}
function paintInsp() { const i = $("#insp"); if (!i || !B) return; i.innerHTML = inspHTML(C()); $$(".content .row.sel").forEach(r => r.classList.remove("sel")); if (selId && !SHEETS.some(S => S.side)) $$(`.content [data-act=sess][data-id="${CSS.escape(selId)}"]`).forEach(r => r.classList.add("sel")); if (typeof bindSwipes === "function") bindSwipes(); }
function paintChrome() { $$(".syncpill").forEach(el => { el.outerHTML = syncPill(); }); }
let INSP = {};
function applyTheme() { const r = document.documentElement; if (PREF.theme === "system") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", PREF.theme);
  const dark = PREF.theme === "dark" || (PREF.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches); const m = $('meta[name=theme-color]'); if (m) m.content = dark ? "#0A0F17" : "#EDF1F6"; }

/* ---------- Sheets öffnen ---------- */
function openSess(id, mode) {
  if (WIDE() && PREF.insp === false) { PREF.insp = true; idbPut("pref", PREF); }
  if (WIDE()) { for (let k = SHEETS.length - 1; k >= 0; k--) if (SHEETS[k].side) SHEETS.splice(k, 1); selId = id; INSP = { mode: mode || "" }; render(); setTimeout(() => { const i = $("#insp"); if (i) i.scrollTop = 0; const h = $("#insp .sheet-title"); h && h.focus({ preventScroll: true }); }, 30); return; }
  const S = openSheet(s => sessView(id, s.data), { label: "Einheit", data: { mode: mode || "", id }, live: true, tall: false });
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
function applyAdj(p, auto) { const id = newId(); put("adj:" + id, { id, key: p.key, title: p.title, why: p.why, ops: p.ops, lines: p.lines, created: Date.now(), auto: !!auto }); return id; }
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
    setTimeout(() => toast(el.length === 1 ? "Plan automatisch angepasst" : el.length + " Anpassungen übernommen", { icon: "sync", undo: () => ids.forEach(id => setAdjUndone(id, true)) }), 50);
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
  const s = findS(id); if (!s) return; const before = Object.assign({}, C().WS.weeks[s.w - 1]), prev = get("log:" + id);
  setLog(id, { st: "✓" }); render();
  const m = milestone(s, before);
  toast(m || s.name.replace(/^★\s*/, "") + " erledigt", { icon: "check", cele: !!m, undo: () => { if (prev) put("log:" + id, prev); else { delete ST["log:" + id]; MEMO.k = null; saveState(); } render(); } });
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
    const f = el.dataset.in; if (!(f in F)) return;
    el.value = f === "dur" ? fmtDurIn(F.dur) : f === "dist" ? fmtDistIn(F.dist, sport) : f === "date" || f === "from" || f === "to" ? dateVal(F[f]) : (F[f] ?? "");
  });
  const dv = $("#derived", ($(".sheet-wrap:last-child .sheet") || $("#insp") || document)); if (dv) dv.innerHTML = derivedTxt(F, sport);
}

document.addEventListener("click", async e => {
  const tb = e.target.closest("[data-tab]"); if (tb) { tab = tb.dataset.tab; for (let k = SHEETS.length - 1; k >= 0; k--) if (SHEETS[k].side) SHEETS.splice(k, 1); window.scrollTo(0, 0); buzz(4); doRender(); return; }
  const b = e.target.closest("[data-act]"); if (!b) return;
  const sw = b.closest(".sw"); if (sw && sw.dataset.swiped) return;
  const a = b.dataset.act, id = b.dataset.id, v = b.dataset.v, t = today(), cf = () => curForm();
  switch (a) {
    case "sess": openSess(id); break;
    case "log": openSess(id, "log"); break;
    case "close": if (SHEETS.length) closeSheet(); else if (!WIDE()) { selId = null; render(); } else { INSP = { mode: "" }; paintInsp(); } break;
    case "mode": { const f = cf(); if (!f) break; f.D.mode = v; f.D.f = null; f.D.why = null; f.re(); break; }
    case "setf": { const f = cf(); if (!f) break; const F = f.D.f, raw = v; const nv = ["st", "sport"].includes(b.dataset.f) ? raw : Number(raw);
      if (b.dataset.f === "more") F.more = !!nv; else F[b.dataset.f] = F[b.dataset.f] === nv && !["st", "sport"].includes(b.dataset.f) ? null : nv; buzz(4); f.re(); break; }
    case "step": { const f = cf(); if (!f) break; const F = f.D.f, s = formS(f), sport = s ? s.sport : F.sport; stepField(F, b.dataset.f, Number(v), sport); buzz(3); syncInputs(F, sport); break; }
    case "savelog": { const f = cf(); if (!f) break; const s = findS(id), F = f.D.f; const before = Object.assign({}, C().WS.weeks[s.w - 1]);
      setLog(id, { st: F.st, dur: F.dur, dist: ["Lauf", "Rad", "Schwimmen", "Triathlon"].includes(s.sport) ? (s.sport === "Schwimmen" && num(F.dist) && F.dist > 20 ? F.dist / 1000 : F.dist) : null, hf: F.hf, hfmax: F.hfmax, rpe: F.rpe, feel: F.feel, shoe: F.shoe, hm: F.hm, pull: F.pull, note: F.note, why: undefined, ikm: undefined, imin: undefined });
      buzz(15); if (f.S) closeSheet(f.S, true); else { INSP = {}; } render(); const m = milestone(s, before); toast(m || "Gespeichert. Stark.", { icon: "check", cele: !!m }); break; }
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
    case "free": openSheet(S => freeForm(S.data), { label: "Training hinzufügen", data: {} }); break;
    case "freeedit": { const f = get(id); closeSheet(); openSheet(S => freeForm(S.data), { label: "Training bearbeiten", data: { edit: id, f: Object.assign({}, f) } }); break; }
    case "freedel": { const f = get(id); set(id, Object.assign({}, f, { del: true })); closeSheet(); selId = null; render(); toast("Gelöscht", { undo: () => set(id, f) }); break; }
    case "savefree": { const S = SHEETS[SHEETS.length - 1], F = S.data.f; if (!num(F.dur) || F.dur <= 0) { toast("Bitte eine Dauer eintragen."); break; }
      const key = S.data.edit || "free:" + newId(); set(key, { date: F.date, sport: F.sport, dur: F.dur, dist: F.dist, hf: F.hf, rpe: F.rpe, hm: F.hm, name: F.name, note: F.note }); closeSheet(S, true); buzz(15); toast((F.name || sp(F.sport).lab) + " gespeichert", { icon: "check" }); break; }
    case "checkin": openSheet(S => checkinForm(S.data), { label: "Check-in", data: { w: +(b.dataset.w || C().cw) } }); break;
    case "savechk": { const S = SHEETS[SHEETS.length - 1], F = S.data.f, w = S.data.w, last = E.vo2List(ST).slice(-1)[0];
      put("chk:" + w, { puls: F.puls, pain: F.pain, feel: F.feel });
      if (num(F.vo2) && (!last || last.v !== F.vo2 || F.vo2touched)) { const prevMax = Math.max(0, ...E.vo2List(ST).map(x => x.v)); put("vo2:" + today(), F.vo2); if (prevMax && F.vo2 > prevMax) { closeSheet(S, true); render(); toast("Neuer VO2max-Bestwert: " + F.vo2, { cele: true, icon: "star" }); break; } }
      closeSheet(S, true); render(); const vv = verdict(C().cw); toast("Check-in gespeichert. " + vv.txt, { icon: "heart" }); break; }
    case "test": if (!b.dataset.k) break; openSheet(S => testForm(S.data), { label: "Test", data: { k: b.dataset.k }, live: true }); break;
    case "vo2": openSheet(S => vo2Form(S.data), { label: "VO2max", data: {} }); break;
    case "savevo2": { const S = SHEETS[SHEETS.length - 1], F = S.data.f; if (!num(F.v) || F.v < 20 || F.v > 95) { toast("Wert zwischen 20 und 95 eintragen."); break; } const prevMax = Math.max(0, ...E.vo2List(ST).map(x => x.v)); set("vo2:" + F.date, F.v); closeSheet(S, true); toast(prevMax && F.v > prevMax ? "Neuer Bestwert: VO2max " + F.v : "VO2max " + F.v + " gespeichert", { icon: "check", cele: prevMax && F.v > prevMax }); break; }
    case "vo2del": { const k = "vo2:" + v, old = get(k); set(k, null); const S = SHEETS[SHEETS.length - 1]; if (S) rerenderSheet(S); toast("Gelöscht", { undo: () => set(k, old) }); break; }
    case "info": openSheet(() => infoSheet(v), { label: "Erklärung" }); break;
    case "rules": openSheet(() => rulesSheet(), { label: "Regeln" }); break;
    case "travel": if (SHEETS.length && !SHEETS[SHEETS.length - 1].side) closeSheet(SHEETS[SHEETS.length - 1], true); openSheet(S => travelSheet(S.data), { label: "Reise", data: {} }); break;
    case "setk": { const f = cf(); if (!f || !f.D.f) break; const F = f.D.f, k = b.dataset.f; F[k] = F[k] === v && k === "region" ? "" : v; if (k === "cat") { F.flags = []; if (v !== "verletzung") F.region = ""; } buzz(4); f.re(); break; }
    case "tog": { const f = cf(); if (!f || !f.D.f) break; const F = f.D.f, k = b.dataset.f; if (k === "eq") F.eq[v] = !F.eq[v]; else { const L = F[k] || (F[k] = []); const i = L.indexOf(v); if (i >= 0) L.splice(i, 1); else L.push(v); } buzz(4); f.re(); break; }
    case "aitog": set("set:ai", !AION()); toast(AION() ? "KI-Coach an. Daten gehen nur auf Knopfdruck raus." : "KI-Coach aus.", { icon: "sync" }); break;
    case "vplay": vidEmbed(b); break;
    case "aion": { put("set:ai", true); const S = SHEETS[SHEETS.length - 1]; if (S) rerenderSheet(S); render(); break; }
    case "ai": openSheet(S => aiSheet(S.data), { label: "KI-Coach", data: {} }); break;
    case "aikey": openSheet(S => aiKeySheet(S.data), { label: "API-Schlüssel", data: {} }); break;
    case "aikeysave": { const S = SHEETS[SHEETS.length - 1], F = S.data.f; PREF.aikey = String(F.aikey || "").trim(); PREF.aimodel = String(F.aimodel || "").trim() || "claude-opus-5-5"; await idbPut("pref", PREF); closeSheet(S, true); render(); toast("Gespeichert, nur auf diesem Gerät.", { icon: "shield" }); break; }
    case "aikeydel": { delete PREF.aikey; await idbPut("pref", PREF); closeSheet(SHEETS[SHEETS.length - 1], true); render(); toast("Schlüssel gelöscht."); break; }
    case "aicopy": { const S = SHEETS[SHEETS.length - 1], txt = E.AI_PROMPT + "\n\n" + JSON.stringify(S.data.pk, null, 1);
      try { await navigator.clipboard.writeText(txt); toast("Kopiert. In Claude einfügen, Antwort hier einfügen.", { icon: "check" }); } catch (e) { await shareFile("KI-Anfrage.txt", "text/plain", txt); } break; }
    case "aicheck": { const S = SHEETS[SHEETS.length - 1], raw = (S.data.f && S.data.f.airesp) || ($(".sheet [data-in=airesp]") || {}).value || ""; S.data.res = E.aiValidate(B, ST, today(), raw); rerenderSheet(S); break; }
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
    case "savesick": { const S = SHEETS[SHEETS.length - 1], F = S.data.f; if (!F.cat || (F.cat === "verletzung" && !F.region)) break; if (!F.from || F.from > t) { toast("Bitte ein Datum bis heute wählen."); break; }
      const prev = get("sick"); undoSickAct(); if (prev && num(prev.from) && num(prev.to) && !F.edit) put("sickh:" + prev.from, Object.assign({}, prev)); set("sick", { from: F.from, to: null, cat: F.cat, region: F.region || "", flags: F.flags.slice() }); closeSheet(S, true); tab = "heute"; render();
      toast(F.edit ? "Gespeichert." : F.cat === "hals" ? "Gute Besserung. Locker geht, Hartes nicht." : "Gute Besserung. Pause, bis du fit bist.", { icon: "sick", undo: () => set("sick", prev || null) }); break; }
    case "savetrv": { const S = SHEETS[SHEETS.length - 1], F = S.data.f; if (!F.from || !F.to || F.to < F.from) { toast("Bitte Von und Bis prüfen."); break; }
      const clash = E.absences(ST, t).find(a => a.key !== S.data.key && a.kind !== "krank" && F.from <= (a.to != null ? a.to : F.to) && F.to >= a.from); if (clash) toast("Überschneidet sich mit " + E.ABS_KIND[clash.kind].lab + " " + U.fmtD(clash.from) + "–" + U.fmtD(clash.to) + ". Beide bleiben gespeichert.");
      if (S.data.key) { put(S.data.key, Object.assign({}, get(S.data.key), { del: true })); }
      set("trv:" + newId(), { from: F.from, to: F.to, kind: F.kind, place: String(F.place || "").trim().slice(0, 60), eq: Object.assign({}, F.eq) }); closeSheet(S, true); tab = "heute"; render(); toast("Reise eingetragen. Vorschlag steht unter Heute.", { icon: "plane" }); break; }
    case "abs": openSheet(() => absSheet(), { label: "Abwesenheiten", live: true }); break;
    case "absedit": { if (v === "sick") { openSheet(S => sickSheet(S.data), { label: "Krank", data: {} }); break; }
      if (v.startsWith("sickh:")) { toast("Abgeschlossene Krankheit: nur löschen möglich."); break; } openSheet(S => travelSheet(S.data), { label: "Reise", data: { key: v } }); break; }
    case "absdel": { const old = get(v); if (!old) break; if (v === "sick") { undoSickAct(); set("sick", null); } else set(v, Object.assign({}, old, { del: true })); const S = SHEETS[SHEETS.length - 1]; if (S) rerenderSheet(S);
      toast("Abwesenheit gelöscht. Anpassungen dazu bleiben, bis du sie zurücknimmst.", { undo: () => set(v, old) }); break; }
    case "sick": if (SHEETS.length && !SHEETS[SHEETS.length - 1].side) closeSheet(SHEETS[SHEETS.length - 1], true); openSheet(S => sickSheet(S.data), { label: "Krank", data: {} }); break;
    case "sickend": { undoSickAct(); const s = get("sick"); set("sick", Object.assign({}, s, { to: Math.max(s.from, t - 1) })); tab = "heute"; render(); toast("Willkommen zurück. Dein Wiedereinstieg steht unter Heute.", { icon: "check" }); break; }
    case "zoom": planZoom = v; if (v === "woche") planWeek = null; if (v === "tag") planDay = null; if (v === "monat") planMonth = null; render(); break;
    case "wk": planWeek = +v; render(); break;
    case "wkgo": planZoom = "woche"; planWeek = +v; window.scrollTo(0, 0); render(); break;
    case "day": planZoom = "tag"; planDay = +v; window.scrollTo(0, 0); render(); break;
    case "dayn": planDay = +v; render(); break;
    case "mon": planMonth = +v; render(); break;
    case "mday": openSheet(S => daySheet(S.data), { label: "Tag", data: { d: +v }, live: true }); break;
    case "dsh": { const S = SHEETS[SHEETS.length - 1]; if (S) { S.data.d = +v; rerenderSheet(S); } break; }
    case "mday2w": { closeSheet(SHEETS[SHEETS.length - 1], true); planZoom = "woche"; planWeek = Math.max(1, Math.min(C().NW, E.weekOf(B, +v))); render(); break; }
    case "range": progRange = v; render(); break;
    case "theme": PREF.theme = v; idbPut("pref", PREF); render(); break;
    case "alertx": ALERT = ""; render(); break;
    case "synctap": if (H.sync) syncNow(true); else { tab = "prof"; render(); } break;
    case "loadxlsx": $("#fx").click(); break;
    case "loadjson": $("#fj").click(); break;
    case "sharejson": if (B) await shareFile(SYNCNAME, "application/json", payload()); break;
    case "synccreate": syncPick(true); break;
    case "syncopen": syncPick(false); break;
    case "syncnow": syncNow(true); break;
    case "syncoff": H.sync = null; idbDel("syncHandle"); syncState = "off"; syncMsg = "Nur auf diesem Gerät"; render(); break;
    case "ics": await shareFile("Training.ics", "text/calendar", E.ics(B, ST, t)); break;
    case "xlsx": exportXlsx(); break;
    case "wb": writeBackNow(); break;
    case "xlpick": xlPick(); break;
    case "fold": toggleFold(v); break;
    case "sidetog": PREF.side = PREF.side === "rail" ? "full" : "rail"; idbPut("pref", PREF); doRender(); break;
    case "insptog": PREF.insp = PREF.insp === false; idbPut("pref", PREF); doRender(); break;
    case "xloff": H.xl = null; H.xlState = "off"; await idbDel("xlHandle"); render(); toast("Excel-Verbindung getrennt."); break;
    case "reset": if (confirm("Alle Daten in dieser App löschen? Die Sync-Datei bleibt erhalten.")) { await idbDel("base"); await idbDel("state"); await idbDel("srcxlsx"); await idbDel("syncHandle"); await idbDel("xlHandle"); H.xl = null; B = null; ST = {}; H.sync = null; MEMO.k = null; render(); } break;
    case "upd": navigator.serviceWorker.getRegistration().then(r => { if (r && r.waiting) r.waiting.postMessage("skip"); setTimeout(() => location.reload(), 300); }); break;
  }
});
document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches("[role=button]")) { e.preventDefault(); e.target.click(); } });
document.addEventListener("focusin", e => { if (e.target.matches("input,textarea,select") && !e.target.closest(".sheet") && !e.target.closest("#insp")) typing = true; });
document.addEventListener("focusout", () => setTimeout(() => { typing = false; if (dirty) doRender(); }, 80));
document.addEventListener("input", e => {
  const el = e.target, f = el.dataset.in; if (!f) return; const cur = curForm(); if (!cur || !cur.D.f) return;
  const s = formS(cur), sport = s ? s.sport : cur.D.f.sport;
  if (["dur", "dist", "hf", "hfmax", "hm", "puls", "vo2", "v", "kg", "wt"].includes(f)) { cur.D.f[f] = readField(f, el.value, sport); if (f === "vo2") cur.D.f.vo2touched = true; const dv = $("#derived", el.closest(".sheet") || el.closest("#insp") || document); if (dv) dv.innerHTML = derivedTxt(cur.D.f, sport); }
  else if (["note", "name", "shoe", "place", "airesp", "aikey", "aimodel"].includes(f)) { if (!cur.D.f) cur.D.f = {}; cur.D.f[f] = el.value; }
  else if (f.startsWith("fd_")) { if (!cur.D.f) cur.D.f = {}; cur.D.f[f.slice(3)] = el.value; }
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
$("#fx").addEventListener("change", async e => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; const buf = new Uint8Array(await f.arrayBuffer());
  if (WB_PENDING && B) { WB_PENDING = false; await idbPut("srcxlsx", { bytes: buf, at: Date.now() }); return writeBackNow(buf); }
  try { importXlsx(buf); } catch (err) { ALERT = err.message; render(); } });
$("#fc").addEventListener("change", async e => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; const S = SHEETS[SHEETS.length - 1] || openSheet(SS => impSheet(SS.data), { label: "Import", data: {} });
  try { doImport(await f.text(), S); } catch (err) { toast(err.message.slice(0, 220)); } });
$("#fj").addEventListener("change", async e => { const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try { ALERT = ""; const ch = ingest(JSON.parse(await f.text())); render(); toast(ch ? "Stand übernommen und zusammengeführt." : "Schon aktuell.", { icon: "check" }); } catch (err) { ALERT = "Datei nicht lesbar: " + err.message; render(); } });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyTheme());
let wasWide = WIDE(); addEventListener("resize", () => { if (WIDE() !== wasWide) { wasWide = WIDE(); render(); } });

/* ---------- Start ---------- */
(async () => {
  try { B = (await idbGet("base")) || null; ST = (await idbGet("state")) || {}; PREF = Object.assign(PREF, (await idbGet("pref")) || {}); H.sync = (await idbGet("syncHandle")) || null; H.xl = (await idbGet("xlHandle")) || null; H.xlAt = (await idbGet("xlLast")) || 0; } catch (e) { console.warn(e); }
  for (const k in ST) if (ST[k] && ST[k].v === null) delete ST[k];
  if (H.sync) { syncState = "wait"; syncMsg = "Einmal tippen zum Freigeben"; }
  doRender(); document.body.classList.add("ready");
  if (H.sync) syncNow(false);
  let lastDay = today();
  setInterval(() => { if (today() !== lastDay) { lastDay = today(); MEMO.k = null; render(); } if (H.sync && syncState === "ok") syncNow(false); }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { if (H.sync) syncNow(false); MEMO.k = null; render(); } });
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("sw.js").then(reg => {
      const show = () => { if ($(".upd")) return; const d = document.createElement("div"); d.className = "upd"; d.innerHTML = `Update verfügbar <button data-act="upd">Neu laden</button>`; document.body.append(d); };
      if (reg.waiting && navigator.serviceWorker.controller) show();
      reg.addEventListener("updatefound", () => { const w = reg.installing; w && w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) show(); }); });
    }).catch(() => {});
  }
})();
window.__perflab = { get B() { return B; }, get ST() { return ST; }, importXlsx, ingest, render: doRender, C };
})();
