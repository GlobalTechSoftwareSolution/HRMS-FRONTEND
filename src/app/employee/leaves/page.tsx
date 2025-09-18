"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/app/lib/supabaseClient";

type Leave = {
  id: number;
  reason: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected";
  daysRequested: number;
  submittedDate: string;
};

export default function LeaveSection() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const email = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo")!).email
    : "";

  // Calculate business days
  const calculateBusinessDays = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let count = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    }

    return count;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = (status: Leave["status"]) => {
    switch (status) {
      case "Approved":
        return "✓";
      case "Rejected":
        return "✗";
      default:
        return "⏳";
    }
  };

  // Fetch leaves from Supabase
  const fetchLeaves = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("accounts_leave")
        .select("*")
        .eq("email_id", email)
        .order("applied_on", { ascending: false });

      if (error) throw error;

      const mappedLeaves: Leave[] = (data || []).map((leave: any) => ({
        id: leave.id,
        reason: leave.reason,
        startDate: leave.start_date,
        endDate: leave.end_date,
        status: leave.status as "Pending" | "Approved" | "Rejected",
        daysRequested: calculateBusinessDays(leave.start_date, leave.end_date),
        submittedDate: leave.applied_on,
      }));

      setLeaves(mappedLeaves);
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Add new leave
  const handleAddLeave = async () => {
    if (!reason || !startDate || !endDate) {
      alert("Please fill all fields");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("End date cannot be before start date");
      return;
    }

    setIsSubmitting(true);

    try {
      const daysRequested = calculateBusinessDays(startDate, endDate);

      const { data, error } = await supabase.from("accounts_leave").insert([
        {
          email_id: email,
          reason,
          start_date: startDate,
          end_date: endDate,
          status: "Pending",
          applied_on: new Date().toISOString().split("T")[0],
        },
      ]);

      if (error) throw error;

      setReason("");
      setStartDate("");
      setEndDate("");

      fetchLeaves(); // Refresh list
    } catch (err) {
      console.error("Failed to add leave:", err);
      alert("Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="employee">
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Leave Management</h2>
          <p className="text-gray-600">Request and track your time off</p>
        </div>

        {/* Add Leave Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
            <span className="mr-2">📋</span> New Leave Request
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border border-gray-300 rounded-md p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select a reason</option>
                <option value="Vacation">Vacation</option>
                <option value="Medical Appointment">Medical Appointment</option>
                <option value="Personal Work">Personal Work</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded-md p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded-md p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {startDate && endDate && (
                <span>{calculateBusinessDays(startDate, endDate)} business day(s)</span>
              )}
            </div>

            <button
              onClick={handleAddLeave}
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">⏳</span> Processing...
                </>
              ) : (
                <>
                  <span className="mr-2">+</span> Submit Request
                </>
              )}
            </button>
          </div>
        </div>

        {/* Leave Summary & History */}
        {loading ? (
          <p>Loading leaves...</p>
        ) : (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
              <span className="mr-2">📅</span> Leave History
            </h3>

            {leaves.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <div className="text-4xl mb-3">📋</div>
                <p>No leave requests yet</p>
                <p className="text-sm mt-1">Submit your first request above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                      <th className="pb-3">Reason</th>
                      <th className="pb-3">Period</th>
                      <th className="pb-3">Duration</th>
                      <th className="pb-3">Submitted</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((leave) => (
                      <tr
                        key={leave.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 pr-4">{leave.reason}</td>
                        <td className="py-4 pr-4">
                          <div>{formatDate(leave.startDate)}</div>
                          <div className="text-gray-400 text-sm">
                            to {formatDate(leave.endDate)}
                          </div>
                        </td>
                        <td className="py-4 pr-4">{leave.daysRequested} day(s)</td>
                        <td className="py-4 pr-4">{formatDate(leave.submittedDate)}</td>
                        <td className="py-4">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              leave.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : leave.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            <span className="mr-1.5">{getStatusIcon(leave.status)}</span>
                            {leave.status}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
