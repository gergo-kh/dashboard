import { EmptyState } from "@/components/ui/state";
import type { AttentionProduct } from "@/types/overview";

type AttentionProductsProps = Readonly<{
  products: AttentionProduct[];
}>;

export function AttentionProducts({ products }: AttentionProductsProps) {
  return (
    <section className="kh-card kh-products-card" aria-labelledby="attention-products-title">
      <div className="kh-card-header-row">
        <div>
          <p className="kh-section-kicker">Merchant Center</p>
          <h2 id="attention-products-title">Figyelmet igénylő termékek (TOP 10)</h2>
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState
          description="Most nincs ügyféloldalon megjeleníthető, figyelmet igénylő Merchant termék."
          title="Nincs figyelmet igénylő termék"
        />
      ) : (
        <div className="kh-product-list" role="table" aria-label="Figyelmet igénylő termékek">
          <div className="kh-product-row kh-product-head" role="row">
            <span role="columnheader">Termék</span>
            <span role="columnheader">Költés</span>
            <span role="columnheader">Bevétel</span>
            <span role="columnheader">ROAS</span>
            <span role="columnheader">Probléma</span>
            <span role="columnheader">Részletek</span>
          </div>
          {products.slice(0, 10).map((product) => (
            <div className="kh-product-row" key={product.id} role="row">
              <span role="cell">
                <strong>{product.name}</strong>
                <small>{product.sku}</small>
              </span>
              <span role="cell">{product.spendLabel}</span>
              <span role="cell">{product.revenueLabel}</span>
              <span role="cell">{product.roasLabel}</span>
              <span role="cell">
                <mark>{product.issueLabel}</mark>
              </span>
              <span role="cell">{product.detail}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
