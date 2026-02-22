export function matchUrlPattern(url: string, pattern: string): boolean {
  try {
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    const regex = new RegExp(`^${escaped}$`, "i");
    return regex.test(url);
  } catch {
    return url.includes(pattern);
  }
}
