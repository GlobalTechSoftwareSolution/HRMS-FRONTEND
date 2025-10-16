// src/app/.../PayrollDashboard.tsx  (or wherever you had it)
"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiChevronDown,
  FiFilter,
} from "react-icons/fi";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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

// Payslip shape used to render PDF
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
  earnings: Record<string, number | string>;
  deductions: Record<string, number | string>;
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
        const userEmail =
          typeof window !== "undefined"
            ? (localStorage.getItem("user_email") as string | null)
            : null;
        if (!userEmail) throw new Error("No employee logged in.");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/get_payroll/${encodeURIComponent(
            userEmail
          )}/`
        );

        if (!response.ok) {
          // Treat all errors (404, etc.) as "no payroll records"
          setPayrollData([]);
          return;
        }

        const data: { payroll?: PayrollAPIItem; payrolls?: PayrollAPIItem[] } =
          await response.json();

        const payrollArray: PayrollAPIItem[] = data.payroll
          ? [data.payroll]
          : data.payrolls || [];

        const mappedData: PayrollRecord[] = payrollArray.map((item, index) => ({
          id: index + 1,
          month: `${item.month} ${item.year}`,
          basicSalary: Number(item.basic_salary) || 0,
          status: (item.status || "pending").toLowerCase() as "paid" | "pending" | "processing",
          paymentDate: item.pay_date || "",
          email: item.email,
        }));

        setPayrollData(mappedData.filter((item) => item.email === userEmail));
      } catch (err) {
        console.error("Error fetching payroll data:", err);
        setPayrollData([]); // show friendly empty state instead of error
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

  // Helper: format currency INR
  const formatCurrency = (v: number | string) =>
    Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });


// Improved and aligned PDF generator using pdf-lib
const downloadPayrollPDF = async (record: PayrollRecord) => {
  try {
    // --- Setup payslip data ---
    const payslip: PayslipData = {
      companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || "Global Tech Software Solutions",
      logoUrl: process.env.NEXT_PUBLIC_COMPANY_LOGO || "/logo/Global.jpg",
      period: record.month || "October 2025",
      employeeName: record.email.split("@")[0] || "Employee",
      employeeId: `EMP-${String(record.id).padStart(4, "0")}`,
      bank: "State Bank of India",
      bankAccount: "XXXXXXXX" + String(Math.floor(Math.random() * 9000) + 1000),
      doj: "2023-01-15",
      lopDays: 0,
      pfNumber: "PF1234567",
      stdDays: 0,
      location: "Bangalore",
      workedDays: 30,
      department: "Engineering",
      managementLevel: "L2",
      facility: "Bengaluru Office",
      entity: "Acme Holdings",
      pfUan: "UAN12345678",
      earnings: {
        BASIC: record.basicSalary,
        "HOUSE RENT ALLOWANCE": Number(record.basicSalary) * 0.2,
        "PERSONAL ALLOWANCE": Number(record.basicSalary) * 0.05,
        "OTHER ALLOWANCE": 0,
      },
      deductions: {
        "PROVIDENT FUND": Number(record.basicSalary) * 0.12,
        "PROFESSIONAL TAX": 200,
        "ESPP CONTRIBUTION DEDUCTION": 0,
      },
    };

    // --- Create PDF document ---
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595.28, 841.89]); // A4

    const { width, height } = page.getSize();
    const margin = 40;
    let y = height - margin;

    // --- Helper: embed logo (handles PNG & JPG) ---
    async function embedLogo(url: string) {
      if (!url) {
        // If the URL is empty, skip fetching and return null
        return null;
      }
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

    // --- Draw border ---
    page.drawRectangle({
      x: margin - 10,
      y: margin - 10,
      width: width - (margin - 10) * 2,
      height: height - (margin - 10) * 2,
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 1.2,
    });

    // --- Header ---
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

    // --- Employee info section ---
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
      ["Location", payslip.location],
      ["Worked Days", payslip.workedDays],
      ["Department", payslip.department],
      ["Management Level", payslip.managementLevel],
      ["Facility", payslip.facility],
      ["Entity", payslip.entity],
      ["PF - UAN", payslip.pfUan],
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

    // --- Earnings & Deductions ---
    const colWidths = [170, 80, 170, 80];
    const startX = margin;
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    let tableY = y;

    page.drawRectangle({
      x: startX,
      y: tableY,
      width: totalWidth,
      height: 20,
      color: rgb(0.95, 0.98, 1),
    });

    const headers = ["Earnings", "Amount (Rs.)", "Deductions", "Amount (Rs.)"];
    headers.forEach((h, i) => {
      const offset = colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5;
      page.drawText(h, {
        x: startX + offset,
        y: tableY + 6,
        size: 10,
        font: boldFont,
        color: rgb(0.07, 0.2, 0.4),
      });
    });

    const earnings = Object.entries(payslip.earnings);
    const deductions = Object.entries(payslip.deductions);
    const rows = Math.max(earnings.length, deductions.length);
    tableY -= 20;

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
      if (earnings[i]) {
        const [label, val] = earnings[i];
        page.drawText(label, { x: startX + 6, y: rowY, size: 9, font });
        page.drawText(formatCurrency(val), {
          x: startX + colWidths[0] + 50,
          y: rowY,
          size: 9,
          font,
        });
      }
      if (deductions[i]) {
        const [label, val] = deductions[i];
        page.drawText(label, { x: startX + 260, y: rowY, size: 9, font });
        page.drawText(formatCurrency(val), {
          x: startX + 260 + colWidths[2] + 40,
          y: rowY,
          size: 9,
          font,
        });
      }
    }

    // --- Totals ---
    const grossEarnings = earnings.reduce((a, [, v]) => a + Number(v), 0);
    const grossDeductions = deductions.reduce((a, [, v]) => a + Number(v), 0);
    const netPay = grossEarnings - grossDeductions;

    const totalsY = tableY - rows * 18 - 8;
    page.drawRectangle({
      x: startX,
      y: totalsY,
      width: totalWidth,
      height: 20,
      color: rgb(0.94, 0.94, 0.94),
    });

    page.drawText("GROSS EARNINGS", { x: startX + 6, y: totalsY + 6, size: 10, font: boldFont });
    page.drawText(formatCurrency(grossEarnings), {
      x: startX + colWidths[0] + 50,
      y: totalsY + 6,
      size: 10,
      font: boldFont,
    });

    page.drawText("GROSS DEDUCTIONS", { x: startX + 260, y: totalsY + 6, size: 10, font: boldFont });
    page.drawText(formatCurrency(grossDeductions), {
      x: startX + 260 + colWidths[2] + 40,
      y: totalsY + 6,
      size: 10,
      font: boldFont,
    });

    // --- Net Pay ---
    const netY = totalsY - 35;
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
    page.drawText(formatCurrency(netPay), {
      x: startX + totalWidth - 90,
      y: netY + 8,
      size: 12,
      font: boldFont,
      color: rgb(0.02, 0.2, 0.55),
    });

    // --- Footer ---
    page.drawText("This is a computer generated payslip and does not require signature or stamp.", {
      x: margin,
      y: margin + 20,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // --- Save & download ---
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Payslip_${payslip.employeeName}_${payslip.period}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error generating PDF:", err);
  }
};


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
            <table className="min-w-[800px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Month", "Basic Salary", "Net Pay", "Status", "Payment Date", "Payslip"].map((head) => (
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
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => downloadPayrollPDF(record)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 transition"
                        >
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className="text-4xl">💸</span>
                        <h3 className="text-lg font-semibold">No payroll records yet</h3>
                        <p className="text-sm text-gray-500">It looks like your payroll data is not available at the moment.</p>
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
                  <button
                    onClick={() => downloadPayrollPDF(record)}
                    className="mt-2 w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                  >
                    Download PDF
                  </button>
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
