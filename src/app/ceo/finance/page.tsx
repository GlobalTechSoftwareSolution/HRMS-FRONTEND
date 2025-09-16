"use client";

import React, { useEffect, useState } from "react";
import { 
  FiArrowUp, 
  FiArrowDown, 
  FiTrendingUp, 
  FiDownload,
  FiSearch,
  FiFilter,
  FiDollarSign,
  FiUsers,
  FiCalendar
} from "react-icons/fi";
import DashboardLayout from "@/components/DashboardLayout";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface FinanceData {
  totalPayroll: number;
  salaryCredited: number;
  salaryPending: number;
  monthlyTrend: number[];
  departmentDistribution: { [key: string]: number };
}

interface Employee {
  id: number;
  name: string;
  department: string;
  salary: number;
  status: "Credited" | "Pending";
  date: string;
}

const FinanceDashboard: React.FC = () => {
  const [financeData, setFinanceData] = useState<FinanceData>({
    totalPayroll: 0,
    salaryCredited: 0,
    salaryPending: 0,
    monthlyTrend: [42000, 45000, 48000, 52000, 55000, 58000],
    departmentDistribution: {
      "Engineering": 45,
      "HR": 20,
      "Sales": 25,
      "Marketing": 10
    }
  });

  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: "John Doe", department: "Engineering", salary: 50000, status: "Credited", date: "2023-05-15" },
    { id: 2, name: "Jane Smith", department: "HR", salary: 40000, status: "Pending", date: "2023-05-15" },
    { id: 3, name: "David Lee", department: "Management", salary: 70000, status: "Credited", date: "2023-05-15" },
    { id: 4, name: "Anita Rao", department: "Sales", salary: 45000, status: "Pending", date: "2023-05-15" },
    { id: 5, name: "Mike Johnson", department: "Engineering", salary: 55000, status: "Credited", date: "2023-05-15" },
    { id: 6, name: "Sarah Williams", department: "Marketing", salary: 48000, status: "Credited", date: "2023-05-15" },
    { id: 7, name: "Robert Brown", department: "Sales", salary: 52000, status: "Pending", date: "2023-05-15" },
    { id: 8, name: "Emily Chen", department: "HR", salary: 42000, status: "Credited", date: "2023-05-15" },
  ]);

  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(employees);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  // Simulate Finance Data
  useEffect(() => {
    const fetchFinance = () => {
      const salaryBatch = 50000 + Math.floor(Math.random() * 50000);
      const credited = salaryBatch * 0.7;
      const pending = salaryBatch - credited;

      setFinanceData(prev => ({
        ...prev,
        totalPayroll: prev.totalPayroll + salaryBatch,
        salaryCredited: prev.salaryCredited + credited,
        salaryPending: prev.salaryPending + pending,
      }));
    };

    fetchFinance();
    const interval = setInterval(fetchFinance, 10000); // every 10s
    return () => clearInterval(interval);
  }, []);

  // Filter employees based on search and filters
  useEffect(() => {
    let result = employees;
    
    if (searchTerm) {
      result = result.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "All") {
      result = result.filter(emp => emp.status === statusFilter);
    }
    
    if (departmentFilter !== "All") {
      result = result.filter(emp => emp.department === departmentFilter);
    }
    
    setFilteredEmployees(result);
  }, [searchTerm, statusFilter, departmentFilter, employees]);

  // Prepare data for charts
  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Payroll (in ₹)',
        data: financeData.monthlyTrend,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const pieChartData = {
    labels: Object.keys(financeData.departmentDistribution),
    datasets: [
      {
        data: Object.values(financeData.departmentDistribution),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const departments = ["All", ...new Set(employees.map(emp => emp.department))];
  const statuses = ["All", "Credited", "Pending"];

  return (
    <DashboardLayout role='ceo'>
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Finance Dashboard</h1>

        {/* Finance Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            {
              label: "Total Payroll",
              value: `₹${financeData.totalPayroll.toLocaleString()}`,
              icon: <FiTrendingUp className="text-green-500 text-xl" />,
              change: "+12%",
              changeType: "positive",
              bg: "bg-green-50",
            },
            {
              label: "Salary Credited",
              value: `₹${financeData.salaryCredited.toLocaleString()}`,
              icon: <FiArrowUp className="text-blue-500 text-xl" />,
              change: "+8%",
              changeType: "positive",
              bg: "bg-blue-50",
            },
            {
              label: "Salary Pending",
              value: `₹${financeData.salaryPending.toLocaleString()}`,
              icon: <FiArrowDown className="text-red-500 text-xl" />,
              change: "-3%",
              changeType: "negative",
              bg: "bg-red-50",
            },
            {
              label: "Employees",
              value: employees.length.toString(),
              icon: <FiUsers className="text-purple-500 text-xl" />,
              change: "+5%",
              changeType: "positive",
              bg: "bg-purple-50",
            },
          ].map((item, index) => (
            <div
              key={index}
              className={`p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 ${item.bg}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{item.label}</p>
                  <p className="text-xl font-bold text-gray-800">{item.value}</p>
                  <div className={`flex items-center mt-1 text-sm ${item.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                    {item.changeType === "positive" ? 
                      <FiArrowUp className="mr-1" /> : <FiArrowDown className="mr-1" />}
                    <span>{item.change}</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-full shadow">{item.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Payroll Trend (Last 6 Months)</h2>
            <Bar data={barChartData} options={chartOptions} />
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Department Distribution</h2>
            <div className="h-64 flex items-center justify-center">
              <Pie data={pieChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Salary Status Table */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Salary Status</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <button className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                <FiDownload className="text-sm" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Salary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                    <td className="px-4 py-3">{emp.department}</td>
                    <td className="px-4 py-3">₹{emp.salary.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          emp.status === "Credited"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{emp.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No employees match your search criteria
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {filteredEmployees.length} of {employees.length} employees
            </div>
            
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50">
                Previous
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FinanceDashboard;