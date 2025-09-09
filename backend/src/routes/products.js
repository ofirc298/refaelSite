// backend/src/routes/products.js
import { Router } from 'express'
import { prisma } from '../db/client.js'

const router = Router()

// categories FIRST so '/categories' won't be captured by '/:id'
router.get('/categories', async (_req, res) => {
  try {
    const rows = await prisma.product.findMany({ select: { category: true } })
    const set = new Set()
    for (const r of rows) {
      const c = String(r.category || '').trim()
      if (c) set.add(c)
    }
    const categories = Array.from(set).sort((a,b)=>a.localeCompare(b,'he'))
    res.json({ categories })
  } catch (e) {
    res.status(500).json({ error: 'categories_failed' })
  }
})

router.get('/', async (req,res) => {
  const { q, category, sort, minPrice, maxPrice, inStock } = req.query
  const where = {}
  if (q) {
    const s = String(q)
    where.OR = [
      { title: { contains: s, mode:'insensitive' } },
      { description: { contains: s, mode:'insensitive' } }
    ]
  }
  if (category) where.category = String(category)
  if (minPrice) where.price = { ...(where.price||{}), gte: Number(minPrice) }
  if (maxPrice) where.price = { ...(where.price||{}), lte: Number(maxPrice) }
  if (inStock === 'true') {
    where.AND = [ ...(where.AND||[]), { inStock: true }, { stockQty: { gt: 0 } } ]
  }
  let orderBy = undefined
  if (sort) {
    const [field, dir] = String(sort).split(':')
    orderBy = { [field]: (dir==='desc'?'desc':'asc') }
  }
  const items = await prisma.product.findMany({ where, orderBy })
  res.json({ items })
})

// get one product
router.get('/:id', async (req,res)=>{
  const id = String(req.params.id)
  const p = await prisma.product.findUnique({ where: { id } })
  if(!p) return res.status(404).json({ error:'Not found' })
  res.json({ item: p })
})

export default router
