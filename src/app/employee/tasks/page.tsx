"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
  completed: boolean;
  createdAt: string;
};

type TaskFilter = "all" | "pending" | "completed" | "high-priority";

export default function TasksDashboard() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Complete project proposal",
      description: "Draft and send the client proposal for the new website design",
      dueDate: "2023-06-15",
      priority: "High",
      status: "In Progress",
      completed: false,
      createdAt: "2023-06-10",
    },
    {
      id: 2,
      title: "Team meeting",
      description: "Weekly team sync to discuss project progress",
      dueDate: "2023-06-16",
      priority: "Medium",
      status: "Pending",
      completed: false,
      createdAt: "2023-06-10",
    },
    {
      id: 3,
      title: "Client presentation",
      description: "Prepare slides and demo for client review",
      dueDate: "2023-06-20",
      priority: "High",
      status: "Pending",
      completed: false,
      createdAt: "2023-06-09",
    },
  ]);

  const [currentDate, setCurrentDate] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    dueDate: "",
    priority: "Medium",
    status: "Pending",
  });
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id 
          ? { 
              ...task, 
              completed: !task.completed,
              status: task.completed ? "Pending" : "Completed"
            } 
          : task
      )
    );
  };

  const handleAddTask = () => {
    if (!newTask.title || !newTask.description) {
      alert("Please fill title and description");
      return;
    }

    const task: Task = {
      id: Date.now(),
      title: newTask.title!,
      description: newTask.description!,
      dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
      priority: newTask.priority || "Medium",
      status: newTask.status || "Pending",
      completed: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTasks([task, ...tasks]);
    setNewTask({
      title: "",
      description: "",
      dueDate: "",
      priority: "Medium",
      status: "Pending",
    });
    setShowAddForm(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
    });
    setShowAddForm(true);
  };

  const handleUpdateTask = () => {
    if (!editingTask || !newTask.title || !newTask.description) {
      alert("Please fill all required fields");
      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === editingTask.id
          ? {
              ...task,
              title: newTask.title!,
              description: newTask.description!,
              dueDate: newTask.dueDate!,
              priority: newTask.priority!,
              status: newTask.status!,
            }
          : task
      )
    );

    setEditingTask(null);
    setNewTask({
      title: "",
      description: "",
      dueDate: "",
      priority: "Medium",
      status: "Pending",
    });
    setShowAddForm(false);
  };

  const handleDeleteTask = (id: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      setTasks((prev) => prev.filter((task) => task.id !== id));
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
  const highPriorityTasks = tasks.filter((task) => task.priority === "High" && !task.completed).length;

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
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
                onClick={() => {
                  setEditingTask(null);
                  setNewTask({
                    title: "",
                    description: "",
                    dueDate: "",
                    priority: "Medium",
                    status: "Pending",
                  });
                  setShowAddForm(!showAddForm);
                }}
              >
                <span className="mr-2">+</span> {editingTask ? "Edit Task" : "Add New Task"}
              </button>
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

          {/* Add/Edit Task Form */}
          {showAddForm && (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editingTask ? "Edit Task" : "Add New Task"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter task title"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    value={newTask.title || ""}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    value={newTask.dueDate || ""}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    value={newTask.priority || "Medium"}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value as Task["priority"] })
                    }
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    value={newTask.status || "Pending"}
                    onChange={(e) =>
                      setNewTask({ ...newTask, status: e.target.value as Task["status"] })
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Description */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    placeholder="Enter task description"
                    rows={3}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    value={newTask.description || ""}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingTask(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base"
                  onClick={editingTask ? handleUpdateTask : handleAddTask}
                >
                  {editingTask ? "Update Task" : "Add Task"}
                </button>
              </div>
            </div>
          )}

          {/* Tasks List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200 hidden sm:block">
              <div className="grid grid-cols-12 px-4 sm:px-6 py-3 bg-gray-50 text-gray-500 text-xs sm:text-sm font-medium">
                <div className="col-span-1"></div>
                <div className="col-span-5">Task</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-2">Status</div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 sm:py-10">
                  <div className="text-3xl sm:text-4xl mb-3">📋</div>
                  <p className="text-gray-500 text-sm sm:text-base">No tasks found</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Try changing your filters or search query</p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`grid grid-cols-1 sm:grid-cols-12 px-4 sm:px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      task.priority === "High"
                        ? "sm:border-l-4 border-l-0 border-t-4 border-t-red-500 sm:border-t-0"
                        : task.priority === "Medium"
                        ? "sm:border-l-4 border-l-0 border-t-4 border-t-yellow-500 sm:border-t-0"
                        : "sm:border-l-4 border-l-0 border-t-4 border-t-green-500 sm:border-t-0"
                    }`}
                  >
                    <div className="col-span-1 flex items-center mb-2 sm:mb-0">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                      />
                      <span className="ml-2 sm:hidden text-sm text-gray-700">Toggle completion</span>
                    </div>
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
                    <div className="col-span-12 mt-3 flex justify-end space-x-2 pt-3 border-t border-gray-100 sm:border-t-0 sm:mt-0 sm:pt-0">
                      <button 
                        className="text-blue-500 hover:text-blue-700 px-2 py-1 rounded text-xs sm:text-sm"
                        onClick={() => handleEditTask(task)}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-red-500 hover:text-red-700 px-2 py-1 rounded text-xs sm:text-sm"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

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