'use client';
import useProducts from '../../lib/useProducts';

// This page keeps markup minimal and neutral to avoid CSS changes.
// Replace className values with your existing class names if needed.
// Layout: grid area for products (left) + sidebar filters (right, RTL).

export default function CatalogPage() {
  const {
    items, categories, loading, error,
    q, setQ, cat, setCat, sort, setSort, priceMin, setPriceMin, priceMax, setPriceMax, clearFilters,
  } = useProducts();

  return (
    <main dir="rtl" className="catalog-root">
      <h1 className="catalog-title">קטלוג מוצרים</h1>

      <div className="catalog-layout">
        {/* MAIN GRID */}
        <section className="catalog-grid">
          {loading && <div className="catalog-empty">טוען מוצרים…</div>}
          {error && <div className="catalog-error">{error}</div>}
          {!loading && !error && (!items || items.length === 0) && (
            <div className="catalog-empty">לא נמצאו מוצרים</div>
          )}
          {!loading && !error && items?.map((p) => (
            <article key={p.id || p._id || p.sku || p.title} className="product-card">
              {p.image || p.imgUrl ? (
                <img src={p.image || p.imgUrl} alt={p.title || p.name} loading="lazy" decoding="async" />
              ) : null}
              <h3 className="product-title">{p.title || p.name}</h3>
              {p.category && <div className="product-category">קטגוריה: {p.category}</div>}
              <div className="product-price">{typeof p.price === 'number' ? `${p.price} ₪` : p.price}</div>
            </article>
          ))}
        </section>

        {/* SIDEBAR FILTERS (on the right) */}
        <aside className="catalog-sidebar">
          <div className="filter-title">סינון</div>

          <div className="filter-block">
            <label>חיפוש</label>
            <input
              className="filter-input"
              placeholder="...תיאור / מחבר / שם"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>

          <div className="filter-block">
            <label>מיון</label>
            <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="price-asc">מחיר ↑ (נמוך→גבוה)</option>
              <option value="price-desc">מחיר ↓ (גבוה→נמוך)</option>
            </select>
          </div>

          <div className="filter-block">
            <label>קטגוריה</label>
            <select className="filter-select" value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">הכל</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="filter-block">
            <label>טווח מחיר</label>
            <div className="filter-price">
              <input className="filter-input" placeholder="מינ'" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
              <input className="filter-input" placeholder="מקס'" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
            </div>
          </div>

          <button type="button" className="filter-clear" onClick={clearFilters}>ניקוי</button>
        </aside>
      </div>
    </main>
  );
}
