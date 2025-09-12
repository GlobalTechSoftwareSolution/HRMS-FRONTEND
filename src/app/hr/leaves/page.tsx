"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Leave = {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected";
  daysRequested: number;
  submittedDate: string;
};

export default function HRLeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);

  // Fetch all employee leaves
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await fetch("/api/leaves"); // 👈 your API endpoint
        const data = await res.json();
        setLeaves(data);
      } catch (err) {
        console.error("Error fetching leaves:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  // Handle Approve/Reject
  const handleAction = async (id: number, status: "Approved" | "Rejected") => {
    try {
      await fetch(`/api/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      setLeaves((prev) =>
        prev.map((leave) => (leave.id === id ? { ...leave, status } : leave))
      );
    } catch (err) {
      console.error("Error updating leave:", err);
    }
  };

  if (loading) return <p className="text-center">Loading leave requests...</p>;

  // Filter leaves
  const filteredLeaves =
    filter === "All" ? leaves : leaves.filter((l) => l.status === filter);

  return (
    <DashboardLayout role="hr">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-black">Employee Leave Requests</h2>

        {/* Tabs for filtering */}
        <div className="flex gap-4 mb-6">
          {["All", "Pending", "Approved", "Rejected"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setFilter(tab as any)}
            >
              {tab}
            </button>
          ))}
        </div>

        {filteredLeaves.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No {filter} leaves found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-sm">
                  <th className="p-2 border">Employee ID</th>
                  <th className="p-2 border">Reason</th>
                  <th className="p-2 border">Period</th>
                  <th className="p-2 border">Days</th>
                  <th className="p-2 border">Submitted</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="text-sm text-center hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedLeave(leave)} // ✅ open details
                  >
                    <td className="border p-2">{leave.employeeId}</td>
                    <td className="border p-2">{leave.reason}</td>
                    <td className="border p-2">
                      {leave.startDate} → {leave.endDate}
                    </td>
                    <td className="border p-2">{leave.daysRequested}</td>
                    <td className="border p-2">{leave.submittedDate}</td>
                    <td
                      className={`border p-2 font-medium ${
                        leave.status === "Approved"
                          ? "text-green-600"
                          : leave.status === "Rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {leave.status}
                    </td>
                    <td className="border p-2 space-x-2">
                      <button
                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-xs"
                        onClick={(e) => {
                          e.stopPropagation(); // ✅ prevent row click
                          handleAction(leave.id, "Approved");
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs"
                        onClick={(e) => {
                          e.stopPropagation(); // ✅ prevent row click
                          handleAction(leave.id, "Rejected");
                        }}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leave Details Modal */}
        {selectedLeave && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-3 right-3 text-gray-600 hover:text-black"
                onClick={() => setSelectedLeave(null)}
              >
                ✕
              </button>
              <h3 className="text-lg font-bold mb-4 text-blue-700">
                Leave Details
              </h3>
              <p><span className="font-medium">Employee ID:</span> {selectedLeave.employeeId}</p>
              <p><span className="font-medium">Name:</span> {selectedLeave.name}</p>
              <p><span className="font-medium">Email:</span> {selectedLeave.email}</p>
              <p><span className="font-medium">Reason:</span> {selectedLeave.reason}</p>
              <p><span className="font-medium">From:</span> {selectedLeave.startDate}</p>
              <p><span className="font-medium">To:</span> {selectedLeave.endDate}</p>
              <p><span className="font-medium">Days Requested:</span> {selectedLeave.daysRequested}</p>
              <p><span className="font-medium">Submitted:</span> {selectedLeave.submittedDate}</p>
              <p><span className="font-medium">Status:</span> {selectedLeave.status}</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
