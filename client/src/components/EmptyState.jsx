export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-6xl mb-4">📦</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-8 text-center max-w-md">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
