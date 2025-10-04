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

// ✅ Type for creating new payroll
type NewPayrollData = {
  email: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  bonus: number;
  tax: number;
  month: string;
  year: string;
  status: string;
};

export default function HRPayrollDashboard() {
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<NewPayrollData>({
    email: "",
    basic_salary: 0,
    allowances: 0,
    deductions: 0,
    bonus: 0,
    tax: 0,
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    status: "Pending"
  });
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  useEffect(() => {
    fetchPayrolls();
  }, []);

  // ✅ Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'email' || name === 'month' || name === 'year' || name === 'status' 
        ? value 
        : Number(value) || 0
    }));
  };

  // ✅ Submit new payroll
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_payroll/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message || "Payroll created successfully!" });
        setFormData({
          email: "",
          basic_salary: 0,
          allowances: 0,
          deductions: 0,
          bonus: 0,
          tax: 0,
          month: new Date().toLocaleString('default', { month: 'long' }),
          year: new Date().getFullYear().toString(),
          status: "Pending"
        });
        setShowAddForm(false);
        
        // Refresh the payroll list
        await fetchPayrolls();
      } else {
        setMessage({ type: 'error', text: result.error || "Failed to create payroll" });
      }
    } catch (error) {
      console.error("Error creating payroll:", error);
      setMessage({ type: 'error', text: "Network error. Please try again." });
    } finally {
      setFormLoading(false);
    }
  };

  // ✅ Download Payroll PDF
const downloadPDF = async (record: PayrollRecord) => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 842]); // A4
  const { width, height } = page.getSize();
  let y = height - 60;

  // Logo
  // Logo
const logoUrl = "/logo/Global.jpg";
const logoBytes = await fetch(logoUrl).then(res => res.arrayBuffer());
const logoImage = await pdfDoc.embedJpg(logoBytes);

const logoDims = logoImage.scale(0.3);

page.drawImage(logoImage, {
  x: 50,
  y: y - logoDims.height + 10,
  width: logoDims.width,
  height: logoDims.height,
});

// Company name — increase size from 18 to 24 and align vertically to middle of logo
const companyName = "Global Tech Software Solutions";
page.drawText(companyName, {
  x: 50 + logoDims.width + 15, // slightly more spacing
  y: y - logoDims.height / 2 + 8, // vertically center with logo
  size: 24,
  font: boldFont,
  color: rgb(0, 0.53, 0.71),
});


  y -= Math.max(logoDims.height, 40) + 20;

  // Payroll title
  const title = "PAYROLL REPORT";
  page.drawText(title, {
    x: width / 2 - boldFont.widthOfTextAtSize(title, 20) / 2,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0, 0.53, 0.71),
  });
  y -= 40;

  // Employee Info Box
  const infoBoxHeight = 70;
  page.drawRectangle({
    x: 50,
    y: y - infoBoxHeight,
    width: width - 100,
    height: infoBoxHeight,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(0.95, 0.95, 0.95),
  });

  const infoLines = [
    `Employee Email: ${record.email}`,
    `Month: ${record.month} ${record.year}`,
    `Status: ${record.status}`,
    `Pay Date: ${record.pay_date}`,
  ];

  let infoY = y - 20;
  infoLines.forEach(line => {
    page.drawText(line, {
      x: 60,
      y: infoY,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    infoY -= 15;
  });
  y -= infoBoxHeight + 20;

  // Earnings & Deductions Table
  const tableX = 50;
  const tableWidth = width - 100;
  const tableGap = 20;

  const earnings = [
    { label: "Basic Salary", value: record.basic_salary },
    { label: "Allowances", value: record.allowances },
    { label: "Bonus", value: record.bonus },
    { label: "Total Earnings", value: record.basic_salary + record.allowances + record.bonus },
  ];

  const deductions = [
    { label: "Tax", value: record.tax },
    { label: "Other Deductions", value: record.deductions },
    { label: "Total Deductions", value: record.tax + record.deductions },
  ];

  // Headers
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

  // Net Salary Box
  const netSalary = record.basic_salary + record.allowances + record.bonus - (record.tax + record.deductions);
  page.drawRectangle({
    x: tableX,
    y: y - 30,
    width: tableWidth,
    height: 30,
    color: rgb(0.9, 1, 0.9),
  });
  page.drawText(`NET SALARY: Rs. ${netSalary}`, {
    x: tableX + 10,
    y: y - 20,
    size: 14,
    font: boldFont,
    color: rgb(0, 0.6, 0.2),
  });
  y -= 50;

  // Footer
  const footer = "Generated by Global Tech Software Solutions Payroll System";
  page.drawText(footer, {
    x: width / 2 - font.widthOfTextAtSize(footer, 10) / 2,
    y: 30,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Save & download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
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

  // Months for dropdown
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <DashboardLayout role="hr">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Payroll Dashboard
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Add New Payroll
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Add Payroll Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Add New Payroll</h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="employee@company.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Month *
                      </label>
                      <select
                        name="month"
                        value={formData.month}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {months.map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year *
                      </label>
                      <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="2020"
                        max="2030"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Basic Salary (₹)
                    </label>
                    <input
                      type="number"
                      name="basic_salary"
                      value={formData.basic_salary}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allowances (₹)
                    </label>
                    <input
                      type="number"
                      name="allowances"
                      value={formData.allowances}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bonus (₹)
                    </label>
                    <input
                      type="number"
                      name="bonus"
                      value={formData.bonus}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax (₹)
                    </label>
                    <input
                      type="number"
                      name="tax"
                      value={formData.tax}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Deductions (₹)
                    </label>
                    <input
                      type="number"
                      name="deductions"
                      value={formData.deductions}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {formLoading ? "Creating..." : "Create Payroll"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : payrollData.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No payroll records found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first payroll record.
            </p>
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