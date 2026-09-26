import { SegmentedSlider } from '@takaran/ui';

interface SliderPanelProps {
  targetMarginBp: number;
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
}: SliderPanelProps) {
  return (
    <section
      aria-label="Atur target untung dan waktu kerja"
      className="calculator-sliders"
    >
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
