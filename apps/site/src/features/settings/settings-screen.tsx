'use client';

import { Download } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { deleteAccount } from '@/app/(app)/lainnya/actions';
import { useSnapshot } from '@/components/takaran/data-provider';
import { Page, PageTitle } from '@/components/takaran/page';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChannelList } from '@/features/channels/channel-list';

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid content-start justify-items-start gap-3 rounded-xl bg-card p-5 shadow-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsScreen({
  user,
}: {
  user: { name: string; email: string };
}) {
  const { plan } = useSnapshot();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    setDeleting(true);
    setError('');
    const result = await deleteAccount(phrase);
    // Berhasil berarti server mengalihkan halaman; sampai sini hanya bila gagal.
    if (result && !result.ok) setError(result.message);
    setDeleting(false);
  }

  return (
    <Page className="grid gap-4">
      <PageTitle>Pengaturan</PageTitle>
      <Card title="Akun">
        <p>
          {user.name}
          <span className="block text-sm text-muted-foreground">
            {user.email}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Paket: {plan === 'pro' ? 'Takaran Pro' : 'Gratis'}
        </p>
      </Card>
      <ChannelList />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Penawaran pesanan">
          <p>Buat rincian harga untuk pesanan dengan tambahan khusus.</p>
          <Button asChild variant="outline">
            <Link href="/penawaran">Buka penawaran</Link>
          </Button>
        </Card>
        <Card title="Takaran Pro">
          <p>
            {plan === 'pro'
              ? 'Terima kasih, semua fitur Pro sudah terbuka.'
              : 'Tambah resep dan saluran sesuai kebutuhan usahamu.'}
          </p>
          <Button asChild variant="outline">
            <Link href="/beli">
              {plan === 'pro' ? 'Lihat detail' : 'Lihat paket Pro'}
            </Link>
          </Button>
        </Card>
        <Card title="Datamu">
          <p>Unduh semua bahan, resep, dan pengaturanmu sebagai satu berkas.</p>
          <Button asChild variant="outline">
            <a href="/api/me/export" download>
              <Download aria-hidden="true" /> Unduh data saya
            </a>
          </Button>
        </Card>
      </div>
      <Card title="Hapus akun">
        <p>
          Semua bahan, resep, dan pengaturanmu ikut terhapus dan tidak bisa
          dikembalikan. Unduh datamu dulu bila masih perlu.
        </p>
        <Button
          type="button"
          variant="outline"
          className="border-destructive text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          Hapus akun dan semua data
        </Button>
      </Card>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-semibold">
              Hapus akun?
            </DialogTitle>
            <DialogDescription>
              Ketik <strong>hapus akun saya</strong> untuk memastikan. Ini tidak
              bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Ketik hapus akun saya"
            autoComplete="off"
            value={phrase}
            onChange={(event) => setPhrase(event.target.value)}
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? 'Menghapus…' : 'Hapus semua'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
