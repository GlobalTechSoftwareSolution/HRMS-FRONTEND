"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FiSearch,
  FiEye,
  FiX,
  FiChevronUp,
  FiChevronDown,
  FiFileText,
  FiAward,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiBriefcase,
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import axios from "axios";

type Employee = {
  id: number;
  email: string;
  fullname: string;
  age: number | null;
  phone: string | null;
  department: string | null;
  designation: string | null;
  date_of_birth: string | null;
  date_joined: string | null;
  skills: string | null;
  profile_picture: string | null;
  reports_to: string | null;
  status: "active" | "pending";
};

type Document = {
  id: number;
  document_name: string;
  document_file: string;
};

type Award = {
  id: number;
  title: string;
  description: string;
  date: string;
  photo?: string;
};

type SortConfig = {
  key: keyof Employee;
  direction: "ascending" | "descending";
};

export default function HrEmployee() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  type Payroll = Record<string, unknown> & { basic_salary?: number };
  const [payrollData, setPayrollData] = useState<Record<string, Payroll>>({});
  const [documentData, setDocumentData] = useState<{ [key: string]: Document[] }>({});
  const [awardData, setAwardData] = useState<Record<string, Award[]>>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_URL! || "";

  // Fetch payroll for an employee
  const fetchPayrollForEmployee = useCallback(
    async (employee: Employee) => {
      try {
        const res = await axios.get(`${API_BASE}/api/accounts/get_payroll/${employee.email}/`);
        if (res.data && res.data.payrolls?.length > 0) {
          const payroll = res.data.payrolls[0];
          setPayrollData((prev) => ({ ...prev, [employee.email]: payroll }));
        } else {
          // No payroll data found
          setPayrollData((prev) => ({ ...prev, [employee.email]: {} }));
        }
      } catch (err: unknown) {
        console.error("Failed to fetch payroll for", employee.email, err);
        // Set empty object on error to avoid undefined state
        setPayrollData((prev) => ({ ...prev, [employee.email]: {} }));

        // Show user-friendly error message
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            console.warn(`No payroll data found for employee: ${employee.email}`);
          } else {
            console.error(`Error fetching payroll for ${employee.email}:`, err.message);
          }
        } else {
          console.error(`Unexpected error fetching payroll for ${employee.email}:`, err);
        }
      }
    },
    [API_BASE]
  );

  // Fetch documents for an employee
  const fetchDocumentsForEmployee = useCallback(
    async (employee: Employee) => {
      try {
        const res = await axios.get(`${API_BASE}/api/accounts/get_document/${employee.email}/`);
        if (res.data) {
          // Handle different response structures
          const docsData = Array.isArray(res.data) ? res.data[0] : res.data;
          if (docsData) {
            const documentList: Document[] = Object.entries(docsData)
              .filter(([key, value]) =>
                [
                  "resume",
                  "appointment_letter",
                  "offer_letter",
                  "bonafide_crt",
                  "tenth",
                  "twelth",
                  "degree",
                  "masters",
                  "marks_card",
                  "certificates",
                  "award",
                  "id_proof",
                  "releaving_letter",
                  "resignation_letter",
                  "achievement_crt",
                ].includes(key) && value != null
              )
              .map(([key, value], idx) => ({
                id: idx,
                document_name: key.replace(/_/g, " ").toUpperCase(),
                document_file: value as string,
              }));
            setDocumentData((prev) => ({ ...prev, [employee.email]: documentList }));
          } else {
            // No documents found for this employee
            setDocumentData((prev) => ({ ...prev, [employee.email]: [] }));
          }
        } else {
          // No data returned from API
          setDocumentData((prev) => ({ ...prev, [employee.email]: [] }));
        }
      } catch (err: unknown) {
        console.error("Failed to fetch documents for", employee.email, err);
        // Set empty array on error to avoid undefined state
        setDocumentData((prev) => ({ ...prev, [employee.email]: [] }));

        // Show user-friendly error message
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            console.warn(`No documents found for employee: ${employee.email}`);
          } else {
            console.error(`Error fetching documents for ${employee.email}:`, err.message);
          }
        } else {
          console.error(`Unexpected error fetching documents for ${employee.email}:`, err);
        }
      }
    },
    [API_BASE]
  );

  // Fetch all awards
  const fetchAllAwards = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/accounts/list_awards/`);
      if (res.data) {
        // Handle different response structures
        const awardsData = Array.isArray(res.data) ? res.data : (res.data.awards || res.data.data || []);
        const awardsByEmail: Record<string, Award[]> = {};
        awardsData.forEach((award: Award & { email: string; created_at: string }) => {
          if (!awardsByEmail[award.email]) awardsByEmail[award.email] = [];
          awardsByEmail[award.email].push({
            id: award.id,
            title: award.title,
            description: award.description,
            date: award.created_at || award.date,
            photo: award.photo,
          });
        });
        setAwardData(awardsByEmail);
      } else {
        // No data returned from API
        setAwardData({});
      }
    } catch (err: unknown) {
      console.error("Failed to fetch awards", err);
      // Set empty object on error to avoid undefined state
      setAwardData({});

      // Show user-friendly error message
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          console.warn("No awards found in the system");
        } else {
          console.error("Error fetching awards:", err.message);
        }
      } else {
        console.error("Unexpected error fetching awards:", err);
      }
    }
  }, [API_BASE]);

  const handleViewDetails = async (employee: Employee) => {
    setSelectedEmployee(employee);

    try {
      // Fetch data for the selected employee
      await Promise.all([
        fetchPayrollForEmployee(employee),
        fetchDocumentsForEmployee(employee),
      ]);

      // Fetch awards only if not already loaded
      if (Object.keys(awardData).length === 0) {
        await fetchAllAwards();
      }
    } catch (err: unknown) {
      console.error("Error loading employee details:", err);
      // Still show the modal even if some data failed to load
      if (axios.isAxiosError(err)) {
        console.error("Axios error:", err.message);
      } else {
        console.error("Unexpected error:", err);
      }
    }
  };

  // Fetch all employees
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const empRes = await fetch(`${API_BASE}/api/accounts/employees/`);
      if (!empRes.ok) throw new Error(`Employee fetch error! status: ${empRes.status}`);
      const empDataRaw = await empRes.json();
      const empData = Array.isArray(empDataRaw) ? empDataRaw : (empDataRaw?.employees || empDataRaw?.data || []);
      setEmployees(empData || []);
      setError("");

      await Promise.all(empData.map((emp: Employee) => fetchPayrollForEmployee(emp)));
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Failed to fetch data:", err.message);
        setError("Failed to fetch employee data");
        toast.error("Failed to fetch employee data");
      } else {
        console.error("Failed to fetch data:", err);
        setError("Failed to fetch employee data");
        toast.error("Failed to fetch employee data");
      }
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, fetchPayrollForEmployee]);

  useEffect(() => {
    fetchData();
    // Pre-fetch awards data
    fetchAllAwards();
  }, [fetchData, fetchAllAwards]);

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[];

  const filteredData = useMemo(
    () =>
      employees.filter((emp) => {
        const matchesSearch =
          emp.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDept = filterDepartment === "all" || emp.department === filterDepartment;
        return matchesSearch && matchesDept;
      }),
    [employees, searchTerm, filterDepartment]
  );

  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    if (sortConfig) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue == null || bValue == null) return 0;
        return sortConfig.direction === "ascending" ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
      });
    }
    return sorted;
  }, [filteredData, sortConfig]);

  const requestSort = (key: keyof Employee) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") direction = "descending";
    setSortConfig({ key, direction });
  };

  const formatDate = (date: string | null) => (date ? new Date(date).toLocaleDateString() : "N/A");
  const formatSalary = (amount: number | string | undefined) =>
    amount
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(Number(amount))
      : "N/A";

  return (
    <>
      <style jsx global>{`
        body {
          overflow-x: hidden;
        }
        * {
          max-width: 100%;
        }
        
        /* Custom breakpoints for extra small devices */
        @media (max-width: 480px) {
          .xs\\:grid-cols-2 {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .max-w-7xl {
            margin-left: 0.5rem;
            margin-right: 0.5rem;
          }
        }

        /* Ensure modal is properly sized on very small screens */
        @media (max-width: 360px) {
          .fixed.inset-0 {
            padding: 0.5rem;
          }
          
          .bg-white.rounded-lg {
            border-radius: 0.5rem;
          }
        }

        /* Improve touch targets on mobile */
        @media (max-width: 768px) {
          button, 
          [role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Smooth scrolling for mobile */
        @media (max-width: 768px) {
          html {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
      <DashboardLayout role="hr">
        <ToastContainer position="top-right" autoClose={3000} />

        {/* ===== EMPLOYEE DETAILS MODAL ===== */}
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-2 sm:p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto m-2 shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl shadow-sm z-10 flex justify-between items-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Employee Profile</h3>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 sm:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 ml-2"
                  onClick={() => setSelectedEmployee(null)}
                >
                  <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-blue-600 font-bold text-3xl shadow-sm border-4 border-white flex-shrink-0">
                    {selectedEmployee.profile_picture ? (
                      <Image
                        src={selectedEmployee.profile_picture}
                        alt={selectedEmployee.fullname}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      selectedEmployee.fullname.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight break-words">{selectedEmployee.fullname}</h4>
                    <p className="text-blue-600 font-semibold text-sm sm:text-base mt-1">{selectedEmployee.designation || "No Designation"}</p>
                    <p className="text-slate-500 font-medium text-sm break-words mt-1">{selectedEmployee.email}</p>

                    <div className="inline-flex mt-3 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold uppercase tracking-wider">
                        {selectedEmployee.department || "No Department"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: "Phone", value: selectedEmployee.phone || "N/A", icon: FiSearch },
                    { label: "Date Joined", value: formatDate(selectedEmployee.date_joined), icon: FiBriefcase },
                    { label: "Date of Birth", value: formatDate(selectedEmployee.date_of_birth), icon: FiUsers },
                    { label: "Basic Salary", value: formatSalary(payrollData[selectedEmployee.email]?.basic_salary), icon: FiFileText }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 text-center shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="text-sm sm:text-base font-bold text-slate-800 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Documents Column */}
                  <div>
                    <h4 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <FiFileText className="text-blue-600" />
                      </div>
                      Documents
                    </h4>
                    {documentData[selectedEmployee.email] && documentData[selectedEmployee.email].length > 0 ? (
                      <div className="space-y-2">
                        {documentData[selectedEmployee.email].map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                            <span className="text-sm font-medium text-slate-700 truncate min-w-0 pr-2">{doc.document_name}</span>
                            <button
                              onClick={() => window.open(doc.document_file, "_blank")}
                              className="flex-shrink-0 px-3 py-1.5 bg-white text-blue-600 border border-blue-200 text-xs font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
                            >
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-sm text-slate-500 font-medium">No documents uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* Awards Column */}
                  <div>
                    <h4 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                        <FiAward className="text-yellow-600" />
                      </div>
                      Awards & Recognition
                    </h4>
                    {awardData[selectedEmployee.email] && awardData[selectedEmployee.email].length > 0 ? (
                      <div className="space-y-3">
                        {awardData[selectedEmployee.email].map((award, idx) => (
                          <div key={idx} className="flex gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 overflow-hidden flex items-center justify-center text-yellow-600 flex-shrink-0 shadow-sm">
                              {award.photo ? (
                                <Image src={award.photo} alt={award.title} width={40} height={40} className="w-full h-full object-cover" />
                              ) : (
                                <FiAward className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{award.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{formatDate(award.date)}</p>
                              {award.description && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{award.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-sm text-slate-500 font-medium">No awards granted yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl text-right">
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-4 sm:p-6 md:p-8 w-full relative">
          <div className="max-w-7xl mx-auto w-full">
            {/* Dashboard Header */}
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                  Employee Management
                </h1>
                <p className="text-slate-500 font-medium tracking-wide text-sm sm:text-base">
                  View, manage, and track all your team members
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <FiUsers className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-400 tracking-wider leading-none mb-1">Total Team</span>
                  <span className="block text-lg font-bold text-slate-800 leading-none">{employees.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Top Bar with Search & Filters */}
              <div className="p-5 sm:p-6 border-b border-slate-100">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search employees by name, email, or designation..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium outline-none placeholder:text-slate-400 text-slate-900"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      className="w-full md:w-56 pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-slate-50 focus:bg-white outline-none font-semibold text-slate-700 cursor-pointer"
                    >
                      <option value="all">All Departments</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Content Area */}
              {isLoading ? (
                <div className="py-20 text-center">
                  <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 animate-spin rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-500 font-medium">Loading workforce data...</p>
                </div>
              ) : error ? (
                <div className="py-12 px-6">
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium border border-red-100">
                    {error}
                  </div>
                </div>
              ) : Object.keys(sortedData).length === 0 ? (
                <div className="py-20 text-center px-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <FiUsers className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No employees found</h3>
                  <p className="text-slate-500 text-sm">Try adjusting your search criteria or department filter.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          {[
                            { key: 'fullname', label: 'Employee Profile' },
                            { key: 'designation', label: 'Designation' },
                            { key: 'department', label: 'Department' },
                            { key: 'date_joined', label: 'Join Date' }
                          ].map((col) => (
                            <th
                              key={col.key}
                              onClick={() => requestSort(col.key as keyof Employee)}
                              className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                            >
                              <div className="flex items-center gap-2">
                                {col.label}
                                <span className="text-slate-300 group-hover:text-slate-400 transition-colors">
                                  {sortConfig?.key === col.key ? (
                                    sortConfig.direction === "ascending" ? <FiChevronUp className="w-4 h-4 text-slate-600" /> : <FiChevronDown className="w-4 h-4 text-slate-600" />
                                  ) : (
                                    <FiChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                                  )}
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Salary</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedData.map((emp) => (
                          <tr key={emp.email} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-slate-200">
                                  {emp.profile_picture ? (
                                    <Image src={emp.profile_picture} alt={emp.fullname} width={40} height={40} className="object-cover w-full h-full" />
                                  ) : (
                                    emp.fullname.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{emp.fullname}</h4>
                                  <p className="text-xs text-slate-500 mt-0.5">{emp.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-slate-700">{emp.designation || "N/A"}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                                {emp.department || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                              {formatDate(emp.date_joined)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                              {formatSalary(payrollData[emp.email]?.basic_salary)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => handleViewDetails(emp)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-blue-600 font-semibold hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                              >
                                <FiEye className="w-4 h-4" /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="md:hidden p-4 space-y-4 bg-slate-50 border-t border-slate-200">
                    {sortedData.map((emp) => (
                      <div key={emp.email} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden shrink-0 border border-slate-200">
                            {emp.profile_picture ? (
                              <Image src={emp.profile_picture} alt={emp.fullname} width={48} height={48} className="object-cover w-full h-full" />
                            ) : (
                              emp.fullname.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-800 truncate text-base">{emp.fullname}</h4>
                            <p className="text-sm text-slate-500 truncate">{emp.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Designation</p>
                            <p className="font-medium text-slate-800 truncate">{emp.designation || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Department</p>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase tracking-wide truncate max-w-full">
                              {emp.department || "N/A"}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Salary</p>
                            <p className="font-bold text-slate-800">{formatSalary(payrollData[emp.email]?.basic_salary)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase mb-0.5">Join Date</p>
                            <p className="font-medium text-slate-800">{formatDate(emp.date_joined)}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewDetails(emp)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-600 hover:text-white transition-all font-semibold shadow-sm text-sm"
                        >
                          <FiEye className="w-4 h-4" /> View Full Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
