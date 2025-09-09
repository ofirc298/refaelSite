// backend/src/server.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { join } from 'path'

// ראוטים
import productsRoute from './routes/products.js'
import adminRoute from './routes/admin.js'
import checkoutRoute from './routes/checkout.js'

const app = express()

// הגדרות בסיס
const PORT = process.env.PORT ? Number(process.env.PORT) : 4001
const corsOrigin =
  process.env.CORS_ORIGIN ||
  'http://localhost:3000' // הפרונט הדיפולטי

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json({ limit: '10mb' }))

// הגשה סטטית של העלאות תמונות
// חשוב שזה יבוא לפני הראוטים כדי שיוגש מיד
app.use('/uploads', express.static(join(process.cwd(), 'uploads')))

// Healthcheck פשוט
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// ראוטים עיקריים של ה-API
app.use('/api/products', productsRoute)
app.use('/api/admin', adminRoute)
app.use('/api/checkout', checkoutRoute)

// 404 לנתיבים לא מוכרים
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// הפעלה
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
  console.log(`Static uploads served from /uploads`)
})
