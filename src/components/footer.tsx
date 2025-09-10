"use client";
import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white shadow-inner mt-12">
      <div className="container mx-auto px-6 py-6 text-center text-gray-600 text-sm space-y-2">
        <p>© 2024 HRMS. All rights reserved.</p>
        
        <div className="space-y-1">
          <p>
            Email:{" "}
            <a
              href="mailto:hrglobaltechsoftwaresolutions@gmail.com"
              className="text-blue-600 hover:underline"
            >
              hrglobaltechsoftwaresolutions@gmail.com
            </a>
          </p>
          <p>
            Phone:{" "}
            <a
              href="tel:+919844281875"
              className="text-blue-600 hover:underline"
            >
              +91 98442 81875
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
