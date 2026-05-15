import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <main className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          STRIDES
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Biomechanical Intelligence Platform
        </p>
        <p className="text-lg text-gray-700 dark:text-gray-200 mb-12">
          Track your movement, unlock your potential.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}
