import * as SliderPrimitive from '@radix-ui/react-slider';
import { useId, useState } from 'react';

export interface SliderStop {
  value: number;
  label: string;
}

export interface SegmentedSliderProps {
  label: string;
  stops: SliderStop[];
  value: number;
  onChange: (value: number) => void;
  formatValueText: (value: number) => string;
  allowCustom?: boolean;
  customRange?: readonly [number, number];
  customScale?: number;
}

function nearestStopIndex(stops: SliderStop[], value: number): number {
  return stops.reduce((nearest, stop, index) => {
    const current = stops[nearest];
    return current === undefined ||
      Math.abs(stop.value - value) < Math.abs(current.value - value)
      ? index
      : nearest;
  }, 0);
}

export function SegmentedSlider({
  allowCustom = false,
  customRange,
  customScale = 1,
  formatValueText,
  label,
  onChange,
  stops,
  value,
}: SegmentedSliderProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState(String(value / customScale));
  const id = useId();
  const minimum = customRange?.[0] ?? stops[0]?.value;
  const maximum = customRange?.[1] ?? stops.at(-1)?.value;

  if (
    stops.length < 2 ||
    stops.some(
      (stop, index) =>
        !Number.isFinite(stop.value) ||
        !stop.label ||
        (index > 0 &&
          stop.value <= (stops[index - 1]?.value ?? Number.NEGATIVE_INFINITY)),
    )
  ) {
    throw new RangeError(
      'Slider memerlukan dua titik berhenti berurutan yang valid.',
    );
  }
  const selectedIndex = nearestStopIndex(stops, value);
  const customNumber =
    customValue.trim() === '' ? Number.NaN : Number(customValue);
  const internalCustomNumber = customNumber * customScale;
  const customInvalid =
    !Number.isFinite(internalCustomNumber) ||
    !Number.isSafeInteger(internalCustomNumber) ||
    minimum === undefined ||
    maximum === undefined ||
    internalCustomNumber < minimum ||
    internalCustomNumber > maximum;

  function updateCustomValue(rawValue: string, numericValue: number) {
    setCustomValue(rawValue);
    if (
      Number.isFinite(numericValue) &&
      Number.isSafeInteger(numericValue * customScale) &&
      minimum !== undefined &&
      maximum !== undefined &&
      numericValue * customScale >= minimum &&
      numericValue * customScale <= maximum
    ) {
      onChange(numericValue * customScale);
    }
  }

  return (
    <fieldset className="takaran-slider">
      <legend className="takaran-slider__legend">{label}</legend>
      <SliderPrimitive.Root
        className="takaran-slider__root"
        max={stops.length - 1}
        min={0}
        onValueChange={(indices) => {
          const stop = stops[indices[0] ?? 0];
          if (stop) {
            setCustomValue(String(stop.value / customScale));
            onChange(stop.value);
          }
        }}
        step={1}
        value={[selectedIndex]}
      >
        <SliderPrimitive.Track className="takaran-slider__track">
          <SliderPrimitive.Range className="takaran-slider__range" />
          {stops.slice(0, -1).map((stop, index) => (
            <span
              aria-hidden="true"
              className="takaran-slider__marker"
              key={`${stop.value}-${index}`}
            />
          ))}
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={label}
          aria-valuetext={formatValueText(value)}
          className="takaran-slider__thumb"
        />
      </SliderPrimitive.Root>
      <div aria-hidden="true" className="takaran-slider__stops">
        {stops.map((stop) => (
          <span
            className={stop.value === value ? 'is-active' : ''}
            key={`${stop.value}-${stop.label}`}
          >
            {stop.label}
          </span>
        ))}
      </div>
      {allowCustom ? (
        <div className="takaran-slider__custom">
          <button
            aria-expanded={customOpen}
            aria-controls={`${id}-input`}
            className="takaran-slider__custom-toggle"
            onClick={() => {
              setCustomValue(String(value / customScale));
              setCustomOpen((open) => !open);
            }}
            type="button"
          >
            {customOpen ? 'Tutup input angka' : 'Ketik angka'}
          </button>
          {customOpen ? (
            <label
              className="takaran-slider__input-label"
              htmlFor={`${id}-input`}
            >
              Angka khusus
              <input
                aria-invalid={customInvalid}
                aria-describedby={customInvalid ? `${id}-error` : undefined}
                id={`${id}-input`}
                inputMode="decimal"
                max={maximum === undefined ? undefined : maximum / customScale}
                min={minimum === undefined ? undefined : minimum / customScale}
                onChange={(event) =>
                  updateCustomValue(
                    event.currentTarget.value,
                    event.currentTarget.valueAsNumber,
                  )
                }
                type="number"
                step={customScale === 1 ? 1 : 0.01}
                value={customValue}
              />
              {customInvalid ? (
                <span className="takaran-slider__error" id={`${id}-error`}>
                  Masukkan angka dari{' '}
                  {minimum === undefined ? '' : minimum / customScale} sampai{' '}
                  {maximum === undefined ? '' : maximum / customScale}.
                </span>
              ) : null}
            </label>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}
