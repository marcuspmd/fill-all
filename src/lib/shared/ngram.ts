/**
 * Character n-gram utilities for text feature extraction.
 *
 * This module provides:
 *  - Character n-gram extraction
 *  - Sparse → dense vectorisation using a fixed vocabulary
 *  - L2 normalisation for cosine similarity comparison
 *
 * Designed primarily for lightweight text classification
 * (e.g. form field detection), but reusable for any model
 * that relies on character-level n-gram features.
 */

/**
 * Size of the character n-grams.
 *
 * N = 3 (trigram) is a strong default for short texts because:
 *  - Captures meaningful local patterns
 *  - Reduces ambiguity compared to unigrams
 *  - Keeps vocabulary growth manageable
 *
 * Adjust carefully: larger values increase feature space size
 * and memory usage exponentially.
 */
export const NGRAM_SIZE = 3;

/**
 * Computes the dot product between two L2-normalised vectors.
 *
 * Since vectors are expected to be L2-normalised beforehand,
 * the dot product is equivalent to cosine similarity.
 *
 * Returns a similarity score in range [-1, 1].
 * For frequency-based n-gram vectors, the range will typically be [0, 1].
 */
export function dotProduct(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * Extracts character n-grams from input text.
 *
 * Processing steps:
 *  1. Lowercase
 *  2. Remove diacritics (NFD normalization)
 *  3. Replace common separators with spaces
 *  4. Collapse multiple spaces
 *  5. Pad text with boundary markers ("_") to preserve edge context
 *
 * Example (N = 3):
 *   "Email" → "_email_"
 *   → ["_em", "ema", "mai", "ail", "il_"]
 *
 * Boundary padding improves discrimination between
 * prefixes and suffixes.
 */
export function charNgrams(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-/.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const padded = `_${normalized}_`;

  const result: string[] = [];
  for (let i = 0; i <= padded.length - NGRAM_SIZE; i++) {
    result.push(padded.slice(i, i + NGRAM_SIZE));
  }

  return result;
}

/**
 * Converts text into a dense Float32 feature vector using a fixed vocabulary.
 *
 * Steps:
 *  1. Generate character n-grams
 *  2. Count term frequency for each n-gram present in vocab
 *  3. Produce dense vector of size vocab.size
 *  4. Apply L2 normalisation
 *
 * Output:
 *  - A unit-length vector (||v|| = 1)
 *  - Suitable for cosine similarity comparison via dot product
 *
 * Notes:
 *  - This is a TF (term frequency) representation, not TF-IDF.
 *  - Vocabulary must be consistent between training and inference.
 *  - Unknown n-grams are ignored.
 */
export function vectorize(
  text: string,
  vocab: Map<string, number>,
): Float32Array {
  const v = new Float32Array(vocab.size);

  // Term frequency accumulation
  for (const ng of charNgrams(text)) {
    const i = vocab.get(ng);
    if (i !== undefined) v[i] += 1;
  }

  // Compute L2 norm
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);

  // Normalise to unit vector
  if (norm > 0) {
    for (let i = 0; i < v.length; i++) v[i] /= norm;
  }

  return v;
}
