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
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_notice/`,
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
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 md:p-8 lg:p-10 w-full relative">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 sm:mb-8 md:mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3 mb-1">
              <FiBell className="text-slate-800" />
              Notices
            </h1>
            <p className="text-sm sm:text-md text-slate-500 font-medium tracking-wide">
              Stay updated with important announcements and updates
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-5 py-2.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-sm text-sm"
              >
                Mark All as Read
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm text-sm"
            >
              Post New Notice
            </button>
            <button
              onClick={() =>
                setViewMode(viewMode === "list" ? "grid" : "list")
              }
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-sm text-sm"
            >
              {viewMode === "list" ? "Grid View" : "List View"}
            </button>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg relative shadow-2xl">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Notice</h2>
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
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-semibold text-slate-700" htmlFor="title">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-semibold text-slate-700" htmlFor="message">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[120px] resize-y"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    required
                  />
                </div>
                {/* Email (From) and Notice By fields are now set automatically and hidden from the user */}
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-semibold text-slate-700" htmlFor="noticeTo">
                    Notice To <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="noticeTo"
                    type="text"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={newNoticeTo}
                    onChange={(e) => setNewNoticeTo(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 text-slate-700 font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Total Notices</p>
            <p className="text-2xl font-extrabold text-slate-800">{notices.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Unread</p>
            <p className="text-2xl font-extrabold text-slate-800">{unreadCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Important</p>
            <p className="text-2xl font-extrabold text-rose-600">{importantCount}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${showUnreadOnly
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                Unread Only
              </button>
              {(["all", "important", "with-attachments"] as FilterType[]).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${filter === f
                      ? "bg-slate-800 text-white"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-800"></div>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
            <FiAlertCircle className="mx-auto text-slate-300 text-5xl mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              No matching notices
            </h3>
            <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div
            className={`grid ${viewMode === "list" ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"
              } gap-4 sm:gap-6`}
          >
            {filteredNotices.map((notice) => (
              <div
                key={notice.id}
                onClick={() => handleNoticeSelect(notice)}
                className={`p-5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-sm border ${selectedNotice?.id === notice.id
                  ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200"
                  : "bg-white border-slate-200 hover:shadow-md hover:-translate-y-1 hover:border-slate-300"
                  }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight pr-4">
                      {notice.important && (
                        <FiAlertCircle className="inline text-rose-500 mr-1.5 w-5 h-5 -mt-0.5" />
                      )}
                      {notice.title}
                    </h3>
                    <FiBookmark
                      className={`cursor-pointer w-5 h-5 transition-colors ${isBookmarked(notice.id)
                        ? "text-rose-500 fill-rose-500"
                        : "text-slate-300 hover:text-rose-400"
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(notice.id);
                      }}
                    />
                  </div>

                  <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {notice.message}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold mt-auto pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <FiCalendar className="w-3.5 h-3.5" />
                    {formatDate(notice.posted_date)}
                  </span>
                  {!notice.is_read && (
                    <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg">
                      Unread
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}