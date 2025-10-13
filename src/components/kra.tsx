"use client";
import React, { useState } from "react";
import { FiEdit3, FiCheckCircle, FiTrendingUp, FiList } from "react-icons/fi";

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<"KPA" | "KRA">("KPA");

  const kpaData = [
    { id: 1, area: "Development", description: "Responsible for building and maintaining application modules." },
    { id: 2, area: "Code Quality", description: "Ensure high coding standards and clean code practices." },
    { id: 3, area: "Team Collaboration", description: "Actively participate in sprints and assist teammates." },
  ];

  const kraData = [
    { id: 1, kpa: "Development", result: "Complete 3 new modules this quarter", target: "3", status: "✅ Done" },
    { id: 2, kpa: "Code Quality", result: "Maintain <2% bug rate after release", target: "<2%", status: "🟡 In Progress" },
    { id: 3, kpa: "Delivery", result: "Complete 95% sprint tasks on time", target: "95%", status: "🟢 On Track" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 text-black">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FiTrendingUp className="text-blue-600" /> Performance Overview
        </h1>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab("KPA")}
            className={`flex-1 py-3 text-center font-semibold ${
              activeTab === "KPA" ? "text-blue-600 border-b-4 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FiList className="inline mr-2" /> KPA
          </button>
          <button
            onClick={() => setActiveTab("KRA")}
            className={`flex-1 py-3 text-center font-semibold ${
              activeTab === "KRA" ? "text-blue-600 border-b-4 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FiCheckCircle className="inline mr-2" /> KRA
          </button>
        </div>

        {/* Content */}
        {activeTab === "KPA" ? (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Key Performance Areas</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {kpaData.map((kpa) => (
                <div
                  key={kpa.id}
                  className="border border-gray-200 rounded-lg p-5 bg-gray-50 hover:shadow-md transition duration-200"
                >
                  <h3 className="font-bold text-lg text-gray-800">{kpa.area}</h3>
                  <p className="text-gray-600 text-sm mt-2">{kpa.description}</p>
                  <button className="mt-3 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                    <FiEdit3 /> Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Key Result Areas</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50 text-gray-700 text-left">
                    <th className="py-3 px-4 border-b">KPA</th>
                    <th className="py-3 px-4 border-b">Result</th>
                    <th className="py-3 px-4 border-b">Target</th>
                    <th className="py-3 px-4 border-b">Status</th>
                    <th className="py-3 px-4 border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {kraData.map((kra) => (
                    <tr key={kra.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b font-semibold">{kra.kpa}</td>
                      <td className="py-3 px-4 border-b">{kra.result}</td>
                      <td className="py-3 px-4 border-b">{kra.target}</td>
                      <td className="py-3 px-4 border-b">{kra.status}</td>
                      <td className="py-3 px-4 border-b">
                        <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                          <FiEdit3 /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}