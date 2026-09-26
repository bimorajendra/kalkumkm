export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let pendingPrompt: InstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    pendingPrompt = event as InstallPromptEvent;
    window.dispatchEvent(new Event('takaran:installprompt'));
  });
}

export function getInstallPrompt(): InstallPromptEvent | null {
  return pendingPrompt;
}

export function clearInstallPrompt(): void {
  pendingPrompt = null;
}
