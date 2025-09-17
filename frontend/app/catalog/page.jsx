import Catalog from '../../components/Catalog'

export const revalidate = 60; // ISR: revalidate every 60s
// export const revalidate = 60; // alternatively, enable ISR

async function getData() {
  const base = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4001/api').replace(/\/$/, '');
  try {
    const [prodsRes, catsRes] = await Promise.all([
      fetch(`${base}/products`, { next: { revalidate: 60 } }),
      fetch(`${base}/products/categories`, { next: { revalidate: 60 } }),
    ]);
    const prodsJson = await prodsRes.json().catch(() => ({}));
    const items = Array.isArray(prodsJson) ? prodsJson : (prodsJson.items || []);
    const catsJson = await catsRes.json().catch(() => ({}));
    const categories = catsJson.categories || [];
    return { items, categories };
  } catch (e) {
    return { items: [], categories: [] };
  }
}

export default async function CatalogPage(){
  const { items, categories } = await getData();
  return (
    <div dir="rtl">
      <Catalog initialItems={items} initialCats={categories} />
    </div>
  )
}
