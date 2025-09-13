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

export default function Reports() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("manager_tasks");
    if (stored) setTasks(JSON.parse(stored));
  }, []);

  // Group tasks by employee
  const tasksByEmployee = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.assignedTo]) acc[task.assignedTo] = [];
    acc[task.assignedTo].push(task);
    return acc;
  }, {});

  // Filter today's tasks
  const todayDate = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(task => task.createdAt.startsWith(todayDate));

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Reports 📊</h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 mb-2">Total Tasks Sent</h2>
              <p className="text-xl font-bold text-gray-800">{tasks.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 mb-2">Tasks Completed</h2>
              <p className="text-xl font-bold text-green-700">{tasks.filter(t => t.status === "Completed").length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 mb-2">Tasks Pending</h2>
              <p className="text-xl font-bold text-yellow-700">{tasks.filter(t => t.status === "Pending").length}</p>
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold mb-3">Today's Tasks ({todayTasks.length})</h2>
            {todayTasks.length === 0 ? (
              <p className="text-gray-500">No tasks assigned today.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {todayTasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border border-gray-200 transition-shadow ${
                      task.status === "Completed" ? "bg-green-50" : "bg-white hover:shadow-lg"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-gray-800">{task.title}</h3>
                      <span className="text-xs text-gray-500">
                        {task.assignedTo}
                      </span>
                    </div>
                    <p className="text-gray-600">{task.description}</p>
                    <div className="mt-1 text-sm">
                      Status:{" "}
                      <span className={`font-medium ${task.status === "Completed" ? "text-green-700" : "text-yellow-700"}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks by Employee */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow border border-gray-100">
            <h2 className="text-lg font-semibold mb-3">Employee-wise Task Report</h2>
            {Object.keys(tasksByEmployee).length === 0 ? (
              <p className="text-gray-500">No tasks assigned yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {Object.entries(tasksByEmployee).map(([employee, empTasks]) => {
                  const completed = empTasks.filter(t => t.status === "Completed").length;
                  const pending = empTasks.filter(t => t.status === "Pending").length;
                  return (
                    <div key={employee} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="font-semibold text-gray-800 mb-1">{employee}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Total: {empTasks.length}, Completed: {completed}, Pending: {pending}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {empTasks.map(task => (
                          <div key={task.id} className={`p-2 rounded border text-sm ${
                            task.status === "Completed" ? "bg-green-100 border-green-300" : "bg-yellow-50 border-yellow-300"
                          }`}>
                            {task.title} - {task.status}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
