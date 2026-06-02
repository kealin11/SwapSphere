export default function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow animate-pulse">
      <div className="h-48 bg-gray-300" />
      <div className="p-4">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-3" />
        <div className="h-3 bg-gray-300 rounded w-full mb-2" />
        <div className="h-3 bg-gray-300 rounded w-5/6 mb-4" />
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-300 rounded w-24" />
          <div className="h-10 bg-gray-300 rounded w-28" />
        </div>
      </div>
    </div>
  );
}
