import { Router } from 'express'
import nodemailer from 'nodemailer'

const router = Router()

function createTransport(){
  if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.example.com') {
    return nodemailer.createTransport({ jsonTransport: true })
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE||'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  })
}

router.get('/test-mail', async (req,res)=>{
  const to = req.query.to || process.env.ORDER_DEST_EMAIL
  try{
    const t = createTransport()
    const info = await t.sendMail({
      from: process.env.SMTP_USER||'no-reply@example.com',
      to,
      subject:'בדיקת SMTP — REFAEL',
      html:`<p>בדיקה ב-${new Date().toLocaleString('he-IL')}</p>`
    })
    res.json({ ok:true, info })
  }catch(e){
    res.status(502).json({ error:'Mail send failed', details:String(e) })
  }
})

export default router
