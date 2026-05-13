"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";

export default function CoachDashboard() {
  const { user, logOut } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-lg mb-4">Please log in to access the coach dashboard.</p>
        <Link href="/login" className="text-blue-500 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Coach Dashboard</h1>
          <nav>
            <button onClick={logOut} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4">
        <h2 className="text-3xl font-semibold mb-6">Welcome, Coach!</h2>
        <p className="text-xl mb-8">This is your dedicated dashboard.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for Athlete Management Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Manage Athletes</h3>
            <p className="text-gray-600 mb-4">View and manage your athletes' profiles and progress.</p>
            <Link href="/app/coach/athletes" className="text-blue-600 hover:underline">
              Go to Athletes
            </Link>
          </div>

          {/* Placeholder for Sessions Analysis Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Analyze Sessions</h3>
            <p className="text-gray-600 mb-4">Review athlete analysis sessions.</p>
            <Link href="/app/coach/sessions" className="text-blue-600 hover:underline">
              View Sessions
            </Link>
          </div>

          {/* Placeholder for Organization Management */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Organization</h3>
            <p className="text-gray-600 mb-4">Manage organization details and members.</p>
            <Link href="/app/coach/organization" className="text-blue-600 hover:underline">
              Organization Settings
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-gray-200 text-center p-4 mt-8">
        <p>&copy; 2023 STRIDES. All rights reserved.</p>
      </footer>
    </div>
  );
}
