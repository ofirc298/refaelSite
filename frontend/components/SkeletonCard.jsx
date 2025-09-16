// components/SkeletonCard.jsx
export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 p-3 rtl text-right">
      <div className="h-40 w-full rounded-md bg-gray-200 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}
