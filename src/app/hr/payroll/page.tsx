"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// ✅ Type for backend response (raw API shape)
type PayrollAPIResponse = {
  email: string;
  basic_salary: number | string;
  allowances: number | string;
  deductions: number | string;
  bonus: number | string;
  tax: number | string;
  net_salary: number | string;
  month: string;
  year: string | number;
  status: string;
  pay_date: string;
};

// ✅ Strict type for state
type PayrollRecord = {
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
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayrolls = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_payrolls/`
        );

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Invalid JSON response, maybe HTML:", text);
          setPayrollData([]);
          return;
        }

        if (data.payrolls && Array.isArray(data.payrolls)) {
          const records: PayrollRecord[] = data.payrolls.map(
            (r: PayrollAPIResponse): PayrollRecord => ({
              email: r.email,
              basic_salary: Number(r.basic_salary) || 0,
              allowances: Number(r.allowances) || 0,
              deductions: Number(r.deductions) || 0,
              bonus: Number(r.bonus) || 0,
              tax: Number(r.tax) || 0,
              net_salary: Number(r.net_salary) || 0,
              month: r.month,
              year: String(r.year),
              status: r.status,
              pay_date: r.pay_date,
            })
          );
          setPayrollData(records);
        } else {
          setPayrollData([]);
        }
      } catch (err) {
        console.error("Error fetching payroll data:", err);
        setPayrollData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayrolls();
  }, []);

  // ✅ Download Payroll PDF
  const downloadPDF = async (record: PayrollRecord) => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595.28, 842]); // A4
    const { width, height } = page.getSize();
    let y = height - 60;

    // Header
    const title = "PAYROLL REPORT";
    page.drawText(title, {
      x: width / 2 - boldFont.widthOfTextAtSize(title, 20) / 2,
      y,
      size: 20,
      font: boldFont,
      color: rgb(0, 0.53, 0.71),
    });
    y -= 40;

    // Employee info
    const infoLines = [
      `Employee Email: ${record.email}`,
      `Month: ${record.month} ${record.year}`,
      `Status: ${record.status}`,
      `Pay Date: ${record.pay_date}`,
    ];
    infoLines.forEach((line) => {
      page.drawText(line, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 18;
    });

    y -= 10;

    // Table data
    const tableX = 50;
    const tableWidth = width - 100;
    const tableGap = 25;

    const earnings = [
      { label: "Basic Salary", value: record.basic_salary },
      { label: "Allowances", value: record.allowances },
      { label: "Bonus", value: record.bonus },
      {
        label: "Total Earnings",
        value: record.basic_salary + record.allowances + record.bonus,
      },
    ];

    const deductions = [
      { label: "Tax", value: record.tax },
      { label: "Other Deductions", value: record.deductions },
      { label: "Total Deductions", value: record.tax + record.deductions },
    ];

    // Draw headers
    page.drawText("Earnings", {
      x: tableX,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0, 0.53, 0.71),
    });
    page.drawText("Deductions", {
      x: tableX + tableWidth / 2,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0, 0.53, 0.71),
    });
    y -= 20;

    const maxRows = Math.max(earnings.length, deductions.length);
    for (let i = 0; i < maxRows; i++) {
      const earning = earnings[i];
      const deduction = deductions[i];

      if (earning) {
        page.drawText(`${earning.label}: Rs. ${earning.value}`, {
          x: tableX,
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
      }

      if (deduction) {
        page.drawText(`${deduction.label}: Rs. ${deduction.value}`, {
          x: tableX + tableWidth / 2,
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
      }
      y -= tableGap;
    }

    y -= 10;

    // Net salary
    const netSalary =
      record.basic_salary +
      record.allowances +
      record.bonus -
      (record.tax + record.deductions);
    const netText = `NET SALARY: Rs. ${netSalary}`;
    page.drawText(netText, {
      x: tableX,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0, 0.6, 0.2),
    });
    y -= 40;

    // Footer
    const footer = "Generated by Company Payroll System";
    page.drawText(footer, {
      x: width / 2 - font.widthOfTextAtSize(footer, 10) / 2,
      y: 30,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Save & download
  const pdfBytes = await pdfDoc.save();

// ✅ Narrow type so TS knows it's ArrayBuffer
const arrayBuffer = pdfBytes.buffer.slice(
  pdfBytes.byteOffset,
  pdfBytes.byteOffset + pdfBytes.byteLength
) as ArrayBuffer;

const blob = new Blob([arrayBuffer], { type: "application/pdf" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = `payroll_${record.email}_${record.month}_${record.year}.pdf`;
document.body.appendChild(link);
link.click();
link.remove();
URL.revokeObjectURL(url);



  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <DashboardLayout role="hr">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Payroll Dashboard
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : payrollData.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No payroll records found
            </h3>
          </div>
        ) : (
          <div className="space-y-6">
            {payrollData.map((record) => {
              const totalEarnings =
                record.basic_salary + record.allowances + record.bonus;
              const totalDeductions = record.tax + record.deductions;
              const netSalary = totalEarnings - totalDeductions;

              return (
                <div
                  key={`${record.email}-${record.year}-${record.month}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Payroll Details for {record.month} {record.year}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Employee: {record.email}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadPDF(record)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      Download PDF
                    </button>
                  </div>

                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">
                          Earnings
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Basic Salary
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(record.basic_salary)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Allowances
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(record.allowances)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Bonus</span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(record.bonus)}
                            </span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-700">
                                Total Earnings
                              </span>
                              <span className="text-sm font-medium text-green-600">
                                {formatCurrency(totalEarnings)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">
                          Deductions
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tax</span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(record.tax)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Other Deductions
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(record.deductions)}
                            </span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-700">
                                Total Deductions
                              </span>
                              <span className="text-sm font-medium text-red-600">
                                {formatCurrency(totalDeductions)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-5 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Pay Date
                          </span>
                          <p className="text-sm text-gray-900">
                            {record.pay_date}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Status
                          </span>
                          <span
                            className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              record.status
                            )}`}
                          >
                            {record.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-500">
                            Net Salary
                          </span>
                          <p className="text-lg font-bold text-blue-700">
                            {formatCurrency(netSalary)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
