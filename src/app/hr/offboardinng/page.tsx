"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import Image from "next/image";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { X, ChevronLeft, Mail, Phone, Calendar, Building, Briefcase, Download, User, Users, LogOut } from "lucide-react";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

interface Employee {
  id?: number;
  email: string;
  fullname: string;
  phone?: string;
  department?: string;
  designation?: string;
  date_joined?: string;
  profile_picture?: string;
  reason_for_resignation?: string;
  description?: string;
  releaved_date?: string;
  releaved?: string;
  manager_approved?: string;
  hr_approved?: string;
  offboarded_at?: string;
  ready_to_releve?: boolean;
}

const EmployeeList = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [releavedEmployees, setReleavedEmployees] = useState<Employee[]>([]);
  const [appliedEmployees, setAppliedEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedReleavedEmployee, setSelectedReleavedEmployee] = useState<Employee | null>(null);
  const [showRemoveForm, setShowRemoveForm] = useState<Employee | null>(null);
  const [terminationReason, setTerminationReason] = useState("");
  const [terminationDate, setTerminationDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "applied" | "releaved">("active");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<{ index: number, employee: Employee | null } | null>(null);
  const [clickedStep, setClickedStep] = useState<{ index: number, employee: Employee | null } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clickedStep && popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setClickedStep(null);
        setHoveredStep(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clickedStep]);

  const triggerRefresh = () => {
    console.log('🔄 Triggering manual refresh...');
    setRefreshTrigger(prev => prev + 1);
  };

  const EMPLOYEES_API = `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`;
  const RELEAVED_API = `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_releaved/`

  // Fetch Employees + Releaved
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const [activeRes, releavedRes] = await Promise.all([
          axios.get(EMPLOYEES_API),
          axios.get(RELEAVED_API),
        ]);

        const employeesArray = Array.isArray(activeRes.data) ? activeRes.data : (activeRes.data?.employees || activeRes.data?.active || activeRes.data?.data || []);
        setEmployees(employeesArray);

        const allReleaved = Array.isArray(releavedRes.data) ? releavedRes.data : (releavedRes.data?.releaved_employees || releavedRes.data?.releaved || releavedRes.data?.employees || releavedRes.data?.data || []);

        // Releaved Employees - only those actually HR approved (not pending/empty)
        const filteredReleaved = allReleaved.filter(
          (emp: {
            manager_approved?: string;
            hr_approved?: string;
            offboarded_at?: string;
            ready_to_releve?: boolean;
          }) => {
            const managerApproved =
              emp.manager_approved?.toString().toLowerCase() === "approved" ||
              emp.manager_approved?.toString().toLowerCase() === "yes";

            const hrStatus = emp.hr_approved?.toString().toLowerCase();

            // Only show if HR has actually approved (not pending/empty)
            const hrActuallyApproved =
              hrStatus === "approved" || hrStatus === "yes";

            const readyToReleve = emp.ready_to_releve === true;

            const relieved = !!emp.offboarded_at || readyToReleve; // include ready_to_releve employees as releaved

            return managerApproved && hrActuallyApproved && relieved;
          }
        );
        setReleavedEmployees(filteredReleaved);

        // Applied for Relieve Employees - only when hr_approved is pending/empty/null/undefined
        const filteredApplied = allReleaved.filter(
          (emp: {
            manager_approved?: string;
            hr_approved?: string;
          }) => {
            const managerApproved =
              emp.manager_approved?.toString().toLowerCase() === "approved" ||
              emp.manager_approved?.toString().toLowerCase() === "yes";

            const hrStatus = emp.hr_approved?.toString().toLowerCase();

            const hrPendingOrEmpty =
              !hrStatus || hrStatus === "pending" || hrStatus.trim() === "";

            return managerApproved && hrPendingOrEmpty;
          }
        );
        setAppliedEmployees(filteredApplied);
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [refreshTrigger, EMPLOYEES_API, RELEAVED_API]);
  // Approve/Reject HR API
  const handleHrApprove = async (email: string, status: "Approved" | "Rejected") => {
    try {
      // Find employee ID using email
      const emp = appliedEmployees.find((e) => e.email === email);

      if (!emp || !emp.id) {
        console.error('Employee ID not found for HR approval.');
        alert("Employee ID not found for HR approval.");
        return;
      }

      // Check manager approval before HR approves
      const managerApproved = emp.manager_approved?.toString().toLowerCase() === "approved" ||
        emp.manager_approved?.toString().toLowerCase() === "yes";

      if (!managerApproved) {
        console.error('Cannot process HR approval. Manager approval is required first.');
        alert("Cannot process HR approval. Manager approval is required first.");
        return;
      }

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/releaved/${emp.id}/`,
        {
          approval_stage: "hr",
          approved: status,
          description:
            status === "Approved"
              ? "HR approved resignation after manager review"
              : "HR rejected resignation after review",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      alert(`HR ${status} successfully!`);

      // Trigger a refresh to update all tabs
      triggerRefresh();
    } catch (err) {
      console.error("Error updating HR approval:", err);
      alert("Failed to update HR approval.");
    }
  };

  // Generate Termination PDF
  const generateTerminationPDF = async (
    employee: Employee,
    reason: string,
    date: string
  ) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 750]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();

    page.drawText("EMPLOYEE TERMINATION DOCUMENT", {
      x: 100,
      y: height - 60,
      size: 18,
      font: bold,
      color: rgb(0, 0, 0.6),
    });

    page.drawLine({
      start: { x: 40, y: height - 70 },
      end: { x: width - 40, y: height - 70 },
      thickness: 1,
      color: rgb(0, 0, 0.6),
    });

    let y = height - 110;
    const text = (label: string, value?: string) => {
      page.drawText(`${label}: ${value || "N/A"}`, { x: 60, y, size: 12, font });
      y -= 18;
    };

    page.drawText("Employee Information", {
      x: 60,
      y,
      size: 14,
      font: bold,
    });
    y -= 25;
    text("Name", employee.fullname);
    text("Email", employee.email);
    text("Department", employee.department);
    text("Designation", employee.designation);
    text("Phone", employee.phone);
    text("Date Joined", formatDate(employee.date_joined));

    y -= 20;
    page.drawText("Termination Details", {
      x: 60,
      y,
      size: 14,
      font: bold,
    });
    y -= 25;
    text("Termination Date", formatDate(date));
    text("Termination Reason", reason);

    y -= 30;
    page.drawText(
      `This document certifies that ${employee.fullname} has been officially offboarded.`,
      { x: 60, y, size: 12, font }
    );

    y -= 40;
    page.drawText("HR Manager Signature: ____________________", {
      x: 60,
      y,
      size: 12,
      font,
    });
    page.drawText(`Date: ${formatDate(date)}`, { x: 400, y, size: 12, font });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${employee.fullname}_Termination.pdf`;
    link.click();
  };

  // Remove Employee
  const handleRemoveEmployee = async () => {
    if (!showRemoveForm || !terminationReason || !terminationDate) {
      console.error('Missing required fields for removal');
      alert("Please fill in all fields.");
      return;
    }

    try {
      await generateTerminationPDF(showRemoveForm, terminationReason, terminationDate);

      const id = showRemoveForm.id;
      if (!id) {
        console.error('Employee ID not found for removal');
        alert("Employee ID not found for removal.");
        return;
      }

      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/releaved/${id}/`,
        {
          approval_stage: "hr",
          approved: "Approved",
          description: terminationReason || "hr rejected resignation due to incomplete documentation",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (res.data.error) {
        console.error('API Error:', res.data.error);
        alert(res.data.error);
      } else {
        alert(res.data.message || "HR approved resignation successfully!");
      }

      setShowRemoveForm(null);
      setTerminationReason("");
      setTerminationDate("");
      // Trigger a refresh to update all tabs
      triggerRefresh();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Axios error removing employee:", err.response?.data || err.message);
      } else {
        console.error("Unexpected error removing employee:", err);
      }
      alert("Failed to remove employee.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="hr">
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-800 mx-auto"></div>
            <p className="mt-4 text-slate-600 text-lg font-medium">Loading employees...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <style jsx global>{`
        body {
          overflow-x: hidden;
        }
        * {
          max-width: 100%;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
      <DashboardLayout role="hr">
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8 lg:p-10 text-black overflow-x-hidden w-full relative">
          {/* Header */}
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 md:mb-10 gap-4 sm:gap-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-2xl shadow-sm hidden sm:block">
                  <LogOut className="h-6 w-6 text-white" />
                </div>
                <div className="w-full sm:w-auto">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">Offboarding Process</h1>
                  <p className="text-sm sm:text-md text-slate-500 font-medium tracking-wide mt-1">Manage team departures and offboarding</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-slate-800" />
                    <span className="text-sm font-semibold text-slate-700">
                      {employees.length} Active • {releavedEmployees.length} Relieved
                    </span>
                  </div>
                </div>
                <button
                  onClick={triggerRefresh}
                  className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 shadow-sm transition-all text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <span className="hidden sm:inline">Refresh</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Content */}
            {!selectedEmployee && !selectedReleavedEmployee && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                {/* Tab Navigation */}
                <div className="border-b border-slate-100 overflow-x-auto bg-slate-50/50">
                  <div className="flex min-w-max px-2 pt-2">
                    <button
                      onClick={() => setActiveTab("active")}
                      className={`flex items-center px-4 md:px-6 py-3.5 font-semibold text-sm transition-all whitespace-nowrap rounded-t-xl ${activeTab === "active"
                        ? "text-slate-900 bg-white border-t border-l border-r border-slate-200"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                    >
                      <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="hidden sm:inline">Active Employees ({employees.length})</span>
                      <span className="sm:hidden">Active ({employees.length})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("applied")}
                      className={`flex items-center px-4 md:px-6 py-3.5 font-semibold text-sm transition-all whitespace-nowrap rounded-t-xl mx-1 ${activeTab === "applied"
                        ? "text-slate-900 bg-white border-t border-l border-r border-slate-200"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                    >
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="hidden sm:inline">Applied for Relieve ({appliedEmployees.length})</span>
                      <span className="sm:hidden">Applied ({appliedEmployees.length})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("releaved")}
                      className={`flex items-center px-4 md:px-6 py-3.5 font-semibold text-sm transition-all whitespace-nowrap rounded-t-xl ${activeTab === "releaved"
                        ? "text-slate-900 bg-white border-t border-l border-r border-slate-200"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                    >
                      <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="hidden sm:inline">Releaved Employees ({releavedEmployees.length})</span>
                      <span className="sm:hidden">Releaved ({releavedEmployees.length})</span>
                    </button>
                  </div>
                </div>

                {/* Employee Grid */}
                <div className="p-6 bg-white">
                  {activeTab === "active" ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {employees.map((emp) => (
                        <div
                          key={emp.email}
                          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 w-full overflow-hidden"
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="relative mb-4">
                              <Image
                                src={emp.profile_picture || "/images/profile.png"}
                                alt={emp.fullname}
                                width={150}
                                height={150}
                                className="w-20 h-20 rounded-full object-cover border-4 border-slate-50"
                              />
                              <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                            </div>

                            <h3 className="font-extrabold text-lg text-slate-800 mb-1 break-words w-full tracking-tight">
                              {emp.fullname}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4 flex items-center justify-center w-full">
                              <Mail className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{emp.email}</span>
                            </p>

                            <div className="w-full space-y-2 mb-5 bg-slate-50 p-3 rounded-xl">
                              {emp.department && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500 flex items-center font-medium">
                                    <Building className="w-3 h-3 mr-1.5" />
                                    Department
                                  </span>
                                  <span className="font-semibold text-slate-800">{emp.department}</span>
                                </div>
                              )}
                              {emp.designation && (
                                <div className="flex items-center justify-between text-xs mt-2">
                                  <span className="text-slate-500 flex items-center font-medium">
                                    <Briefcase className="w-3 h-3 mr-1.5" />
                                    Role
                                  </span>
                                  <span className="font-semibold text-slate-800">{emp.designation}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => setSelectedEmployee(emp)}
                                className="flex-1 bg-slate-800 text-white py-2.5 px-3 rounded-xl hover:bg-slate-700 transition-all text-sm font-semibold shadow-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setShowRemoveForm(emp)}
                                className="flex-1 bg-white border border-slate-200 text-rose-600 py-2.5 px-3 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all text-sm font-semibold shadow-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeTab === "applied" ? (
                    // Applied for Relieve Tab
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {appliedEmployees.map((emp) => (
                        <div
                          key={emp.email}
                          className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 w-full overflow-hidden"
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="relative mb-4">
                              <Image
                                src={emp.profile_picture || "/images/profile.png"}
                                alt={emp.fullname}
                                width={150}
                                height={150}
                                className="w-20 h-20 rounded-full object-cover border-4 border-amber-50"
                              />
                              <div className="absolute bottom-0 right-0 w-5 h-5 bg-amber-400 rounded-full border-2 border-white shadow-sm"></div>
                            </div>

                            <h3 className="font-extrabold text-lg text-slate-800 mb-1 break-words w-full tracking-tight">
                              {emp.fullname}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4 flex items-center justify-center w-full">
                              <Mail className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{emp.email}</span>
                            </p>

                            <div className="w-full space-y-2 mb-5 bg-slate-50 p-3 rounded-xl">
                              {emp.department && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500 flex items-center font-medium">
                                    <Building className="w-3 h-3 mr-1.5" />
                                    Department
                                  </span>
                                  <span className="font-semibold text-slate-800">{emp.department}</span>
                                </div>
                              )}
                              {emp.designation && (
                                <div className="flex items-center justify-between text-xs mt-2">
                                  <span className="text-slate-500 flex items-center font-medium">
                                    <Briefcase className="w-3 h-3 mr-1.5" />
                                    Role
                                  </span>
                                  <span className="font-semibold text-slate-800">{emp.designation}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => handleHrApprove(emp.email, "Approved")}
                                className="flex-1 bg-emerald-600 text-white py-2.5 px-3 rounded-xl hover:bg-emerald-700 transition-all text-sm font-semibold shadow-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleHrApprove(emp.email, "Rejected")}
                                className="flex-1 bg-white border border-slate-200 text-rose-600 py-2.5 px-3 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all text-sm font-semibold shadow-sm"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {releavedEmployees.map((emp) => (
                        <div
                          key={emp.email}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 w-full overflow-hidden"
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="relative mb-4">
                              <Image
                                src={emp.profile_picture || "/images/profile.png"}
                                alt={emp.fullname}
                                width={150}
                                height={150}
                                className="w-20 h-20 rounded-full object-cover border-4 border-slate-200 grayscale opacity-80"
                              />
                            </div>

                            <h3 className="font-extrabold text-lg text-slate-800 mb-1 break-words w-full tracking-tight">
                              {emp.fullname}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4 flex items-center justify-center w-full">
                              <Mail className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{emp.email}</span>
                            </p>

                            <div className="w-full space-y-2 mb-5 bg-white border border-slate-100 p-3 rounded-xl">
                              <div className="flex flex-col items-start text-xs">
                                <span className="text-slate-500 font-medium mb-1">Reason for leaving</span>
                                <span className="font-semibold text-rose-600 text-left line-clamp-2 w-full">
                                  {emp.reason_for_resignation || emp.description || "Not specified"}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => setSelectedReleavedEmployee(emp)}
                              className="w-full bg-slate-800 text-white py-2.5 px-3 rounded-xl hover:bg-slate-700 transition-all text-sm font-semibold shadow-sm"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {(activeTab === "active" && employees.length === 0) && (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Employees</h3>
                      <p className="text-gray-500">There are currently no active employees in the system.</p>
                    </div>
                  )}

                  {(activeTab === "releaved" && releavedEmployees.length === 0) && (
                    <div className="text-center py-12">
                      <LogOut className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Releaved Employees</h3>
                      <p className="text-gray-500">
                        {appliedEmployees.some((e) => e.ready_to_releve)
                          ? "Some employees are ready to relieve but not finalized yet."
                          : "No employees have been releaved yet."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Employee Detail View */}
            {(selectedEmployee || selectedReleavedEmployee) && (
              <div className="max-w-4xl mx-auto w-full">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full">
                  <div className="border-b border-gray-200">
                    <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 gap-2">
                      <button
                        onClick={() => {
                          setSelectedEmployee(null);
                          setSelectedReleavedEmployee(null);
                        }}
                        className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm sm:text-base"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 flex-shrink-0" />
                        <span className="hidden sm:inline">Back to list</span>
                        <span className="sm:hidden">Back</span>
                      </button>
                      {selectedEmployee && (
                        <button
                          onClick={() => setShowRemoveForm(selectedEmployee)}
                          className="bg-rose-600 text-white px-4 py-2.5 rounded-xl hover:bg-rose-700 shadow-sm transition-all font-semibold flex items-center text-xs sm:text-sm whitespace-nowrap"
                        >
                          <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="hidden sm:inline">Remove Employee</span>
                          <span className="sm:hidden">Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 md:p-8 w-full overflow-hidden">
                    <div className="flex flex-col lg:flex-row items-start space-y-4 sm:space-y-6 lg:space-y-0 lg:space-x-8 w-full">
                      <div className="flex-shrink-0">
                        <Image
                          src={
                            selectedEmployee?.profile_picture ||
                            selectedReleavedEmployee?.profile_picture ||
                            "/images/profile.png"
                          }
                          alt={selectedEmployee?.fullname || selectedReleavedEmployee?.fullname || ""}
                          width={200}
                          height={200}
                          className="w-32 h-32 rounded-2xl object-cover border-4 border-slate-100"
                        />
                      </div>

                      <div className="flex-1 grid md:grid-cols-2 gap-4 sm:gap-6 w-full min-w-0">
                        <div className="space-y-4 sm:space-y-6 min-w-0">
                          <div className="w-full">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">
                              {selectedEmployee?.fullname || selectedReleavedEmployee?.fullname}
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600 flex items-center w-full">
                              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="break-all">{selectedEmployee?.email || selectedReleavedEmployee?.email}</span>
                            </p>
                          </div>

                          <div className="space-y-3 sm:space-y-4 w-full">
                            <div className="flex items-center text-sm sm:text-base text-gray-700 w-full">
                              <Building className="w-5 h-5 mr-3 text-slate-800 flex-shrink-0 bg-slate-100 p-1 rounded-lg" />
                              <span className="font-semibold text-slate-500 mr-2 flex-shrink-0">Department:</span>
                              <span className="font-semibold text-slate-900 truncate">{selectedEmployee?.department || selectedReleavedEmployee?.department || "—"}</span>
                            </div>
                            <div className="flex items-center text-sm sm:text-base text-gray-700 w-full">
                              <Briefcase className="w-5 h-5 mr-3 text-slate-800 flex-shrink-0 bg-slate-100 p-1 rounded-lg" />
                              <span className="font-semibold text-slate-500 mr-2 flex-shrink-0">Designation:</span>
                              <span className="font-semibold text-slate-900 truncate">{selectedEmployee?.designation || selectedReleavedEmployee?.designation || "—"}</span>
                            </div>
                            <div className="flex items-center text-sm sm:text-base text-gray-700 w-full">
                              <Phone className="w-5 h-5 mr-3 text-slate-800 flex-shrink-0 bg-slate-100 p-1 rounded-lg" />
                              <span className="font-semibold text-slate-500 mr-2 flex-shrink-0">Phone:</span>
                              <span className="font-semibold text-slate-900 break-all">{selectedEmployee?.phone || selectedReleavedEmployee?.phone || "—"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6 min-w-0">
                          <div className="flex items-center text-sm sm:text-base text-gray-700 w-full">
                            <Calendar className="w-5 h-5 mr-3 text-slate-800 flex-shrink-0 bg-slate-100 p-1 rounded-lg" />
                            <span className="font-semibold text-slate-500 mr-2 flex-shrink-0">Date Joined:</span>
                            <span className="font-semibold text-slate-900 truncate">
                              {formatDate(selectedEmployee?.date_joined || selectedReleavedEmployee?.date_joined)}
                            </span>
                          </div>

                          {/* Relief/Approval Progress Steps */}
                          {(selectedEmployee || selectedReleavedEmployee) && (() => {
                            // Get the status data from selectedEmployee or selectedReleavedEmployee
                            const statusData: Employee | Record<string, unknown> = selectedEmployee || selectedReleavedEmployee || {};
                            const steps = [
                              { label: "Applied", active: !!statusData },
                              {
                                label: "Manager Approved",
                                active:
                                  statusData.manager_approved?.toString().toLowerCase() === "approved" ||
                                  statusData.manager_approved?.toString().toLowerCase() === "yes",
                                rejected:
                                  statusData.manager_approved?.toString().toLowerCase() === "rejected" ||
                                  statusData.manager_approved?.toString().toLowerCase() === "no",
                              },
                              {
                                label: "HR Approved",
                                active:
                                  statusData.hr_approved?.toString().toLowerCase() === "approved" ||
                                  statusData.hr_approved?.toString().toLowerCase() === "yes",
                                rejected:
                                  statusData.hr_approved?.toString().toLowerCase() === "rejected" ||
                                  statusData.hr_approved?.toString().toLowerCase() === "no",
                              },
                              {
                                label: "Relieved",
                                active:
                                  // !!statusData.offboarded_at &&
                                  (statusData.hr_approved?.toString().toLowerCase() === "approved" ||
                                    statusData.hr_approved?.toString().toLowerCase() === "yes"),
                              },
                            ];
                            return (
                              <div className="w-full overflow-x-auto relative">
                                <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-4 mb-2 mt-2 min-w-max px-2">
                                  {steps.map((step, index) => (
                                    <React.Fragment key={step.label}>
                                      <div
                                        className="flex flex-col items-center relative cursor-pointer"
                                        onMouseEnter={() => setHoveredStep({ index, employee: statusData as Employee })}
                                        onMouseLeave={() => !clickedStep && setHoveredStep(null)}
                                        onClick={() => {
                                          if ((index === 1 || index === 2) && (statusData.manager_approved || statusData.hr_approved)) {
                                            setClickedStep({ index, employee: statusData as Employee });
                                          }
                                        }}
                                      >
                                        <div
                                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${step.rejected
                                            ? "bg-red-500 text-white"
                                            : step.active
                                              ? "bg-green-500 text-white"
                                              : "bg-gray-300 text-gray-600"
                                            }`}
                                        >
                                          {step.rejected ? "❌" : step.active ? "✅" : index + 1}
                                        </div>
                                        <span className="text-[10px] sm:text-xs mt-1 text-center w-12 sm:w-16 md:w-20 break-words leading-tight">{step.label}</span>
                                      </div>
                                      {index < steps.length - 1 && (
                                        <div className="flex-1 h-0.5 sm:h-1 bg-gray-300 w-2 sm:w-4 mx-0.5 sm:mx-1" />
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>

                                {/* Popup Menu for Manager/HR Comments */}
                                {hoveredStep && hoveredStep.employee && (
                                  <div ref={popupRef} className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-10 w-full max-w-md mx-auto animate-fadeIn">
                                    <div className="text-sm">
                                      <h4 className="font-bold mb-3 flex items-center justify-between">
                                        <span>
                                          {hoveredStep.index === 1 ? 'Manager Decision' :
                                            hoveredStep.index === 2 ? 'HR Decision' :
                                              'Process Details'}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${hoveredStep.index === 1 ?
                                          (hoveredStep.employee.manager_approved?.toString().toLowerCase() === 'approved' || hoveredStep.employee.manager_approved?.toString().toLowerCase() === 'yes' ? 'bg-green-100 text-green-800' :
                                            hoveredStep.employee.manager_approved?.toString().toLowerCase() === 'rejected' || hoveredStep.employee.manager_approved?.toString().toLowerCase() === 'no' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800') :
                                          hoveredStep.index === 2 ?
                                            (hoveredStep.employee.hr_approved?.toString().toLowerCase() === 'approved' || hoveredStep.employee.hr_approved?.toString().toLowerCase() === 'yes' ? 'bg-green-100 text-green-800' :
                                              hoveredStep.employee.hr_approved?.toString().toLowerCase() === 'rejected' || hoveredStep.employee.hr_approved?.toString().toLowerCase() === 'no' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800') :
                                            'bg-gray-100 text-gray-800'}`}>
                                          {hoveredStep.index === 1 ?
                                            (hoveredStep.employee.manager_approved?.toString().toLowerCase() === 'approved' || hoveredStep.employee.manager_approved?.toString().toLowerCase() === 'yes' ? 'Approved' :
                                              hoveredStep.employee.manager_approved?.toString().toLowerCase() === 'rejected' || hoveredStep.employee.manager_approved?.toString().toLowerCase() === 'no' ? 'Rejected' : 'Pending') :
                                            hoveredStep.index === 2 ?
                                              (hoveredStep.employee.hr_approved?.toString().toLowerCase() === 'approved' || hoveredStep.employee.hr_approved?.toString().toLowerCase() === 'yes' ? 'Approved' :
                                                hoveredStep.employee.hr_approved?.toString().toLowerCase() === 'rejected' || hoveredStep.employee.hr_approved?.toString().toLowerCase() === 'no' ? 'Rejected' : 'Pending') :
                                              'Details'}
                                        </span>
                                      </h4>
                                      <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                                        <p className="font-medium text-gray-700 mb-2 flex items-center">
                                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                          Reason/Comments:
                                        </p>
                                        <p className="text-gray-800 max-h-32 overflow-y-auto pr-2">
                                          {hoveredStep.index === 1 ?
                                            (hoveredStep.employee.reason_for_resignation || hoveredStep.employee.description || 'No specific reason provided') :
                                            hoveredStep.index === 2 ?
                                              (hoveredStep.employee.description || 'No specific reason provided') :
                                              'No details available'}
                                        </p>
                                      </div>
                                      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                                        <span>Click anywhere to close</span>
                                        <span>Hover to keep open</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {steps[steps.length - 1].active && (
                                  <p className="mt-4 text-green-600 font-semibold text-center">
                                    Successfully Relieved ✅
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                          {selectedReleavedEmployee && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                                <LogOut className="w-4 h-4 mr-2" />
                                Termination Details
                              </h4>
                              <p className="text-red-700 text-sm">
                                <strong>Reason:</strong> {selectedReleavedEmployee.description || selectedReleavedEmployee.reason_for_resignation || "Not specified"}
                              </p>
                              {selectedReleavedEmployee.releaved && (
                                <p className="text-red-700 text-sm mt-1">
                                  <strong>Date:</strong> {formatDate(selectedReleavedEmployee.releaved)}
                                </p>
                              )}
                            </div>
                          )}

                          {selectedEmployee && (
                            <button
                              onClick={() =>
                                generateTerminationPDF(
                                  selectedEmployee,
                                  "Employee details export",
                                  formatDate(new Date().toISOString())
                                )
                              }
                              className="flex items-center justify-center w-full sm:w-auto bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 font-semibold transition-all shadow-sm"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Export Details
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Remove Employee Modal */}
            {showRemoveForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full relative shadow-2xl border border-red-100">
                  <button
                    onClick={() => setShowRemoveForm(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LogOut className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Remove Employee</h2>
                    <p className="text-gray-600">
                      You are about to remove <strong>{showRemoveForm.fullname}</strong> from the system.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Termination Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={terminationDate}
                        onChange={(e) => setTerminationDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Termination Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={terminationReason}
                        onChange={(e) => setTerminationReason(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        rows={4}
                        placeholder="Please provide the reason for termination..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowRemoveForm(null)}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRemoveEmployee}
                      className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Confirm Removal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default EmployeeList;
