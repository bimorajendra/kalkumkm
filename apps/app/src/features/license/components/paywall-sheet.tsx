interface PaywallSheetProps {
  open: boolean;
  trigger: 'sub_recipe' | 'sales_channel' | 'quote';
  onClose: () => void;
}

export function PaywallSheet({ open, trigger, onClose }: PaywallSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  if (!open) return null;
  const copy =
    trigger === 'sub_recipe'
      ? 'Simpan adonan dasar dan pakai lagi di resep lain dengan Takaran Pro.'
      : trigger === 'quote'
        ? 'Buat penawaran pesanan custom dengan Takaran Pro.'
        : 'Tambahkan saluran jual lain dengan Takaran Pro.';
  return (
    <dialog
      ref={dialog}
      className="paywall-sheet-dialog"
      aria-labelledby="paywall-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <section className="paywall-sheet">
        <button
          className="icon-button"
          type="button"
          aria-label="Tutup"
          onClick={onClose}
        >
          ×
        </button>
        <h2 id="paywall-title">Fitur Takaran Pro</h2>
        <p>{copy}</p>
        <a className="button button-primary" href="/beli">
          Lihat Takaran Pro
        </a>
      </section>
    </dialog>
  );
}

import { useEffect, useRef } from 'react';
