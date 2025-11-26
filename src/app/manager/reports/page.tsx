"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Report = {
  id: number;
  title: string;
  description: string;
  content: string;
  date: string;
  email: string;
  created_at: string;
};

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_reports/`);
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data = await res.json();

        // The API wraps reports in a `reports` array
        setReports(Array.isArray(data.reports) ? data.reports : []);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const openReport = (report: Report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const closeReport = () => {
    setSelectedReport(null);
    setShowModal(false);
  };

  const todayDate = new Date().toISOString().split("T")[0];
  const todayReports = reports.filter(r => r.date.startsWith(todayDate));

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Reports 📊</h1>

          {loading ? (
            <p className="text-gray-500">Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="text-gray-500">No reports found.</p>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-500 mb-2">Total Reports</h2>
                  <p className="text-xl font-bold text-gray-800">{reports.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-500 mb-2">Today&apos;s Reports</h2>
                  <p className="text-xl font-bold text-blue-700">{todayReports.length}</p>
                </div>
              </div>

              {/* Today's Reports */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Today&apos;s Reports ({todayReports.length})</h2>
                {todayReports.length === 0 ? (
                  <p className="text-gray-500">No reports created today.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todayReports.map(report => (
                      <div
                        key={report.id}
                        className="p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        onClick={() => openReport(report)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{report.title}</h3>
                          <span className="text-xs text-gray-500 break-words max-w-[120px] text-right">{report.email}</span>
                        </div>
                        <p className="text-gray-700">{report.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All Reports */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">All Reports</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.map(report => (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      onClick={() => openReport(report)}
                    >
                      <h3 className="font-semibold text-gray-900 text-lg">{report.title}</h3>
                      <p className="text-gray-700 mt-1">{report.description}</p>
                      <p className="text-xs text-gray-500 mt-2 break-words">By {report.email}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal */}
              {showModal && selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
                  <div className="bg-white p-6 rounded-2xl max-w-lg w-full shadow-2xl relative animate-fade-in">
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 text-lg font-bold"
                      onClick={closeReport}
                    >
                      ✖
                    </button>
                    <h2 className="text-2xl font-bold mb-3 text-gray-900">{selectedReport.title}</h2>
                    <p className="text-gray-700 mb-2">{selectedReport.description}</p>
                    <p className="text-gray-500 mb-1 break-words">By: {selectedReport.email}</p>
                    <p className="text-gray-500 mb-3">Date: {new Date(selectedReport.date).toLocaleDateString()}</p>
                    <div className="mt-4 border-t pt-3 text-gray-700 whitespace-pre-wrap">{selectedReport.content}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
