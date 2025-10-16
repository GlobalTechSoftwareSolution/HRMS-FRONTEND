"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FiCalendar,
  FiAlertCircle,
  FiSearch,
  FiBookmark,
  FiBell,
} from "react-icons/fi";

type Notice = {
  id: number;
  title: string;
  message: string;
  email: string;
  posted_date: string;
  valid_until: string | null;
  important: boolean;
  attachment?: string | null;
  category?: string;
  is_read?: boolean;
};

type FilterType = "all" | "unread" | "important" | "with-attachments";

export default function NoticeDashboard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [bookmarkedNotices, setBookmarkedNotices] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  // newEmail and newNoticeBy will be set from localStorage.user_email
  const [newNoticeTo, setNewNoticeTo] = useState("");

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_notices/`
      );
      if (!res.ok) throw new Error("Failed to fetch notices");
      const data = await res.json();

      // Read user email directly from localStorage
      const userEmail =
        typeof window !== "undefined"
          ? localStorage.getItem("user_email")
          : null;

      // Use readNoticeIds from localStorage (persisted)
      const readNoticeIds: number[] =
        typeof window !== "undefined" && localStorage.getItem("read_notices")
          ? JSON.parse(localStorage.getItem("read_notices")!)
          : [];

      // Prepare notices and mark defaults
      const noticesWithDefaults = (data.notices || []).map((notice: Notice) => ({
        ...notice,
        category: notice.category || "General",
      }));

      // Filter notices by notice_to field only
      const filteredByEmail =
        userEmail != null
          ? noticesWithDefaults.filter(
              (notice: Notice & { notice_to?: string }) => notice.notice_to === userEmail
            )
          : [];

      // Merge readNoticeIds to mark notices as read
      const mergedNotices = filteredByEmail.map((notice: Notice) => ({
        ...notice,
        is_read: readNoticeIds.includes(notice.id),
      }));

      setNotices(mergedNotices);
      setFilteredNotices(mergedNotices);
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleCreateNotice = async (
    title: string,
    message: string,
    email: string,
    notice_by: string,
    notice_to: string
  ) => {
    try {
      const newNotice = {
        title,
        message,
        email,
        notice_by,
        notice_to,
        posted_date: new Date().toISOString(),
        valid_until: null,
        important: false,
        category: "General",
      };
      const response = await fetch(
        "https://globaltechsoftwaresolutions.cloud/api/accounts/create_notice/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newNotice),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to post new notice");
      }
      await fetchNotices();
      setShowModal(false);
      // Reset form fields after successful post
      setNewTitle("");
      setNewMessage("");
      setNewNoticeTo("");
    } catch (error) {
      console.error("Error creating notice:", error);
    }
  };

  useEffect(() => {
    let result = notices;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (notice) =>
          notice.title.toLowerCase().includes(term) ||
          notice.message.toLowerCase().includes(term) ||
          notice.email.toLowerCase().includes(term)
      );
    }

    if (showUnreadOnly) {
      result = result.filter((notice) => !notice.is_read);
    }

    switch (filter) {
      case "unread":
        result = result.filter((notice) => !notice.is_read);
        break;
      case "important":
        result = result.filter((notice) => notice.important);
        break;
      case "with-attachments":
        result = result.filter((notice) => notice.attachment);
        break;
      default:
        break;
    }

    setFilteredNotices(result);
  }, [notices, searchTerm, filter, showUnreadOnly]);

  const handleNoticeSelect = (notice: Notice) => {
    setSelectedNotice(notice);

    if (!notice.is_read) {
      setNotices((prev) =>
        prev.map((n) => (n.id === notice.id ? { ...n, is_read: true } : n))
      );

      // Persist in localStorage
      let readNoticeIds: number[] = [];
      const stored = localStorage.getItem("read_notices");
      if (stored) readNoticeIds = JSON.parse(stored);
      if (!readNoticeIds.includes(notice.id)) {
        readNoticeIds.push(notice.id);
        localStorage.setItem("read_notices", JSON.stringify(readNoticeIds));
      }

      setFilteredNotices((prev) =>
        prev.map((n) => (n.id === notice.id ? { ...n, is_read: true } : n))
      );
    }
  };

  const toggleBookmark = (noticeId: number) => {
    setBookmarkedNotices((prev) =>
      prev.includes(noticeId)
        ? prev.filter((id) => id !== noticeId)
        : [...prev, noticeId]
    );
  };

  const markAllAsRead = () => {
    setNotices((prev) => {
      const updated = prev.map((notice) => ({ ...notice, is_read: true }));
      // Persist all notice IDs as read in localStorage
      if (typeof window !== "undefined") {
        const allIds = updated.map((notice) => notice.id);
        localStorage.setItem("read_notices", JSON.stringify(allIds));
      }
      return updated;
    });
  };

  const isBookmarked = (noticeId: number) => bookmarkedNotices.includes(noticeId);
  const unreadCount = notices.filter((notice) => !notice.is_read).length;
  const importantCount = notices.filter((notice) => notice.important).length;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-black flex items-center gap-3">
            <FiBell className="text-black" />
            Notices
          </h1>
          <p className="text-gray-700">
            Stay updated with important announcements and updates
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              Mark All as Read
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Post New Notice
          </button>
          <button
            onClick={() =>
              setViewMode(viewMode === "list" ? "grid" : "list")
            }
            className="px-4 py-2 border border-black rounded-lg hover:bg-gray-100 text-black text-sm"
          >
            {viewMode === "list" ? "Grid View" : "List View"}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4">Create New Notice</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // Get user email from localStorage for both email and notice_by
                const userEmail =
                  typeof window !== "undefined"
                    ? localStorage.getItem("user_email") || ""
                    : "";
                await handleCreateNotice(
                  newTitle,
                  newMessage,
                  userEmail,
                  userEmail,
                  newNoticeTo
                );
              }}
            >
              <div className="mb-3">
                <label className="block mb-1 font-medium" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  className="w-full border border-black rounded px-3 py-2"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-medium" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  className="w-full border border-black rounded px-3 py-2"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  required
                />
              </div>
              {/* Email (From) and Notice By fields are now set automatically and hidden from the user */}
              <div className="mb-3">
                <label className="block mb-1 font-medium" htmlFor="noticeTo">
                  Notice To
                </label>
                <input
                  id="noticeTo"
                  type="text"
                  className="w-full border border-black rounded px-3 py-2"
                  value={newNoticeTo}
                  onChange={(e) => setNewNoticeTo(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-black rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-black rounded-xl p-4 shadow-sm">
          <p className="text-gray-700 text-sm">Total Notices</p>
          <p className="text-2xl font-bold">{notices.length}</p>
        </div>
        <div className="bg-white border border-black rounded-xl p-4 shadow-sm">
          <p className="text-gray-700 text-sm">Unread</p>
          <p className="text-2xl font-bold">{unreadCount}</p>
        </div>
        <div className="bg-white border border-black rounded-xl p-4 shadow-sm">
          <p className="text-gray-700 text-sm">Important</p>
          <p className="text-2xl font-bold text-red-600">{importantCount}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-black rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-black rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-4 py-2 rounded-lg border text-sm ${showUnreadOnly
                  ? "bg-black text-white"
                  : "bg-white text-black border-black hover:bg-gray-100"
                }`}
            >
              Unread Only
            </button>
            {(["all", "important", "with-attachments"] as FilterType[]).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg border text-sm ${filter === f
                      ? "bg-black text-white"
                      : "bg-white text-black border-black hover:bg-gray-100"
                    }`}
                >
                  {f === "with-attachments"
                    ? "With Files"
                    : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Notices */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="border border-black rounded-xl p-8 text-center shadow-sm">
          <FiAlertCircle className="mx-auto text-red-500 text-5xl mb-4" />
          <h3 className="text-xl font-semibold text-black mb-2">
            No matching notices
          </h3>
          <p className="text-gray-700">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div
          className={`grid ${viewMode === "list" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
            } gap-4`}
        >
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => handleNoticeSelect(notice)}
              className={`p-4 border rounded-lg shadow-sm cursor-pointer transition ${selectedNotice?.id === notice.id
                  ? "border-black bg-gray-50"
                  : "border-black hover:bg-gray-100"
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-black">
                  {notice.important && (
                    <FiAlertCircle className="inline text-red-500 mr-1" />
                  )}
                  {notice.title}
                </h3>
                <FiBookmark
                  className={`cursor-pointer ${isBookmarked(notice.id)
                      ? "text-red-500"
                      : "text-black hover:text-red-500"
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(notice.id);
                  }}
                />
              </div>

              <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                {notice.message}
              </p>

              <div className="flex justify-between text-xs text-gray-700">
                <span className="flex items-center gap-1">
                  <FiCalendar />
                  {formatDate(notice.posted_date)}
                </span>
                {!notice.is_read && (
                  <span className="bg-black text-white px-2 py-0.5 rounded-full">
                    Unread
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}