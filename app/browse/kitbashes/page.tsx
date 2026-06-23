import Link from 'next/link';

export default function BrowseKitbashesPage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold mb-2">Browse Kitbashes</h2>
        <p className="text-gray-600">
          Community kitbash browsing page is live and ready for API integration.
        </p>
      </section>

      <section className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Coming Next</h3>
        <p className="text-green-900">
          Connect this page to a dedicated kitbash API route to list builds dynamically.
        </p>
      </section>

      <Link href="/browse" className="inline-block text-blue-600 hover:underline">
        Back to Browse
      </Link>
    </div>
  );
}
