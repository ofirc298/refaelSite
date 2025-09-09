import { writeFileSync } from 'fs'
import { join } from 'path'

const dataPath = join(process.cwd(), 'data', 'products.json')

const products = [
  { id:'p-3001', title:'שטיח אתני', description:'שטיח כותנה אתני 160x230', price:259.0, category:'טקסטיל', image:'', inStock:true, stockQty:7, attributes:{ size:'160x230' } },
  { id:'p-4001', title:'מראה עגולה', description:'מראה עגולה למסדרון 60 ס״מ', price:199.0, category:'דקורציה', image:'', inStock:true, stockQty:9, attributes:{ diameter:'60cm' } },
  { id:'p-1001', title:'כיסא עץ אלון', description:'כיסא איכותי מעץ אלון מלא', price:299.9, category:'ריהוט', image:'', inStock:true, stockQty:10, attributes:{ color:'טבעי', material:'עץ אלון' } },
  { id:'p-1002', title:'מנורת לילה נורדית', description:'מנורה בסגנון סקנדינבי עם אהיל בד', price:149.0, category:'תאורה', image:'', inStock:true, stockQty:20, attributes:{ color:'שמנת', material:'בד/מתכת' } },
  { id:'p-2001', title:'שולחן עץ מלא', description:'שולחן אוכל כפרי מעץ מלא', price:799.0, category:'ריהוט', image:'', inStock:true, stockQty:5, attributes:{ material:'עץ' } },
  { id:'p-2002', title:'מדף ספרים מתכת', description:'מדף מודרני 5 קומות', price:349.0, category:'ריהוט', image:'', inStock:true, stockQty:12, attributes:{ material:'מתכת' } }
]

writeFileSync(dataPath, JSON.stringify(products, null, 2), 'utf-8')
console.log('Seeded products to', dataPath)
