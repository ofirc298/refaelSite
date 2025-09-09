'use client'
import { useEffect, useState } from 'react'

function isValidPhoneIL(p) {
  if (!p) return false;
  const s = String(p).trim().replace(/\s|-/g, '')
  return /^(?:\+?972|0)(?:[23489]\d{7}|5\d{8})$/.test(s)
}

export default function Checkout() {
  const [cart, setCart] = useState([])
  const [msg, setMsg] = useState(null)
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '', notes: '' })

  // load cart
  useEffect(() => {
    try {
      const s = localStorage.getItem('cart'); if (s) setCart(JSON.parse(s))
    } catch { }
  }, [])

  function setCartAndPersist(next) {
    setCart(next)
    try { localStorage.setItem('cart', JSON.stringify(next)) } catch { }
  }

  // --- כמות ---
  function clampQty(v) {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1
  }
  function setQty(id, newQty) {
    const qty = clampQty(newQty)
    const next = cart.map(x => x.id === id ? { ...x, qty } : x)
    setCartAndPersist(next)
  }
  function inc(id) { const it = cart.find(x => x.id === id); if (!it) return; setQty(id, (Number(it.qty) || 1) + 1) }
  function dec(id) {
    const it = cart.find(x => x.id === id); if (!it) return
    const q = (Number(it.qty) || 1) - 1
    if (q <= 0) return removeItem(id)      // אם ירד ל־0 — מוחקים (בלי אישור)
    setQty(id, q)
  }

  // --- מחיקה ---
  function removeItem(id) {
    const next = cart.filter(x => String(x.id) !== String(id)) // ללא אישור
    setCartAndPersist(next)
  }
  function clearCart() {
    if (!confirm('לנקות את כל העגלה?')) return
    setCartAndPersist([])
  }

  const lines = cart.map(it => {
    const price = Number(it.price) || 0
    const qty = Number(it.qty) || 1
    return { ...it, price, qty, line: price * qty }
  })
  const total = lines.reduce((s, it) => s + it.line, 0).toFixed(2)

  async function submit() {
    const errs = []
    if (lines.length === 0) errs.push('יש להוסיף לפחות מוצר אחד לעגלה')
    if (!customer.name.trim()) errs.push('נא למלא שם מלא')
    if (!customer.phone.trim()) errs.push('נא למלא טלפון')
    else if (!isValidPhoneIL(customer.phone)) errs.push('מספר טלפון לא תקין')
    if (errs.length) { setMsg({ type: 'error', text: errs.join(' • ') }); return }

    setMsg({ type: 'info', text: 'שולח הזמנה...' })
    const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4001/api') + '/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: lines, customer })
    })
    if (res.ok) {
      setMsg({ type: 'success', text: 'הזמנה נשלחה בהצלחה ✅' })
      try { localStorage.removeItem('cart') } catch { }
      setCart([])
    } else {
      const t = await res.text().catch(() => '')
      setMsg({ type: 'error', text: 'שגיאה בשליחה: ' + t })
    }
  }

  return (
    <div className="two-col">
      {/* סיכום הזמנה */}
      <aside className="card cart">
        <h3 style={{ marginTop: 0 }}>סיכום הזמנה</h3>

        <table className="table">
          <thead>
            <tr>
              <th>מוצר</th>
              <th style={{ width: 170 }}>כמות</th>
              <th>סה״כ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lines.map(it => (
              <tr key={it.id}>
                <td>{it.title}</td>

                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button className="btn sm" onClick={() => dec(it.id)} title="הפחת כמות">−</button>
                    <input
                      style={{ width: 56, textAlign: 'center' }}
                      inputMode="numeric"
                      value={it.qty}
                      onChange={e => setQty(it.id, e.target.value)}
                    />
                    <button className="btn sm" onClick={() => inc(it.id)} title="הוסף כמות">+</button>
                  </div>
                </td>

                <td>₪ {it.line.toFixed(2)}</td>
                <td>
                  <button className="btn danger sm" onClick={() => removeItem(it.id)} title="מחק שורה">מחק</button>
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', opacity: .7 }}>העגלה ריקה</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={4} style={{ paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <strong>סה״כ</strong>
                  <strong>₪ {total}</strong>
                </div>
              </th>
            </tr>
          </tfoot>
        </table>

        {lines.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <button className="btn ghost" onClick={clearCart}>ניקוי עגלה</button>
          </div>
        )}
      </aside>

      {/* פרטי לקוח */}
      <section className="card" style={{ padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>פרטי לקוח</h3>
        <div className="form">
          <label>שם מלא</label>
          <input value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />

          <label>אימייל</label>
          <input value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} />

          <label>טלפון</label>
          <input value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} />

          <label>כתובת</label>
          <input value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} />

          <label>הערות משלוח</label>
          <textarea rows="4" value={customer.notes} onChange={e => setCustomer({ ...customer, notes: e.target.value })}></textarea>

          <button className="btn primary" onClick={submit} style={{ marginTop: 10 }}>שליחת הזמנה</button>

          {msg && (
            <div className={`alert ${msg.type === 'error' ? 'error' : (msg.type === 'success' ? 'success' : 'info')}`}>
              {msg.text}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
