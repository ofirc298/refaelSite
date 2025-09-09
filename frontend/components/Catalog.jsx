'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { fetchJSON } from '../lib/api'

export default function Catalog() {
  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [filter, setFilter] = useState({ q: '', category: '', min: '', max: '', sort: 'price_asc' })
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const [{ items: prods }, catsResp] = await Promise.all([
          fetchJSON('/products'),
          fetchJSON('/products/categories').catch(() => ({ categories: [] }))
        ])
        const active = (prods || []).filter(p => !!p.inStock)
        setItems(active)
        const uniq = Array.from(new Set([...(catsResp?.categories || []), ...active.map(p => p.category).filter(Boolean)])).sort()
        setCats(uniq)
      } catch { setMsg('שגיאה בטעינת מוצרים') }
    })()
  }, [])

  const view = useMemo(() => {
    let v = items.slice()
    if (filter.q) {
      const q = filter.q.trim().toLowerCase()
      v = v.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        String(p.id || '').toLowerCase().includes(q)
      )
    }
    if (filter.category) v = v.filter(p => p.category === filter.category)
    const min = Number(filter.min || 0)
    const hasMin = filter.min !== '' && !Number.isNaN(min)
    const max = Number(filter.max || 0)
    const hasMax = filter.max !== '' && !Number.isNaN(max)
    if (hasMin) v = v.filter(p => Number(p.price || 0) >= min)
    if (hasMax) v = v.filter(p => Number(p.price || 0) <= max)
    switch (filter.sort) {
      case 'price_desc': v.sort((a, b) => Number(b.price || 0) - Number(a.price || 0)); break
      case 'alpha': v.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'he')); break
      default: v.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }
    return v
  }, [items, filter])

  function addToCart(p) {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const idx = cart.findIndex(x => x.id === p.id)
      if (idx >= 0) { cart[idx].qty = Number(cart[idx].qty || 0) + 1 }
      else { cart.push({ id: p.id, title: p.title, price: Number(p.price || 0), image: p.image || '', qty: 1 }) }
      localStorage.setItem('cart', JSON.stringify(cart))
      localStorage.setItem('cart_ping', String(Date.now()))
      window.dispatchEvent?.(new Event('cart_add'))
      showToast('המוצר נוסף לעגלה')
    } catch { }
  }
  function showToast(t) { setMsg(t); clearTimeout(window.__toastTimer); window.__toastTimer = setTimeout(() => setMsg(null), 1200) }

  return (
    <div dir="rtl" className="wrap">
      <aside className="filters">
        <h3>סינון</h3>

        <label className="frow">
          <span>חיפוש</span>
          <input
            placeholder="שם / תיאור / מזהה…"
            value={filter.q}
            onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
          />
        </label>

        <label className="frow">
          <span>מיון</span>
          <select
            value={filter.sort}
            onChange={e => setFilter(f => ({ ...f, sort: e.target.value }))}
          >
            <option value="price_asc">מחיר ↑ (נמוך→גבוה)</option>
            <option value="price_desc">מחיר ↓ (גבוה→נמוך)</option>
            <option value="alpha">א"ב</option>
          </select>
        </label>

        <label className="frow">
          <span>קטגוריה</span>
          <select
            value={filter.category}
            onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
          >
            <option value="">הכל</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <div className="grid2">
          <label className="frow">
            <span>מינ׳ מחיר</span>
            <input type="number" value={filter.min} onChange={e => setFilter(f => ({ ...f, min: e.target.value }))} />
          </label>
          <label className="frow">
            <span>מקס׳ מחיר</span>
            <input type="number" value={filter.max} onChange={e => setFilter(f => ({ ...f, max: e.target.value }))} />
          </label>
        </div>

        <div className="btnrow">
          <button className="btn" onClick={() => setFilter({ q: '', category: '', min: '', max: '', sort: 'price_asc' })}>ניקוי</button>
        </div>
      </aside>

      <section className="cards">
        {view.length === 0 && <div className="empty">לא נמצאו מוצרים</div>}
        {view.map(p => (
          <article key={p.id} className="card">
            <Link href={`/catalog/${encodeURIComponent(p.id)}`} className="thumbLink">
              <div className="thumb">{p.image ? <img src={p.image} alt="" /> : <div className="noimg">תמונה</div>}</div>
            </Link>
            <div className="body">
              <div className="titleRow">
                <Link href={`/catalog/${encodeURIComponent(p.id)}`} className="titleLink">
                  <h4 className="title">{p.title}</h4>
                </Link>
                <span className="price">₪ {Number(p.price || 0)}</span>
              </div>
              <div className="meta">
                <span className="badge">{p.category || 'ללא קטגוריה'}</span>
              </div>
              {p.description && <p className="desc">{p.description}</p>}
            </div>
            <div className="actions">
              <Link href={`/catalog/${encodeURIComponent(p.id)}`} className="btn">לפרטים</Link>
              <button className="btn primary" onClick={() => addToCart(p)}>הוסף לעגלה</button>
            </div>
          </article>
        ))}
      </section>

      {msg && <div className="toast" role="status" aria-live="polite">{msg}</div>}
      {/* {true && <div className="toast" role="status" aria-live="polite">{msg}</div>} */}

      <style jsx>{`
        .wrap { display:grid; grid-template-columns: 300px 1fr; gap:16px; padding:16px; align-items:start; }
        @media (max-width: 980px){ .wrap { grid-template-columns: 1fr; } }
        .filters { position:sticky; top:12px; background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:14px; box-shadow:0 1px 2px rgba(0,0,0,.02); }
        .filters h3 { margin:0 0 10px; font-size:18px; }
        .frow { display:flex; flex-direction:column; gap:6px; margin-bottom:10px; }
        .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        input, select { border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; font-size:14px; }
        .btnrow { display:flex; gap:8px; margin-top:6px; }
        .btn { border:1px solid #e5e7eb; background:#fff; border-radius:10px; padding:8px 12px; cursor:pointer; font-size:14px; text-decoration:none; display:inline-flex; align-items:center; }
        .btn.primary { background:#2563eb; color:#fff; border-color:#2563eb; }
        .cards { display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:14px; }
        .card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; display:flex; flex-direction:column; gap:10px; padding:10px; min-height: 340px; }
        .thumbLink { display:block; }
        .thumb { height:160px; border-radius:12px; overflow:hidden; background:#f3f4f6; border:1px solid #e5e7eb; }
        .thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .noimg { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#94a3b8; }
        .titleRow { display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .titleLink { text-decoration:none; color:inherit; }
        .title { margin:0; font-size:16px; font-weight:700; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .price { font-weight:600; }
        .meta { display:flex; gap:6px; font-size:13px; color:#475569; flex-wrap:wrap; }
        .badge { background:#f8fafc; border:1px solid #e5e7eb; border-radius:999px; padding:2px 8px; }
        .desc { font-size:13px; color:#475569; margin:4px 0 0; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; }
        .actions { margin-top:auto; display:flex; justify-content:space-between; gap:8px; }
        .toast { position: fixed; bottom: 16px; left: 16px; max-width: 200px;max-height: 50px; padding: 8px 10px; background: rgba(17,24,39,.95); color:#fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.2); z-index: 1000; pointer-events: none; font-size: 20px;text-align:center; right: auto; top: auto;width: 200px;height: 50px; }
      `}</style>
    </div>
  )
}
