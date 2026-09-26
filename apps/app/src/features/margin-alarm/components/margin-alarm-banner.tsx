import { Banner } from '@takaran/ui';
import { marginAlarmCopy } from '../copy';

export function MarginAlarmBanner({
  count,
  onDismiss,
  onView,
}: {
  count: number;
  onDismiss: () => void;
  onView: () => void;
}) {
  return (
    <Banner dismissLabel={marginAlarmCopy.dismiss} onDismiss={onDismiss}>
      <span>
        {count}{' '}
        {count === 1 ? marginAlarmCopy.singular : marginAlarmCopy.plural}{' '}
      </span>
      <button
        className="text-button margin-alarm__open"
        onClick={onView}
        type="button"
      >
        Lihat menu
      </button>
    </Banner>
  );
}
