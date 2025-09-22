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

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/list_reports/`);
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

  const todayDate = new Date().toISOString().split("T")[0];
  const todayReports = reports.filter(r => r.date.startsWith(todayDate));

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Reports 📊</h1>

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
              <div className="bg-white p-4 md:p-6 rounded-xl shadow border border-gray-100 mb-6">
                <h2 className="text-lg font-semibold mb-3">Today&apos;s Reports ({todayReports.length})</h2>
                {todayReports.length === 0 ? (
                  <p className="text-gray-500">No reports created today.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {todayReports.map(report => (
                      <div key={report.id} className="p-3 rounded-lg border border-gray-200 bg-white hover:shadow-lg">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-semibold text-gray-800">{report.title}</h3>
                          <span className="text-xs text-gray-500">{report.email}</span>
                        </div>
                        <p className="text-gray-600">{report.description}</p>
                        <div className="mt-1 text-sm text-gray-500">
                          {new Date(report.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All Reports */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow border border-gray-100">
                <h2 className="text-lg font-semibold mb-3">All Reports</h2>
                <div className="flex flex-col gap-3">
                  {reports.map(report => (
                    <div key={report.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <h3 className="font-semibold text-gray-800">{report.title}</h3>
                      <p className="text-gray-600">{report.description}</p>
                      <p className="text-xs text-gray-500 mt-1">By {report.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
