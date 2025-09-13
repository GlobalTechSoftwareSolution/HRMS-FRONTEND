"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Task = {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: "Pending" | "Completed";
  createdAt: string;
};

type Employee = {
  id: string;
  name: string;
};

type AttendanceRecord = {
  employeeId: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "Half Day";
};

type LeaveRequest = {
  id: string;
  employeeId: string;
  reason: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
};

export default function ManagerDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const todayDate = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const storedEmployees = localStorage.getItem("employees");
    const storedTasks = localStorage.getItem("manager_tasks");
    const storedAttendance = localStorage.getItem("attendance");
    const storedLeaves = localStorage.getItem("leave_requests");

    if (storedEmployees) setEmployees(JSON.parse(storedEmployees));
    if (storedTasks) setTasks(JSON.parse(storedTasks));
    if (storedAttendance) setAttendance(JSON.parse(storedAttendance));
    if (storedLeaves) setLeaveRequests(JSON.parse(storedLeaves));
  }, []);

  const saveLeaves = (updatedLeaves: LeaveRequest[]) => {
    setLeaveRequests(updatedLeaves);
    localStorage.setItem("leave_requests", JSON.stringify(updatedLeaves));
  };

  const approveLeave = (id: string) => {
    const updated = leaveRequests.map(lr =>
      lr.id === id ? { ...lr, status: "Approved" } : lr
    );
    saveLeaves(updated);
  };

  const rejectLeave = (id: string) => {
    const updated = leaveRequests.map(lr =>
      lr.id === id ? { ...lr, status: "Rejected" } : lr
    );
    saveLeaves(updated);
  };

  const getTodayAttendance = (employeeId: string) => {
    const record = attendance.find(
      (a) => a.employeeId === employeeId && a.date === todayDate
    );
    return record ? record.status : "Absent";
  };

  const getEmployeeTasks = (employeeId: string) =>
    tasks.filter((t) => t.assignedTo === employeeId);

  const getEmployeeName = (id: string) =>
    employees.find(e => e.id === id)?.name || "Unknown";

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Manager Dashboard 📋</h1>

          {/* Team Report */}
          <h2 className="text-xl font-semibold mb-3">Team Report</h2>
          <div className="flex flex-col gap-4 mb-6">
            {employees.map((emp) => {
              const empAttendance = getTodayAttendance(emp.id);
              const empTasks = getEmployeeTasks(emp.id);
              const completed = empTasks.filter(t => t.status === "Completed").length;
              const pending = empTasks.filter(t => t.status === "Pending").length;

              return (
                <div
                  key={emp.id}
                  className="bg-white p-4 md:p-6 rounded-xl shadow border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-800">{emp.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        empAttendance === "Present" || empAttendance === "Late"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {empAttendance}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Tasks: Total {empTasks.length}, Completed {completed}, Pending {pending}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {empTasks.map(task => (
                      <div
                        key={task.id}
                        className={`p-2 rounded border text-sm ${
                          task.status === "Completed"
                            ? "bg-green-50 border-green-300"
                            : "bg-yellow-50 border-yellow-300"
                        }`}
                      >
                        {task.title} - {task.status}
                      </div>
                    ))}
                    {empTasks.length === 0 && (
                      <div className="text-gray-400 italic col-span-2">
                        No tasks assigned
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leave Approvals */}
          <h2 className="text-xl font-semibold mb-3">Leave Approvals</h2>
          {leaveRequests.filter(lr => lr.status === "Pending").length === 0 ? (
            <p className="text-gray-500 mb-6">No pending leave requests</p>
          ) : (
            <div className="flex flex-col gap-4 mb-6">
              {leaveRequests
                .filter(lr => lr.status === "Pending")
                .map(lr => (
                  <div
                    key={lr.id}
                    className="bg-white p-4 md:p-6 rounded-xl shadow border border-gray-100 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{getEmployeeName(lr.employeeId)}</p>
                      <p className="text-gray-600 text-sm">Date: {lr.date}</p>
                      <p className="text-gray-600 text-sm">Reason: {lr.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveLeave(lr.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectLeave(lr.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
