"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Leave = {
  id: number;
  reason: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  daysRequested: number;
  submittedDate: string;
  department: string;
};

// ✅ Type for backend response leave object
type LeaveApiResponse = {
  reason: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  applied_on: string;
  department?: string;
};

export default function LeaveSection() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user email and department from localStorage
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      if (parsed.email) setEmail(parsed.email);
      if (parsed.department) setDepartment(parsed.department);
    }
  }, []);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "✓";
      case "rejected":
        return "✗";
      default:
        return "⏳";
    }
  };

  // Fetch leaves for the logged-in employee
  const fetchLeaves = useCallback(async () => {
    if (!email) return;
    setLoading(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/accounts/list_leaves/?email=${email}`
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      const leavesArray: LeaveApiResponse[] = Array.isArray(data.leaves)
        ? data.leaves
        : [];

      const mappedLeaves: Leave[] = leavesArray.map((leave) => ({
        id: Math.random(), // temporary id if backend doesn't provide one
        reason: leave.reason,
        leaveType: leave.leave_type,
        startDate: leave.start_date,
        endDate: leave.end_date,
        status: leave.status,
        daysRequested:
          Math.ceil(
            (new Date(leave.end_date).getTime() -
              new Date(leave.start_date).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1,
        submittedDate: leave.applied_on,
        department: leave.department || "",
      }));

      setLeaves(mappedLeaves);
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // Submit new leave
  const handleAddLeave = async () => {
    if (!reason || !startDate || !endDate) {
      alert("Please fill all fields");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert("End date cannot be before start date");
      return;
    }
    if (!email) {
      alert("User info not found. Please login again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/accounts/apply_leave/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            department: department,
            reason,
            start_date: startDate,
            end_date: endDate,
            leave_type: reason.toLowerCase().replace(" ", "_"),
            status: "Pending",
          }),
        }
      );

      if (!res.ok) {
        let errMsg = `Failed to submit leave request (status: ${res.status})`;
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(errMsg);
      }

      // Reset form
      setReason("");
      setStartDate("");
      setEndDate("");

      // Refresh leaves
      fetchLeaves();
    } catch (err) {
      console.error("Leave submission error:", err);
      alert("Failed to submit leave request: " + (err as Error).message);
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
                <span>
                  {Math.ceil(
                    (new Date(endDate).getTime() -
                      new Date(startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1}{" "}
                  day(s)
                </span>
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
                        <td className="py-4 pr-4">
                          {leave.daysRequested} day(s)
                        </td>
                        <td className="py-4 pr-4">
                          {formatDate(leave.submittedDate)}
                        </td>
                        <td className="py-4">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              leave.status.toLowerCase() === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : leave.status.toLowerCase() === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            <span className="mr-1.5">
                              {getStatusIcon(leave.status)}
                            </span>
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
