"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiCalendar, 
  FiUser, 
  FiCheckCircle, 
  FiClock,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiStar,
  FiPaperclip
} from "react-icons/fi";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Task type
type Task = {
  id: number;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName?: string;
  assignedBy: string;
  status: "pending" | "in-progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
};

type User = {
  username: string;
  name: string;
  role: string;
  department: string;
};

type SortConfig = {
  key: keyof Task;
  direction: 'ascending' | 'descending';
};

type FilterConfig = {
  status: string;
  priority: string;
  assignedTo: string;
};

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [userRole, setUserRole] = useState("employee");
  const [username, setUsername] = useState("");
  const [userList, setUserList] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    status: "all",
    priority: "all",
    assignedTo: "all"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Load user info from localStorage and mock user data
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const user = JSON.parse(userInfo);
      setUserRole(user.role);
      setUsername(user.name || user.username || "");
    }

    // Mock user data - in a real app, this would come from your API
    const mockUsers: User[] = [
      { username: "john_doe", name: "John Doe", role: "employee", department: "Engineering" },
      { username: "jane_smith", name: "Jane Smith", role: "employee", department: "Marketing" },
      { username: "robert_j", name: "Robert Johnson", role: "employee", department: "Sales" },
      { username: "sarah_w", name: "Sarah Williams", role: "employee", department: "HR" },
    ];
    setUserList(mockUsers);

    // Mock tasks data - in a real app, this would come from your API
    const mockTasks: Task[] = [
      {
        id: 1,
        title: "Complete quarterly report",
        description: "Prepare the Q3 financial report for management review",
        assignedTo: "john_doe",
        assignedToName: "John Doe",
        assignedBy: "hr_manager",
        status: "pending",
        priority: "high",
        dueDate: "2023-11-15",
        createdAt: "2023-10-25",
        updatedAt: "2023-10-25",
      },
      {
        id: 2,
        title: "Update employee handbook",
        description: "Review and update the company policies section",
        assignedTo: "sarah_w",
        assignedToName: "Sarah Williams",
        assignedBy: "hr_manager",
        status: "in-progress",
        priority: "medium",
        dueDate: "2023-11-05",
        createdAt: "2023-10-20",
        updatedAt: "2023-10-28",
      },
      {
        id: 3,
        title: "Prepare presentation for client meeting",
        description: "Create slides for the upcoming client presentation on Friday",
        assignedTo: "jane_smith",
        assignedToName: "Jane Smith",
        assignedBy: "hr_manager",
        status: "completed",
        priority: "high",
        dueDate: "2023-10-27",
        createdAt: "2023-10-15",
        updatedAt: "2023-10-27",
      },
      {
        id: 4,
        title: "Review sales data",
        description: "Analyze Q3 sales numbers and prepare summary",
        assignedTo: "robert_j",
        assignedToName: "Robert Johnson",
        assignedBy: "hr_manager",
        status: "overdue",
        priority: "medium",
        dueDate: "2023-10-20",
        createdAt: "2023-10-10",
        updatedAt: "2023-10-22",
      },
    ];
    setTasks(mockTasks);
  }, []);

  // Add a new task
  const handleAddTask = () => {
    if (!title || !description || !assignedTo || !dueDate) {
      toast.error("Please fill all required fields");
      return;
    }

    const assignedUser = userList.find(user => user.username === assignedTo);
    
    const newTask: Task = {
      id: tasks.length + 1,
      title,
      description,
      assignedTo,
      assignedToName: assignedUser?.name,
      assignedBy: username,
      status: "pending",
      priority,
      dueDate,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setTasks([newTask, ...tasks]);
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setDueDate("");
    setPriority("medium");
    setIsAdding(false);
    toast.success("Task added successfully!");
  };

  // Update an existing task
  const handleUpdateTask = () => {
    if (!editingTask) return;

    setTasks(tasks.map(task => 
      task.id === editingTask.id ? editingTask : task
    ));
    setEditingTask(null);
    toast.success("Task updated successfully!");
  };

  // Delete a task
  const handleDeleteTask = (id: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setTasks(tasks.filter(task => task.id !== id));
      toast.info("Task deleted");
    }
  };

  // Employee updates task status
  const handleUpdateTaskStatus = (id: number, status: "pending" | "in-progress" | "completed" | "overdue") => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { 
          ...task, 
          status,
          updatedAt: new Date().toISOString().split('T')[0]
        } : task
      )
    );
    toast.success("Task status updated!");
  };

  // Sort tasks
  const requestSort = (key: keyof Task) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = React.useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterConfig.status === "all" || task.status === filterConfig.status;
      const matchesPriority = filterConfig.priority === "all" || task.priority === filterConfig.priority;
      const matchesAssigned = filterConfig.assignedTo === "all" || task.assignedTo === filterConfig.assignedTo;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesAssigned;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [tasks, searchTerm, filterConfig, sortConfig]);

  // Filter tasks for employee view
  const visibleTasks =
    userRole === "employee"
      ? filteredAndSortedTasks.filter((task) => task.assignedTo === username)
      : filteredAndSortedTasks;

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      default: return "bg-green-100 text-green-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <FiAlertCircle className="text-red-500" />;
      case "medium": return <FiStar className="text-yellow-500" />;
      default: return <FiStar className="text-green-500" />;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <DashboardLayout role={userRole}>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Task Management</h1>
          {userRole === "hr" && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition"
            >
              <FiPlus className="mr-2" />
              {isAdding ? "Cancel" : "Add Task"}
            </button>
          )}
        </div>

        {/* Add Task Form */}
        {isAdding && userRole === "hr" && (
          <div className="mb-6 p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="Task Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {userList.filter(user => user.role === "employee").map(user => (
                    <option key={user.username} value={user.username}>
                      {user.name} ({user.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                  className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                placeholder="Task Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAddTask}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Task
            </button>
          </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Edit Task</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                    rows={3}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editingTask.dueDate}
                    onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({...editingTask, priority: e.target.value as "low" | "medium" | "high"})}
                    className="border p-2 rounded w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({...editingTask, status: e.target.value as any})}
                    className="border p-2 rounded w-full"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="bg-gray-50 p-4 rounded-md border mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white border hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center transition"
            >
              <FiFilter className="mr-2" />
              Filters
              {showFilters ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterConfig.status}
                  onChange={(e) => setFilterConfig({...filterConfig, status: e.target.value})}
                  className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filterConfig.priority}
                  onChange={(e) => setFilterConfig({...filterConfig, priority: e.target.value})}
                  className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              {userRole === "hr" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <select
                    value={filterConfig.assignedTo}
                    onChange={(e) => setFilterConfig({...filterConfig, assignedTo: e.target.value})}
                    className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Employees</option>
                    {userList.filter(user => user.role === "employee").map(user => (
                      <option key={user.username} value={user.username}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {userRole === "hr" ? "All Tasks" : "Your Tasks"} ({visibleTasks.length})
          </h2>
          
          {visibleTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No tasks found</p>
          ) : (
            <div className="space-y-4">
              {visibleTasks.map((task) => (
                <div key={task.id} className="border p-4 rounded-lg hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-lg mr-2">{task.title}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityClass(task.priority)} flex items-center`}>
                          {getPriorityIcon(task.priority)}
                          <span className="ml-1">{task.priority}</span>
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiUser className="mr-1" />
                          <span>{task.assignedToName || task.assignedTo}</span>
                        </div>
                        <div className="flex items-center">
                          <FiCalendar className="mr-1" />
                          <span className={isOverdue(task.dueDate) && task.status !== "completed" ? "text-red-500 font-medium" : ""}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                            {isOverdue(task.dueDate) && task.status !== "completed" && " (Overdue)"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(task.status)}`}>
                            {task.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {userRole === "hr" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingTask(task)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      )}
                      
                      {userRole === "employee" && task.status !== "completed" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, "in-progress")}
                            className={`px-3 py-1 rounded text-xs ${task.status === "in-progress" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                          >
                            Start
                          </button>
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, "completed")}
                            className="px-3 py-1 rounded bg-green-100 text-green-800 text-xs"
                          >
                            Complete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {userRole === "employee" && task.status !== "completed" && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, "pending")}
                          className={`px-3 py-1 rounded text-xs ${task.status === "pending" ? "bg-yellow-100 text-yellow-800 font-medium" : "bg-gray-100 text-gray-800"}`}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, "in-progress")}
                          className={`px-3 py-1 rounded text-xs ${task.status === "in-progress" ? "bg-blue-100 text-blue-800 font-medium" : "bg-gray-100 text-gray-800"}`}
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, "completed")}
                          className="px-3 py-1 rounded bg-green-100 text-green-800 text-xs"
                        >
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}