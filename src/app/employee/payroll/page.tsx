"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FiDollarSign,
  FiTrendingUp,
  FiChevronDown,
  FiFilter,
} from "react-icons/fi";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type PayrollAPIItem = {
  email: string;
  basic_salary: string;
  STD: number;
  LOP: number;
  month: string;
  year: number;
  status: string;
  pay_date: string;
};

type PayrollRecord = {
  id: number;
  month: string;
  basicSalary: number;
  stdDays: number;
  lopDays: number;
  status: "paid" | "pending" | "processing";
  paymentDate: string;
  email: string;
  netPay: number;
};

type EmployeeData = {
  email: string;
  fullname: string;
  phone: string;
  department: string;
  designation: string;
  date_joined: string;
  emp_id: string;
  work_location: string;
  team: string;
  blood_group: string;
  reports_to: string;
  account_number: string;
  father_name: string;
  father_contact: string;
  mother_name: string;
  mother_contact: string;
  wife_name: string;
  home_address: string;
  bank_name: string;
  branch: string;
  pf_no: string;
  pf_uan: string;
  ifsc: string;
  languages: string;
};

type AttendanceData = {
  present_days?: number;
  absent_days?: number;
  total_days?: number;
};

type PayslipData = {
  companyName: string;
  logoUrl?: string | null;
  period: string;
  employeeName: string;
  employeeId: string;
  bank?: string;
  bankAccount?: string;
  doj?: string;
  lopDays?: number;
  pfNumber?: string;
  stdDays?: number;
  location?: string;
  workedDays?: number;
  department?: string;
  managementLevel?: string;
  facility?: string;
  entity?: string;
  pfUan?: string;
  ifsc?: string;
  branch?: string;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
};

export default function PayrollDashboard() {
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [filterYear, setFilterYear] = useState<string>("2025");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const userEmail = typeof window !== "undefined"
          ? (localStorage.getItem("user_email") as string | null)
          : null;
        
        if (!userEmail) throw new Error("No employee logged in.");

        // Fetch employee data
        const employeeResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(userEmail)}/`
        );

        if (!employeeResponse.ok) {
          throw new Error("Failed to fetch employee data");
        }

        const employeeData = await employeeResponse.json();
        setEmployeeData(employeeData);

        // Fetch attendance data for STD days
        let presentDays = 0;
        let absentDays = 0;
        
        try {
          const attendanceResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/get_attendance/${encodeURIComponent(userEmail)}/`
          );
          
          if (attendanceResponse.ok) {
            const attendanceData = await attendanceResponse.json();
            setAttendanceData(attendanceData);
            
            // Extract present days from attendance data
            if (attendanceData && typeof attendanceData === 'object') {
              presentDays = attendanceData.present_days || attendanceData.total_days || 0;
            } else if (Array.isArray(attendanceData)) {
              presentDays = attendanceData.length;
            }
          }
        } catch (attendanceErr) {
          console.warn("Failed to fetch attendance data:", attendanceErr);
        }

        // Fetch absent data for LOP days
        try {
          const absentResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/get_absent/${encodeURIComponent(userEmail)}/`
          );
          
          if (absentResponse.ok) {
            const absentData = await absentResponse.json();
            // If absentData is an array, count the days, if it's an object with count, use that
            if (Array.isArray(absentData)) {
              absentDays = absentData.length;
            } else if (absentData && typeof absentData === 'object') {
              absentDays = absentData.absent_days || absentData.count || 0;
            }
          }
        } catch (absentErr) {
          console.warn("Failed to fetch absent data:", absentErr);
        }

        // Fetch payroll data
        const payrollResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/get_payroll/${encodeURIComponent(userEmail)}/`
        );

        if (!payrollResponse.ok) {
          throw new Error("Failed to fetch payroll data");
        }

        const payrollApiData = await payrollResponse.json();

        // Handle both single payroll and payrolls array
        const payrollArray: PayrollAPIItem[] = payrollApiData.payroll 
          ? [payrollApiData.payroll] 
          : payrollApiData.payrolls || [];

        const mappedData: PayrollRecord[] = payrollArray.map((item, index) => {
          const basicSalary = Number(item.basic_salary) || 0;
          const stdDays = presentDays || item.STD || 22; // Use attendance data first
          const lopDays = absentDays || item.LOP || 0;
          const netPay = calculateNetPay(basicSalary);

          return {
            id: index + 1,
            month: `${item.month} ${item.year}`,
            basicSalary: basicSalary,
            stdDays: stdDays,
            lopDays: lopDays,
            status: (item.status || "pending").toLowerCase() as "paid" | "pending" | "processing",
            paymentDate: item.pay_date || "",
            email: item.email,
            netPay: netPay,
          };
        });

        setPayrollData(mappedData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
        setPayrollData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateNetPay = (basicSalary: number) => {
    // Calculate earnings
    const hra = Math.round(basicSalary * 0.4);
    const travelAllowance = 1600;
    const medicalAllowance = 1250;
    const specialAllowance = Math.round(basicSalary * 0.15);
    
    const grossEarnings = basicSalary + hra + travelAllowance + medicalAllowance + specialAllowance;
    
    // Calculate deductions
    const pf = Math.round(basicSalary * 0.12);
    const professionalTax = 200;
    const incomeTax = Math.round(basicSalary * 0.05);
    
    const grossDeductions = pf + professionalTax + incomeTax;
    
    return grossEarnings - grossDeductions;
  };

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

// Get the logged-in employee email
const employeeEmail = employeeData?.email || "";

// Filter payrolls for this employee
const employeePayrolls = payrollData.filter((rec) => rec.email === employeeEmail);

// Get the latest/current month record (assuming payrollData is sorted by month descending)
const currentMonthRecord = employeePayrolls.length > 0 ? employeePayrolls[0] : null;

// Current month net pay = basic salary of the latest month
const currentMonthNetPay = currentMonthRecord ? currentMonthRecord.basicSalary : 0;

// Overall net pay = sum of basic salaries of all months
const overallNetPay = employeePayrolls.reduce((acc, rec) => acc + rec.basicSalary, 0);


  const formatCurrency = (v: number | string) =>
    Math.round(Number(v || 0)).toLocaleString("en-IN");

  // Enhanced PDF generator with real employee data from APIs
  const downloadPayrollPDF = async (record: PayrollRecord) => {
    try {
      if (!employeeData) {
        throw new Error("Employee data not available");
      }

      // Use actual employee data from API
      const employeeName = employeeData.fullname || record.email.split("@")[0] || "Employee";
      const employeeId = employeeData.emp_id || `EMP-${String(record.id).padStart(4, "0")}`;
      const doj = employeeData.date_joined || "Not Available";
      const  department = employeeData.department ||employeeData.home_address || "Not Available";
      const bankName = employeeData.bank_name || "Not Available";
      const bankAccount = employeeData.account_number ? `XXXX${employeeData.account_number.slice(-4)}` : "XXXX1234";
      const pfNumber = employeeData.pf_no || "Not Available";
      const pfUan = employeeData.pf_uan || "Not Available";
      const _ifsc = employeeData.ifsc || "Not Available";
      const _branch = employeeData.branch || "Not Available";
      const location = employeeData.work_location || "Not Available";

      // Calculate earnings and deductions based on basic salary
      const basicSalary = record.basicSalary;
      
      // Earnings
      const hra = Math.round(basicSalary * 0.4);
      const travelAllowance = 1600;
      const medicalAllowance = 1250;
      const specialAllowance = Math.round(basicSalary * 0.15);
      
      // Deductions
      const pf = Math.round(basicSalary * 0.12);
      const professionalTax = 200;
      const incomeTax = Math.round(basicSalary * 0.05);

      const grossEarnings = basicSalary + hra + travelAllowance + medicalAllowance + specialAllowance;
      const grossDeductions = pf + professionalTax + incomeTax;
      const netPay = grossEarnings - grossDeductions;

      const payslip: PayslipData = {
        companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || "Global Tech Software Solutions",
        logoUrl: process.env.NEXT_PUBLIC_COMPANY_LOGO || "/logo/Global.jpg",
        period: record.month,
        employeeName: employeeName,
        employeeId: employeeId,
        bank: bankName,
        bankAccount: bankAccount,
        doj: doj,
        lopDays: record.lopDays,
        pfNumber: pfNumber,
        stdDays: record.stdDays,
        workedDays: record.stdDays - record.lopDays,
        department: department,
        managementLevel: employeeData.designation || "Not Available",
        facility: "Bengaluru Office",
        entity: "Global Tech Software Solutions",
        pfUan: pfUan,
        ifsc: _ifsc,
        branch: _branch,
        location: location,
        earnings: {
          "Basic Salary": basicSalary,
          "House Rent Allowance": 0,
          "Travel Allowance": 0,
          "Medical Allowance": 0,
          "Special Allowance": 0,
        },
        deductions: {
          "Provident Fund": pf,
          "Professional Tax": professionalTax,
          "Income Tax": 0,
        },
      };

      // PDF generation code
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const page = pdfDoc.addPage([595.28, 841.89]);

      const { width, height } = page.getSize();
      const margin = 40;
      let y = height - margin;

      // Logo embedding function
      async function embedLogo(url: string) {
        if (!url) return null;
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error("Failed to fetch logo");
          const bytes = new Uint8Array(await res.arrayBuffer());
          const header = Array.from(bytes.slice(0, 8))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
          if (header.startsWith("89504e47")) {
            return await pdfDoc.embedPng(bytes);
          } else {
            return await pdfDoc.embedJpg(bytes);
          }
        } catch (e) {
          console.warn("⚠️ Failed to embed logo, skipping:", e);
          return null;
        }
      }

      // Draw border
      page.drawRectangle({
        x: margin - 10,
        y: margin - 10,
        width: width - (margin - 10) * 2,
        height: height - (margin - 10) * 2,
        borderColor: rgb(0.8, 0.85, 0.9),
        borderWidth: 1.2,
      });

      // Header
      const logoImage = await embedLogo(payslip.logoUrl || "");
      if (logoImage) {
        const imgDims = logoImage.scale(0.25);
        page.drawImage(logoImage, {
          x: margin,
          y: y - imgDims.height,
          width: imgDims.width,
          height: imgDims.height,
        });
      }

      page.drawText(payslip.companyName, {
        x: margin + 120,
        y: y - 10,
        size: 18,
        font: boldFont,
        color: rgb(0.05, 0.2, 0.4),
      });

      page.drawText("PAYSLIP", {
        x: width - margin - 100,
        y: y - 10,
        size: 18,
        font: boldFont,
        color: rgb(0.05, 0.2, 0.4),
      });

      y -= 35;
      page.drawText(`For the period: ${payslip.period}`, {
        x: margin + 120,
        y,
        size: 11,
        font,
        color: rgb(0.25, 0.25, 0.25),
      });

      y -= 20;
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 0.6,
        color: rgb(0.8, 0.85, 0.9),
      });
      y -= 15;

      // Employee info section
      const leftX = margin;
      const rightX = width / 2 + 20;
      const rowH = 14;
      const infoPairs = [
        ["Employee ID", payslip.employeeId],
        ["Employee Name", payslip.employeeName],
        ["Bank", payslip.bank],
        ["Bank A/c No.", payslip.bankAccount],
        ["Date of Joining", payslip.doj],
        ["LOP Days", payslip.lopDays],
        ["PF No.", payslip.pfNumber],
        ["STD Days", payslip.stdDays],
        ["Worked Days", payslip.workedDays],
        ["Department", payslip.department],
        ["Management Level", payslip.managementLevel],
        ["Facility", payslip.facility],
        ["Entity", payslip.entity],
        ["PF - UAN", payslip.pfUan],
        ["IFSC Code", payslip.ifsc],
        ["Branch", payslip.branch],
        ["Location", payslip.location],
      ];

      for (let i = 0; i < Math.ceil(infoPairs.length / 2); i++) {
        const left = infoPairs[i * 2];
        const right = infoPairs[i * 2 + 1];
        const rowY = y - i * (rowH + 2);
        page.drawText(left[0] + ":", { x: leftX, y: rowY, size: 9, font: boldFont });
        page.drawText(String(left[1]), { x: leftX + 100, y: rowY, size: 9, font });
        if (right) {
          page.drawText(right[0] + ":", { x: rightX, y: rowY, size: 9, font: boldFont });
          page.drawText(String(right[1]), { x: rightX + 100, y: rowY, size: 9, font });
        }
      }
      y -= Math.ceil(infoPairs.length / 2) * (rowH + 2) + 25;

      // Earnings & Deductions Table
      const colWidths = [140, 70, 50, 140, 70];
      const startX = margin;
      const totalWidth = colWidths.reduce((a, b) => a + b, 0);
      let tableY = y;

      // Header row
      page.drawRectangle({
        x: startX,
        y: tableY,
        width: totalWidth,
        height: 22,
        color: rgb(0.95, 0.98, 1),
      });

      const headers = ["Earnings", "Amount (Rs.)", "", "Deductions", "Amount (Rs.)"];
      let xOffset = startX;
      for (let i = 0; i < headers.length; i++) {
        if (headers[i]) {
          page.drawText(headers[i], {
            x: xOffset + 6,
            y: tableY + 7,
            size: 10,
            font: boldFont,
            color: rgb(0.07, 0.2, 0.4),
          });
        }
        xOffset += colWidths[i];
      }

      // Data rows
      const earnings = Object.entries(payslip.earnings);
      const deductions = Object.entries(payslip.deductions);
      const rows = Math.max(earnings.length, deductions.length);
      tableY -= 22;

      for (let i = 0; i < rows; i++) {
        const rowY = tableY - i * 18;
        if (i % 2 === 0) {
          page.drawRectangle({
            x: startX,
            y: rowY - 4,
            width: totalWidth,
            height: 18,
            color: rgb(0.985, 0.99, 1),
          });
        }

        // Earnings
        if (earnings[i]) {
          const [label, val] = earnings[i];
          page.drawText(label, { x: startX + 6, y: rowY, size: 9, font });
          page.drawText(formatCurrency(val), {
            x: startX + colWidths[0] + 6,
            y: rowY,
            size: 9,
            font,
          });
        }

        // Deductions
        if (deductions[i]) {
          const [label, val] = deductions[i];
          const dedX = startX + colWidths[0] + colWidths[1] + colWidths[2];
          page.drawText(label, { x: dedX + 6, y: rowY, size: 9, font });
          page.drawText(formatCurrency(val), {
            x: dedX + colWidths[3] + 6,
            y: rowY,
            size: 9,
            font,
          });
        }
      }

      // Totals
      const grossEarningsCalc = earnings.reduce((a, [, v]) => a + Number(v), 0);
      const grossDeductionsCalc = deductions.reduce((a, [, v]) => a + Number(v), 0);
      const netPayCalc = grossEarningsCalc - grossDeductionsCalc;
      const totalsY = tableY - rows * 18 - 8;

      page.drawRectangle({
        x: startX,
        y: totalsY,
        width: totalWidth,
        height: 22,
        color: rgb(0.94, 0.94, 0.94),
      });

      page.drawText("GROSS EARNINGS", {
        x: startX + 6,
        y: totalsY + 7,
        size: 10,
        font: boldFont,
      });
      page.drawText(formatCurrency(grossEarningsCalc), {
        x: startX + colWidths[0] + 6,
        y: totalsY + 7,
        size: 10,
        font: boldFont,
      });

      const dedX = startX + colWidths[0] + colWidths[1] + colWidths[2];
      page.drawText("GROSS DEDUCTIONS", {
        x: dedX + 6,
        y: totalsY + 7,
        size: 10,
        font: boldFont,
      });
      page.drawText(formatCurrency(grossDeductionsCalc), {
        x: dedX + colWidths[3] + 6,
        y: totalsY + 7,
        size: 10,
        font: boldFont,
      });

      // Net Pay
      const netY = totalsY - 32;
      page.drawRectangle({
        x: startX,
        y: netY,
        width: totalWidth,
        height: 28,
        color: rgb(0.88, 0.95, 1),
      });

      page.drawText("NET PAY", {
        x: startX + 8,
        y: netY + 8,
        size: 12,
        font: boldFont,
        color: rgb(0.02, 0.2, 0.55),
      });

      page.drawText(formatCurrency(netPayCalc) + "/-", {
        x: startX + totalWidth - 95,
        y: netY + 8,
        size: 12,
        font: boldFont,
        color: rgb(0.02, 0.2, 0.55),
      });

      page.drawText("This is a computer generated salary slip and does not require signature or stamp.", {
        x: startX,
        y: netY - 20,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Save & download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Payslip_${payslip.employeeName}_${payslip.period.replace(" ", "_")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading)
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-blue-500 font-semibold">⏳ Loading payroll data...</p>
        </div>
      </DashboardLayout>
    );

  if (error)
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-500 font-semibold">❌ {error}</p>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout role="employee">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header + Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Payroll Dashboard</h2>
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
                {Array.from(new Set(payrollData.map((rec) => rec.status))).map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <FiFilter className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Overall Net Pay</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800 mt-1">₹{formatCurrency(overallNetPay)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <FiTrendingUp className="text-blue-600 text-lg sm:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Current Month Net Pay</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800 mt-1">₹{formatCurrency(currentMonthNetPay)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <FiDollarSign className="text-green-600 text-lg sm:text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Month", "Basic Salary", "STD Days", "LOP Days", "Net Pay", "Status", "Payment Date", "Payslip"].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">{record.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">₹{record.basicSalary.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{record.stdDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{record.lopDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-blue-700 font-semibold">
                        ₹{record.basicSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(record.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{record.paymentDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => downloadPayrollPDF(record)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                        >
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className="text-4xl">💸</span>
                        <h3 className="text-lg font-semibold">No payroll records yet</h3>
                        <p className="text-sm text-gray-500">Your payroll data will appear here once available.</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                          Refresh
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-4 p-4">
            {filteredData.length > 0 ? (
              filteredData.map((record) => (
                <div key={record.id} className="bg-gray-50 rounded-xl p-4 shadow-sm">
                  <div className="space-y-2">
                    <p><b>Month:</b> {record.month}</p>
                    <p><b>Basic Salary:</b> ₹{record.basicSalary.toLocaleString()}</p>
                    <p><b>STD Days:</b> {record.stdDays}</p>
                    <p><b>LOP Days:</b> {record.lopDays}</p>
                    <p><b>Net Pay:</b> ₹{record.netPay.toLocaleString()}</p>
                    <p><b>Status:</b> {getStatusBadge(record.status)}</p>
                    <p><b>Payment Date:</b> {record.paymentDate}</p>
                    <button
                      onClick={() => downloadPayrollPDF(record)}
                      className="w-full mt-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-10 bg-gray-50 rounded-xl shadow-sm">
                <span className="text-5xl">💸</span>
                <h3 className="text-lg font-semibold text-gray-700">No payrolls yet!</h3>
                <p className="text-sm text-gray-500 text-center">Your payroll history will appear here once available.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}