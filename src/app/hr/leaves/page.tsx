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
        const res = await fetch("http://127.0.0.1:8000/api/accounts/list_leaves/");
        const data = await res.json();

        const mappedLeaves: Leave[] = (data.leaves ?? []).map(
          (item: any, index: number) => ({
            id: item.id ?? index + 1,
            employeeId: item.employeeId ?? item.email,
            name: item.name ?? (item.email ? item.email.split("@")[0] : ""),
            email: item.email,
            reason: item.reason,
            startDate: item.startDate ?? item.start_date,
            endDate: item.endDate ?? item.end_date,
            status: item.status,
            daysRequested: item.daysRequested ?? 1,
            submittedDate: item.submittedDate ?? item.submitted_date ?? item.start_date,
          })
        );

        setLeaves(mappedLeaves);
      } catch (err) {
        console.error("Error fetching leaves:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600">Loading leave requests...</span>
    </div>
  );

  // Filter leaves
  const filteredLeaves =
    filter === "All" ? leaves : leaves.filter((l) => l.status === filter);

  return (
    <DashboardLayout role="hr">
      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">Employee Leave Requests</h2>
          
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {["All", "Pending", "Approved", "Rejected"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === tab
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setFilter(tab as any)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-700">No {filter.toLowerCase()} leaves found</h3>
            <p className="mt-1 text-gray-500">There are currently no {filter.toLowerCase()} leave requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-600 uppercase">
                  <th className="p-4 font-medium">Employee ID</th>
                  <th className="p-4 font-medium">Reason</th>
                  <th className="p-4 font-medium">Period</th>
                  <th className="p-4 font-medium">Days</th>
                  <th className="p-4 font-medium">Submitted</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => setSelectedLeave(leave)}
                  >
                    <td className="p-4 font-medium">{leave.employeeId}</td>
                    <td className="p-4 max-w-xs truncate">{leave.reason}</td>
                    <td className="p-4">
                      {leave.startDate} → {leave.endDate}
                    </td>
                    <td className="p-4 text-center">{leave.daysRequested}</td>
                    <td className="p-4">{leave.submittedDate}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          leave.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : leave.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leave Details Modal */}
        {selectedLeave && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative animate-scaleIn">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                onClick={() => setSelectedLeave(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-blue-700">Leave Request Details</h3>
                <p className="text-gray-500 text-sm mt-1">ID: {selectedLeave.id}</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Employee ID</p>
                    <p className="font-medium">{selectedLeave.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedLeave.name}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium break-all">{selectedLeave.email}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="font-medium">{selectedLeave.reason}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium">{selectedLeave.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-medium">{selectedLeave.endDate}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Days Requested</p>
                    <p className="font-medium">{selectedLeave.daysRequested}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted On</p>
                    <p className="font-medium">{selectedLeave.submittedDate}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedLeave.status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : selectedLeave.status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {selectedLeave.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </DashboardLayout>
  );
}