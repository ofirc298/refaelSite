"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API, fetchJSON, normalizeImage } from "../../../lib/api";


const looksLikeProduct = (x) =>
  x && typeof x === "object" && !Array.isArray(x) &&
  "id" in x && (("title" in x) || ("price" in x) || ("image" in x));

export default function ProductClient({ id }) {
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!id) return;
    let off = false;
    (async () => {
      setLoading(true);
      try {
        let prod = null;
        try {
          const data = await fetchJSON(`/products/${encodeURIComponent(id)}`);
          const maybe = data?.product ?? data;
          if (looksLikeProduct(maybe)) prod = maybe;
        } catch {}
        if (!prod) {
          const list = await fetchJSON("/products");
          const items = list?.items || list || [];
          prod =
            items.find(
              (x) =>
                String(x?.id).toLowerCase() === String(id).toLowerCase()
            ) || null;
        }
        if (!off) {
          if (!prod) setErr("המוצר לא נמצא");
          else setP(prod);
        }
      } catch {
        if (!off) setErr("שגיאה בטעינה");
      } finally {
        if (!off) setLoading(false);
      }
    })();
    return () => {
      off = true;
    };
  }, [id]);

  function addToCart() {
    if (!p) return;
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const i = cart.findIndex((x) => x.id === p.id);
      if (i >= 0) cart[i].qty = Number(cart[i].qty || 0) + 1;
      else
        cart.push({
          id: p.id,
          title: p.title,
          price: Number(p.price || 0),
          image: p.image || "",
          qty: 1,
        });
      localStorage.setItem("cart", JSON.stringify(cart));
      localStorage.setItem("cart_ping", String(Date.now()));
      window.dispatchEvent?.(new Event("cart_add"));
      setToast("המוצר נוסף לעגלה");
      clearTimeout(window.__detailToast);
      window.__detailToast = setTimeout(() => setToast(null), 1200);
    } catch {}
  }

  if (loading) return <div dir="rtl" style={{ padding: 16 }}>טוען…</div>;
  if (err) return <div dir="rtl" style={{ padding: 16 }}>{err}</div>;
  if (!p) return null;

  return (
    <div dir="rtl" className="page">
      <nav className="crumbs">
        <Link href="/catalog">מוצרים</Link>
        <span>/</span>
        <span className="muted">{p.title || p.id}</span>
      </nav>

      <section className="card">
        <div className="gallery">
          {p.image ? <img src={normalizeImage(p.image)} alt="" /> : <div className="noimg">תמונה</div>}
        </div>

        <div className="info">
          <div className="field">
            <label>שם פריט</label>
            <h1 className="title">{p.title || p.id}</h1>
          </div>

          <div className="row">
            {p.category && <span className="badge">{p.category}</span>}
          </div>

          <div className="field">
            <label>מחיר</label>
            <div className="price">₪ {Number(p.price || 0)}</div>
          </div>

          {p.description && (
            <div className="field">
              <label>תיאור</label>
              <p className="desc">{p.description}</p>
            </div>
          )}

          <div className="actions">
            <button className="btn primary" onClick={addToCart}>הוסף לעגלה</button>
            <Link href="/catalog" className="btn">חזרה לקטלוג</Link>
          </div>
        </div>
      </section>

      {toast && <div className="toast">{toast}</div>}

      <style jsx>{`
        .page{ padding:14px; max-width:1200px; margin:0 auto; }
        .crumbs{ display:flex; gap:6px; align-items:center; color:#64748b; font-size:14px; margin-bottom:10px; }
        .crumbs a{ color:#1e40af; text-decoration:none; }
        .crumbs .muted{ color:#475569; }
        .card{ display:grid; grid-template-columns: 1.2fr 1fr; gap:16px; background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:14px; box-shadow:0 1px 2px rgba(0,0,0,.03); }
        @media (max-width: 980px){ .card{ grid-template-columns:1fr; } }
        .gallery{ min-height:360px; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; background:#f3f4f6; }
        .gallery img{ width:100%; height:100%; object-fit:cover; display:block; }
        .noimg{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#94a3b8; }
        .info{ display:flex; flex-direction:column; gap:12px; }
        .field label{ display:block; font-size:12px; color:#64748b; margin-bottom:4px; }
        .title{ margin:0; font-size:26px; color:#0f172a; }
        .row{ display:flex; gap:8px; align-items:center; }
        .badge{ background:#f8fafc; border:1px solid #e5e7eb; border-radius:999px; padding:2px 8px; font-size:13px; }
        .price{ font-weight:800; font-size:22px; }
        .desc{ color:#475569; line-height:1.7; }
        .actions{ display:flex; gap:8px; margin-top:6px; }
        .btn{ border:1px solid #e5e7eb; background:#fff; border-radius:10px; padding:10px 14px; cursor:pointer; text-decoration:none; }
        .btn.primary{ background:#2563eb; border-color:#2563eb; color:#fff; }
        .toast { position: fixed; bottom: 16px; left: 16px; width:200px; height:50px; padding:8px 10px; background: rgba(17,24,39,.95); color:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.2); z-index:1000; pointer-events:none; font-size:20px; text-align:center; }
      `}</style>
    </div>
  );
}
