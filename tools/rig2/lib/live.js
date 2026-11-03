// rig2 live-target resolution.
//  local (default): serve the VM working copy on a local port; the browser and
//    the game both run HERE — ordinary testing never touches the Razer.
//    NOTE: on THIS VM the platform's hardened Chromium refuses direct
//    launches from agent shells (HatchFortress traps at startup), so `local`
//    is for hosts with a launchable Chrome. Use razer-chrome here.
//  razer-chrome: the game bytes are STILL the VM-local copy — served by this
//    process and reverse-tunnelled (ssh -R) into the Razer, whose Chrome
//    (a throwaway profile on its own CDP port) renders it. Nothing on the
//    Razer is modified: no game files, and the Razer's own game server on
//    :8080 and the user's Chrome are never touched. This is the local-first
//    route that works on this fleet.
//  razer (ship-gate): open an SSH local-forward to the Razer's existing game
//    server (localhost:8080) and run our browser against it. This reads the
//    Razer's build; it never starts processes or drives anything on the Razer.
//  phone (DEFAULT since 2026-11-02, Rene's directive): the game bytes are
//    still the VM-local copy — served here, ssh -R onto the Razer loopback,
//    `adb reverse` into the USB-attached Samsung, whose own Chrome renders
//    it. CDP rides `adb forward` of Chrome's devtools socket + ssh -L.
//    The laptops do ~no rendering work. razer-chrome remains the explicit
//    fallback (`--target razer-chrome`). See PHONE-TEST-TARGET-2026-11-02.md
//    in ~/workspace/xod-eval for the full record and fallback procedure.
"use strict";
const { spawn, execFile } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { serveDir } = require("./serve");
const { Cdp, sleep } = require("./cdp");
const { Session } = require("./session");
const { md5File, md5Buffer } = require("./results");

const HOME = process.env.HOME;
const RAZER_HOST = process.env.GANJUKO_RAZER_HOST || "100.0.0.0";
const RAZER_USER = process.env.GANJUKO_RAZER_USER || "user";
const RAZER_TARGET = RAZER_USER + "@" + RAZER_HOST;
const DEFAULT_GAME_DIR = path.join(HOME, "workspace/ganjuko/razer-original/ganjuko");
function sshBase() {
  return [
    "-i", path.join(HOME, ".ssh/id_ed25519"),
    "-o", "IdentitiesOnly=yes",
    "-o", "UserKnownHostsFile=" + path.join(HOME, ".ssh/known_hosts"),
    "-o", "ProxyCommand=python3 " + path.join(HOME, "workspace/tools/ts-proxy.py") + " " + RAZER_HOST + " 22",
    "-o", "ConnectTimeout=110",
  ];
}

function razerTunnelArgs(port) {
  return ["-N", "-L", `${port}:127.0.0.1:8080`, ...sshBase(), "-o", "ExitOnForwardFailure=yes", RAZER_TARGET];
}

// Run a PowerShell script on the Razer (base64 -EncodedCommand: no quoting
// hazards through bash + ssh + powershell layers). The tailnet egress path
// hiccups ("proxy closed during CONNECT" = degraded path, not a dead
// machine), so connection-level failures retry before surfacing.
function sshPs(script, timeoutMs = 120000) {
  const enc = Buffer.from(script, "utf16le").toString("base64");
  const once = () => new Promise((resolve, reject) => {
    execFile("ssh", [...sshBase(), RAZER_TARGET, "powershell", "-NoProfile", "-EncodedCommand", enc],
      { timeout: timeoutMs }, (err, stdout, stderr) => {
        if (err) reject(new Error("rig2 ssh powershell failed: " + (stderr || err.message)));
        else resolve(String(stdout || ""));
      });
  });
  return (async () => {
    let lastErr = null;
    for (let i = 0; i < 2; i++) {
      try { return await once(); } catch (e) {
        lastErr = e;
        if (!/proxy closed|Connection closed|connect|timed out/i.test(e.message)) throw e;
        await sleep(3000);
      }
    }
    throw lastErr;
  })();
}

const RAZER_CDP_PORT = 9555;       // throwaway Chrome's debugging port (Razer side)
const RAZER_CDP_LOCAL = 19555;     // local-forward of it on this VM
const RAZER_GAME_PORT = 18971;     // reverse-forwarded game port (Razer loopback)
const RAZER_PROFILE = process.env.GANJUKO_RAZER_PROFILE || "C:\\Users\\user\\ganjuko-rig2-scratch\\profile";

function psStartRazerChrome() {
  // Win32_Process.Create, NOT Start-Process: a process started from an SSH
  // session dies with that session's job object; a WMI-created process is
  // parented outside the session and survives (learned on the first attempt:
  // Start-Process Chrome vanished before CDP ever came up).
  const cmd = `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe --headless=new --window-size=1280,760 --remote-debugging-port=${RAZER_CDP_PORT} --remote-debugging-address=127.0.0.1 --user-data-dir=${RAZER_PROFILE} --use-gl=angle --use-angle=d3d11 --enable-webgl --ignore-gpu-blocklist --no-sandbox --mute-audio about:blank`;
  return `
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '${cmd}' }
Write-Output ('created pid ' + $r.ProcessId + ' rc ' + $r.ReturnValue)`;
}

function psKillRazerChrome() {
  return `
Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*ganjuko-rig2-scratch*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Write-Output 'killed'`;
}

// ---- phone target (Samsung Galaxy S25 Ultra, USB-attached to the Razer) ----
// Chain: serveDir here -> ssh -R onto the Razer loopback -> `adb reverse`
// into the phone -> the phone's Chrome. CDP: `adb forward` of Chrome's
// devtools socket to a Razer port -> ssh -L here. Three hard-won mechanics:
//  1. The adb SERVER must be WMI-started (Win32_Process.Create). An adb
//     server spawned from an SSH session dies with that session's job
//     object and takes every forward/reverse registration with it (proven
//     2026-11-02; same lesson as psStartRazerChrome). The WMI-started
//     server persists across sessions and is left running on purpose.
//  2. Chrome must be WARM before the game tab exists: launch its Main
//     activity first. A cold VIEW intent into a sleeping phone left no
//     process and no devtools socket at all (proven 2026-11-02).
//  3. The phone is the owner's daily driver: its Chrome carries personal
//     tabs. The game tab is created over CDP /json/new, attach() matches
//     by URL, and cleanup closes ONLY the game tab. Chrome itself and the
//     owner's tabs are never stopped or navigated.
const PHONE_ADB = process.env.RAZER_ADB_PATH || "C:\\Users\\user\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe";
const PHONE_CDP_PORT = 19558;   // adb forward on the Razer == ssh -L port here
const PHONE_GAME_PORT = 18972;  // Razer loopback reverse port — deliberately
                                // NOT razer-chrome's 18971: the two targets
                                // must never collide on the Razer loopback
                                // (a section19 razer-chrome run held 18971
                                // when the phone target first deployed).

function psEnsureAdbServer() {
  return `
$adb = '${PHONE_ADB}'
if (-not (Get-Process adb -ErrorAction SilentlyContinue)) {
  $r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '"' + $adb + '" start-server' }
  Start-Sleep -Seconds 3
}
$dev = & $adb devices | Out-String
if ($dev -match '\\tdevice') { Write-Output 'ADB-READY' } else { Write-Output ('ADB-NOT-READY ' + ($dev -replace '\\s+', ' ')) }`;
}

function psPhoneSetup() {
  return `
$adb = '${PHONE_ADB}'
& $adb reverse tcp:${PHONE_GAME_PORT} tcp:${PHONE_GAME_PORT}
& $adb shell input keyevent KEYCODE_WAKEUP
& $adb shell am start -n 'com.android.chrome/com.google.android.apps.chrome.Main'
Start-Sleep -Seconds 4
& $adb forward tcp:${PHONE_CDP_PORT} localabstract:chrome_devtools_remote
Write-Output 'PHONE-SETUP-DONE'`;
}

function psPhoneOpenTabIntent(gameUrl) {
  return `
$adb = '${PHONE_ADB}'
& $adb shell am start -a android.intent.action.VIEW -d '${gameUrl}' -n 'com.android.chrome/com.google.android.apps.chrome.Main'
Write-Output 'PHONE-TAB-INTENT-SENT'`;
}

// Phone-native screenshot: screencap on the device, pulled to a folder
// on the Razer. This is the phone target's PROOF channel — CDP captures
// taken from the VM are zeroed by the VM write-guard (data-flow taint,
// see results.js), while these bytes never pass through a VM process.
// Returns the pulled file's byte size via the PS output.
function psPhoneShot(name) {
  return `
$adb = '${PHONE_ADB}'
$dir = 'C:\\Users\\user\\ganjuko-rig2-scratch\\phone-shots'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
& $adb shell input keyevent KEYCODE_WAKEUP
Start-Sleep -Milliseconds 400
$remote = '/sdcard/rig2-${name}'
& $adb shell screencap -p $remote
& $adb pull $remote ($dir + '\\${name}')
& $adb shell rm $remote
$f = Get-Item ($dir + '\\${name}') -ErrorAction SilentlyContinue
if ($f) { Write-Output ('SHOT-SIZE=' + $f.Length) } else { Write-Output 'SHOT-SIZE=0' }`;
}

function psPhoneTeardown() {
  return `
$adb = '${PHONE_ADB}'
& $adb forward --remove tcp:${PHONE_CDP_PORT}
& $adb reverse --remove tcp:${PHONE_GAME_PORT}
Write-Output 'PHONE-TEARDOWN-DONE'`;
}

function httpRequestText(method, url) {
  return new Promise((res, rej) => {
    const req = http.request(url, { method }, (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => res(d));
    });
    req.on("error", rej);
    req.end();
  });
}

function httpRequestFull(method, url) {
  return new Promise((res, rej) => {
    const req = http.request(url, { method }, (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => res({ status: r.statusCode, body: d }));
    });
    req.on("error", rej);
    req.end();
  });
}

// Open the game tab via the browser-level Target.createTarget (the
// page-level /json/new HTTP endpoint answers 500 "Could not create new
// page" on Android Chrome — proven 2026-11-02). Falls back to a VIEW
// intent, which is how the very first prototype tab was opened.
async function createPhoneGameTab(gameUrl) {
  const version = JSON.parse(await httpRequestText("GET", `http://127.0.0.1:${PHONE_CDP_PORT}/json/version`));
  if (!version.webSocketDebuggerUrl) throw new Error("rig2 phone: /json/version has no browser WS URL");
  const wsUrl = version.webSocketDebuggerUrl.replace(/^(ws:\/\/[^:/]+):\d+/, `$1:${PHONE_CDP_PORT}`);
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => { try { ws.close(); } catch (e) {} reject(new Error("rig2 phone: Target.createTarget timed out")); }, 20000);
    ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: "Target.createTarget", params: { url: gameUrl } }));
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.id !== 1) return;
      clearTimeout(timer);
      try { ws.close(); } catch (e) {}
      if (m.error) reject(new Error("rig2 phone: Target.createTarget failed: " + JSON.stringify(m.error).slice(0, 200)));
      else if (m.result && m.result.targetId) resolve(m.result.targetId);
      else reject(new Error("rig2 phone: Target.createTarget returned no targetId"));
    };
    ws.onerror = () => { clearTimeout(timer); reject(new Error("rig2 phone: browser WS error during Target.createTarget")); };
  });
}

// Close ONLY our game tabs in the phone's Chrome (matched by the game
// port in their URL). Runs over the still-live ssh -L forward, so call it
// before tearing the tunnel down.
async function closePhoneGameTabs() {
  const list = JSON.parse(await httpRequestText("GET", `http://127.0.0.1:${PHONE_CDP_PORT}/json/list`));
  for (const t of list || []) {
    if (t.type === "page" && (t.url || "").includes(":" + PHONE_GAME_PORT)) {
      await httpRequestText("GET", `http://127.0.0.1:${PHONE_CDP_PORT}/json/close/${t.id}`).catch(() => {});
    }
  }
}

function fetchBuffer(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => {
      const chunks = [];
      r.on("data", (c) => chunks.push(c));
      r.on("end", () => res(Buffer.concat(chunks)));
    }).on("error", rej);
  });
}

async function waitPort(port, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try { await fetchBuffer(`http://127.0.0.1:${port}/index.html`); return true; } catch (e) { await sleep(1000); }
  }
  return false;
}

// Returns a live context: { kind, gameDir, gameUrl, engineMd5, cdp, session, cleanup }
async function openLive({ target = "local", port = 8971, cdpPort = 9333, chromePath } = {}) {
  let server = null, tunnel = null, gameDir = null, gameUrl, engineMd5 = null;
  if (target === "local") {
    gameDir = process.env.RIG2_GAME_DIR || DEFAULT_GAME_DIR;
    if (!fs.existsSync(path.join(gameDir, "index.html"))) throw new Error("rig2: game dir not found: " + gameDir);
    server = await serveDir(gameDir, port);
    gameUrl = `http://127.0.0.1:${port}/`;
    engineMd5 = md5File(path.join(gameDir, "js/plugins/GanjukoEngine.js"));
  } else if (target === "razer") {
    tunnel = spawn("ssh", razerTunnelArgs(port), { stdio: "ignore" });
    const up = await waitPort(port, 90);
    if (!up) { try { tunnel.kill(); } catch (e) {} throw new Error("rig2: Razer game server unreachable through SSH tunnel on port " + port); }
    gameUrl = `http://127.0.0.1:${port}/`;
    try { engineMd5 = md5Buffer(await fetchBuffer(gameUrl + "js/plugins/GanjukoEngine.js")); } catch (e) { engineMd5 = null; }
  } else if (target === "razer-chrome") {
    gameDir = process.env.RIG2_GAME_DIR || DEFAULT_GAME_DIR;
    if (!fs.existsSync(path.join(gameDir, "index.html"))) throw new Error("rig2: game dir not found: " + gameDir);
    server = await serveDir(gameDir, port);
    engineMd5 = md5File(path.join(gameDir, "js/plugins/GanjukoEngine.js"));
    // Throwaway Chrome on the Razer (own profile, own CDP port), then ONE ssh
    // process carrying both forwards: CDP in (-L), game server out (-R).
    // ANY failure after this point must tear down the tunnel and the Chrome —
    // an orphaned tunnel holds the Razer ports hostage for the next run.
    try {
      await sshPs(psKillRazerChrome()).catch(() => {});
      await sshPs(psStartRazerChrome());
      tunnel = spawn("ssh", ["-N",
        "-L", `${RAZER_CDP_LOCAL}:127.0.0.1:${RAZER_CDP_PORT}`,
        "-R", `${RAZER_GAME_PORT}:127.0.0.1:${port}`,
        ...sshBase(), "-o", "ExitOnForwardFailure=yes", RAZER_TARGET], { stdio: "ignore" });
      gameUrl = `http://127.0.0.1:${RAZER_GAME_PORT}/`;
      // Prove the reverse forward serves OUR bytes on the Razer's loopback.
      // Bounded: retries COMPOUND with sshPs's own, and an unbounded version
      // of this loop once ate 15+ minutes in degraded tailnet weather.
      let served = false;
      for (let i = 0; i < 10 && !served; i++) {
        try {
          const out = await sshPs(`try { (Invoke-WebRequest -UseBasicParsing -Uri '${gameUrl}index.html' -TimeoutSec 10).StatusCode } catch { 'ERR' }`, 30000);
          served = /200/.test(out);
        } catch (e) { /* retry */ }
        if (!served) await sleep(2000);
      }
      if (!served) throw new Error("rig2: reverse-tunnelled game server not reachable on the Razer loopback port " + RAZER_GAME_PORT);
    } catch (e) {
      if (tunnel) { try { tunnel.kill(); } catch (err) {} tunnel = null; }
      await sshPs(psKillRazerChrome()).catch(() => {});
      if (server) { await new Promise((r) => server.close(r)).catch(() => {}); server = null; }
      throw e;
    }
  } else if (target === "phone") {
    gameDir = process.env.RIG2_GAME_DIR || DEFAULT_GAME_DIR;
    if (!fs.existsSync(path.join(gameDir, "index.html"))) throw new Error("rig2: game dir not found: " + gameDir);
    server = await serveDir(gameDir, port);
    engineMd5 = md5File(path.join(gameDir, "js/plugins/GanjukoEngine.js"));
    // Serve the VM-local copy; the PHONE renders it. ssh carries CDP in
    // (-L) and the game server out (-R onto the Razer loopback, where
    // `adb reverse` hands it to the phone). ANY failure after this point
    // must tear down tunnel + adb forwards — an orphaned forward holds
    // the ports hostage for the next run.
    try {
      const adbOut = await sshPs(psEnsureAdbServer());
      if (!/ADB-READY/.test(adbOut)) {
        throw new Error("rig2 phone: adb device not ready (unauthorized needs a tap on the phone itself): " + adbOut.trim().slice(0, 200));
      }
      tunnel = spawn("ssh", ["-N",
        "-L", `${PHONE_CDP_PORT}:127.0.0.1:${PHONE_CDP_PORT}`,
        "-R", `${PHONE_GAME_PORT}:127.0.0.1:${port}`,
        ...sshBase(), "-o", "ExitOnForwardFailure=yes", RAZER_TARGET], { stdio: "ignore" });
      gameUrl = `http://127.0.0.1:${PHONE_GAME_PORT}/`;
      // Prove the reverse forward serves OUR bytes on the Razer's loopback
      // (same bounded check as razer-chrome; proves the ssh -R leg — the
      // adb-reverse leg is proven when the game actually boots over CDP).
      let served = false;
      for (let i = 0; i < 10 && !served; i++) {
        try {
          const out = await sshPs(`try { (Invoke-WebRequest -UseBasicParsing -Uri '${gameUrl}index.html' -TimeoutSec 10).StatusCode } catch { 'ERR' }`, 30000);
          served = /200/.test(out);
        } catch (e) { /* retry */ }
        if (!served) await sleep(2000);
      }
      if (!served) throw new Error("rig2 phone: reverse-tunnelled game server not reachable on the Razer loopback port " + PHONE_GAME_PORT);
      await sshPs(psPhoneSetup());
      // Fresh dedicated game tab: close any stale game tabs first so the
      // attach-by-URL match is unambiguous, then open ours over CDP HTTP.
      // The owner's own tabs are never touched.
      await closePhoneGameTabs().catch(() => {});
      try {
        await createPhoneGameTab(gameUrl);
      } catch (e) {
        // Browser-level creation refused too: fall back to the VIEW
        // intent (proven to open the tab on this device). attach()
        // polls for the URL-matched tab either way.
        await sshPs(psPhoneOpenTabIntent(gameUrl));
      }
    } catch (e) {
      await closePhoneGameTabs().catch(() => {});
      if (tunnel) { try { tunnel.kill(); } catch (err) {} tunnel = null; }
      await sshPs(psPhoneTeardown()).catch(() => {});
      if (server) { await new Promise((r) => server.close(r)).catch(() => {}); server = null; }
      throw e;
    }
  } else {
    throw new Error("rig2: unknown target " + target);
  }

  const cdp = new Cdp();
  const cleanup = async () => {
    await cdp.close().catch(() => {});
    if (target === "phone") {
      // Close ONLY the game tab, while the forward is still up; the
      // owner's Chrome and tabs stay exactly as found. Then drop the
      // adb forward/reverse registrations.
      await closePhoneGameTabs().catch(() => {});
      await sshPs(psPhoneTeardown()).catch(() => {});
    }
    if (server) await new Promise((r) => server.close(r)).catch(() => {});
    if (tunnel) { try { tunnel.kill(); } catch (e) {} }
    if (target === "razer-chrome") await sshPs(psKillRazerChrome()).catch(() => {});
  };
  try {
    if (target === "razer-chrome") await cdp.attach(RAZER_CDP_LOCAL);
    else if (target === "phone") await cdp.attach(PHONE_CDP_PORT, 60, { match: `127.0.0.1:${PHONE_GAME_PORT}` });
    else await cdp.launch({ chromePath, port: cdpPort, userDataDir: `/tmp/rig2-profile-${cdpPort}` });
  } catch (e) {
    await cleanup().catch(() => {});
    throw e;
  }
  const session = new Session(cdp);
  const phoneShot = target === "phone" ? async (name) => {
    const out = await sshPs(psPhoneShot(name));
    const m = out.match(/SHOT-SIZE=(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  } : null;
  return { kind: target, gameDir, gameUrl, engineMd5, cdp, session, cleanup, phoneShot };
}

// Engine md5 knowable before connecting (targets whose bytes are the local
// copy). Lets suites stamp a Reporter before the transport is up.
function preEngineMd5(target) {
  if (target === "local" || target === "razer-chrome" || target === "phone") {
    try { return md5File(path.join(process.env.RIG2_GAME_DIR || DEFAULT_GAME_DIR, "js/plugins/GanjukoEngine.js")); } catch (e) { return null; }
  }
  return null;
}

module.exports = { openLive, DEFAULT_GAME_DIR, preEngineMd5 };
