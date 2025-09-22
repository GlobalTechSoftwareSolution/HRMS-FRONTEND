"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {  
  FiCalendar, 
  FiUser, 
  FiMail, 
  FiBriefcase, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock 
} from "react-icons/fi";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Employee = {
  email_id: string;
  fullname: string;
  department?: string | null;
  designation?: string | null;
};

type LeaveRequest = {
  email_id: string;
  applied_on: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
};

// Status badge component
// Status badge component
const StatusBadge = ({ status }: { status?: string }) => {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  Pending: { color: "bg-yellow-100 text-yellow-800", icon: <FiClock className="mr-1" /> },
  Approved: { color: "bg-green-100 text-green-800", icon: <FiCheckCircle className="mr-1" /> },
  Rejected: { color: "bg-red-100 text-red-800", icon: <FiXCircle className="mr-1" /> },
};


  const config = status && statusConfig[status] ? statusConfig[status] : { color: "bg-gray-100 text-gray-800", icon: <FiClock className="mr-1" /> };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      {config.icon}
      {status || "Unknown"}
    </span>
  );
};


export default function ManagerDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<"Pending" | "Approved" | "Rejected" | "All">("All");

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: empData } = await supabase.from("accounts_employee").select("*");
      if (empData) setEmployees(empData);

      const { data: leaveData } = await supabase
        .from("accounts_leave")
        .select("*")
        .order("applied_on", { ascending: false });
        
      if (leaveData) setLeaveRequests(leaveData as LeaveRequest[]);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update leave status
  const updateLeaveStatus = async (
    email_id: string,
    applied_on: string,
    status: "Pending" | "Approved" | "Rejected"
  ) => {
    const key = `${email_id}-${applied_on}`;
    setUpdatingKey(key);

    const { error } = await supabase
      .from("accounts_leave")
      .update({ status })
      .eq("email_id", email_id)
      .eq("applied_on", applied_on);

    if (error) {
      console.error("Update error:", error);
    } else {
      setLeaveRequests((prev) =>
        prev.map((lr) =>
          lr.email_id === email_id && lr.applied_on === applied_on
            ? { ...lr, status }
            : lr
        )
      );
    }
    setUpdatingKey(null);
  };

  // Helper: get employee by email
  const getEmployee = (email_id: string) =>
    employees.find((e) => e.email_id === email_id) || {
      fullname: "Unknown Employee",
      designation: "-",
      department: "-",
    };

  // Filtered leaves
  const filteredLeaves = leaveRequests.filter((lr) => filter === "All" || lr.status === filter);

  // Stats
  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(lr => lr.status === "Pending").length,
    approved: leaveRequests.filter(lr => lr.status === "Approved").length,
    rejected: leaveRequests.filter(lr => lr.status === "Rejected").length,
  };

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Leave Management Dashboard</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div whileHover={{ scale: 1.03 }} className="bg-white rounded-xl shadow p-4 border border-gray-100 flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3"><FiCalendar className="text-blue-600 text-xl" /></div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} className="bg-white rounded-xl shadow p-4 border border-gray-100 flex items-center gap-4">
              <div className="rounded-full bg-yellow-100 p-3"><FiClock className="text-yellow-600 text-xl" /></div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} className="bg-white rounded-xl shadow p-4 border border-gray-100 flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3"><FiCheckCircle className="text-green-600 text-xl" /></div>
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-800">{stats.approved}</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} className="bg-white rounded-xl shadow p-4 border border-gray-100 flex items-center gap-4">
              <div className="rounded-full bg-red-100 p-3"><FiXCircle className="text-red-600 text-xl" /></div>
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-800">{stats.rejected}</p>
              </div>
            </motion.div>
          </div>

          {/* Status filter buttons */}
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
                {status} {status !== "All" && `(${stats[status.toLowerCase() as keyof Omit<typeof stats, "total">]})`}
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
            <div className="flex flex-col gap-4 mb-6">
              <AnimatePresence>
                {filteredLeaves.map((lr) => {
  const emp = getEmployee(lr.email_id);
  const key = `${lr.email_id}-${lr.applied_on}`; // unique string key
                  return (
                    <motion.div
      key={key} // use the unique string key
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white p-4 md:p-6 rounded-xl shadow border border-gray-100 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-gray-800 text-lg">{emp.fullname}</h3>
                            <StatusBadge status={lr.status} />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center"><FiMail className="mr-2 text-gray-400" />{lr.email_id}</div>
                            <div className="flex items-center"><FiBriefcase className="mr-2 text-gray-400" />{emp.designation || "N/A"}</div>
                            <div className="flex items-center"><FiUser className="mr-2 text-gray-400" />{emp.department || "N/A"}</div>
                            <div className="flex items-center"><FiCalendar className="mr-2 text-gray-400" />Applied on: {new Date(lr.applied_on).toLocaleDateString()}</div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Leave Details</p>
                              <p className="text-sm text-gray-600">{lr.leave_type} leave from {new Date(lr.start_date).toLocaleDateString()} to {new Date(lr.end_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Reason</p>
                              <p className="text-sm text-gray-600">{lr.reason}</p>
                            </div>
                          </div>
                        </div>

                        {lr.status === "Pending" && (
                          <div className="flex flex-col gap-2 md:items-end mt-2 md:mt-0">
                            <div className="flex gap-2">
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updateLeaveStatus(lr.email_id, lr.applied_on, "Approved")}
                                disabled={updatingKey === key}
                                className={`flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium ${
                                  updatingKey === key ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                                }`}
                              >
                                <FiCheckCircle className="mr-1" /> Approve
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updateLeaveStatus(lr.email_id, lr.applied_on, "Rejected")}
                                disabled={updatingKey === key}
                                className={`flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium ${
                                  updatingKey === key ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                                }`}
                              >
                                <FiXCircle className="mr-1" /> Reject
                              </motion.button>
                            </div>
                            {updatingKey === key && <p className="text-xs text-gray-500">Updating...</p>}
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
