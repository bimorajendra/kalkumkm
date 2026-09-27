'use client';

import { useState } from 'react';
import {
  errorMessage,
  useRun,
  useSnapshot,
} from '@/components/takaran/data-provider';
import { Button } from '@/components/ui/button';
import type { ChannelRow } from '@/domain/types';
import { ChannelForm } from './channel-form';
import { channelCopy } from './copy';

/** Daftar saluran jual di pengaturan. Saluran "Langsung" tetap dan tidak bisa diubah. */
export function ChannelList() {
  const { channels } = useSnapshot();
  const run = useRun();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ChannelRow>();
  const [message, setMessage] = useState('');

  async function remove(channel: ChannelRow) {
    if (!window.confirm(`${channelCopy.deleteConfirm} ${channel.name}`)) return;
    try {
      await run({ type: 'channel.delete', id: channel.id });
      setMessage('Saluran dihapus.');
    } catch (error) {
      setMessage(errorMessage(error, channelCopy.saveError));
    }
  }

  return (
    <section
      aria-labelledby="channel-settings-title"
      className="grid gap-3 rounded-xl bg-card p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="channel-settings-title" className="text-xl font-semibold">
            {channelCopy.title}
          </h2>
          <p className="text-muted-foreground">{channelCopy.description}</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          {channelCopy.add}
        </Button>
      </div>
      {message ? (
        <output className="text-sm text-muted-foreground">{message}</output>
      ) : null}
      {channels.length ? (
        <ul className="divide-y divide-border">
          {[...channels]
            .sort((a, b) => a.name.localeCompare(b.name, 'id'))
            .map((channel) => (
              <li
                key={channel.id}
                className="flex min-h-14 items-center justify-between gap-3 py-2"
              >
                <div>
                  <strong className="block">{channel.name}</strong>
                  <span className="text-sm text-muted-foreground">
                    {channel.name === 'Langsung'
                      ? 'Harga langsung'
                      : `${channel.kind === 'commission' ? 'Komisi' : 'Diskon'} ${channel.rateBp / 100}%`}
                  </span>
                </div>
                {channel.name === 'Langsung' ? (
                  <span className="text-sm text-muted-foreground">Utama</span>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(channel);
                        setFormOpen(true);
                      }}
                    >
                      Ubah
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => void remove(channel)}
                    >
                      Hapus
                    </Button>
                  </div>
                )}
              </li>
            ))}
        </ul>
      ) : (
        <p>{channelCopy.empty}</p>
      )}
      <ChannelForm
        open={formOpen}
        channel={editing}
        onOpenChange={setFormOpen}
        onSaved={() => setMessage('Saluran tersimpan.')}
      />
    </section>
  );
}
