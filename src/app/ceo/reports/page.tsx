"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Employee {
  name: string;
  email: string;
  department?: string;
  profileImage?: string;
}

interface Task {
  task_id: number;
  email: string;
  title: string;
  description: string;
  department: string;
  priority: string;
  status: string;
  due_date?: string;
  assigned_to?: Employee;
}

interface Report {
  task_id: number;
  email: string;
  title: string;
  description: string;
  content?: string;
  date?: string;
  created_at?: string;
  updated_at?: string;
  assigned_to?: Employee;
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
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const tasksRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_tasks/`
        );
        if (!tasksRes.ok) throw new Error("Failed to fetch tasks");
        const tasksJson = await tasksRes.json();

        const reportsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_reports/`
        );
        if (!reportsRes.ok) throw new Error("Failed to fetch reports");
        const reportsJson = await reportsRes.json();

        setTasks(Array.isArray(tasksJson.tasks) ? tasksJson.tasks : []);
        setReports(Array.isArray(reportsJson.reports) ? reportsJson.reports : []);
        
        // Fetch employees after tasks and reports
        await fetchEmployees();
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

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`);
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openTaskModal = (task: Task) => {
    const employee = employees.find(emp => emp.email === task.email);
    const taskWithDept = { 
      ...task, 
      department: employee?.department || "Not Assigned" 
    };
    setSelectedTask(taskWithDept);
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
      case "High":
        return "bg-red-100 text-red-800 border border-red-200";
      case "Medium":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      default:
        return "bg-green-100 text-green-800 border border-green-200";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border border-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  // ✅ PDF GENERATOR (includes email column)
  const downloadCombinedPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Organization Report", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    let y = 40;

    // --- TASKS SECTION ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Task Summary", 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Email", "Title", "Department", "Priority", "Status", "Due Date"]],
      body: tasks.map((task) => {
        const employee = employees.find(emp => emp.email === task.email);
        const department = employee?.department || "Not Assigned";
        return [
          task.email,
          task.title,
          department,
          task.priority || "-",
          task.status || "-",
          task.due_date ? formatDate(task.due_date) : "-",
        ];
      }),
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [33, 150, 243], textColor: 255, halign: "center" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    type jsPDFWithPlugin = jsPDF & {
      lastAutoTable?: {
        finalY: number;
      };
    };

    let lastY = (doc as jsPDFWithPlugin).lastAutoTable?.finalY ?? 0;
    lastY += 10;

    // --- REPORTS SECTION ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Reports Summary", 14, lastY);
    lastY += 5;

    autoTable(doc, {
      startY: lastY,
      head: [["Email", "Title", "Description", "Date", "Created At", "Updated At"]],
      body: reports.map((report) => [
        report.email,
        report.title,
        report.description || "-",
        report.date ? formatDate(report.date) : "-",
        report.created_at ? formatDate(report.created_at) : "-",
        report.updated_at ? formatDate(report.updated_at) : "—",
      ]),
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [76, 175, 80], textColor: 255, halign: "center" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 30,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    doc.save("organization-report.pdf");
  };

  // Task Card Component for Mobile
  const TaskCard = ({ task }: { task: Task }) => {
    const emp = employees.find(e => e.email === task.email);
    const dept = emp?.department || "Not Assigned";
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-gray-800 text-lg">{task.title}</h3>
          <button
            onClick={() => openTaskModal(task)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            View
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Email:</span>
            <span className="text-gray-800 text-sm">{task.email}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Department:</span>
            <span className="text-gray-800 text-sm">{dept}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Priority:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
          </div>
          
          {task.due_date && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Due Date:</span>
              <span className="text-gray-800 text-sm">{formatDate(task.due_date)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Report Card Component for Mobile
  const ReportCard = ({ report }: { report: Report }) => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-gray-800 text-lg">{report.title}</h3>
          <button
            onClick={() => openReportModal(report)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            View
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Email:</span>
            <span className="text-gray-800 text-sm">{report.email}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-gray-600 text-sm mb-1">Description:</span>
            <span className="text-gray-800 text-sm line-clamp-2">{report.description}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Date:</span>
            <span className="text-gray-800 text-sm">{formatDate(report.date)}</span>
          </div>
          
          {report.created_at && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Created:</span>
              <span className="text-gray-800 text-sm">{formatDate(report.created_at)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout role="ceo">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Reports & Tasks
          </h1>
          <p className="text-gray-600 mb-6">
            Monitor all organizational reports and tasks
          </p>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              className={`py-3 px-4 md:px-6 font-medium text-sm transition-colors flex-1 md:flex-none ${
                activeTab === "tasks"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("tasks")}
            >
              Tasks ({tasks.length})
            </button>
            <button
              className={`py-3 px-4 md:px-6 font-medium text-sm transition-colors flex-1 md:flex-none ${
                activeTab === "reports"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("reports")}
            >
              Reports ({reports.length})
            </button>
          </div>

          {/* Download PDF Button */}
          <button
            onClick={downloadCombinedPDF}
            className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Download Professional PDF
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* TASKS SECTION */}
        {activeTab === "tasks" && !isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {tasks.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-lg">No tasks available</p>
                <p className="text-sm text-gray-400 mt-2">Tasks will appear here once created</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Email", "Title", "Department", "Priority", "Status", "Actions"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tasks.map((task) => {
                        const emp = employees.find(e => e.email === task.email);
                        const dept = emp?.department || "Not Assigned";
                        return (
                          <tr key={task.task_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {task.email}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {task.title}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {dept}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                  task.priority
                                )}`}
                              >
                                {task.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  task.status
                                )}`}
                              >
                                {task.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => openTaskModal(task)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4">
                  {tasks.map((task) => (
                    <TaskCard key={task.task_id} task={task} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* REPORTS SECTION */}
        {activeTab === "reports" && !isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {reports.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-lg">No reports available</p>
                <p className="text-sm text-gray-400 mt-2">Reports will appear here once created</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Email", "Title", "Description", "Date", "Actions"].map((h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.map((report) => (
                        <tr key={report.task_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {report.email}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {report.title}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                            <div className="line-clamp-2">{report.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(report.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => openReportModal(report)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4">
                  {reports.map((report) => (
                    <ReportCard key={report.task_id} report={report} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* TASK MODAL */}
        {isTaskModalOpen && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{selectedTask.title}</h2>
                <button
                  onClick={closeModals}
                  className="text-gray-500 hover:text-gray-700 text-xl ml-4 transition-colors"
                >
                  &times;
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-600">Email: </strong> 
                  <span className="text-gray-800">{selectedTask.email}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-600">Department: </strong> 
                  <span className="text-gray-800">{selectedTask.department}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-600">Priority: </strong>{" "}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-600">Status: </strong>{" "}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                </div>
                {selectedTask.due_date && (
                  <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
                    <strong className="text-gray-600">Due Date: </strong> 
                    <span className="text-gray-800">{formatDate(selectedTask.due_date)}</span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <strong className="text-gray-600 block mb-2">Description: </strong>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedTask.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* REPORT MODAL */}
        {isReportModalOpen && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{selectedReport.title}</h2>
                <button
                  onClick={closeModals}
                  className="text-gray-500 hover:text-gray-700 text-xl ml-4 transition-colors"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-600">Email:</strong> 
                  <span className="text-gray-800 ml-2">{selectedReport.email}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-600">Description:</strong> 
                  <p className="text-gray-700 mt-1">{selectedReport.description}</p>
                </div>
                {selectedReport.content && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <strong className="text-gray-600">Content:</strong> 
                    <p className="text-gray-700 mt-1">{selectedReport.content}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <strong className="text-gray-600">Date:</strong> 
                    <span className="text-gray-800 block mt-1">{formatDate(selectedReport.date)}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <strong className="text-gray-600">Created At:</strong> 
                    <span className="text-gray-800 block mt-1">{formatDate(selectedReport.created_at)}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <strong className="text-gray-600">Updated At:</strong> 
                    <span className="text-gray-800 block mt-1">{formatDate(selectedReport.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}