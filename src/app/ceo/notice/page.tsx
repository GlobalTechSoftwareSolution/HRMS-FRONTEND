"use client";

import React, { useState, useEffect } from "react";
import { 
  FiPlus, 
  FiBell, 
  FiClock, 
  FiSearch, 
  FiFilter,
  FiEdit,
  FiTrash2,
  FiX,
  FiAlertCircle,
  FiSend,
  FiCalendar,
  FiEye,
  FiEyeOff
} from "react-icons/fi";
import DashboardLayout from "@/components/DashboardLayout";

interface Notice {
  id: number;
  title: string;
  message: string;
  date: string;
  category: "General" | "Holiday" | "Payroll" | "Policy" | "Urgent";
  priority: "High" | "Medium" | "Low";
  isArchived: boolean;
  recipients: "All" | "Department" | "Individual";
  department?: string;
}

const NoticeBoard: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([
    {
      id: 1,
      title: "Diwali Holiday",
      message: "Office will remain closed on 1st Nov for Diwali celebrations. Wishing everyone a joyful and prosperous Diwali!",
      date: "2025-10-28",
      category: "Holiday",
      priority: "Medium",
      isArchived: false,
      recipients: "All"
    },
    {
      id: 2,
      title: "Payroll Update",
      message: "October salaries will be credited on 30th Oct. Please ensure your bank details are updated in the system by 28th Oct.",
      date: "2025-10-25",
      category: "Payroll",
      priority: "High",
      isArchived: false,
      recipients: "All"
    },
    {
      id: 3,
      title: "New Work From Home Policy",
      message: "Starting next month, employees can work from home up to 2 days per week. Please coordinate with your managers to schedule.",
      date: "2025-10-20",
      category: "Policy",
      priority: "Medium",
      isArchived: false,
      recipients: "All"
    },
    {
      id: 4,
      title: "Server Maintenance",
      message: "Scheduled server maintenance this weekend. Systems will be unavailable from 10 PM Saturday to 4 AM Sunday.",
      date: "2025-10-15",
      category: "General",
      priority: "High",
      isArchived: true,
      recipients: "All"
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | "General" | "Holiday" | "Payroll" | "Policy" | "Urgent">("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [showArchived, setShowArchived] = useState(false);
  
  const [newNotice, setNewNotice] = useState({
    title: "",
    message: "",
    category: "General" as "General" | "Holiday" | "Payroll" | "Policy" | "Urgent",
    priority: "Medium" as "High" | "Medium" | "Low",
    recipients: "All" as "All" | "Department" | "Individual",
    department: "",
  });

  // Filter notices based on search and filter criteria
  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || notice.category === categoryFilter;
    const matchesPriority = priorityFilter === "All" || notice.priority === priorityFilter;
    const matchesArchive = showArchived ? true : !notice.isArchived;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesArchive;
  });

  const handleAddNotice = () => {
    if (!newNotice.title.trim() || !newNotice.message.trim()) return;

    const notice: Notice = {
      id: notices.length > 0 ? Math.max(...notices.map(n => n.id)) + 1 : 1,
      title: newNotice.title,
      message: newNotice.message,
      date: new Date().toISOString().split("T")[0],
      category: newNotice.category,
      priority: newNotice.priority,
      isArchived: false,
      recipients: newNotice.recipients,
      department: newNotice.recipients === "Department" ? newNotice.department : undefined,
    };

    setNotices([notice, ...notices]);
    resetForm();
    setIsModalOpen(false);

    // Simulate notification
    alert(`📢 New notice "${notice.title}" has been published!`);
  };

  const handleUpdateNotice = () => {
    if (!selectedNotice) return;

    const updatedNotices = notices.map(notice => 
      notice.id === selectedNotice.id ? {
        ...notice,
        title: newNotice.title,
        message: newNotice.message,
        category: newNotice.category,
        priority: newNotice.priority,
        recipients: newNotice.recipients,
        department: newNotice.recipients === "Department" ? newNotice.department : undefined,
      } : notice
    );

    setNotices(updatedNotices);
    resetForm();
    setIsModalOpen(false);
    setSelectedNotice(null);
    setIsEditMode(false);

    alert(`✅ Notice "${newNotice.title}" has been updated successfully!`);
  };

  const handleDeleteNotice = () => {
    if (!selectedNotice) return;

    const updatedNotices = notices.filter(notice => notice.id !== selectedNotice.id);
    setNotices(updatedNotices);
    setIsDeleteModalOpen(false);
    setSelectedNotice(null);

    alert(`🗑️ Notice "${selectedNotice.title}" has been deleted!`);
  };

  const handleArchiveNotice = (id: number) => {
    const updatedNotices = notices.map(notice => 
      notice.id === id ? { ...notice, isArchived: !notice.isArchived } : notice
    );
    setNotices(updatedNotices);
  };

  const openEditModal = (notice: Notice) => {
    setSelectedNotice(notice);
    setNewNotice({
      title: notice.title,
      message: notice.message,
      category: notice.category,
      priority: notice.priority,
      recipients: notice.recipients,
      department: notice.department || "",
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openDeleteModal = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setNewNotice({
      title: "",
      message: "",
      category: "General",
      priority: "Medium",
      recipients: "All",
      department: "",
    });
  };

  const getPriorityColor = (priority: "High" | "Medium" | "Low") => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-700";
      case "Medium": return "bg-yellow-100 text-yellow-700";
      case "Low": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Holiday": return "🎉";
      case "Payroll": return "💰";
      case "Policy": return "📋";
      case "Urgent": return "🚨";
      default: return "📢";
    }
  };

  // Calculate statistics for dashboard
  const activeCount = notices.filter(n => !n.isArchived).length;
  const archivedCount = notices.filter(n => n.isArchived).length;
  const urgentCount = notices.filter(n => n.priority === "High" && !n.isArchived).length;

  return (
    <DashboardLayout role='ceo'>
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notice Board</h1>
            <p className="text-gray-600">Company announcements and important updates</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsEditMode(false);
              setSelectedNotice(null);
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            <FiPlus className="mr-2" /> Add New Notice
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                <FiBell size={20} />
              </div>
              <div>
                <h3 className="text-sm text-gray-600">Active Notices</h3>
                <p className="text-2xl font-bold text-gray-800">{activeCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100 text-red-600 mr-4">
                <FiAlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm text-gray-600">Urgent Notices</h3>
                <p className="text-2xl font-bold text-gray-800">{urgentCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gray-100 text-gray-600 mr-4">
                <FiEyeOff size={20} />
              </div>
              <div>
                <h3 className="text-sm text-gray-600">Archived</h3>
                <p className="text-2xl font-bold text-gray-800">{archivedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2">
                <FiFilter className="text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="All">All Categories</option>
                  <option value="General">General</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Policy">Policy</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${showArchived ? 'bg-gray-100' : ''}`}
              >
                {showArchived ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                {showArchived ? "Hide Archived" : "Show Archived"}
              </button>
            </div>
          </div>
        </div>

        {/* Notices List */}
        <div className="space-y-4">
          {filteredNotices.length > 0 ? (
            filteredNotices.map((notice) => (
              <div
                key={notice.id}
                className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${notice.isArchived ? 'border-gray-300 opacity-80' : 
                  notice.priority === 'High' ? 'border-red-500' : 
                  notice.priority === 'Medium' ? 'border-yellow-400' : 'border-blue-500'}`
                }
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{getCategoryIcon(notice.category)}</span>
                      <h2 className="text-lg font-semibold text-gray-800">{notice.title}</h2>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notice.priority)}`}>
                        {notice.priority}
                      </span>
                      {notice.isArchived && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-2 whitespace-pre-line">{notice.message}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiCalendar /> {new Date(notice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded-md">{notice.category}</span>
                      <span className="flex items-center gap-1">
                        <FiSend /> To: {notice.recipients} {notice.department && `(${notice.department})`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleArchiveNotice(notice.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title={notice.isArchived ? "Unarchive" : "Archive"}
                    >
                      {notice.isArchived ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => openEditModal(notice)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(notice)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <FiBell className="mx-auto text-4xl text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-700">No notices found</h3>
              <p className="text-gray-500 mt-1">
                {searchTerm || categoryFilter !== "All" || priorityFilter !== "All" || showArchived
                  ? "Try changing your filters or search term"
                  : "Get started by creating your first notice"}
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Notice Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  {isEditMode ? "Edit Notice" : "Add New Notice"}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={newNotice.title}
                      onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                      placeholder="Notice title"
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={newNotice.message}
                      onChange={(e) => setNewNotice({...newNotice, message: e.target.value})}
                      placeholder="Write your notice..."
                      rows={4}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newNotice.category}
                        onChange={(e) => setNewNotice({...newNotice, category: e.target.value as any})}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="General">General</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Payroll">Payroll</option>
                        <option value="Policy">Policy</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={newNotice.priority}
                        onChange={(e) => setNewNotice({...newNotice, priority: e.target.value as any})}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                      <select
                        value={newNotice.recipients}
                        onChange={(e) => setNewNotice({...newNotice, recipients: e.target.value as any})}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="All">All Employees</option>
                        <option value="Department">Specific Department</option>
                        <option value="Individual">Individual</option>
                      </select>
                    </div>
                    {newNotice.recipients === "Department" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <input
                          type="text"
                          value={newNotice.department}
                          onChange={(e) => setNewNotice({...newNotice, department: e.target.value})}
                          placeholder="Department name"
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={isEditMode ? handleUpdateNotice : handleAddNotice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                >
                  {isEditMode ? "Update Notice" : "Publish Notice"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiAlertCircle className="text-red-500" />
                  Confirm Deletion
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600">
                  Are you sure you want to delete the notice <strong>"{selectedNotice?.title}"</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="p-6 border-t flex justify-end gap-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteNotice}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
                >
                  Delete Notice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NoticeBoard;