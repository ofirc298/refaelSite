import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { prisma } from './client.js'

async function main(){
  const jsonPath = join(process.cwd(), 'data', 'products.json')
  let items = []
  if (existsSync(jsonPath)) {
    try { items = JSON.parse(readFileSync(jsonPath, 'utf-8')) } catch {}
  }
  if (!Array.isArray(items) || items.length === 0) {
    items = [
      { id:'p-1001', title:'כיסא עץ אלון', description:'כיסא איכותי מעץ אלון מלא', price:299.9, category:'ריהוט', image:'', inStock:true, stockQty:10 },
      { id:'p-1002', title:'מנורת לילה נורדית', description:'מנורה בסגנון סקנדינבי עם אהיל בד', price:149.0, category:'תאורה', image:'', inStock:true, stockQty:20 },
      { id:'p-2001', title:'שולחן עץ מלא', description:'שולחן אוכל כפרי מעץ מלא', price:799.0, category:'ריהוט', image:'', inStock:true, stockQty:5 },
      { id:'p-2002', title:'מדף ספרים מתכת', description:'מדף מודרני 5 קומות', price:349.0, category:'ריהוט', image:'', inStock:true, stockQty:12 },
      { id:'p-3001', title:'שטיח אתני', description:'שטיח כותנה אתני 160x230', price:259.0, category:'טקסטיל', image:'', inStock:true, stockQty:7 },
      { id:'p-4001', title:'מראה עגולה', description:'מראה עגולה למסדרון 60 ס״מ', price:199.0, category:'דקורציה', image:'', inStock:true, stockQty:9 }
    ]
  }

  for (const p of items) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        title: p.title, description: p.description || '', price: Number(p.price),
        category: p.category || '', image: p.image || '', inStock: !!p.inStock,
        stockQty: Number(p.stockQty||0)
      },
      create: {
        id: String(p.id), title: p.title, description: p.description || '',
        price: Number(p.price), category: p.category || '', image: p.image || '',
        inStock: !!p.inStock, stockQty: Number(p.stockQty||0)
      }
    })
  }
  console.log(`Seeded ${items.length} products into DB.`)
}

main().finally(()=> prisma.$disconnect())
