// rig2 p2b suite — Engine Pass 2 sub-pass B verification: Champions battle
// layout geometry (measured in-engine from the real art boxes), HP-percent
// rule state, battle FX presence, camera zoom + touch math, and the
// Stadium 90%-HP restore fix. Screenshots land in results/shots/ for human
// review. Runs against the VM-local copy via razer-chrome by default.
"use strict";
const fs = require("fs");
const path = require("path");
const { openLive, preEngineMd5 } = require("../lib/live");
const { Reporter } = require("../lib/results");
const battle = require("../lib/battle");
const { sleep } = require("../lib/cdp");

const TALLEST = 504; // GenesisOmega — 448px battler art, the roster's tallest

async function run({ target, outDir, port, cdpPort }) {
  const rep = new Reporter({ suite: "p2b", target, engineMd5: preEngineMd5(target), outDir });
  let ctx = null;
  const shotsDir = path.join(outDir, "shots");
  try { fs.mkdirSync(shotsDir, { recursive: true }); } catch (e) {}
  const shot = async (name) => {
    try { return await ctx.session.cdp.screenshot(path.join(shotsDir, name)); }
    catch (e) { return null; }
  };
  try {
    ctx = await openLive({ target, port, cdpPort });
    rep.engineMd5 = ctx.engineMd5 || rep.engineMd5;
    rep.attachSession(ctx.session);
    const boot = await ctx.session.boot(ctx.gameUrl);
    // Full-frame screenshots: the rig Chrome's window content area is
    // shorter than the 712px game box, which cropped ~54 box-px from
    // the top and bottom of captures. A device-metrics override makes
    // the viewport taller than the box so captures show the whole
    // frame (display-only; game coordinates are unaffected).
    try {
      await ctx.session.cdp.send("Emulation.setDeviceMetricsOverride", { width: 1300, height: 800, deviceScaleFactor: 1, mobile: false });
      await sleep(1200);
    } catch (e) { /* screenshots stay cropped; geometry checks are in-engine */ }
    await ctx.session.newGame();
    await battle.installHooks(ctx.session);
    await rep.check("p2b.boot", true, `focus=${boot.focused} fps=${boot.fps}`);

    // ---------------- ZOOM (overworld, Route 1) ----------------
    await ctx.session.directLoadMap(3, 10, 10);
    await sleep(1500);
    const zoomState = await ctx.session.ev(`(function(){
      const ss = SceneManager._scene._spriteset;
      const base = ss && ss._baseSprite;
      const Z = GanjukoEngine.ZOOM;
      // canvas->map round trip through the REAL Game_Map functions: the
      // unzoomed stock-space point of a canvas point must land in the
      // same tile the engine reports.
      const pts = [[100,100],[640,360],[1200,700],[333,517]];
      const trips = pts.map(([cx,cy]) => {
        const ux = GanjukoEngine.zoomUnmap(cx, Z.pivot.x, Z.factor);
        const uy = GanjukoEngine.zoomUnmap(cy, Z.pivot.y, Z.factor);
        const expectX = Math.floor(($gameMap.displayX() * 48 + ux) / 48);
        const expectY = Math.floor(($gameMap.displayY() * 48 + uy) / 48);
        return { cx, cy, gotX: $gameMap.canvasToMapX(cx), gotY: $gameMap.canvasToMapY(cy), expectX, expectY };
      });
      return {
        enabled: window.GanjukoZoom.isEnabled(),
        factor: Z.factor,
        scale: base ? base.scale.x : null,
        pivot: { x: Z.pivot.x, y: Z.pivot.y },
        playerScreen: { x: $gamePlayer.screenX(), y: $gamePlayer.screenY() },
        trips
      };
    })()`);
    const tripsOk = zoomState.trips.every(t => t.gotX === t.expectX && t.gotY === t.expectY);
    await rep.check("p2b.zoom.active", zoomState.enabled === true && Math.abs(zoomState.scale - 1.5) < 0.001,
      `enabled=${zoomState.enabled} baseScale=${zoomState.scale} pivot=${JSON.stringify(zoomState.pivot)} playerScreen=${JSON.stringify(zoomState.playerScreen)}`);
    await rep.check("p2b.zoom.touchMath", tripsOk, `canvasToMap round-trips: ${JSON.stringify(zoomState.trips)}`);
    const zoomShot = await shot("p2b-map-zoom-on.png");
    rep.note(`zoom-on screenshot: ${zoomShot}`);

    const fpsOn = await ctx.session.fpsProbe(2000);
    await ctx.session.ev(`GanjukoZoom.setEnabled(false)`);
    await sleep(700);
    const scaleOff = await ctx.session.evSafe(`SceneManager._scene._spriteset._baseSprite.scale.x`);
    const fpsOff = await ctx.session.fpsProbe(2000);
    await ctx.session.ev(`GanjukoZoom.setEnabled(true)`);
    await sleep(700);
    await rep.check("p2b.zoom.toggle", scaleOff === 1,
      `scale with zoom disabled=${scaleOff}; fps zoom-on=${fpsOn} zoom-off=${fpsOff} (SwiftShader rig numbers; ratio is the signal)`);
    await rep.check("p2b.zoom.perf", fpsOn > 0 && fpsOff > 0 && fpsOn >= fpsOff * 0.6,
      `fps on=${fpsOn} off=${fpsOff} ratio=${fpsOff ? (fpsOn / fpsOff).toFixed(2) : "n/a"}`);

    // ---------------- BATTLE LAYOUT (tallest art both sides) ----------------
    await ctx.session.seedParty([{ species: TALLEST, level: 50 }]);
    await ctx.session.healParty();
    const reached = await ctx.session.startWildBattleVerified(TALLEST, 50);
    await rep.check("p2b.battleStarts", reached === true, `startWildBattle(${TALLEST},50) reached Scene_Battle`);

    // Wait for both battler bitmaps + art boxes + proto captures.
    let ready = null;
    for (let i = 0; i < 40 && !ready; i++) {
      ready = await ctx.session.evSafe(`(function(){
        const ss = SceneManager._scene && SceneManager._scene._spriteset;
        if (!ss || !ss._enemySprites || !ss._enemySprites[0] || !ss._playerGanjukoSprite) return null;
        const es = ss._enemySprites[0], ps = ss._playerGanjukoSprite;
        if (!es.bitmap || !es.bitmap.isReady() || !ps.bitmap || !ps.bitmap.isReady()) return null;
        const eb = GanjukoEngine.battlerArtBox(es.bitmap);
        const pb = GanjukoEngine.battlerArtBox(ps.bitmap);
        if (!eb || !pb) return null;
        const st = GanjukoEngine.BATTLE_UI.status;
        if (!st.hudProto || !st.playerProto) return null;
        return { eb: { w: eb.w, h: eb.h, bottom: eb.bottom, bmpH: es.bitmap.height },
                 pb: { w: pb.w, h: pb.h, bottom: pb.bottom, bmpH: ps.bitmap.height } };
      })()`);
      if (!ready) await sleep(1000);
    }
    await rep.check("p2b.artBoxesReady", !!ready, ready ? `foe art=${JSON.stringify(ready.eb)} ally art=${JSON.stringify(ready.pb)}` : "bitmaps/art boxes never became ready");

    if (ready) {
      await sleep(600); // let fit + positions settle over a few frames
      const geo = await ctx.session.ev(`(function(){
        const ss = SceneManager._scene._spriteset;
        const es = ss._enemySprites[0], ps = ss._playerGanjukoSprite;
        const L = GanjukoEngine.BATTLE_UI.layout();
        function artGeom(spr, capStage) {
          const box = GanjukoEngine.battlerArtBox(spr.bitmap);
          const sy = Math.abs(spr.scale.y);
          return {
            top: spr.y + (box.top - spr.bitmap.height) * sy,
            bottom: spr.y + (box.bottom + 1 - spr.bitmap.height) * sy,
            h: box.h * sy, w: box.w * Math.abs(spr.scale.x),
            x: spr.x, y: spr.y, scaleY: spr.scale.y
          };
        }
        return {
          L,
          boxH: Graphics.boxHeight,
          foe: artGeom(es, L.foeStage),
          ally: artGeom(ps, L.allyStage),
          status: GanjukoEngine.BATTLE_UI.status
        };
      })()`);
      const foePlateBottom = geo.L.foePlate.y + geo.L.foePlate.h;
      const foeMargin = geo.foe.top - foePlateBottom;
      await rep.check("p2b.layout.foeClearsPlate", foeMargin >= 16 && geo.foe.h <= geo.L.foeStage.capH + 1,
        `foe art top=${geo.foe.top.toFixed(1)} plate bottom=${foePlateBottom} margin=${foeMargin.toFixed(1)}px artH=${geo.foe.h.toFixed(1)} (cap ${geo.L.foeStage.capH}) scaleY=${geo.foe.scaleY.toFixed(3)}`);
      // Ally separation is HORIZONTAL in the band-aware layout: the
      // measured art box (centered on the stage point) must not
      // intersect the ally plate rect at all.
      const allyArt = { x: geo.L.allyStage.x - geo.ally.w / 2, y: geo.ally.top, w: geo.ally.w, h: geo.ally.h };
      const allyPlate = geo.L.allyPlate;
      const allyIntersects = allyArt.x < allyPlate.x + allyPlate.w && allyArt.x + allyArt.w > allyPlate.x &&
        allyArt.y < allyPlate.y + allyPlate.h && allyArt.y + allyArt.h > allyPlate.y;
      await rep.check("p2b.layout.allyClearsPlate", !allyIntersects && geo.ally.h <= geo.L.allyStage.capH + 1,
        `ally art box x=${allyArt.x.toFixed(1)}..${(allyArt.x + allyArt.w).toFixed(1)} y=${allyArt.y.toFixed(1)}..${(allyArt.y + allyArt.h).toFixed(1)} vs plate x=${allyPlate.x}..${allyPlate.x + allyPlate.w} y=${allyPlate.y}..${allyPlate.y + allyPlate.h} intersects=${allyIntersects} artH=${geo.ally.h.toFixed(1)} (cap ${geo.L.allyStage.capH})`);
      // Window band: plate bottom and both art bottoms above H-296.
      const bandTop = geo.boxH - 296;
      const bandOk = (allyPlate.y + allyPlate.h <= bandTop - 8) && (geo.ally.bottom <= bandTop - 8) && (geo.foe.bottom <= bandTop - 8);
      await rep.check("p2b.layout.aboveWindowBand", bandOk,
        `bandTop=${bandTop} allyPlateBottom=${allyPlate.y + allyPlate.h} allyArtBottom=${geo.ally.bottom.toFixed(1)} foeArtBottom=${geo.foe.bottom.toFixed(1)}`);
      const stAll = Object.values(geo.status).every(Boolean);
      await rep.check("p2b.hooksAllInstalled", stAll, `BATTLE_UI.status=${JSON.stringify(geo.status)}`);
      const tallShot = await shot("p2b-battle-tallest.png");
      rep.note(`tallest-battle screenshot: ${tallShot}`);

      // HP % probe: drop the foe to 37% and re-shoot (plate must read
      // "HP 37%" with a yellow bar, no raw numbers — human-verified from
      // the screenshot; the state hook here just proves the redraw ran).
      await ctx.session.ev(`(function(){ const e = $gameTroop.members()[0]; e.setHp(Math.round(e.mhp * 0.37)); SceneManager._scene.refreshGanjukoBattleHud(); })()`);
      await sleep(1200);
      const foePct = await ctx.session.evSafe(`GanjukoEngine.hpPercent($gameTroop.members()[0].hp, $gameTroop.members()[0].mhp)`);
      await rep.check("p2b.hpPercentState", foePct === 37, `foe hpPercent=${foePct} after setHp(37%)`);
      const hpShot = await shot("p2b-battle-hp37.png");
      rep.note(`hp37 screenshot: ${hpShot}`);

      // Deterministic popup leg: perform exactly what the battle log
      // does after a hit on the player (result + startDamagePopup) and
      // watch the P2B spriteset tick consume the flag into a Sprite_Damage.
      await ctx.session.ev(`(function(){ const a = $gameParty.battleMembers()[0]; const r = a.result(); r.used = true; r.hpAffected = true; r.hpDamage = 42; r.missed = false; r.evaded = false; a.startDamagePopup(); })()`);
      let popupSeen = false;
      for (let i = 0; i < 12 && !popupSeen; i++) {
        await sleep(400);
        const st = await ctx.session.evSafe(`(function(){ const ss = SceneManager._scene._spriteset; return { n: (ss._p2bDamages || []).length, flag: $gameParty.battleMembers()[0].isDamagePopupRequested() }; })()`);
        if (st && st.n > 0) popupSeen = true;
      }
      let popupDetail = `injected popup consumed into _p2bDamages: ${popupSeen}`;
      if (!popupSeen) {
        const manual = await ctx.session.evSafe(`(function(){ try { const a = $gameParty.battleMembers()[0]; const d = new Sprite_Damage(); d.setup(a); return { ok: true, duration: d._duration, children: d.children.length }; } catch (e) { return { ok: false, err: String(e && e.message || e) }; } })()`);
        popupDetail += `; manual Sprite_Damage viability: ${JSON.stringify(manual)}`;
      }
      await rep.check("p2b.fx.playerPopup", popupSeen, popupDetail);
      const popShot = await shot("p2b-battle-popup.png");
      rep.note(`popup screenshot: ${popShot}`);

      // Deterministic foe hit-reaction leg: land one REAL damaging
      // Game_Action on the foe, then poll at 100 ms — the reaction flag
      // lives only 12 frames, too short for the fight watcher's 500 ms
      // polling to catch reliably.
      await ctx.session.ev(`(function(){ const a = $gameParty.battleMembers()[0]; const sk = a.skills().find(s => s.damage && s.damage.type === 1) || $dataSkills[9]; const act = new Game_Action(a); act.setSkill(sk.id); act.apply($gameTroop.members()[0]); })()`);
      let hitSeen = false;
      for (let i = 0; i < 25 && !hitSeen; i++) {
        const v = await ctx.session.evSafe(`(function(){ const ss = SceneManager._scene._spriteset; const es = ss._enemySprites && ss._enemySprites[0]; return es ? (es._p2bHitT || 0) : 0; })()`);
        if (v > 0) hitSeen = true;
        else await sleep(100);
      }
      await rep.check("p2b.fx.foeHitReact", hitSeen, "foe _p2bHitT observed active within 2.5s of a real damaging apply (12-frame window, 100ms polling)");
    }

    // ---------------- FX observation while fighting ----------------
    let fxSeen = { impact: false, popup: false };
    const watcher = (async () => {
      for (let i = 0; i < 90; i++) {
        const seen = await ctx.session.evSafe(`(function(){
          const ss = SceneManager._scene && SceneManager._scene._spriteset;
          if (!ss || !ss._battleField) return null;
          let impact = false;
          for (const c of ss._battleField.children) if (c && c._p2bT !== undefined) { impact = true; break; }
          return {
            impact,
            popup: !!(ss._p2bDamages && ss._p2bDamages.length)
          };
        })()`);
        if (seen) {
          fxSeen.impact = fxSeen.impact || seen.impact;
          fxSeen.popup = fxSeen.popup || seen.popup;
        }
        if (fxSeen.impact && fxSeen.popup) break;
        await sleep(500);
      }
    })();
    const fight = await battle.driveBattle(ctx.session, { strategy: "best", timeoutMs: 300000 });
    await watcher;
    await rep.check("p2b.fx.impactBursts", fxSeen.impact, `impact burst sprite observed in battle field during fight (outcome=${fight.outcome})`);
    rep.note(`organic in-fight player popup observed: ${fxSeen.popup} (not asserted — whether the foe lands a hit in the driven fight is chance; the deterministic injection leg above is the popup proof)`);
    const midShot = await shot("p2b-battle-aftermath.png");
    rep.note(`aftermath screenshot: ${midShot}`);

    // ---------------- STADIUM RESTORE (90% HP fix) ----------------
    await ctx.session.newGame();
    await battle.installHooks(ctx.session);
    await ctx.session.seedParty([{ species: TALLEST, level: 50 }]);
    await ctx.session.healParty();
    const restore = await ctx.session.ev(`(function(){
      const actor = $gameParty.allMembers()[0];
      const snap = GanjukoEngine._snapshotParty();
      const fullHp = snap[0].hp;
      actor.setHp(7);
      $gameTemp._stadiumActive = true;
      const factoredMhp = actor.mhp; // param(0) read WITH the stadium factor live
      GanjukoEngine._stadiumRun = { snapshot: snap, _restored: false, active: true };
      GanjukoEngine._restoreStadiumParty();
      const hpAfter = actor.hp;
      $gameTemp._stadiumActive = false;
      const trueMhp = actor.mhp;
      GanjukoEngine._stadiumRun = null;
      return { fullHp, factoredMhp, trueMhp, hpAfter,
               bugValue: Math.min(fullHp, factoredMhp) };
    })()`);
    await rep.check("p2b.stadiumRestoreFull", restore.hpAfter === restore.fullHp && restore.factoredMhp < restore.trueMhp,
      `snapshot hp=${restore.fullHp}; mhp with factor=${restore.factoredMhp} vs true=${restore.trueMhp}; hp after restore=${restore.hpAfter} (pre-fix code would have left ${restore.bugValue})`);

    const fpsEnd = await ctx.session.fpsProbe(1500);
    await rep.check("rig.loopAlive", fpsEnd > 0, `fps=${fpsEnd}`);
    await rep.check("rig.noExceptions", ctx.cdp.exceptions.length === 0,
      ctx.cdp.exceptions.length ? "EXCEPTIONS: " + JSON.stringify(ctx.cdp.exceptions.slice(0, 3)) : "no uncaught page exceptions");
  } catch (e) {
    await rep.check("p2b.suiteCompleted", false, "suite error: " + (e && e.message || e));
  } finally {
    if (ctx) { try { await ctx.close(); } catch (e) {} }
  }
  return rep.write();
}

module.exports = { run };
