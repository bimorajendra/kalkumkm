import { commonIngredients } from '../common-ingredients';

export function CommonIngredientPicker({ id }: { id: string }) {
  return (
    <datalist id={id}>
      {commonIngredients.map((item) => (
        <option key={item.name} value={item.name} />
      ))}
    </datalist>
  );
}
