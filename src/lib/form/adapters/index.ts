// Adapter infrastructure
export type { CustomComponentAdapter, AdapterName } from "./adapter.interface";
export {
  registerAdapter,
  getAdapter,
  detectCustomComponents,
  fillCustomComponent,
} from "./adapter-registry";

// Select2
export { select2Adapter } from "./select2";

// Ant Design
export {
  antdAutoCompleteAdapter,
  antdCascaderAdapter,
  antdCheckboxAdapter,
  antdDatepickerAdapter,
  antdInputAdapter,
  antdRadioAdapter,
  antdRateAdapter,
  antdSelectAdapter,
  antdSliderAdapter,
  antdSwitchAdapter,
  antdTransferAdapter,
  antdTreeSelectAdapter,
} from "./antd";
