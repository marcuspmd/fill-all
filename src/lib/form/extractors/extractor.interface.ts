/**
 * Extractor Interface
 *
 * Base contract for extraction utilities that pull data from DOM / HTML elements.
 * Extractors do NOT classify field types — they only gather raw data
 * (labels, selectors, signals) from the page.
 *
 *   TInput  — what the extractor receives (e.g. HTMLElement, FormField).
 *   TResult — what the extractor returns (e.g. string, LabelResult).
 *
 * Concrete implementations:
 *
 *   selectorExtractor : Extractor<Element, string>
 *   signalsExtractor  : Extractor<Partial<FormField>, string>
 *   labelExtractor    : Extractor<HTMLElement, LabelResult | undefined>
 */

export interface Extractor<TInput, TResult> {
  /** Unique identifier for this extractor. */
  readonly name: string;

  /** Run the extraction logic and return the result. */
  extract(input: TInput): TResult;
}
