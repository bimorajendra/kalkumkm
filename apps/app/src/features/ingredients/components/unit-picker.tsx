import type { BaseUnit } from '@takaran/calc';
import { ingredientCopy } from '../copy';

interface UnitPickerProps {
  buyUnit: string;
  customName: string;
  customQty: string;
  customBase: BaseUnit;
  errors: Record<string, string>;
  onChange: (
    field: 'buyUnit' | 'customName' | 'customQty' | 'customBase',
    value: string,
  ) => void;
}

export function UnitPicker(props: UnitPickerProps) {
  const custom = props.buyUnit === 'bungkus' || props.buyUnit === 'custom';
  return (
    <fieldset className="ingredient-fieldset">
      <legend>{ingredientCopy.unitLabel}</legend>
      <label className="ingredient-label" htmlFor="ingredient-unit">
        Satuan
      </label>
      <select
        id="ingredient-unit"
        value={props.buyUnit}
        onChange={(event) => props.onChange('buyUnit', event.target.value)}
      >
        <option value="kg">kg</option>
        <option value="g">g</option>
        <option value="l">l</option>
        <option value="ml">ml</option>
        <option value="butir">butir</option>
        <option value="pcs">pcs</option>
        <option value="bungkus">bungkus</option>
        <option value="custom">{ingredientCopy.customUnit}</option>
      </select>
      {props.errors.buyUnit && (
        <p className="field-error">{props.errors.buyUnit}</p>
      )}
      {custom && (
        <div className="custom-unit-fields">
          {props.buyUnit === 'custom' && (
            <label
              className="ingredient-label"
              htmlFor="ingredient-custom-name"
            >
              Nama satuan
              <input
                id="ingredient-custom-name"
                autoComplete="off"
                maxLength={24}
                value={props.customName}
                onChange={(event) =>
                  props.onChange('customName', event.target.value)
                }
              />
              {props.errors.customName && (
                <span className="field-error">{props.errors.customName}</span>
              )}
            </label>
          )}
          <label className="ingredient-label" htmlFor="ingredient-custom-qty">
            Isi dalam satuan dasar
            <input
              id="ingredient-custom-qty"
              inputMode="decimal"
              value={props.customQty}
              onChange={(event) =>
                props.onChange('customQty', event.target.value)
              }
            />
            {props.errors.customQty && (
              <span className="field-error">{props.errors.customQty}</span>
            )}
          </label>
          <label className="ingredient-label" htmlFor="ingredient-custom-base">
            Satuan dasar
            <select
              id="ingredient-custom-base"
              value={props.customBase}
              onChange={(event) =>
                props.onChange('customBase', event.target.value)
              }
            >
              <option value="g">gram (g)</option>
              <option value="ml">mililiter (ml)</option>
              <option value="pcs">butir atau pcs</option>
            </select>
          </label>
        </div>
      )}
    </fieldset>
  );
}
