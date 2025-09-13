"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Employee = { id: string; name: string };
type AttendanceRecord = { employeeId: string; date: string; status: "Present" | "Absent" | "Late" | "Half Day" };
type Task = { id: string; title: string; assignedTo: string; status: "Pending" | "Completed"; };
type LeaveRequest = { id: string; employeeId: string; reason: string; date: string; status: "Pending" | "Approved" | "Rejected"; };

export default function ManagerDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  
  const todayDate = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const storedEmployees = localStorage.getItem("employees");
    const storedAttendance = localStorage.getItem("attendance");
    const storedTasks = localStorage.getItem("manager_tasks");
    const storedLeaves = localStorage.getItem("leave_requests");
    if (storedEmployees) setEmployees(JSON.parse(storedEmployees));
    if (storedAttendance) setAttendance(JSON.parse(storedAttendance));
    if (storedTasks) setTasks(JSON.parse(storedTasks));
    if (storedLeaves) setLeaveRequests(JSON.parse(storedLeaves));
  }, []);

  const approveLeave = (id: string) => {
    const updated = leaveRequests.map(lr => lr.id === id ? { ...lr, status: "Approved" } : lr);
    setLeaveRequests(updated);
    localStorage.setItem("leave_requests", JSON.stringify(updated));
  };

  const rejectLeave = (id: string) => {
    const updated = leaveRequests.map(lr => lr.id === id ? { ...lr, status: "Rejected" } : lr);
    setLeaveRequests(updated);
    localStorage.setItem("leave_requests", JSON.stringify(updated));
  };

  const getTodayAttendance = (employeeId: string) => {
    const record = attendance.find(a => a.employeeId === employeeId && a.date === todayDate);
    return record ? record.status : "Absent";
  };

  const presentEmployees = employees.filter(e => {
    const status = getTodayAttendance(e.id);
    return status === "Present" || status === "Late" || status === "Half Day";
  });

  const absentEmployees = employees.filter(e => getTodayAttendance(e.id) === "Absent");

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 max-w-6xl mx-auto">

        <h1 className="text-2xl md:text-3xl font-bold mb-6">Manager Dashboard 📋</h1>

        {/* Attendance Summary */}
        <h2 className="text-xl font-semibold mb-3">Today's Attendance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <div className="bg-green-50 border border-green-300 p-4 rounded-xl">
            <h3 className="font-semibold text-green-800">Present</h3>
            <ul className="text-gray-700 text-sm mt-1">
              {presentEmployees.length > 0 ? (
                presentEmployees.map(e => <li key={e.id}>✅ {e.name}</li>)
              ) : (
                <li className="text-gray-400 italic">No one present</li>
              )}
            </ul>
          </div>

          <div className="bg-red-50 border border-red-300 p-4 rounded-xl">
            <h3 className="font-semibold text-red-800">Absent</h3>
            <ul className="text-gray-700 text-sm mt-1">
              {absentEmployees.length > 0 ? (
                absentEmployees.map(e => <li key={e.id}>❌ {e.name}</li>)
              ) : (
                <li className="text-gray-400 italic">No one absent</li>
              )}
            </ul>
          </div>

        </div>

        {/* Team Report */}
        <h2 className="text-xl font-semibold mb-3">Team Tasks & Reports</h2>
        {employees.map(emp => {
          const empTasks = tasks.filter(t => t.assignedTo === emp.id);
          const completed = empTasks.filter(t => t.status === "Completed").length;
          const pending = empTasks.filter(t => t.status === "Pending").length;

          return (
            <div key={emp.id} className="bg-white p-4 md:p-6 rounded-xl shadow border border-gray-100 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">{emp.name}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getTodayAttendance(emp.id) === "Absent" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                  }`}
                >
                  {getTodayAttendance(emp.id)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Tasks: Total {empTasks.length}, Completed {completed}, Pending {pending}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {empTasks.map(t => (
                  <div key={t.id} className={`p-2 rounded border text-sm ${t.status === "Completed" ? "bg-green-50 border-green-300" : "bg-yellow-50 border-yellow-300"}`}>
                    {t.title} - {t.status}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Leave Approvals */}
        <h2 className="text-xl font-semibold mb-3">Leave Approvals</h2>
        {leaveRequests.filter(lr => lr.status === "Pending").length === 0 ? (
          <p className="text-gray-500 mb-6">No pending leave requests</p>
        ) : (
          <div className="flex flex-col gap-4 mb-6">
            {leaveRequests.filter(lr => lr.status === "Pending").map(lr => (
              <div key={lr.id} className="bg-white p-4 md:p-6 rounded-xl shadow border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{employees.find(e => e.id === lr.employeeId)?.name}</p>
                  <p className="text-gray-600 text-sm">Date: {lr.date}</p>
                  <p className="text-gray-600 text-sm">Reason: {lr.reason}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveLeave(lr.id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">Approve</button>
                  <button onClick={() => rejectLeave(lr.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
