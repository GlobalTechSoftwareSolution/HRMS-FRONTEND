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
        }
      } catch (err) {
        console.error("Failed to fetch payroll for", employee.email, err);
      }
    },
    [API_BASE]
  );

  // Fetch documents for an employee
  const fetchDocumentsForEmployee = useCallback(
    async (employee: Employee) => {
      try {
        const res = await axios.get(`${API_BASE}/api/accounts/get_document/${employee.email}/`);
        if (res.data && res.data.length > 0) {
          const docs = res.data[0];
          const documentList: Document[] = Object.entries(docs)
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
        }
      } catch (err) {
        console.error("Failed to fetch documents for", employee.email, err);
      }
    },
    [API_BASE]
  );

  // Fetch all awards
  const fetchAllAwards = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/accounts/list_awards/`);
      if (res.data && Array.isArray(res.data)) {
        const awardsByEmail: Record<string, Award[]> = {};
        res.data.forEach((award: Award & { email: string; created_at: string }) => {
          if (!awardsByEmail[award.email]) awardsByEmail[award.email] = [];
          awardsByEmail[award.email].push({
            id: award.id,
            title: award.title,
            description: award.description,
            date: award.created_at,
            photo: award.photo,
          });
        });
        setAwardData(awardsByEmail);
      }
    } catch (err) {
      console.error("Failed to fetch awards", err);
    }
  }, [API_BASE]);

  const handleViewDetails = async (employee: Employee) => {
    setSelectedEmployee(employee);
    await Promise.all([
      fetchPayrollForEmployee(employee),
      fetchDocumentsForEmployee(employee),
      fetchAllAwards(),
    ]);
  };

  // Fetch all employees
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const empRes = await fetch(`${API_BASE}/api/accounts/employees/`);
      if (!empRes.ok) throw new Error(`Employee fetch error! status: ${empRes.status}`);
      const empData: Employee[] = await empRes.json();
      setEmployees(empData || []);
      setError("");

      await Promise.all(empData.map((emp) => fetchPayrollForEmployee(emp)));
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
  }, [fetchData]);

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
    <DashboardLayout role="hr">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-3 sm:p-4 md:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Employee Management</h2>

        {/* Search & Filter */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-md border mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Modal */}
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold">Employee Details</h3>
                <button onClick={() => setSelectedEmployee(null)} className="text-gray-500 hover:text-gray-700">
                  <FiX size={20} />
                </button>
              </div>

              {/* Profile */}
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-blue-600 font-bold text-lg sm:text-xl">
                  {selectedEmployee.profile_picture ? (
                    <Image
                      src={selectedEmployee.profile_picture}
                      alt={selectedEmployee.fullname}
                      width={64}
                      height={64}
                      className="object-cover rounded-full"
                    />
                  ) : (
                    selectedEmployee.fullname.charAt(0)
                  )}
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="text-base sm:text-lg font-medium">{selectedEmployee.fullname}</h4>
                  <p className="text-gray-500 text-sm sm:text-base">{selectedEmployee.email}</p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm">
                <p><strong>Designation:</strong> {selectedEmployee.designation || "N/A"}</p>
                <p><strong>Department:</strong> {selectedEmployee.department || "N/A"}</p>
                <p><strong>Phone:</strong> {selectedEmployee.phone || "N/A"}</p>
                <p><strong>Joined:</strong> {formatDate(selectedEmployee.date_joined)}</p>
                <p><strong>Salary:</strong> {formatSalary(payrollData[selectedEmployee.email]?.basic_salary)}</p>
              </div>

              {/* Documents */}
              <div className="mb-4 sm:mb-6">
                <h4 className="text-base sm:text-lg font-semibold flex items-center mb-2">
                  <FiFileText className="mr-2 text-blue-600" /> Documents
                </h4>
                {documentData[selectedEmployee.email]?.length ? (
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-2">
                    {documentData[selectedEmployee.email].map((doc) => (
                      <li key={doc.id} className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="truncate mr-2">{doc.document_name}</span>
                        <button
                          onClick={() => window.open(doc.document_file, "_blank")}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 whitespace-nowrap"
                        >
                          View
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-xs sm:text-sm">No documents found.</p>
                )}
              </div>

              {/* Awards */}
              <div className="mb-4 sm:mb-6">
                <h4 className="text-base sm:text-lg font-semibold flex items-center mb-2">
                  <FiAward className="mr-2 text-yellow-600" /> Awards
                </h4>
                {awardData[selectedEmployee.email]?.length ? (
                  <ul className="list-disc pl-4 sm:pl-5 space-y-2">
                    {awardData[selectedEmployee.email].map((award) => (
                      <li key={award.id} className="flex items-center space-x-2 sm:space-x-3">
                        {award.photo && (
                          <Image
                            src={award.photo}
                            alt={award.title}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{award.title}</p>
                          <p className="text-gray-600 text-xs truncate">{award.description || "No description"}</p>
                          <p className="text-gray-400 text-xs">{formatDate(award.date)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-xs sm:text-sm">No awards found.</p>
                )}
              </div>

              <div className="text-right">
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee Table - Hidden on small screens */}
        {isLoading ? (
          <div className="text-center py-6 sm:py-8">
            <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto rounded-full"></div>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading employees...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-3 sm:p-4 rounded-md text-red-700 text-sm sm:text-base">{error}</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => requestSort("fullname")}
                      className="p-3 text-left font-medium cursor-pointer"
                    >
                      Employee{" "}
                      {sortConfig?.key === "fullname" &&
                        (sortConfig.direction === "ascending" ? <FiChevronUp className="inline" /> : <FiChevronDown className="inline" />)}
                    </th>
                    <th className="p-3 text-left font-medium">Designation</th>
                    <th className="p-3 text-left font-medium">Department</th>
                    <th className="p-3 text-left font-medium">Salary</th>
                    <th className="p-3 text-left font-medium">Join Date</th>
                    <th className="p-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((emp) => (
                    <tr key={emp.email} className="hover:bg-gray-50">
                      <td className="p-3 flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-blue-600 font-bold">
                          {emp.profile_picture ? (
                            <Image
                              src={emp.profile_picture}
                              alt={emp.fullname}
                              width={40}
                              height={40}
                              className="object-cover rounded-full"
                            />
                          ) : (
                            emp.fullname.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{emp.fullname}</div>
                          <div className="text-xs text-gray-500">{emp.email}</div>
                        </div>
                      </td>
                      <td className="p-3">{emp.designation || "N/A"}</td>
                      <td className="p-3">{emp.department || "N/A"}</td>
                      <td className="p-3 font-medium">{formatSalary(payrollData[emp.email]?.basic_salary)}</td>
                      <td className="p-3">{formatDate(emp.date_joined)}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleViewDetails(emp)}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <FiEye className="mr-1" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
              {sortedData.map((emp) => (
                <div key={emp.email} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-blue-600 font-bold text-lg">
                      {emp.profile_picture ? (
                        <Image
                          src={emp.profile_picture}
                          alt={emp.fullname}
                          width={48}
                          height={48}
                          className="object-cover rounded-full"
                        />
                      ) : (
                        emp.fullname.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{emp.fullname}</h3>
                      <p className="text-gray-500 text-sm truncate">{emp.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Designation:</span>
                      <p className="font-medium truncate">{emp.designation || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Department:</span>
                      <p className="font-medium truncate">{emp.department || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Salary:</span>
                      <p className="font-medium">{formatSalary(payrollData[emp.email]?.basic_salary)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Joined:</span>
                      <p className="font-medium">{formatDate(emp.date_joined)}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleViewDetails(emp)}
                      className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                    >
                      <FiEye className="mr-1" /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* No Results Message */}
        {!isLoading && !error && sortedData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No employees found matching your criteria.
          </div>
        )}
      </div>

      <style jsx global>{`
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
    </DashboardLayout>
  );
}