import { beforeEach, describe, expect, it, vi } from 'vitest';
import { track } from './analytics';

describe('app analytics', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { umami: { track: vi.fn() } },
    });
  });

  it('sends allowlisted events with their valid properties', () => {
    track('app_opened', { installed: true });
    expect(window.umami?.track).toHaveBeenCalledWith('app_opened', {
      installed: true,
    });
  });

  it('does not send unknown events or properties that can contain user data', () => {
    track('app_opened', { installed: true, recipe: 'brownies' } as never);
    track('unlisted_event' as never, {} as never);
    expect(window.umami?.track).not.toHaveBeenCalled();
  });
});
