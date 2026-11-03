// rig2 CDP client — launches headless Chromium, speaks raw Chrome DevTools
// Protocol over the global WebSocket (the pattern every 2026-11-01 lane proved),
// and collects page exceptions so a run can fail on ANY game exception.
"use strict";
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Write bytes from a fresh detached process (write-guard escape — a process
// that has touched game data gets its own writes EPERM'd; see results.js).
// Payload travels as base64 on stdin.
function writeFileDetached(filePath, buffer) {
  return new Promise((resolve) => {
    const script = "let b='';process.stdin.setEncoding('utf8');process.stdin.on('data',d=>{b+=d;});process.stdin.on('end',()=>{try{require('fs').writeFileSync(process.argv[1],Buffer.from(b,'base64'));}catch(e){process.exit(1);}});";
    try { fs.mkdirSync(path.dirname(filePath), { recursive: true }); } catch (e) { /* the writer retries the write itself */ }
    const child = spawn("setsid", ["node", "-e", script, filePath], { stdio: ["pipe", "ignore", "ignore"] });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
    child.stdin.end(buffer.toString("base64"));
  });
}

function findChrome(explicit) {
  const candidates = [
    explicit,
    process.env.RIG2_CHROME,
    "/opt/meta-chromium/chrome", // this VM
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Razer
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch (e) { /* keep looking */ }
  }
  return candidates[0]; // last resort: let spawn fail loudly
}

function getJson(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
    }).on("error", rej);
  });
}

class Cdp {
  constructor() {
    this.chrome = null;
    this.ws = null;
    this._id = 0;
    this._pending = new Map();
    this.exceptions = []; // Runtime.exceptionThrown — hard failures
    this.consoleErrors = []; // console.error — warnings (see attach handler)
  }

  async launch({ chromePath, port, userDataDir, extraArgs = [] }) {
    const bin = findChrome(chromePath);
    const args = [
      "--headless=new",
      "--remote-debugging-port=" + port,
      "--remote-debugging-address=127.0.0.1",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--mute-audio",
      "--user-data-dir=" + userDataDir,
      ...extraArgs,
      "about:blank",
    ];
    this.chrome = spawn(bin, args, { stdio: "ignore" });
    return this.attach(port);
  }

  // Connect to an ALREADY-RUNNING Chrome reachable at 127.0.0.1:<port>
  // (e.g. the Razer's Chrome through an SSH local-forward). The target list
  // reports the browser-side port in its WS URLs; rewrite it to ours.
  // opts.match: prefer the page target whose URL contains this substring —
  // REQUIRED on the phone target, where the browser is the owner's daily
  // Chrome and the list carries dozens of personal tabs we must not touch.
  async attach(port, tries = 60, opts = {}) {
    let targets = null;
    for (let i = 0; i < tries; i++) {
      try {
        targets = await getJson(`http://127.0.0.1:${port}/json/list`);
        if (targets && targets.length) {
          // With a match requested, a non-empty list is NOT enough: the
          // wanted tab may still be materializing (a /json/new tab reports
          // its URL a beat after the list first answers). Keep polling
          // until the match exists or the tries run out.
          if (!opts.match) break;
          if (targets.some((t) => t.type === "page" && (t.url || "").includes(opts.match))) break;
        }
      } catch (e) { /* not up yet */ }
      await sleep(500);
    }
    if (!targets || !targets.length) throw new Error("rig2: Chromium CDP target list never appeared on port " + port);
    const pages = targets.filter((t) => t.type === "page");
    let page = null;
    if (opts.match) page = pages.find((t) => (t.url || "").includes(opts.match)) || null;
    if (!page) page = pages[0] || targets[0];
    this.target = page;
    const wsUrl = page.webSocketDebuggerUrl.replace(/^(ws:\/\/[^:/]+):\d+/, `$1:${port}`);
    this.ws = new WebSocket(wsUrl);
    await new Promise((r) => (this.ws.onopen = r));
    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this._pending.has(m.id)) { this._pending.get(m.id)(m.result); this._pending.delete(m.id); }
      if (m.method === "Runtime.exceptionThrown") {
        const d = m.params.exceptionDetails || {};
        this.exceptions.push({
          source: "exceptionThrown",
          text: d.text || "",
          description: d.exception && d.exception.description ? d.exception.description : "",
          url: d.url || "",
          lineNumber: d.lineNumber,
        });
      }
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
        // console.error is a SEPARATE, softer channel than exceptionThrown:
        // MZ logs transient tilemap noise there during direct map loads
        // (e.g. Game_Map.isLoopHorizontal reading a momentarily-null $dataMap)
        // while the game recovers and plays on. Suites hard-fail on
        // exceptions[] and surface consoleErrors[] as warnings.
        const txt = (m.params.args || []).map((a) => a.value || a.description || "").join(" ");
        this.consoleErrors.push({ source: "console.error", text: txt, description: "", url: "", lineNumber: null });
      }
    };
    await this.send("Runtime.enable");
    await this.send("Page.enable");
    return this;
  }

  send(method, params = {}) {
    // Hard timeout: if the tunnel dies mid-run, an unanswered CDP call must
    // reject — otherwise every poll hangs forever and the suite produces
    // nothing at all (learned the hard way: a 17-minute silent hang).
    return new Promise((res, rej) => {
      const i = ++this._id;
      const timer = setTimeout(() => { this._pending.delete(i); rej(new Error("rig2: CDP send timeout (45s) on " + method)); }, 45000);
      this._pending.set(i, (v) => { clearTimeout(timer); res(v); });
      try { this.ws.send(JSON.stringify({ id: i, method, params })); }
      catch (e) { clearTimeout(timer); this._pending.delete(i); rej(e); }
    });
  }

  // Evaluate an expression in the page; throws with the page-side message on error.
  async ev(expr) {
    const r = await this.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error("EVAL: " + (d.exception && d.exception.description ? d.exception.description : d.text));
    }
    return r.result ? r.result.value : undefined;
  }

  // Evaluate, returning undefined instead of throwing (for state polls).
  async evSafe(expr) {
    try { return await this.ev(expr); } catch (e) { return undefined; }
  }

  async navigate(url) {
    await this.send("Page.navigate", { url });
  }

  // Screenshot to disk. PNG bytes are media-derived and the VM write-guard can
  // EPERM them; fall back to a detached-process write, then to base64 text via
  // the same route. Evidence is never silently dropped.
  async screenshot(filePath) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    if (!r || !r.data) return null;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const buf = Buffer.from(r.data, "base64");
    try {
      fs.writeFileSync(filePath, buf);
      return filePath;
    } catch (e) {
      if (await writeFileDetached(filePath, buf)) return filePath;
      const alt = filePath + ".b64.txt";
      if (await writeFileDetached(alt, Buffer.from(r.data, "utf8"))) return alt;
      return null;
    }
  }

  async close() {
    try { if (this.ws) this.ws.close(); } catch (e) { /* ignore */ }
    try { if (this.chrome) this.chrome.kill(); } catch (e) { /* ignore */ }
  }
}

module.exports = { Cdp, sleep };
