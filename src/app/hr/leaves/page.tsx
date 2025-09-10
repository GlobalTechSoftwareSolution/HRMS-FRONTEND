"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Leave = {
  id: number;
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

  // Fetch all employee leaves (replace with your backend API)
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

      // Update frontend instantly
      setLeaves((prev) =>
        prev.map((leave) => (leave.id === id ? { ...leave, status } : leave))
      );
    } catch (err) {
      console.error("Error updating leave:", err);
    }
  };

  if (loading) return <p className="text-center">Loading leave requests...</p>;

  return (
    <DashboardLayout role="hr">
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-black">Employee Leave Requests</h2>

      {leaves.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No leave requests found.</p>
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
              {leaves.map((leave) => (
                <tr key={leave.id} className="text-sm text-center hover:bg-gray-50">
                  <td className="border p-2">{leave.id}</td>
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
                      onClick={() => handleAction(leave.id, "Approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs"
                      onClick={() => handleAction(leave.id, "Rejected")}
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
    </div>
        </DashboardLayout>
    
  );
}
