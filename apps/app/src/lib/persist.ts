import { getSetting, setSetting } from '../features/settings/repository';

export async function initializePersistence(): Promise<void> {
  if (await getSetting('firstOpenedAt')) return;
  try {
    await navigator.storage?.persist?.();
  } catch {
    // Storage persistence is optional; IndexedDB remains the source of truth.
  }
  await setSetting('firstOpenedAt', new Date().toISOString());
}
