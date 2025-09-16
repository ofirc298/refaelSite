// components/ProductCard.jsx
export default function ProductCard({ p }) {
  const title = p.title || p.name || 'ללא שם';
  const img = p.image || p.imgUrl || '';
  const price = typeof p.price === 'number' ? `${p.price} ₪` : (p.price || '');

  return (
    <article className="rounded-xl border border-gray-200 p-3 hover:shadow-sm transition rtl text-right">
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-md mb-3 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain"
          />
        ) : null}
      </div>
      <h3 className="font-semibold text-sm line-clamp-2">{title}</h3>
      {p.category && <div className="text-gray-600 text-xs mt-1">קטגוריה: {p.category}</div>}
      <div className="mt-2 font-bold">{price}</div>
    </article>
  );
}
