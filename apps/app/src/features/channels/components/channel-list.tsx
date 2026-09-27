import { useState } from 'react';
import type { ChannelRow } from '../../../db/schema';
import { channelCopy } from '../copy';
import { deleteChannel, useChannels } from '../repository';
import { ChannelForm } from './channel-form';

export function ChannelList() {
  const channels = useChannels();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ChannelRow>();
  const [message, setMessage] = useState('');

  function add() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function edit(channel: ChannelRow) {
    setEditing(channel);
    setFormOpen(true);
  }
  async function remove(channel: ChannelRow) {
    if (!window.confirm(`${channelCopy.deleteConfirm} ${channel.name}`)) return;
    try {
      await deleteChannel(channel.id);
      setMessage('Saluran dihapus.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : channelCopy.saveError,
      );
    }
  }

  return (
    <section
      className="settings-card channel-settings"
      aria-labelledby="channel-settings-title"
    >
      <div className="channel-settings__heading">
        <div>
          <h2 id="channel-settings-title">{channelCopy.title}</h2>
          <p>{channelCopy.description}</p>
        </div>
        <button className="button button-primary" type="button" onClick={add}>
          {channelCopy.add}
        </button>
      </div>
      {message && (
        <output className="channel-settings__message">{message}</output>
      )}
      {channels?.length ? (
        <ul className="channel-list">
          {channels.map((channel) => (
            <li key={channel.id}>
              <div>
                <strong>{channel.name}</strong>
                <span>
                  {channel.name === 'Langsung'
                    ? 'Harga langsung'
                    : channel.kind === 'commission'
                      ? `Komisi ${channel.rateBp / 100}%`
                      : `Diskon ${channel.rateBp / 100}%`}
                </span>
              </div>
              {channel.name === 'Langsung' ? (
                <span className="channel-list__fixed">Utama</span>
              ) : (
                <div className="channel-list__actions">
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => edit(channel)}
                  >
                    Ubah
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => void remove(channel)}
                  >
                    Hapus
                  </button>
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
