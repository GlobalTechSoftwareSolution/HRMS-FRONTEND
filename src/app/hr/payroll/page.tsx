"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type PayslipData = {
  id: string;
  companyName: string;
  period: string;
  employeeId: string;
  employeeName: string;
  bank: string;
  bankAccount: string;
  doj: string;
  lopDays: number;
  pfNumber: string;
  stdDays: number;
  location: string;
  workedDays: number;
  department: string;
  managementLevel: string;
  facility: string;
  entity: string;
  pfUan: string;
  earnings: {
    basic: number;
    houseRentAllowance: number;
    personalAllowance: number;
    otherAllowance: number;
    oncallShiftAllowance: number;
  };
  deductions: {
    providentFund: number;
    professionalTax: number;
    esppContribution: number;
  };
};

type Employee = {
  id: number;
  email: string;
  fullname: string;
  department: string;
  // Add other employee fields as per your API
};

type PayrollAPIResponse = {
  email: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  bonus: number;
  tax: number;
  net_salary: number;
  month: string;
  year: string;
  status: string;
  pay_date: string;
};

export default function HRPayrollDashboard() {
  const [showPayslip, setShowPayslip] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  // const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch employees
        const employeesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`
        );
        
        if (!employeesResponse.ok) {
          throw new Error('Failed to fetch employees');
        }
        
        const employeesData = await employeesResponse.json();
        // setEmployees(Array.isArray(employeesData) ? employeesData : []);

        // Fetch payrolls
        const payrollsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_payrolls/`
        );

        if (!payrollsResponse.ok) {
          throw new Error('Failed to fetch payroll data');
        }

        const payrollsData = await payrollsResponse.json();
        
        // Transform API data to PayslipData format
        if (payrollsData.payrolls && Array.isArray(payrollsData.payrolls)) {
          const transformedPayslips: PayslipData[] = payrollsData.payrolls.map((payroll: PayrollAPIResponse, index: number) => {
            // Find employee details
            const employee = employeesData.find((emp: Employee) => emp.email === payroll.email);
            
            return {
              id: `${payroll.email}-${payroll.month}-${payroll.year}-${index}`,
              companyName: "GLOBAL TECH SOFTWARE SOLUTIONS",
              period: `${payroll.month} ${payroll.year}`,
              employeeId: payroll.email, // Using email as ID if no employee ID
              employeeName: employee?.fullname || payroll.email,
              bank: "xxxx",
              bankAccount: "xxxx",
              doj: "xxxx",
              lopDays: 0,
              pfNumber: "xxxx",
              stdDays: payroll.month.toLowerCase() === "february" ? 28 : 30,
              location: employee?.department || "xxxx",
              workedDays: payroll.month.toLowerCase() === "february" ? 28 : 30,
              department: employee?.department || "xxxx",
              managementLevel: "xxxx",
              facility: "xxxx",
              entity: "xxxx",
              pfUan: "xxxx",
              earnings: {
                basic: payroll.basic_salary || 0,
                houseRentAllowance: 0,
                personalAllowance: 0,
                otherAllowance: payroll.allowances || 0,
                oncallShiftAllowance: 0,
              },
              deductions: {
                providentFund: 1800,       // fixed PF
                professionalTax: 200,      // fixed professional tax
                esppContribution: 0,       // fixed TDS/ESPP
              },
            };
          });
          setPayslips(transformedPayslips);
        } else {
          setPayslips([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setPayslips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const downloadPDF = async (payslip: PayslipData) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const page = pdfDoc.addPage([595.28, 842]); // A4
      const { height } = page.getSize();
      let y = height - 50;

      // Company Header
      page.drawText(payslip.companyName, {
        x: 50,
        y,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= 30;

      // Payslip Title
      page.drawText(`Pay slip For ${payslip.period}`, {
        x: 50,
        y,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= 40;

      // Employee Information Table
      const employeeInfo = [
        ["Employee ID", payslip.employeeId, "Name", payslip.employeeName],
        ["Bank", payslip.bank, "Bank A/c No.", payslip.bankAccount],
        ["DOJ", payslip.doj, "LOP Days", payslip.lopDays.toString()],
        ["PF No.", payslip.pfNumber, "STD Days", payslip.stdDays.toString()],
        ["Location", payslip.location, "Worked Days", payslip.workedDays.toString()],
        ["Department", payslip.department, "Management Level", payslip.managementLevel],
        ["Facility", payslip.facility, "Entity", payslip.entity],
        ["PF - UAN", payslip.pfUan, "", ""],
      ];

      employeeInfo.forEach((row, index) => {
        const rowY = y - (index * 20);
        page.drawText(row[0], { x: 50, y: rowY, size: 10, font, color: rgb(0, 0, 0) });
        page.drawText(row[1], { x: 150, y: rowY, size: 10, font, color: rgb(0, 0, 0) });
        page.drawText(row[2], { x: 300, y: rowY, size: 10, font, color: rgb(0, 0, 0) });
        page.drawText(row[3], { x: 400, y: rowY, size: 10, font, color: rgb(0, 0, 0) });
      });

      y -= (employeeInfo.length * 20) + 30;

      // Earnings & Deductions Table (PDF Table Layout)
      // Prepare earnings and deductions arrays
      const earnings = [
        ["BASIC", payslip.earnings.basic],
        ["HOUSE RENT ALLOWANCE", payslip.earnings.houseRentAllowance],
        ["PERSONAL ALLOWANCE", payslip.earnings.personalAllowance],
        ["OTHER ALLOWANCE", payslip.earnings.otherAllowance],
        ["ONCALL / SHIFT ALLOWANCE", payslip.earnings.oncallShiftAllowance],
      ];
      const deductions = [
        ["PROVIDENT FUND", payslip.deductions.providentFund],
        ["PROFESSIONAL TAX", payslip.deductions.professionalTax],
        ["ESPP CONTRIBUTION DEDUCTION", payslip.deductions.esppContribution],
      ];
      const grossEarnings = Object.values(payslip.earnings).reduce((sum, a) => sum + Number(a || 0), 0);
      const grossDeductions = Object.values(payslip.deductions).reduce((sum, a) => sum + Number(a || 0), 0);
      const netPay = grossEarnings - grossDeductions;

      // Table Layout Parameters
      const startX = 50;
      let tableY = y;
      const rowHeight = 20;
      const colWidths = [150, 100, 150, 100];

      // Draw table headers
      const headers = ["Earnings", "Amount (Rs.)", "Deductions", "Amount (Rs.)"];
      headers.forEach((text, i) => {
        page.drawText(text, { x: startX + colWidths.slice(0, i).reduce((a,b) => a+b, 0), y: tableY, size: 12, font: boldFont });
      });
      // Draw header underline
      page.drawLine({
        start: { x: startX, y: tableY - 2 },
        end: { x: startX + colWidths.reduce((a,b)=>a+b,0), y: tableY - 2 },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
      tableY -= rowHeight;

      // Draw earnings and deductions rows
      const maxRows = Math.max(earnings.length, deductions.length);
      for (let i = 0; i < maxRows; i++) {
        const rowY = tableY - i * rowHeight;
        // Row background for visual clarity (alternating color)
        if (i % 2 === 1) {
          page.drawRectangle({
            x: startX,
            y: rowY - rowHeight + 4,
            width: colWidths.reduce((a,b)=>a+b,0),
            height: rowHeight,
            color: rgb(0.96, 0.98, 1),
            opacity: 0.5,
          });
        }
        // Earnings
        if (earnings[i]) {
          page.drawText(String(earnings[i][0]), { x: startX, y: rowY, size: 10, font });
          page.drawText((Number(earnings[i][1]) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), { x: startX + colWidths[0], y: rowY, size: 10, font });
        }
        // Deductions
        if (deductions[i]) {
          page.drawText(String(deductions[i][0]), { x: startX + colWidths[0] + colWidths[1], y: rowY, size: 10, font });
          page.drawText((Number(deductions[i][1]) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), { x: startX + colWidths[0] + colWidths[1] + colWidths[2], y: rowY, size: 10, font });
        }
        // Draw horizontal separator for each row
        page.drawLine({
          start: { x: startX, y: rowY - 2 },
          end: { x: startX + colWidths.reduce((a,b)=>a+b,0), y: rowY - 2 },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
      }
      tableY -= rowHeight * maxRows;

      // Totals Row
      // Draw background for totals row
      page.drawRectangle({
        x: startX,
        y: tableY - rowHeight + 4,
        width: colWidths.reduce((a,b)=>a+b,0),
        height: rowHeight,
        color: rgb(0.94, 0.94, 0.94),
        opacity: 0.7,
      });
      // GROSS EARNINGS
      page.drawText("GROSS EARNINGS", { x: startX, y: tableY, size: 10, font: boldFont });
      page.drawText(formatCurrency(grossEarnings), { x: startX + colWidths[0], y: tableY, size: 10, font: boldFont });
      // GROSS DEDUCTIONS
      page.drawText("GROSS DEDUCTIONS", { x: startX + colWidths[0] + colWidths[1], y: tableY, size: 10, font: boldFont });
      page.drawText(formatCurrency(grossDeductions), { x: startX + colWidths[0] + colWidths[1] + colWidths[2], y: tableY, size: 10, font: boldFont });
      // Draw horizontal line below totals
      page.drawLine({
        start: { x: startX, y: tableY - 2 },
        end: { x: startX + colWidths.reduce((a,b)=>a+b,0), y: tableY - 2 },
        thickness: 1,
        color: rgb(0.6, 0.6, 0.6),
      });
      tableY -= rowHeight;

      // Net Pay Row
      page.drawRectangle({
        x: startX,
        y: tableY - rowHeight + 4,
        width: colWidths.reduce((a,b)=>a+b,0),
        height: rowHeight,
        color: rgb(0.85, 0.92, 1),
        opacity: 0.6,
      });
      page.drawText("NET PAY", { x: startX, y: tableY, size: 12, font: boldFont, color: rgb(0,0,1) });
      page.drawText(formatCurrency(netPay), { x: startX + colWidths[0] + colWidths[1] + colWidths[2], y: tableY, size: 12, font: boldFont, color: rgb(0,0,1) });
      // Draw bottom border for table
      page.drawLine({
        start: { x: startX, y: tableY - 2 },
        end: { x: startX + colWidths.reduce((a,b)=>a+b,0), y: tableY - 2 },
        thickness: 1.2,
        color: rgb(0.3, 0.3, 0.6),
      });
      tableY -= rowHeight + 20;

      // Draw vertical borders for columns
      const vertYTop = y;
      const vertYBottom = tableY + 20;
      let curX = startX;
      for (let i = 0; i <= colWidths.length; i++) {
        page.drawLine({
          start: { x: curX, y: vertYTop },
          end: { x: curX, y: vertYBottom },
          thickness: 0.7,
          color: rgb(0.7, 0.7, 0.7),
        });
        if (i < colWidths.length) curX += colWidths[i];
      }

      // Footer
      page.drawText("** This is a computer generated payslip and does not require signature and stamp.", {
        x: 50,
        y: tableY - 20,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip_${payslip.employeeName}_${payslip.period}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout role="hr">
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout role="hr">
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!showPayslip) {
    return (
      <DashboardLayout role="hr">
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Employee Payslips</h1>
              <p className="text-gray-600">
                {payslips.length > 0 
                  ? "Select an employee to view and download payslip" 
                  : "No payroll data available"}
              </p>
            </div>

            {payslips.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-lg">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Payroll Records Found</h3>
                <p className="text-gray-500">There are no payroll records available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {payslips.map((payslip) => (
                  <div
                    key={payslip.id}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">{payslip.employeeName}</h3>
                      <p className="text-sm text-gray-600">{payslip.employeeId}</p>
                      <p className="text-sm text-blue-600 font-medium mt-1">{payslip.period}</p>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                      <div className="flex justify-between">
                        <span>Department:</span>
                        <span className="font-medium">{payslip.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="font-medium">{payslip.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Worked Days:</span>
                        <span className="font-medium">{payslip.workedDays}/{payslip.stdDays}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedPayslip(payslip);
                          setShowPayslip(true);
                        }}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        View Payslip
                      </button>
                      <button
                        onClick={() => downloadPDF(payslip)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="hr">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => setShowPayslip(false)}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Employee List
          </button>

          {selectedPayslip && (
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Payslip Content */}
              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedPayslip.companyName}
                  </h1>
                  <h2 className="text-lg font-semibold text-gray-700">
                    Pay slip For {selectedPayslip.period}
                  </h2>
                </div>

                {/* Employee Information Table */}
                <div className="mb-8">
                  <table className="w-full text-sm border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50 w-1/4">Employee ID</td>
                        <td className="py-2 px-4 text-gray-900 w-1/4">{selectedPayslip.employeeId}</td>
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50 w-1/4">Name</td>
                        <td className="py-2 px-4 text-gray-900 w-1/4">{selectedPayslip.employeeName}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">Bank</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.bank}</td>
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">Bank A/c No.</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.bankAccount}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">DOJ</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.doj}</td>
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">LOP Days</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.lopDays}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">PF No.</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.pfNumber}</td>
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">STD Days</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.stdDays}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">Location</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.location}</td>
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">Worked Days</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.workedDays}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">Department</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.department}</td>
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">Management Level</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.managementLevel}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">Facility</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.facility}</td>
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">Entity</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.entity}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">PF - UAN</td>
                        <td className="py-2 px-4 text-gray-900">{selectedPayslip.pfUan}</td>
                        <td className="py-2 px-4 bg-gray-50"></td>
                        <td className="py-2 px-4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Earnings & Deductions Table */}
                <div className="mb-8">
                  <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 font-semibold text-gray-700 bg-gray-100 border border-gray-300 text-left w-2/5">Earnings</th>
                        <th className="py-3 px-4 font-semibold text-gray-700 bg-gray-100 border border-gray-300 text-right w-1/5">Amount in Rs.</th>
                        <th className="py-3 px-4 font-semibold text-gray-700 bg-gray-100 border border-gray-300 text-left w-2/5">Deductions</th>
                        <th className="py-3 px-4 font-semibold text-gray-700 bg-gray-100 border border-gray-300 text-right w-1/5">Amount in Rs.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Earnings Rows */}
                      {[
                        ["BASIC", selectedPayslip.earnings.basic],
                        ["HOUSE RENT ALLOWANCE", selectedPayslip.earnings.houseRentAllowance],
                        ["PERSONAL ALLOWANCE", selectedPayslip.earnings.personalAllowance],
                        ["OTHER ALLOWANCE", selectedPayslip.earnings.otherAllowance],
                        ["ONCALL / SHIFT ALLOWANCE", selectedPayslip.earnings.oncallShiftAllowance],
                      ].map(([label, amount], idx) => (
                        <tr key={`earn-${idx}`} className="border-b border-gray-300">
                          <td className="py-2 px-4 border border-gray-300">{label}</td>
                          <td className="py-2 px-4 border border-gray-300 text-right">{formatCurrency(Number(amount))}</td>
                          {/* Only show deduction for first 3 rows */}
                          <td className="py-2 px-4 border border-gray-300">
                            {idx === 0 && "PROVIDENT FUND"}
                            {idx === 1 && "PROFESSIONAL TAX"}
                            {idx === 2 && "ESPP CONTRIBUTION DEDUCTION"}
                          </td>
                          <td className="py-2 px-4 border border-gray-300 text-right">
                            {idx === 0 && formatCurrency(selectedPayslip.deductions.providentFund)}
                            {idx === 1 && formatCurrency(selectedPayslip.deductions.professionalTax)}
                            {idx === 2 && formatCurrency(selectedPayslip.deductions.esppContribution)}
                          </td>
                        </tr>
                      ))}

                      {/* Totals Row */}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="py-3 px-4 border border-gray-300">GROSS EARNINGS</td>
                        <td className="py-3 px-4 border border-gray-300 text-right">
                          {formatCurrency(
                            Object.values(selectedPayslip.earnings).reduce((sum, a) => sum + Number(a || 0), 0)
                          )}
                        </td>
                        <td className="py-3 px-4 border border-gray-300">GROSS DEDUCTIONS</td>
                        <td className="py-3 px-4 border border-gray-300 text-right">
                          {formatCurrency(
                            Object.values(selectedPayslip.deductions).reduce((sum, a) => sum + Number(a || 0), 0)
                          )}
                        </td>
                      </tr>

                      {/* Net Pay Row */}
                      <tr className="bg-blue-50 font-bold">
                        <td className="py-3 px-4 border border-gray-300" colSpan={2}></td>
                        <td className="py-3 px-4 border border-gray-300">NET PAY</td>
                        <td className="py-3 px-4 border border-gray-300 text-right text-blue-700">
                          {formatCurrency(
                            Object.values(selectedPayslip.earnings).reduce((sum, a) => sum + Number(a || 0), 0) -
                            Object.values(selectedPayslip.deductions).reduce((sum, a) => sum + Number(a || 0), 0)
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="text-center text-gray-500 text-sm border-t border-gray-200 pt-4">
                  <p>** This is a computer generated payslip and does not require signature and stamp.</p>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-center gap-4">
                  <button
                    onClick={() => downloadPDF(selectedPayslip)}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}