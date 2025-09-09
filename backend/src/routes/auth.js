import { Router } from 'express'
import jwt from 'jsonwebtoken'

const router = Router()

router.post('/login',(req,res)=>{
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' })
  const u = process.env.ADMIN_USER || 'admin'
  const p = process.env.ADMIN_PASS || 'admin123'
  if (username !== u || password !== p) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ sub: username }, process.env.ADMIN_JWT_SECRET || 'change-me-secret', { expiresIn:'12h' })
  res.json({ token })
})

export default router
