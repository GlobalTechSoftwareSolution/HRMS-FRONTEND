"use client";
import React from "react";

const Mainpage: React.FC = () => {
  return (
    <main className="flex-grow flex flex-col items-center justify-center px-4 text-center bg-gradient-to-b from-blue-50 to-white">
      {/* Main content with welcome message centered */}
      <h1 className="text-5xl font-extrabold text-blue-700 mb-6 drop-shadow-sm">
        Welcome to <span className="text-blue-900">HRMS</span>
      </h1>
      <p className="text-gray-600 mb-8 max-w-xl">
        Streamline your HR processes with a modern, secure, and easy-to-use platform.
      </p>
      <a
        href="/login"
        className="bg-blue-600 text-white py-3 px-8 rounded-lg shadow-md hover:shadow-lg hover:bg-blue-700 transition-all duration-300 font-semibold transform hover:-translate-y-1"
      >
        Go to Login
      </a>
    </main>
  );
};

export default Mainpage;
