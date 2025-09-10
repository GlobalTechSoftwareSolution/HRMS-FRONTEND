"use client";
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FiDownload,
  FiFilter,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiChevronDown,
} from "react-icons/fi";

type PayrollRecord = {
  id: number;
  month: string;
  basicSalary: number;
  status: "paid" | "pending" | "processing";
  paymentDate: string;
};

export default function PayrollDashboard() {
  const [payrollData] = useState<PayrollRecord[]>([
    { id: 1, month: "January 2025", basicSalary: 50000, status: "paid", paymentDate: "Jan 31, 2025" },
    { id: 2, month: "February 2025", basicSalary: 50000,  status: "paid", paymentDate: "Feb 28, 2025" },
    { id: 3, month: "March 2025", basicSalary: 50000, status: "processing", paymentDate: "Mar 31, 2025" },
    { id: 4, month: "April 2025", basicSalary: 52000,  status: "pending", paymentDate: "Apr 30, 2025" },
  ]);

  const [filterYear, setFilterYear] = useState<string>("2025");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const calculateNetPay = (record: PayrollRecord) =>
    record.basicSalary; // Simplified for demo; add bonuses/deductions as needed

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredData = payrollData.filter((record) => {
    const matchesYear = record.month.includes(filterYear);
    const matchesStatus =
      filterStatus === "all" || record.status === filterStatus;
    return matchesYear && matchesStatus;
  });

  const totalNetPay = filteredData.reduce(
    (acc, rec) => acc + calculateNetPay(rec),
    0
  );
  const averageNetPay =
    filteredData.length > 0 ? totalNetPay / filteredData.length : 0;

  const handleDownloadPayslip = (record: PayrollRecord) => {
    console.log(`Downloading payslip for ${record.month}`);
    alert(`Downloading payslip for ${record.month}`);
  };

  return (
    <DashboardLayout role="employee">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header + Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Payroll Dashboard
            </h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              View your salary history and download payslips
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
              <FiChevronDown className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
              </select>
              <FiFilter className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Total Records</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800 mt-1">
                  {filteredData.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <FiDollarSign className="text-blue-600 text-lg sm:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Total Net Pay</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800 mt-1">
                  ₹{totalNetPay.toLocaleString()}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <FiTrendingUp className="text-green-600 text-lg sm:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Average Net Pay
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800 mt-1">
                  ₹{averageNetPay.toLocaleString()}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <FiTrendingDown className="text-purple-600 text-lg sm:text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Month",
                    "Basic Salary",
                    "Net Pay",
                    "Status",
                    "Payment Date"
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                        {record.month}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700">
                        ₹{record.basicSalary.toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-blue-700 font-semibold">
                        ₹{calculateNetPay(record).toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500 text-xs sm:text-sm">
                        {record.paymentDate}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500 text-sm"
                    >
                      No payroll records found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        {filteredData.length > 0 && (
          <div className="mt-6 p-4 sm:p-6 bg-gray-50 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-medium text-gray-700 text-sm sm:text-base">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredData.length}
              </span>{" "}
              records for {filterYear}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm sm:text-base">
              <p className="font-medium text-gray-700">
                Total Net Pay:{" "}
                <span className="font-semibold text-blue-700">
                  ₹{totalNetPay.toLocaleString()}
                </span>
              </p>
              <p className="font-medium text-gray-700">
                Average Monthly:{" "}
                <span className="font-semibold text-green-700">
                  ₹{averageNetPay.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* Mobile-first responsive styles */
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          .filter-controls {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .filter-select {
            width: 100%;
          }
          
          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
        
        @media (max-width: 768px) {
          .table-container {
            border-radius: 0.5rem;
            overflow: hidden;
          }
          
          .table-header {
            font-size: 0.7rem;
          }
          
          .table-cell {
            padding: 0.5rem;
            font-size: 0.75rem;
          }
          
          .summary-panel {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }
          
          .stat-card {
            padding: 1rem;
          }
          
          .stat-icon {
            padding: 0.5rem;
          }
        }
        
        @media (max-width: 1024px) {
          .header-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          .filter-wrapper {
            flex-wrap: wrap;
          }
        }
        
        @media (min-width: 640px) and (max-width: 1023px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        /* Extra small devices (phones, 320px and down) */
        @media (max-width: 320px) {
          .container-padding {
            padding: 0.5rem;
          }
          
          .stat-card {
            padding: 0.75rem;
          }
          
          .stat-value {
            font-size: 1.125rem;
          }
        }
        
        /* Print styles */
        @media print {
          .no-print {
            display: none;
          }
          
          .table-container {
            overflow: visible;
          }
          
          table {
            width: 100%;
            font-size: 12px;
          }
          
          .stat-card {
            border: 1px solid #000;
            page-break-inside: avoid;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .stat-card {
            border-width: 2px;
          }
          
          .table-row:hover {
            outline: 2px solid currentColor;
          }
          
          .filter-select {
            border-width: 2px;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .table-row {
            transition: none;
          }
          
          .stat-card {
            transition: none;
          }
          
          .hover-effects {
            transition: none;
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .stat-card {
            background-color: #1f2937;
            border-color: #374151;
            color: #f9fafb;
          }
          
          .table-container {
            background-color: #1f2937;
            color: #f9fafb;
          }
          
          .table-header {
            background-color: #111827;
            color: #d1d5db;
          }
          
          .table-row {
            background-color: #1f2937;
            color: #f9fafb;
          }
          
          .table-row:hover {
            background-color: #374151;
          }
          
          .summary-panel {
            background-color: #111827;
            color: #d1d5db;
          }
          
          .filter-select {
            background-color: #1f2937;
            border-color: #374151;
            color: #f9fafb;
          }
        }
        
        /* Large desktop screens */
        @media (min-width: 1536px) {
          .container-max-width {
            max-width: 1280px;
          }
        }
        
        /* Landscape orientation for mobile */
        @media (max-height: 500px) and (orientation: landscape) {
          .container-padding {
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
          
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
          }
          
          .stat-card {
            padding: 0.75rem;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}