"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface Task {
  id: number;           // make sure to match your API
  title: string;
  description: string;
  department: string;
  priority: string;
  status: string;
  due_date?: string;
  assigned_to?: string;
}

interface Report {
  id: number;
  title: string;
  description: string;
  content?: string;
  date?: string;
  created_at?: string;
  updated_at?: string;
}

export default function ReportsAndTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "reports">("tasks");

useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch tasks
      const tasksRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/list_tasks/`);
      if (!tasksRes.ok) throw new Error("Failed to fetch tasks");
      const tasksJson = await tasksRes.json();
      console.log("Tasks JSON:", tasksJson);

      // Fetch reports
      const reportsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/list_reports/`);
      if (!reportsRes.ok) throw new Error("Failed to fetch reports");
      const reportsJson = await reportsRes.json();
      console.log("Reports JSON:", reportsJson);

      // Set state using the arrays inside the returned objects
      setTasks(Array.isArray(tasksJson.tasks) ? tasksJson.tasks : []);
      setReports(Array.isArray(reportsJson.reports) ? reportsJson.reports : []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setTasks([]);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);



  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const openReportModal = (report: Report) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };

  const closeModals = () => {
    setSelectedTask(null);
    setSelectedReport(null);
    setIsTaskModalOpen(false);
    setIsReportModalOpen(false);
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800 border border-red-200";
      case "Medium": return "bg-amber-100 text-amber-800 border border-amber-200";
      default: return "bg-green-100 text-green-800 border border-green-200";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800 border border-green-200";
      case "In Progress": return "bg-blue-100 text-blue-800 border border-blue-200";
      default: return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  return (
    <DashboardLayout role="ceo">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header and Tabs */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Reports & Tasks</h1>
          <p className="text-gray-600 mb-6">Monitor all organizational reports and tasks</p>

          <div className="flex border-b border-gray-200">
            <button
              className={`py-3 px-6 font-medium text-sm transition-colors ${activeTab === "tasks" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("tasks")}
            >
              Tasks ({tasks.length})
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm transition-colors ${activeTab === "reports" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("reports")}
            >
              Reports ({reports.length})
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        {activeTab === "tasks" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No tasks available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {["ID","Title","Department","Priority","Status","Actions"].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map(task => (
                      <tr key={task.task_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm">{task.task_id}</td>
                        <td className="px-6 py-4">{task.title}</td>
                        <td className="px-6 py-4">{task.department}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => openTaskModal(task)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Reports Table */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No reports available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {["ID","Title","Description","Date","Actions"].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map(report => (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm">{report.id}</td>
                        <td className="px-6 py-4 font-medium">{report.title}</td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{report.description}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(report.date)}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => openReportModal(report)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Task Modal */}
        {isTaskModalOpen && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
                <button onClick={closeModals} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Department:</strong> {selectedTask.department}</div>
                <div><strong>Priority:</strong> <span className={getPriorityColor(selectedTask.priority)}>{selectedTask.priority}</span></div>
                <div><strong>Status:</strong> <span className={getStatusColor(selectedTask.status)}>{selectedTask.status}</span></div>
                {selectedTask.due_date && <div><strong>Due Date:</strong> {formatDate(selectedTask.due_date)}</div>}
              </div>
              <div className="mt-4"><strong>Description:</strong><p>{selectedTask.description}</p></div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {isReportModalOpen && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedReport.title}</h2>
                <button onClick={closeModals} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
              </div>
              <div><strong>Description:</strong><p>{selectedReport.description}</p></div>
              {selectedReport.content && <div className="mt-4"><strong>Content:</strong><p>{selectedReport.content}</p></div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div><strong>Date:</strong> {formatDate(selectedReport.date)}</div>
                <div><strong>Created At:</strong> {formatDate(selectedReport.created_at)}</div>
                <div><strong>Updated At:</strong> {formatDate(selectedReport.updated_at)}</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
