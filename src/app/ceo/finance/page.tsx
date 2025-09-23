"use client";

import React, { useEffect, useState } from "react";
import { 
  FiArrowUp, 
  FiArrowDown, 
  FiTrendingUp,
  FiSearch,
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

interface Employee {
  id: number;
  email: string;
  salary: number;
  status: "Credited" | "Pending";
  date: string;
  department: string;
  name: string;
}

interface PayrollItem {
  id?: number;
  email?: string;
  name?: string;
  net_salary?: number;
  salary?: number;
  status?: "Credited" | "Pending";
  pay_date?: string;
  date?: string;
  department?: string;
}

const FinanceDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const [financeData, setFinanceData] = useState({
    totalPayroll: 0,
    salaryCredited: 0,
    salaryPending: 0,
    monthlyTrend: [0, 0, 0, 0, 0, 0],
    departmentDistribution: {} as Record<string, number>
  });

  // --------------------- FETCH PAYROLL ---------------------
  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_payrolls/`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data: PayrollItem[] | { results?: PayrollItem[]; payrolls?: PayrollItem[] } = await res.json();

        const payrolls: PayrollItem[] = Array.isArray(data)
          ? data
          : data.results || data.payrolls || [];

        const mapped: Employee[] = payrolls.map((item, idx) => ({
          id: item.id ?? idx + 1,
          email: item.email ?? `employee${idx + 1}@company.com`,
          name: item.name ?? (item.email ? item.email.split("@")[0] : `Employee ${idx + 1}`),
          salary: item.net_salary ?? item.salary ?? 0,
          status: item.status ?? ((item.net_salary ?? item.salary ?? 0) > 0 ? "Credited" : "Pending"),
          date: item.pay_date ?? item.date ?? new Date().toISOString(),
          department: item.department ?? "General"
        }));

        setEmployees(mapped);
        setFilteredEmployees(mapped);

        // Finance calculations
        const totalPayroll = mapped.reduce((acc, emp) => acc + emp.salary, 0);
        const salaryCredited = mapped.filter(emp => emp.status === "Credited").reduce((acc, emp) => acc + emp.salary, 0);
        const salaryPending = totalPayroll - salaryCredited;

        const monthlyTrend: number[] = [0, 0, 0, 0, 0, 0];
        mapped.forEach(emp => {
          const month = new Date(emp.date).getMonth();
          if (month < 6) monthlyTrend[month] += emp.salary;
        });

        const deptDist: Record<string, number> = {};
        mapped.forEach(emp => {
          if (!deptDist[emp.department]) deptDist[emp.department] = 0;
          deptDist[emp.department] += emp.salary;
        });

        setFinanceData({
          totalPayroll,
          salaryCredited,
          salaryPending,
          monthlyTrend,
          departmentDistribution: deptDist
        });

      } catch (err) {
        console.error("❌ Failed to fetch payroll:", err);
      }
    };

    fetchPayroll();
  }, []);

  // --------------------- FILTER ---------------------
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

  const departments = ["All", ...Array.from(new Set(employees.map(emp => emp.department)))];
  const statuses = ["All", "Credited", "Pending"];

  return (
    <DashboardLayout role='ceo'>
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">

        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Finance Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            { label: "Total Payroll", value: `₹${financeData.totalPayroll.toLocaleString()}`, icon: <FiTrendingUp className="text-green-500 text-2xl"/>, bg: "bg-green-50" },
            { label: "Salary Credited", value: `₹${financeData.salaryCredited.toLocaleString()}`, icon: <FiArrowUp className="text-blue-500 text-2xl"/>, bg: "bg-blue-50" },
            { label: "Salary Pending", value: `₹${financeData.salaryPending.toLocaleString()}`, icon: <FiArrowDown className="text-red-500 text-2xl"/>, bg: "bg-red-50" },
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

        {/* Salary Table / Cards for Small Devices */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Salary Status</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
                <input type="text" placeholder="Search employees..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)}/>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={departmentFilter} onChange={(e)=>setDepartmentFilter(e.target.value)}>
                  {departments.map(d=> <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
                  {statuses.map(s=> <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

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
                {filteredEmployees.map(emp=>(
                  <tr key={emp.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                    <td className="px-4 py-3">{emp.department}</td>
                    <td className="px-4 py-3">₹{emp.salary.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${emp.status==="Credited"?"bg-green-100 text-green-600":"bg-red-100 text-red-600"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(emp.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards for small devices */}
          <div className="sm:hidden flex flex-col gap-4">
            {filteredEmployees.map(emp=>(
              <div key={emp.id} className="p-4 rounded-xl shadow-md border border-gray-200 bg-white">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">{emp.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${emp.status==="Credited"?"bg-green-100 text-green-600":"bg-red-100 text-red-600"}`}>
                    {emp.status}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">Department: {emp.department}</p>
                <p className="text-gray-500 text-sm">Salary: ₹{emp.salary.toLocaleString()}</p>
                <p className="text-gray-500 text-sm">Date: {new Date(emp.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FinanceDashboard;
