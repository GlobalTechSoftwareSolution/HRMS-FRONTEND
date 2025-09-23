"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Task = {
  task_id: number; // backend-provided unique identifier
  title: string;
  description: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
  completed: boolean;
  createdAt: string;
  email?: string; // backend may provide this, used for filtering by user
};

type TaskFilter = "all" | "pending" | "completed" | "high-priority";

export default function TasksDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [statusToUpdate, setStatusToUpdate] = useState<Task["status"]>("Pending");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);

  // Report modal states
  const [reportContent, setReportContent] = useState<string>("");
  const [reportStatus, setReportStatus] = useState<Task["status"]>("Pending");

  useEffect(() => {
    // Fetch tasks from backend API on mount
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_tasks/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Handle both { tasks: [...] } and plain array responses
        let tasksArr: unknown = [];
        if (Array.isArray(data)) {
          tasksArr = data;
        } else if (data && Array.isArray((data as { tasks?: Task[] }).tasks)) {
          tasksArr = (data as { tasks: Task[] }).tasks;
        } else {
          setTasks([]);
          console.error("Unexpected tasks API response:", data);
          return;
        }

        // Map backend task_id to each object
        const mappedTasks: Task[] = (tasksArr as Task[]).map((task) => ({
          ...task,
          task_id: task.task_id,
        }));

        // Filter by user_email from localStorage
        const userEmail =
          typeof window !== "undefined" ? localStorage.getItem("user_email") : null;
        if (userEmail) {
          setTasks(mappedTasks.filter((task) => task.email === userEmail));
        } else {
          setTasks([]);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch tasks:", error);
      });
  }, []);

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setCurrentDate(now.toLocaleDateString("en-US", options));
  }, []);

  // Update only the status of a task, sending a PUT request to the backend
  const handleUpdateStatus = async (taskId: number, newStatusValue: Task["status"]) => {
    try {
      const response = await fetch(
        `{process.env.NEXT_PUBLIC_API_URL}/api/accounts/update_task/${taskId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatusValue }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Only update local state if request is successful
      setTasks((prev) =>
        prev.map((task) =>
          task.task_id === taskId
            ? { ...task, status: newStatusValue, completed: newStatusValue === "Completed" }
            : task
        )
      );
      setShowTaskModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Failed to update task status:", error);
      alert("Failed to update task status. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === now.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getPriorityIcon = (priority: Task["priority"]) => {
    switch (priority) {
      case "High":
        return "🔴";
      case "Medium":
        return "🟡";
      case "Low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "Completed":
        return "✅";
      case "In Progress":
        return "🔄";
      case "Pending":
        return "⏳";
      default:
        return "⚪";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    // Filter by status
    if (filter === "pending" && task.completed) return false;
    if (filter === "completed" && !task.completed) return false;
    if (filter === "high-priority" && task.priority !== "High") return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const pendingTasks = tasks.filter((task) => !task.completed).length;
  const highPriorityTasks = tasks.filter(
    (task) => task.priority === "High" && !task.completed
  ).length;

  return (
     <DashboardLayout role="employee">
 <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
 <div className="max-w-6xl mx-auto">
 {/* Header */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
 <div>
 <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Task Management</h1>
 <p className="text-gray-500 mt-1 text-sm sm:text-base">Stay organized and boost your productivity</p>
 </div>
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
 <div className="bg-blue-100 text-blue-800 px-3 py-1 sm:px-4 sm:py-2 rounded-full flex items-center text-xs sm:text-sm w-full sm:w-auto justify-center sm:justify-start">
 <span className="mr-2">📅</span>
 <span>{currentDate}</span>
 </div>
 </div>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
 <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
 <div className="flex items-center">
 <div className="rounded-full bg-blue-100 p-2 sm:p-3 mr-3 sm:mr-4">
 <span className="text-blue-600 text-lg sm:text-xl">📝</span>
 </div>
 <div>
 <h3 className="text-xs sm:text-sm text-gray-500">Total Tasks</h3>
 <p className="text-xl sm:text-2xl font-bold text-gray-800">{tasks.length}</p>
 </div>
 </div>
 </div>
 
 <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
 <div className="flex items-center">
 <div className="rounded-full bg-yellow-100 p-2 sm:p-3 mr-3 sm:mr-4">
 <span className="text-yellow-600 text-lg sm:text-xl">⏳</span>
 </div>
 <div>
 <h3 className="text-xs sm:text-sm text-gray-500">Pending Tasks</h3>
 <p className="text-xl sm:text-2xl font-bold text-gray-800">{pendingTasks}</p>
 </div>
 </div>
 </div>
 
 <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
 <div className="flex items-center">
 <div className="rounded-full bg-red-100 p-2 sm:p-3 mr-3 sm:mr-4">
 <span className="text-red-600 text-lg sm:text-xl">🔴</span>
 </div>
 <div>
 <h3 className="text-xs sm:text-sm text-gray-500">High Priority</h3>
 <p className="text-xl sm:text-2xl font-bold text-gray-800">{highPriorityTasks}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Filters and Search */}
 <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 mb-4 sm:mb-6">
 <div className="flex flex-col gap-3 sm:gap-4">
 <div className="flex flex-wrap gap-2">
 <button
 className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm ${filter === "all" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}
 onClick={() => setFilter("all")}
 >
 All Tasks
 </button>
 <button
 className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm ${filter === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"}`}
 onClick={() => setFilter("pending")}
 >
 Pending
 </button>
 <button
 className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm ${filter === "completed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
 onClick={() => setFilter("completed")}
 >
 Completed
 </button>
 <button
 className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm ${filter === "high-priority" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}`}
 onClick={() => setFilter("high-priority")}
 >
 High Priority
 </button>
 </div>
 
 <div className="relative">
 <input
 type="text"
 placeholder="Search tasks..."
 className="border border-gray-300 rounded-lg pl-9 pr-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
 </div>
 </div>
 </div>


 {/* Tasks List */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 <div className="border-b border-gray-200 hidden sm:block">
 <div className="grid grid-cols-11 px-4 sm:px-6 py-3 bg-gray-50 text-gray-500 text-xs sm:text-sm font-medium">
 <div className="col-span-5">Task</div>
 <div className="col-span-2">Due Date</div>
 <div className="col-span-2">Priority</div>
 <div className="col-span-2">Status</div>
 </div>
 </div>

 <div className="divide-y divide-gray-100">
 {filteredTasks.length === 0 ? (
 <div key="no-tasks" className="text-center py-8 sm:py-10">
 <div className="text-3xl sm:text-4xl mb-3">📋</div>
 <p className="text-gray-500 text-sm sm:text-base">No tasks found</p>
 <p className="text-xs sm:text-sm text-gray-400 mt-1">Try changing your filters or search query</p>
 </div>
 ) : (
 filteredTasks.map((task) => (
 <div
 key={task.task_id}
 className={`grid grid-cols-1 sm:grid-cols-11 px-4 sm:px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
 task.priority === "High"
 ? "sm:border-l-4 border-l-0 border-t-4 border-t-red-500 sm:border-t-0"
 : task.priority === "Medium"
 ? "sm:border-l-4 border-l-0 border-t-4 border-t-yellow-500 sm:border-t-0"
 : "sm:border-l-4 border-l-0 border-t-4 border-t-green-500 sm:border-t-0"
 }`}
 onClick={() => {
 setSelectedTask(task);
 setShowTaskModal(true);
 setStatusToUpdate(task.status);
 setReportContent("");
 setReportStatus(task.status);
 }}
 tabIndex={0}
 role="button"
 aria-label={`View details for ${task.title}`}
 >
 <div className="col-span-5 flex items-center mb-3 sm:mb-0">
 <div className="ml-0 sm:ml-3 w-full">
 <h3
 className={`font-medium text-gray-800 text-base ${
 task.completed ? "line-through text-gray-400" : ""
 }`}
 >
 {task.title}
 </h3>
 <p className="text-sm text-gray-500 mt-1 sm:mt-0 sm:truncate">{task.description}</p>
 </div>
 </div>
 <div className="col-span-2 flex items-center mb-2 sm:mb-0">
 <span className="text-xs sm:text-sm text-gray-700 font-medium sm:font-normal">
 <span className="sm:hidden mr-2">Due:</span>
 {formatDate(task.dueDate)}
 </span>
 </div>
 <div className="col-span-2 flex items-center mb-2 sm:mb-0">
 <span
 className={`px-2 py-1 text-xs font-medium rounded-full flex items-center w-fit ${
 task.priority === "High"
 ? "bg-red-100 text-red-800"
 : task.priority === "Medium"
 ? "bg-yellow-100 text-yellow-800"
 : "bg-green-100 text-green-800"
 }`}
 >
 <span className="mr-1">{getPriorityIcon(task.priority)}</span>
 <span className="hidden sm:inline">{task.priority}</span>
 <span className="sm:hidden">Priority: {task.priority}</span>
 </span>
 </div>
 <div className="col-span-2 flex items-center mb-3 sm:mb-0">
 <span
 className={`px-2 py-1 text-xs font-medium rounded-full flex items-center w-fit ${
 task.status === "Pending"
 ? "bg-blue-100 text-blue-800"
 : task.status === "In Progress"
 ? "bg-yellow-100 text-yellow-800"
 : "bg-green-100 text-green-800"
 }`}
 >
 <span className="mr-1">{getStatusIcon(task.status)}</span>
 <span className="hidden sm:inline">{task.status}</span>
 <span className="sm:hidden">Status: {task.status}</span>
 </span>
 </div>
 {/* Report badge removed */}
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Task Modal (now includes report section) */}
 {showTaskModal && selectedTask && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
 <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6 relative">
 <h2 className="text-xl font-bold mb-2">{selectedTask.title}</h2>
 <p className="mb-2 text-gray-700">{selectedTask.description}</p>
 <div className="mb-2">
 <span className="font-medium">Due Date:</span>{" "}
 <span>{selectedTask.dueDate}</span>
 </div>
 <div className="mb-2">
 <span className="font-medium">Priority:</span>{" "}
 <span>{selectedTask.priority}</span>
 </div>
 <div className="mb-4">
 <span className="font-medium">Status:</span>{" "}
 <select
 className="border border-gray-300 rounded-lg px-2 py-1 ml-2"
 value={statusToUpdate}
 onChange={e => setStatusToUpdate(e.target.value as Task["status"])}
 >
 <option value="Pending">Pending</option>
 <option value="In Progress">In Progress</option>
 <option value="Completed">Completed</option>
 </select>

 {/* Move Update Status button directly below the status select */}
 <button
 className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
 onClick={() => {
 if (selectedTask) handleUpdateStatus(selectedTask.task_id, statusToUpdate);
 }}
 >
 Update Status
 </button>
 </div>
 <div className="border-t border-gray-200 pt-4 mt-4">
 <h3 className="text-lg font-semibold mb-2 flex items-center"><span className="mr-2">📝</span>Report</h3>
 <div className="mb-4">
 <label className="block text-sm font-medium text-gray-700 mb-1">Report Status</label>
 <select
 className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
 value={reportStatus}
 onChange={e => setReportStatus(e.target.value as Task["status"])}
 >
 <option value="Pending">Pending</option>
 <option value="In Progress">In Progress</option>
 <option value="Completed">Completed</option>
 </select>
 </div>
 <textarea
 className="w-full border border-gray-300 rounded-lg p-2 mb-4 min-h-[120px] resize-y"
 placeholder="Write your report here..."
 value={reportContent}
 onChange={e => setReportContent(e.target.value)}
 />
 <div className="flex justify-end space-x-3">
 <button
 className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm"
 onClick={() => {
 setShowTaskModal(false);
 setSelectedTask(null);
 setReportContent("");
 setReportStatus(selectedTask.status);
 }}
 >
 Close
 </button>
 <button
 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
 onClick={async () => {
 if (!selectedTask) return;

 try {
 // Prepare report payload exactly as backend expects
 const payload = {
 title: selectedTask.title,
 description: selectedTask.description,
 content: reportContent,
 date: new Date().toISOString().split("T")[0], // e.g., "2025-09-20"
 };

 const response = await fetch("http://127.0.0.1:8000/api/accounts/create_report/", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify(payload),
 });

 if (!response.ok) {
 throw new Error(`HTTP error! status: ${response.status}`);
 }

 const data = await response.json();
 console.log("Report submitted:", data);

 alert("Report submitted successfully!");
 setReportContent("");
 setReportStatus(selectedTask.status);
 setShowTaskModal(false);
 setSelectedTask(null);

 } catch (err) {
 console.error("Failed to submit report:", err);
 alert("Failed to submit report. Check console for details.");
 }
 }}
 disabled={reportContent.trim().length === 0}
 >
 Submit Report
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 <style jsx>{`
 /* Mobile first */
 @media (max-width: 640px) {
 .task-grid {
 display: flex;
 flex-direction: column;
 gap: 1rem;
 }
 .task-grid > div {
 padding: 12px;
 }
 .task-grid button {
 width: 100%;
 }
 }
 @media (min-width: 641px) and (max-width: 1024px) {
 .task-grid {
 display: grid;
 grid-template-columns: repeat(2, 1fr);
 gap: 1rem;
 }
 }
 @media (min-width: 1025px) {
 .task-grid {
 display: grid;
 grid-template-columns: repeat(3, 1fr);
 gap: 1.25rem;
 }
 }
 `}</style>
 </DashboardLayout>
  );
}
