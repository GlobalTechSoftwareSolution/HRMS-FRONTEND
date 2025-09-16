"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  FiFileText, 
  FiDownload, 
  FiFilter, 
  FiSearch, 
  FiEye, 
  FiMoreVertical,
  FiChevronDown,
  FiPlus,
  FiRefreshCw
} from "react-icons/fi";
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type Report = {
  id: number;
  title: string;
  date: string;
  status: "completed" | "pending" | "in-review";
  department: string;
  type: string;
  size: string;
};

type FilterOptions = {
  status: string;
  department: string;
  dateRange: string;
  type: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    department: "all",
    dateRange: "all",
    type: "all"
  });

  // Simulate data fetching
  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      setTimeout(() => {
        const mockReports: Report[] = [
          { id: 1, title: "Q1 Financial Report", date: "2025-03-31", status: "completed", department: "Finance", type: "Financial", size: "2.4 MB" },
          { id: 2, title: "Employee Attendance Summary", date: "2025-03-31", status: "pending", department: "HR", type: "HR", size: "1.2 MB" },
          { id: 3, title: "Payroll Overview March", date: "2025-03-31", status: "completed", department: "Finance", type: "Payroll", size: "3.1 MB" },
          { id: 4, title: "Marketing Campaign Analysis", date: "2025-03-28", status: "in-review", department: "Marketing", type: "Marketing", size: "4.5 MB" },
          { id: 5, title: "IT Infrastructure Report", date: "2025-03-25", status: "completed", department: "IT", type: "Technical", size: "5.2 MB" },
          { id: 6, title: "Sales Performance Q1", date: "2025-03-20", status: "pending", department: "Sales", type: "Sales", size: "2.8 MB" },
          { id: 7, title: "Customer Satisfaction Survey", date: "2025-03-18", status: "completed", department: "Customer Service", type: "Research", size: "3.7 MB" },
          { id: 8, title: "Product Development Update", date: "2025-03-15", status: "in-review", department: "R&D", type: "Technical", size: "6.1 MB" },
        ];
        setReports(mockReports);
        setFilteredReports(mockReports);
        setIsLoading(false);
      }, 1000);
    };
    fetchData();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = reports;
    
    // Search filter
    if (searchQuery) {
      result = result.filter(report => 
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Status filter
    if (filters.status !== "all") {
      result = result.filter(report => report.status === filters.status);
    }
    // Department filter
    if (filters.department !== "all") {
      result = result.filter(report => report.department === filters.department);
    }
    // Type filter
    if (filters.type !== "all") {
      result = result.filter(report => report.type === filters.type);
    }
    // Date filter (simplified)
    if (filters.dateRange !== "all") {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      result = result.filter(report => {
        const reportDate = new Date(report.date);
        if (filters.dateRange === "week") return reportDate >= lastWeek;
        if (filters.dateRange === "month") return reportDate >= lastMonth;
        return true;
      });
    }
    setFilteredReports(result);
  }, [searchQuery, filters, reports]);

  const getStatusBadge = (status: string) => {
    const classes = { 
      completed: "bg-green-100 text-green-800", 
      pending: "bg-yellow-100 text-yellow-800",
      "in-review": "bg-blue-100 text-blue-800"
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status as keyof typeof classes]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleFilterChange = (filterType: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const resetFilters = () => {
    setFilters({ status: "all", department: "all", dateRange: "all", type: "all" });
    setSearchQuery("");
  };

  // Chart data
  const statusChartData = {
    labels: ['Completed', 'Pending', 'In Review'],
    datasets: [{
      data: [
        reports.filter(r => r.status === 'completed').length,
        reports.filter(r => r.status === 'pending').length,
        reports.filter(r => r.status === 'in-review').length
      ],
      backgroundColor: ['rgba(75, 192, 192, 0.7)','rgba(255, 205, 86, 0.7)','rgba(54, 162, 235, 0.7)'],
      borderWidth: 1,
    }],
  };

  const departmentChartData = {
    labels: Array.from(new Set(reports.map(r => r.department))),
    datasets: [{
      label: 'Reports by Department',
      data: Array.from(new Set(reports.map(r => r.department))).map(
        dept => reports.filter(r => r.department === dept).length
      ),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgb(54, 162, 235)',
      borderWidth: 2,
    }],
  };

  const statusChartOptions = { responsive: true, plugins: { legend: { position: 'bottom' as const } } };
  const departmentChartOptions = { 
    responsive: true, 
    plugins: { legend: { position: 'bottom' as const } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } 
  };

  const departments = Array.from(new Set(reports.map(r => r.department)));
  const types = Array.from(new Set(reports.map(r => r.type)));

  return (
    <DashboardLayout role="ceo">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
            <p className="text-gray-600">Manage and review all company reports</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <FiPlus className="text-lg" />
            <span>Generate Report</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { label: "Total Reports", value: reports.length, icon: FiFileText, color: "blue" },
            { label: "Completed", value: reports.filter(r => r.status === 'completed').length, icon: FiFileText, color: "green" },
            { label: "Pending Review", value: reports.filter(r => r.status === 'pending' || r.status === 'in-review').length, icon: FiFileText, color: "yellow" },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center`}>
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                <stat.icon className={`text-${stat.color}-500 text-xl`} />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Report Status Distribution</h2>
            <div className="h-64 md:h-72">
              <Doughnut data={statusChartData} options={statusChartOptions} />
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Reports by Department</h2>
            <div className="h-64 md:h-72">
              <Bar data={departmentChartData} options={departmentChartOptions} />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="relative flex-1">
              <FiSearch className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reports..."
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter />
                <span>Filters</span>
                {Object.values(filters).some(f => f !== "all") && (
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {Object.values(filters).filter(f => f !== "all").length}
                  </span>
                )}
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={resetFilters}
              >
                <FiRefreshCw />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="in-review">In Review</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.department} onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  {types.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.dateRange} onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="month">Last Month</option>
                  <option value="week">Last Week</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Reports Table */}
        <div className="bg-white shadow-md rounded-xl overflow-x-auto md:overflow-x-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
            <h2 className="text-lg font-semibold text-gray-800">All Reports</h2>
            <span className="text-sm text-gray-500">
              Showing {filteredReports.length} of {reports.length} reports
            </span>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading reports...</span>
              </div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-8 text-center">
              <FiFileText className="mx-auto text-4xl text-gray-300 mb-2" />
              <p className="text-gray-500">No reports found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Title", "Department", "Type", "Date", "Size", "Status"].map((head) => (
                      <th key={head} className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap font-medium text-gray-900">{report.title}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-gray-600">{report.department}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-gray-600">{report.type}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-gray-600">{report.date}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-gray-600">{report.size}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">{getStatusBadge(report.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
