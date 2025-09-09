'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * קישור עגלה עם Badge מספרי (כמות פריטים בעגלה)
 * שימוש: שים במקום הקישור הנוכחי בעמוד ה־Header/NavBar
 * <NavCartLink className="nav-link" />
 */
export default function NavCartLink({ className='' }){
  const [count,setCount] = useState(0)
  const [flash,setFlash] = useState(false)

  function recompute(){
    try{
      const cart = JSON.parse(localStorage.getItem('cart')||'[]')
      const total = cart.reduce((s,it)=> s + Number(it.qty||1), 0)
      setCount(total)
    }catch{ setCount(0) }
  }

  useEffect(()=>{
    recompute()

    const onPing = () => {
      recompute()
      setFlash(true)
      setTimeout(()=>setFlash(false), 500)
    }
    const onStorage = (e) => {
      if(e.key === 'cart' || e.key === 'cart_ping') recompute()
    }

    window.addEventListener('cart_add', onPing)
    window.addEventListener('storage', onStorage)
    const iv = setInterval(recompute, 1500) // פולבק

    return () => {
      window.removeEventListener('cart_add', onPing)
      window.removeEventListener('storage', onStorage)
      clearInterval(iv)
    }
  },[])

  return (
    <span className={`nav-cart ${flash ? 'flash' : ''}`}>
      <Link id="nav-cart" href="/cart" className={className}>עגלה</Link>
      {count > 0 && <span className="badge">{count > 99 ? '99+' : count}</span>}

      <style jsx>{`
        .nav-cart { position:relative; display:inline-block; }
        .badge {
          position:absolute; top:-6px; left:-10px;
          min-width:18px; height:18px; padding:0 5px;
          border-radius:999px;
          background:#ef4444; color:#fff; font-size:12px; line-height:18px;
          text-align:center; font-weight:700;
          box-shadow:0 1px 2px rgba(0,0,0,.2);
        }
        .flash :global(#nav-cart) { filter:brightness(1.2); transition:.3s; }
      `}</style>
    </span>
  )
}
