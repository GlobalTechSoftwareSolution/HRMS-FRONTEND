"use client";
import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Task = {
    task_id: number;
    title: string;
    description: string;
    dueDate: string;
    priority: "High" | "Medium" | "Low";
    status: "Pending" | "In Progress" | "Completed";
    completed: boolean;
    createdAt: string;
    email?: string;
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
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [popupType, setPopupType] = useState<"success" | "error">("success");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Report modal states
    const [reportContent, setReportContent] = useState<string>("");
    const [reportStatus, setReportStatus] = useState<Task["status"]>("Pending");

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_tasks/`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

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

            const userEmail = typeof window !== "undefined" ? localStorage.getItem("user_email") : null;
            if (userEmail) {
                type RawTask = {
                    task_id: number;
                    title: string;
                    description: string;
                    due_date?: string;
                    created_at?: string;
                    priority?: string;
                    status: "Pending" | "In Progress" | "Completed";
                    email?: string;
                };
                const formattedTasks: Task[] = (tasksArr as RawTask[])
                    .filter((t: RawTask) => t.email === userEmail)
                    .map((t: RawTask) => ({
                        ...t,
                        dueDate: t.due_date || "",
                        createdAt: t.created_at || "",
                        priority: t.priority
                            ? (t.priority.charAt(0).toUpperCase() + t.priority.slice(1).toLowerCase()) as Task["priority"]
                            : "Low",
                        completed: t.status.toLowerCase() === "completed",
                    }));

                setTasks(formattedTasks);
            } else {
                setTasks([]);
            }
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
            showAlert("Failed to load tasks", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

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

    const showAlert = (message: string, type: "success" | "error") => {
        setPopupMessage(message);
        setPopupType(type);
    };

    const handleUpdateStatus = async (taskId: number, newStatusValue: Task["status"]) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/update_task/${taskId}/`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status: newStatusValue }),
                }
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            setTasks((prev) =>
                prev.map((task) =>
                    task.task_id === taskId
                        ? { ...task, status: newStatusValue, completed: newStatusValue === "Completed" }
                        : task
                )
            );
            setShowTaskModal(false);
            setSelectedTask(null);
            showAlert("Task status updated successfully!", "success");
        } catch (error) {
            console.error("Failed to update task status:", error);
            showAlert("Failed to update task status. Please try again.", "error");
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
                year: "numeric"
            });
        }
    };

    const getPriorityStyles = (priority: Task["priority"]) => {
        switch (priority) {
            case "High":
                return "bg-red-50 text-red-700 border-red-200";
            case "Medium":
                return "bg-yellow-50 text-yellow-700 border-yellow-200";
            case "Low":
                return "bg-green-50 text-green-700 border-green-200";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    const getStatusStyles = (status: Task["status"]) => {
        switch (status) {
            case "Completed":
                return "bg-green-50 text-green-700 border-green-200";
            case "In Progress":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "Pending":
                return "bg-orange-50 text-orange-700 border-orange-200";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
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

    const filteredTasks = tasks.filter((task) => {
        const normalizedStatus = task.status.toLowerCase();
        const normalizedPriority = task.priority.toLowerCase();

        if (filter === "pending" && normalizedStatus === "completed") return false;
        if (filter === "completed" && normalizedStatus !== "completed") return false;
        if (filter === "high-priority" && normalizedPriority !== "high") return false;

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
        (task) => task.priority.toLowerCase() === "high" && !task.completed
    ).length;
    const completedTasks = tasks.filter((task) => task.completed).length;

    if (isLoading) {
        return (
            <DashboardLayout role="employee">
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading your tasks...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="employee">
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                        <div className="flex-1">
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                Task Management
                            </h1>
                            <p className="text-lg text-gray-600">
                                Stay organized and boost your productivity
                            </p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-sm">
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="bg-blue-100 p-2 rounded-xl">
                                    <span className="text-blue-600 text-lg">📅</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Today is</p>
                                    <p className="font-semibold">{currentDate}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{tasks.length}</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-xl">
                                    <span className="text-blue-600 text-xl">📋</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pending</p>
                                    <p className="text-3xl font-bold text-orange-600 mt-1">{pendingTasks}</p>
                                </div>
                                <div className="bg-orange-100 p-3 rounded-xl">
                                    <span className="text-orange-600 text-xl">⏳</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">High Priority</p>
                                    <p className="text-3xl font-bold text-red-600 mt-1">{highPriorityTasks}</p>
                                </div>
                                <div className="bg-red-100 p-3 rounded-xl">
                                    <span className="text-red-600 text-xl">🔴</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Completed</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">{completedTasks}</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-xl">
                                    <span className="text-green-600 text-xl">✅</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: "all", label: "All Tasks", icon: "📝" },
                                    { key: "pending", label: "Pending", icon: "⏳" },
                                    { key: "completed", label: "Completed", icon: "✅" },
                                    { key: "high-priority", label: "High Priority", icon: "🔴" }
                                ].map(({ key, label, icon }) => (
                                    <button
                                        key={key}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            filter === key
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                        onClick={() => setFilter(key as TaskFilter)}
                                    >
                                        <span>{icon}</span>
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="relative w-full lg:w-64">
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <span className="absolute left-3 top-3.5 text-gray-400 text-lg">🔍</span>
                            </div>
                        </div>
                    </div>

                    {/* Tasks List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Table Header */}
                        <div className="bg-gray-50/80 border-b border-gray-200 px-6 py-4 hidden lg:block">
                            <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-600">
                                <div className="col-span-5">Task Details</div>
                                <div className="col-span-2">Due Date</div>
                                <div className="col-span-2">Priority</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-1"></div>
                            </div>
                        </div>

                        {/* Tasks */}
                        <div className="divide-y divide-gray-100">
                            {filteredTasks.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-5xl mb-4 text-gray-300">📋</div>
                                    <p className="text-gray-500 text-lg font-medium">No tasks found</p>
                                    <p className="text-gray-400 mt-2">Try changing your filters or search query</p>
                                </div>
                            ) : (
                                filteredTasks.map((task) => (
                                    <div
                                        key={task.task_id}
                                        className="group px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setSelectedTask(task);
                                            setShowTaskModal(true);
                                            setStatusToUpdate(task.status);
                                            setReportContent("");
                                            setReportStatus(task.status);
                                        }}
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                            {/* Task Details */}
                                            <div className="col-span-5">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 w-2 h-2 rounded-full ${
                                                        task.priority === "High" ? "bg-red-500" :
                                                        task.priority === "Medium" ? "bg-yellow-500" : "bg-green-500"
                                                    }`}></div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={`font-semibold text-gray-900 truncate ${
                                                            task.completed ? "line-through text-gray-400" : ""
                                                        }`}>
                                                            {task.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                            {task.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Due Date */}
                                            <div className="col-span-2">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <span className="lg:hidden text-xs font-medium">Due:</span>
                                                    <span className={`font-medium ${
                                                        new Date(task.dueDate) < new Date() && !task.completed 
                                                            ? "text-red-600" 
                                                            : "text-gray-600"
                                                    }`}>
                                                        {formatDate(task.dueDate)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Priority */}
                                            <div className="col-span-2">
                                                <span
                                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                                        task.priority === "High"
                                                            ? "text-red-600"
                                                            : task.priority === "Medium"
                                                                ? "text-yellow-600"
                                                                : "text-green-600"
                                                    }`}
                                                >
                                                    <span>{getPriorityIcon(task.priority)}</span>
                                                    {task.priority}
                                                </span>
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-2">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles(task.status)}`}>
                                                    {task.status === "Completed" && "✅"}
                                                    {task.status === "In Progress" && "🔄"}
                                                    {task.status === "Pending" && "⏳"}
                                                    {task.status}
                                                </span>
                                            </div>

                                            {/* Action */}
                                            <div className="col-span-1 flex justify-end">
                                                <button className="opacity-0 group-hover:opacity-100 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all">
                                                    👁️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Modal */}
            {showTaskModal && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">{selectedTask.title}</h2>
                                    <p className="text-blue-100 opacity-90">{selectedTask.description}</p>
                                </div>
                                <button
                                    onClick={() => setShowTaskModal(false)}
                                    className="text-white/80 hover:text-white p-1 rounded-lg transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Task Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                                    <p className="text-gray-900 font-medium">{formatDate(selectedTask.dueDate)}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500">Priority</label>
                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getPriorityStyles(selectedTask.priority)}`}>
                                        {getPriorityIcon(selectedTask.priority)} {selectedTask.priority}
                                    </span>
                                </div>
                            </div>

                            {/* Status Update */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <select
                                        className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        value={statusToUpdate}
                                        onChange={e => setStatusToUpdate(e.target.value as Task["status"])}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                    <button
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors w-full sm:w-auto"
                                        onClick={() => {
                                            if (selectedTask) handleUpdateStatus(selectedTask.task_id, statusToUpdate);
                                        }}
                                    >
                                        Update Status
                                    </button>
                                </div>
                            </div>

                            {/* Report Section */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="bg-blue-100 p-2 rounded-lg">📝</span>
                                    Task Report
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Report Status
                                        </label>
                                        <select
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            value={reportStatus}
                                            onChange={e => setReportStatus(e.target.value as Task["status"])}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Report Content
                                        </label>
                                        <textarea
                                            className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-y bg-gray-50/50"
                                            placeholder="Describe your progress, challenges, or completion details..."
                                            value={reportContent}
                                            onChange={e => setReportContent(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-medium transition-colors"
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
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={async () => {
                                                if (!selectedTask) return;

                                                try {
                                                    const loggedInEmail = typeof window !== "undefined" ? localStorage.getItem("user_email") : "";
                                                    if (!loggedInEmail) {
                                                        showAlert("User email not found. Please log in again.", "error");
                                                        return;
                                                    }

                                                    const payload = {
                                                        title: selectedTask.title,
                                                        date: new Date().toISOString().split("T")[0],
                                                        email: loggedInEmail,
                                                        content: reportContent,
                                                        description: selectedTask.description
                                                    };

                                                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_report/`, {
                                                        method: "POST",
                                                        headers: {
                                                            "Content-Type": "application/json",
                                                        },
                                                        body: JSON.stringify(payload),
                                                    });

                                                    if (!response.ok) {
                                                        throw new Error(`HTTP error! status: ${response.status}`);
                                                    }

                                                    showAlert("Report submitted successfully!", "success");
                                                    setReportContent("");
                                                    setReportStatus(selectedTask.status);
                                                    setShowTaskModal(false);
                                                    setSelectedTask(null);

                                                } catch (err) {
                                                    console.error("Failed to submit report:", err);
                                                    showAlert("Failed to submit report. Please try again.", "error");
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
                    </div>
                </div>
            )}

            {/* Popup Alert */}
            {popupMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPopupMessage(null)}></div>
                    <div className="bg-white rounded-2xl p-6 shadow-xl z-10 max-w-sm mx-4 transform transition-all">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                            popupType === "success" ? "bg-green-100" : "bg-red-100"
                        }`}>
                            <span className={`text-xl ${
                                popupType === "success" ? "text-green-600" : "text-red-600"
                            }`}>
                                {popupType === "success" ? "✓" : "!"}
                            </span>
                        </div>
                        <h3 className={`text-center text-lg font-semibold mb-2 ${
                            popupType === "success" ? "text-green-600" : "text-red-600"
                        }`}>
                            {popupType === "success" ? "Success" : "Error"}
                        </h3>
                        <p className="text-center text-gray-600 mb-6">{popupMessage}</p>
                        <button
                            className={`w-full py-3 rounded-xl font-medium text-white transition-colors ${
                                popupType === "success" 
                                    ? "bg-green-600 hover:bg-green-700" 
                                    : "bg-red-600 hover:bg-red-700"
                            }`}
                            onClick={() => setPopupMessage(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}