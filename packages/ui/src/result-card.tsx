/// <reference path="./big-js.d.ts" />
import type Big from 'big.js';
import type { ReactNode } from 'react';
import { formatPercent, formatRupiah } from './format';

export interface ResultCardProps {
  tab?: ReactNode;
  value: number | Big;
  label: string;
  secondaryValue?: number | Big | null;
  secondaryLabel?: string;
  marginBp?: number;
  markupBp?: number;
  visual?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  onDetails?: () => void;
}

export function ResultCard({
  actions,
  compact = false,
  label,
  marginBp,
  markupBp,
  onDetails,
  secondaryLabel,
  secondaryValue,
  tab,
  value,
  visual,
}: ResultCardProps) {
  return (
    <section
      className={`takaran-result-card${compact ? ' takaran-result-card--compact' : ''}${visual && !compact ? ' takaran-result-card--with-visual' : ''}`}
    >
      {tab ? <div className="takaran-result-card__tab">{tab}</div> : null}
      <p className="takaran-result-card__value">{formatRupiah(value)}</p>
      <p className="takaran-result-card__label">{label}</p>
      {compact ? (
        marginBp !== undefined ? (
          <p className="takaran-result-card__compact-margin">
            Margin {formatPercent(marginBp)}
          </p>
        ) : null
      ) : (
        <>
          {secondaryValue !== undefined && secondaryValue !== null ? (
            <div className="takaran-result-card__secondary">
              <p>{formatRupiah(secondaryValue)}</p>
              {secondaryLabel ? <span>{secondaryLabel}</span> : null}
            </div>
          ) : null}
          {marginBp !== undefined || markupBp !== undefined ? (
            <p className="takaran-result-card__metrics">
              {marginBp !== undefined
                ? `Margin ${formatPercent(marginBp)}`
                : null}
              {marginBp !== undefined && markupBp !== undefined ? ' · ' : null}
              {markupBp !== undefined
                ? `markup ${formatPercent(markupBp)}`
                : null}
            </p>
          ) : null}
          {visual ? (
            <div className="takaran-result-card__visual">{visual}</div>
          ) : null}
          {actions ? (
            <div className="takaran-result-card__actions">{actions}</div>
          ) : null}
        </>
      )}
      {compact && onDetails ? (
        <button
          className="takaran-result-card__details"
          onClick={onDetails}
          type="button"
        >
          Detail
        </button>
      ) : null}
    </section>
  );
}
