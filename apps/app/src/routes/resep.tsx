import { RecipeList } from '../features/recipes/components/recipe-list';
import { recipeCopy } from '../features/recipes/copy';

export function ResepRoute() {
  return (
    <main className="page recipe-page">
      <section aria-labelledby="page-title">
        <div className="ingredient-page-heading">
          <div>
            <div className="eyebrow">DAPURMU</div>
            <h1 id="page-title">{recipeCopy.title}</h1>
          </div>
        </div>
        <RecipeList />
      </section>
    </main>
  );
}
