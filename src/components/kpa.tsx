"use client";

import { useState } from "react";
import Link from "next/link";

// Sample KPA data - this is what you show on KPA page
const kpaData = [
  {
    id: 1,
    area: "Frontend Development",
    description: "Building user interfaces and components",
    responsibilities: ["React components", "UI/UX implementation", "Performance optimization"]
  },
  {
    id: 2, 
    area: "Backend Development",
    description: "Server-side logic and APIs",
    responsibilities: ["REST APIs", "Database design", "Authentication"]
  },
  {
    id: 3,
    area: "Code Quality",
    description: "Maintaining code standards",
    responsibilities: ["Code reviews", "Testing", "Documentation"]
  }
];

export default function KPAPage() {
const [kpas] = useState(kpaData);
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-black">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Key Performance Areas</h1>
          <Link 
            href="/kra" 
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Go to KRA →
          </Link>
        </div>

        {/* KPA Cards */}
        <div className="space-y-6">
          {kpas.map((kpa) => (
            <div key={kpa.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{kpa.area}</h2>
              <p className="text-gray-600 mb-4">{kpa.description}</p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Responsibilities:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {kpa.responsibilities.map((resp, index) => (
                    <li key={index} className="text-gray-600">{resp}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Add New KPA Button */}
        <button className="mt-8 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition">
          + Add New KPA
        </button>
      </div>
    </div>
  );
}