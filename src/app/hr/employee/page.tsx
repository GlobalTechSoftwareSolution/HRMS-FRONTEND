"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FiSearch, FiChevronDown, FiChevronUp, FiEye, FiEdit } from "react-icons/fi";
import { ToastContainer, toast } from 'react-toastify';
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          "http://127.0.0.1:8000/api/accounts/employees/"
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Fetched employees:", data);

        if (!Array.isArray(data)) {
          throw new Error("Unexpected data format: expected an array");
        }

        setEmployees(data);
        setError("");
      } catch (err: any) {
        console.error("Failed to fetch employees:", err);
        setError("Failed to fetch employees. Please check console for details.");
        toast.error("Failed to fetch employees");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Handle onboard new employee (redirect to signup)
  const handleOnboardEmployee = () => {
    window.location.href = "http://127.0.0.1:8000/api/accounts/signup";
  };

  // Handle edit employee
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditFormData(employee);
    setIsEditing(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save edited employee data
  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/accounts/employees/${selectedEmployee.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editFormData),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const updatedEmployee = await res.json();
      
      // Update the employees list
      setEmployees(prev => prev.map(emp => 
        emp.id === selectedEmployee.id ? updatedEmployee : emp
      ));
      
      toast.success("Employee updated successfully");
      setIsEditing(false);
      setSelectedEmployee(null);
    } catch (err: any) {
      console.error("Failed to update employee:", err);
      toast.error("Failed to update employee");
    }
  };

  // Get unique departments for filter
  const departments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean))) as string[];

  // Filter and sort employees
  const filteredAndSortedEmployees = React.useMemo(() => {
    let filtered = employees.filter(employee => {
      const matchesSearch = employee.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (employee.designation && employee.designation.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDepartment = filterDepartment === "all" || employee.department === filterDepartment;
      
      return matchesSearch && matchesDepartment;
    });

    if (sortConfig) {
      filtered.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue == null || bValue == null) return 0;

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [employees, searchTerm, filterDepartment, sortConfig]);

  const requestSort = (key: keyof Employee) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditing(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <DashboardLayout role="hr">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-gray-50 p-4 rounded-md border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Details/Edit Modal */}
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">
                {isEditing ? "Edit Employee" : "Employee Details"}
              </h3>
              
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  {selectedEmployee.profile_picture ? (
                    <img className="h-16 w-16 rounded-full" src={selectedEmployee.profile_picture} alt={selectedEmployee.fullname} />
                  ) : (
                    selectedEmployee.fullname.charAt(0)
                  )}
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">{selectedEmployee.fullname}</h4>
                  <p className="text-gray-500">{selectedEmployee.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="designation"
                        value={editFormData.designation || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedEmployee.designation || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="department"
                        value={editFormData.department || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedEmployee.department || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="phone"
                        value={editFormData.phone || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedEmployee.phone || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="age"
                        value={editFormData.age || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedEmployee.age || "N/A"}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="date_of_birth"
                        value={editFormData.date_of_birth || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    ) : (
                      <p className="text-gray-900">{formatDate(selectedEmployee.date_of_birth)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Joined</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="date_joined"
                        value={editFormData.date_joined || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    ) : (
                      <p className="text-gray-900">{formatDate(selectedEmployee.date_joined)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reports To</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="reports_to"
                        value={editFormData.reports_to || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedEmployee.reports_to || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                    {isEditing ? (
                      <textarea
                        name="skills"
                        value={editFormData.skills || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-900">{selectedEmployee.skills || "N/A"}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
                    >
                      <FiEdit className="mr-1" />
                      Edit Info
                    </button>
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading and Error States */}
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

        {/* Employee List */}
        {!isLoading && !error && (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('fullname')}
                    >
                      <div className="flex items-center">
                        <span>Employee</span>
                        {sortConfig?.key === 'fullname' && (
                          sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('designation')}
                    >
                      <div className="flex items-center">
                        <span>Designation</span>
                        {sortConfig?.key === 'designation' && (
                          sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('department')}
                    >
                      <div className="flex items-center">
                        <span>Department</span>
                        {sortConfig?.key === 'department' && (
                          sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('date_joined')}
                    >
                      <div className="flex items-center">
                        <span>Join Date</span>
                        {sortConfig?.key === 'date_joined' && (
                          sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedEmployees.map((emp) => (
                    <tr key={emp.email} className="hover:bg-gray-50 transition">
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            {emp.profile_picture ? (
                              <img className="h-10 w-10 rounded-full" src={emp.profile_picture} alt={emp.fullname} />
                            ) : (
                              emp.fullname.charAt(0)
                            )}
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
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleViewDetails(emp)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <FiEye className="mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleEditEmployee(emp)}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <FiEdit className="mr-1" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredAndSortedEmployees.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No employees found matching your criteria
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredAndSortedEmployees.length} of {employees.length} employees
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}