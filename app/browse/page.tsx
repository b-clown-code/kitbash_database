import Link from 'next/link';

export default function BrowsePage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold mb-2">Browse Database</h2>
        <p className="text-gray-600">
          Explore figures and community kitbashes in the knowledge graph.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/browse/figures"
          className="p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
        >
          <h3 className="text-xl font-bold mb-2">Figures</h3>
          <p className="text-gray-700">View all figures currently in the database.</p>
        </Link>

        <Link
          href="/browse/kitbashes"
          className="p-6 bg-green-50 rounded-lg hover:bg-green-100 transition"
        >
          <h3 className="text-xl font-bold mb-2">Kitbashes</h3>
          <p className="text-gray-700">See custom builds from the community.</p>
        </Link>
      </section>
    </div>
  );
}
