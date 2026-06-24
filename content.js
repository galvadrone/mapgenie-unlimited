/**
 * MapGenie Unlimited Markers - content.js
 * Content script: jalan di isolated world, inject injected.js ke page context.
 */

(function () {
  'use strict';

  // Inject injected.js ke page context (bukan isolated content script context)
  // supaya bisa akses dan patch window.XMLHttpRequest, window.fetch, window.user
  const script = document.createElement('script');
  script.src = browser.runtime.getURL('injected.js');
  script.async = false;

  // Inject sebelum script lain jalan (document_start)
  const target = document.head || document.documentElement;
  target.insertBefore(script, target.firstChild);

  // Bersihkan setelah inject
  script.addEventListener('load', () => {
    script.remove();
  });
})();
