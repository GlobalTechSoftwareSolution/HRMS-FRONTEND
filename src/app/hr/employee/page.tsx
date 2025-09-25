"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import { FiSearch, FiChevronDown, FiChevronUp, FiEye, FiUser, FiX } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

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
};

type SortConfig = {
  key: keyof Employee;
  direction: 'ascending' | 'descending';
};

export default function HREmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: Employee[] = await res.json();
        if (!Array.isArray(data)) throw new Error("Unexpected data format: expected an array");
        setEmployees(data);
        setError("");
      } catch (err: unknown) {
        console.error("Failed to fetch employees:", err);
        setError("Failed to fetch employees. Please check console for details.");
        toast.error("Failed to fetch employees");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    const checkScreenSize = () => setIsMobileView(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleOnboardEmployee = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/signup`;
  };

  const handleViewDetails = (employee: Employee) => setSelectedEmployee(employee);
  const closeModal = () => setSelectedEmployee(null);
  const formatDate = (dateString: string | null) => !dateString ? "N/A" : new Date(dateString).toLocaleDateString();

  const requestSort = (key: keyof Employee) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const departments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean))) as string[];

  const filteredAndSortedEmployees = React.useMemo(() => {
    const filtered = employees.filter(employee => {
      const matchesSearch =
        employee.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesDepartment = filterDepartment === "all" || employee.department === filterDepartment;
      return matchesSearch && matchesDepartment;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue == null || bValue == null) return 0;
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [employees, searchTerm, filterDepartment, sortConfig]);

  const EmployeeCard = ({ employee }: { employee: Employee }) => (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
            {employee.profile_picture ? (
              <Image src={employee.profile_picture} alt={employee.fullname} width={48} height={48} className="rounded-full object-cover"/>
            ) : employee.fullname.charAt(0)}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">{employee.fullname}</h3>
            <p className="text-xs text-gray-500 truncate">{employee.email}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => handleViewDetails(employee)} className="text-blue-600 hover:text-blue-800 p-1"><FiEye size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-gray-500">Designation</p>
          <p className="font-medium truncate">{employee.designation || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Department</p>
          <p className="font-medium truncate">{employee.department || "N/A"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-500">Joined</p>
          <p className="font-medium">{formatDate(employee.date_joined)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout role="hr">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 md:gap-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Employee Management</h2>
          <button onClick={handleOnboardEmployee} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-md text-sm md:text-base transition">Onboard New Employee</button>
        </div>

        {/* Search & Filter */}
        <div className="bg-gray-50 p-4 rounded-md border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input type="text" placeholder="Search employees..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Departments</option>
              {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
            </select>
          </div>
        </div>

        {/* Employee List */}
        {!isLoading && !error && (
          <>
            {isMobileView ? (
              <div className="md:hidden">
                {filteredAndSortedEmployees.length ? filteredAndSortedEmployees.map(emp => <EmployeeCard key={emp.email} employee={emp} />) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiUser className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-4">No employees found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {["fullname", "designation", "department", "date_joined"].map((col) => (
                        <th key={col} onClick={() => requestSort(col as keyof Employee)}
                          className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                          <div className="flex items-center">
                            <span>{col.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
                            {sortConfig?.key === col && (sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1"/> : <FiChevronDown className="ml-1"/>)}
                          </div>
                        </th>
                      ))}
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedEmployees.map(emp => (
                      <tr key={emp.email} className="hover:bg-gray-50 transition">
                        <td className="p-3">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                              {emp.profile_picture ? (<Image src={emp.profile_picture} alt={emp.fullname} width={40} height={40} className="rounded-full object-cover"/>) : emp.fullname.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{emp.fullname}</div>
                              <div className="text-sm text-gray-500">{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-700">{emp.designation || "N/A"}</td>
                        <td className="p-3 text-sm text-gray-700">{emp.department || "N/A"}</td>
                        <td className="p-3 text-sm text-gray-700">{formatDate(emp.date_joined)}</td>
                        <td className="p-3 text-sm font-medium">
                          <button onClick={() => handleViewDetails(emp)} className="text-blue-600 hover:text-blue-900 flex items-center">
                            <FiEye className="mr-1"/> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAndSortedEmployees.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FiUser className="mx-auto h-12 w-12 text-gray-400"/>
                    <p className="mt-4">No employees found</p>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredAndSortedEmployees.length} of {employees.length} employees
            </div>
          </>
        )}

        {/* Loading & Error */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading employees...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg w-11/12 max-w-md p-6 relative">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"><FiX size={20} /></button>
            <div className="flex flex-col items-center">
              {selectedEmployee.profile_picture ? (
                <Image src={selectedEmployee.profile_picture} alt={selectedEmployee.fullname} width={80} height={80} className="rounded-full object-cover"/>
              ) : (
                <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">{selectedEmployee.fullname.charAt(0)}</div>
              )}
              <h3 className="text-lg font-semibold mt-2">{selectedEmployee.fullname}</h3>
              <p className="text-sm text-gray-500">{selectedEmployee.email}</p>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p><strong>Designation:</strong> {selectedEmployee.designation || "N/A"}</p>
              <p><strong>Department:</strong> {selectedEmployee.department || "N/A"}</p>
              <p><strong>Age:</strong> {selectedEmployee.age || "N/A"}</p>
              <p><strong>Phone:</strong> {selectedEmployee.phone || "N/A"}</p>
              <p><strong>Date of Birth:</strong> {formatDate(selectedEmployee.date_of_birth)}</p>
              <p><strong>Date Joined:</strong> {formatDate(selectedEmployee.date_joined)}</p>
              <p><strong>Skills:</strong> {selectedEmployee.skills || "N/A"}</p>
              <p><strong>Reports To:</strong> {selectedEmployee.reports_to || "N/A"}</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
