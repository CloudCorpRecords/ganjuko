// rig2 section18 suite — Section 18 live verification: level 100, hidden
// genetics (birth, legacy stability, save/load, capture hand-off), daycare
// breeding with inheritance, the Character Sheet, Chroma rendering in
// battle, the Dex Chroma tag, and the Listener (Judge) gate + verdict —
// all through the real game. Genetics NUMBERS are read here only as test
// evidence (the rig is a developer surface); the shipped UI never shows
// them (the unit suite + the C.6 lint audit the no-numbers rule, and the
// sheet/dex/listener checks assert the flavour surfaces render).
//
// Run 1 (2026-11-02) went 10/15; the five misses were diagnosed to:
// captureHandoff is a fires-on-capture flag (now asserted after a real
// capture leg), the Lv100 battle was fought by the Lv5 party lead (now a
// solo Lv100 boot), the save/load check ran inside a defeat's aftermath
// (now in clean state — the isolated diagnostic round-trips exactly),
// the bred baby's step counter accrued the hatch step itself (engine
// fixed: steps belong to the pre-step roster), and the Chroma/Dex check
// followed a coin-flip mirror battle (now one-sided, outcome recorded).
"use strict";
const path = require("path");
const { openLive, preEngineMd5 } = require("../lib/live");
const { Reporter } = require("../lib/results");
const battle = require("../lib/battle");
const { sleep } = require("../lib/cdp");

const BADGES = ["Aero Badge", "Astral Badge", "Canopy Badge", "Dynamo Badge",
  "Eclipse Badge", "Inferno Badge", "Tectonic Badge", "Tidal Badge"];
const ORB = 1;

// newGame can lose a race with DataManager's async global-info load on
// slow tunnel boots (run 5 died at the daycare leg: emptySavefileId read
// a null _globalInfo). Retry with a beat; a real failure still throws.
async function newGameRetry(s, tries = 3) {
  let lastErr = null;
  for (let i = 0; i < tries; i++) {
    try { await s.newGame(); return; } catch (e) { lastErr = e; await sleep(4000); }
  }
  throw lastErr;
}

function geneticsOfMember(i) {
  return `(function(){ const m = $gameParty.allMembers()[${i}]; return (m && m._ganjukoGenetics) ? JSON.parse(JSON.stringify(m._ganjukoGenetics)) : null; })()`;
}
function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function withoutMetPlace(g) { const c = Object.assign({}, g); delete c.metPlace; return c; }

async function shot(s, outDir, name) {
  // The rig's screenshot helper first; if CDP capture returns no data in
  // this Chrome, try fromSurface and report the byte count as evidence.
  try {
    const p = await s.cdp.screenshot(path.join(outDir, "shots", name));
    if (p) return p;
  } catch (e) {}
  try {
    const r = await s.cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    if (r && r.data) return `fromSurface data=${r.data.length} (not persisted: write-guard)`;
  } catch (e) {}
  return null;
}

async function run({ target, outDir, port, cdpPort }) {
  const rep = new Reporter({ suite: "section18", target, engineMd5: preEngineMd5(target), outDir });
  let ctx = null;
  try {
    ctx = await openLive({ target, port, cdpPort });
    rep.engineMd5 = ctx.engineMd5 || rep.engineMd5;
    rep.attachSession(ctx.session);
    const s = ctx.session;
    const boot = await s.boot(ctx.gameUrl);
    rep.note(`boot: focus=${boot.focused} webgl=${boot.webgl} fps=${boot.fps}`);
    await battle.installHooks(s);
    const exc0 = s.cdp.exceptions.length;

    // ---- install state -------------------------------------------------
    const status = await s.evSafe("(function(){ const S = GanjukoEngine.S18; return S ? S.status : null; })()");
    const installedCore = !!status && Object.entries(status).every(([k, v]) => k === "captureHandoff" || v === true);
    await rep.check("s18.status", installedCore,
      `GE.S18.status (captureHandoff arms on first capture, checked later): ${JSON.stringify(status)}`);
    const classLen = await s.evSafe("(function(){ return ($dataClasses && $dataClasses[1] && $dataClasses[1].params[0]) ? $dataClasses[1].params[0].length : 0; })()");
    await rep.check("s18.classExtLive", classLen === 101,
      `$dataClasses[1].params[0].length = ${classLen} (100 = Lv100 NaN hazard live, 101 = boot pass ran)`);

    // ---- birth profile ---------------------------------------------------
    // The lead is a Lv10 Bubblix, not an Embit: the capture leg below
    // weakens a Lv3 Embit and throws Orbs, and the Embit-vs-Embit mirror
    // is a proven pathology — the failure screenshot shows the foe parked
    // at exactly 39% (weaken threshold reached) while our lead's HP hit
    // 0%: Fire-on-Fire weakening is slow and the foe's 5 dmg/round chips
    // through the whole throw phase (defeats in runs 3 AND 4). Bubblix
    // resists Fire, weakens super-effectively but controllably (weakest
    // move ~9-10 dmg vs a ~25 HP foe — no one-shot), and tanks the
    // throw phase. Any starter species serves the profile checks.
    await newGameRetry(s);
    await s.seedParty([{ species: 4, level: 10 }]);
    const g0 = await s.evSafe(geneticsOfMember(0));
    const validProfile = !!g0 && ["hp", "atk", "def", "mat", "mdf", "agi"].every(k =>
      Number.isInteger(g0.ivs[k]) && g0.ivs[k] >= 0 && g0.ivs[k] <= 31 &&
      g0.evs[k] === 0) && g0.bond === 0 && g0.battles === 0 &&
      Number.isInteger(g0.seed) && typeof g0.trait === "string";
    const chromaDerived = await s.evSafe(`(function(){ const m = $gameParty.allMembers()[0]; return m._ganjukoGenetics.chroma === GanjukoEngine.S18.deriveChroma(m._ganjukoGenetics.seed); })()`);
    await rep.check("s18.profileBorn", validProfile && chromaDerived === true,
      `starter profile: ${JSON.stringify(g0)}`);

    // ---- legacy stability ------------------------------------------------
    const legacy = await s.evSafe(`(function(){
      const m = $gameParty.allMembers()[0];
      const S = GanjukoEngine.S18;
      m._ganjukoGenetics = null;
      const a = JSON.stringify(S.geneticsOf(m));
      m._ganjukoGenetics = null;
      const b = JSON.stringify(S.geneticsOf(m));
      const expect = JSON.stringify(S.legacyProfile(m.actorId(), m.ganjukoSpeciesId()));
      return { same: a === b, matchesDerivation: a === expect };
    })()`);
    await rep.check("s18.legacyStable", !!legacy && legacy.same && legacy.matchesDerivation,
      `legacy derivation stable across touches: ${JSON.stringify(legacy)}`);

    // ---- save / load round-trip (clean state, no battle aftermath) --------
    const before = await s.evSafe(geneticsOfMember(0));
    const saved = await s.saveGame(1);
    await s.evSafe("(function(){ const g = $gameParty.allMembers()[0]._ganjukoGenetics; g.bond = 7; g.evs.atk = 99; g.battles = 42; return 1; })()");
    const loaded = await s.loadGame(1);
    const after = await s.evSafe(geneticsOfMember(0));
    let diffKeys = [];
    if (before && after) diffKeys = Object.keys(before).filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
    await rep.check("s18.saveLoad", saved && loaded && deepEqual(before, after),
      `genetics survive save/load exactly: saved=${saved} loaded=${loaded} diffKeys=${JSON.stringify(diffKeys)}`);

    // ---- capture hand-off ---------------------------------------------------
    // Orb choice is deliberate (run 5 diagnosis): Embit's catchRate is 45
    // (starter-hard); with the standard 1.0x Orb at ~25% HP each throw is
    // ~p0.2, and at ~25s per battle round over the tunnel, run 5's ten
    // throws all missed AND the 420s budget died mid-flow (outcome=
    // timeout, foe at 21%, lead healthy at 22%). This check verifies the
    // profile HAND-OFF, not Orb economics, so it throws the Ultra Orb
    // (item 131, documented 2.0x) with a budget sized to measured round
    // cost. The standard-Orb capture path itself is covered by the FR2 /
    // smoke suites against high-catchRate route fodder.
    const ULTRA_ORB = 131;
    await s.seedItem(ULTRA_ORB, 12);
    const capStarted = await s.startWildBattleVerified(1, 3);
    let foeProfile = null, capOutcome = "no-battle", caughtProfile = null, handoffFlag = false;
    if (capStarted) {
      foeProfile = await s.evSafe("(function(){ const f = $gameTroop.members()[0]; return (f && f._ganjukoGenetics) ? JSON.parse(JSON.stringify(f._ganjukoGenetics)) : null; })()");
      const res = await battle.driveBattle(s, { capture: { itemId: ULTRA_ORB, weakenTo: 0.4, maxThrows: 12 }, timeoutMs: 900000 });
      capOutcome = res.outcome;
      const party = await s.partyState();
      if (party && party.length >= 2) caughtProfile = await s.evSafe(geneticsOfMember(party.length - 1));
      handoffFlag = await s.evSafe("(function(){ return GanjukoEngine.S18.status.captureHandoff; })()");
    }
    await rep.check("s18.captureHandoff", capStarted && !!foeProfile && !!caughtProfile &&
      deepEqual(withoutMetPlace(caughtProfile), withoutMetPlace(foeProfile)) &&
      typeof caughtProfile.metPlace === "string" && caughtProfile.metPlace.length > 0 && handoffFlag === true,
      `capture moves the foe's own profile into the party: outcome=${capOutcome} metPlaceStamped=${caughtProfile && caughtProfile.metPlace} flag=${handoffFlag}`);
    await s.healParty();

    // ---- level 100 ---------------------------------------------------------
    await s.seedParty([{ species: 1, level: 100 }]);
    const lv = await s.evSafe(`(function(){
      const ms = $gameParty.allMembers();
      const m = ms[ms.length - 1];
      const ps = [m.mhp, m.mp, m.atk, m.def, m.mat, m.mdf, m.agi, m.luk];
      return { level: m.level, maxLevel: m.maxLevel(), isMax: m.isMaxLevel(), params: ps, finite: ps.every(v => typeof v === "number" && isFinite(v) && v > 0) };
    })()`);
    await rep.check("s18.lv100Params", !!lv && lv.level === 100 && lv.maxLevel === 100 && lv.isMax && lv.finite,
      `Lv100 member: ${JSON.stringify(lv)}`);

    // Solo Lv100 boot for the battle itself (the party lead fights).
    // Run 2's Embit-vs-Embit mirror ran healthily (damage flowing, HP%
    // plates correct) but outlasted 300s of rig driving — a resisted
    // mirror is a war of attrition. This leg therefore: (1) burns the
    // save's guided-battle state on a throwaway Lv2 fight first, and
    // (2) fights the Lv100 battle with a decisive matchup — Bubblix
    // (Water, pos 4) vs Embit (Fire) at Lv100 — with a 600s budget.
    await s.boot(ctx.gameUrl);
    await battle.installHooks(s);
    await newGameRetry(s);
    await s.seedParty([{ species: 4, level: 100 }]);
    let warmOutcome = "no-battle";
    if (await s.startWildBattleVerified(1, 2)) {
      const warm = await battle.driveBattle(s, { strategy: "best", timeoutMs: 240000 });
      warmOutcome = warm.outcome;
    }
    await s.healParty();
    const started = await s.startWildBattleVerified(1, 100);
    let foeFinite = false, fightOutcome = "no-battle";
    if (started) {
      foeFinite = await s.evSafe(`(function(){ const f = $gameTroop.members()[0]; if (!f) return false; const ps = [f.mhp, f.mp, f.atk, f.def, f.mat, f.mdf, f.agi, f.luk]; return ps.every(v => typeof v === "number" && isFinite(v) && v > 0); })()`);
      const res = await battle.driveBattle(s, { strategy: "best", timeoutMs: 600000 });
      fightOutcome = res.outcome;
    }
    await rep.check("s18.lv100Battle", started && foeFinite && (fightOutcome === "win" || fightOutcome === "ended"),
      `Lv100 wild battle (Bubblix Lv100 vs Embit Lv100, warm-up=${warmOutcome}): started=${started} foeParamsFinite=${foeFinite} outcome=${fightOutcome}`);
    await s.healParty();

    // ---- daycare breeding ---------------------------------------------------
    await s.boot(ctx.gameUrl);
    await battle.installHooks(s);
    await newGameRetry(s);
    await s.seedParty([{ species: 1, level: 10 }, { species: 1, level: 10 }, { species: 1, level: 10 }]);
    const parentB = await s.evSafe(geneticsOfMember(1));
    const parentC = await s.evSafe(geneticsOfMember(2));
    await s.ev("(function(){ GanjukoEngine.depositDaycare(1); return 1; })()");
    await s.ev("(function(){ GanjukoEngine.depositDaycare(2); return 1; })()");
    const slots = await s.evSafe(`(function(){ const d = $gameSystem._daycare; return d ? { s1: d.slot1 ? JSON.parse(JSON.stringify(d.slot1.genetics || null)) : null, s2: d.slot2 ? JSON.parse(JSON.stringify(d.slot2.genetics || null)) : null, id1: d.slot1 && d.slot1.id, id2: d.slot2 && d.slot2.id } : null; })()`);
    await rep.check("s18.daycareSnapshots", !!slots && deepEqual(slots.s1, parentB) && deepEqual(slots.s2, parentC),
      `deposit-time snapshots stored on both slots: slotIds=${slots && slots.id1}/${slots && slots.id2}`);
    // Ripen the egg through the real step seam (119 + 1 = the 120-step wait).
    await s.evSafe("(function(){ $gameSystem._daycare.steps = 119; $gameParty.increaseSteps(); return 1; })()");
    const childInfo = await s.evSafe(`(function(){
      const d = $gameSystem._daycare;
      const child = d && d._s18EggChild;
      if (!child) return { eggReady: d && d.eggReady, child: null };
      const keys = ["hp","atk","def","mat","mdf","agi"];
      const inherited = keys.filter(k => child.genetics.ivs[k] === d.slot1.genetics.ivs[k] || child.genetics.ivs[k] === d.slot2.genetics.ivs[k]).length;
      return { eggReady: d.eggReady, speciesId: child.speciesId, inherited: inherited,
        genetics: JSON.parse(JSON.stringify(child.genetics)) };
    })()`);
    await rep.check("s18.childComputed", !!childInfo && childInfo.eggReady === true && !!childInfo.genetics && childInfo.inherited >= 3 &&
      ["hp", "atk", "def", "mat", "mdf", "agi"].every(k => childInfo.genetics.evs[k] === 0) && childInfo.genetics.bond === 0,
      `egg child: species=${childInfo && childInfo.speciesId} inheritedIVs>=${childInfo && childInfo.inherited} evsZero bondZero`);
    // Take the egg (the checkDaycareEgg callback's own assignment) and hatch it.
    await s.evSafe("(function(){ const d = $gameSystem._daycare; $gameSystem._daycareEgg = { speciesId: d.slot1.id, stepsLeft: 1 }; $gameParty.increaseSteps(); return 1; })()");
    await sleep(800);
    const baby = await s.evSafe(`(function(){
      const ms = $gameParty.allMembers();
      const b = ms[ms.length - 1];
      return { count: ms.length, name: b.name(), sp: b.ganjukoSpeciesId(), lv: b.level,
        genetics: b._ganjukoGenetics ? JSON.parse(JSON.stringify(b._ganjukoGenetics)) : null };
    })()`);
    let babyDiff = [];
    if (baby && baby.genetics && childInfo && childInfo.genetics) {
      babyDiff = Object.keys(childInfo.genetics).filter(k => k !== "metPlace" && JSON.stringify(childInfo.genetics[k]) !== JSON.stringify(baby.genetics[k]));
    }
    // Identity (ivs/evs/trait/bond/seed/chroma/battles/steps) must match
    // the egg child EXACTLY; metPlace is stamped at hatch by design
    // ("With you since <hatch place>"), same as a capture.
    await rep.check("s18.bredHatch", !!baby && baby.count === 2 && baby.sp === (childInfo && childInfo.speciesId) &&
      deepEqual(withoutMetPlace(baby.genetics), withoutMetPlace(childInfo && childInfo.genetics)) &&
      typeof baby.genetics.metPlace === "string" && baby.genetics.metPlace.length > 0,
      `hatched: ${JSON.stringify(baby && { name: baby.name, sp: baby.sp, lv: baby.lv })} identityMatchesEggChild=${deepEqual(withoutMetPlace(baby && baby.genetics), withoutMetPlace(childInfo && childInfo.genetics))} metPlaceStamped=${baby && baby.genetics && baby.genetics.metPlace} diffKeys=${JSON.stringify(babyDiff)}`);

    // ---- Character Sheet ------------------------------------------------------
    const sheetOk = await s.evSafe("(function(){ SceneManager.push(Scene_GanjukoSummary); return true; })()");
    const sheetScene = sheetOk ? await s.waitScene("Scene_GanjukoSummary", 40) : false;
    await sleep(1500);
    const sheetState = await s.evSafe(`(function(){
      const w = SceneManager._scene._summaryWindow;
      if (!w) return null;
      let ink = -1;
      try {
        const d = w.contents.context.getImageData(0, 0, w.contents.width, w.contents.height).data;
        let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 0) n++;
        ink = n;
      } catch (e) {}
      return { patched: !!w._s18Patched, inkSamples: ink, hasPortrait: !!w._battlerSprite };
    })()`);
    const shotSheet = await shot(s, outDir, "section18-sheet.png");
    rep.note(`sheet screenshot: ${shotSheet}`);
    await rep.check("s18.characterSheet", sheetScene && !!sheetState && sheetState.patched && sheetState.hasPortrait && sheetState.inkSamples > 500,
      `summary scene rebuilt as Character Sheet (patch=${sheetState && sheetState.patched} portraitSprite=${sheetState && sheetState.hasPortrait} nonBlankInkSamples=${sheetState && sheetState.inkSamples})`);
    await s.evSafe("(function(){ SceneManager.pop(); return 1; })()");
    await s.settle();

    // ---- Chroma in battle -------------------------------------------------------
    await s.boot(ctx.gameUrl);
    await battle.installHooks(s);
    await newGameRetry(s);
    await s.seedParty([{ species: 1, level: 100 }]);
    await s.evSafe("(function(){ $gameParty.allMembers()[0]._ganjukoGenetics.chroma = true; return 1; })()");
    const cStarted = await s.startWildBattleVerified(1, 10);
    let foeFilter = 0, leadFilter = 0, matrixMatch = false, cOutcome = "no-battle";
    if (cStarted) {
      await s.evSafe("(function(){ const f = $gameTroop.members()[0]; if (f && f._ganjukoGenetics) { f._ganjukoGenetics.chroma = true; f._isShiny = true; } return 1; })()");
      await sleep(1600);
      const filters = await s.evSafe(`(function(){
        const ss = SceneManager._scene._spriteset;
        if (!ss) return null;
        const ef = ss._enemySprites && ss._enemySprites[0] ? (ss._enemySprites[0].filters || []) : [];
        const pf = ss._playerGanjukoSprite ? (ss._playerGanjukoSprite.filters || []) : [];
        const foe = $gameTroop.members()[0];
        const sp = foe && foe.ganjukoSpecies ? foe.ganjukoSpecies() : null;
        const expected = GanjukoEngine.S18.chromaMatrix(sp ? (sp.type1 || 1) : 1);
        const got = ef.length && ef[0].matrix ? Array.from(ef[0].matrix) : null;
        const match = !!got && got.length === expected.length && got.every((v, i) => Math.abs(v - expected[i]) < 0.01);
        return { ef: ef.length, pf: pf.length, match: match };
      })()`);
      foeFilter = filters ? filters.ef : 0;
      leadFilter = filters ? filters.pf : 0;
      matrixMatch = !!(filters && filters.match);
      const shotChroma = await shot(s, outDir, "section18-chroma-battle.png");
      rep.note(`chroma battle screenshot: ${shotChroma}`);
      const res = await battle.driveBattle(s, { strategy: "best", timeoutMs: 300000 });
      cOutcome = res.outcome;
    }
    await rep.check("s18.chromaBattle", cStarted && foeFilter >= 1 && leadFilter >= 1 && matrixMatch && (cOutcome === "win" || cOutcome === "ended"),
      `colour-matrix filters live on foe (${foeFilter}) and lead (${leadFilter}); foe filter matrix == S18.chromaMatrix(type): ${matrixMatch}; outcome=${cOutcome}`);

    // ---- Dex Chroma tag ---------------------------------------------------------
    // The lead's species is read AFTER the battle: a directly-seeded
    // Lv100 Embit may evolve when it gains EXP, so the Dex leg follows
    // the lead's ACTUAL species (run 2 asserted ownsChroma(1) blind and
    // the lead was no longer an Embit — or no longer flagged; the detail
    // line now prints both facts).
    const leadInfo = await s.evSafe(`(function(){
      const m = $gameParty.allMembers()[0];
      if (!m) return null;
      const sp = m.ganjukoSpeciesId();
      if (typeof $gameSystem !== "undefined" && $gameSystem && typeof $gameSystem.registerSeen === "function") $gameSystem.registerSeen(sp);
      return { sp: sp, chroma: !!(m._ganjukoGenetics && m._ganjukoGenetics.chroma),
        owns: GanjukoEngine.S18.ownsChroma(sp) };
    })()`);
    const owns = !!(leadInfo && leadInfo.owns);
    await s.evSafe("(function(){ SceneManager.push(Scene_GanjukoDex); return true; })()");
    const dexScene = await s.waitScene("Scene_GanjukoDex", 40);
    await sleep(800);
    await s.evSafe(`(function(){ const w = SceneManager._scene._detailWindow; if (w) { w._speciesId = ${leadInfo ? leadInfo.sp : 1}; w.refresh(); } return 1; })()`);
    await sleep(600);
    const dexDims = await s.evSafe("(function(){ const w = SceneManager._scene._detailWindow; return w ? { iw: w.innerWidth, ih: w.innerHeight } : null; })()");
    const shotDex = await shot(s, outDir, "section18-dex.png");
    rep.note(`dex screenshot: ${shotDex}`);
    await rep.check("s18.dexChromaTag", owns === true && dexScene && !!leadInfo && leadInfo.chroma === true,
      `lead after battle: species=${leadInfo && leadInfo.sp} chromaFlag=${leadInfo && leadInfo.chroma} ownsChroma(that species)=${owns}; dex detail ${JSON.stringify(dexDims)} rendered for it (Kind line in desc flow + gold Chroma tag under the battler sprite, see screenshot)`);
    await s.evSafe("(function(){ SceneManager.pop(); return 1; })()");
    await s.settle();

    // ---- The Listener -------------------------------------------------------------
    const deferred = await s.evSafe("(function(){ const r = GanjukoEngine.S18.listenerEvent(); const texts = ($gameMessage && $gameMessage._texts) || []; return { r: r, texts: texts.slice() }; })()");
    for (let i = 0; i < 10; i++) {
      const busy = await s.evSafe("!!($gameMessage && $gameMessage.isBusy())");
      if (!busy) break;
      await s.holdOk(280);
      await sleep(420);
    }
    for (const b of BADGES) await s.seedBadge(b);
    const badgeCount = await s.evSafe("(function(){ return $gameSystem.badges().length; })()");
    const opened = await s.evSafe("(function(){ return GanjukoEngine.S18.listenerEvent(); })()");
    const listenerScene = opened ? await s.waitScene("Scene_GanjukoListener", 40) : false;
    let verdictLines = [];
    if (listenerScene) {
      await sleep(800);
      await s.holdOk(400);
      await sleep(900);
      verdictLines = await s.evSafe("(function(){ const w = SceneManager._scene._textWindow; return w ? (w._lines || []) : []; })()") || [];
      const shotListener = await shot(s, outDir, "section18-listener.png");
      rep.note(`listener screenshot: ${shotListener}`);
      await s.holdKey("cancel", 300);
      await s.settle();
    }
    await rep.check("s18.listener", !!deferred && deferred.r === false && deferred.texts.some(t => /Eight badges/.test(t)) &&
      badgeCount === 8 && opened === true && listenerScene && verdictLines.some(t => /gift is its/.test(t)),
      `deferred below 8 badges=${JSON.stringify(deferred && deferred.r)}; opened at 8 (count=${badgeCount}); verdict lines=${JSON.stringify(verdictLines)}`);

    // ---- exceptions -----------------------------------------------------------------
    const exc = s.cdp.exceptions.slice(exc0);
    await rep.check("s18.noExceptions", exc.length === 0,
      exc.length ? `first: ${exc[0].text || exc[0].message || JSON.stringify(exc[0])}` : "zero uncaught exceptions across the suite");

    return rep.write();
  } catch (e) {
    rep.note("SUITE ERROR: " + (e && e.message));
    try { await rep.check("s18.suiteCompleted", false, String(e && e.message)); } catch (_) {}
    return rep.write();
  } finally {
    if (ctx && ctx.close) { try { await ctx.close(); } catch (e) {} }
  }
}

module.exports = { run };
