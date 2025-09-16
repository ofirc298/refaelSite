'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductGrid from '@/components/ProductGrid';
import { fetchJSON } from '@/lib/api';

export default function CatalogPage() {
  const [items, setItems] = useState(null); // null = not loaded yet
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters (simple example; keep existing UI if you have one)
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState('price-asc');

  // Warm up backend (fire & forget)
  useEffect(() => {
    fetchJSON('/health').catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [prodsResp, catsResp] = await Promise.all([
          fetchJSON('/products'),
          fetchJSON('/products/categories').catch(() => ({ categories: [] }))
        ]);
        if (cancelled) return;
        const prods = (prodsResp?.items || prodsResp || []).filter(Boolean);
        setItems(prods);
        const cats = Array.from(new Set([
          ...(catsResp?.categories || []),
          ...prods.map(p => p.category).filter(Boolean)
        ])).sort();
        setCategories(cats);
      } catch (e) {
        if (cancelled) return;
        setError('שגיאה בטעינת מוצרים. נסה לרענן עוד רגע.');
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    let list = [...items];
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter(p =>
        (p.title || p.name || '').toLowerCase().includes(ql) ||
        (p.description || '').toLowerCase().includes(ql)
      );
    }
    if (cat) {
      list = list.filter(p => (p.category || '') === cat);
    }
    if (sort === 'price-asc') list.sort((a,b)=>(a.price ?? 0)-(b.price ?? 0));
    if (sort === 'price-desc') list.sort((a,b)=>(b.price ?? 0)-(a.price ?? 0));
    return list;
  }, [items, q, cat, sort]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 rtl text-right">
      <h1 className="text-2xl font-bold mb-4">קטלוג מוצרים</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          className="md:col-span-2 border rounded-md px-3 py-2"
          placeholder="חיפוש לפי שם / תיאור…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select
          className="border rounded-md px-3 py-2"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="price-asc">מחיר ↑ (נמוך→גבוה)</option>
          <option value="price-desc">מחיר ↓ (גבוה→נמוך)</option>
        </select>
        <select
          className="border rounded-md px-3 py-2"
          value={cat}
          onChange={e => setCat(e.target.value)}
        >
          <option value="">כל הקטגוריות</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <ProductGrid loading={loading} error={error} items={filtered} />
    </main>
  );
}
