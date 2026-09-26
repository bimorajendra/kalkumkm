import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('tema aplikasi', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('menyimpan pilihan terang dan gelap', async () => {
    const values = new Map<string, string>();
    const attributes: Record<string, string> = {};
    const removeAttribute = vi.fn((name: string) => delete attributes[name]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    } as unknown as Storage);
    vi.stubGlobal('document', {
      documentElement: { dataset: attributes, removeAttribute },
    } as unknown as Document);
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
    }));

    const { getTheme, setTheme } = await import('./theme');
    setTheme('dark');
    expect(getTheme()).toBe('dark');
    expect(attributes.theme).toBe('dark');

    setTheme('system');
    expect(getTheme()).toBe('system');
    expect(removeAttribute).toHaveBeenCalledWith('data-theme');
  });

  it('mengikuti tema sistem jika localStorage tidak dapat digunakan', async () => {
    const attributes: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('storage tidak tersedia');
      },
      setItem: () => {
        throw new Error('storage tidak tersedia');
      },
      removeItem: () => {
        throw new Error('storage tidak tersedia');
      },
    } as unknown as Storage);
    vi.stubGlobal('document', {
      documentElement: { dataset: attributes, removeAttribute: vi.fn() },
    } as unknown as Document);
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
    }));

    const { getTheme, setTheme } = await import('./theme');
    expect(getTheme()).toBe('system');
    expect(setTheme('light')).toBe('system');
    expect(attributes.theme).toBe('dark');
  });
});
