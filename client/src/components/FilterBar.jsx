const CATEGORIES = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Other'];
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under R500', min: 0, max: 500 },
  { label: 'R500 - R2000', min: 500, max: 2000 },
  { label: 'R2000 - R10000', min: 2000, max: 10000 },
  { label: 'Over R10000', min: 10000, max: Infinity },
];

export default function FilterBar({ sortBy, onSortChange, category, onCategoryChange, priceRange, onPriceRangeChange }) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row gap-4">
      {/* Category Filter */}
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* Price Range Filter */}
      <select
        value={priceRange}
        onChange={(e) => onPriceRangeChange(e.target.value)}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {PRICE_RANGES.map((range) => (
          <option key={range.label} value={range.label}>
            {range.label}
          </option>
        ))}
      </select>

      {/* Sort By */}
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="newest">Newest First</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
      </select>
    </div>
  );
}

export { CATEGORIES, PRICE_RANGES };
