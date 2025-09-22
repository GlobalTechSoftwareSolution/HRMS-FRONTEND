"use client";

import React, { useState, useEffect } from "react";
import {
  FiCalendar,
  FiAlertCircle,
  FiPaperclip,
  FiClock,
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

const NoticeBoard: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        console.log("🔄 Fetching notices from API...");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/list_notices/`
        );

        if (!res.ok) throw new Error("Failed to fetch notices");
        const data = await res.json();
        console.log("✅ Notices fetched:", data);

        if (Array.isArray(data)) {
          setNotices(data);
        } else if (Array.isArray(data.notices)) {
          setNotices(data.notices);
        } else {
          setNotices([]);
        }
      } catch (err) {
        console.error("❌ API fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const getPriorityBorder = (important: boolean) =>
    important ? "border-red-500" : "border-blue-400";

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case "Holiday":
        return "bg-yellow-100 text-yellow-800";
      case "Payroll":
        return "bg-green-100 text-green-800";
      case "Policy":
        return "bg-indigo-100 text-indigo-800";
      case "Urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout role="ceo">
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">📢 Notice Board</h1>

        {loading ? (
          <div className="text-center py-10 text-gray-500 animate-pulse">
            Loading notices...
          </div>
        ) : notices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`group relative bg-white p-5 rounded-xl shadow-md border-l-4 ${getPriorityBorder(
                  notice.important
                )} transition-transform duration-300 hover:scale-105 hover:shadow-xl`}
              >
                {/* Category badge */}
                {notice.category && (
                  <span
                    className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${getCategoryBadge(
                      notice.category
                    )}`}
                  >
                    {notice.category}
                  </span>
                )}

                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {notice.title}
                  </h2>
                  {notice.important && (
                    <span className="flex items-center gap-1 text-red-600 font-medium text-sm">
                      <FiAlertCircle /> Important
                    </span>
                  )}
                </div>

                <p className="text-gray-600 mt-1 whitespace-pre-line line-clamp-4">
                  {notice.message}
                </p>

                <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-500 items-center">
                  <span className="flex items-center gap-1">
                    <FiCalendar />
                    {new Date(notice.posted_date).toLocaleDateString()}
                  </span>
                  {notice.valid_until && (
                    <span className="flex items-center gap-1">
                      <FiClock />
                      Valid until: {new Date(notice.valid_until).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {notice.attachment && (
                  <a
                    href={notice.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline mt-3 inline-flex items-center gap-1 font-medium"
                  >
                    <FiPaperclip /> View Attachment
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-white p-8 rounded-xl shadow-md border border-gray-200">
            <FiAlertCircle className="text-4xl text-gray-300 mb-3 animate-bounce" />
            <h3 className="text-lg font-medium text-gray-700">No notices found</h3>
            <p className="text-gray-500 mt-1 text-center">
              Check back later or create new notices for employees
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NoticeBoard;
