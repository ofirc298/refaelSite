'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import ProductGrid from '@/components/ProductGrid';
import Preconnect from '@/components/Preconnect';
import { fetchJSON } from '@/lib/api';
import { getCache, setCache } from '@/lib/cache';

const CACHE_KEY = 'catalog_products_v1';

export default function CatalogPage() {
  const [items, setItems] = useState(null);     // full dataset
  const [visible, setVisible] = useState([]);   // progressively revealed items
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const revealTimer = useRef(null);

  // Filters
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState('price-asc');

  // 1) Instant cache-first
  useEffect(() => {
    const cached = getCache(CACHE_KEY);
    if (cached?.items?.length) {
      setItems(cached.items);
      setCategories(cached.categories || []);
      setLoading(false);
      progressiveReveal(cached.items);
    }
  }, []);

  // 2) Background refresh (SWR-like)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prodsResp, catsResp] = await Promise.all([
          fetchJSON('/products'),
          fetchJSON('/products/categories').catch(() => ({ categories: [] })),
        ]);
        if (cancelled) return;
        const prods = (prodsResp?.items || prodsResp || []).filter(Boolean);
        const cats = Array.from(new Set([
          ...(catsResp?.categories || []),
          ...prods.map(p => p.category).filter(Boolean)
        ])).sort();
        setCache(CACHE_KEY, { items: prods, categories: cats }, 5 * 60 * 1000);
        setItems(prods);
        setCategories(cats);
        setError(null);
        setLoading(false);
        progressiveReveal(prods);
      } catch (e) {
        if (cancelled) return;
        if (!items) setLoading(false);
        setError(items ? null : 'שגיאה בטעינת מוצרים. נסה שוב בעוד רגע.');
      }
    })();
    return () => { cancelled = true; if (revealTimer.current) cancelAnimationFrame(revealTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function progressiveReveal(source) {
    if (!source || !source.length) { setVisible([]); return; }
    let idx = 0;
    const batch = 16;
    const initial = source.slice(0, batch);
    setVisible(initial);
    const step = () => {
      idx += batch;
      if (idx >= source.length) return;
      startTransition(() => {
        setVisible(prev => prev.concat(source.slice(idx, idx + batch)));
      });
      revealTimer.current = requestIdleCallback(step, { timeout: 300 });
    };
    revealTimer.current = requestIdleCallback(step, { timeout: 300 });
  }

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
    if (cat) list = list.filter(p => (p.category || '') === cat);
    if (sort === 'price-asc') list.sort((a,b)=>(a.price ?? 0)-(b.price ?? 0));
    if (sort === 'price-desc') list.sort((a,b)=>(b.price ?? 0)-(a.price ?? 0));
    return list;
  }, [items, q, cat, sort]);

  useEffect(() => {
    if (!filtered) return;
    progressiveReveal(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 rtl text-right">
      <Preconnect apiBase={process.env.NEXT_PUBLIC_API} />
      <h1 className="text-2xl font-bold mb-4">קטלוג מוצרים</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <input className="md:col-span-2 border rounded-md px-3 py-2" placeholder="חיפוש לפי שם / תיאור…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="border rounded-md px-3 py-2" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="price-asc">מחיר ↑ (נמוך→גבוה)</option>
          <option value="price-desc">מחיר ↓ (גבוה→נמוך)</option>
        </select>
        <select className="border rounded-md px-3 py-2" value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">כל הקטגוריות</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <ProductGrid loading={loading && !visible?.length} error={error} items={visible} />
    </main>
  );
}
