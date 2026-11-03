// rig2 section19 suite — Section 19 live verification: the offline
// Arena end to end in the real game. Hub + welcome AP, registration
// from the player's own save only, a Trial Partner rental (fixed
// honest profile read back as test evidence — the shipped UI never
// shows those numbers), a full SINGLES sparring bout and a full
// DOUBLES sparring bout (preview -> picks -> battle -> result ->
// restore), the Champions turn timer forcing auto-picks and a
// three-strikes forfeit, recruitment, and Arena state across
// save/load. Screenshots are saved for the hub, register, trials,
// doubles battle and season surfaces for the HP-rule audit.
"use strict";
const path = require("path");
const { openLive, preEngineMd5 } = require("../lib/live");
const { Reporter } = require("../lib/results");
const battle = require("../lib/battle");
const { sleep } = require("../lib/cdp");

async function newGameRetry(s, tries = 3) {
  let lastErr = null;
  for (let i = 0; i < tries; i++) {
    try { await s.newGame(); return; } catch (e) { lastErr = e; await sleep(4000); }
  }
  throw lastErr;
}

// A freshly goto'd Scene_Map reports its name before it has STARTED:
// pushing Scene_Battle in that window throws inside Scene_Map.stop
// (the _mapNameWindow deref the session lib warns about — diagnosed
// live in the first section19 runs). Wait for formation, not name.
async function waitMapFormed(s, tries = 40) {
  for (let i = 0; i < tries; i++) {
    const formed = await s.evSafe("(function(){ const sc = SceneManager._scene; return !!sc && sc.constructor.name === 'Scene_Map' && !!sc._mapNameWindow; })()");
    if (formed) { await sleep(800); return true; }
    await sleep(500);
  }
  return false;
}

async function shot(s, outDir, name) {
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

const arenaState = (s) => s.evSafe(`(function(){ const S = GanjukoEngine.S19; const a = S.ensureArena();
  return JSON.parse(JSON.stringify({ ap: a.ap, team: a.team, record: a.record,
    rentals: a.rentals, rentalSets: a.rentalSets, recruited: a.recruited, lastResult: a.lastResult })); })()`);

const pickSnapshot = (s) => s.evSafe(`(function(){ const S = GanjukoEngine.S19; const a = S.ensureArena();
  return a.team.map(id => { const m = $gameActors.actor(id); if (!m) return null;
    const g = m._ganjukoGenetics;
    return { id, lv: m.level, exp: m.currentExp(), hp: m.hp, mp: m.mp,
             evs: g ? JSON.parse(JSON.stringify(g.evs)) : null,
             bond: g ? g.bond : null }; }); })()`);

const partyIds = (s) => s.evSafe("(function(){ return $gameParty.allMembers().map(m => m.actorId()); })()");

// Restore equality: every field exact, except bond — a WIN pays the
// section's sanctioned +1 bond to each own pick that took part
// (design A.6: Arena grants no EXP/EVs, bond may grow). Anything
// beyond that single +1 is a restore leak.
function snapshotRestored(before, after, won, pickIds) {
  if (!Array.isArray(before) || !Array.isArray(after) || before.length !== after.length) return false;
  return before.every((b, i) => {
    const a = after[i];
    if (!b || !a || b.id !== a.id) return false;
    const expectBond = won && pickIds.includes(b.id) ? 1 : 0;
    return b.lv === a.lv && b.exp === a.exp && b.hp === a.hp && b.mp === a.mp &&
      JSON.stringify(b.evs) === JSON.stringify(a.evs) && (a.bond || 0) - (b.bond || 0) === expectBond;
  });
}

// Drive an Arena battle to its end: the terminal scene is the Arena
// hub (finishArenaBattle pushes it), not Scene_Map, so driveBattle's
// Map-return detection does not apply. Reuses battleStep wholesale.
async function arenaDrive(s, opts = {}) {
  const timeoutMs = opts.timeoutMs || 300000;
  const t0 = Date.now();
  let sawBattle = false;
  let shotDone = false;
  let lastRescue = 0;
  while (Date.now() - t0 < timeoutMs) {
    const st = await battle.battleState(s);
    if (!st) { await sleep(600); continue; }
    if (st.scene === "Scene_Battle") {
      sawBattle = true;
      if (opts.onFirstCmd && !shotDone && st.cmd) { shotDone = true; try { await opts.onFirstCmd(); } catch (e) {} }
    }
    if (st.scene === "Scene_GanjukoArena" && sawBattle) return { ended: true, turns: st.turn };
    if (st.scene === "Scene_Gameover") return { ended: false, why: "gameover" };
    if (!sawBattle && Date.now() - t0 > 60000) return { ended: false, why: "no-battle" };
    if (opts.idle) {
      // Timer leg: never fight. Only advance start/end phases and
      // message prompts; the turn clock must do the rest.
      if (st.scene === "Scene_Battle" && (st.phase === "start" || st.phase === "battleEnd")) {
        await s.holdOk(300); await sleep(700);
      } else if (st.scene === "Scene_Map") {
        await sleep(600);
      } else { await sleep(500); }
      continue;
    }
    // Assisted clock driving (the driven-bout default). Probes over
    // the tunnel showed the window-surgery driver (fightViaUI) is
    // slower and less reliable than the game's own turn clock: its
    // OK presses land in this engine's collapsed FIGHT->skill flow
    // and submit the skill window's remembered entry (index 0 is a
    // self-heal for the seeded lead), while its eval round-trips can
    // stall for minutes. The Arena clock, by contrast, auto-picks a
    // damaging skill on every turn timeout (probe-verified from the
    // battle log: "acts on instinct" -> Tackle -> real damage). So:
    // let the clock fight, and press OK on a fixed ~3 s cadence for
    // the whole battle. An OK during the action phase is a no-op
    // (or advances the log); an OK during an input phase submits
    // manually, which keeps the three-strikes forfeit from arming.
    // Window-state-gated rescues were tried first and lost a bout:
    // sparse state samples kept missing whole input phases in the
    // fast stretches, and three consecutive timeouts forfeited a
    // winning battle one foe from the end. The command cursor is
    // never moved off FIGHT (no direction keys are ever sent), so a
    // cadence OK can only confirm FIGHT or the open skill/target
    // selection.
    if (st.scene === "Scene_Battle" && Date.now() - lastRescue > 3000) {
      lastRescue = Date.now();
      await s.holdOk(300); await sleep(500);
    } else {
      await sleep(550);
    }
  }
  return { ended: false, why: "timeout" };
}

async function run({ target, outDir, port, cdpPort }) {
  const rep = new Reporter({ suite: "section19", target, engineMd5: preEngineMd5(target), outDir });
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
    const status = await s.evSafe("(function(){ const S = GanjukoEngine.S19; return S ? S.status : null; })()");
    const allTrue = !!status && Object.values(status).every(v => v === true);
    await rep.check("s19.status", allTrue, `GE.S19.status all true: ${JSON.stringify(status)}`);

    // ---- seed a Sprout-band team of six --------------------------------
    await newGameRetry(s);
    await s.seedParty([
      { species: 3, level: 20 }, { species: 6, level: 20 }, { species: 9, level: 19 },
      { species: 20, level: 19 }, { species: 25, level: 18 }, { species: 18, level: 18 }
    ]);
    const seeded = await s.partyState();
    await rep.check("s19.seeded", !!seeded && seeded.length === 6,
      `seeded party: ${JSON.stringify(seeded && seeded.map(m => m.sp + "@" + m.lv))}`);

    // ---- hub + welcome AP ----------------------------------------------
    const opened = await s.evSafe("(function(){ return GanjukoEngine.S19.openArena(); })()");
    const hubReached = await s.waitScene("Scene_GanjukoArena", 40);
    const st0 = await arenaState(s);
    await rep.check("s19.hubWelcome", opened === true && hubReached && !!st0 && st0.ap === 150,
      `hub opened=${hubReached}, welcome AP=${st0 && st0.ap} (expect 150)`);
    await shot(s, outDir, "s19-hub.png");

    // ---- registration from own save only --------------------------------
    const reg = await s.evSafe(`(function(){ const S = GanjukoEngine.S19;
      const ids = $gameParty.allMembers().map(m => m.actorId());
      const okRes = S.setTeam(ids);
      const foreign = S.validateRegistration(ids.concat([99999]), S.sourceIds());
      return { okRes, foreign, team: S.ensureArena().team }; })()`);
    await rep.check("s19.registerOwnSave", !!reg && reg.okRes.ok === true && reg.foreign.ok === false && reg.team.length === 6,
      `setTeam(own party)=${JSON.stringify(reg && reg.okRes)}; foreign id refused=${reg && reg.foreign.ok === false}`);
    await s.evSafe("(function(){ SceneManager.push(Scene_GanjukoArenaRegister); return 1; })()");
    await s.waitScene("Scene_GanjukoArenaRegister", 30);
    await shot(s, outDir, "s19-register.png");
    await s.evSafe("(function(){ SceneManager.pop(); return 1; })()");
    await s.waitScene("Scene_GanjukoArena", 30);

    // ---- Trial rental ----------------------------------------------------
    const rent = await s.evSafe(`(function(){ const S = GanjukoEngine.S19;
      const r = S.rentTrial("sprout-embit");
      const a = S.ensureArena();
      const actor = r.ok ? $gameActors.actor(r.actorId) : null;
      const g = actor ? actor._ganjukoGenetics : null;
      return { ok: r.ok, ap: a.ap, actorId: r.actorId, battlesLeft: a.rentals["sprout-embit"] && a.rentals["sprout-embit"].battlesLeft,
        inParty: actor ? $gameParty.allMembers().some(m => m.actorId() === r.actorId) : null,
        ivs16: g ? Object.values(g.ivs).every(v => v === 16) : false,
        evs0: g ? Object.values(g.evs).every(v => v === 0) : false,
        bond0: g ? g.bond === 0 : false, chroma: g ? g.chroma : null,
        trialSource: S.arenaSources().some(x => x.actorId === r.actorId && x.source === "trial") }; })()`);
    await rep.check("s19.rentTrial", !!rent && rent.ok === true && rent.ap === 100 && rent.battlesLeft === 10 &&
      rent.inParty === false && rent.ivs16 && rent.evs0 && rent.bond0 && rent.chroma === false && rent.trialSource === true,
      `rent: ${JSON.stringify(rent)}`);
    await s.evSafe("(function(){ SceneManager.push(Scene_GanjukoArenaTrials); return 1; })()");
    await s.waitScene("Scene_GanjukoArenaTrials", 30);
    await shot(s, outDir, "s19-trials.png");
    await s.evSafe("(function(){ SceneManager.pop(); return 1; })()");
    await s.waitScene("Scene_GanjukoArena", 30);
    // Drop the rental from the team (ends its set) so battle snapshots
    // cover only the player's own six.
    await s.evSafe(`(function(){ const S = GanjukoEngine.S19; const a = S.ensureArena();
      return S.setTeam(a.team.filter(id => id !== ${rent.actorId})); })()`);

    // ---- SINGLES sparring, full bout --------------------------------------
    // Driven bouts run on the section's own TIMERS test seam: a
    // SHORT turn clock (3 s) so the Arena's timeout auto-pick fights
    // the bout (see arenaDrive), with the match/your-time clocks
    // relaxed so the bout is decided by KOs, not the big clocks.
    // The shipped defaults are restored before the timer leg, which
    // tests enforcement itself.
    await s.evSafe("(function(){ const T = GanjukoEngine.S19.TIMERS; T.turnMs = 3000; T.yourMs = 3600000; T.totalMs = 3600000; return 1; })()");
    const snapBefore = await pickSnapshot(s);
    const preIds = await partyIds(s);
    const apBefore = (await arenaState(s)).ap;
    const started1 = await s.evSafe(`(function(){ const S = GanjukoEngine.S19;
      SceneManager.goto(Scene_Map);
      return true; })()`);
    await s.waitScene("Scene_Map", 40);
    await waitMapFormed(s);
    const startOk1 = await s.evSafe(`(function(){ const S = GanjukoEngine.S19;
      return S.startSparring("singles", "rin", S.defaultPicks("singles")); })()`);
    const inBattle1 = await s.waitScene("Scene_Battle", 40);
    await rep.check("s19.singlesStart", startOk1 === true && inBattle1,
      `startSparring singles vs rin: started=${startOk1} battleScene=${inBattle1} (goto=${started1})`);
    const drive1 = await arenaDrive(s, { timeoutMs: 300000, onFirstCmd: () => shot(s, outDir, "s19-singles-battle.png") });
    const stAfter1 = await arenaState(s);
    const snapAfter1 = await pickSnapshot(s);
    const postIds1 = await partyIds(s);
    // Outcome-aware settlement check. The task's bar is a full
    // end-to-end bout (preview -> picks -> battle -> result), and
    // WHO wins a tunnel-driven bout is environment luck: the driven
    // side fights through the Arena clock's auto-picks plus cadence
    // OKs, and the Razer page's frame rate varies wildly under
    // cross-agent load (both outcomes were observed live during
    // development; the win settlement below was verified live in
    // the doubles leg of the 2026-11-02 2cf68 run and in probes).
    // What this check pins down is that the bout ENDED at the hub
    // and that settlement matches the recorded outcome exactly:
    // win = +25 AP (+20 more on the day's first win), loss = +5.
    const won1 = !!stAfter1 && stAfter1.record.wins === 1;
    const lost1 = !!stAfter1 && stAfter1.record.losses === 1;
    const expectAp1 = apBefore + (won1 ? 45 : lost1 ? 5 : -9999);
    const restored1 = JSON.stringify(preIds) === JSON.stringify(postIds1) &&
      snapshotRestored(snapBefore, snapAfter1, won1,
        snapBefore.slice(0, 3).map(x => x && x.id));
    await rep.check("s19.singlesBout", drive1.ended === true && !!stAfter1 && (won1 || lost1) &&
      stAfter1.ap === expectAp1,
      `singles bout ended=${drive1.ended} (${drive1.why || "hub"}) outcome=${won1 ? "win" : lost1 ? "loss" : "?"} AP ${apBefore}->${stAfter1 && stAfter1.ap} (expect ${expectAp1})`);
    await rep.check("s19.singlesRestore", restored1,
      `party + level/EXP/EV snapshot identical after bout: before=${JSON.stringify(snapBefore)} after=${JSON.stringify(snapAfter1)}`);

    // ---- DOUBLES sparring, full bout --------------------------------------
    const snapBefore2 = await pickSnapshot(s);
    await s.evSafe("(function(){ SceneManager.goto(Scene_Map); return 1; })()");
    await s.waitScene("Scene_Map", 40);
    await waitMapFormed(s);
    const startOk2 = await s.evSafe(`(function(){ const S = GanjukoEngine.S19;
      return S.startSparring("doubles", "june", S.defaultPicks("doubles")); })()`);
    const inBattle2 = await s.waitScene("Scene_Battle", 40);
    let actives = null;
    for (let i = 0; i < 20 && inBattle2; i++) {
      actives = await s.evSafe(`(function(){ return { party: $gameParty.battleMembers().length,
        troop: $gameTroop.members().length,
        plates: (function(){ const sc = SceneManager._scene; const ss = sc && sc._spriteset;
          return { hud: !!(ss && ss._ganjukoHudSprite), ally2: !!(ss && ss._playerGanjukoSprite2) }; })() }; })()`);
      if (actives && actives.party === 2 && actives.troop === 2) break;
      await sleep(700);
    }
    await rep.check("s19.doublesActives", startOk2 === true && !!actives && actives.party === 2 && actives.troop === 2 &&
      actives.plates.hud === true && actives.plates.ally2 === true,
      `doubles actives: ${JSON.stringify(actives)} (2v2 + second ally sprite)`);
    await shot(s, outDir, "s19-doubles-battle.png");
    const drive2 = await arenaDrive(s, { timeoutMs: 420000 });
    const stAfter2 = await arenaState(s);
    const snapAfter2 = await pickSnapshot(s);
    // Outcome-aware, same reasoning as the singles leg: the day's
    // first-win bonus (+20) rides on whichever bout is won FIRST,
    // so the expected AP is computed from both outcomes.
    const won2 = !!stAfter2 && stAfter1 && stAfter2.record.wins === stAfter1.record.wins + 1;
    const lost2 = !!stAfter2 && stAfter1 && stAfter2.record.losses === stAfter1.record.losses + 1;
    const expectAp2 = !stAfter2 ? -9999 : stAfter2.ap - (won2 ? (won1 ? 35 : 55) : lost2 ? 5 : -9999);
    const restored2 = snapshotRestored(snapBefore2, snapAfter2, won2,
      snapBefore2.slice(0, 4).map(x => x && x.id));
    await rep.check("s19.doublesBout", drive2.ended === true && !!stAfter2 && (won2 || lost2) && restored2 &&
      !!stAfter1 && expectAp2 === stAfter1.ap,
      `doubles bout ended=${drive2.ended} outcome=${won2 ? "win" : lost2 ? "loss" : "?"} AP ${stAfter1 && stAfter1.ap}->${stAfter2 && stAfter2.ap}; restore identical=${restored2}`);
    // Shipped clock restored before the season surface + timer leg.
    await s.evSafe("(function(){ const T = GanjukoEngine.S19.TIMERS; T.turnMs = 45000; T.yourMs = 420000; T.totalMs = 1200000; return 1; })()");

    // ---- season surface ----------------------------------------------------
    await s.evSafe("(function(){ SceneManager.push(Scene_GanjukoArenaSeason); return 1; })()");
    await s.waitScene("Scene_GanjukoArenaSeason", 30);
    await shot(s, outDir, "s19-season.png");
    await s.evSafe("(function(){ SceneManager.pop(); return 1; })()");
    await s.waitScene("Scene_GanjukoArena", 30);

    // ---- timer leg: no input -> auto-picks -> three strikes -> forfeit ----
    const lossesBefore = (await arenaState(s)).record.losses;
    const actionsBefore = (await battle.readActions(s)).length;
    await s.evSafe("(function(){ GanjukoEngine.S19.TIMERS.turnMs = 2500; return 1; })()");
    await s.evSafe("(function(){ SceneManager.goto(Scene_Map); return 1; })()");
    await s.waitScene("Scene_Map", 40);
    await waitMapFormed(s);
    const startOk3 = await s.evSafe(`(function(){ const S = GanjukoEngine.S19;
      return S.startSparring("singles", "june", S.defaultPicks("singles")); })()`);
    const inBattle3 = await s.waitScene("Scene_Battle", 40);
    const drive3 = await arenaDrive(s, { timeoutMs: 300000, idle: true });
    await s.evSafe("(function(){ GanjukoEngine.S19.TIMERS.turnMs = 45000; return 1; })()");
    const stAfter3 = await arenaState(s);
    const actions3 = (await battle.readActions(s)).slice(actionsBefore);
    const playerActions = actions3.filter(a => a.actorSide === true).length;
    await rep.check("s19.timerForfeit", startOk3 === true && inBattle3 && drive3.ended === true &&
      !!stAfter3 && stAfter3.record.losses === lossesBefore + 1 && playerActions >= 1,
      `idle bout: ended=${drive3.ended} losses ${lossesBefore}->${stAfter3 && stAfter3.record.losses}; auto-picked player actions=${playerActions}`);

    // ---- recruitment --------------------------------------------------------
    const rec = await s.evSafe(`(function(){ const S = GanjukoEngine.S19; const a = S.ensureArena();
      a.rentalSets["sprout-embit"] = 5; a.ap = 600;
      const r = S.recruitTrial("sprout-embit");
      const actor = r.ok ? $gameActors.actor(r.actorId) : null;
      const g = actor ? actor._ganjukoGenetics : null;
      return { ok: r.ok, ap: a.ap, owned: actor ? ($gameParty.allMembers().some(m => m.actorId() === r.actorId) ||
        $gameSystem.ganjukoBox().includes(r.actorId)) : false,
        ivs16: g ? Object.values(g.ivs).every(v => v === 16) : false }; })()`);
    await rep.check("s19.recruit", !!rec && rec.ok === true && rec.ap === 100 && rec.owned === true && rec.ivs16 === true,
      `recruit after 5 sets: ${JSON.stringify(rec)}`);

    // ---- Arena state across save/load ---------------------------------------
    const preSave = await arenaState(s);
    const saved = await s.saveGame(1);
    await s.evSafe("(function(){ const a = GanjukoEngine.S19.ensureArena(); a.ap = 1; a.team = []; return 1; })()");
    const loaded = await s.loadGame(1);
    const postLoad = await arenaState(s);
    await rep.check("s19.saveLoad", saved && loaded && !!postLoad && postLoad.ap === preSave.ap &&
      JSON.stringify(postLoad.team) === JSON.stringify(preSave.team) && postLoad.record.wins === preSave.record.wins,
      `arena state survives save/load: saved=${saved} loaded=${loaded} ap=${postLoad && postLoad.ap} team=${postLoad && postLoad.team.length}`);

    const exc = s.cdp.exceptions.slice(exc0);
    await rep.check("s19.noExceptions", exc.length === 0,
      exc.length ? `exceptions: ${JSON.stringify(exc.slice(0, 3))}` : "no uncaught exceptions");
  } catch (e) {
    try { await rep.check("s19.suiteCompleted", false, String(e && e.message)); } catch (_) {}
  } finally {
    if (ctx && ctx.cleanup) { try { await ctx.cleanup(); } catch (e) {} }
  }
  return rep.write();
}

module.exports = { run };
