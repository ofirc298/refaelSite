// lib/useCatalogData.js
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { fetchJSON } from './api';
import { getCache, setCache } from './cache';

export function useCatalogData({ cacheKey = 'catalog_products_v1' } = {}) {
  const [items, setItems] = useState(null);
  const [visible, setVisible] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const revealTimer = useRef(null);

  // filters (exposed state)
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState('price-asc');

  // cache-first
  useEffect(() => {
    const cached = getCache(cacheKey);
    if (cached?.items?.length) {
      setItems(cached.items);
      setCategories(cached.categories || []);
      setLoading(false);
      progressiveReveal(cached.items);
    }
  }, [cacheKey]);

  // refresh
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
        setCache(cacheKey, { items: prods, categories: cats }, 5 * 60 * 1000);
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

  // sync visible on filters
  useEffect(() => {
    if (!filtered) return;
    progressiveReveal(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  return {
    // data
    items, visible, categories, loading, error,
    // filters api
    q, setQ, cat, setCat, sort, setSort,
  };
}
