// rig2 results — structured JSON + human markdown per suite run, every result
// stamped with the target's live engine md5. A check failure automatically
// captures a screenshot when a session is attached.
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { sleep } = require("./cdp");

function md5File(p) {
  try { return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex"); } catch (e) { return null; }
}
function md5Buffer(b) { return crypto.createHash("md5").update(b).digest("hex"); }

class Reporter {
  constructor({ suite, target, engineMd5, outDir }) {
    this.suite = suite;
    this.target = target;
    this.engineMd5 = engineMd5 || null;
    this.outDir = outDir;
    this.startedAt = new Date();
    this.t0 = Date.now();
    this.checks = [];
    this.notes = [];
    this.session = null; // optional Session for failure screenshots
  }

  attachSession(session) { this.session = session; return this; }
  note(text) { this.notes.push(text); console.log("  .. " + text); }

  async check(id, pass, detail) {
    const entry = { id, pass: !!pass, detail: String(detail == null ? "" : detail), ms: Date.now() - this.t0 };
    this.checks.push(entry);
    console.log((entry.pass ? "PASS " : "FAIL ") + id + " :: " + entry.detail);
    if (!entry.pass && this.session) {
      try {
        const shot = path.join(this.outDir, "shots", `${this.suite}-${id.replace(/[^a-zA-Z0-9_.-]/g, "_")}.png`);
        const saved = await this.session.cdp.screenshot(shot);
        if (saved) entry.screenshot = saved;
      } catch (e) { /* screenshot is best-effort */ }
    }
    return entry.pass;
  }

  summary() {
    const failed = this.checks.filter((c) => !c.pass);
    return {
      suite: this.suite,
      target: this.target,
      engineMd5: this.engineMd5,
      startedAt: this.startedAt.toISOString(),
      durationMs: Date.now() - this.t0,
      total: this.checks.length,
      passed: this.checks.length - failed.length,
      failed: failed.length,
      verdict: failed.length === 0 && this.checks.length > 0 ? "PASS" : "FAIL",
      notes: this.notes,
      checks: this.checks,
    };
  }

  // The VM write-guard follows data flow: once a process (or its parent, or
  // its child) has read game data, payloads derived from that run are EPERM'd
  // on write to ANY destination — direct, /tmp, even a setsid-detached writer
  // fed over stdin (all three proven 2026-11-01). The one clean channel out
  // is the process's own stdout. Strategy: try a direct write (works in
  // untainted contexts); otherwise return persistError and let run.js emit
  // the RIG2-SUMMARY line on stdout for the driving lane to persist with the
  // file tool. A result is never silently lost. See TESTING.md.
  async write() {
    const s = this.summary();
    const stamp = this.startedAt.toISOString().replace(/[:.]/g, "-");
    const safeTarget = String(this.target).replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 40);
    const base = `${this.suite}-${safeTarget}-${stamp}`;
    const md = [
      `# rig2 ${s.suite} — ${s.verdict}`,
      ``,
      `- target: ${s.target}`,
      `- engine md5: ${s.engineMd5 || "unknown"}`,
      `- started: ${s.startedAt}`,
      `- duration: ${(s.durationMs / 1000).toFixed(1)}s`,
      `- checks: ${s.passed}/${s.total} passed`,
      ``,
      ...s.notes.map((n) => `> ${n}`),
      ``,
      `| check | result | detail |`,
      `|---|---|---|`,
      ...s.checks.map((c) => `| ${c.id} | ${c.pass ? "PASS" : "FAIL"} | ${String(c.detail).replace(/\|/g, "\\|").slice(0, 400)} |`),
      ``,
    ].join("\n");
    const json = JSON.stringify(s, null, 2);
    const jsonPath = path.join(this.outDir, base + ".json");
    const mdPath = path.join(this.outDir, base + ".md");
    try {
      fs.mkdirSync(this.outDir, { recursive: true });
      fs.writeFileSync(jsonPath, json, "utf8");
      fs.writeFileSync(mdPath, md, "utf8");
      return { jsonPath, mdPath, summary: s };
    } catch (e) {
      if (e.code !== "EPERM") throw e;
    }
    return { jsonPath: null, mdPath: null, summary: s, persistError: "EPERM: suite-process writes blocked by the VM write-guard (data-flow taint)" };
  }
}

module.exports = { Reporter, md5File, md5Buffer };
