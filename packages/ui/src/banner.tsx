import { type KeyboardEvent, type ReactNode, useRef } from 'react';

export interface BannerProps {
  children: ReactNode;
  onDismiss: () => void;
  dismissLabel?: string;
}

export function Banner({
  children,
  dismissLabel = 'Tutup pemberitahuan',
  onDismiss,
}: BannerProps) {
  const rootRef = useRef<HTMLOutputElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLOutputElement>) {
    if (
      event.key === 'Escape' &&
      rootRef.current?.contains(document.activeElement)
    ) {
      event.preventDefault();
      onDismiss();
    }
  }

  return (
    <output ref={rootRef} className="takaran-banner" onKeyDown={handleKeyDown}>
      <span aria-hidden="true" className="takaran-banner__icon">
        !
      </span>
      <span className="takaran-banner__message">{children}</span>
      <button
        aria-label={dismissLabel}
        className="takaran-banner__dismiss"
        onClick={onDismiss}
        type="button"
      >
        ×
      </button>
    </output>
  );
}
