export function scheduleSave(callback: () => void, delay = 300): () => void {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);
}
