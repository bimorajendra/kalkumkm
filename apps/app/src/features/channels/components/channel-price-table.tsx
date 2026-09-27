import {
  actualMarginBp,
  CalcError,
  priceForChannel,
  type RecipeResult,
} from '@takaran/calc';
import { formatPercent, formatRupiah } from '@takaran/ui';
import type { ChannelRow } from '../../../db/schema';
import { channelCopy } from '../copy';

interface ChannelPriceTableProps {
  channels: ChannelRow[];
  hpp: RecipeResult['hpp'];
  targetMarginBp: number;
  currentPrice: number | null;
  roundingStep: number;
  compact?: boolean;
}

export function ChannelPriceTable({
  channels,
  hpp,
  targetMarginBp,
  currentPrice,
  roundingStep,
  compact = false,
}: ChannelPriceTableProps) {
  const direct =
    channels.find((channel) => channel.name === 'Langsung') ??
    channels.find(
      (channel) => channel.kind === 'commission' && channel.rateBp === 0,
    );
  if (!channels.length) return null;
  if (hpp.lte(0) || !direct) {
    return (
      <section
        className={`channel-price-table${compact ? ' channel-price-table--compact' : ''}`}
        aria-labelledby={
          compact ? 'channel-table-title-mobile' : 'channel-table-title'
        }
      >
        <h2 id={compact ? 'channel-table-title-mobile' : 'channel-table-title'}>
          Harga per saluran
        </h2>
        <p className="channel-price-table__status">
          Isi bahan dan biaya untuk melihat harga.
        </p>
      </section>
    );
  }

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
    return (
      <section
        className={`channel-price-table${compact ? ' channel-price-table--compact' : ''}`}
        aria-labelledby={
          compact ? 'channel-table-title-mobile' : 'channel-table-title'
        }
      >
        <h2 id={compact ? 'channel-table-title-mobile' : 'channel-table-title'}>
          Harga per saluran
        </h2>
        <p className="channel-price-table__status">
          {channelCopy.commissionTooHigh}
        </p>
      </section>
    );
  }
  const retailPrice = currentPrice ?? directSuggested;
  const directId = direct.id;

  return (
    <section
      className={`channel-price-table${compact ? ' channel-price-table--compact' : ''}`}
      aria-labelledby={
        compact ? 'channel-table-title-mobile' : 'channel-table-title'
      }
    >
      <div className="channel-price-table__heading">
        <div>
          <h2
            id={compact ? 'channel-table-title-mobile' : 'channel-table-title'}
          >
            Harga per saluran
          </h2>
          {currentPrice === null &&
            channels.some((channel) => channel.kind === 'discount') && (
              <p>{channelCopy.missingRetail}</p>
            )}
        </div>
      </div>
      <div className="channel-price-table__scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Saluran</th>
              <th scope="col">Harga</th>
              <th scope="col">Margin dan status</th>
            </tr>
          </thead>
          <tbody>
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
                  channel.id === directId && currentPrice !== null
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
                return (
                  <tr key={channel.id}>
                    <th scope="row">
                      {channel.name}
                      <small>
                        {channel.kind === 'commission'
                          ? `Komisi ${channel.rateBp / 100}%`
                          : `Diskon ${channel.rateBp / 100}%`}
                      </small>
                    </th>
                    <td>{formatRupiah(price)}</td>
                    <td>
                      {formatPercent(margin)}
                      <small
                        className={
                          margin < targetMarginBp
                            ? 'channel-price-table__below'
                            : 'channel-price-table__above'
                        }
                      >
                        {margin < targetMarginBp
                          ? 'Di bawah target'
                          : 'Sesuai target'}
                      </small>
                    </td>
                  </tr>
                );
              } catch (error) {
                const status =
                  error instanceof CalcError && error.code === 'MARGIN_TOO_HIGH'
                    ? channelCopy.commissionTooHigh
                    : 'Harga belum bisa dihitung.';
                return (
                  <tr key={channel.id}>
                    <th scope="row">
                      {channel.name}
                      <small>
                        {channel.kind === 'commission'
                          ? `Komisi ${channel.rateBp / 100}%`
                          : `Diskon ${channel.rateBp / 100}%`}
                      </small>
                    </th>
                    <td colSpan={2}>
                      <span className="channel-price-table__status">
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
