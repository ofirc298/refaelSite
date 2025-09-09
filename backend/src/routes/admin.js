// backend/src/routes/admin.js
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../db/client.js'
import multer from 'multer'
import { join, extname } from 'path'
import { mkdirSync } from 'fs'

const router = Router()

function auth(req, res, next) {
  try {
    const hdr = req.headers.authorization || ''
    const m = hdr.match(/^Bearer\s+(.+)$/i)
    if (!m) return res.status(401).json({ error: 'Unauthorized' })
    const token = m[1]
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'secret')
    req.admin = payload
    return next()
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

const uploadDir = join(process.cwd(), 'uploads')
try { mkdirSync(uploadDir, { recursive: true }) } catch {}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const name = Date.now() + '-' + Math.random().toString(36).slice(2) + extname(file.originalname || '')
    cb(null, name)
  }
})
const upload = multer({ storage })

const ADMIN_JWT_EXPIRES = process.env.ADMIN_JWT_EXPIRES || '7d'

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  if ((username === (process.env.ADMIN_USER || 'admin')) && (password === (process.env.ADMIN_PASS || 'admin123'))) {
    const token = jwt.sign({ sub: 'admin', role: 'admin' }, process.env.ADMIN_JWT_SECRET || 'secret', { expiresIn: ADMIN_JWT_EXPIRES })
    return res.json({ token })
  }
  return res.status(401).json({ error: 'Invalid credentials' })
})

router.use(auth)

router.get('/verify', (_req, res) => res.json({ ok: true }))

const productSchema = z.object({
  id: z.string().min(1, 'יש להזין מזהה (ID)'),
  title: z.string().min(1, 'יש להזין שם מוצר'),
  description: z.string().optional().default(''),
  price: z.coerce.number().min(0, 'מחיר חייב להיות 0 או יותר').default(0),
  category: z.string().optional().default(''),
  image: z.string().optional().default(''),
  inStock: z.coerce.boolean().optional().default(true),
  stockQty: z.coerce.number().int().min(0, 'כמות במלאי חייבת להיות 0 או יותר').optional().default(0),
})

function humanizeZod(err){
  try {
    const issues = err.issues || []
    if (!issues.length) return 'Invalid payload'
    return issues.map(i => ((i.path||[]).join('.') ? (i.path||[]).join('.')+': ' : '') + (i.message || 'שגיאת ולידציה')).join(' | ')
  } catch { return 'Invalid payload' }
}

router.get('/products', async (_req, res) => {
  const items = await prisma.product.findMany()
  res.json({ items })
})

router.post('/products', async (req, res) => {
  try {
    const data = productSchema.parse(req.body || {})
    const item = await prisma.product.create({ data })
    res.status(201).json({ item })
  } catch (e) {
    if (e && e.name === 'ZodError') return res.status(400).json({ error: humanizeZod(e) })
    if (e && e.code === 'P2002') return res.status(409).json({ error: 'מזהה (ID) כבר קיים' })
    res.status(500).json({ error: 'create_failed' })
  }
})

router.put('/products/:id', async (req, res) => {
  const id = req.params.id
  try {
    const data = productSchema.partial().parse(req.body || {})
    const item = await prisma.product.update({ where: { id }, data })
    res.json({ item })
  } catch (e) {
    if (e && e.name === 'ZodError') return res.status(400).json({ error: humanizeZod(e) })
    if (e && e.code === 'P2002') return res.status(409).json({ error: 'מזהה (ID) כבר קיים' })
    return res.status(404).json({ error: 'Not found' })
  }
})

router.delete('/products/:id', async (req, res) => {
  const id = req.params.id
  try {
    await prisma.product.delete({ where: { id } })
    res.json({ ok: true })
  } catch {
    res.status(404).json({ error: 'Not found' })
  }
})

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  res.json({ url: `/uploads/${req.file.filename}` })
})

export default router
