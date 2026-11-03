// rig2 prov suite — starter-area provenance sweep verification (v2).
// Two-layer in-game proof for every image visible in Wakaba Town /
// Prof. Kusu's Lab / Route 1:
//  (1) BYTE LAYER: fetch each asset URL from the running game server and
//      FNV-1a hash the raw bytes in-page; must equal the offline hash of
//      the installed file on disk. (Canvas readback is NOT used: canvas
//      premultiplies alpha and destroys semi-transparent pixel values.)
//  (2) SCENE LAYER: the actual on-screen sprites (title, intro, battle
//      foe, balloon) must hold the very bitmap object ImageManager cached
//      for that filename (object identity), tying what renders to the
//      byte-verified file. Screenshots provide the visual record.
"use strict";
const fs = require("fs");
const path = require("path");
const { openLive, preEngineMd5 } = require("../lib/live");
const { Reporter } = require("../lib/results");
const { sleep } = require("../lib/cdp");
const battle = require("../lib/battle");

// bytes = FNV-1a 32-bit over the installed file's raw PNG bytes (offline).
const FILES = {
  Window: { bytes: 901637525, path: "img/system/Window.png" },
  IconSet: { bytes: 1718482843, path: "img/system/IconSet.png" },
  Balloon: { bytes: 3860469493, path: "img/system/Balloon.png" },
  ButtonSet: { bytes: 2957040156, path: "img/system/ButtonSet.png" },
  GameOver: { bytes: 86768154, path: "img/system/GameOver.png" },
  People4_6: { bytes: 4038999878, path: "img/pictures/People4_6.png" },
  Goddess_of_death: { bytes: 1101578461, path: "img/enemies/Goddess_of_death.png" },
  SF_Phoenix: { bytes: 1473627064, path: "img/enemies/SF_Phoenix.png" },
  Salamander: { bytes: 2621884099, path: "img/enemies/Salamander.png" },
  Ganjuko_Bunspark: { bytes: 868669135, path: "img/enemies/Ganjuko_Bunspark.png" },
  Universe: { bytes: 1830054715, path: "img/titles1/Universe.png" },
  "!Crystal": { bytes: 1433269030, path: "img/characters/!Crystal.png" },
  "!Chest": { bytes: 4156873417, path: "img/characters/!Chest.png" },
  "!Other1": { bytes: 169908474, path: "img/characters/!Other1.png" },
  People1: { bytes: 3922521895, path: "img/characters/People1.png" },
  Actor2: { bytes: 982507800, path: "img/characters/Actor2.png" },
};

async function run({ target, outDir, port, cdpPort }) {
  const rep = new Reporter({ suite: "prov", target, engineMd5: preEngineMd5(target), outDir });
  const shotsDir = path.join(outDir, "shots");
  try { fs.mkdirSync(shotsDir, { recursive: true }); } catch (e) {}
  let ctx = null;
  const shot = async (name) => {
    try { return await ctx.session.cdp.screenshot(path.join(shotsDir, name)); }
    catch (e) { return null; }
  };
  try {
    ctx = await openLive({ target, port, cdpPort });
    rep.engineMd5 = ctx.engineMd5 || rep.engineMd5;
    rep.attachSession(ctx.session);
    const boot = await ctx.session.boot(ctx.gameUrl);
    try {
      await ctx.session.cdp.send("Emulation.setDeviceMetricsOverride", { width: 1300, height: 800, deviceScaleFactor: 1, mobile: false });
      await sleep(1000);
    } catch (e) {}
    await rep.check("prov.boot", true, `focus=${boot.focused} fps=${boot.fps}`);

    // ---- byte layer: fetch + hash every starter-visible file in-page ----
    const groups = [
      ["system", ["Window", "IconSet", "Balloon", "ButtonSet", "GameOver"]],
      ["enemies+pictures+titles", ["People4_6", "Goddess_of_death", "SF_Phoenix", "Salamander", "Ganjuko_Bunspark", "Universe"]],
      ["characters", ["!Crystal", "!Chest", "!Other1", "People1", "Actor2"]],
    ];
    for (const [gname, names] of groups) {
      const spec = {};
      names.forEach(n => { spec[n] = FILES[n]; });
      const results = await ctx.session.ev(`(async function(){
        const spec = ${JSON.stringify(spec)};
        const out = {};
        for (const n of Object.keys(spec)) {
          try {
            const r = await fetch(spec[n].path);
            const buf = new Uint8Array(await r.arrayBuffer());
            let hh = 0x811c9dc5;
            for (let i = 0; i < buf.length; i++) { hh ^= buf[i]; hh = Math.imul(hh, 0x01000193); }
            out[n] = { status: r.status, fnv: hh >>> 0, len: buf.length };
          } catch (e) { out[n] = { error: String(e) }; }
        }
        return out;
      })()`);
      const bad = names.filter(n => !results[n] || results[n].fnv !== FILES[n].bytes);
      await rep.check("prov.bytes." + gname.replace(/\W+/g, "_"), bad.length === 0,
        names.map(n => `${n}=${results[n] && results[n].fnv === FILES[n].bytes ? "BYTE-MATCH" : "MISMATCH(" + JSON.stringify(results[n]) + " vs " + FILES[n].bytes + ")"}`).join(" "));
    }

    // ---- scene layer: title sprites are the cached bitmaps ----
    const titleId = await ctx.session.ev(`(function(){
      const s = SceneManager._scene;
      if (!s || s.constructor.name !== "Scene_Title") return { scene: s && s.constructor.name };
      return {
        bgIsUniverse: !!s._backSprite1 && s._backSprite1.bitmap === ImageManager.loadTitle1("Universe"),
        legendaryIsPhoenix: !!s._legendarySprite && s._legendarySprite.bitmap === ImageManager.loadEnemy("SF_Phoenix"),
        starterIsSalamander: !!s._starterSprite && s._starterSprite.bitmap === ImageManager.loadEnemy("Salamander"),
      };
    })()`);
    await rep.check("prov.titleSprites", !!titleId && titleId.bgIsUniverse && titleId.legendaryIsPhoenix && titleId.starterIsSalamander,
      `title sprite bitmap identity: ${JSON.stringify(titleId)}`);
    await shot("prov-title.png");

    // ---- drive the real intro ----
    let cmdReady = false;
    for (let i = 0; i < 30; i++) {
      cmdReady = await ctx.session.evSafe(`(function(){ const s = SceneManager._scene; return !!(s && s._commandWindow && s._commandWindow.active); })()`);
      if (cmdReady) break;
      await sleep(500);
    }
    await ctx.session.evSafe(`(function(){ const s = SceneManager._scene; if (s && s._commandWindow) s._commandWindow.select(0); return 1; })()`);
    await ctx.session.holdOk(500);
    const inIntro = await ctx.session.waitScene("Scene_GanjukoIntro", 40);
    await rep.check("prov.introReached", !!inIntro, `title command window active=${cmdReady}; New Game -> Scene_GanjukoIntro: ${inIntro}`);
    if (inIntro) {
      await sleep(3500);
      const prof = await ctx.session.ev(`(function(){
        const s = SceneManager._scene;
        const out = {};
        if (s._profSprite) out.profIsPeople4_6 = s._profSprite.bitmap === ImageManager.loadPicture("People4_6");
        if (s._grimmorthSprite) out.grimmorthIsGoddess = s._grimmorthSprite.bitmap === ImageManager.loadEnemy("Goddess_of_death");
        if (s._solarisSprite) out.solarisIsPhoenix = s._solarisSprite.bitmap === ImageManager.loadEnemy("SF_Phoenix");
        if (s._profSprite && s._profSprite.bitmap) out.profDims = [s._profSprite.bitmap.width, s._profSprite.bitmap.height];
        return out;
      })()`);
      await rep.check("prov.introSprites", !!prof && prof.profIsPeople4_6 && prof.grimmorthIsGoddess,
        `intro sprite bitmap identity: ${JSON.stringify(prof)}`);
      await shot("prov-intro.png");
      let landed = "";
      for (let i = 0; i < 110; i++) {
        landed = await ctx.session.sceneName();
        if (landed === "Scene_Map") break;
        await ctx.session.holdOk(400);
        await sleep(350);
      }
      landed = await ctx.session.sceneName();
      await rep.check("prov.introDriven", landed === "Scene_Map",
        `intro OK-drive ended on scene=${landed}`);
    }

    // ---- Route 1 battle: foe sprite identity ----
    if ((await ctx.session.sceneName()) !== "Scene_Map") {
      await ctx.session.newGame();
    }
    await ctx.session.directLoadMap(3, 10, 10);
    await ctx.session.seedParty([{ species: 28, level: 30 }]);
    await ctx.session.healParty();
    const reached = await ctx.session.startWildBattleVerified(10, 3);
    await rep.check("prov.route1BattleStarts", !!reached, "Route 1 wild battle (Bunspark) reached Scene_Battle");
    if (reached) {
      await sleep(1500);
      const foe = await ctx.session.ev(`(function(){
        const s = SceneManager._scene;
        const set = s && s._spriteset;
        if (!set || !set._enemySprites || !set._enemySprites[0]) return null;
        const b = set._enemySprites[0].bitmap;
        return { isBunsparkBitmap: b === ImageManager.loadEnemy("Ganjuko_Bunspark"), w: b.width, h: b.height };
      })()`);
      await rep.check("prov.route1FoeBitmap", !!foe && foe.isBunsparkBitmap,
        `live foe sprite holds the byte-verified Ganjuko_Bunspark bitmap: ${JSON.stringify(foe)}`);
      await shot("prov-battle.png");
      const fight = await battle.driveBattle(ctx.session, { strategy: "best", timeoutMs: 120000 });
      await rep.check("prov.route1BattleCompletes", !!fight && fight.outcome === "win",
        `battle outcome=${fight && fight.outcome}`);
    }

    // ---- balloon display path (tree-walk for the served Balloon bitmap) ----
    await ctx.session.directLoadMap(1, 8, 10);
    await ctx.session.ev(`$gameTemp.requestBalloon($gamePlayer, 1)`);
    let balloonSeen = null;
    for (let i = 0; i < 14; i++) {
      await sleep(500);
      balloonSeen = await ctx.session.evSafe(`(function(){
        const target = ImageManager.loadSystem("Balloon");
        const s = SceneManager._scene;
        let found = null;
        (function walk(o, depth) {
          if (!o || depth > 8 || found) return;
          if (o.bitmap === target && o !== null && o.constructor && o.constructor.name === "Sprite_Balloon") {
            found = { visible: o.visible, frame: o._frameCount, balloonId: o._balloonId };
            return;
          }
          const ch = o.children || [];
          for (const c of ch) walk(c, depth + 1);
        })(s, 0);
        return found;
      })()`);
      if (balloonSeen) break;
    }
    await rep.check("prov.balloonSprite", !!balloonSeen,
      `live Sprite_Balloon holding the byte-verified Balloon bitmap: ${JSON.stringify(balloonSeen)}`);

    // ---- game-over scene ----
    await ctx.session.ev(`SceneManager.goto(Scene_Gameover)`);
    const inGO = await ctx.session.waitScene("Scene_Gameover", 30);
    await sleep(1200);
    await shot("prov-gameover.png");
    await rep.check("prov.gameoverScene", !!inGO, `Scene_Gameover reached: ${inGO} (bitmap byte-verified in prov.bytes.system)`);

    const exc = ctx.session.cdp.exceptions || [];
    await rep.check("prov.noExceptions", exc.length === 0,
      exc.length ? `exceptions: ${JSON.stringify(exc.slice(0, 3))}` : "zero page exceptions across the whole run");
  } catch (e) {
    await rep.check("prov.fatal", false, String(e && e.message || e));
  } finally {
    if (ctx) { try { await ctx.close(); } catch (e) {} }
  }
  return rep.write();
}

module.exports = { run };
