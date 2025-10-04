"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
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

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_notices/`
      );
      if (!res.ok) throw new Error("Failed to fetch notices");
      const data = await res.json();
      const noticesWithDefaults = (data.notices || []).map((notice: Notice) => ({
        ...notice,
        is_read: notice.is_read || false,
        category: notice.category || "General",
      }));
      setNotices(noticesWithDefaults);
      setFilteredNotices(noticesWithDefaults);
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

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
    setNotices((prev) => prev.map((notice) => ({ ...notice, is_read: true })));
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
    <DashboardLayout role="employee">
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
              onClick={() =>
                setViewMode(viewMode === "list" ? "grid" : "list")
              }
              className="px-4 py-2 border border-black rounded-lg hover:bg-gray-100 text-black text-sm"
            >
              {viewMode === "list" ? "Grid View" : "List View"}
            </button>
          </div>
        </div>

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
                className={`px-4 py-2 rounded-lg border text-sm ${
                  showUnreadOnly
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
                    className={`px-4 py-2 rounded-lg border text-sm ${
                      filter === f
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
            className={`grid ${
              viewMode === "list" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
            } gap-4`}
          >
            {filteredNotices.map((notice) => (
              <div
                key={notice.id}
                onClick={() => handleNoticeSelect(notice)}
                className={`p-4 border rounded-lg shadow-sm cursor-pointer transition ${
                  selectedNotice?.id === notice.id
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
                    className={`cursor-pointer ${
                      isBookmarked(notice.id)
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
    </DashboardLayout>
  );
}
