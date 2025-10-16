

"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiUser,
  FiMail,
  FiBriefcase,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from "react-icons/fi";

type Employee = {
  email_id: string;
  fullname: string;
  department?: string | null;
  designation?: string | null;
};

type LeaveRequest = {
  id: string;
  email: string;
  applied_on: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
};

const StatusBadge = ({ status }: { status?: string }) => {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    Pending: { color: "bg-yellow-100 text-yellow-800", icon: <FiClock className="mr-1" /> },
    Approved: { color: "bg-green-100 text-green-800", icon: <FiCheckCircle className="mr-1" /> },
    Rejected: { color: "bg-red-100 text-red-800", icon: <FiXCircle className="mr-1" /> },
  };
  const config = status ? statusConfig[status] : { color: "bg-gray-100 text-gray-800", icon: <FiClock className="mr-1" /> };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      {config.icon}
      {status || "Unknown"}
    </span>
  );
};

export default function ManagerLeaveApproval() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<"Pending" | "Approved" | "Rejected" | "All">("All");

  const getLeaveKey = (leave: LeaveRequest) =>
    `${leave.email}-${leave.start_date}-${leave.end_date}-${leave.leave_type}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const empRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`);
      const empData = await empRes.json();
      setEmployees(empData.employees || []);

      const leaveRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_leaves/`);
      const leaveData = await leaveRes.json();
      setLeaveRequests(leaveData.leaves || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateLeaveStatus = async (leave: LeaveRequest, status: "Approved" | "Rejected") => {
    setUpdatingKey(leave.id);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/update_leave/${leave.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Backend error:", errData);
        alert(errData.error || "Failed to update leave status.");
        return;
      }

      const updatedLeave = await res.json();

      setLeaveRequests((prev) =>
        prev.map((lr) =>
          lr.id === leave.id ? { ...lr, status: updatedLeave.leave?.status || status } : lr
        )
      );

      alert(`Leave ${status} successfully!`);
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error. Could not update leave status.");
    } finally {
      setUpdatingKey(null);
    }
  };

  const getEmployee = (email: string | undefined) =>
    employees.find((e) => e.email_id.toLowerCase() === email?.toLowerCase()) || {
      fullname: email || "Unknown Email",
      designation: "-",
      department: "-",
    };

  const filteredLeaves = leaveRequests.filter((lr) => filter === "All" || lr.status === filter);

  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter((lr) => lr.status === "Pending").length,
    approved: leaveRequests.filter((lr) => lr.status === "Approved").length,
    rejected: leaveRequests.filter((lr) => lr.status === "Rejected").length,
  };

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Leave Management Dashboard</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[ 
              { label: "Total Requests", value: stats.total, icon: <FiCalendar />, color: "blue" },
              { label: "Pending", value: stats.pending, icon: <FiClock />, color: "yellow" },
              { label: "Approved", value: stats.approved, icon: <FiCheckCircle />, color: "green" },
              { label: "Rejected", value: stats.rejected, icon: <FiXCircle />, color: "red" },
            ].map((stat, idx) => (
              <motion.div
                whileHover={{ scale: 1.03 }}
                key={idx}
                className="bg-white rounded-xl shadow p-4 border border-gray-100 flex items-center gap-4"
              >
                <div className={`rounded-full bg-${stat.color}-100 p-3`}>
                  {React.cloneElement(stat.icon, { className: `text-${stat.color}-600 text-xl` })}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2 mb-6 mt-2">
            {(["All", "Pending", "Approved", "Rejected"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center ${
                  filter === status
                    ? "bg-blue-600 text-white shadow"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {status} {status !== "All" ? `(${stats[status.toLowerCase() as keyof Omit<typeof stats, "total">]})` : ""}
              </button>
            ))}
          </div>

          {/* Leave requests */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <FiCalendar className="mx-auto text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No leave requests found</h3>
              <p className="text-gray-500">{filter !== "All" ? `No ${filter.toLowerCase()} leave requests.` : "No leave requests submitted yet."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <AnimatePresence>
                {filteredLeaves.map((lr) => {
                  const emp = getEmployee(lr.email);
                  const leaveKey = getLeaveKey(lr);

                  return (
                    <motion.div
                      key={leaveKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white p-4 md:p-6 rounded-xl shadow border border-gray-100 hover:shadow-lg transition-shadow flex flex-col"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-gray-800 text-lg">{emp.fullname}</h3>
                        </div>

                        <div className="m-2"><StatusBadge status={lr.status} /></div>
                         
                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                          <div className="flex items-center"><FiMail className="mr-2 text-gray-400" /> {lr.email}</div>
                          <div className="flex items-center"><FiBriefcase className="mr-2 text-gray-400" /> {emp.designation || "N/A"}</div>
                          <div className="flex items-center"><FiUser className="mr-2 text-gray-400" /> {emp.department || "N/A"}</div>
                          <div className="flex items-center"><FiCalendar className="mr-2 text-gray-400" /> Applied on: {new Date(lr.applied_on).toLocaleDateString()}</div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Leave Details</p>
                            <p className="text-sm text-gray-600">{lr.leave_type} leave from {new Date(lr.start_date).toLocaleDateString()} to {new Date(lr.end_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Reason</p>
                            <p className="text-sm text-gray-600">{lr.reason}</p>
                          </div>
                        </div>

                        {lr.status === "Pending" && (
                          <div className="flex flex-col gap-2 mt-2">
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => updateLeaveStatus(lr, "Approved")}
                                disabled={updatingKey === lr.id}
                                className={`px-4 py-2 rounded-lg text-white ${updatingKey === lr.id ? "bg-green-400" : "bg-green-600 hover:bg-green-700"}`}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateLeaveStatus(lr, "Rejected")}
                                disabled={updatingKey === lr.id}
                                className={`px-4 py-2 rounded-lg text-white ${updatingKey === lr.id ? "bg-red-400" : "bg-red-600 hover:bg-red-700"}`}
                              >
                                Reject
                              </button>
                            </div>
                            {updatingKey === lr.id && <p className="text-xs text-gray-500">Updating...</p>}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}