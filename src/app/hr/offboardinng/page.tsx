'use client';
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Eye, Trash2, Download, User, Mail, Building, Phone, Calendar, Briefcase, X, AlertCircle } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type Employee = {
  id: number;
  email: string;
  fullname: string;
  department: string | null;
  designation: string | null;
  date_joined: string | null;
  phone: string | null;
};

export default function Offboarding() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "details">("list");
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP error! status: ${res.status} ${text}`);
        }

        const data = await res.json();
        setEmployees(data as Employee[]);
        setError("");
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Failed to fetch employees:", err.message);
        } else {
          console.error("Failed to fetch employees:", err);
        }
        setError("Failed to fetch employees. Please check your backend or network.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewMode("details");
  };

  const handleRemoveEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowRemoveModal(true);
  };

  const handleConfirmRemoval = async () => {
    if (!selectedEmployee || !terminationReason) return;

    try {
      setProcessing(true);

      // Generate termination PDF
      const pdfBlob = await generateTerminationPDF(selectedEmployee, terminationReason);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `termination_${selectedEmployee.email}_${new Date()
        .toISOString()
        .split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      // DELETE request using email
      const token = localStorage.getItem("authToken");
      const deleteResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(
          selectedEmployee.email
        )}/`,
        { 
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete user: ${deleteResponse.status}`);
      }

      // Remove employee from local state by email
      setEmployees(employees.filter((emp) => emp.email !== selectedEmployee.email));
      setShowRemoveModal(false);
      setTerminationReason("");
      setSelectedEmployee(null);

      alert(
        `${selectedEmployee.fullname} has been successfully offboarded. PDF downloaded.`
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error during offboarding:", err.message);
      } else {
        console.error("Error during offboarding:", err);
      }
      setError("Failed to complete offboarding process.");
    } finally {
      setProcessing(false);
    }
  };

  const generateTerminationPDF = async (
  employee: Employee,
  reason: string
): Promise<Blob> => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595.28, 842]); // A4
  const { width, height } = page.getSize();

  let y = height - 60;

  // 🔹 Header
  const title = "EMPLOYEE TERMINATION DOCUMENT";
  page.drawText(title, {
    x: width / 2 - font.widthOfTextAtSize(title, 18) / 2,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0.5),
  });

  y -= 30;
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1.2,
    color: rgb(0.2, 0.2, 0.5),
  });
  y -= 40;

  // 🔹 Employee Information Section
  page.drawText("Employee Information", {
    x: 50,
    y,
    size: 13,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 20;
  const info = [
    ["Name", employee.fullname],
    ["Email", employee.email],
    ["Department", employee.department || "N/A"],
    ["Designation", employee.designation || "N/A"],
    ["Phone", employee.phone || "N/A"],
    ["Date Joined", employee.date_joined || "N/A"],
  ];

  info.forEach(([label, value]) => {
    page.drawText(`${label}:`, {
      x: 60,
      y,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: 160,
      y,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 18;
  });

  y -= 25;

  // 🔹 Termination Details Section
  page.drawText("Termination Details", {
    x: 50,
    y,
    size: 13,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 20;
  const details = [
    ["Termination Date", new Date().toLocaleDateString()],
    ["Termination Reason", reason],
  ];

  details.forEach(([label, value]) => {
    page.drawText(`${label}:`, {
      x: 60,
      y,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: 200,
      y,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 18;
  });

  y -= 40;

  // 🔹 Statement
  const statement = `This document certifies that ${employee.fullname} has been officially offboarded from the company.`;
  page.drawText(statement, {
    x: 50,
    y,
    size: 11,
    font,
    color: rgb(0.1, 0.1, 0.1),
    maxWidth: width - 100,
  });

  y -= 60;

  // 🔹 Signature
  page.drawText("HR Manager Signature: ___________________", {
    x: 50,
    y,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
    x: width - 200,
    y,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  // 🔹 Footer
  page.drawLine({
    start: { x: 50, y: 50 },
    end: { x: width - 50, y: 50 },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });
  page.drawText("Confidential • Generated by HR System", {
    x: width / 2 - font.widthOfTextAtSize("Confidential • Generated by HR System", 9) / 2,
    y: 35,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // ✅ FIX: use .buffer so TypeScript treats it as ArrayBuffer
  // ✅ FIX: Ensure Blob gets a Uint8Array, not ArrayBufferLike
const pdfBytes = await pdfDoc.save();
return new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });

};


  return (
    <DashboardLayout role="hr">
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        {viewMode === "list" ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-2 sm:space-y-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mt-5 mb-5">Employee Management</h1>
              <div className="text-sm text-gray-500">
                {employees.length} employee{employees.length !== 1 ? 's' : ''} found
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-48 sm:h-64">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            ) : (
              <>
                {/* 🔹 Table for medium+ screens */}
                <div className="hidden sm:block bg-white rounded-lg shadow overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 table-auto mt-5 mb-5">
                    <thead className="bg-gray-100 mt-3 mb-5">
                      <tr>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500 text-sm">
                            No employees found
                          </td>
                        </tr>
                      ) : (
                        employees.map((emp) => (
                          <tr key={emp.email} className="hover:bg-gray-50 transition mt-5 p-5">
                            <td className="md:px-8 md:py-5 whitespace-nowrap mt-5 text-xl">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">{emp.fullname}</div>
                                  <div className="text-gray-500">{emp.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-900">{emp.department || "-"}</td>
                            <td className="px-6 py-3 text-sm text-gray-900">{emp.designation || "-"}</td>
                            <td className="px-6 py-3 text-sm text-gray-500">
                              {emp.date_joined ? new Date(emp.date_joined).toLocaleDateString() : "-"}
                            </td>
                            <td className="px-6 py-3 text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewDetails(emp)}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md flex items-center"
                                >
                                  <Eye className="h-4 w-4 mr-1" /> View
                                </button>
                                <button
                                  onClick={() => handleRemoveEmployee(emp)}
                                  className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md flex items-center"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 🔹 Card view for small screens */}
                <div className="grid grid-cols-1 gap-4 sm:hidden">
                  {employees.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 bg-white rounded-lg shadow">
                      No employees found
                    </div>
                  ) : (
                    employees.map((emp) => (
                      <div
                        key={emp.email}
                        className="bg-white rounded-lg shadow p-4 space-y-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{emp.fullname}</div>
                            <div className="text-sm text-gray-500">{emp.email}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><span className="font-medium">Dept:</span> {emp.department || "-"}</p>
                          <p><span className="font-medium">Role:</span> {emp.designation || "-"}</p>
                          <p><span className="font-medium">Joined:</span> {emp.date_joined ? new Date(emp.date_joined).toLocaleDateString() : "-"}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(emp)}
                            className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-md flex items-center justify-center"
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </button>
                          <button
                            onClick={() => handleRemoveEmployee(emp)}
                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-md flex items-center justify-center"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          selectedEmployee && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              {/* Details view */}
              <button onClick={() => setViewMode("list")} className="text-blue-600 hover:text-blue-800 mb-4 flex items-center">← Back to list</button>
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Employee Details</h2>
                <p className="text-gray-600 text-sm sm:text-base">Complete information about the employee</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4"><User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" /></div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-sm sm:text-base">{selectedEmployee.fullname}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4"><Mail className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" /></div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Email</p>
                    <p className="font-medium text-sm sm:text-base">{selectedEmployee.email}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4"><Building className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" /></div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Department</p>
                    <p className="font-medium text-sm sm:text-base">{selectedEmployee.department || "Not assigned"}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4"><Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" /></div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Designation</p>
                    <p className="font-medium text-sm sm:text-base">{selectedEmployee.designation || "Not assigned"}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-red-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4"><Phone className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" /></div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-sm sm:text-base">{selectedEmployee.phone || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4"><Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" /></div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Date Joined</p>
                    <p className="font-medium text-sm sm:text-base">{selectedEmployee.date_joined ? new Date(selectedEmployee.date_joined).toLocaleDateString() : "Not available"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button onClick={() => handleRemoveEmployee(selectedEmployee)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"><Trash2 className="h-4 w-4 mr-2" /> Initiate Offboarding</button>
              </div>
            </div>
          )
        )}

        {/* Remove Modal */}
        {showRemoveModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-full sm:max-w-md w-full">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Employee Offboarding</h3>
                <button onClick={() => { setShowRemoveModal(false); setTerminationReason(""); }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">You are about to offboard {selectedEmployee.fullname}. This action will generate termination documentation and remove the employee from the system.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Employee Details</h4>
                  <div className="bg-gray-50 p-3 rounded-md text-sm sm:text-base space-y-1">
                    <p><span className="font-medium">Name:</span> {selectedEmployee.fullname}</p>
                    <p><span className="font-medium">Email:</span> {selectedEmployee.email}</p>
                    <p><span className="font-medium">Department:</span> {selectedEmployee.department || "N/A"}</p>
                    <p><span className="font-medium">Designation:</span> {selectedEmployee.designation || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason for Termination *</label>
                  <textarea id="reason" rows={3} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" placeholder="Please provide the reason for termination..." value={terminationReason} onChange={(e) => setTerminationReason(e.target.value)} required></textarea>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200">
                <button onClick={() => { setShowRemoveModal(false); setTerminationReason(""); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleConfirmRemoval} disabled={!terminationReason.trim() || processing} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                  {processing ? <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>Processing...</> : <><Download className="h-4 w-4 mr-2" />Confirm & Download PDF</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}