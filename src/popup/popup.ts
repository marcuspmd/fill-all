/**
 * Popup script — orchestrator that initializes all popup sections
 */

import "./popup.css";

import { loadSavedForms } from "./popup-forms";
import { loadIgnoredFields } from "./popup-ignored";
import { loadDetectedFieldsFromCache, bindDetectEvents } from "./popup-detect";
import { initGeneratorConfigs, bindGeneratorEvents } from "./popup-generators";
import { initChromeAIStatus } from "./popup-chrome-ai";
import {
  bindFillAllAction,
  bindSaveFormAction,
  bindOptionsAction,
  bindTogglePanelAction,
  bindToggleWatchAction,
  initWatcherStatus,
} from "./popup-actions";

// Bind all UI events
bindFillAllAction();
bindSaveFormAction();
bindDetectEvents();
bindGeneratorEvents();
bindOptionsAction();
bindTogglePanelAction();
bindToggleWatchAction();

// Load initial data
loadSavedForms();
loadIgnoredFields();
loadDetectedFieldsFromCache();
initWatcherStatus();
initGeneratorConfigs();
initChromeAIStatus();
