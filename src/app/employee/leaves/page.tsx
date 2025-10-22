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

type LeaveApiResponse = {
  email?: string;
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
  const [reason, setReason] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  const showDialog = (message: string) => {
    setDialogMessage(message);
    setDialogOpen(true);
  };

  // Get logged-in user info once
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      if (parsed.email) setEmail(parsed.email);
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

  // Fetch leaves only after email is set
  const fetchLeaves = useCallback(async () => {
    if (!email) return;
    setLoading(true);

    try {
      // Only send valid query params (no start_date_lte, end_date_gte, etc.)
      const queryParams: Record<string, string> = { email };
      const queryString = new URLSearchParams(queryParams).toString();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_leaves/?${queryString}`
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      const leavesArray: LeaveApiResponse[] = Array.isArray(data.leaves)
        ? (data.leaves as LeaveApiResponse[]).filter(
            (leave: LeaveApiResponse) => leave.email === email
          )
        : [];

      const mappedLeaves: Leave[] = leavesArray.map((leave: LeaveApiResponse, idx: number) => ({
        id: idx + 1, // fallback id if backend doesn't provide one
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

  const handleAddLeave = async () => {
    if (!reason || !startDate || !endDate || !leaveType) {
      showDialog("Please fill all fields");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      showDialog("End date cannot be before start date");
      return;
    }

    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      showDialog("User info not found. Please login again.");
      return;
    }

    const parsedUserInfo = JSON.parse(userInfo);
    const userEmail = parsedUserInfo.email;
    const userDepartment = parsedUserInfo.department || "";

    if (!userEmail) {
      showDialog("User email not found. Please login again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const appliedOnDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      // Only send valid backend fields; do not send _lte/_gte fields
      const payload = {
        email: userEmail,
        department: userDepartment,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
        status: "Pending",
        applied_on: appliedOnDate,
      };
      // No extra/legacy fields sent in payload
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/apply_leave/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        let errorBody: unknown;
        try {
          errorBody = await res.json();
        } catch {
          const text = await res.text();
          errorBody = text;
        }
        // Custom error handling: show friendly dialog instead of throwing
        let errorString =
          typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody);
        if (
          errorString.toLowerCase().includes("overlapping") ||
          errorString.toLowerCase().includes("already have a leave")
        ) {
          showDialog("You already have a leave during these dates. Please pick a different range.");
        } else {
          showDialog("Failed to submit leave request. Please try again.");
        }
        return; // Don't proceed further
      }

      setReason("");
      setLeaveType("");
      setStartDate("");
      setEndDate("");

      fetchLeaves();
    } catch (err) {
      console.error("Leave submission error:", err);
      // Show a general friendly error, don't throw
      showDialog("Failed to submit leave request. Please try again.");
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
                onChange={(e) => {
                  setReason(e.target.value);
                  setLeaveType(e.target.value.toLowerCase().replace(" ", "_"));
                }}
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

        {/* Leave History */}
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
                              leave.status.toLowerCase() === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : leave.status.toLowerCase() === "approved"
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
      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Notice</h3>
            <p className="text-gray-600 mb-5">{dialogMessage}</p>
            <button
              onClick={() => setDialogOpen(false)}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
