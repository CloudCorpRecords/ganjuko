// Ganjuko OTA live-update glue (ships inside every bundle, v1+).
//
// Behavior contract (Rene's ask, 2026-11-01):
//  - Update checks happen ONLY on Wi-Fi / unmetered connections.
//  - Downloads run in the background; a running session is NEVER interrupted.
//  - A staged update applies at the NEXT app start.
//  - Every bundle confirms its own health via notifyAppReady(); a bundle
//    that fails to boot is auto-rolled-back by @capgo/capacitor-updater.
//  - The update source is a static manifest we control:
//      https://raw.githubusercontent.com/CloudCorpRecords/ganjuko-updates/main/manifest.json
//    Bundles themselves are zip assets on that repo's GitHub Releases.
//    No third-party update cloud is involved.
//  - Diagnostics live on window.__OTA_LOG / window.__OTA_ERROR so any
//    session (or test rig) can read exactly what the updater did.
(function () {
  var MANIFEST_URL = 'https://raw.githubusercontent.com/CloudCorpRecords/ganjuko-updates/main/manifest.json';
  var checking = false;
  var retried = false;
  var lastCheckAt = 0;
  var MIN_CHECK_INTERVAL_MS = 60000;

  window.__OTA_LOG = [];
  function log(step) {
    try {
      window.__OTA_LOG.push(new Date().toISOString() + ' ' + step);
      console.log('[OTA] ' + step);
    } catch (e) {}
  }
  function fail(step, e) {
    window.__OTA_ERROR = step + ': ' + (e && e.message ? e.message : String(e));
    log('ERROR ' + window.__OTA_ERROR);
  }

  function plugins() {
    return (window.Capacitor && window.Capacitor.Plugins) || {};
  }

  function notifyReady() {
    try {
      var u = plugins().CapacitorUpdater;
      if (u && u.notifyAppReady) {
        var p = u.notifyAppReady();
        if (p && p.catch) p.catch(function () {});
      }
    } catch (e) { /* only matters for downloaded bundles; never break boot */ }
  }
  // Confirm health as early as possible (this script loads in <head>),
  // then again after full load for good measure.
  notifyReady();
  window.addEventListener('load', function () { setTimeout(notifyReady, 400); });

  function runningVersion() {
    return fetch('ota-version.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return (j && j.version) || 'builtin'; })
      .catch(function () { return 'builtin'; });
  }

  function checkForUpdate() {
    if (checking) return;
    // Throttle: resume/network events can fire in bursts; one check a
    // minute is plenty and prevents download() calls racing each other.
    var now = Date.now();
    if (now - lastCheckAt < MIN_CHECK_INTERVAL_MS) return;
    lastCheckAt = now;
    var P = plugins();
    if (!P.Network || !P.CapacitorUpdater) return;
    checking = true;
    log('check start');
    P.Network.getStatus().then(function (net) {
      if (!net || !net.connected || net.connectionType !== 'wifi') {
        log('skip: network ' + (net ? net.connectionType + '/' + net.connected : 'unknown'));
        return null;
      }
      log('wifi ok; fetching manifest');
      return fetch(MANIFEST_URL, { cache: 'no-store' });
    }).then(function (res) {
      if (!res) return null;
      if (!res.ok) throw new Error('manifest http ' + res.status);
      return res.json();
    }).then(function (manifest) {
      if (!manifest || !manifest.latest) return null;
      return runningVersion().then(function (current) {
        window.__OTA_CURRENT = current;
        log('running=' + current + ' latest=' + manifest.latest);
        if (manifest.latest === current) { log('up to date'); return null; }
        var entry = null;
        (manifest.bundles || []).forEach(function (b) {
          if (b.version === manifest.latest) entry = b;
        });
        if (!entry || !entry.url) { log('no manifest entry for latest'); return null; }
        return P.CapacitorUpdater.list().then(function (res2) {
          var existing = null;
          (res2.bundles || []).forEach(function (b) {
            // 'pending' = fully downloaded, awaiting activation (Capgo v8).
            if (b.version === entry.version && (b.status === 'pending' || b.status === 'success')) existing = b;
          });
          if (existing) { log('already downloaded: ' + entry.version); return existing; }
          log('downloading ' + entry.version);
          return P.CapacitorUpdater.download({
            url: entry.url,
            version: entry.version,
            checksum: entry.sha256
          });
        }).then(function (bundle) {
          if (!bundle) return null;
          log('download ok id=' + bundle.id + '; staging for next start');
          return P.CapacitorUpdater.next({ id: bundle.id }).then(function () {
            window.__OTA_STAGED = entry.version;
            log('staged ' + entry.version + ' for next start');
          });
        });
      });
    }).catch(function (e) {
      fail('check', e);
      if (!retried) {
        retried = true;
        log('scheduling one retry in 65s');
        setTimeout(function () { checking = false; checkForUpdate(); }, 65000);
      }
    }).then(function () { checking = false; });
  }

  function arm() {
    var P = plugins();
    checkForUpdate();
    if (P.App && P.App.addListener) {
      P.App.addListener('resume', checkForUpdate);
    }
    if (P.Network && P.Network.addListener) {
      P.Network.addListener('networkStatusChange', function (s) {
        if (s && s.connected && s.connectionType === 'wifi') checkForUpdate();
      });
    }
  }
  // Give the native plugin a few seconds to finish initializing before the
  // first check (early download() calls can race plugin init).
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(arm, 4000);
  } else {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(arm, 4000); });
  }
})();
