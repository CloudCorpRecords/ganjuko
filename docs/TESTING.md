# Ganjuko Testing Playbook — rig2

**Every lane tests through rig2 now.** No more hand-rolled CDP scripts. rig2
lives at `~/workspace/ganjuko/tools/rig2/` (Node, zero dependencies — raw CDP
over the global WebSocket, the pattern the 2026-11-01 lanes proved).

```bash
cd ~/workspace/ganjuko/tools/rig2
node run.js smoke            # boot, save/load, wild battle, capture
node run.js regression-fr1   # Fix Round 1 unit suite (10 checks)
node run.js regression-fr2   # Fix Round 2 unit suite (11 checks)
node run.js static           # asset-reference audit + species validation
node run.js demo-battle      # gym end-to-end, item use (QA G5), turn order (QA G10)
node run.js shipgate         # units + static + smoke -> verdict.json / verdict.md
node run.js all              # everything except shipgate
```

## Targets — read this before running anything

| target | what it tests | when |
|---|---|---|
| `local` | The VM working copy, served on a local port, rendered by a Chrome launched on the same host | Hosts with a launchable Chrome |
| `razer-chrome` (**default**) | The **same VM-local copy** (same bytes, md5-stamped), served by rig2 and reverse-tunnelled (`ssh -R`) into the Razer, rendered by a throwaway Razer Chrome (own profile `ganjuko-rig2-scratch`, CDP 9555) | **This fleet.** The VM's hardened Chromium (`/opt/meta-chromium/chrome`) traps at startup when launched from an agent shell (HatchFortress), no matter the flags — policy switches, Playwright, and the platform hardening args all fail the same way. Do not re-litigate this; it cost an hour once. |
| `razer` | The Razer's live `:8080` build, read through an SSH local-forward | Ship-gate verification only, and only when no other lane is working the Razer build |

`razer-chrome` touches nothing of the Razer's own: not the game server on
:8080, not the user's Chrome (9223), not any game file. Its Chrome is started
via `Win32_Process.Create` — **never `Start-Process` from SSH** (that process
dies with the SSH session's job object before CDP ever comes up).

Every result is stamped with the target engine's md5. If two runs disagree,
check the stamps before arguing about the results — during rig2's own
validation the work engine changed under the suites mid-flight (Pass 2 was
editing it), and one FR1 check went red then green again on exactly that.

## Results, and the write-guard

Suites print one `PASS`/`FAIL` line per check and finish with a
`RIG2-SUMMARY` line (the full JSON summary on one line). Result files
(`results/<suite>-<target>-<timestamp>.json|.md`) are written when the
process is allowed to write.

**The VM write-guard follows data flow.** Once a process — or its parent, or
its child — has read game data, payloads derived from that run are EPERM'd on
write to *any* destination: the results dir, /tmp, even a `setsid`-detached
writer fed the payload over stdin (all three proven). Blocked writes leave
0-byte files behind; do not mistake them for results. The one clean channel
out is the process's own stdout. So:

- If `run.js` prints `!!! result files blocked`, the run still counts — the
  `RIG2-SUMMARY` line **is** the result. Persist it from a clean step (the
  file-write tool, or a fresh shell that hasn't read game data).
- `shipgate` additionally emits `results/verdict.json` + `verdict.md` with
  stable names whenever writes are permitted. An OTA publish step should
  require `verdict.json` with `"verdict": "PASS"` **and** matching
  `unitEngineMd5` / `targetEngineMd5`.

## The rules (each one cost a lane real time)

1. **Held keys, never taps.** At SwiftShader frame rates, an instant
   key-down/key-up pair can fall entirely between two frames and register as
   nothing (the Fix Round 1 "Stadium freeze" was this, not an engine bug).
   rig2's `holdKey`/`holdOk` press for ~300 ms. Never reintroduce instant
   key pairs.
2. **Direct-load maps; never `reserveTransfer` — and never let `$dataMap`
   be null.** Teleports do not process while the intro message queue owns
   the interpreter — Fix Round 2's entire first verification run was invalid
   for this reason: its teleports silently never happened and every
   "result" was measured in the wrong place. The naive fix
   (`DataManager.loadMapData` → wait → `$gameMap.setup`) carries a worse
   trap, found by rig2's first smoke runs: `loadMapData` nulls `$dataMap`
   first and loads asynchronously, and **every frame rendered in that
   window throws `TypeError: Cannot read properties of null (reading
   'scrollType')` inside `Game_Map.isLoopHorizontal` — and a throw inside
   MZ's update loop halts the game permanently** (frozen frame clock,
   encounter effect stuck, queued scenes never processed; it looks exactly
   like a hung battle). On a fast local server the window is ~ms and lanes
   got away with it; over a tunnel it is seconds and the run is dead.
   `session.directLoadMap(id, x, y)` therefore fetches the map JSON in-page
   first (the old map keeps rendering), then assigns `$dataMap` +
   `$gameMap.setup` + `$gamePlayer.locate` in **one synchronous eval** —
   `$dataMap` is never null — and *verifies the map id*.
   **A run whose setup cannot be proven did not happen.** That is the whole
   lesson of the invalid run: results without proven setup are worse than
   no results.
3. **MZ damage formulas put the coefficient AFTER the `*`.** A skill picker
   that parses `100 * atk` wrong stalls battles forever (two lanes lost
   hours; one "unbeatable gym" was this). rig2's picker primarily *samples*
   `Game_Action.makeDamageValue` (3 samples, averaged — variance-proof) and
   keeps the formula parse only as a fallback, splitting on the **last** `*`.
4. **The evolution scene takes exactly ONE OK in phase 3.** Repeated presses
   reset its 48-frame fade-out and it never dismisses (~60 presses = still
   stuck; one press = gone in ~1.3 s). Battle `start` phases are the
   opposite: they *require* OK presses. The driver encodes both.
5. **Focus must be proven, not applied.** Headless Chrome boots unfocused
   and MZ idles. `session.ensureFocus` loops focus emulation +
   bringToFront + click until `document.hasFocus()` is actually true, and
   `boot()` refuses to run without it — plus an FPS probe above a floor
   (a negative FPS reading means the frame counter reset mid-boot: resample,
   don't report a stall).
6. **Settle before you seed or push.** A scene that exists but hasn't
   *started* races everything: `giveGanjuko` threw inside `addActor` on a
   null refresh target, and a `SceneManager.push(Scene_Battle)` issued
   during load churn was silently dropped (the battle simply never began).
   `session.settle()` waits for scene-started + advancing frames;
   `newGame`, `loadGame`, and `directLoadMap` all settle before returning,
   and `session.startWildBattleVerified` re-issues a dropped push exactly
   once. If a battle "won't start", check settle before blaming the engine.
7. **Fail fast on a battle that never started.** A driver that burns its
   whole timeout on a dropped scene push wastes ~5 minutes per check and
   reports mush. rig2 returns `outcome: "no-battle"` after 60 s.
8. **Uncaught exceptions fail the run; `console.error` warns.** With the
   rule-2 fetch-swap loader, a correct run produces **zero** console errors
   as well — treat a `$dataMap` null read (`isLoopHorizontal` /
   `scrollType`) as a halted game, never as transient noise: the update
   loop does not recover from it (see rule 2). `Runtime.exceptionThrown`
   remains the hard channel; both are collected, and `rig.noExceptions`
   fails on exceptions and reports console errors as warnings in its
   detail.
9. **Seed through the sanctioned resolvers.** Party members go in by
   *positional* species id via `GanjukoEngine.giveGanjuko` (the FR1
   record-id bug family), items by `$dataItems` id, badges via
   `$gameSystem.awardBadge`. Never hand-construct actors.
10. **Items in battle go through the real windows.** QA row G5 was
    inconclusive because the old driver couldn't operate the BAG window.
    rig2 navigates by *closed loop*: press → read back the window index →
    repeat, with grid-wrap retries, and verifies the chosen command symbol /
    item id before confirming. Same for skills (G10's turn order is recorded
    by a `BattleManager.startAction` hook, and the sparring mode picks the
    weakest damaging move to force multi-turn battles).
11. **The tailnet hiccups; retry connections, not conclusions.**
    "Proxy closed during CONNECT" means the egress path is degraded, not
    that the Razer is down. rig2 retries SSH/PowerShell calls on
    connection-level errors. A run that dies in transport reports
    `smoke.fatal`-style FAIL with the reason — because suites build their
    Reporter *before* connecting, transport failures still produce a
    stamped summary. Never let a suite die silently.
12. **Tear down what you start.** An orphaned SSH tunnel holds the Razer's
    9555/18971 ports hostage for the next run. rig2 cleans up on every exit
    path, including failed connects.
13. **`sustain` is a flow-prover, not a balance tool.** The gym driver can
    heal the party between polls (the FR2 B5c technique) to prove
    event→battle→badge flow through the real UI. Never cite a sustained run
    as balance evidence.
14. **The skill window's `_data` is empty until the window opens.** Never
    gate a skill pick on window indices at scoring time — the pick would be
    scored against an empty list and the driver falls back to whatever sits
    at index 0. Score from battle state, then resolve skillId → window
    index *after* the skill window opens, from a with-items read
    (`fightViaUI` does exactly this).
15. **Seeding has a narrow null-globals window.** Even after settle,
    `giveGanjuko` → `Game_Party.addActor` can dereference a still-null
    `$gamePlayer`/`$gameTemp` in the first moments after boot.
    `session.seedParty` checks the globals precondition and retries up to
    3 times; setup evals use the throwing `ev`, never `evSafe` — a
    swallowed setup failure poisons every later step.
16. **Hold OK for 400 ms at tunnel frame rates.** 300 ms is the floor on a
    fast local renderer; at ~6 FPS through the double tunnel a 200 ms hold
    is marginal and battle `start`-phase messages survive it. Battle holds
    in rig2 are 400 ms.
17. **Capture needs a beatable, weakened foe at a sane level gap.** A Lv30
    lead's weakest move one-shots a Lv3 wild — there is no "throw the Orb"
    turn. The smoke capture leg uses a fresh Lv5 lead vs a Lv3 Embit and
    `battleStep`'s capture mode first fights in `spar` mode until the foe
    is at ≤40% HP (`capture.weakenTo`), then throws through the BAG window.
18. **Bound every retry, and time out every CDP call.** Nested retries
    compound: an unbounded served-check loop × SSH retries once ate 15+
    minutes producing nothing. And a dead tunnel leaves unanswered CDP
    promises pending forever — `Cdp.send` hard-times-out at 45 s so polls
    return and the suite's own elapsed-time checks can fire. Fail fast with
    a stamped summary beats hanging silently, always.
19. **`newGame` races a just-returned map scene.** After a battle,
    `SceneManager.goto(Scene_Map)` can hit a fresh map scene whose
    `_mapNameWindow` doesn't exist yet — `Scene_Map.stop()` throws on it.
    `session.newGame` waits for scene formation (≤10 s) and retries the
    goto once after a settle.

## Adding a check

1. Pick the suite (or add `suites/<name>.js` and register it in `run.js`).
2. Inside `run()`, use the shared `Reporter`: `await rep.check("area.name",
   passBool, "evidence string")`. Keep details factual and short — they land
   in the summary JSON verbatim.
3. For live checks, get state only through `Session`/`battle.js` helpers —
   if you need a new primitive (a window, a state read), add it to the
   library, not to the suite. The library is the asset; suites are callers.
4. Screenshots on failure are automatic for checks made after
   `rep.attachSession(session)` — the failing check's detail gains a
   `screenshot:` path (subject to the write-guard; may land as `.b64.txt`).
5. Unit-level engine checks belong in `work/engine/tests/` as
   `fix-round-*.test.js`-style files printing `PASS <name>` / `FAIL <name>`
   lines; wrap them with `lib/units.js` the way `regression-fr1/fr2` do.

## The ship-gate workflow

```
node run.js shipgate --target razer-chrome   # local content, full gate
node run.js shipgate --target razer          # only when the Razer is free
```

The gate passes only if: FR1 + FR2 unit suites pass, the static audit is
clean, the live smoke suite passes, **and the target's engine md5 equals the
unit-tested engine's md5** — a gate cannot certify a build it did not test.
Expect the gate to FAIL against stale copies (that is it working): during
validation it refused the VM copy on three independent grounds (stale
engine md5, one missing battleback, two duplicate species names in the
game's own data) while every runnable component passed — 24/27 checks,
verdict FAIL, exactly as a gate should behave.

## What the rig cannot do (honest limits)

- **iPhone/Android taps.** devicectl is capture-only; there is no input
  injection path for the phone builds. Phone verification stays: install →
  launch → screenshot read-back, plus human play.
- **The VM's own Chrome.** See the targets table — platform-hardened, not
  launchable from agent shells. `local` mode exists for other hosts.
- **Data-only coverage stays data-only.** Driving every gym 5–8 event end
  to end costs ~10 minutes each at tunnel speeds; the static audit +
  identical-insertion argument covers them between full runs.
- **Balance truth.** The driver can force multi-turn battles and record
  turn order, but "feels right" (damage pacing, grind) is still a human
  call informed by the sims, not a rig verdict.
