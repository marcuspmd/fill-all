const en = require('../_locales/en/messages.json');
const keys = [
  'actionFill','btnCancel','btnClearLog','btnDelete','btnEdit','btnLoadForms','btnSave',
  'columnActions','columnConf','columnIdName','columnLabel','columnMethod','columnSelector','columnType',
  'detectFields','editFieldsHeader','fieldCount','fieldCountDetected','fieldCountPage',
  'fieldsFillCount','fieldsFillStatus','fillAll','fillAllDesc','fixedValue','formCount','formName','formUrl',
  'fpActionAddRule','fpActionInspect','fpApplyTemplate','fpBadgesCleared','fpClearBadgesDesc','fpClearBadgesLabel',
  'fpClose','fpDetecting','fpFieldActiveTitle','fpFieldIgnoredTitle','fpFillError','fpFillErrorLog','fpFilling',
  'fpLoading','fpMinimize','fpNewFieldsRefill','fpNewFieldsViaWatch','fpNoActivity','fpOpenOptions',
  'fpTemplateApplied','fpWatchActivatedDOM','fpWatchActive','fpWatchClickToStop',
  'generatorMode','logApplyingTemplate','logBadgesRemoved','logFieldFilled','logFieldIgnored',
  'logFieldIgnoredSkip','logFieldReactivated','logFillError','logFormRemoved','logFormSavedWith',
  'logFormUpdated','logOpeningOptions','logRuleCreated','logRuleError','logWatchActivated','logWatchDeactivated',
  'noFormsForPage','saveForm','saveFormDesc','savedStatus',
  'tabActions','tabFields','tabForms','tabLog','watch','watchDesc'
];
const missing = keys.filter(k => !en[k]);
if (missing.length === 0) {
  console.log('All keys present!');
} else {
  console.log('MISSING:', missing.join('\n'));
}
