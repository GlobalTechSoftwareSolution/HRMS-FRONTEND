"use client";
import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
import { Plus, Eye, Download, X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { differenceInMinutes, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';
type PayslipData = {
  id: string;
  companyName: string;
  period: string;
  employeeId: string;
  employeeName: string;
  bank: string;
  bankAccount: string;
  doj: string;
  pf_no: string;
  location: string;
  department: string;
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
  bank_name?: string;
  branch?: string;
  date_joined?: string;
  pf_no?: string;
  residential_address?: string;
  pf_uan?: string;
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

type CreatePayrollForm = {
  email: string;
  basic_salary: string;
  month: string;
  year: string;
  status: string;
  pay_date: string;
};

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

type Attendance = {
  email: string;
  role: string;
  fullname: string;
  department: string;
  date: string;
  check_in: string;
  check_out: string | null;
};

export default function HRPayrollDashboard() {
  const [showPayslip, setShowPayslip] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const setAttendance = useState<Attendance[]>([])[1];

  const [formData, setFormData] = useState<CreatePayrollForm>({
    email: "",
    basic_salary: "",
    month: "",
    year: new Date().getFullYear().toString(),
    status: "Paid",
    pay_date: new Date().toISOString().split('T')[0],
  });

  function calculateAttendanceMetrics(attendance: Attendance[], month: string, year: number) {
  try {
    // Convert month name to month index (0-11)
    const monthNames = ["january", "february", "march", "april", "may", "june", 
                       "july", "august", "september", "october", "november", "december"];
    const monthIndex = monthNames.indexOf(month.toLowerCase());
    
    if (monthIndex === -1) {
      console.error(`Invalid month: ${month}`);
      return { stdDays: 0, workedDays: 0, lopDays: 0, totalWorkedHours: 0 };
    }

    // Get first and last day of the month
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    // Create list of all month dates
    const monthDates = eachDayOfInterval({
      start: firstDay,
      end: lastDay
    });

    // Filter only working days (exclude weekends)
    const workingDates = monthDates.filter(date => !isWeekend(date));
    const stdDays = workingDates.length;

    let workedDays = 0;
    let lopDays = 0;
    let totalWorkedHours = 0;

    console.log(`🔍 Calculating metrics for ${month} ${year}`);
    console.log(`📅 Total working days: ${stdDays}`);
    console.log(`👤 Attendance records for this period:`, attendance);

    // Check each working day
    workingDates.forEach(date => {
      const dateStr = date.toISOString().split("T")[0]; // Format: "2025-10-10"
      
      // Find attendance for this specific date
      const dayAttendance = attendance.find(a => a.date === dateStr);
      
      if (dayAttendance && dayAttendance.check_in && dayAttendance.check_out && dayAttendance.check_out !== null) {
        workedDays++;
        
        // Calculate worked hours
        try {
          const checkIn = parseISO(`${dateStr}T${dayAttendance.check_in}`);
          const checkOut = parseISO(`${dateStr}T${dayAttendance.check_out}`);
          const minutesWorked = differenceInMinutes(checkOut, checkIn);
          const hoursWorked = minutesWorked / 60;
          totalWorkedHours += hoursWorked;
          
          console.log(`✅ ${dateStr}: Worked ${hoursWorked.toFixed(2)} hours (${dayAttendance.check_in} to ${dayAttendance.check_out})`);
        } catch (timeError) {
          console.warn(`❌ Error calculating hours for ${dateStr}:`, timeError);
          // Still count as worked day even if hours calculation fails
        }
      } else {
        lopDays++;
        if (dayAttendance) {
          console.log(`❌ ${dateStr}: LOP - Incomplete attendance (Check-in: ${dayAttendance.check_in}, Check-out: ${dayAttendance.check_out})`);
        } else {
          console.log(`❌ ${dateStr}: LOP - No attendance record`);
        }
      }
    });

    console.log(`📊 Final Metrics for ${month} ${year}:`, {
      totalWorkingDays: stdDays,
      workedDays,
      lopDays,
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100
    });

    return {
      stdDays,
      workedDays,
      lopDays,
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100
    };
  } catch (error) {
    console.error("🚨 Error in calculateAttendanceMetrics:", error);
    return { stdDays: 0, workedDays: 0, lopDays: 0, totalWorkedHours: 0 };
  }
}

  const addNotification = (type: NotificationType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const notification: Notification = { id, type, title, message };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

const fetchData = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    // Start all fetches in parallel
    const employeesPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`
    );
    const attendancePromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_attendance/`
    );
    const payrollsPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_payrolls/`
    );

    const [employeesResponse, attendanceResponse, payrollsResponse] = await Promise.all([
      employeesPromise,
      attendancePromise,
      payrollsPromise,
    ]);

    let employeesData: Employee[] = [];
    if (employeesResponse.ok) {
      employeesData = await employeesResponse.json();
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      console.log('👥 Employees loaded:', employeesData.length);
    } else {
      setEmployees([]);
      throw new Error('Failed to fetch employees');
    }

    let attendanceData: Attendance[] = [];
    if (attendanceResponse.ok) {
      const rawAttendance = await attendanceResponse.json();
      attendanceData = Array.isArray(rawAttendance) ? rawAttendance : rawAttendance.results || [];
      setAttendance(attendanceData);
      console.log('📊 All attendance records:', attendanceData);
    } else {
      setAttendance([]);
      console.error('Failed to fetch attendance');
    }

    let payrollsData: { payrolls: PayrollAPIResponse[] } = { payrolls: [] };
    if (payrollsResponse.ok) {
      payrollsData = await payrollsResponse.json();
      console.log('💰 Payrolls loaded:', payrollsData.payrolls?.length || 0);
    } else {
      setPayslips([]);
      throw new Error('Failed to fetch payroll data');
    }

    if (payrollsData.payrolls && Array.isArray(payrollsData.payrolls)) {
      const transformedPayslips: PayslipData[] = payrollsData.payrolls.map(
        (payroll: PayrollAPIResponse, _index: number) => {
          const employee = employeesData.find((emp) => emp.email === payroll.email);
          const employeeAttendance = attendanceData.filter((a) => a.email === payroll.email);
          const attendanceMetrics = calculateAttendanceMetrics(
            employeeAttendance,
            payroll.month,
            parseInt(payroll.year)
          );
          return {
            id: `${payroll.email}-${payroll.month}-${payroll.year}-${_index}`,
            companyName: "GLOBAL TECH SOFTWARE SOLUTIONS",
            period: `${payroll.month} ${payroll.year}`,
            employeeId: payroll.email,
            employeeName: employee?.fullname || payroll.email,
            bank: employee?.bank_name || "xxxx",
            bankAccount: employee?.branch || "xxxx",
            doj: employee?.date_joined || "xxxx",
            lopDays: attendanceMetrics.lopDays,
            location: employee?.residential_address || "xxxx",
            department: employee?.department || "xxxx",
            pf_no: employee?.pf_no || "xxxx",
            pfUan: employee?.pf_uan || "xxxx",
            earnings: {
              basic: payroll.basic_salary || 0,
              houseRentAllowance: 0,
              personalAllowance: 0,
              otherAllowance: payroll.allowances || 0,
              oncallShiftAllowance: 0,
            },
            deductions: {
              providentFund: 1800,
              professionalTax: 200,
              esppContribution: 0,
            },
          };
        }
      );
      setPayslips(transformedPayslips);
    } else {
      setPayslips([]);
    }
  } catch (err: unknown) {
    console.error("Error fetching data:", err);
    setError(err instanceof Error ? err.message : "Failed to fetch data");
    setPayslips([]);
    setEmployees([]);
    setAttendance([]);
  } finally {
    setLoading(false);
  }
}, [setAttendance]);

useEffect(() => {
  fetchData();
}, [fetchData]);

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.basic_salary || !formData.month || !formData.year) {
      addNotification('error', 'Validation Error', 'Please fill in all required fields.');
      return;
    }

    try {
      setCreating(true);

      const payrollData = {
        email: formData.email,
        basic_salary: parseFloat(formData.basic_salary),
        month: formData.month,
        year: parseInt(formData.year),
        status: formData.status,
        pay_date: formData.pay_date,
      };

      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_payroll/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payrollData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData?.error?.includes("already exists")) {
          addNotification('error', 'Payroll Already Exists', errorData.error);
          return;
        }
        throw new Error(`Failed to create payroll: ${response.status} - ${errorData.error}`);
      }

       await response.json();

      setFormData({
        email: "",
        basic_salary: "",
        month: "",
        year: new Date().getFullYear().toString(),
        status: "Paid",
        pay_date: new Date().toISOString().split('T')[0],
      });

      setShowCreateModal(false);

      addNotification(
        'success',
        'Payroll Created',
        `Payroll for ${formData.email} has been created successfully!`
      );

      // Immediately fetch new data and close modal
      await fetchData();

    } catch (err) {
      console.error("Error creating payroll:", err);
      addNotification(
        'error',
        'Creation Failed',
        err instanceof Error ? err.message : 'Failed to create payroll. Please try again.'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



const downloadPDF = async (payslip: PayslipData) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // ===== PAGE SETUP =====
    const page = pdfDoc.addPage([595.28, 842]); // A4 portrait
    const { width, height } = page.getSize();
    let y = height - 50;

    // ===== PROFESSIONAL HEADER WITH DUAL COLOR STRIPE =====
    // Top stripe
    page.drawRectangle({
      x: 0,
      y: height - 40,
      width: width,
      height: 40,
      color: rgb(0.1, 0.3, 0.6),
    });

    // Secondary stripe
    page.drawRectangle({
      x: 0,
      y: height - 25,
      width: width,
      height: 15,
      color: rgb(0.2, 0.4, 0.8),
    });

    // ===== LOGO & COMPANY INFO =====
    const logoUrl = "/logo/Global.jpg";
    let logoImage;
    try {
      const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch {
      console.warn("Logo missing, using text fallback");
    }

    // Logo placement
    if (logoImage) {
      const logoWidth = 45;
      const logoHeight = 45 * (logoImage.height / logoImage.width);
      page.drawImage(logoImage, {
        x: 50,
        y: height - 42,
        width: logoWidth,
        height: logoHeight,
      });
    }

    // Company name in header
    const companyName = payslip.companyName || "GLOBAL TECH SOFTWARE SOLUTIONS";
    page.drawText(companyName, {
      x: logoImage ? 110 : 50,
      y: height - 25,
      size: 16,
      font: titleFont,
      color: rgb(1, 1, 1),
    });

    // ===== PAYSLIP TITLE SECTION =====
    y = height - 90;

    // Main title with background
    page.drawRectangle({
      x: 50,
      y: y + 5,
      width: width - 100,
      height: 30,
      color: rgb(0.95, 0.95, 0.98),
      borderWidth: 1,
      borderColor: rgb(0.8, 0.8, 0.9),
    });

    page.drawText(`PAYSLIP FOR ${payslip.period.toUpperCase()}`, {
      x: width / 2 - font.widthOfTextAtSize(`PAYSLIP FOR ${payslip.period.toUpperCase()}`, 14) / 2,
      y: y + 15,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.4),
    });

    y -= 50;

    // ===== EMPLOYEE DETAILS SECTION =====
    const employeeDetails = [
      { label: "EMPLOYEE ID", value: payslip.employeeId || "-", label2: "EMPLOYEE NAME", value2: payslip.employeeName || "-" },
      { label: "BANK NAME", value: payslip.bank || "-", label2: "BANK ACCOUNT NO.", value2: payslip.bankAccount || "-" },
      { label: "DATE OF JOINING", value: payslip.doj || "-", label2: "PF NUMBER", value2: payslip.pf_no || "-" },
      { label: "DEPARTMENT", value: payslip.department || "-", label2: "PF UAN NUMBER", value2: payslip.pfUan || "-" },
      { label: "WORK LOCATION", value: payslip.location || "-", label2: "PAYMENT DATE", value2: new Date().toLocaleDateString() },
    ];

    // Section header
    page.drawText("EMPLOYEE INFORMATION", {
      x: 50,
      y: y + 32,
      size: 12,
      font: boldFont,
      color: rgb(0.1, 0.3, 0.6),
    });

    // Details container
    const detailsHeight = employeeDetails.length * 22 + 20;
    page.drawRectangle({
      x: 50,
      y: y - detailsHeight + 20,
      width: width - 100,
      height: detailsHeight,
      color: rgb(0.98, 0.98, 1),
      borderWidth: 1,
      borderColor: rgb(0.85, 0.85, 0.95),
    });

    // Draw details with perfect alignment
    // ===== EMPLOYEE DETAILS SECTION =====
const rowHeight = 22;
const startXLeft = 65;
const startXRight = 330;
const valueOffset = 110;
const rightValueOffset = 120;
const maxTextWidthLeft = 200;
const maxTextWidthRight = 200;

// Move this section slightly upward (tweak this offset if needed)
const topOffset = 20; // Increase = move up, Decrease = move down
let currentY = y + topOffset;

// helper: wrap long text if exceeds width
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = (text || "").split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? currentLine + " " + word : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth < maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

employeeDetails.forEach((row) => {
  const labelFontSize = 9;
  const valueFontSize = 9;

  // Wrap text for both sides
  const leftLines = wrapText(row.value || "-", font, valueFontSize, maxTextWidthLeft);
  const rightLines = wrapText(row.value2 || "-", font, valueFontSize, maxTextWidthRight);

  const rowLines = Math.max(leftLines.length, rightLines.length);
  const blockHeight = rowHeight + (rowLines - 1) * 10;

  // Decrease Y before drawing the row (top-down)
  currentY -= blockHeight;

  // Optional divider line (for neatness)
  page.drawLine({
    start: { x: 50, y: currentY - 3 },
    end: { x: width - 50, y: currentY - 3 },
    thickness: 0.3,
    color: rgb(0.85, 0.9, 0.95),
  });

  // ===== LEFT SIDE =====
  page.drawText(row.label || "", {
    x: startXLeft,
    y: currentY + 5,
    size: labelFontSize,
    font: boldFont,
    color: rgb(0.25, 0.25, 0.45),
  });

  leftLines.forEach((line, i) => {
    page.drawText(line, {
      x: startXLeft + valueOffset,
      y: currentY + 5 - i * 10,
      size: valueFontSize,
      font: font,
      color: rgb(0.1, 0.1, 0.3),
    });
  });

  // ===== RIGHT SIDE =====
  page.drawText(row.label2 || "", {
    x: startXRight,
    y: currentY + 5,
    size: labelFontSize,
    font: boldFont,
    color: rgb(0.25, 0.25, 0.45),
  });

  rightLines.forEach((line, i) => {
    page.drawText(line, {
      x: startXRight + rightValueOffset,
      y: currentY + 5 - i * 10,
      size: valueFontSize,
      font: font,
      color: rgb(0.1, 0.1, 0.3),
    });
  });
});


    y -= detailsHeight + 30;

    // ===== EARNINGS & DEDUCTIONS SECTION =====
    const sectionHeaderY = y;
    
    // Section headers
    page.drawText("EARNINGS", {
      x: 60,
      y: sectionHeaderY,
      size: 11,
      font: boldFont,
      color: rgb(0.1, 0.4, 0.2),
    });

    page.drawText("DEDUCTIONS", {
      x: 330,
      y: sectionHeaderY,
      size: 11,
      font: boldFont,
      color: rgb(0.6, 0.1, 0.1),
    });

    y -= 25;

    // Column headers
    const colHeaders = ["Description", "Amount"];

    page.drawText(colHeaders[0], { x: 60, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.4) });
    page.drawText(colHeaders[1], { x: 250, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.4) });
    
    page.drawText(colHeaders[0], { x: 330, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.4) });
    page.drawText(colHeaders[1], { x: 520, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.4) });

    y -= 15;

    // Header separator lines
    page.drawLine({
      start: { x: 50, y },
      end: { x: 290, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.8),
    });

    page.drawLine({
      start: { x: 320, y },
      end: { x: 560, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.8),
    });

    y -= 10;

    // ===== EARNINGS & DEDUCTIONS DATA =====
    const earnings = [
      { description: "Basic Salary", amount: payslip.earnings.basic },
      { description: "House Rent Allowance", amount: payslip.earnings.houseRentAllowance },
      { description: "Personal Allowance", amount: payslip.earnings.personalAllowance },
      { description: "Other Allowance", amount: payslip.earnings.otherAllowance },
      { description: "Shift Allowance", amount: payslip.earnings.oncallShiftAllowance },
    ];

    const deductions = [
      { description: "Provident Fund", amount: payslip.deductions.providentFund },
      { description: "Professional Tax", amount: payslip.deductions.professionalTax },
      { description: "ESPP Contribution", amount: payslip.deductions.esppContribution },
    ];

    const formatCurrency = (amount: number | string) => {
      const value = Number(amount) || 0;
      return value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const maxRows = Math.max(earnings.length, deductions.length);

    for (let i = 0; i < maxRows; i++) {
      const rowY = y - i * 18;
      
      // Alternate row background
      if (i % 2 === 0) {
        page.drawRectangle({
          x: 50,
          y: rowY - 2,
          width: 240,
          height: 18,
          color: rgb(0.97, 0.98, 1),
          opacity: 0.5,
        });
        page.drawRectangle({
          x: 320,
          y: rowY - 2,
          width: 240,
          height: 18,
          color: rgb(0.97, 0.98, 1),
          opacity: 0.5,
        });
      }

      // Earnings data
      if (earnings[i]) {
        page.drawText(earnings[i].description, {
          x: 60,
          y: rowY,
          size: 9,
          font: font,
          color: rgb(0.1, 0.1, 0.3),
        });
        
        const amountText = formatCurrency(earnings[i].amount);
        const amountWidth = font.widthOfTextAtSize(amountText, 9);
        page.drawText(amountText, {
          x: 250 - amountWidth,
          y: rowY,
          size: 9,
          font: font,
          color: rgb(0.1, 0.1, 0.3),
        });
      }

      // Deductions data
      if (deductions[i]) {
        page.drawText(deductions[i].description, {
          x: 330,
          y: rowY,
          size: 9,
          font: font,
          color: rgb(0.1, 0.1, 0.3),
        });
        
        const amountText = formatCurrency(deductions[i].amount);
        const amountWidth = font.widthOfTextAtSize(amountText, 9);
        page.drawText(amountText, {
          x: 560 - amountWidth,
          y: rowY,
          size: 9,
          font: font,
          color: rgb(0.1, 0.1, 0.3),
        });
      }
    }

    y -= maxRows * 18 + 20;

    // ===== TOTALS SECTION =====
    const grossEarnings = Object.values(payslip.earnings).reduce(
      (sum, amount) => sum + (Number(amount) || 0),
      0
    );
    const grossDeductions = Object.values(payslip.deductions).reduce(
      (sum, amount) => sum + (Number(amount) || 0),
      0
    );
    const netPay = grossEarnings - grossDeductions;

    // Totals separator line
    page.drawLine({
      start: { x: 50, y },
      end: { x: 560, y },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.7),
    });

    y -= 15;

    // Gross totals
    page.drawText("GROSS EARNINGS", {
      x: 60,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.4, 0.2),
    });
    
    const grossEarningsText = formatCurrency(grossEarnings);
    const grossEarningsWidth = font.widthOfTextAtSize(grossEarningsText, 10);
    page.drawText(grossEarningsText, {
      x: 250 - grossEarningsWidth,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.4, 0.2),
    });

    page.drawText("GROSS DEDUCTIONS", {
      x: 330,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.6, 0.1, 0.1),
    });
    
    const grossDeductionsText = formatCurrency(grossDeductions);
    const grossDeductionsWidth = font.widthOfTextAtSize(grossDeductionsText, 10);
    page.drawText(grossDeductionsText, {
      x: 560 - grossDeductionsWidth,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.6, 0.1, 0.1),
    });

    y -= 30;

   // ===== NET PAYABLE AMOUNT SECTION =====
      const sectionHeight = 60;
      const sectionY = y - sectionHeight - 10; // spacing from previous section

      // Background box
      page.drawRectangle({
        x: 50,
        y: sectionY,
        width: width - 100,
        height: sectionHeight,
        color: rgb(0.9, 0.95, 1),
        borderWidth: 1.5,
        borderColor: rgb(0.2, 0.4, 0.8),
      });

      // Centering calculations
      const centerX = width / 2;

      // Title text
      const titleText = "NET PAYABLE AMOUNT";
      const titleSize = 12;
      const titleWidth = boldFont.widthOfTextAtSize(titleText, titleSize);

      page.drawText(titleText, {
        x: centerX - titleWidth / 2,
        y: sectionY + sectionHeight - 20, // 20px from top
        size: titleSize,
        font: boldFont,
        color: rgb(0.1, 0.2, 0.6),
      });

      // Amount text
      const netPayText = `Rs. ${formatCurrency(netPay)}`;
      const amountSize = 16;
      const netPayWidth = boldFont.widthOfTextAtSize(netPayText, amountSize);

      page.drawText(netPayText, {
        x: centerX - netPayWidth / 2,
        y: sectionY + 15, // padding from bottom
        size: amountSize,
        font: boldFont,
        color: rgb(0.1, 0.3, 0.8),
      });


    y -= 70;

    // ===== PROFESSIONAL FOOTER =====
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 20;

    const footerText = "This is a computer generated payslip and does not require any signature or stamp.";
    page.drawText(footerText, {
      x: width / 2 - font.widthOfTextAtSize(footerText, 8) / 2,
      y,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    y -= 15;

    const confidentialText = " FOR AUTHORIZED USE ONLY";
    page.drawText(confidentialText, {
      x: width / 2 - font.widthOfTextAtSize(confidentialText, 9) / 2,
      y,
      size: 9,
      font: boldFont,
      color: rgb(0.7, 0.1, 0.1),
    });

    // ===== SAVE AND DOWNLOAD =====
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Payslip_${payslip.employeeName}_${payslip.period.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error("Professional PDF Generation Error:", err);
    throw new Error("Failed to generate professional payslip PDF");
  }
};

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getNotificationBgColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getNotificationTextColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-blue-800';
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];





  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Always render DashboardLayout to prevent flicker and show spinner only if loading.
  return (
    <DashboardLayout role="hr">
      <div className="min-h-screen bg-gray-50 p-6 relative">
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-white bg-opacity-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        {/* Error State */}
        {!loading && error && (
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
        )}
        {/* Payslip View */}
        {!loading && !error && showPayslip && (
          <div className="max-w-4xl mx-auto">
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
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedPayslip.companyName}
                    </h1>
                    <h2 className="text-lg font-semibold text-gray-700">
                      Pay slip For {selectedPayslip.period}
                    </h2>
                  </div>
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
                          <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">PF - UAN</td>
                          <td className="py-2 px-4 text-gray-900">{selectedPayslip.pfUan}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">Location</td>
                          <td className="py-2 px-4 text-gray-900">{selectedPayslip.location}</td>
                          <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">Department</td>
                          <td className="py-2 px-4 text-gray-900">{selectedPayslip.department}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">PF number</td>
                          <td className="py-2 px-4 text-gray-900">{selectedPayslip.pf_no}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
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
                  <div className="text-center text-gray-500 text-sm border-t border-gray-200 pt-4">
                    <p>** This is a computer generated payslip and does not require signature and stamp.</p>
                  </div>
                  <div className="mt-8 flex justify-center gap-4">
                    <button
                      onClick={() => downloadPDF(selectedPayslip)}
                      className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                    >
                      <Download className="h-5 w-5" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Main Content */}
        {!loading && !error && !showPayslip && (
          <>
            <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border shadow-lg transform transition-all duration-300 ease-in-out ${getNotificationBgColor(notification.type)}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className={`text-sm font-medium ${getNotificationTextColor(notification.type)}`}>
                        {notification.title}
                      </p>
                      <p className={`mt-1 text-sm ${getNotificationTextColor(notification.type)}`}>
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Employee Payslips</h1>
                <p className="text-gray-600">
                  {payslips.length > 0 
                    ? "Select an employee to view and download payslip" 
                    : "No payroll data available"}
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create New Payroll
              </button>
            </div>

            {payslips.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-lg">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Payroll Records Found</h3>
                <p className="text-gray-500 mb-6">There are no payroll records available at the moment.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  Create New Payroll
                </button>
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
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedPayslip(payslip);
                          setShowPayslip(true);
                        }}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        onClick={() => downloadPDF(payslip)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Create New Payroll</h3>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleCreatePayroll} className="p-6 space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Email *
                    </label>
                    <select
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.email} value={employee.email}>
                          {employee.fullname} ({employee.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="basic_salary" className="block text-sm font-medium text-gray-700 mb-1">
                      Basic Salary *
                    </label>
                    <input
                      type="number"
                      id="basic_salary"
                      name="basic_salary"
                      value={formData.basic_salary}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter basic salary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                        Month *
                      </label>
                      <select
                        id="month"
                        name="month"
                        value={formData.month}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Month</option>
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                        Year *
                      </label>
                      <select
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Year</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="pay_date" className="block text-sm font-medium text-gray-700 mb-1">
                        Pay Date
                      </label>
                      <input
                        type="date"
                        id="pay_date"
                        name="pay_date"
                        value={formData.pay_date}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={creating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {creating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Create Payroll
                        </>
                      )}
                    </button>
                  </div>




                </form>
              </div>
            </div>
          )}
        </>
        )}
      </div>
    </DashboardLayout>
  );
}