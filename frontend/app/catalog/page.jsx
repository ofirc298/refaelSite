'use client';
import { useCatalogData } from '../../lib/useCatalogData';

export default function CatalogPage() {
  const {
    visible, categories, loading, error,
    q, setQ, cat, setCat, sort, setSort,
  } = useCatalogData();

  return (
    <main dir="rtl">
      <h1>קטלוג מוצרים</h1>

      {/* Filters – שומרים על HTML נקי כדי לא לגעת בעיצוב הקיים */}
      <div className="filters">
        <input
          placeholder="חיפוש לפי שם / תיאור…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="price-asc">מחיר ↑ (נמוך→גבוה)</option>
          <option value="price-desc">מחיר ↓ (גבוה→נמוך)</option>
        </select>
        <select value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">כל הקטגוריות</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Grid – בלי מחלקות חדשות. אם יש לך CSS קיים לגריד/כרטיסים הוא יישאר */}
      {loading && <div className="loading">טוען מוצרים…</div>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <div className="grid">
          {visible.map(p => (
            <article key={p.id || p._id || p.sku || p.title} className="card">
              {p.image || p.imgUrl ? (
                <img
                  src={p.image || p.imgUrl}
                  alt={p.title || p.name}
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <h3>{p.title || p.name}</h3>
              {p.category && <div className="cat">קטגוריה: {p.category}</div>}
              <div className="price">{typeof p.price === 'number' ? `${p.price} ₪` : p.price}</div>
            </article>
          ))}
          {visible.length === 0 && <div className="empty">לא נמצאו מוצרים</div>}
        </div>
      )}
    </main>
  );
}
