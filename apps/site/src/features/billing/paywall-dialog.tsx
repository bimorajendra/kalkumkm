'use client';

import { PRICING } from '@takaran/schema';
import { formatRupiah } from '@takaran/ui/format';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type PaywallTrigger = 'recipe' | 'channel' | 'sub_recipe' | 'quote';

const copy: Record<PaywallTrigger, string> = {
  recipe:
    'Paket gratis dibatasi 3 resep. Takaran Pro membuka resep tanpa batas.',
  channel:
    'Tambahkan saluran jual lain, seperti reseller dan ojol, dengan Takaran Pro.',
  sub_recipe:
    'Simpan adonan dasar dan pakai lagi di resep lain dengan Takaran Pro.',
  quote: 'Buat penawaran pesanan custom dengan Takaran Pro.',
};

export function PaywallDialog({
  open,
  trigger,
  onClose,
}: {
  open: boolean;
  trigger: PaywallTrigger;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-semibold">
            Fitur Takaran Pro
          </DialogTitle>
          <DialogDescription>{copy[trigger]}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Sekali bayar {formatRupiah(PRICING.pro.idr)}, tanpa langganan.
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard/beli">Lihat Takaran Pro</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
