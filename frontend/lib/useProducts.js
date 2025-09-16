// lib/useProducts.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchJSON } from './api';
import { getCache, setCache } from './cache';

export default function useProducts({ cacheKey = 'catalog_products_v1', ttlMs = 5 * 60 * 1000 } = {}) {
  const [items, setItems] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cancelRef = useRef(false);

  // filters
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState('price-asc');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  // cache-first
  useEffect(() => {
    const cached = getCache(cacheKey);
    if (cached?.items?.length) {
      setItems(cached.items);
      setCategories(cached.categories || []);
      setLoading(false);
    }
  }, [cacheKey]);

  async function refresh() {
    setError(null);
    try {
      const [prodsResp, catsResp] = await Promise.all([
        fetchJSON('/products'),
        fetchJSON('/products/categories').catch(() => ({ categories: [] })),
      ]);
      if (cancelRef.current) return;
      const prods = (prodsResp?.items || prodsResp || []).filter(Boolean);
      const cats = Array.from(new Set([
        ...(catsResp?.categories || []),
        ...prods.map(p => p.category).filter(Boolean)
      ])).sort();
      setCache(cacheKey, { items: prods, categories: cats }, ttlMs);
      setItems(prods);
      setCategories(cats);
    } catch (e) {
      if (!items) setError('שגיאה בטעינת מוצרים. נסה שוב בעוד רגע.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cancelRef.current = false;
    refresh();
    return () => { cancelRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (cat) list = list.filter(p => (p.category || '') === cat);
    if (priceMin) list = list.filter(p => (p.price ?? 0) >= Number(priceMin));
    if (priceMax) list = list.filter(p => (p.price ?? 0) <= Number(priceMax));
    if (sort === 'price-asc') list.sort((a,b)=>(a.price ?? 0)-(b.price ?? 0));
    if (sort === 'price-desc') list.sort((a,b)=>(b.price ?? 0)-(a.price ?? 0));
    return list;
  }, [items, q, cat, sort, priceMin, priceMax]);

  function clearFilters() {
    setQ(''); setCat(''); setSort('price-asc'); setPriceMin(''); setPriceMax('');
  }

  return {
    items: filtered, categories, loading, error,
    // filters + actions
    q, setQ, cat, setCat, sort, setSort, priceMin, setPriceMin, priceMax, setPriceMax, clearFilters,
    // raw
    allItems: items
  };
}
