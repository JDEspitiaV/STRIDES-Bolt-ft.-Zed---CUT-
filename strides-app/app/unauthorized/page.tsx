import React from 'react';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="text-lg text-gray-700 mb-6">
          You do not have the necessary permissions to view this page.
        </p>
        <a
          href="/login"
          className="text-blue-600 hover:underline"
        >
          Go back to Login
        </a>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
