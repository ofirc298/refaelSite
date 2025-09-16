// components/ProductCard.jsx
export default function ProductCard({ p }) {
  return (
    <article className="rounded-xl border border-gray-200 p-3 hover:shadow-sm transition rtl text-right">
      <img src={p.image || p.imgUrl} alt={p.title || p.name} className="w-full h-40 object-contain mb-3" />
      <h3 className="font-semibold text-sm">{p.title || p.name}</h3>
      <div className="text-gray-600 text-sm mt-1">
        {p.category && <span>קטגוריה: {p.category}</span>}
      </div>
      <div className="mt-2 font-bold">{typeof p.price === 'number' ? `${p.price} ₪` : p.price}</div>
    </article>
  );
}
