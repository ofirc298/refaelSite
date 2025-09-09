'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { API, adminFetch, fetchJSON, adminUpload } from '../../lib/api'
import { useRouter } from 'next/navigation'

const API_ORIGIN = API.replace(/\/api$/, '')
const asURL = (u) => (u && !/^https?:\/\//.test(u)) ? (API_ORIGIN + u) : u

const emptyForm = {
  id: '',
  title: '',
  description: '',
  price: 0,
  category: '',
  image: '',
  inStock: true,   // נשתמש כשדה "פעיל" להצגה בקטלוג
  stockQty: 0,
}

export default function AdminPage() {
  const router = useRouter()
  const [boot,setBoot]=useState('loading')

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''
    if (!t) { router.replace('/admin/login'); return }
    (async () => {
      try { await adminFetch('/admin/verify'); setBoot('ok') }
      catch { try { localStorage.removeItem('admin_token') } catch {}; router.replace('/admin/login') }
    })()
  }, [router])

  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [msg, setMsg] = useState(null) // {type, text}
  const [filter, setFilter] = useState({ q: '', category: '' })
  const [uploading, setUploading] = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [selected, setSelected] = useState(new Set()) // בחירה מרובה
  const fileRef = useRef(null)
  const msgRef = useRef(null)

  function showMessage(next){
    setMsg(next)
    setTimeout(()=>{ try { msgRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }) } catch {} }, 0)
    if(next?.type === 'success'){
      setTimeout(()=>{ setMsg(m => (m===next ? null : m)) }, 3500)
    }
  }

  async function loadProducts() {
    try {
      const { items } = await adminFetch('/admin/products')
      setItems(items || [])
    } catch (e) { showMessage({ type: 'error', text: 'שגיאה בטעינת מוצרים: ' + (e?.message || e) }) }
  }
  async function loadCats() {
    try {
      const { categories } = await fetchJSON('/products/categories')
      setCats(categories || [])
    } catch {}
  }
  useEffect(() => { if(boot==='ok'){ loadProducts(); loadCats() } }, [boot])

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
    return v
  }, [items, filter])

  function toggleSelected(id){
    setSelected(prev => {
      const n = new Set(prev)
      if(n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }
  function selectAllVisible(){
    setSelected(new Set(view.map(p=>p.id)))
  }
  function clearSelection(){ setSelected(new Set()) }

  function edit(p) {
    setForm({
      id: p.id,
      title: p.title,
      description: p.description || '',
      price: p.price,
      category: p.category || '',
      image: p.image || '',
      inStock: !!p.inStock,
      stockQty: p.stockQty ?? 0,
    })
    setIsEditing(true)
    setTriedSubmit(false)
    setMsg(null)
    try { scrollTo({ top: 0, behavior: 'smooth' }) } catch {}
  }

  function reset(keepMsg=false) {
    setForm(emptyForm); setIsEditing(false); setTriedSubmit(false)
    if (fileRef.current) fileRef.current.value = ''
    if (!keepMsg) setMsg(null)
  }

  async function create() {
    setTriedSubmit(true)
    if (!form.id || !form.title) {
      showMessage({ type: 'error', text: 'נא למלא מזהה (ID) ושם מוצר' })
      return
    }
    try {
      await adminFetch('/admin/products', {
        method: 'POST',
        body: { ...form, price: Number(form.price ?? 0), stockQty: Number(form.stockQty ?? 0) },
      })
      showMessage({ type: 'success', text: 'המוצר נוצר ונשמר בהצלחה ✅' })
      reset(true); loadProducts(); loadCats()
    } catch (e) { showMessage({ type: 'error', text: String(e?.message || e) }) }
  }

  async function update(id) {
    setTriedSubmit(true)
    if (!form.title) {
      showMessage({ type: 'error', text: 'נא למלא שם מוצר' })
      return
    }
    try {
      await adminFetch(`/admin/products/${id}`, {
        method: 'PUT',
        body: { ...form, price: Number(form.price ?? 0), stockQty: Number(form.stockQty ?? 0) },
      })
      showMessage({ type: 'success', text: 'המוצר עודכן בהצלחה ✍️' })
      reset(true); loadProducts(); loadCats()
    } catch (e) { showMessage({ type: 'error', text: String(e?.message || e) }) }
  }

  async function remove(id) {
    if (!confirm('למחוק מוצר זה?')) return
    try {
      await adminFetch(`/admin/products/${id}`, { method: 'DELETE' })
      showMessage({ type: 'success', text: 'המוצר נמחק בהצלחה 🗑️' })
      if (isEditing && form.id === id) reset(true)
      loadProducts(); loadCats()
    } catch (e) { showMessage({ type: 'error', text: String(e?.message || e) }) }
  }

  // פעולות מרובות
  async function bulkDelete(){
    if(selected.size===0) return
    if(!confirm(`למחוק ${selected.size} פריטים שנבחרו?`)) return
    try{
      await Promise.all(Array.from(selected).map(id => adminFetch(`/admin/products/${id}`, { method:'DELETE' })))
      showMessage({ type:'success', text:`נמחקו ${selected.size} פריטים` })
      clearSelection()
      loadProducts()
    }catch(e){ showMessage({ type:'error', text:String(e?.message || e) }) }
  }
  async function bulkSetActive(active){
    if(selected.size===0) return
    try{
      const map = new Map(items.map(p=>[p.id,p]))
      await Promise.all(Array.from(selected).map(id => {
        const p = map.get(id) || { id }
        return adminFetch(`/admin/products/${id}`, {
          method:'PUT',
          body: { ...p, inStock: !!active, price:Number(p.price||0), stockQty:Number(p.stockQty||0) }
        })
      }))
      showMessage({ type:'success', text: active ? 'הפריטים הופעלו והם מוצגים בקטלוג' : 'הפריטים הוסתרו מהקטלוג' })
      clearSelection()
      loadProducts()
    }catch(e){ showMessage({ type:'error', text:String(e?.message || e) }) }
  }

  async function onSelectFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (!/^image\//.test(file.type)) { showMessage({ type: 'error', text: 'יש לבחור קובץ תמונה' }); return }
    if (file.size > 8 * 1024 * 1024) { showMessage({ type: 'error', text: 'קובץ גדול מדי (מקס׳ 8MB)' }); return }
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const data = await adminUpload('/admin/upload', fd)
      const url = data?.url || data?.path
      if (url) { setForm(f => ({ ...f, image: asURL(url) })); showMessage({ type: 'success', text: 'התמונה הועלתה' }) }
      else { showMessage({ type: 'error', text: 'העלאה הצליחה אך לא הוחזר נתיב תמונה' }) }
    } catch (e) { showMessage({ type: 'error', text: 'שגיאה בהעלאה: ' + (e?.message || e) }) }
    finally { setUploading(false); e.target.value = '' }
  }

  if(boot!=='ok'){
    return <div dir="rtl" style={{padding:20,opacity:.7}}>טוען…</div>
  }

  return (
    <div dir="rtl" className="page">
      <aside className="panel">
        <div className="panel-header">
          <h2>{isEditing ? 'עריכת מוצר' : 'מוצר חדש'}</h2>
          {isEditing && <button className="btn ghost" onClick={()=>reset()}>ניקוי</button>}
        </div>

        <div className="form">
          <div className="row">
            <label>מזהה (ID)</label>
            <input value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} disabled={isEditing}
                   className={triedSubmit && !isEditing && !form.id ? 'error' : ''} />
          </div>

          <div className="row">
            <label>שם מוצר</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                   className={triedSubmit && !form.title ? 'error' : ''} />
          </div>

          <div className="row">
            <label>תיאור</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="row">
            <label>קטגוריה</label>
            <input list="catsList" placeholder="בחר או כתוב קטגוריה…" value={form.category}
                   onChange={e => setForm({ ...form, category: e.target.value })} />
            <datalist id="catsList">{cats.map(c => <option key={c} value={c} />)}</datalist>
          </div>

          <div className="row">
            <label>מחיר (₪)</label>
            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          </div>

          <div className="row cols">
            <label className="check">
              <input type="checkbox" checked={form.inStock} onChange={e => setForm({ ...form, inStock: e.target.checked })} />
              <span>במלאי / פעיל</span>
            </label>
            <div>
              <label>כמות במלאי</label>
              <input type="number" value={form.stockQty} onChange={e => setForm({ ...form, stockQty: e.target.value })} />
            </div>
          </div>

          <div className="row">
            <label>תמונה</label>
            <div className="imgRow">
              <input ref={fileRef} type="file" accept="image/*" onChange={onSelectFile} />
              <div className="imgPreview">
                {form.image ? <img src={asURL(form.image)} alt="preview" /> : <div className="noimg">אין תצוגה</div>}
                {uploading && <div className="loader">מעלה…</div>}
              </div>
            </div>
          </div>

          <div className="actions sticky">
            {!isEditing && <button className="btn primary" onClick={create}>שמור חדש</button>}
            {isEditing && <>
              <button className="btn primary" onClick={() => update(form.id)}>עדכון</button>
              <button className="btn" onClick={()=>reset()}>ביטול</button>
            </>}
          </div>

          {msg && <div ref={msgRef} className={`alert ${msg.type}`}>{msg.text}</div>}
        </div>
      </aside>

      {/* כלי בחירה ופעולות מרובות */}
      <div className="bulkbar">
        <button className="btn" onClick={selectAllVisible}>בחר הכל (נראה)</button>
        <button className="btn" onClick={clearSelection}>נקה בחירה</button>
        <span className="muted">נבחרו: {selected.size}</span>
        <div className="spacer" />
        <button className="btn danger" onClick={bulkDelete} disabled={selected.size===0}>מחיקה נבחרים</button>
        <button className="btn" onClick={()=>bulkSetActive(false)} disabled={selected.size===0}>הסתרה מהקטלוג</button>
        <button className="btn" onClick={()=>bulkSetActive(true)} disabled={selected.size===0}>הפעלה להצגה</button>
      </div>

      <div className="toolbar">
        <input placeholder="חיפוש לפי שם / תיאור / מזהה…" value={filter.q} onChange={e => setFilter({ ...filter, q: e.target.value })} />
        <select value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })}>
          <option value="">כל הקטגוריות</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn" onClick={() => setFilter({ q: '', category: '' })}>ניקוי סינון</button>
      </div>

      <section className="cards">
        {view.length === 0 && <div className="empty">לא נמצאו מוצרים</div>}
        {view.map(p => (
          <article key={p.id} className={`cardItem ${selected.has(p.id)?'selected':''}`}>
            <label className="pick">
              <input type="checkbox" checked={selected.has(p.id)} onChange={()=>toggleSelected(p.id)} />
              <span />
            </label>

            <div className="thumbLarge">
              {p.image ? <img src={asURL(p.image)} alt="" /> : <div className="noimg">תמונה</div>}
            </div>

            <div className="body">
              <div className="titleRow">
                <h4 className="title">{p.title}</h4>
                <span className="price">₪ {Number(p.price || 0)}</span>
              </div>
              <div className="meta">
                <span className="badge">{p.category || 'ללא קטגוריה'}</span>
                <span className={`badge ${p.inStock ? 'ok' : 'bad'}`}>{p.inStock ? 'פעיל' : 'לא פעיל'}</span>
                <span className="mono">כמות: {p.stockQty ?? 0}</span>
              </div>
              {p.description && <p className="desc">{p.description}</p>}
            </div>

            <div className="actionsRow">
              <button className="btn" onClick={() => edit(p)}>עריכה</button>
              <button className="btn danger" onClick={() => remove(p.id)}>מחיקה</button>
            </div>
          </article>
        ))}
      </section>

      <style jsx>{`
        .page { padding:16px; max-width:1400px; margin:0 auto; display:flex; flex-direction:column; gap:12px; }
        .panel { background:#fff; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 1px 2px rgba(0,0,0,.03); }
        .panel-header { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:12px 14px; border-bottom:1px solid #eef2f7; }
        .form { padding:14px; }
        .row { display:flex; flex-direction:column; gap:6px; margin-bottom:10px; }
        .row.cols { display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
        label { font-size:13px; color:#475569; }
        input, select, textarea { border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; font-size:14px; outline:none; background:#fff; }
        input.error { border-color:#ef4444; background:#fff1f2; }
        textarea { resize:vertical; }
        .check { display:flex; align-items:center; gap:8px; padding-top:24px; }
        .imgRow { display:flex; align-items:center; gap:12px; }
        .imgPreview { width:140px; height:140px; border-radius:12px; overflow:hidden; background:#f3f4f6; border:1px solid #e5e7eb; position:relative; flex-shrink:0; }
        .imgPreview img { width:100%; height:100%; object-fit:cover; display:block; }
        .noimg { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#94a3b8; }
        .loader { position:absolute; inset:auto 6px 6px auto; background:#111827; color:#fff; font-size:12px; padding:2px 6px; border-radius:6px; }
        .actions.sticky { position: sticky; bottom: 0; display:flex; gap:8px; padding:10px 12px; background: linear-gradient(to top, #fff, rgba(255,255,255,0.9)); border-top:1px solid #eef2f7; border-radius:0 0 14px 14px; }
        .btn { border:1px solid #e5e7eb; background:#fff; border-radius:10px; padding:8px 12px; cursor:pointer; font-size:14px; }
        .btn:hover { background:#f8fafc; }
        .btn.primary { background:#2563eb; color:#fff; border-color:#2563eb; }
        .btn.primary:hover { filter:brightness(.95); }
        .btn.danger { border-color:#ef4444; color:#ef4444; }
        .btn.ghost { background:transparent; }
        .alert { margin:10px 0 0; padding:10px; border-radius:10px; border:1px solid #e5e7eb; }
        .alert.success { border-color:#22c55e; background:#ecfdf5; color:#065f46; }
        .alert.error { border-color:#ef4444; background:#fff1f2; color:#b91c1c; }
        .bulkbar { display:flex; align-items:center; gap:8px; padding:10px 12px; border:1px solid #eef2f7; border-radius:12px; background:#fff; }
        .bulkbar .spacer { flex:1 }
        .muted { color:#64748b; font-size:13px; }
        .toolbar { display:flex; gap:8px; padding:12px; border:1px solid #eef2f7; border-radius:12px; background:#fff; }
        .toolbar input, .toolbar select { padding:10px 12px; border-radius:10px; border:1px solid #e5e7eb; }
        .cards { display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:12px; }
        .cardItem { position:relative; background:#fff; border:1px solid #e5e7eb; border-radius:14px; display:flex; flex-direction:column; gap:10px; padding:10px; min-height: 360px; }
        .cardItem.selected { outline:2px solid #2563eb; outline-offset:-2px; }
        .pick { position:absolute; top:10px; left:10px; display:flex; align-items:center; gap:6px; }
        .pick input { width:18px; height:18px; }
        .thumbLarge { height:150px; width:100%; border-radius:12px; overflow:hidden; background:#f3f4f6; border:1px solid #e5e7eb; flex-shrink:0; }
        .thumbLarge img { width:100%; height:100%; object-fit:cover; display:block; }
        .body { display:flex; flex-direction:column; gap:6px; flex:1; }
        .titleRow { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .title { margin:0; font-size:16px; font-weight:700; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .price { font-weight:600; }
        .meta { display:flex; align-items:center; gap:6px; color:#475569; font-size:13px; flex-wrap:wrap; }
        .badge { background:#f8fafc; border:1px solid #e5e7eb; border-radius:999px; padding:2px 8px; }
        .badge.ok { background:#ecfdf5; border-color:#22c55e; color:#065f46; }
        .badge.bad { background:#fff1f2; border-color:#ef4444; color:#b91c1c; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace; }
        .actionsRow { display:flex; gap:8px; margin-top:auto; }
        .desc { font-size:13px; color:#475569; margin:6px 0 0; overflow:hidden; text-overflow:ellipsis;
                display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; }
        .empty { padding:28px; text-align:center; color:#64748b; border:1px dashed #e5e7eb; border-radius:12px; background:#fff; }
      `}</style>
    </div>
  )
}
