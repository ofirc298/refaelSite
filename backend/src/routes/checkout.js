// backend/src/routes/checkout.js
import { Router } from 'express'
import nodemailer from 'nodemailer'

const router = Router()

function validPhoneIL(p){
  if(!p) return false
  const s = String(p).replace(/[\s-]/g,'')
  return /^(?:\+?972|0)(?:[23489]\d{7}|5\d{8})$/.test(s)
}

function createTransport(){
  if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.example.com') {
    // Dev fallback: will log JSON instead of sending real email
    return nodemailer.createTransport({ jsonTransport: true })
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE||'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  })
}

router.post('/', async (req,res)=>{
  const { items, customer } = req.body || {}
  if (!Array.isArray(items) || items.length===0) return res.status(400).json({ error: 'Cart must contain at least one item' })
  if (!customer || !customer.name || !customer.phone) return res.status(400).json({ error: 'Name and phone are required' })
  if (!validPhoneIL(customer.phone)) return res.status(400).json({ error: 'Invalid phone' })
  const total = items.reduce((s,it)=> s + Number(it.price||0)*Number(it.qty||0), 0).toFixed(2)

  const html = `
    <h2>התקבלה הזמנה חדשה</h2>
    <p><strong>לקוח:</strong> ${customer?.name||''} (${customer?.email||''}) ${customer?.phone||''}</p>
    <p><strong>כתובת:</strong> ${customer?.address||''}</p>
    <p><strong>הערות:</strong> ${customer?.notes||''}</p>
    <ul>${items.map(it=>`<li>${it.title} x ${it.qty} — ${it.price} ₪</li>`).join('')}</ul>
    <p><strong>סה"כ:</strong> ${total} ₪</p>
  `
  try{
    const t = createTransport()
    await t.sendMail({
      from: process.env.SMTP_USER||'no-reply@example.com',
      to: process.env.ORDER_DEST_EMAIL || process.env.SMTP_USER || 'dev@example.com',
      subject: 'הזמנה חדשה — REFAEL',
      html
    })
    res.json({ ok:true })
  }catch(e){
    console.error('Mail error', e)
    res.status(502).json({ error: 'mail_send_failed', details: String(e && e.message ? e.message : e) })
  }
})

export default router
