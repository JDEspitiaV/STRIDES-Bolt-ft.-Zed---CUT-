"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { redirect } from "next/navigation";

export default function AthleteDashboard() {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect if not logged in or if the role is not athlete
  if (!user || userRole !== 'athlete') {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome, Athlete!</h1>
      <p>This is your athlete dashboard.</p>
      {/* Athlete-specific content will go here */}
    </div>
  );
}
