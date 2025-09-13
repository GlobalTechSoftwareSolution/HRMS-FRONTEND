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

export default function TeamReport() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load data from localStorage (simulate backend)
  useEffect(() => {
    const storedEmployees = localStorage.getItem("employees");
    const storedTasks = localStorage.getItem("manager_tasks");

    if (storedEmployees) setEmployees(JSON.parse(storedEmployees));
    if (storedTasks) setTasks(JSON.parse(storedTasks));
  }, []);

  // Get tasks for employee
  const getEmployeeTasks = (employeeId: string) =>
    tasks.filter((t) => t.assignedTo === employeeId);

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Team Report 📋</h1>

          {employees.length === 0 ? (
            <p className="text-gray-500">No employees found.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {employees.map((emp) => {
                const empTasks = getEmployeeTasks(emp.id);
                const completed = empTasks.filter(t => t.status === "Completed").length;
                const pending = empTasks.filter(t => t.status === "Pending").length;

                return (
                  <div
                    key={emp.id}
                    className="bg-white p-4 md:p-6 rounded-xl shadow border border-gray-100"
                  >
                    <h2 className="font-semibold text-gray-800 mb-2">{emp.name}</h2>

                    <div className="text-sm text-gray-600 mb-2">
                      Tasks: Total {empTasks.length}, Completed {completed}, Pending {pending}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {empTasks.length > 0 ? (
                        empTasks.map(task => (
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
                        ))
                      ) : (
                        <div className="text-gray-400 italic col-span-2">
                          No tasks assigned
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
