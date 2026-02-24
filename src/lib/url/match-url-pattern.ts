/**
 * Matches a URL against a glob-style pattern.
 * Supports `*` as wildcard (matches any sequence of characters).
 *
 * Uses segment-based matching instead of dynamic regex to avoid ReDoS.
 */
export function matchUrlPattern(url: string, pattern: string): boolean {
  if (!url || !pattern) return false;

  // Exact match fast path
  if (url === pattern) return true;

  // If no wildcards, fall back to a simple includes check
  if (!pattern.includes("*")) {
    return url.toLowerCase() === pattern.toLowerCase();
  }

  // Split by `*` and ensure each segment appears in order in the URL
  const segments = pattern.toLowerCase().split("*");
  let pos = 0;
  const lowerUrl = url.toLowerCase();

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) continue;

    // First segment must be a prefix, last segment must be a suffix
    if (i === 0) {
      if (!lowerUrl.startsWith(segment)) return false;
      pos = segment.length;
    } else if (i === segments.length - 1) {
      if (!lowerUrl.endsWith(segment)) return false;
      // Ensure the suffix doesn't overlap with already-matched prefix
      if (lowerUrl.length - segment.length < pos) return false;
    } else {
      const idx = lowerUrl.indexOf(segment, pos);
      if (idx === -1) return false;
      pos = idx + segment.length;
    }
  }

  return true;
}
