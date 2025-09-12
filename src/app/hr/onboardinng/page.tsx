"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type PayrollRecord = {
  id: number;
  employeeName: string;
  joinDate: string;
  monthlySalary: number;
  paymentDate: string;
};

export default function HRPayrollDashboard() {
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "ascending" });
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Inside your component, update newEmployee state
const [newEmployee, setNewEmployee] = useState({
  employeeName: "",
  email: "",
  role: "Employee",
  designation: "",
  contactNumber: "",
  address: "",
  joinDate: "",
  monthlySalary: "",
  paymentDate: "",
});

  // Show notification
  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  // Fetch all employees
  const fetchPayroll = async () => {
    try {
      const res = await fetch("/api/payroll");
      const data = await res.json();
      setPayrollData(data);
    } catch (err) {
      console.error("Error fetching payroll data:", err);
      showNotification("Failed to fetch payroll data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  // Handle form input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
  };

  // Add employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmployee),
      });

      if (res.ok) {
        await fetchPayroll(); // refresh list after saving
        setShowForm(false);
        setNewEmployee({ employeeName: "",
  email: "",
  role: "Employee",
  designation: "",
  contactNumber: "",
  address: "",
  joinDate: "",
  monthlySalary: "",
  paymentDate: "", });
        showNotification("Employee onboarded successfully");
      } else {
        console.error("Failed to add employee");
        showNotification("Failed to onboard employee", "error");
      }
    } catch (err) {
      console.error("Error adding employee:", err);
      showNotification("Error onboarding employee", "error");
    }
  };

  // Offboard employee
  const handleOffboard = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to offboard ${name}?`)) return;
    
    try {
      const res = await fetch(`/api/payroll/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPayrollData((prev) => prev.filter((emp) => emp.id !== id));
        showNotification("Employee offboarded successfully");
      } else {
        console.error("Failed to offboard employee");
        showNotification("Failed to offboard employee", "error");
      }
    } catch (err) {
      console.error("Error offboarding employee:", err);
      showNotification("Error offboarding employee", "error");
    }
  };

  // Handle sorting
  const handleSort = (key: string) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let filteredData = payrollData;
    
    if (searchTerm) {
      filteredData = payrollData.filter(employee => 
        employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (sortConfig.key) {
      filteredData = [...filteredData].sort((a, b) => {
        const aVal = (a as any)[sortConfig.key];
        const bVal = (b as any)[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    
    return filteredData;
  }, [payrollData, searchTerm, sortConfig]);

  // Calculate payroll summary
  const payrollSummary = React.useMemo(() => {
    const totalEmployees = payrollData.length;
    const monthlyPayroll = payrollData.reduce((sum, emp) => sum + Number(emp.monthlySalary), 0);
    const annualPayroll = monthlyPayroll * 12;
    return { totalEmployees, monthlyPayroll, annualPayroll };
  }, [payrollData]);

  return (
    <DashboardLayout role="hr">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
          }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">HR Employees Dashboard</h2>
          <p className="text-gray-600">Manage employee payroll, onboarding, and offboarding</p>

          {/* Payroll Summary */}
          <div className="mt-4 flex flex-wrap gap-6">
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Total Employees</p>
              <p className="text-lg font-semibold">{payrollSummary.totalEmployees}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Monthly Payroll</p>
              <p className="text-lg font-semibold">₹{payrollSummary.monthlyPayroll.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Annual Payroll</p>
              <p className="text-lg font-semibold">₹{payrollSummary.annualPayroll.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Onboard Employee
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-gray-500">Loading payroll records...</p>
            </div>
          ) : filteredAndSortedData.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No employees found. {searchTerm && "Try a different search term."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[{ key: "employeeName", label: "Employee" }, { key: "joinDate", label: "Join Date" }, { key: "monthlySalary", label: "Monthly Salary" }, { key: "", label: "Annual Salary" }, { key: "paymentDate", label: "Payment Date" }, { key: "", label: "Actions" }].map(header => (
                      <th
                        key={header.key || header.label}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => header.key && handleSort(header.key)}
                      >
                        <div className="flex items-center">
                          {header.label}
                          {sortConfig.key === header.key && (
                            <svg className={`w-4 h-4 ml-1 ${sortConfig.direction === "ascending" ? "" : "transform rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedData.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                            {record.employeeName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                            <div className="text-sm text-gray-500">ID: {record.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(record.joinDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{Number(record.monthlySalary).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-700">₹{(Number(record.monthlySalary) * 12).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(record.paymentDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => handleOffboard(record.id, record.employeeName)} className="flex items-center text-red-600 hover:text-red-800 transition-colors">
                          Offboard
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Onboarding Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Onboard New Employee</h3>
              </div>
           <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700">Employee Name</label>
    <input
      type="text"
      name="employeeName"
      value={newEmployee.employeeName}
      onChange={handleInputChange}
      required
      placeholder="Enter full name"
      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700">Email</label>
    <input
      type="email"
      name="email"
      value={newEmployee.email}
      onChange={handleInputChange}
      required
      placeholder="Enter email address"
      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700">Role</label>
    <select
      name="role"
      value={newEmployee.role}
      onChange={handleInputChange}
      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
    >
      <option value="HR">HR</option>
      <option value="Manager">Manager</option>
      <option value="Employee">Employee</option>
      <option value="CEO">CEO</option>
    </select>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700">Designation</label>
    <input
      type="text"
      name="designation"
      value={newEmployee.designation}
      onChange={handleInputChange}
      placeholder="Enter designation"
      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
    <input
      type="text"
      name="contactNumber"
      value={newEmployee.contactNumber}
      onChange={handleInputChange}
      placeholder="Enter contact number"
      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700">Address</label>
    <textarea
      name="address"
      value={newEmployee.address}
      onChange={handleInputChange}
      placeholder="Enter address"
      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700">Join Date</label>
    <input
      type="date"
      name="joinDate"
      value={newEmployee.joinDate}
      onChange={handleInputChange}
      required
      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700">Monthly Salary (₹)</label>
    <input
      type="number"
      name="monthlySalary"
      value={newEmployee.monthlySalary}
      onChange={handleInputChange}
      required
      min="0"
      step="0.01"
      placeholder="0.00"
      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700">Payment Date</label>
    <input
      type="date"
      name="paymentDate"
      value={newEmployee.paymentDate}
      onChange={handleInputChange}
      required
      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div className="flex justify-end gap-3 pt-4">
    <button
      type="button"
      onClick={() => setShowForm(false)}
      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
    >
      Cancel
    </button>
    <button
      type="submit"
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Save Employee
    </button>
  </div>
</form>

            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
