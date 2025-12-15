"use client";

import React, { useEffect, useState } from "react";
import { 
  FiArrowUp, 
  FiArrowDown, 
  FiTrendingUp,
  FiUsers
} from "react-icons/fi";
import DashboardLayout from "@/components/DashboardLayout";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Interface for payroll employees (from payroll API)
interface PayrollEmployee {
  id: number;
  email: string;
  salary: number;
  status: "Credited" | "Pending" | "Paid";
  date: string;
  department: string;
  name: string;
}

// Interface for employees (from employee API)
interface Employee {
  id: number;
  email: string;
  fullname?: string;
  name: string;
  department: string;
  role?: string;
  status?: string;
  joinDate?: string;
  salary?: number;
  picture?: string;
}

interface PayrollItem {
  email: string;
  basic_salary: string;
  month: string;
  year: number;
  status: "Paid" | "Pending";
  pay_date: string;
}

interface ApiResponse {
  payrolls: PayrollItem[];
}

const FinanceDashboard: React.FC = () => {
  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // const [payrollEmployees, setPayrollEmployees] = useState<PayrollEmployee[]>([]); // Unused state variable
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [financeData, setFinanceData] = useState({
    totalPayroll: 0,
    salaryCredited: 0,
    salaryPending: 0,
    monthlyTrend: [0, 0, 0, 0, 0, 0],
    departmentDistribution: {} as Record<string, number>,
    formattedTotalPayroll: '₹0',
    formattedSalaryCredited: '₹0',
    formattedSalaryPending: '₹0',
  });

  const [thisMonthPayroll, setThisMonthPayroll] = useState<PayrollEmployee[]>([]);
  const [previousMonthPayroll, setPreviousMonthPayroll] = useState<PayrollEmployee[]>([]);

  // --------------------- FETCH PAYROLL ---------------------
  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_payrolls/`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data: ApiResponse = await res.json();
        const payrolls: PayrollItem[] = data.payrolls || [];

        // Map the API response to Employee interface
        const mapped: PayrollEmployee[] = payrolls.map((item, idx) => ({
          id: idx + 1,
          email: item.email,
          name: item.email.split("@")[0], // Use email prefix as name
          salary: Number(item.basic_salary),
          status: item.status === "Paid" ? "Credited" : "Pending", // Map "Paid" to "Credited"
          date: item.pay_date,
          department: "General" // Default department since it's not in API
        }));

// setPayrollEmployees(mapped); // Commented out unused state setter

        // --------------------- FINANCE CALCULATIONS ---------------------
        const totalPayroll = mapped.reduce((acc, emp) => acc + emp.salary, 0);
        const salaryCredited = mapped
          .filter(emp => emp.status === "Credited")
          .reduce((acc, emp) => acc + emp.salary, 0);
        const salaryPending = totalPayroll - salaryCredited;

        // Monthly trend calculation based on pay_date
        const monthlyTrend: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        mapped.forEach(emp => {
          const month = new Date(emp.date).getMonth();
          monthlyTrend[month] += emp.salary;
        });

        // Get last 6 months for trend
        const currentMonth = new Date().getMonth();
        const lastSixMonths = [];
        for (let i = 5; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12;
          lastSixMonths.push(monthlyTrend[monthIndex]);
        }

        const deptDist: Record<string, number> = {};
        mapped.forEach(emp => {
          if (!deptDist[emp.department]) deptDist[emp.department] = 0;
          deptDist[emp.department] += emp.salary;
        });

        setFinanceData({
          totalPayroll,
          salaryCredited,
          salaryPending,
          monthlyTrend: lastSixMonths,
          departmentDistribution: deptDist,
          formattedTotalPayroll: totalPayroll.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
          formattedSalaryCredited: salaryCredited.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
          formattedSalaryPending: salaryPending.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
        });

        // --------------------- SPLIT PAYROLLS BY MONTH ---------------------
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonth = prevMonthDate.getMonth();
        const prevYear = prevMonthDate.getFullYear();

        const thisMonthPayrolls = mapped.filter(emp => {
          const d = new Date(emp.date);
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });

        const previousMonthPayrolls = mapped.filter(emp => {
          const d = new Date(emp.date);
          return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
        });

        setThisMonthPayroll(thisMonthPayrolls);
        setPreviousMonthPayroll(previousMonthPayrolls);

      } catch (err) {
        console.error("❌ Failed to fetch payroll:", err);
      }
    };

    fetchPayroll();
  }, []);

  // --------------------- FETCH EMPLOYEES ---------------------
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        const employeesArray: Employee[] = Array.isArray(data) ? data : (data.employees || data.data || []);
        
        // Map the API response to Employee interface
        const mapped: Employee[] = employeesArray.map((item: Employee, idx: number) => ({
          id: item.id || idx + 1,
          email: item.email || '',
          name: item.fullname || item.name || (item.email ? item.email.split("@")[0] : 'Unknown'),
          fullname: item.fullname || item.name || '',
          department: item.department || 'General',
          role: item.role || 'Employee',
          status: item.status || 'active',
          joinDate: item.joinDate || '',
          salary: item.salary || 0,
          picture: item.picture || ''
        }));

        setEmployees(mapped);
      } catch (err) {
        console.error("❌ Failed to fetch employees:", err);
      }
    };

    fetchEmployees();
  }, []);

  // Helper component to render payroll table and cards
  const PayrollSection: React.FC<{title: string; payrolls: PayrollEmployee[]}> = ({title, payrolls}) => (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-100 mb-8">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{title}</h2>

      {payrolls.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No payroll records found for this period.</p>
      ) : (
        <>
          {/* Responsive Table */}
          <div className="overflow-x-auto hidden sm:block">
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
                {payrolls.map(emp => (
                  <tr key={emp.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                    <td className="px-4 py-3">{emp.department}</td>
                    <td className="px-4 py-3">{emp.salary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${emp.status === "Credited" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(emp.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards for small devices */}
          <div className="sm:hidden flex flex-col gap-4">
            {payrolls.map(emp => (
              <div key={emp.id} className="p-4 rounded-xl shadow-md border border-gray-200 bg-white">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">{emp.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${emp.status === "Credited" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                    {emp.status}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">Department: {emp.department}</p>
                <p className="text-gray-500 text-sm">Salary: {emp.salary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                <p className="text-gray-500 text-sm">Date: {formatDate(emp.date)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <DashboardLayout role='ceo'>
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">

        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Finance Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[ 
            { label: "Total Payroll", value: financeData.formattedTotalPayroll, icon: <FiTrendingUp className="text-green-500 text-2xl"/>, bg: "bg-green-50" },
            { label: "Salary Credited", value: financeData.formattedSalaryCredited, icon: <FiArrowUp className="text-blue-500 text-2xl"/>, bg: "bg-blue-50" },
            { label: "Salary Pending", value: financeData.formattedSalaryPending, icon: <FiArrowDown className="text-red-500 text-2xl"/>, bg: "bg-red-50" },
            { label: "Employees", value: employees.length.toString(), icon: <FiUsers className="text-purple-500 text-2xl"/>, bg: "bg-purple-50" }
          ].map((item, idx) => (
            <div key={idx} className={`p-4 sm:p-6 rounded-xl shadow-md border ${item.bg} flex justify-between items-center`}>
              <div>
                <p className="text-sm sm:text-base text-gray-600">{item.label}</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{item.value}</p>
              </div>
              <div className="p-3 bg-white rounded-full shadow">{item.icon}</div>
            </div>
          ))}
        </div>

        {/* This Month Payroll Section */}
        <PayrollSection title="This Month Payroll" payrolls={thisMonthPayroll} />

        {/* Previous Month Payroll Section */}
        <PayrollSection title="Previous Month Payroll" payrolls={previousMonthPayroll} />

      </div>
    </DashboardLayout>
  );
};

export default FinanceDashboard;