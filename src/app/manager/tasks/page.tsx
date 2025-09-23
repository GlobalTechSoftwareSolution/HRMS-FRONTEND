"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FiUser, FiSend, FiPlus } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

type Task = {
  task_id: string;
  title: string;
  description: string;
  department: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  start_date: string;
  due_date?: string | null;
  completed_date?: string | null;
};

type Employee = {
  email: string; // <-- changed from email_id
  fullname: string;
  department: string | null;
  designation: string | null;
  profile_picture?: string | null;
};

export default function ManagerTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [sending, setSending] = useState(false);
  const [scrollToForm, setScrollToForm] = useState(false);
  const formRef = React.useRef<HTMLDivElement | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const API_BASE = "https://hrms-6qja.onrender.com";

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/accounts/employees/`);
        if (!res.ok) throw new Error("Failed to fetch employees");
        const data = await res.json();
        setEmployees(data || []); // data is already array
      } catch (err: unknown) {
        console.error("Error fetching employees:", err);
        toast.error("Failed to load employees");
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/accounts/list_tasks/`);
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (err: unknown) {
        console.error("Error fetching tasks:", err);
        toast.error("Failed to load tasks");
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    if (scrollToForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
      setScrollToForm(false);
    }
  }, [scrollToForm]);

  const handleSendTask = async () => {
    if (!title || !description || !assignedTo || !priority) {
      toast.error("Please fill all required fields");
      return;
    }

    const selectedEmployee = employees.find((emp) => emp.email === assignedTo);
    if (!selectedEmployee) {
      toast.error("Selected employee not found");
      return;
    }

    setSending(true);
    try {
      const payload = {
        title,
        description,
        department: selectedEmployee.department || "General",
        priority,
        status: "PENDING",
        start_date: new Date().toISOString(),
        due_date: dueDate || null,
        assigned_to: assignedTo,
      };

      const res = await fetch(`${API_BASE}/api/accounts/apply_task/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to assign task");
      }

      setTasks((prev) => [data.task, ...prev]);
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");
      setPriority("MEDIUM");
      toast.success("Task assigned successfully!");
    } catch (err: unknown) {
      console.error("Failed to assign task:", err);
      toast.error("Failed to assign task");
    } finally {
      setSending(false);
    }
  };

  const getPriorityClass = (priority: Task["priority"]) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusClass = (status: Task["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Employees List */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 animate-fade-in mt-8">
          <h2 className="text-lg font-semibold mb-4">
            Team Members ({employees.length})
          </h2>

          {loadingEmployees ? (
            <p className="text-gray-500">Loading employees...</p>
          ) : employees.length === 0 ? (
            <p className="text-gray-500">No employee data available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((emp) => (
                <div
                  key={emp.email}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={emp.profile_picture || "/default-avatar.png"}
                      alt={emp.fullname}
                      fill
                      className="rounded-full object-cover border border-gray-300"
                      onErrorCapture={(e) => {
                        (e.target as HTMLImageElement).src = "/default-avatar.png";
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {emp.fullname}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">{emp.email}</p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Role:</span> {emp.designation || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Department:</span> {emp.department || "N/A"}
                    </p>
                    <button
                      onClick={() => {
                        setAssignedTo(emp.email);
                        setScrollToForm(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                      Assign Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Form & List */}
        <div className="max-w-4xl mx-auto mt-6">
          {/* Form */}
          <div
            ref={formRef}
            className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 mb-6 animate-fade-in"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FiPlus className="mr-2" /> Create New Task
            </h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Title"
              className="w-full border p-2 rounded mb-3"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task Description"
              className="w-full border p-2 rounded mb-3"
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border p-2 rounded mb-3"
            />
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "HIGH" | "MEDIUM" | "LOW")
              }
              className="w-full border p-2 rounded mb-3"
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <button
              onClick={handleSendTask}
              disabled={sending}
              className={`flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all ${
                sending
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <FiSend className="mr-2" />
              {sending ? "Assigning Task..." : "Assign Task"}
            </button>
          </div>

          {/* Task List */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">
              Assigned Tasks ({tasks.length})
            </h2>

            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiSend className="text-4xl mx-auto text-gray-300 mb-3" />
                <p>No tasks assigned yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.task_id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {task.title}
                      </h3>
                      <div className="flex space-x-2 mt-2 md:mt-0">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityClass(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(
                            task.status
                          )}`}
                        >
                          {task.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3">{task.description}</p>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiUser className="mr-1" />
                        <span className="font-medium">{task.department}</span>
                      </div>

                      <div className="mt-2 md:mt-0">
                        {task.due_date && (
                          <>
                            <span>Due: {formatDate(task.due_date)}</span>
                            <span className="mx-2">•</span>
                          </>
                        )}
                        <span>Assigned: {formatDate(task.start_date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease forwards;
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
