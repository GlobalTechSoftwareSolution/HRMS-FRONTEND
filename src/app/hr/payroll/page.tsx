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
  employeeName: string;
  month: string;
  basicSalary: number;
  status: "paid" | "pending" | "processing";
  paymentDate: string;
};

export default function HRPayrollDashboard() {
  const [payrollData] = useState<PayrollRecord[]>([
    { id: 1, employeeName: "Sharan Patil", month: "January 2025", basicSalary: 50000, status: "paid", paymentDate: "Jan 31, 2025" },
    { id: 2, employeeName: "Mani Bharadwaj", month: "February 2025", basicSalary: 50000, status: "paid", paymentDate: "Feb 28, 2025" },
    { id: 3, employeeName: "John Doe", month: "March 2025", basicSalary: 50000, status: "processing", paymentDate: "Mar 31, 2025" },
    { id: 4, employeeName: "Jane Smith", month: "April 2025", basicSalary: 52000, status: "pending", paymentDate: "Apr 30, 2025" },
  ]);

  const [filterYear, setFilterYear] = useState<string>("2025");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const calculateNetPay = (record: PayrollRecord) => record.basicSalary;

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
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;
    return matchesYear && matchesStatus;
  });

  const totalNetPay = filteredData.reduce((acc, rec) => acc + calculateNetPay(rec), 0);
  const averageNetPay = filteredData.length > 0 ? totalNetPay / filteredData.length : 0;

  const handleDownloadPayslip = (record: PayrollRecord) => {
    console.log(`Downloading payslip for ${record.employeeName} - ${record.month}`);
    alert(`Downloading payslip for ${record.employeeName} - ${record.month}`);
  };

  return (
    <DashboardLayout role="hr">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header + Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">HR Payroll Dashboard</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              View payroll for all employees and download payslips
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

        {/* Payroll Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Employee", "Month", "Basic Salary", "Net Pay", "Status", "Payment Date"].map((head) => (
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
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                        {record.employeeName}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700">{record.month}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700">
                        ₹{record.basicSalary.toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-blue-700 font-semibold">
                        ₹{calculateNetPay(record).toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{getStatusBadge(record.status)}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500 text-xs sm:text-sm">{record.paymentDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No payroll records found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
