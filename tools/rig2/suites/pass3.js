// rig2 pass3 suite — Engine Pass 3 live verification: tutorial-through-
// gameplay + the Lab/intro identity fix, driven through the REAL game flow.
//   Run A: title -> intro (showcase identity) -> Lab orb pick (Bubblix —
//     proves the positional-id defect fix in-game) -> Haru battle = guided
//     battle (coaching beats observed + dismissed by hand) -> Route 1
//     capture lesson (real Orb catch completes it) -> next battle coach-free.
//   Run B: second fresh game — guided battle fires in a Route 1 WILD battle
//     instead (trigger is state, not an event), lesson follows, no refires.
//   Run C: progressed state with NO tutorial flag (legacy save shape) never
//     gets retro-tutorialized; starter-chosen fresh legacy state still arms.
"use strict";
const { openLive, preEngineMd5 } = require("../lib/live");
const { Reporter } = require("../lib/results");
const battle = require("../lib/battle");
const { sleep } = require("../lib/cdp");

const ORB = 1;

async function advanceEvent(session, timeoutMs = 90000) {
  // Press OK (advances text; confirms the default choice) until the map
  // interpreter finishes. Returns true when the event completed.
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const scene = await session.sceneName();
    if (scene === "Scene_Battle") return true; // event handed off to a battle
    const running = await session.evSafe("!!($gameMap && $gameMap._interpreter && $gameMap._interpreter.isRunning())");
    if (!running) {
      await sleep(500);
      const still = await session.evSafe("!!($gameMap && $gameMap._interpreter && $gameMap._interpreter.isRunning())");
      if (!still) return true;
    }
    await session.holdOk(280);
    await sleep(430);
  }
  return false;
}

async function coachState(session) {
  return session.evSafe(`(function(){
    const s = SceneManager._scene;
    if (!s || s.constructor.name !== "Scene_Battle") return null;
    return {
      kind: (typeof $gameTemp !== "undefined" && $gameTemp) ? ($gameTemp._p3Kind || null) : null,
      hasWindow: !!s._p3CoachWindow,
      showing: (s._p3 && s._p3.showing) ? { id: s._p3.showing.id, text: s._p3.showing.text } : null
    };
  })()`);
}

// Drive a battle that may carry P3 coaching: record every coach beat shown,
// dismiss each with a deliberate OK (the way a player would), and hand all
// non-coach moments to the standard battleStep driver.
async function driveCoached(session, opts, seen, timeoutMs = 300000) {
  const ctx = { evoPressed: false, itemUsed: false, throws: 0, lastAction: null };
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const scene = await session.sceneName();
    if (scene === "Scene_Map") return { outcome: "ended", throws: ctx.throws };
    if (scene === "Scene_GanjukoEvolution") {
      await battle.battleStep(session, await battle.battleState(session), opts, ctx);
      continue;
    }
    if (scene !== "Scene_Battle") { await sleep(450); continue; }
    const cs = await coachState(session);
    if (cs && cs.showing) {
      if (!seen.find(b => b.id === cs.showing.id)) seen.push(cs.showing);
      await session.holdOk(260);
      await sleep(430);
      continue;
    }
    const st = await battle.battleState(session);
    await battle.battleStep(session, st, opts, ctx);
  }
  return { outcome: "timeout", throws: ctx.throws };
}

async function tutorialState(session) {
  return session.evSafe("(function(){ const s = $gameSystem._ganjukoTutorial; return s ? { battle: s.battle, capture: s.capture, v: s.v } : null; })()");
}

async function freshGameThroughIntro(session, rep, tag) {
  // REAL title flow: the title scene's own New Game command (this is the
  // call the P3 hook wraps — rig newGame() would bypass it).
  await session.waitScene("Scene_Title", 90);
  await session.ev("SceneManager._scene.commandNewGame()");
  const st = await tutorialState(session);
  await rep.check(tag + ".tutorialBorn", !!st && st.battle === 0 && st.capture === 0,
    `new game initializes tutorial state: ${JSON.stringify(st)}`);
  const inIntro = await session.waitScene("Scene_GanjukoIntro", 60);
  if (!inIntro) throw new Error("intro scene never arrived");
  // Advance to step 4 (starter showcase).
  let urls = null;
  for (let i = 0; i < 40; i++) {
    const step = await session.evSafe("SceneManager._scene._step");
    if (step === 4) {
      await sleep(1800);
      urls = await session.evSafe("(function(){ const s = SceneManager._scene; return (s._starterSprites || []).map(sp => (sp.bitmap && sp.bitmap.url) || ''); })()");
      break;
    }
    await session.holdOk(300);
    await sleep(600);
  }
  await rep.check(tag + ".showcaseIdentity",
    Array.isArray(urls) && urls.some(u => /Ganjuko_Bubblix/.test(u)) && urls.some(u => /Ganjuko_Florabit/.test(u)) &&
    !urls.some(u => /Aquafox|Leafpup/.test(u)),
    `intro showcase battlers: ${JSON.stringify(urls)}`);
  // Through avatar select to the map.
  for (let i = 0; i < 30; i++) {
    if ((await session.sceneName()) === "Scene_Map") break;
    await session.holdOk(300);
    await sleep(600);
  }
  const onMap = (await session.sceneName()) === "Scene_Map";
  if (!onMap) throw new Error("intro never handed off to Scene_Map");
  await session.settle();
  return true;
}

async function pickOrb(session, evId, standX, standY) {
  await session.ev(`(function(){ $gamePlayer.locate(${standX}, ${standY}); $gamePlayer.setDirection(8); return 1; })()`);
  await sleep(500);
  await session.holdOk(300); // action-button trigger on the orb event
  return advanceEvent(session);
}

async function route1Encounter(session, timeoutMs = 150000) {
  // Real stepping first: stand in tall grass and pace. If variance wins,
  // fall back to Scene_Map.updateEncounter — the exact per-frame trigger.
  const grass = await session.evSafe(`(function(){
    for (let y = 0; y < $dataMap.height; y++) for (let x = 0; x < $dataMap.width; x++) {
      for (let z = 0; z < 4; z++) { const t = $gameMap.tileId(x, y, z); if (t === 3413 || t === 3414 || t === 3415) return { x, y }; }
    }
    return null;
  })()`);
  if (grass) {
    await session.ev(`(function(){ $gamePlayer.locate(${grass.x}, ${grass.y}); return 1; })()`);
    await sleep(400);
  }
  const t0 = Date.now();
  let dir = "left";
  while (Date.now() - t0 < timeoutMs) {
    if ((await session.sceneName()) === "Scene_Battle") { await session.settle(10000); return true; }
    await session.holdKey(dir, 330);
    dir = dir === "left" ? "right" : "left";
    await sleep(120);
    if (Date.now() - t0 > timeoutMs * 0.55) {
      await session.evSafe("(function(){ try { $gamePlayer._encounterCount = 0; SceneManager._scene.updateEncounter(); } catch (e) {} return 1; })()");
    }
  }
  return (await session.sceneName()) === "Scene_Battle";
}

async function run({ target, outDir, port, cdpPort }) {
  const rep = new Reporter({ suite: "pass3", target, engineMd5: preEngineMd5(target), outDir });
  let ctx = null;
  try {
    ctx = await openLive({ target, port, cdpPort });
    rep.engineMd5 = ctx.engineMd5 || rep.engineMd5;
    rep.attachSession(ctx.session);
    const s = ctx.session;
    const boot = await s.boot(ctx.gameUrl);
    rep.note(`boot: focus=${boot.focused} webgl=${boot.webgl} fps=${boot.fps}`);
    await battle.installHooks(s);

    const p3 = await s.evSafe("(function(){ const P = GanjukoEngine.P3; return P ? { status: P.status, target: P.pickLessonTarget() } : null; })()");
    await rep.check("p3.installed", !!p3 && Object.values(p3.status).every(v => v === true),
      `GE.P3 hooks: ${JSON.stringify(p3 && p3.status)}`);
    await rep.check("p3.lessonTarget", !!p3 && p3.target && p3.target.speciesPos === 14 && p3.target.level === 2,
      `runtime lesson target: ${JSON.stringify(p3 && p3.target)}`);

    // ================= RUN A =================
    await freshGameThroughIntro(s, rep, "a");
    await s.directLoadMap(2, 8, 11);
    const labSprites = await s.evSafe("(function(){ return { ev5: $gameMap.event(5) ? $gameMap.event(5)._characterName : null, ev6: $gameMap.event(6) ? $gameMap.event(6)._characterName : null }; })()");
    await rep.check("a.labIdentity", labSprites && labSprites.ev5 === "$Ganjuko_Bubblix_Walk" && labSprites.ev6 === "$Ganjuko_Florabit_Walk",
      `Lab specimen sprites: ${JSON.stringify(labSprites)}`);

    const picked = await pickOrb(s, 5, 12, 5);
    const partyA = await s.partyState();
    const invA = await s.evSafe("(function(){ return { orbs: $gameParty.numItems($dataItems[1]), potions: $gameParty.numItems($dataItems[4]), var1: $gameVariables.value(1), sw1: $gameSwitches.value(1) }; })()");
    await rep.check("a.orbPickBubblix", picked && partyA && partyA[0] && partyA[0].sp === 4,
      `Bubblix orb grants positional species 4 (was 3=Pyroclysm pre-fix): party=${JSON.stringify(partyA)}`);
    await rep.check("a.starterKit", !!invA && invA.orbs === 5 && invA.potions === 3 && invA.var1 === 4 && invA.sw1 === true,
      `starter kit + bookkeeping: ${JSON.stringify(invA)}`);
    const follower = await s.evSafe("$gameParty.leader() ? $gameParty.leader().characterName() : null");
    await rep.check("a.followerIdentity", follower === "$Ganjuko_Bubblix_Walk", `follower sheet: ${follower}`);

    // Haru battle = the guided battle.
    await s.ev("(function(){ $gamePlayer.locate(5, 7); $gamePlayer.setDirection(8); return 1; })()");
    await sleep(500);
    await s.holdOk(300);
    const haruDone = await advanceEvent(s, 120000);
    const inBattle = (await s.sceneName()) === "Scene_Battle";
    await rep.check("a.haruBattleStarts", inBattle || haruDone, `Haru event flow reached battle: scene=${await s.sceneName()}`);
    if (inBattle) {
      const cs0 = await coachState(s);
      await rep.check("a.guidedArmed", !!cs0 && cs0.kind === "battle" && cs0.hasWindow,
        `guided battle armed: ${JSON.stringify(cs0)}`);
      const seenA = [];
      const resA = await driveCoached(s, { strategy: "best" }, seenA, 300000);
      const idsA = seenA.map(b => b.id);
      await rep.check("a.coachingFired", idsA.includes("a") && idsA.includes("b"),
        `guided beats observed: ${idsA.join(",")} (d/c seen: ${idsA.includes("d")}/${idsA.includes("c")}); outcome=${resA.outcome}`);
      rep.note("beat A text: " + ((seenA.find(b => b.id === "a") || {}).text || "").replace(/\n/g, " / "));
      const stA = await tutorialState(s);
      await rep.check("a.guidedComplete", !!stA && stA.battle === 1 && resA.outcome === "ended",
        `after Haru battle: state=${JSON.stringify(stA)} outcome=${resA.outcome}`);
    }
    await s.healParty();

    // Route 1 capture lesson (retry loop: a KO re-arms by design).
    let lessonDone = false, lessonSeen = null, foeSeen = null;
    for (let attempt = 1; attempt <= 3 && !lessonDone; attempt++) {
      await s.directLoadMap(3, 10, 28);
      const enc = await route1Encounter(s);
      if (!enc) { rep.note(`lesson attempt ${attempt}: no encounter`); continue; }
      const cs = await coachState(s);
      const foe = await s.evSafe("(function(){ const f = $gameTroop.members()[0]; return f ? { sp: f.ganjukoSpeciesId ? f.ganjukoSpeciesId() : null, name: f.name(), lv: f.level } : null; })()");
      foeSeen = foe;
      if (!cs || cs.kind !== "lesson") { rep.note(`lesson attempt ${attempt}: encounter was not the lesson (${JSON.stringify(cs)} foe=${JSON.stringify(foe)})`); await driveCoached(s, { strategy: "best" }, [], 180000); await s.healParty(); continue; }
      const seenL = [];
      const resL = await driveCoached(s, { capture: { itemId: ORB, weakenTo: 0.5, maxThrows: 10 } }, seenL, 420000);
      lessonSeen = seenL.map(b => b.id);
      const stL = await tutorialState(s);
      const partyL = await s.partyState();
      lessonDone = !!stL && stL.capture === 2 && !!partyL && partyL.length >= 2;
      await rep.check("a.lessonCatch." + attempt, lessonDone,
        `foe=${JSON.stringify(foe)} beats=${lessonSeen.join(",")} throws=${resL.throws} state=${JSON.stringify(stL)} party=${JSON.stringify(partyL)}`);
      await s.healParty();
    }
    await rep.check("a.lessonBeats", !!lessonSeen && lessonSeen.includes("a") && lessonSeen.includes("b"),
      `lesson beats (open + BAG-at-weakened): ${lessonSeen ? lessonSeen.join(",") : "none"}`);

    // Free play: the next battle carries no coaching at all. First dismiss
    // the post-lesson map message the way a player would (a pending message
    // stalls the map scene the rig forces the battle from — observed in the
    // 2026-11-02 re-run: startWildBattleVerified starved behind it).
    let msgBusy = await s.evSafe("!!($gameMessage && $gameMessage.isBusy())");
    for (let i = 0; i < 24 && msgBusy; i++) {
      await s.holdOk(280);
      await sleep(420);
      msgBusy = await s.evSafe("!!($gameMessage && $gameMessage.isBusy())");
    }
    rep.note(`free play: post-lesson message dismissed (still busy=${msgBusy})`);
    const free = await s.startWildBattleVerified(1, 3);
    if (free) {
      const csF = await coachState(s);
      await rep.check("a.freePlayNoCoach", !!csF && csF.kind === null && csF.hasWindow === false,
        `post-tutorial battle: ${JSON.stringify(csF)}`);
      await driveCoached(s, { strategy: "best" }, [], 180000);
    } else {
      await rep.check("a.freePlayNoCoach", false, "could not start the free-play battle");
    }

    // ================= RUN B =================
    await s.boot(ctx.gameUrl);
    await battle.installHooks(s);
    await freshGameThroughIntro(s, rep, "b");
    await s.directLoadMap(2, 8, 11);
    await pickOrb(s, 4, 11, 5); // Embit this time
    const partyB = await s.partyState();
    await rep.check("b.orbPickEmbit", !!partyB && partyB[0] && partyB[0].sp === 1, `Embit orb: ${JSON.stringify(partyB)}`);
    // Skip Haru entirely: first battle is a Route 1 wild battle.
    await s.directLoadMap(3, 10, 28);
    const encB = await route1Encounter(s);
    const csB = await coachState(s);
    await rep.check("b.guidedInWildBattle", encB && !!csB && csB.kind === "battle",
      `first battle (wild) is the guided one: ${JSON.stringify(csB)}`);
    if (encB) {
      const seenB = [];
      await driveCoached(s, { strategy: "best" }, seenB, 300000);
      const stB = await tutorialState(s);
      await rep.check("b.guidedComplete", !!stB && stB.battle === 1 && seenB.some(b => b.id === "a"),
        `state=${JSON.stringify(stB)} beats=${seenB.map(b => b.id).join(",")}`);
    }
    await s.healParty();
    // The NEXT Route 1 encounter is the lesson (armed only now).
    let bLesson = false;
    for (let attempt = 1; attempt <= 3 && !bLesson; attempt++) {
      const enc = await route1Encounter(s);
      if (!enc) continue;
      const cs = await coachState(s);
      if (cs && cs.kind === "lesson") {
        const seenBL = [];
        await driveCoached(s, { capture: { itemId: ORB, weakenTo: 0.5, maxThrows: 10 } }, seenBL, 420000);
        const stBL = await tutorialState(s);
        bLesson = !!stBL && stBL.capture === 2;
        await rep.check("b.lessonCatch." + attempt, bLesson, `state=${JSON.stringify(stBL)} beats=${seenBL.map(b => b.id).join(",")}`);
      } else {
        await driveCoached(s, { strategy: "best" }, [], 180000);
        await s.healParty();
      }
    }
    await rep.check("b.lessonAfterWildGuided", bLesson, "lesson staged after the wild guided battle and completed");

    // ================= RUN C =================
    await s.boot(ctx.gameUrl);
    await battle.installHooks(s);
    await s.newGame(); // rig path: no title command, so no tutorial state is born
    await s.seedParty([{ species: 28, level: 30 }, { species: 30, level: 30 }]);
    await s.seedBadge("Canopy Badge");
    await s.evSafe("(function(){ delete $gameSystem._ganjukoTutorial; return 1; })()");
    const preC = await tutorialState(s);
    const cBattle = await s.startWildBattleVerified(1, 3);
    const csC = await coachState(s);
    const postC = await tutorialState(s);
    await rep.check("c.noRetroTutorial", cBattle && preC === null && !!csC && csC.kind === null && csC.hasWindow === false &&
      !!postC && postC.battle === 1 && postC.capture === 2,
      `progressed flag-less state: pre=${JSON.stringify(preC)} battle=${JSON.stringify(csC)} resolved=${JSON.stringify(postC)}`);
    if (cBattle) await driveCoached(s, { strategy: "best" }, [], 180000);

    // Starter-chosen but otherwise fresh legacy state still arms.
    await s.newGame();
    await s.seedParty([{ species: 1, level: 5 }]);
    await s.seedSwitch(1, true);
    await s.evSafe("(function(){ delete $gameSystem._ganjukoTutorial; return 1; })()");
    const c2Battle = await s.startWildBattleVerified(1, 3);
    const csC2 = await coachState(s);
    await rep.check("c.freshLegacyArms", c2Battle && !!csC2 && csC2.kind === "battle",
      `starter-chosen fresh legacy state arms the guided battle: ${JSON.stringify(csC2)}`);
    if (c2Battle) await driveCoached(s, { strategy: "best" }, [], 180000);

    return rep.write();
  } catch (e) {
    rep.note("SUITE ERROR: " + (e && e.message));
    try { await rep.check("pass3.suiteCompleted", false, String(e && e.message)); } catch (_) {}
    return rep.write();
  } finally {
    if (ctx && ctx.close) { try { await ctx.close(); } catch (e) {} }
  }
}

module.exports = { run };
