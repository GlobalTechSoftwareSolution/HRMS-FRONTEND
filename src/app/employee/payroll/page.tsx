"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiChevronDown, FiFilter } from "react-icons/fi";

type PayrollAPIItem = {
  month: string;
  year: string | number;
  basic_salary: string | number;
  status: string;
  pay_date: string;
  email: string;
};

type PayrollRecord = {
  id: number;
  month: string;
  basicSalary: number;
  status: "paid" | "pending" | "processing";
  paymentDate: string;
  email: string;
};

export default function PayrollDashboard() {
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [filterYear, setFilterYear] = useState<string>("2025");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayrolls = async () => {
      setLoading(true);
      setError(null);

      try {
        const userEmail = typeof window !== "undefined" ? localStorage.getItem("user_email") : null;
        if (!userEmail) throw new Error("No employee logged in.");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/get_payroll/${encodeURIComponent(userEmail)}/`
        );

        if (!response.ok) throw new Error(`Failed to fetch payrolls: ${response.status}`);

        const data: { payroll?: PayrollAPIItem; payrolls?: PayrollAPIItem[] } = await response.json();

        const normalizeStatus = (status: string) => {
          switch (status.toLowerCase()) {
            case "done":
              return "paid";
            case "pending":
              return "pending";
            case "processing":
              return "processing";
            default:
              return "pending";
          }
        };

        // Convert single object or array to array
        const payrollArray: PayrollAPIItem[] = data.payroll ? [data.payroll] : data.payrolls || [];

        const mappedData: PayrollRecord[] = payrollArray.map((item, index) => ({
          id: index + 1,
          month: `${item.month} ${item.year}`,
          basicSalary: Number(item.basic_salary) || 0,
          status: normalizeStatus(item.status) as "paid" | "pending" | "processing",
          paymentDate: item.pay_date,
          email: item.email,
        }));

        // Filter for logged-in user
        setPayrollData(mappedData.filter((item) => item.email === userEmail));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Error fetching payroll data:", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayrolls();
  }, []);

  const calculateNetPay = (record: PayrollRecord) => record.basicSalary;

  const getStatusBadge = (status: PayrollRecord["status"]) => {
    const statusClasses = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status]}`}>
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

  if (loading)
    return (
      <DashboardLayout role="employee">
        <p className="text-blue-500 font-semibold">⏳ Loading payroll data...</p>
      </DashboardLayout>
    );

  if (error)
    return (
      <DashboardLayout role="employee">
        <p className="text-red-500 font-semibold">❌ {error}</p>
      </DashboardLayout>
    );

  return (
    <DashboardLayout role="employee">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header + Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Payroll Dashboard</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">View your salary history and download payslips</p>
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
                <p className="text-lg sm:text-2xl font-bold text-gray-800 mt-1">{filteredData.length}</p>
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
                <p className="text-lg sm:text-2xl font-bold text-gray-800 mt-1">₹{totalNetPay.toLocaleString()}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <FiTrendingUp className="text-green-600 text-lg sm:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Average Net Pay</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800 mt-1">₹{averageNetPay.toLocaleString()}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <FiTrendingDown className="text-purple-600 text-lg sm:text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Table for desktop */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[700px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Month", "Basic Salary", "Net Pay", "Status", "Payment Date"].map((head) => (
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
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700 font-medium">{record.month}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700">₹{record.basicSalary.toLocaleString()}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-blue-700 font-semibold">
                        ₹{calculateNetPay(record).toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{getStatusBadge(record.status)}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500 text-xs sm:text-sm">{record.paymentDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No payroll records found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cards for mobile */}
          <div className="md:hidden flex flex-col gap-4 p-4">
            {filteredData.length > 0 ? (
              filteredData.map((record) => (
                <div key={record.id} className="bg-gray-50 rounded-xl p-4 shadow-sm">
                  <p>
                    <b>Month:</b> {record.month}
                  </p>
                  <p>
                    <b>Basic Salary:</b> ₹{record.basicSalary.toLocaleString()}
                  </p>
                  <p>
                    <b>Net Pay:</b> ₹{calculateNetPay(record).toLocaleString()}
                  </p>
                  <p>
                    <b>Status:</b> {getStatusBadge(record.status)}
                  </p>
                  <p>
                    <b>Payment Date:</b> {record.paymentDate}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No payroll records found for the selected filters.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
