// rig2 static file server — serves a game directory over HTTP for local testing.
// Zero deps. MZ loads data via XHR and audio via WebAudio (full-file), so no
// range support is needed; no-cache headers keep test runs honest.
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".efkefc": "application/octet-stream",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function serveDir(root, port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
        if (urlPath === "/") urlPath = "/index.html";
        const filePath = path.join(root, urlPath);
        if (!filePath.startsWith(root)) { res.writeHead(403); res.end(); return; }
        fs.stat(filePath, (err, st) => {
          if (err || !st.isFile()) { res.writeHead(404); res.end("not found"); return; }
          res.writeHead(200, {
            "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
            "Content-Length": st.size,
            "Cache-Control": "no-store",
          });
          fs.createReadStream(filePath).pipe(res);
        });
      } catch (e) { res.writeHead(500); res.end(String(e)); }
    });
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

module.exports = { serveDir };
