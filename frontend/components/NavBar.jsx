'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * NavBar עם חיווי לעגלה:
 * - מציג מספר פריטים בעגלה (סכום כמויות)
 * - מהבהב/מגדיל נקודה ירוקה כשמוסיפים לעגלה (event 'cart_add' או שינוי localStorage 'cart_ping')
 * שימוש: ייבא ל-layout או ל-header של האתר: <NavBar />
 */
export default function NavBar(){
  const [blink,setBlink] = useState(false)
  const [count,setCount] = useState(0)

  function readCount(){
    try{
      const cart = JSON.parse(localStorage.getItem('cart')||'[]')
      const c = Array.isArray(cart) ? cart.reduce((s,x)=> s + Number(x.qty||0), 0) : 0
      setCount(c)
    }catch{ setCount(0) }
  }

  useEffect(()=>{
    readCount()
    const ping = () => {
      readCount()
      setBlink(true)
      const t = setTimeout(()=>setBlink(false), 900)
      return () => clearTimeout(t)
    }
    const onStorage = (e) => { if(e.key === 'cart_ping' || e.key === 'cart') ping() }
    window.addEventListener('cart_add', ping)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', readCount)
    return ()=>{
      window.removeEventListener('cart_add', ping)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', readCount)
    }
  },[])

  return (
    <header dir="rtl" className="nav">
      <div className="brand">
        <Link href="/" className="logo">REFAEL</Link>
      </div>
      <nav className="links">
        <Link href="/catalog">מוצרים</Link>
        <Link href="/about">אודות</Link>
        <Link href="/contact">צור קשר</Link>
      </nav>
      <div className="actions">
        <Link href="/checkout" className={`cartLink ${blink ? 'blink' : ''}`}>
          עגלה
          <span className="dot" />
          <span className={`badge ${count>0?'show':''}`} aria-label={`פריטים בעגלה: ${count}`}>{count}</span>
        </Link>
      </div>

      <style jsx>{`
        .nav { display:flex; align-items:center; justify-content:space-between;
               gap:12px; padding:10px 14px; background:#fff; border-bottom:1px solid #eef2f7; }
        .brand .logo { font-weight:800; letter-spacing:.5px; }
        .links { display:flex; gap:12px; }
        .actions { display:flex; align-items:center; gap:12px; }
        a { color:inherit; text-decoration:none; }
        .cartLink { position:relative; padding-right:8px; }
        .cartLink .dot {
          position:absolute; top:-3px; right:-6px; width:8px; height:8px; border-radius:999px;
          background:#94a3b8; transition: transform .15s ease, background .15s ease;
        }
        .cartLink.blink .dot { background:#22c55e; transform: scale(1.7); }
        .badge {
          position:absolute; top:-6px; right:-18px;
          min-width:18px; height:18px; border-radius:999px; padding:0 6px;
          display:inline-flex; align-items:center; justify-content:center;
          font-size:12px; background:#111827; color:#fff; opacity:0; transform:scale(.8);
          transition:opacity .15s ease, transform .15s ease;
        }
        .badge.show { opacity:1; transform:scale(1); }
      `}</style>
    </header>
  )
}
