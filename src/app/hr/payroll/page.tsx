"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FiChevronDown } from "react-icons/fi";

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
  const [filterYear, setFilterYear] = useState<string>("2025");

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const res = await fetch("/api/payroll"); // 👈 replace with your backend endpoint
        const data = await res.json();
        setPayrollData(data);
      } catch (err) {
        console.error("Error fetching payroll data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, []);

  const filteredData = payrollData.filter((record) =>
    record.paymentDate.includes(filterYear)
  );

  return (
    <DashboardLayout role="hr">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header + Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              HR Payroll Dashboard
            </h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              View payroll details for employees
            </p>
          </div>
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
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <p className="text-center py-6 text-gray-500">
              Loading payroll records...
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Employee",
                      "Join Date",
                      "Monthly Salary",
                      "Annual Salary",
                      "Payment Date",
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
                          {record.employeeName}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700">
                          {record.joinDate}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700">
                          ₹{record.monthlySalary.toLocaleString()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-blue-700 font-semibold">
                          ₹{(record.monthlySalary * 12).toLocaleString()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500 text-xs sm:text-sm">
                          {record.paymentDate}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500 text-sm"
                      >
                        No payroll records found for the selected year.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
