/**
 * DevTools entry — registers the "Fill All" panel tab inside Chrome DevTools.
 * This file runs once when the user opens DevTools for a page.
 */

chrome.devtools.panels.create(
  "Fill All",
  "icons/icon-48.png",
  "src/devtools/panel.html",
);
