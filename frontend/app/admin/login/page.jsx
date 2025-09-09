'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API || 'http://localhost:4001/api'

export default function Login(){
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [errors,setErrors] = useState({})
  const [msg,setMsg] = useState('')
  const [loading,setLoading] = useState(false)
  const router = useRouter()

  async function submit(e){
    e.preventDefault()
    setMsg('')
    const errs = {}
    if(!username) errs.username = true
    if(!password) errs.password = true
    setErrors(errs)
    if(Object.keys(errs).length) return

    setLoading(true)
    try{
      const res = await fetch(API + '/admin/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username, password })
      })
      const data = await res.json().catch(()=>({}))
      if(!res.ok){ setMsg(data?.error || 'שם משתמש/סיסמה שגויים'); return }
      try{ localStorage.setItem('admin_token', data?.token || '') }catch{}
      router.replace('/admin')
    }catch(err){ setMsg('שגיאה בהתחברות: ' + (err?.message || err)) }
    finally{ setLoading(false) }
  }

  return (
    <div dir="rtl" className="loginWrap">
      <form onSubmit={submit} className="card">
        <h2>כניסת מנהל</h2>
        <label>שם משתמש</label>
        <input
          className={errors.username ? 'error' : ''}
          value={username}
          onChange={e=>setUsername(e.target.value)} />
        <label>סיסמה</label>
        <input
          type="password"
          className={errors.password ? 'error' : ''}
          value={password}
          onChange={e=>setPassword(e.target.value)} />
        <button disabled={loading} className="btn primary" type="submit">
          {loading ? 'מתחבר…' : 'כניסה'}
        </button>
        {msg && <div className="alert error">{msg}</div>}
      </form>

      <style jsx>{`
        .loginWrap { min-height:60vh; display:flex; align-items:center; justify-content:center; padding:24px; }
        .card { width:100%; max-width:420px; display:flex; flex-direction:column; gap:10px;
                background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:18px; }
        input { border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; font-size:14px; }
        input.error { border-color:#ef4444; background:#fff1f2; }
        .btn.primary { background:#2563eb; color:#fff; border-color:#2563eb; }
        .btn[disabled] { opacity:.7; cursor:not-allowed; }
        .alert { margin-top:6px; padding:10px; border-radius:10px; border:1px solid #e5e7eb; font-size:14px; }
        .alert.error { border-color:#ef4444; background:#fff1f2; color:#b91c1c; }
      `}</style>
    </div>
  )
}
