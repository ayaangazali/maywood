import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          <div className="text-7xl">🎁</div>
          <h1 className="text-5xl font-bold text-gray-900">
            One-Time Gift Link
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create a personalized gift link for anyone. They choose what they
            want from a curated catalog — within the budget you set.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/create"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Create a Gift Link →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-3xl mb-3">💳</div>
              <h3 className="font-semibold text-gray-900 mb-2">Set a Budget</h3>
              <p className="text-gray-600 text-sm">
                Choose a fixed amount or a price range. You pay once — no
                surprises.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-3xl mb-3">🔗</div>
              <h3 className="font-semibold text-gray-900 mb-2">Share a Link</h3>
              <p className="text-gray-600 text-sm">
                Send a unique, one-time link to your recipient. They pick
                exactly what they want.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-3xl mb-3">🎉</div>
              <h3 className="font-semibold text-gray-900 mb-2">Gift Delivered</h3>
              <p className="text-gray-600 text-sm">
                Digital gift cards delivered instantly to their email. Easy,
                personal, delightful.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
