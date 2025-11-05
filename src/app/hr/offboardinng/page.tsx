"use client";

import React, { useEffect, useState } from "react";
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
        setEmployees(activeRes.data || []);
        const allReleaved = releavedRes.data || [];
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
  }, [EMPLOYEES_API, RELEAVED_API]);
  // Approve/Reject HR API
  const handleHrApprove = async (email: string, status: "Approved" | "Rejected") => {
    try {
      // Find employee ID using email
      const emp = appliedEmployees.find((e) => e.email === email);
      if (!emp || !emp.id) {
        alert("Employee ID not found for HR approval.");
        return;
      }

      // Check manager approval before HR approves
      if (
        emp.manager_approved?.toString().toLowerCase() !== "approved" &&
        emp.manager_approved?.toString().toLowerCase() !== "yes"
      ) {
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
      // Refresh employee list
      const [activeRes, releavedRes] = await Promise.all([
        axios.get(EMPLOYEES_API),
        axios.get(RELEAVED_API),
      ]);
      setEmployees(activeRes.data || []);
      const allReleaved = releavedRes.data || [];
      const filteredReleaved = allReleaved.filter(
        (emp: Employee) =>
          emp.manager_approved?.toLowerCase() === "approved" &&
          emp.hr_approved?.toLowerCase() === "approved" &&
          (emp.offboarded_at || emp.ready_to_releve)
      );
      setReleavedEmployees(filteredReleaved);
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
      alert("Please fill in all fields.");
      return;
    }

    try {
      await generateTerminationPDF(showRemoveForm, terminationReason, terminationDate);

      const id = showRemoveForm.id;
      if (!id) {
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
        alert(res.data.error);
      } else {
        alert(res.data.message || "HR approved resignation successfully!");
      }

      setEmployees((prev) =>
        prev.filter((e) => e.email !== showRemoveForm.email)
      );
      setReleavedEmployees((prev) => [...prev, showRemoveForm]);

      setShowRemoveForm(null);
      setTerminationReason("");
      setTerminationDate("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Error removing employee:", err.response?.data || err.message);
      } else {
        console.error("Unexpected error:", err);
      }
      alert("Failed to remove employee.");
    }
  };

  if (loading) {
    return (
     <DashboardLayout role="hr">
       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading employees...</p>
        </div>
      </div>
     </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="hr">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 text-black">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600 mt-2">Manage your team members and offboarding process</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">
                  {employees.length} Active • {releavedEmployees.length} Releaved
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {!selectedEmployee && !selectedReleavedEmployee && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("active")}
                  className={`flex items-center px-6 py-4 font-medium text-sm transition-all ${
                    activeTab === "active"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <User className="w-4 h-4 mr-2" />
                  Active Employees ({employees.length})
                </button>
                <button
                  onClick={() => setActiveTab("applied")}
                  className={`flex items-center px-6 py-4 font-medium text-sm transition-all ${
                    activeTab === "applied"
                      ? "text-yellow-600 border-b-2 border-yellow-500 bg-yellow-50"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Applied for Relieve ({appliedEmployees.length})
                </button>
                <button
                  onClick={() => setActiveTab("releaved")}
                  className={`flex items-center px-6 py-4 font-medium text-sm transition-all ${
                    activeTab === "releaved"
                      ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Releaved Employees ({releavedEmployees.length})
                </button>
              </div>
            </div>

            {/* Employee Grid */}
            <div className="p-6">
              {activeTab === "active" ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {employees.map((emp) => (
                    <div
                      key={emp.email}
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                          <Image
                            src={emp.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                            alt={emp.fullname}
                            width={150}
                            height={150}
                            className="w-20 h-20 rounded-full object-cover border-4 border-blue-50"
                          />
                          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        
                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                          {emp.fullname}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {emp.email}
                        </p>
                        
                        <div className="w-full space-y-2 mb-4">
                          {emp.department && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 flex items-center">
                                <Building className="w-3 h-3 mr-1" />
                                Department
                              </span>
                              <span className="font-medium text-gray-900">{emp.department}</span>
                            </div>
                          )}
                          {emp.designation && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 flex items-center">
                                <Briefcase className="w-3 h-3 mr-1" />
                                Role
                              </span>
                              <span className="font-medium text-gray-900">{emp.designation}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => setSelectedEmployee(emp)}
                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setShowRemoveForm(emp)}
                            className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
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
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-yellow-200"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                          <Image
                            src={emp.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                            alt={emp.fullname}
                            width={150}
                            height={150}
                            className="w-20 h-20 rounded-full object-cover border-4 border-yellow-50"
                          />
                          <div className="absolute bottom-0 right-0 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white"></div>
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                          {emp.fullname}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {emp.email}
                        </p>

                        <div className="w-full space-y-2 mb-4">
                          {emp.department && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 flex items-center">
                                <Building className="w-3 h-3 mr-1" />
                                Department
                              </span>
                              <span className="font-medium text-gray-900">{emp.department}</span>
                            </div>
                          )}
                          {emp.designation && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 flex items-center">
                                <Briefcase className="w-3 h-3 mr-1" />
                                Role
                              </span>
                              <span className="font-medium text-gray-900">{emp.designation}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 w-full mt-2">
                          <button
                            onClick={() => handleHrApprove(emp.email, "Approved")}
                            className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleHrApprove(emp.email, "Rejected")}
                            className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
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
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-red-200"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                          <Image
                            src={emp.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                            alt={emp.fullname}
                            width={150}
                            height={150}
                            className="w-20 h-20 rounded-full object-cover border-4 border-red-50 grayscale"
                          />
                          <div className="absolute bottom-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-white"></div>
                        </div>
                        
                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                          {emp.fullname}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {emp.email}
                        </p>
                        
                        <div className="w-full space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Reason</span>
                            <span className="font-medium text-red-600 text-xs text-right">
                              {emp.reason_for_resignation || emp.description || "Not specified"}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedReleavedEmployee(emp)}
                          className="w-full bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
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
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex items-center justify-between p-6">
                  <button
                    onClick={() => {
                      setSelectedEmployee(null);
                      setSelectedReleavedEmployee(null);
                    }}
                    className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back to list
                  </button>
                  {selectedEmployee && (
                    <button
                      onClick={() => setShowRemoveForm(selectedEmployee)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Remove Employee
                    </button>
                  )}
                </div>
              </div>

              <div className="p-8">
                <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-8">
                  <div className="flex-shrink-0">
                    <Image
                      src={
                        selectedEmployee?.profile_picture ||
                        selectedReleavedEmployee?.profile_picture ||
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face"
                      }
                      alt={selectedEmployee?.fullname || selectedReleavedEmployee?.fullname || ""}
                      width={200}
                      height={200}
                      className="w-32 h-32 rounded-2xl object-cover border-4 border-blue-50"
                    />
                  </div>

                  <div className="flex-1 grid md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedEmployee?.fullname || selectedReleavedEmployee?.fullname}
                        </h2>
                        <p className="text-gray-600 flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {selectedEmployee?.email || selectedReleavedEmployee?.email}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center text-gray-700">
                          <Building className="w-4 h-4 mr-3 text-blue-600" />
                          <span className="font-medium mr-2">Department:</span>
                          <span>{selectedEmployee?.department || selectedReleavedEmployee?.department || "—"}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Briefcase className="w-4 h-4 mr-3 text-blue-600" />
                          <span className="font-medium mr-2">Designation:</span>
                          <span>{selectedEmployee?.designation || selectedReleavedEmployee?.designation || "—"}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Phone className="w-4 h-4 mr-3 text-blue-600" />
                          <span className="font-medium mr-2">Phone:</span>
                          <span>{selectedEmployee?.phone || selectedReleavedEmployee?.phone || "—"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center text-gray-700">
                          <Calendar className="w-4 h-4 mr-3 text-blue-600" />
                          <span className="font-medium mr-2">Date Joined:</span>
                          <span>
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
                              !!statusData.offboarded_at &&
                              (statusData.hr_approved?.toString().toLowerCase() === "approved" ||
                                statusData.hr_approved?.toString().toLowerCase() === "yes"),
                          },
                        ];
                        return (
                          <div>
                            <div className="flex items-center justify-center gap-4 mb-2 mt-2">
                              {steps.map((step, index) => (
                                <React.Fragment key={step.label}>
                                  <div className="flex flex-col items-center">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                        step.rejected
                                          ? "bg-red-500 text-white"
                                          : step.active
                                          ? "bg-green-500 text-white"
                                          : "bg-gray-300 text-gray-600"
                                      }`}
                                    >
                                      {step.rejected ? "❌" : step.active && index === steps.length - 1 ? "✅" : index + 1}
                                    </div>
                                    <span className="text-xs mt-1 text-center w-20">{step.label}</span>
                                  </div>
                                  {index < steps.length - 1 && (
                                    <div className="flex-1 h-1 bg-gray-300 w-4 mx-1" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
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
                          className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export Employee Details
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
  );
};

export default EmployeeList;