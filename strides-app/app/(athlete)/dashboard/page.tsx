"use client";

import Link from "next/link";

export default function AthleteDashboard() {
  // TODO: Implement authentication check with useAuth hook
  // if (!user || userRole !== 'athlete') redirect("/auth/login");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            STRIDES Athlete Dashboard
          </h1>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, Athlete!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track your biomechanical data and improve your performance.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Recent Sessions
            </h3>
            <p className="text-3xl font-bold text-indigo-600">0</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Personal Records
            </h3>
            <p className="text-3xl font-bold text-indigo-600">0</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Health Devices Connected
            </h3>
            <p className="text-3xl font-bold text-indigo-600">0</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/onboarding"
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Complete Onboarding
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Set up your profile and connect your health devices.
            </p>
            <span className="text-indigo-600 font-semibold">Get Started →</span>
          </Link>
          <Link
            href="/unauthorized"
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              View Sessions
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Analyze your biomechanical analysis sessions.
            </p>
            <span className="text-indigo-600 font-semibold">Explore →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
