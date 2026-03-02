export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
) {
  let timer: number | undefined;

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
