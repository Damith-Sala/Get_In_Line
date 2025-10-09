import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Get In Line
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Skip the wait, join the digital queue
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Join virtual queues for restaurants, services, and appointments. 
            No more standing in line - get notified when it's your turn!
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Guest Access */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center border-2 border-blue-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Browse Queues</h3>
              <p className="text-gray-600 mb-6">
                See all available queues without signing up. Perfect for exploring what's available.
              </p>
              <Link 
                href="/guest-queues"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View All Queues
              </Link>
              <p className="text-xs text-blue-600 mt-2">No account required!</p>
            </div>

            {/* Customer Signup */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Join as Customer</h3>
              <p className="text-gray-600 mb-6">
                Sign up to join queues, track your position, and get notifications.
              </p>
              <Link 
                href="/signup"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Sign Up as Customer
              </Link>
            </div>

            {/* Business Signup */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Create as Business</h3>
              <p className="text-gray-600 mb-6">
                Manage queues for your business, track customers, and reduce wait times.
              </p>
              <Link 
                href="/signup/business"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Sign Up as Business
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-6">Already have an account?</h2>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/login"
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/dashboard"
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </main>

        <footer className="mt-16 text-center text-gray-500">
          <p>&copy; 2024 Get In Line. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
