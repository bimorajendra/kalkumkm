import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import {
  type SettingKey,
  type SettingValues,
  settingDefaults,
} from '../../db/schema';

export async function getSetting<K extends SettingKey>(
  key: K,
): Promise<SettingValues[K]> {
  const row = await db.settings.get(key);
  return (row?.value ?? settingDefaults[key]) as SettingValues[K];
}

export async function setSetting<K extends SettingKey>(
  key: K,
  value: SettingValues[K],
): Promise<void> {
  await db.settings.put({ key, value });
}

export function useSetting<K extends SettingKey>(key: K): SettingValues[K] {
  return (useLiveQuery(() => getSetting(key), [key], settingDefaults[key]) ??
    settingDefaults[key]) as SettingValues[K];
}
