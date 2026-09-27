import { SegmentedSlider } from '@takaran/ui';
import type { ChannelRow } from '../../../db/schema';

interface SliderPanelProps {
  targetMarginBp: number;
  channels: ChannelRow[];
  selectedChannelId: string;
  onChannelChange: (id: string) => void;
  laborMinutesPerBatch: number;
  onTargetMarginChange: (value: number) => void;
  onLaborMinutesChange: (value: number) => void;
}

const marginStops = [10, 20, 30, 40, 50, 60, 70].map((percent) => ({
  value: percent * 100,
  label: `${percent}%`,
}));
const laborStops = [30, 60, 90, 120, 180, 240].map((minutes, index) => ({
  value: minutes,
  label: ['0,5', '1', '1,5', '2', '3', '4'][index] ?? `${minutes / 60}`,
}));

export function SliderPanel({
  laborMinutesPerBatch,
  onLaborMinutesChange,
  onTargetMarginChange,
  targetMarginBp,
  channels,
  selectedChannelId,
  onChannelChange,
}: SliderPanelProps) {
  const selectedIndex = Math.max(
    0,
    channels.findIndex((channel) => channel.id === selectedChannelId),
  );
  return (
    <section
      aria-label="Atur target untung dan waktu kerja"
      className="calculator-sliders"
    >
      {channels.length > 1 ? (
        <SegmentedSlider
          label="Saluran jual"
          stops={channels.map((channel, index) => ({
            value: index,
            label: channel.name,
          }))}
          value={selectedIndex}
          onChange={(index) => {
            const channel = channels[Math.round(index)];
            if (channel) onChannelChange(channel.id);
          }}
          formatValueText={(index) =>
            channels[Math.round(index)]?.name ?? 'Saluran jual'
          }
        />
      ) : null}
      <SegmentedSlider
        allowCustom
        customRange={[100, 9000]}
        customScale={100}
        formatValueText={(value) =>
          `${new Intl.NumberFormat('id-ID').format(value / 100)} persen`
        }
        label="Target untung"
        onChange={onTargetMarginChange}
        stops={marginStops}
        value={targetMarginBp}
      />
      <SegmentedSlider
        allowCustom
        customRange={[0, 240]}
        formatValueText={(value) =>
          `${new Intl.NumberFormat('id-ID').format(value / 60)} jam kerja per adonan`
        }
        label="Jam kerja per adonan"
        onChange={onLaborMinutesChange}
        stops={laborStops}
        value={laborMinutesPerBatch}
      />
    </section>
  );
}
