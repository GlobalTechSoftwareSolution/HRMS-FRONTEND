"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PDFDocument, rgb } from "pdf-lib";

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
          const records: PayrollRecord[] = data.payrolls.map((r: any) => ({
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
          }));
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

  // Download PDF function
  const downloadPDF = async (record: PayrollRecord) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 750]);
    const { height } = page.getSize();

    // Load Noto Sans font (supports ₹)
    const fontBytes = await fetch("/fonts/NotoSans-Regular.ttf").then(res =>
      res.arrayBuffer()
    );
    const customFont = await pdfDoc.embedFont(fontBytes);

    const fontSize = 14;
    let y = height - 50;

    page.drawText("Payroll Report", {
      x: 200,
      y,
      size: 20,
      font: customFont,
      color: rgb(0, 0.53, 0.71),
    });

    y -= 40;
    const lines = [
      `Employee: ${record.email}`,
      `Month: ${record.month} ${record.year}`,
      `Status: ${record.status}`,
      `Pay Date: ${record.pay_date}`,
      ``,
      `Basic Salary: ₹${record.basic_salary}`,
      `Allowances: ₹${record.allowances}`,
      `Bonus: ₹${record.bonus}`,
      `Total Earnings: ₹${record.basic_salary + record.allowances + record.bonus}`,
      ``,
      `Tax: ₹${record.tax}`,
      `Other Deductions: ₹${record.deductions}`,
      `Total Deductions: ₹${record.tax + record.deductions}`,
      ``,
      `Net Salary: ₹${record.net_salary}`,
    ];

    lines.forEach(line => {
      page.drawText(line, { x: 50, y, size: fontSize, font: customFont, color: rgb(0, 0, 0) });
      y -= 25;
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll_${record.email}_${record.month}_${record.year}.pdf`;
    document.body.appendChild(link);
    setTimeout(() => link.click(), 100);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
            {payrollData.map((record) => (
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
                          <span className="text-sm text-gray-600">Basic Salary</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(record.basic_salary)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Allowances</span>
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
                              {formatCurrency(
                                record.basic_salary + record.allowances + record.bonus
                              )}
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
                          <span className="text-sm text-gray-600">Other Deductions</span>
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
                              {formatCurrency(record.tax + record.deductions)}
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
                        <p className="text-sm text-gray-900">{record.pay_date}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status</span>
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
                          {formatCurrency(record.net_salary)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
