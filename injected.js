/**
 * MapGenie Unlimited Markers v2.7 - injected.js
 *
 * Fix dari v2.6:
 * 1. BUG FIX: tryRestoreRedux SELALU dispatch (tidak skip meski ID sudah
 *    ada di foundLocations — karena dispatch itu sendiri yang trigger render).
 * 2. BUG FIX: Migrasi + filter HANYA jalan setelah window.mapData tersedia.
 * 3. BUG FIX: Cleanup per-map storage dari ID yang tidak valid.
 * 4. Per-map storage tetap dipakai untuk mencegah cross-chapter contamination.
 */

(function () {
  'use strict';

  const STORAGE_KEY_LEGACY = 'mapgenie_unlimited_locations';
  const STORAGE_KEY_PREFIX = 'mapgenie_unlimited_map_';
  const DEBUG_LOG_KEY = 'mapgenie_unlimited_debuglog';
  const LOG_PREFIX = '[MapGenie Unlimited]';

  let updateLogPanelFn = null;
  let _currentMapId = null;
  let _migrationDone = false;

  // ─── On-screen debug log ─────────────────────────────────────────────────────

  function debugLog(msg) {
    console.log(LOG_PREFIX, msg);
    try {
      const logs = JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) || '[]');
      const time = new Date().toLocaleTimeString();
      logs.push(`[${time}] ${msg}`);
      while (logs.length > 80) logs.shift();
      localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(logs));
    } catch (e) {}
    if (updateLogPanelFn) updateLogPanelFn();
  }

  function getDebugLogs() {
    try { return JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function clearDebugLogs() {
    localStorage.setItem(DEBUG_LOG_KEY, '[]');
    if (updateLogPanelFn) updateLogPanelFn();
  }

  // ─── Per-map LocalStorage ─────────────────────────────────────────────────────

  function getStorageKey(mapId) {
    return mapId ? STORAGE_KEY_PREFIX + mapId : STORAGE_KEY_LEGACY;
  }

  function loadIds(mapId) {
    const key = getStorageKey(mapId || _currentMapId);
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch (e) {
      debugLog('⚠️ ERROR loadIds: ' + e.message);
      return [];
    }
  }

  function saveIds(arr, mapId) {
    const key = getStorageKey(mapId || _currentMapId);
    try {
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
      debugLog('⚠️ ERROR saveIds: ' + e.message);
    }
  }

  function addId(id, mapId) {
    const effectiveMapId = mapId || _currentMapId;
    const ids = loadIds(effectiveMapId);
    const n = parseInt(id);
    if (!ids.includes(n)) {
      ids.push(n);
      saveIds(ids, effectiveMapId);
      debugLog('Mark tersimpan: ' + n + ' (map: ' + effectiveMapId + ', total: ' + ids.length + ')');
    }
    // Update window.user.locations juga
    if (_user && Array.isArray(_user.locations)) {
      if (!_user.locations.includes(n)) _user.locations.push(n);
    } else if (_user && _user.locations && typeof _user.locations === 'object') {
      _user.locations[String(n)] = true;
    }
    return ids;
  }

  function removeId(id, mapId) {
    const effectiveMapId = mapId || _currentMapId;
    const n = parseInt(id);
    const ids = loadIds(effectiveMapId).filter(i => i !== n);
    saveIds(ids, effectiveMapId);
    debugLog('Unmark: ' + n + ' (map: ' + effectiveMapId + ', total: ' + ids.length + ')');
    // Update window.user.locations juga
    if (_user && Array.isArray(_user.locations)) {
      _user.locations = _user.locations.filter(i => i !== n);
    } else if (_user && _user.locations && typeof _user.locations === 'object') {
      delete _user.locations[String(n)];
    }
    return ids;
  }

  // ─── Map validation helper ────────────────────────────────────────────────────

  function getMapLocationIdSet() {
    if (!window.mapData || !Array.isArray(window.mapData.locations)) return null;
    return new Set(window.mapData.locations.map(l => l.id));
  }

  function filterValidIds(ids) {
    const validSet = getMapLocationIdSet();
    if (!validSet) return ids; // mapData belum ada, return semua
    return ids.filter(id => validSet.has(id));
  }

  // ─── Migrasi dari storage lama (global) ke per-map ────────────────────────────
  // HANYA dipanggil setelah window.mapData tersedia (supaya filter benar)

  function tryMigration(mapId) {
    if (_migrationDone || !mapId) return;
    const validSet = getMapLocationIdSet();
    if (!validSet) return; // mapData belum ada, skip dulu

    _migrationDone = true;

    const perMapKey = getStorageKey(mapId);
    const existingPerMap = JSON.parse(localStorage.getItem(perMapKey) || '[]');

    // Kalau per-map key sudah ada, cleanup: hapus ID yang tidak valid
    if (existingPerMap.length > 0) {
      const cleaned = existingPerMap.filter(id => validSet.has(id));
      if (cleaned.length < existingPerMap.length) {
        saveIds(cleaned, mapId);
        debugLog('🧹 Cleanup map ' + mapId + ': ' + existingPerMap.length + ' → ' + cleaned.length + ' IDs');
      }
      return;
    }

    // Per-map key kosong — coba migrasi dari legacy key
    const legacyIds = JSON.parse(localStorage.getItem(STORAGE_KEY_LEGACY) || '[]');
    if (legacyIds.length === 0) return;

    const validIds = legacyIds.filter(id => validSet.has(id));
    if (validIds.length > 0) {
      saveIds(validIds, mapId);
      debugLog('📦 Migrasi: ' + validIds.length + '/' + legacyIds.length + ' legacy IDs → map ' + mapId);
    } else {
      debugLog('📦 Migrasi: tidak ada legacy ID yang valid untuk map ' + mapId);
    }
  }

  // ─── Patch window.user ───────────────────────────────────────────────────────

  function injectSavedLocationsIntoUser(user) {
    if (!user) return false;
    const savedIds = loadIds();
    if (savedIds.length === 0) return true;

    try {
      if (user.locations === undefined || user.locations === null) return false;

      const validIds = filterValidIds(savedIds);

      if (Array.isArray(user.locations)) {
        validIds.forEach(id => {
          if (!user.locations.includes(id)) user.locations.push(id);
        });
        debugLog('Injected into user.locations, total now: ' + user.locations.length);
        return true;
      } else if (typeof user.locations === 'object') {
        let added = 0;
        validIds.forEach(id => {
          const key = String(id);
          if (!(key in user.locations)) {
            user.locations[key] = true;
            added++;
          }
        });
        if (added > 0) debugLog('Restored ' + added + ' marker ke user.locations');
        return true;
      }
      return false;
    } catch (e) {
      debugLog('ERROR injectSavedLocations: ' + e.message);
      return false;
    }
  }

  function hardPatchUser(user) {
    if (!user || typeof user !== 'object') return false;
    try {
      Object.defineProperty(user, 'hasPro', {
        get: () => true, set: () => {}, configurable: true, enumerable: true
      });
      Object.defineProperty(user, 'gameLocationsCount', {
        get: () => 0, set: () => {}, configurable: true, enumerable: true
      });

      if (!user.__mgLocationsTrapped) {
        let _locations = user.locations;
        Object.defineProperty(user, 'locations', {
          get() { return _locations; },
          set(newVal) {
            _locations = newVal;
            debugLog('locations property di-assign ulang, re-injecting...');
            setTimeout(() => injectSavedLocationsIntoUser(user), 0);
          },
          configurable: true,
          enumerable: true
        });
        Object.defineProperty(user, '__mgLocationsTrapped', {
          value: true, enumerable: false, configurable: true
        });
      }

      injectSavedLocationsIntoUser(user);
      return true;
    } catch(e) {
      debugLog('ERROR hardPatchUser: ' + e.message);
      return false;
    }
  }

  let _user = null;
  Object.defineProperty(window, 'user', {
    get() { return _user; },
    set(val) { _user = val; if (val) hardPatchUser(val); },
    configurable: true
  });
  if (window.user) { _user = window.user; hardPatchUser(window.user); }

  let locationsInjected = false;
  setInterval(() => {
    if (!_user) return;
    if (_user.hasPro !== true) hardPatchUser(_user);
    if (!locationsInjected) {
      const success = injectSavedLocationsIntoUser(_user);
      if (success) locationsInjected = true;
    }
  }, 500);

  // ─── Redux Store Restore ──────────────────────────────────────────────────────
  //
  // PENTING: MapGenie render checkmark HANYA ketika action MG:USER:MARK_LOCATION
  // di-dispatch. Memasukkan ID ke foundLocations via XHR patch TIDAK CUKUP —
  // dispatch action-nya sendiri yang memicu UI update.
  //
  // Oleh karena itu, kita SELALU dispatch untuk semua saved ID (tidak skip
  // meskipun ID sudah ada di foundLocations).

  let _reduxRestoreCount = 0;
  let _reduxUnsubscribe = null;
  const MAX_REDUX_RESTORES = 5;

  function tryRestoreRedux() {
    if (!window.store || !window.store.dispatch || !window.store.getState) {
      return false;
    }

    const state = window.store.getState();
    if (!state || !state.user) return false;

    // Tunggu mapData tersedia untuk filter yang akurat
    if (!window.mapData || !Array.isArray(window.mapData.locations)) {
      debugLog('Redux restore: menunggu mapData...');
      return false; // polling akan coba lagi
    }

    // Jalankan migrasi + cleanup (sekarang mapData sudah tersedia)
    if (_currentMapId) tryMigration(_currentMapId);

    const savedIds = loadIds();
    if (savedIds.length === 0) {
      debugLog('Redux restore: tidak ada mark tersimpan untuk map ' + _currentMapId);
      setupReduxWatcher();
      return true;
    }

    // Filter: hanya ID yang valid untuk map saat ini
    const validIds = filterValidIds(savedIds);
    if (validIds.length === 0) {
      debugLog('Redux restore: tidak ada valid ID untuk map ' + _currentMapId + ' (saved: ' + savedIds.length + ')');
      setupReduxWatcher();
      return true;
    }

    _reduxRestoreCount++;
    if (_reduxRestoreCount > MAX_REDUX_RESTORES) {
      debugLog('⚠️ Redux restore: max retries (' + MAX_REDUX_RESTORES + ')');
      return true;
    }

    // SELALU dispatch — jangan cek missingIds!
    // Dispatch action itu sendiri yang trigger visual render.
    validIds.forEach(id => {
      window.store.dispatch({
        type: 'MG:USER:MARK_LOCATION',
        meta: { locationId: id, found: true }
      });
    });
    debugLog('✅ Redux restore #' + _reduxRestoreCount + ': ' + validIds.length + ' marks dispatched (map ' + _currentMapId + ')');

    setupReduxWatcher();
    return true;
  }

  // Watcher: kalau MapGenie reset foundLocations, re-dispatch
  function setupReduxWatcher() {
    if (_reduxUnsubscribe) return;
    if (!window.store || !window.store.subscribe) return;

    let lastFoundCount = -1;

    _reduxUnsubscribe = window.store.subscribe(() => {
      try {
        const state = window.store.getState();
        if (!state || !state.user) return;
        const currentCount = (state.user.foundLocations || []).length;

        if (lastFoundCount === -1) {
          lastFoundCount = currentCount;
          return;
        }

        // Deteksi reset: foundLocations turun drastis
        if (currentCount < lastFoundCount && lastFoundCount - currentCount > 3) {
          debugLog('⚠️ Reset terdeteksi: ' + lastFoundCount + ' → ' + currentCount + ', re-restoring...');
          lastFoundCount = currentCount;
          setTimeout(() => tryRestoreRedux(), 500);
        } else {
          lastFoundCount = currentCount;
        }
      } catch (e) {}
    });
  }

  // Polling: coba restore setiap 500ms sampai berhasil
  const _reduxPoll = setInterval(() => {
    if (tryRestoreRedux()) clearInterval(_reduxPoll);
  }, 500);

  // ─── Intercept XHR ───────────────────────────────────────────────────────────

  const OriginalXHR = window.XMLHttpRequest;

  class PatchedXHR extends OriginalXHR {
    constructor() {
      super();
      this._mgMethod = '';
      this._mgUrl = '';
      this._mgIsMapData = false;
      this._mgMapDataPatched = false;
      this._mgMapId = null;

      // Listener di CONSTRUCTOR supaya jalan SEBELUM listener MapGenie
      super.addEventListener('readystatechange', () => {
        if (
          this._mgIsMapData &&
          this.readyState === 4 &&
          this.status === 200 &&
          !this._mgMapDataPatched
        ) {
          this._mgMapDataPatched = true;
          try {
            // Set current map ID
            if (this._mgMapId) {
              _currentMapId = this._mgMapId;
              debugLog('Map ID: ' + _currentMapId);
            }

            const original = JSON.parse(this.responseText);

            // Patch Pro flags (ini bisa dilakukan tanpa perlu mapData)
            original.hasPro = true;
            original.maxMarkedLocations = 999999;
            original.gameLocationsCount = 0;

            // Inject saved IDs ke response locations
            // NOTE: mapData mungkin belum tersedia di sini, jadi kita load SEMUA
            // IDs dari per-map storage. Filter akurat dilakukan di tryRestoreRedux().
            const savedIds = loadIds(this._mgMapId);
            if (savedIds.length > 0) {
              if (Array.isArray(original.locations)) {
                savedIds.forEach(id => {
                  if (!original.locations.includes(id)) original.locations.push(id);
                });
              } else {
                original.locations = savedIds.slice();
              }
            }

            const patchedText = JSON.stringify(original);
            Object.defineProperty(this, 'responseText', { get: () => patchedText, configurable: true });
            Object.defineProperty(this, 'response', { get: () => patchedText, configurable: true });

            debugLog('✅ Patched map-data (XHR), map ' + this._mgMapId + ', injected ' + savedIds.length + ' IDs');

            // Reset Redux restore untuk map baru
            _reduxRestoreCount = 0;
            if (_reduxUnsubscribe) { _reduxUnsubscribe(); _reduxUnsubscribe = null; }
            // Trigger restore setelah delay (biarkan mapData load dulu)
            setTimeout(() => tryRestoreRedux(), 1500);
          } catch (e) {
            debugLog('⚠️ ERROR patching map-data XHR: ' + e.message);
          }
        }
      });
    }

    open(method, url, ...args) {
      this._mgMethod = (method || '').toUpperCase();
      this._mgUrl = url || '';
      const mapDataMatch = this._mgUrl.match(/\/api\/v1\/user\/map-data\/(\d+)/);
      this._mgIsMapData = !!(mapDataMatch && this._mgMethod === 'GET');
      if (mapDataMatch) this._mgMapId = parseInt(mapDataMatch[1]);
      super.open(method, url, ...args);
    }

    send(body) {
      const locMatch = this._mgUrl.match(/\/api\/v1\/user\/locations\/(\d+)/);

      if (this._mgIsMapData) {
        super.send(body);
        return;
      }

      if (locMatch && this._mgMethod === 'PUT') {
        const locationId = locMatch[1];

        this.abort();
        addId(locationId);

        super.open('GET', 'about:blank');

        const self = this;
        setTimeout(() => {
          try {
            Object.defineProperty(self, 'readyState', { get: () => 4, configurable: true });
            Object.defineProperty(self, 'status', { get: () => 200, configurable: true });
            Object.defineProperty(self, 'responseText', {
              get: () => JSON.stringify({ data: { id: parseInt(locationId) } }),
              configurable: true
            });
            Object.defineProperty(self, 'response', {
              get: () => JSON.stringify({ data: { id: parseInt(locationId) } }),
              configurable: true
            });
          } catch(e) { debugLog('⚠️ defineProperty fail: ' + e.message); }

          try {
            self.dispatchEvent(new Event('readystatechange'));
            if (typeof self.onreadystatechange === 'function') self.onreadystatechange();
          } catch(e) {}

          try {
            self.dispatchEvent(new ProgressEvent('load', { lengthComputable: false, loaded: 0, total: 0 }));
            if (typeof self.onload === 'function') self.onload();
          } catch(e) {}

          try {
            self.dispatchEvent(new ProgressEvent('loadend', { lengthComputable: false, loaded: 0, total: 0 }));
            if (typeof self.onloadend === 'function') self.onloadend();
          } catch(e) {}
        }, 30);

        return;
      }

      if (locMatch && this._mgMethod === 'DELETE') {
        removeId(locMatch[1]);
      }

      super.send(body);
    }
  }

  window.XMLHttpRequest = PatchedXHR;

  // ─── Intercept fetch ─────────────────────────────────────────────────────────

  const origFetch = window.fetch;
  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    const method = (init.method || 'GET').toUpperCase();
    const locMatch = url.match(/\/api\/v1\/user\/locations\/(\d+)/);
    const mapDataMatch = url.match(/\/api\/v1\/user\/map-data\/(\d+)/);

    if (mapDataMatch && method === 'GET') {
      const mapId = parseInt(mapDataMatch[1]);
      _currentMapId = mapId;

      const response = await origFetch(input, init);
      try {
        const original = await response.clone().json();

        original.hasPro = true;
        original.maxMarkedLocations = 999999;
        original.gameLocationsCount = 0;

        const savedIds = loadIds(mapId);
        if (savedIds.length > 0) {
          if (Array.isArray(original.locations)) {
            savedIds.forEach(id => {
              if (!original.locations.includes(id)) original.locations.push(id);
            });
          } else {
            original.locations = savedIds.slice();
          }
        }

        debugLog('✅ Patched map-data (fetch), map ' + mapId + ', injected ' + savedIds.length + ' IDs');

        _reduxRestoreCount = 0;
        if (_reduxUnsubscribe) { _reduxUnsubscribe(); _reduxUnsubscribe = null; }
        setTimeout(() => tryRestoreRedux(), 1500);

        return new Response(JSON.stringify(original), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        debugLog('ERROR patching map-data (fetch): ' + e.message);
        return response;
      }
    }

    if (locMatch && method === 'PUT') {
      const id = locMatch[1];
      addId(id);
      return new Response(JSON.stringify({ data: { id: parseInt(id) } }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (locMatch && method === 'DELETE') {
      removeId(locMatch[1]);
    }

    const response = await origFetch(input, init);
    return response;
  };

  // ─── UI: Badge + Debug Panel ──────────────────────────────────────────────────

  window.addEventListener('DOMContentLoaded', () => {
    const badge = document.createElement('div');
    badge.textContent = '∞ Unlimited ON';
    badge.style.cssText = [
      'position:fixed','bottom:12px','left:12px','z-index:999999',
      'background:#2ecc71','color:#fff','font-size:12px','font-weight:bold',
      'padding:6px 12px','border-radius:20px','box-shadow:0 2px 6px rgba(0,0,0,0.3)',
      'cursor:pointer','font-family:sans-serif'
    ].join(';');

    const panel = document.createElement('div');
    panel.style.cssText = [
      'position:fixed','bottom:60px','left:12px','right:12px','z-index:999999',
      'background:#1a1a1a','color:#0f0','font-size:11px','font-family:monospace',
      'padding:10px','border-radius:8px','box-shadow:0 2px 10px rgba(0,0,0,0.5)',
      'max-height:60vh','overflow-y:auto','display:none','white-space:pre-wrap'
    ].join(';');

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;';

    function makeBtn(label) {
      const b = document.createElement('div');
      b.textContent = label;
      b.style.cssText = 'background:#333;color:#fff;padding:4px 8px;border-radius:4px;font-size:10px;font-weight:bold;cursor:pointer;';
      return b;
    }

    const tabStatusBtn = makeBtn('Status');
    const tabLogBtn = makeBtn('Log');
    const clearBtn = makeBtn('Clear Log');
    const copyBtn = makeBtn('Copy');
    const repatchBtn = makeBtn('Re-patch');
    const closeBtn = makeBtn('Tutup');

    toolbar.appendChild(tabStatusBtn);
    toolbar.appendChild(tabLogBtn);
    toolbar.appendChild(clearBtn);
    toolbar.appendChild(copyBtn);
    toolbar.appendChild(repatchBtn);
    toolbar.appendChild(closeBtn);

    panel.appendChild(toolbar);
    const logContent = document.createElement('div');
    panel.appendChild(logContent);

    let activeTab = 'status';

    function renderPanel() {
      const ids = loadIds();
      const logs = getDebugLogs();
      const u = window.user;
      const mapLocCount = window.mapData && Array.isArray(window.mapData.locations) ? window.mapData.locations.length : '?';

      if (activeTab === 'status') {
        logContent.textContent =
          'Map ID: ' + (_currentMapId || '?') + '\n' +
          'Map locations: ' + mapLocCount + '\n' +
          'Marks tersimpan (map ini): ' + ids.length + '\n' +
          'Pro mode: ' + (u?.hasPro ? 'AKTIF' : 'OFF') + '\n' +
          'Redux restore: ' + _reduxRestoreCount + '/' + MAX_REDUX_RESTORES + '\n' +
          'Redux watcher: ' + (_reduxUnsubscribe ? 'ON' : 'OFF') + '\n' +
          'Migrasi: ' + (_migrationDone ? 'selesai' : 'belum') + '\n\n' +
          'Tap "Log" untuk detail.';
      } else {
        logContent.textContent = logs.length
          ? logs.join('\n')
          : '(belum ada log)';
      }
    }

    updateLogPanelFn = renderPanel;

    let panelVisible = false;
    badge.addEventListener('click', () => {
      panelVisible = !panelVisible;
      panel.style.display = panelVisible ? 'block' : 'none';
      if (panelVisible) renderPanel();
    });

    tabStatusBtn.addEventListener('click', () => { activeTab = 'status'; renderPanel(); });
    tabLogBtn.addEventListener('click', () => { activeTab = 'log'; renderPanel(); });

    clearBtn.addEventListener('click', () => {
      clearDebugLogs();
      renderPanel();
    });

    copyBtn.addEventListener('click', () => {
      renderPanel();
      const textToCopy = logContent.textContent;
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        const ok = document.execCommand('copy');
        alert(ok ? 'Disalin! (' + textToCopy.length + ' karakter)' : 'Copy gagal.');
      } catch(e) {
        alert('Copy gagal: ' + e.message);
      }
      document.body.removeChild(textarea);
    });

    repatchBtn.addEventListener('click', () => {
      debugLog('=== Manual re-patch ===');
      _reduxRestoreCount = 0;
      _migrationDone = false;
      if (_reduxUnsubscribe) { _reduxUnsubscribe(); _reduxUnsubscribe = null; }
      if (window.user) hardPatchUser(window.user);
      tryRestoreRedux();
      renderPanel();
    });

    closeBtn.addEventListener('click', () => {
      panelVisible = false;
      panel.style.display = 'none';
    });

    document.body.appendChild(badge);
    document.body.appendChild(panel);

    debugLog('=== Page loaded, addon v2.7 aktif ===');
  });

  console.log(LOG_PREFIX, 'v2.7 injected ✅');

})();
