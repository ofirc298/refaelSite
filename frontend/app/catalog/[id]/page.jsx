// app/catalog/[id]/page.jsx
import ProductClient from "./ProductClient";

export async function generateStaticParams() {
  const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4001/api";
  try {
    const res = await fetch(`${API}/products`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const items = data?.items || data || [];
    return items.map((p) => ({ id: String(p.id) }));
  } catch {
    return [];
  }
}

export default function Page({ params }) {
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  return <ProductClient id={id} />;
}
