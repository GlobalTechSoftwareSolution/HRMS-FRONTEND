"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import axios from "axios";
import {
  Mail,
  X,
  UserCheck,
  FileText,
  Briefcase,
  User,
  Award,
  Search,
  Filter,
  Calendar,
  DollarSign,
} from "lucide-react";

/**
 * NOTE:
 * - API base is read from process.env.NEXT_PUBLIC_API_URL
 * - Put the proper domain in NEXT_PUBLIC_API_URL in your .env (e.g. https://globaltechsoftwaresolutions.cloud)
 * - This file expects the APIs:
 *    GET  ${BASE}/api/accounts/employees/
 *    GET  ${BASE}/api/accounts/list_documents/
 *    PATCH ${BASE}/api/accounts/list_documents/<document-id-or-user-id>/  (used for issuing)
 *    POST  (optional) endpoint for uploading new documents can be added similarly
 */

type Employee = {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  status: "active" | "on-leave" | "offboarded" | "pre-boarded";
  joinDate: string;
  phone: string;
  salary: number;
  picture?: string;
  [key: string]: unknown;
};

type EmployeeAPIResponse = {
  id?: number;
  fullname?: string;
  designation?: string;
  department?: string;
  email_id?: string;
  status?: "active" | "on-leave" | "offboarded";
  join_date?: string;
  phone?: string;
  salary?: number;
  profile_picture?: string;
  [key: string]: unknown;
};

type DocumentRecord = {
  id?: number;
  email: string;
  [key: string]: unknown;
};

export default function EmployeesPage() {
  // employees + documents
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);

  // filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

  // ---------- Document preview state ----------
  type PreviewDocState = {
    [docType: string]: { viewing: boolean; loading: boolean };
  };
  const [previewDocs, setPreviewDocs] = useState<PreviewDocState>({});

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/api/accounts/employees/`);
        if (!res.ok) throw new Error(`Failed to fetch employees (${res.status})`);
        const data: EmployeeAPIResponse[] = await res.json();
        const mapped: Employee[] = (data || []).map((emp: EmployeeAPIResponse, idx: number) => ({
          id: emp.id ?? idx + 1,
          name: emp.fullname ?? `${emp.email_id ?? "Unknown"}`,
          role: emp.designation ?? "Employee",
          department: emp.department ?? "General",
          email: emp.email_id ?? "unknown@example.com",
          status: (emp.status as Employee["status"]) ?? "active",
          joinDate: emp.join_date ?? new Date().toISOString(),
          phone: emp.phone ?? "",
          salary: emp.salary ?? 0,
          picture: emp.profile_picture || undefined,
          ...emp,
        }));
        setEmployees(mapped);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to fetch employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [API_BASE]);

  // ---------- Fetch documents ----------
  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/accounts/list_documents/`);
      setDocuments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  // ---------- derived lists ----------
  const departments = useMemo(() => {
    const ds = new Set(employees.map((e) => e.department || "General"));
    return ["all", ...Array.from(ds)];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q);
      const matchesDept = departmentFilter === "all" || emp.department === departmentFilter;
      const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  // ---------- Helpers ----------
  const getValidImage = (url: string | undefined, name: string) => {
    if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
    try {
      const u = new URL(url, typeof window !== "undefined" ? window.location.origin : API_BASE);
      return u.href;
    } catch {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
    }
  };

  const getDocumentForEmail = (email?: string) => {
    if (!email) return null;
    return documents.find((d) => d.email === email) ?? null;
  };

  const getRoleColor = (role?: string) => {
    if (!role) return "bg-gray-100 text-gray-700";
    switch (role.toLowerCase()) {
      case "manager":
        return "bg-blue-100 text-blue-700";
      case "developer":
        return "bg-green-100 text-green-700";
      case "designer":
        return "bg-purple-100 text-purple-700";
      case "ceo":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRoleIcon = (role?: string) => {
    if (!role) return <User className="w-4 h-4" />;
    switch (role.toLowerCase()) {
      case "manager":
        return <Briefcase className="w-4 h-4" />;
      case "developer":
        return <UserCheck className="w-4 h-4" />;
      case "designer":
        return <Award className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { color: "bg-green-100 text-green-800", dot: "bg-green-500" };
      case "on-leave":
        return { color: "bg-amber-100 text-amber-800", dot: "bg-amber-500" };
      case "pre-boarded":
        return { color: "bg-blue-100 text-blue-800", dot: "bg-blue-500" };
      default:
        return { color: "bg-red-100 text-red-800", dot: "bg-red-500" };
    }
  };

  // ---------- Document upload (issue) ----------
  // ---------- Render ----------
  return (
    <DashboardLayout role="ceo">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Loading / Error */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-pulse flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div className="text-gray-600 font-medium">Loading employees...</div>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Main */}
        {!loading && !error && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
                <p className="text-gray-600">Manage your organization&apos;s employees</p>
              </div>
              <div className="bg-white px-4 py-3 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">Total Employees</div>
                <div className="text-xl font-semibold text-gray-900">{employees.length}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d === "all" ? "All Departments" : d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="on-leave">On Leave</option>
                    <option value="offboarded">Offboarded</option>
                    <option value="pre-boarded">Pre-boarded</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setDepartmentFilter("all");
                    setStatusFilter("all");
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { status: "active", label: "Active", color: "border-green-200" },
                { status: "on-leave", label: "On Leave", color: "border-amber-200" },
                { status: "pre-boarded", label: "Pre-boarded", color: "border-blue-200" },
                { status: "offboarded", label: "Offboarded", color: "border-red-200" },
              ].map((stat) => {
                const count = employees.filter(emp => emp.status === stat.status).length;
                return (
                  <div key={stat.status} className={`bg-white rounded-lg border-l-4 ${stat.color} p-4 shadow-sm`}>
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredEmployees.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No employees found</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Try adjusting your search criteria or filters to find what you&apos;re looking for.
                  </p>
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const statusConfig = getStatusConfig(emp.status);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedUser(emp)}
                      className="cursor-pointer bg-white rounded-lg border border-gray-200 p-5 flex flex-col items-center text-center hover:border-gray-300 transition-colors duration-200"
                    >
                      <div className="relative mb-4">
                        <div className="relative w-16 h-16">
                          <Image
                            src={getValidImage(emp.picture, emp.name)}
                            alt={emp.name}
                            width={64}
                            height={64}
                            className="rounded-full object-cover border border-gray-200"
                            unoptimized
                          />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusConfig.dot}`} />
                      </div>

                      <h2 className="font-semibold text-gray-900 mb-1">
                        {emp.name}
                      </h2>

                      <div className="flex items-center gap-1 mb-2">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getRoleColor(emp.role)}`}>
                          {getRoleIcon(emp.role)}
                          {emp.role}
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-2">{emp.department}</p>

                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{emp.email}</span>
                      </div>

                      <div className="w-full space-y-2">
                        <div className={`flex items-center justify-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {emp.status.charAt(0).toUpperCase() + emp.status.slice(1).replace('-', ' ')}
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(emp.joinDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {emp.salary.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected user modal */}
            {selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="bg-white border-b border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {selectedUser.picture ? (
                            <Image
                              src={getValidImage(selectedUser.picture, selectedUser.name)}
                              alt={selectedUser.name}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                              unoptimized
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-lg border border-gray-200">
                              {selectedUser.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusConfig(selectedUser.status).dot}`} />
                        </div>

                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-medium ${getRoleColor(selectedUser.role)}`}>
                              <span>{getRoleIcon(selectedUser.role)}</span>
                              {selectedUser.role.toUpperCase()}
                            </div>

                            <div className="flex items-center gap-1 text-gray-600 text-sm">
                              <Mail className="w-4 h-4" />
                              <span>{selectedUser.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center transition-colors duration-200"
                        onClick={() => setSelectedUser(null)}
                        aria-label="Close"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                      {/* Personal Info */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-gray-600" />
                            Personal Information
                          </h3>

                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">Department:</span>
                              <span className="text-gray-900">{selectedUser.department || "—"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">Phone:</span>
                              <span className="text-gray-900">{selectedUser.phone || "—"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">Salary:</span>
                              <span className="text-gray-900">₹{selectedUser.salary?.toLocaleString() ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">Joined:</span>
                              <span className="text-gray-900">{new Date(selectedUser.joinDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                   {/* Documents */}
<div className="space-y-4">
  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
    <FileText className="w-5 h-5 text-gray-600" />
    Documents
  </h3>

  <div className="space-y-3 max-h-80 overflow-y-auto">
    {[
      "resume",
      "appointment_letter",
      "offer_letter",
      "releaving_letter",
      "resignation_letter",
      "id_proof",
      "achievement_crt",
      "bonafide_crt",
      "marks_card",
      "certificates",
      "tenth",
      "twelth",
      "degree",
      "masters",
      "award",
    ].map((docType) => {
      const docObj = getDocumentForEmail(selectedUser.email);
      let docValue = docObj?.[docType] ?? null;
      if (docValue && typeof docValue !== "string") docValue = String(docValue);

      const isViewing = previewDocs[docType]?.viewing || false;
      const isLoading = previewDocs[docType]?.loading || false;

      const handleView = () => {
        if (!docValue) return;

        // Set loading state
        setPreviewDocs((prev) => ({
          ...prev,
          [docType]: { viewing: false, loading: true },
        }));

        // Simulate load delay or network fetch
        setTimeout(() => {
          setPreviewDocs((prev) => ({
            ...prev,
            [docType]: { viewing: true, loading: false },
          }));
        }, 1200); // 1.2s loading effect
      };

      const handleHide = () => {
        setPreviewDocs((prev) => ({
          ...prev,
          [docType]: { viewing: false, loading: false },
        }));
      };

      return (
        <div key={docType} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="font-medium text-gray-700 text-sm capitalize">
            {docType.replace(/_/g, " ")}
          </span>

          {docValue ? (
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={isViewing ? handleHide : handleView}
                className={`px-3 py-1 text-sm rounded-md border font-medium flex items-center gap-2 transition-all
                  ${isLoading ? "bg-gray-200 text-gray-600 cursor-not-allowed" :
                    "text-blue-600 hover:text-blue-700 hover:border-blue-400 border-gray-300"}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Loading...
                  </>
                ) : isViewing ? (
                  "Hide"
                ) : (
                  "View"
                )}
              </button>

              <a
                href={String(docValue)}
                download
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Download
              </a>
            </div>
          ) : (
            <span className="text-gray-500 text-sm mt-1">Not uploaded</span>
          )}

          {/* Inline Preview */}
       {isViewing && docValue && !isLoading && (
  <div className="mt-3">
    {(() => {
      // Ensure docValue is always a string
      const docValueStr = typeof docValue === "string" ? docValue : String(docValue);
      // Type guard for fileType extraction
      const fileType = typeof docValueStr === "string" ? docValueStr.split(".").pop()?.toLowerCase() : undefined;

      // Images
      if (fileType && ["png", "jpg", "jpeg", "gif", "webp"].includes(fileType)) {
        return (
          <Image
            src={docValueStr}
            alt={docType}
            width={800}
            height={500}
            className="w-full h-[500px] object-contain rounded-lg border"
            unoptimized
          />
        );
      }

      // PDFs
      if (fileType === "pdf") {
        return (
          <iframe
            src={docValueStr}
            className="w-full h-[500px] border rounded-lg"
            title={docType}
          />
        );
      }

      // Fallback
      return (
        <div className="p-4 border rounded bg-gray-100 text-gray-600 text-sm text-center">
          Preview not available for this file type
        </div>
      );
    })()}
  </div>
)}

        </div>
      );
    })}
  </div>
</div>


                      </div>

                      {/* Additional Information */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(selectedUser)
                            .filter(([k]) => !["id", "picture", "name", "role", "department", "email", "status", "joinDate", "phone", "salary"].includes(k))
                            .map(([k, v]) => (
                              <div key={k} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded border border-gray-200">
                                <span className="capitalize text-gray-600 text-sm">{k.replace(/_/g, " ")}:</span>
                                <span className="text-gray-900 text-sm font-medium">{String(v ?? "—")}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
