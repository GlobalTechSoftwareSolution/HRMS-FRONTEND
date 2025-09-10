"use client";
import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Employee = {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  status: "active" | "on-leave" | "offboarded";
  joinDate: string;
  phone: string;
  salary: number;
};

type SortConfig = {
  key: keyof Employee | "";
  direction: "ascending" | "descending";
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: "Sharan Patil", role: "Manager", department: "HR", email: "sharan@example.com", status: "active", joinDate: "2022-03-15", phone: "+1-555-0123", salary: 75000 },
    { id: 2, name: "Mani Bharadwaj", role: "Developer", department: "Engineering", email: "mani@example.com", status: "active", joinDate: "2021-08-22", phone: "+1-555-0145", salary: 85000 },
    { id: 3, name: "Anita Sharma", role: "HR Specialist", department: "HR", email: "anita@example.com", status: "on-leave", joinDate: "2020-11-05", phone: "+1-555-0178", salary: 65000 },
    { id: 4, name: "Rajiv Mehta", role: "Senior Developer", department: "Engineering", email: "rajiv@example.com", status: "active", joinDate: "2019-05-30", phone: "+1-555-0192", salary: 95000 },
    { id: 5, name: "Sneha Kapoor", role: "Marketing Lead", department: "Marketing", email: "sneha@example.com", status: "active", joinDate: "2023-01-10", phone: "+1-555-0215", salary: 70000 },
    { id: 6, name: "Arun Singh", role: "Sales Executive", department: "Sales", email: "arun@example.com", status: "offboarded", joinDate: "2018-07-17", phone: "+1-555-0241", salary: 60000 },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: "ascending" });
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState<number | null>(null);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, "id">>({
    name: "",
    role: "",
    department: "Engineering",
    email: "",
    status: "active",
    joinDate: new Date().toISOString().split('T')[0],
    phone: "",
    salary: 0
  });

  const departments = useMemo(() => {
    const depts = new Set(employees.map(emp => emp.department));
    return ["all", ...Array.from(depts)];
  }, [employees]);

  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees.filter(employee => {
      const matchesSearch = 
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });

    if (sortConfig.key) {
      const key = sortConfig.key as keyof typeof filtered[0];

      filtered.sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];

        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [employees, searchTerm, departmentFilter, statusFilter, sortConfig]);

  const handleSort = (key: keyof Employee) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email) return alert("Name and Email are required!");
    if (editEmployeeId) {
      setEmployees(employees.map(emp => emp.id === editEmployeeId ? { id: editEmployeeId, ...newEmployee } : emp));
      setEditEmployeeId(null);
    } else {
      const newId = Math.max(...employees.map(e => e.id)) + 1;
      setEmployees([...employees, { id: newId, ...newEmployee }]);
    }
    setIsAddEmployeeModalOpen(false);
    setNewEmployee({
      name: "",
      role: "",
      department: "Engineering",
      email: "",
      status: "active",
      joinDate: new Date().toISOString().split('T')[0],
      phone: "",
      salary: 0
    });
  };

  const handleEditEmployee = (id: number) => {
    const emp = employees.find(e => e.id === id);
    if (emp) {
      setNewEmployee({ ...emp });
      setEditEmployeeId(id);
      setIsAddEmployeeModalOpen(true);
    }
  };

  const handleDeleteEmployee = (id: number) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  return (
    <DashboardLayout role="ceo">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600 mt-1">Manage your organization's employees</p>
          </div>
          <button
            onClick={() => {setIsAddEmployeeModalOpen(true); setEditEmployeeId(null);}}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"
          >
            + Add Employee
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {departments.map(d => <option key={d} value={d}>{d==="all"?"All Departments":d}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="on-leave">On Leave</option>
              <option value="offboarded">Offboarded</option>
            </select>
          </div>
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto bg-white shadow-lg rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["name","role","department","status","email","joinDate","salary"].map(key => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort(key as keyof Employee)}
                  >
                    <div className="flex items-center gap-1">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                      {sortConfig.key === key && <span>{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 text-sm font-bold">
                        {emp.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 text-sm sm:text-base">{emp.name}</span>
                        <span className="text-gray-500 text-xs sm:text-sm">{emp.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-900 text-sm sm:text-base">{emp.role}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">{emp.department}</span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs sm:text-sm ${
                      emp.status==="active"?"bg-green-100 text-green-800":emp.status==="on-leave"?"bg-yellow-100 text-yellow-800":"bg-red-100 text-red-800"
                    }`}>{emp.status.charAt(0).toUpperCase()+emp.status.slice(1)}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-sm">{emp.email}</td>
                  <td className="px-4 py-2 text-gray-500 text-sm">{new Date(emp.joinDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-gray-900 text-sm">${emp.salary.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm flex gap-2">
                    <button className="text-indigo-600 hover:text-indigo-900" onClick={()=>handleEditEmployee(emp.id)}>Edit</button>
                    <button className="text-red-600 hover:text-red-900" onClick={()=>handleDeleteEmployee(emp.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Modal */}
        {isAddEmployeeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{editEmployeeId?"Edit Employee":"Add New Employee"}</h2>
              <div className="space-y-4">
                {["name","role","department","email","phone","salary","status"].map(field=>{
                  if(field==="department"){
                    return <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select value={newEmployee.department} onChange={e=>setNewEmployee({...newEmployee, department:e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="Engineering">Engineering</option>
                        <option value="HR">HR</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                      </select>
                    </div>
                  }
                  if(field==="status"){
                    return <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={newEmployee.status} onChange={e=>setNewEmployee({...newEmployee, status:e.target.value as any})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="active">Active</option>
                        <option value="on-leave">On Leave</option>
                        <option value="offboarded">Offboarded</option>
                      </select>
                    </div>
                  }
                  return <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.charAt(0).toUpperCase()+field.slice(1)}</label>
                    <input type={field==="salary"?"number":"text"} value={newEmployee[field as keyof typeof newEmployee] as any} onChange={e=>setNewEmployee({...newEmployee,[field]:field==="salary"?Number(e.target.value):e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                  </div>
                })}
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={()=>setIsAddEmployeeModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button onClick={handleAddEmployee} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{editEmployeeId?"Save Changes":"Add Employee"}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
