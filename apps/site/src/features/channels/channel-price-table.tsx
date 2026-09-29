'use client';

import {
  actualMarginBp,
  CalcError,
  priceForChannel,
  type RecipeResult,
} from '@takaran/calc';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ChannelRow } from '@/domain/types';
import { channelCopy } from './copy';

function Shell({
  id,
  note,
  children,
}: {
  id: string;
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-2 rounded-[20px] border border-line bg-surface p-5"
    >
      <h2 id={id} className="text-xl font-semibold">
        Harga per saluran
      </h2>
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      {children}
    </section>
  );
}

function ChannelName({ channel }: { channel: ChannelRow }) {
  return (
    <TableHead scope="row" className="h-auto py-3 font-medium text-foreground">
      {channel.name}
      <small className="block font-normal text-muted-foreground">
        {rateText(channel)}
      </small>
    </TableHead>
  );
}

const rateText = (channel: ChannelRow) =>
  `${channel.kind === 'commission' ? 'Komisi' : 'Diskon'} ${channel.rateBp / 100}%`;

export function ChannelPriceTable({
  channels,
  hpp,
  targetMarginBp,
  currentPrice,
  roundingStep,
  idSuffix = '',
}: {
  channels: ChannelRow[];
  hpp: RecipeResult['hpp'];
  targetMarginBp: number;
  currentPrice: number | null;
  roundingStep: number;
  idSuffix?: string;
}) {
  const id = `channel-table-title${idSuffix}`;
  const direct =
    channels.find((channel) => channel.name === 'Langsung') ??
    channels.find(
      (channel) => channel.kind === 'commission' && channel.rateBp === 0,
    );
  if (!channels.length) return null;
  if (hpp.lte(0) || !direct)
    return <Shell id={id} note="Isi bahan dan biaya untuk melihat harga." />;

  let directSuggested: number;
  try {
    directSuggested = priceForChannel(
      hpp,
      targetMarginBp,
      null,
      direct,
      roundingStep,
    ).price;
  } catch {
    return <Shell id={id} note={channelCopy.commissionTooHigh} />;
  }
  const retailPrice = currentPrice ?? directSuggested;

  return (
    <Shell
      id={id}
      note={
        currentPrice === null &&
        channels.some((channel) => channel.kind === 'discount')
          ? channelCopy.missingRetail
          : undefined
      }
    >
      <div className="min-w-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Saluran</TableHead>
              <TableHead scope="col">Harga</TableHead>
              <TableHead scope="col">Margin dan status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map((channel) => {
              try {
                const calculated = priceForChannel(
                  hpp,
                  targetMarginBp,
                  retailPrice,
                  channel,
                  roundingStep,
                );
                const price =
                  channel.id === direct.id && currentPrice !== null
                    ? currentPrice
                    : calculated.price;
                const margin =
                  price === calculated.price
                    ? calculated.marginBp
                    : actualMarginBp(
                        price,
                        hpp,
                        channel.kind === 'commission' ? channel.rateBp : 0,
                      );
                const below = margin < targetMarginBp;
                return (
                  <TableRow key={channel.id}>
                    <ChannelName channel={channel} />
                    <TableCell className="tabular-nums">
                      {formatRupiah(price)}
                    </TableCell>
                    <TableCell>
                      {formatPercent(margin)}
                      <small
                        className={`block ${below ? 'text-destructive' : 'text-success'}`}
                      >
                        {below ? 'Di bawah target' : 'Sesuai target'}
                      </small>
                    </TableCell>
                  </TableRow>
                );
              } catch (error) {
                return (
                  <TableRow key={channel.id}>
                    <ChannelName channel={channel} />
                    <TableCell colSpan={2} className="text-muted-foreground">
                      {error instanceof CalcError &&
                      error.code === 'MARGIN_TOO_HIGH'
                        ? channelCopy.commissionTooHigh
                        : 'Harga belum bisa dihitung.'}
                    </TableCell>
                  </TableRow>
                );
              }
            })}
          </TableBody>
        </Table>
      </div>
    </Shell>
  );
}
