"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  FiCalendar,
  FiAlertCircle,
  FiPaperclip,
  FiClock,
  FiUsers,
  FiX,
  FiPlus,
  FiUpload,
  FiCheck,
  FiEye
} from "react-icons/fi";
import DashboardLayout from "@/components/DashboardLayout";

interface Notice {
  id: number;
  title: string;
  message: string;
  posted_date: string;
  valid_until?: string;
  important: boolean;
  attachment?: string;
  category?: "General" | "Holiday" | "Payroll" | "Policy" | "Urgent";
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

const NoticeBoard: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: "",
    message: "",
    important: false,
    valid_until: "",
    category: "General" as Notice["category"]
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Fetch notices
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_notices/`
        );

        if (!res.ok) throw new Error("Failed to fetch notices");
        const data = await res.json();

        if (Array.isArray(data.notices)) {
          setNotices(data.notices);
        } else {
          setNotices([]);
        }
      } catch (err) {
        console.error("API fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  // Fetch users for notice_to selection (client-side only)
  useEffect(() => {
    if (!isModalOpen) return;
    setUsersLoaded(false);
    if (typeof window === "undefined") return;

    const fetchUsers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/users/`);
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        console.log("Fetched users API response:", data);

        if (Array.isArray(data)) {
          const mappedUsers: User[] = data.map(
            (user: { email: string; role: string; is_staff: boolean }, idx: number) => {
              const name = user.email.split("@")[0];
              const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                name
              )}&background=random&color=fff`;
              return {
                id: idx,
                name,
                email: user.email,
                role: user.role,
                avatar,
              };
            }
          );
          setUsers(mappedUsers);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("User fetch error:", err);
        setUsers([]);
      } finally {
        setUsersLoaded(true);
      }
    };
    fetchUsers();
  }, [isModalOpen]);

const handleCreateNotice = async () => {
  try {
    // Get notice_by from localStorage
    const notice_by = typeof window !== 'undefined' ? localStorage.getItem('user_email') : null;
    if (!notice_by) {
      alert('User email not found in localStorage!');
      return;
    }

    // Determine notice_to
    let notice_to: string[] | null = null;
    if (!sendToAll) {
      if (selectedUsers.length === 0) {
        alert('Please select at least one user or send to all.');
        return;
      }
      notice_to = selectedUsers
        .map((id) => users.find((u) => u.id === id)?.email)
        .filter(Boolean) as string[];
    }

    // Handle attachment upload
    let attachment_url = '';
    if (attachmentFile) {
      const formData = new FormData();
      formData.append('file', attachmentFile);
      const uploadRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/upload_attachment/`,
        { method: 'POST', body: formData }
      );
      if (!uploadRes.ok) throw new Error('Attachment upload failed');
      const uploadData = await uploadRes.json();
      attachment_url = uploadData.url || '';
    }

    // Prepare request body
    const body = {
      ...newNotice,
      notice_by, // always from localStorage
      notice_to, // null for all or array of emails
      attachment: attachment_url || undefined,
    };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_notice/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('Failed to create notice:', text);
      return alert('Failed to create notice');
    }

    const createdNotice = await res.json();
    setNotices([createdNotice, ...notices]);
    setIsModalOpen(false);
    setNewNotice({ title: '', message: '', important: false, valid_until: '', category: 'General' });
    setAttachmentFile(null);
    setSelectedUsers([]);
    setSendToAll(true);
    alert('Notice created successfully!');
  } catch (err) {
    console.error(err);
    alert('Something went wrong!');
  }
};

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachmentFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewImage(null);
      }
    } else {
      setAttachmentFile(null);
      setPreviewImage(null);
    }
  };

  const getPriorityBorder = (important: boolean, category?: string) => {
    if (important) return "border-l-4 border-red-500";
    switch (category) {
      case "Urgent": return "border-l-4 border-orange-500";
      case "Holiday": return "border-l-4 border-yellow-500";
      case "Payroll": return "border-l-4 border-green-500";
      case "Policy": return "border-l-4 border-indigo-500";
      default: return "border-l-4 border-blue-500";
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case "Holiday":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "Payroll":
        return "bg-green-100 text-green-800 border border-green-200";
      case "Policy":
        return "bg-indigo-100 text-indigo-800 border border-indigo-200";
      case "Urgent":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "Holiday": return "🎉";
      case "Payroll": return "💰";
      case "Policy": return "📋";
      case "Urgent": return "🚨";
      default: return "📢";
    }
  };

  const toggleUserSelection = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout role="ceo">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 sm:p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notice Board</h1>
              <p className="text-gray-600">Keep your team informed with important updates and announcements</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-semibold"
            >
              <FiPlus className="text-lg" />
              Create Notice
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : notices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 ${getPriorityBorder(
                    notice.important,
                    notice.category
                  )}`}
                >
                  {/* Category Badge */}
                  {notice.category && (
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadge(
                          notice.category
                        )}`}
                      >
                        <span className="text-sm">{getCategoryIcon(notice.category)}</span>
                        {notice.category}
                      </span>
                      {notice.important && (
                        <span className="flex items-center gap-1 text-red-600 font-semibold text-sm">
                          <FiAlertCircle className="text-red-500" />
                          Important
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notice Content */}
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {notice.title}
                    </h2>
                    <p className="text-gray-600 leading-relaxed line-clamp-4 whitespace-pre-line">
                      {notice.message}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 items-center mt-6 pt-4 border-t border-gray-100">
                    <span className="flex items-center gap-2">
                      <FiCalendar className="text-gray-400" />
                      {formatDate(notice.posted_date)}
                    </span>
                    {notice.valid_until && (
                      <span className="flex items-center gap-2">
                        <FiClock className="text-gray-400" />
                        Until {formatDate(notice.valid_until)}
                      </span>
                    )}
                  </div>

                  {/* Attachment */}
                  {notice.attachment && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <a
                          href={notice.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                        >
                          <FiPaperclip />
                          View Attachment
                        </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mb-6">
                <FiEye className="text-3xl text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No notices yet</h3>
              <p className="text-gray-600 max-w-md mb-6">
                Start creating announcements to keep your team informed about important updates and news.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                Create Your First Notice
              </button>
            </div>
          )}
        </div>

        {/* Create Notice Modal */}
        {isModalOpen && typeof window !== "undefined" && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 overflow-auto backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Notice</h2>
                  <p className="text-gray-600 mt-1">Share important updates with your team</p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setAttachmentFile(null);
                    setSelectedUsers([]);
                    setSendToAll(true);
                    setNewNotice({ title: "", message: "", important: false, valid_until: "", category: "General" });
                    setPreviewImage(null);
                  }}
                  className="p-2 hover:bg-white rounded-xl transition-colors"
                >
                  <FiX className="text-xl text-gray-500" />
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Notice Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter a clear and concise title..."
                    value={newNotice.title}
                    onChange={(e) =>
                      setNewNotice({ ...newNotice, title: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Category
                  </label>
                  <select
                    value={newNotice.category}
                    onChange={(e) =>
                      setNewNotice({ ...newNotice, category: e.target.value as Notice["category"] })
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="General">General</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Policy">Policy</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Message *
                  </label>
                  <textarea
                    placeholder="Write your announcement details here..."
                    value={newNotice.message}
                    onChange={(e) =>
                      setNewNotice({ ...newNotice, message: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={5}
                  />
                </div>

                {/* Date & Importance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Valid Until (Optional)
                    </label>
                    <input
                      type="date"
                      value={newNotice.valid_until}
                      onChange={(e) =>
                        setNewNotice({ ...newNotice, valid_until: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="flex items-center justify-center">
                    <label className="flex items-center cursor-pointer bg-gray-50 rounded-xl p-4 w-full">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={newNotice.important}
                          onChange={(e) =>
                            setNewNotice({ ...newNotice, important: e.target.checked })
                          }
                          className="sr-only"
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${
                          newNotice.important ? 'bg-red-500' : 'bg-gray-300'
                        }`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                          newNotice.important ? 'transform translate-x-6' : ''
                        }`}></div>
                      </div>
                      <span className="ml-3 text-sm font-semibold text-gray-900">
                        Mark as Important
                      </span>
                    </label>
                  </div>
                </div>

                {/* Attachment */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Attachment (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    {previewImage ? (
                      <div className="mb-4">
                        <Image
                          src={previewImage}
                          alt="Preview"
                          className="max-h-32 mx-auto rounded-lg object-cover"
                          width={128}
                          height={128}
                        />
                      </div>
                    ) : (
                      <FiUpload className="mx-auto text-3xl text-gray-400 mb-3" />
                    )}
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiUpload />
                      Choose File
                    </label>
                    <p className="text-gray-500 text-sm mt-2">
                      {attachmentFile ? attachmentFile.name : "PNG, JPG, PDF up to 10MB"}
                    </p>
                  </div>
                </div>

                {/* Recipients */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Send To
                  </label>
                  
                  <div className="space-y-4">
                    {/* Send to All Toggle */}
                    <label className="flex items-center cursor-pointer bg-gray-50 rounded-xl p-4">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={sendToAll}
                          onChange={(e) => {
                            setSendToAll(e.target.checked);
                            if (e.target.checked) {
                              setSelectedUsers([]);
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${
                          sendToAll ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                          sendToAll ? 'transform translate-x-6' : ''
                        }`}></div>
                      </div>
                      <span className="ml-3 text-sm font-semibold text-gray-900">
                        Send to All Users
                      </span>
                    </label>

                    {/* User Selection */}
                    {!sendToAll && (
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl bg-white">
                        {!usersLoaded ? (
                          <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Loading users...</p>
                          </div>
                        ) : users.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <FiUsers className="mx-auto text-2xl mb-2" />
                            No users available
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {users.map((user) => (
                              <label
                                key={user.id}
                                className={`flex items-center p-4 cursor-pointer transition-colors hover:bg-blue-50 ${
                                  selectedUsers.includes(user.id) ? 'bg-blue-50' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.id)}
                                  onChange={() => toggleUserSelection(user.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Image
                                  src={user.avatar || '/default-avatar.png'}
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full ml-3 border-2 border-white shadow-sm"
                                  width={40}
                                  height={40}
                                />
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-900">{user.name}</span>
                                    <span
                                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                        user.role === "admin"
                                          ? "bg-red-100 text-red-700"
                                          : user.role === "employee"
                                          ? "bg-green-100 text-green-700"
                                          : user.role === "manager"
                                          ? "bg-purple-100 text-purple-700"
                                          : user.role === "hr"
                                          ? "bg-indigo-100 text-indigo-700"
                                          : "bg-gray-200 text-gray-700"
                                      }`}
                                    >
                                      {user.role
                                        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                                        : "User"}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setAttachmentFile(null);
                    setSelectedUsers([]);
                    setSendToAll(true);
                    setNewNotice({ title: "", message: "", important: false, valid_until: "", category: "General" });
                    setPreviewImage(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-white transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNotice}
                  disabled={!newNotice.title || !newNotice.message}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  <FiCheck />
                  Create Notice
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