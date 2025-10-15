"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Briefcase, Eye, X, Mail, Phone, Building, User, Clock } from "lucide-react";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type Employee = {
  email: string;
  fullname: string;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  profile_picture?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_contact_no?: string | null;
  employment_type?: string | null;
};

type Hr = Employee;
type Manager = Employee;
type ViewType = "employee" | "hr" | "manager";

type DocumentData = {
  email_id: string;
  [key: string]: string | null;
};

export default function TeamReport() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hrs, setHrs] = useState<Hr[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [view, setView] = useState<ViewType>("employee");
  const [loading, setLoading] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // Document viewer state
  const [docs, setDocs] = useState<DocumentData | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");

  const tabs: { label: string; value: ViewType; icon: React.ReactNode }[] = [
    { label: "Employees", value: "employee", icon: <Users className="w-4 h-4" /> },
    { label: "HR Team", value: "hr", icon: <Briefcase className="w-4 h-4" /> },
    { label: "Managers", value: "manager", icon: <User className="w-4 h-4" /> },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empRes, hrRes, managerRes] = await Promise.all([
          fetch(`${API_BASE}/api/accounts/employees/`),
          fetch(`${API_BASE}/api/accounts/hrs/`),
          fetch(`${API_BASE}/api/accounts/managers/`),
        ]);

        const empData: Employee[] = await empRes.json();
        const hrData: Hr[] = await hrRes.json();
        const managerData: Manager[] = await managerRes.json();

        setEmployees(empData || []);
        setHrs(hrData || []);
        setManagers(managerData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const list = view === "employee" ? employees : view === "hr" ? hrs : managers;

  const getAvatar = (emp: Employee) =>
    emp.profile_picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      emp.fullname || emp.email
    )}&background=0D8ABC&color=fff`;

  // Fetch documents for a selected employee
  const fetchDocuments = async (email: string) => {
    setDocLoading(true);
    setDocError("");
    setDocs(null);
    setSelectedDoc(null);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/get_document/${email}/`);
      if (!res.ok) throw new Error("No documents found");

      const data = await res.json();
      const record = Array.isArray(data) ? data[0] : data;
      if (!record || Object.keys(record).length === 0) throw new Error("No records found");

      setDocs(record);
    } catch (err: any) {
      setDocError(err.message || "Something went wrong");
    } finally {
      setDocLoading(false);
    }
  };

  const viewDocument = (url: string) => {
    if (url && url !== "null") setSelectedDoc(url);
    else alert("Document not available");
  };

  const renderDocumentViewer = (url: string) => {
    const fileType = url.split(".").pop()?.toLowerCase();

    if (fileType === "pdf") {
      return (
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
          className="w-full h-[600px] rounded-lg border"
          style={{ overflow: "hidden", border: "none" }}
          title="PDF Viewer"
        />
      );
    }

    if (["png", "jpg", "jpeg", "gif", "webp"].includes(fileType!)) {
      return (
        <img
          src={url}
          alt="Document"
          className="w-full h-[500px] object-contain rounded-lg"
        />
      );
    }

    if (["mp4", "webm", "ogg"].includes(fileType!)) {
      return (
        <video src={url} controls className="w-full h-[500px] rounded-lg" />
      );
    }

    return (
      <p className="text-gray-500 text-sm mt-2">
        Unsupported file type: <b>{fileType}</b>
      </p>
    );
  };

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Report</h1>
            <p className="text-gray-600">Manage and view team member information and documents</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 p-1 mb-8 inline-flex">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setView(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  view === tab.value
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Employees</div>
              <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">HR Team</div>
              <div className="text-2xl font-bold text-gray-900">{hrs.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Managers</div>
              <div className="text-2xl font-bold text-gray-900">{managers.length}</div>
            </div>
          </div>

          {/* Data list */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-pulse text-gray-500">Loading {view} data...</div>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No {view} found.</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.map((emp, idx) => (
                  <motion.div
                    key={emp.email || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <Image
                        src={getAvatar(emp)}
                        alt={emp.fullname || "Profile"}
                        width={50}
                        height={50}
                        className="rounded-full object-cover border border-gray-200"
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-gray-900 truncate">
                          {emp.fullname || "Unknown"}
                        </h2>
                        <p className="text-sm text-gray-500 truncate">{emp.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      {emp.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                      {emp.department && (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span>{emp.department}</span>
                        </div>
                      )}
                      {emp.designation && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span>{emp.designation}</span>
                        </div>
                      )}
                      {emp.employment_type && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{emp.employment_type}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedEmp(emp);
                        fetchDocuments(emp.email);
                      }}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                    >
                      <Eye className="w-4 h-4" /> View Documents
                    </button>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Modal for Employee Documents */}
        <AnimatePresence>
          {selectedEmp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white w-full max-w-6xl rounded-xl shadow-lg p-6 relative max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <Image
                      src={getAvatar(selectedEmp)}
                      alt={selectedEmp?.fullname || "Profile"}
                      width={60}
                      height={60}
                      className="rounded-lg object-cover border border-gray-200"
                    />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedEmp.fullname}
                      </h2>
                      <p className="text-gray-600">{selectedEmp.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEmp(null);
                      setDocs(null);
                      setSelectedDoc(null);
                    }}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {/* Employee Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {selectedEmp.department && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Department:</span>
                            <span className="text-gray-900">{selectedEmp.department}</span>
                          </div>
                        )}
                        {selectedEmp.designation && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Designation:</span>
                            <span className="text-gray-900">{selectedEmp.designation}</span>
                          </div>
                        )}
                        {selectedEmp.phone && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Phone:</span>
                            <span className="text-gray-900">{selectedEmp.phone}</span>
                          </div>
                        )}
                        {selectedEmp.employment_type && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Employment Type:</span>
                            <span className="text-gray-900">{selectedEmp.employment_type}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    {(selectedEmp.emergency_contact_name || selectedEmp.emergency_contact_no) && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          {selectedEmp.emergency_contact_name && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Name:</span>
                              <span className="text-gray-900">{selectedEmp.emergency_contact_name}</span>
                            </div>
                          )}
                          {selectedEmp.emergency_contact_relationship && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Relationship:</span>
                              <span className="text-gray-900">{selectedEmp.emergency_contact_relationship}</span>
                            </div>
                          )}
                          {selectedEmp.emergency_contact_no && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Phone:</span>
                              <span className="text-gray-900">{selectedEmp.emergency_contact_no}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Documents Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                    
                    {docLoading && (
                      <div className="text-center py-8">
                        <div className="animate-pulse text-gray-500">Loading documents...</div>
                      </div>
                    )}
                    
                    {docError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-700">{docError}</p>
                      </div>
                    )}

                    {docs && !selectedDoc && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(docs).map(([key, value]) => {
                            if (
                              key !== "email_id" &&
                              value &&
                              value !== "null" &&
                              typeof value === "string" &&
                              value.startsWith("https")
                            ) {
                              return (
                                <div key={key} className="bg-white rounded-lg border border-gray-200 p-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                      {key.replace(/_/g, " ")}
                                    </span>
                                    <button
                                      onClick={() => viewDocument(value)}
                                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                                    >
                                      View
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Document Preview */}
                    {selectedDoc && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-semibold text-gray-900">Document Preview</h4>
                          <button
                            onClick={() => setSelectedDoc(null)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
                          >
                            Back to Documents
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          {renderDocumentViewer(selectedDoc)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}