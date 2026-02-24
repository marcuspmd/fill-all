/**
 * Detector Interface
 *
 * Base contract shared by every detector in this module.
 *
 *   TInput  — what the detector receives as input.
 *             Use `void` for page-level scanners that operate on the global document.
 *   TResult — what the detector returns.
 *
 * All detectors expose the same two members:
 *
 *   name    — unique, human-readable identifier (used for logging and pipeline ordering)
 *   detect  — the detection function
 *
 * Examples of concrete implementations:
 *
 *   htmlTypeDetector   : Detector<HTMLElement, BasicTypeResult>
 *   labelDetector      : Detector<HTMLElement, LabelResult | undefined>
 *   signalsBuilder     : Detector<Partial<FormField>, string>
 *   selectorBuilder    : Detector<Element, string>
 *   FieldClassifier    : Detector<FormField, ClassifierResult | null>   (sub-interface)
 *   interactiveFieldDetector : Detector<void, InteractiveField[]>
 *   customSelectDetector     : Detector<void, CustomSelectField[]>
 */

export interface Detector<TInput, TResult> {
  /** Unique identifier for this detector. */
  readonly name: string;

  /** Run the detection logic and return the result. */
  detect(input: TInput): TResult;
}
