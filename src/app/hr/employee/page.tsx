"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiFilter, FiChevronDown, FiChevronUp, FiUserPlus } from "react-icons/fi";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Employee = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
  status: "active" | "on-leave" | "terminated";
  avatar?: string;
};

type SortConfig = {
  key: keyof Employee;
  direction: 'ascending' | 'descending';
};

export default function HREmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "Software Engineer",
      department: "Engineering",
      joinDate: "2023-05-01",
      status: "active",
      avatar: "/avatars/john.jpg"
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "HR Manager",
      department: "Human Resources",
      joinDate: "2022-11-15",
      status: "active",
      avatar: "/avatars/jane.jpg"
    },
    {
      id: 3,
      name: "Robert Johnson",
      email: "robert@example.com",
      role: "Product Designer",
      department: "Design",
      joinDate: "2023-02-20",
      status: "on-leave",
      avatar: "/avatars/robert.jpg"
    },
    {
      id: 4,
      name: "Sarah Williams",
      email: "sarah@example.com",
      role: "Marketing Specialist",
      department: "Marketing",
      joinDate: "2022-08-10",
      status: "active",
      avatar: "/avatars/sarah.jpg"
    },
    {
      id: 5,
      name: "Michael Brown",
      email: "michael@example.com",
      role: "Sales Executive",
      department: "Sales",
      joinDate: "2023-01-15",
      status: "terminated",
      avatar: "/avatars/michael.jpg"
    },
  ]);

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    joinDate: "",
  });

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Get unique departments for filter
  const departments = Array.from(new Set(employees.map(emp => emp.department)));

  // Filter and sort employees
  const filteredAndSortedEmployees = React.useMemo(() => {
    let filtered = employees.filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.role.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = filterDepartment === "all" || employee.department === filterDepartment;
      const matchesStatus = filterStatus === "all" || employee.status === filterStatus;
      
      return matchesSearch && matchesDepartment && matchesStatus;
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
  }, [employees, searchTerm, filterDepartment, filterStatus, sortConfig]);

  const requestSort = (key: keyof Employee) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.role || !newEmployee.department || !newEmployee.joinDate) {
      toast.error("Please fill all required fields");
      return;
    }

    const newEmp: Employee = {
      id: Date.now(),
      ...newEmployee,
      status: "active",
      avatar: "/avatars/default.jpg"
    };

    setEmployees([newEmp, ...employees]);
    setNewEmployee({ name: "", email: "", role: "", department: "", joinDate: "" });
    setIsAdding(false);
    toast.success("Employee added successfully!");
  };

  const handleDeleteEmployee = (id: number) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      setEmployees(employees.filter(emp => emp.id !== id));
      toast.info("Employee deleted");
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  const handleUpdateEmployee = () => {
    if (!editingEmployee) return;

    setEmployees(employees.map(emp => 
      emp.id === editingEmployee.id ? editingEmployee : emp
    ));
    setEditingEmployee(null);
    toast.success("Employee updated successfully!");
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "on-leave": return "bg-yellow-100 text-yellow-800";
      case "terminated": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout role="hr">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition"
          >
            <FiUserPlus className="mr-2" />
            {isAdding ? "Cancel" : "Add Employee"}
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-gray-50 p-4 rounded-md border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on-leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>

        {/* Add Employee Form */}
        {isAdding && (
          <div className="bg-blue-50 p-6 rounded-md border border-blue-200 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center">
              <FiUserPlus className="mr-2" /> Add New Employee
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <input
                  type="text"
                  placeholder="Role"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Join Date *</label>
                <input
                  type="date"
                  value={newEmployee.joinDate}
                  onChange={(e) => setNewEmployee({ ...newEmployee, joinDate: e.target.value })}
                  className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={handleAddEmployee}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Add Employee
              </button>
            </div>
          </div>
        )}

        {/* Edit Employee Modal */}
        {editingEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Edit Employee</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingEmployee.name}
                    onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
                    className="border rounded-md p-2 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingEmployee.email}
                    onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
                    className="border rounded-md p-2 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input
                    type="text"
                    value={editingEmployee.role}
                    onChange={(e) => setEditingEmployee({...editingEmployee, role: e.target.value})}
                    className="border rounded-md p-2 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={editingEmployee.department}
                    onChange={(e) => setEditingEmployee({...editingEmployee, department: e.target.value})}
                    className="border rounded-md p-2 w-full"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingEmployee.status}
                    onChange={(e) => setEditingEmployee({...editingEmployee, status: e.target.value as any})}
                    className="border rounded-md p-2 w-full"
                  >
                    <option value="active">Active</option>
                    <option value="on-leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateEmployee}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee List */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    <span>Employee</span>
                    {sortConfig?.key === 'name' && (
                      sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('role')}
                >
                  <div className="flex items-center">
                    <span>Role</span>
                    {sortConfig?.key === 'role' && (
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
                  onClick={() => requestSort('joinDate')}
                >
                  <div className="flex items-center">
                    <span>Join Date</span>
                    {sortConfig?.key === 'joinDate' && (
                      sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {emp.avatar ? (
                          <img className="h-10 w-10 rounded-full" src={emp.avatar} alt={emp.name} />
                        ) : (
                          emp.name.charAt(0)
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                        <div className="text-sm text-gray-500">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-700">{emp.role}</td>
                  <td className="p-3 text-sm text-gray-700">{emp.department}</td>
                  <td className="p-3 text-sm text-gray-700">{emp.joinDate}</td>
                  <td className="p-3">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(emp.status)}`}>
                      {emp.status.charAt(0).toUpperCase() + emp.status.slice(1).replace('-', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-sm font-medium">
                    <button
                      onClick={() => handleEditEmployee(emp)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 />
                    </button>
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
      </div>
    </DashboardLayout>
  );
}