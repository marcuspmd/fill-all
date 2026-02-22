/**
 * Options page — orchestrator that initialises all tab modules.
 */

import "./options.css";
import { initTabs } from "./shared";
import { initSettingsTab } from "./settings-section";
import { initRulesTab } from "./rules-section";
import { initFormsTab } from "./forms-section";
import { initCacheTab } from "./cache-section";
import { initDatasetTab } from "./dataset-section";

initTabs();
initSettingsTab();
initRulesTab();
initFormsTab();
initCacheTab();
initDatasetTab();
