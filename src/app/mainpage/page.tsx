"use client";
import React from "react";

const Mainpage: React.FC = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden w-full">
      {/* Background Image Full Width */}
      <div className="absolute inset-0">
        <img
          src="/logo/main.avif"
          alt="HRMS Background"
          className="w-full h-full object-cover"
        />
        {/* DARK overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60"></div>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 px-6 max-w-3xl">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 drop-shadow-xl">
          Welcome to <span className="text-indigo-400">HRMS</span>
        </h1>
        <p className="text-gray-200 mb-10 text-lg leading-relaxed">
          Streamline your HR processes with a modern, secure, and easy-to-use
          platform for managing employees, payroll, attendance, and more.
        </p>
        <a
          href="/login"
          className="inline-block bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3 px-10 rounded-lg shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-blue-700 transition-all duration-300 font-semibold transform hover:-translate-y-1"
        >
          Go to Login
        </a>
      </div>

      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-500/20 rounded-full mix-blend-multiply blur-3xl animate-pulse delay-1000"></div>
    </section>
  );
};

export default Mainpage;
