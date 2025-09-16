// components/ProductGrid.jsx
import ProductCard from "./ProductCard";
import SkeletonCard from "./SkeletonCard";

export default function ProductGrid({ loading, error, items }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 text-red-800 p-4 rtl text-right">
        {error}
      </div>
    );
  }
  if (!items || items.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 text-gray-700 p-4 rtl text-right">
        לא נמצאו מוצרים
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {items.map(p => <ProductCard key={p.id || p._id || p.sku} p={p} />)}
    </div>
  );
}
