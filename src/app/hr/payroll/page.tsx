"use client";
import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
import { Plus, Eye, Download, X, CheckCircle, AlertCircle, Info } from "lucide-react";
// import {  eachDayOfInterval, isWeekend } from 'date-fns';

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
  stdDays: number;
  lopDays: number;
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
  date: string;
  check_in: string;
  check_out: string | null;
};

type AbsentData = {
  email: string;
  date: string;
  reason?: string;
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
  const [formData, setFormData] = useState<CreatePayrollForm>({
    email: "",
    basic_salary: "",
    month: "",
    year: new Date().getFullYear().toString(),
    status: "Paid",
    pay_date: new Date().toISOString().split('T')[0],
  });

  // Helper function to convert month name to index (0-11)
  const getMonthIndex = (monthName: string): number => {
    const months: { [key: string]: number } = {
      "january": 0, "february": 1, "march": 2, "april": 3, "may": 4, "june": 5,
      "july": 6, "august": 7, "september": 8, "october": 9, "november": 10, "december": 11
    };
    
    const monthIndex = months[monthName.toLowerCase()];
    
    if (monthIndex === undefined) {
      console.warn(`Invalid month name: ${monthName}, using current month as fallback`);
      return new Date().getMonth();
    }
    
    return monthIndex;
  };

  // Function to fetch STD days from attendance API
  const fetchSTDDays = useCallback(
    async (email: string, month: string, year: number): Promise<number> => {
      try {
        console.log(`📊 Fetching STD days for ${email} - ${month} ${year}`);
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/get_attendance/${encodeURIComponent(email)}/`
        );
        
        if (!response.ok) {
          console.warn(`❌ Failed to fetch attendance for ${email}`);
          return 22;
        }

        const attendanceData = await response.json();
        console.log(`✅ Raw attendance data for ${email}:`, attendanceData);

        let presentDays = 0;
        const monthIndex = getMonthIndex(month);
        
        if (Array.isArray(attendanceData)) {
          // Filter attendance for the specific month and year
          const monthAttendance = attendanceData.filter((record: Attendance) => {
            if (!record.date) return false;
            try {
              const recordDate = new Date(record.date);
              return recordDate.getMonth() === monthIndex && 
                     recordDate.getFullYear() === year &&
                     record.check_in && 
                     record.check_out;
            } catch {
              return false;
            }
          });
          presentDays = monthAttendance.length;
          console.log(`📈 Filtered ${monthAttendance.length} attendance records for ${month} ${year}`);
          
        } else if (attendanceData.present_days !== undefined) {
          presentDays = attendanceData.present_days;
        } else if (attendanceData.total_days !== undefined) {
          presentDays = attendanceData.total_days;
        } else if (typeof attendanceData === 'number') {
          presentDays = attendanceData;
        } else if (attendanceData.count !== undefined) {
          presentDays = attendanceData.count;
        }

        if (presentDays === 0) {
          console.log(`ℹ️ No attendance data found, using default 22 days for ${email}`);
          return 22;
        }

        console.log(`✅ Calculated STD days for ${email}: ${presentDays}`);
        return presentDays;

      } catch (error) {
        console.error(`🚨 Error fetching STD days for ${email}:`, error);
        return 22;
      }
    },
    []
  );

  // Function to fetch LOP days from absent API
  const fetchLOPDays = useCallback(
    async (email: string, month: string, year: number): Promise<number> => {
      try {
        console.log(`📊 Fetching LOP days for ${email} - ${month} ${year}`);
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/get_absent/${encodeURIComponent(email)}/`
        );
        
        if (!response.ok) {
          console.warn(`❌ Failed to fetch absent data for ${email}`);
          return 0;
        }

        const absentData = await response.json();
        console.log(`✅ Absent data for ${email}:`, absentData);

        let lopDays = 0;
        const monthIndex = getMonthIndex(month);
        
        if (Array.isArray(absentData)) {
          const monthAbsent = absentData.filter((record: AbsentData) => {
            if (!record.date) return false;
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === monthIndex && 
                   recordDate.getFullYear() === year;
          });
          lopDays = monthAbsent.length;
        } else if (absentData.absent_days !== undefined) {
          lopDays = absentData.absent_days;
        } else if (absentData.count !== undefined) {
          lopDays = absentData.count;
        }

        console.log(`📉 Calculated LOP days for ${email}: ${lopDays}`);
        return lopDays;

      } catch (error) {
        console.error(`🚨 Error fetching LOP days for ${email}:`, error);
        return 0;
      }
    },
    []
  );

  // Calculate total working days in a month
  // const calculateTotalWorkingDays = (month: string, year: number): number => {
  //   try {
  //     const monthIndex = getMonthIndex(month);
  //     if (monthIndex === -1) return 22;
  //     
  //     const firstDay = new Date(year, monthIndex, 1);
  //     const lastDay = new Date(year, monthIndex + 1, 0);
  //     
  //     const monthDates = eachDayOfInterval({
  //       start: firstDay,
  //       end: lastDay
  //     });
  //
  //     const workingDates = monthDates.filter(date => !isWeekend(date));
  //     return workingDates.length;
  //   } catch (error) {
  //     console.error("Error calculating total working days:", error);
  //     return 22;
  //   }
  // };

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
      console.log('🔄 Starting data fetch...');

      // Fetch employees
      const employeesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`
      );

      if (!employeesResponse.ok) {
        throw new Error('Failed to fetch employees');
      }

      const employeesData = await employeesResponse.json();
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      console.log('👥 Employees loaded:', employeesData.length);

      // Fetch payrolls
      const payrollsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_payrolls/`
      );

      if (!payrollsResponse.ok) {
        throw new Error('Failed to fetch payroll data');
      }

      const payrollsData = await payrollsResponse.json();
      console.log('💰 Payrolls loaded:', payrollsData.payrolls?.length || 0);

      if (payrollsData.payrolls && Array.isArray(payrollsData.payrolls)) {
        const transformedPayslips: PayslipData[] = await Promise.all(
          payrollsData.payrolls.map(async (payroll: PayrollAPIResponse) => {
            const employee = employeesData.find((emp: Employee) => emp.email === payroll.email);
            
            console.log(`🔄 Processing payroll for ${payroll.email} - ${payroll.month} ${payroll.year}`);
            
            // Fetch STD and LOP days for this employee and period
            const stdDays = await fetchSTDDays(payroll.email, payroll.month, parseInt(payroll.year));
            const lopDays = await fetchLOPDays(payroll.email, payroll.month, parseInt(payroll.year));            
            // Calculate earnings and deductions based on basic salary
            const basicSalary = payroll.basic_salary || 0;
            
            return {
              id: `${payroll.email}_${payroll.month}_${payroll.year}`,
              companyName: "GLOBAL TECH SOFTWARE SOLUTIONS",
              period: `${payroll.month} ${payroll.year}`,
              employeeId: employee?.emp_id?.toString() || "N/A",
              employeeName: employee?.fullname || payroll.email,
              bank: employee?.bank_name || "N/A",
              bankAccount: employee?.account_number||  "N/A",
              doj: employee?.date_joined || "N/A",
              pf_no: employee?.pf_no || "N/A",
              location: employee?.residential_address || "N/A",
              department: employee?.department || "N/A",
              pfUan: employee?.pf_uan || "N/A",
              stdDays,
              lopDays,
              earnings: {
                basic: basicSalary,
                houseRentAllowance: 0, // 40% of basic
                personalAllowance: 0,  // 20% of basic
                otherAllowance: 0,     // 10% of basic
                oncallShiftAllowance: 0, // 5% of basic
              },
              deductions: {
                providentFund: basicSalary * 0.12,     // 12% of basic
                professionalTax: 200,                  // Fixed amount
                esppContribution: 0,  // 2% of basic
              }
            };
          })
        );

        setPayslips(transformedPayslips);
        console.log('✅ Payslips transformed with STD/LOP data:', transformedPayslips.length);
      } else {
        setPayslips([]);
      }

    } catch (err: unknown) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setPayslips([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [fetchSTDDays, fetchLOPDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreatePayroll = async () => {
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

  const handleInputChange = (
    // e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
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
      page.drawRectangle({
        x: 0,
        y: height - 40,
        width: width,
        height: 40,
        color: rgb(0.1, 0.3, 0.6),
      });

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
        { label: "STD DAYS", value: payslip.stdDays.toString(), label2: "LOP DAYS", value2: payslip.lopDays.toString() },
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

      // Helper function to wrap text
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

      const rowHeight = 22;
      const startXLeft = 65;
      const startXRight = 330;
      const valueOffset = 110;
      const rightValueOffset = 120;
      const maxTextWidthLeft = 200;
      const maxTextWidthRight = 200;

      let currentY = y + 20;

      employeeDetails.forEach((row) => {
        const labelFontSize = 9;
        const valueFontSize = 9;

        const leftLines = wrapText(row.value || "-", font, valueFontSize, maxTextWidthLeft);
        const rightLines = wrapText(row.value2 || "-", font, valueFontSize, maxTextWidthRight);

        const rowLines = Math.max(leftLines.length, rightLines.length);
        const blockHeight = rowHeight + (rowLines - 1) * 10;

        currentY -= blockHeight;

        page.drawLine({
          start: { x: 50, y: currentY - 3 },
          end: { x: width - 50, y: currentY - 3 },
          thickness: 0.3,
          color: rgb(0.85, 0.9, 0.95),
        });

        // LEFT SIDE
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

        // RIGHT SIDE
        if (row.label2) {
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
        }
      });

      y -= detailsHeight + 30;

      // ===== EARNINGS & DEDUCTIONS SECTION =====
      const sectionHeaderY = y;
      
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

      const colHeaders = ["Description", "Amount"];
      page.drawText(colHeaders[0], { x: 60, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.4) });
      page.drawText(colHeaders[1], { x: 250, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.4) });
      
      page.drawText(colHeaders[0], { x: 330, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.4) });
      page.drawText(colHeaders[1], { x: 520, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.4) });

      y -= 15;

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

      page.drawLine({
        start: { x: 50, y },
        end: { x: 560, y },
        thickness: 1,
        color: rgb(0.6, 0.6, 0.7),
      });

      y -= 15;

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
      const sectionY = y - sectionHeight - 10;

      page.drawRectangle({
        x: 50,
        y: sectionY,
        width: width - 100,
        height: sectionHeight,
        color: rgb(0.9, 0.95, 1),
        borderWidth: 1.5,
        borderColor: rgb(0.2, 0.4, 0.8),
      });

      const centerX = width / 2;

      const titleText = "NET PAYABLE AMOUNT";
      const titleSize = 12;
      const titleWidth = boldFont.widthOfTextAtSize(titleText, titleSize);

      page.drawText(titleText, {
        x: centerX - titleWidth / 2,
        y: sectionY + sectionHeight - 20,
        size: titleSize,
        font: boldFont,
        color: rgb(0.1, 0.2, 0.6),
      });

      const netPayText = `Rs. ${formatCurrency(netPay)}`;
      const amountSize = 16;
      const netPayWidth = boldFont.widthOfTextAtSize(netPayText, amountSize);

      page.drawText(netPayText, {
        x: centerX - netPayWidth / 2,
        y: sectionY + 15,
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

  return (
    <DashboardLayout role="hr">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 relative">
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-white bg-opacity-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Error State */}
        {!loading && error && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-8 sm:py-16">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4 sm:mb-6 px-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Retry
              </button>
            </div>
          </div>
        )}

       {/* Payslip View */}
{!loading && !error && showPayslip && (
  <div className="max-w-4xl mx-auto">
    {/* Back Button */}
    <button
      onClick={() => setShowPayslip(false)}
      className="mb-4 sm:mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
    >
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Employee List
    </button>

    {selectedPayslip && (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
              {selectedPayslip.companyName}
            </h1>
            <h2 className="text-base sm:text-lg font-semibold text-gray-700">
              Pay slip For {selectedPayslip.period}
            </h2>
          </div>

          {/* Attendance Summary */}
          <div className="mb-4 sm:mb-6 bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
            <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2 sm:mb-3">Attendance Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
              <div>
                <p className="text-xs sm:text-sm text-blue-600">STD Days</p>
                <p className="text-lg sm:text-xl font-bold text-blue-800">{selectedPayslip.stdDays}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-red-600">LOP Days</p>
                <p className="text-lg sm:text-xl font-bold text-red-800">{selectedPayslip.lopDays}</p>
              </div>
            </div>
          </div>

          {/* Employee Details */}
          <div className="mb-6 sm:mb-8">
            {/* Table layout for larger screens */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse min-w-[500px]">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2 sm:px-4 font-semibold text-gray-700 bg-gray-50 w-1/4">Employee ID</td>
                    <td className="py-2 px-2 sm:px-4 text-gray-900 w-1/4">{selectedPayslip.employeeId}</td>
                    <td className="py-2 px-2 sm:px-4 font-semibold text-gray-700 bg-gray-50 w-1/4">Name</td>
                    <td className="py-2 px-2 sm:px-4 text-gray-900 w-1/4">{selectedPayslip.employeeName}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2 sm:px-4 font-semibold text-gray-700 bg-gray-50">Bank</td>
                    <td className="py-2 px-2 sm:px-4 text-gray-900">{selectedPayslip.bank}</td>
                    <td className="py-2 px-2 sm:px-4 font-semibold text-gray-700 bg-gray-50">Bank A/c No.</td>
                    <td className="py-2 px-2 sm:px-4 text-gray-900">{selectedPayslip.bankAccount}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2 sm:px-4 font-semibold text-gray-700 bg-gray-50">DOJ</td>
                    <td className="py-2 px-2 sm:px-4 text-gray-900">{selectedPayslip.doj}</td>
                    <td className="py-2 px-2 sm:px-4 font-semibold text-gray-700 bg-gray-50">PF - UAN</td>
                    <td className="py-2 px-2 sm:px-4 text-gray-900">{selectedPayslip.pfUan}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2 sm:px-4 font-semibold text-gray-700 bg-gray-50">Location</td>
                    <td className="py-2 px-2 sm:px-4 text-gray-900">{selectedPayslip.location}</td>
                    <td className="py-2 px-2 sm:px-4 font-semibold text-gray-700 bg-gray-50">Department</td>
                    <td className="py-2 px-2 sm:px-4 text-gray-900">{selectedPayslip.department}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2 sm:px-4 font-semibold text-gray-700 bg-gray-50">PF Number</td>
                    <td className="py-2 px-2 sm:px-4 text-gray-900">{selectedPayslip.pf_no}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Card layout for mobile */}
            <div className="grid sm:hidden gap-3">
              {[
                ["Employee ID", selectedPayslip.employeeId],
                ["Name", selectedPayslip.employeeName],
                ["Bank", selectedPayslip.bank],
                ["Bank A/c No.", selectedPayslip.bankAccount],
                ["DOJ", selectedPayslip.doj],
                ["PF - UAN", selectedPayslip.pfUan],
                ["Location", selectedPayslip.location],
                ["Department", selectedPayslip.department],
                ["PF Number", selectedPayslip.pf_no],
              ].map(([label, value], idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="text-gray-900 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings and Deductions */}
          <div className="mb-6 sm:mb-8">
            {/* Table for larger screens */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse border border-gray-300 min-w-[600px]">
                <thead>
                  <tr>
                    <th className="py-3 px-4 font-semibold text-gray-700 bg-gray-100 border border-gray-300 text-left">Earnings</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 bg-gray-100 border border-gray-300 text-right">Amount in Rs.</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 bg-gray-100 border border-gray-300 text-left">Deductions</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 bg-gray-100 border border-gray-300 text-right">Amount in Rs.</th>
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
                    <tr key={idx} className="border-b border-gray-300">
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
                    <td className="py-2 px-4 border border-gray-300">GROSS EARNINGS</td>
                    <td className="py-2 px-4 border border-gray-300 text-right">
                      {formatCurrency(Object.values(selectedPayslip.earnings).reduce((sum, a) => sum + Number(a || 0), 0))}
                    </td>
                    <td className="py-2 px-4 border border-gray-300">GROSS DEDUCTIONS</td>
                    <td className="py-2 px-4 border border-gray-300 text-right">
                      {formatCurrency(Object.values(selectedPayslip.deductions).reduce((sum, a) => sum + Number(a || 0), 0))}
                    </td>
                  </tr>
                  <tr className="bg-blue-50 font-bold">
                    <td className="py-2 px-4 border border-gray-300" colSpan={2}></td>
                    <td className="py-2 px-4 border border-gray-300">NET PAY</td>
                    <td className="py-2 px-4 border border-gray-300 text-right text-blue-700">
                      {formatCurrency(
                        Object.values(selectedPayslip.earnings).reduce((sum, a) => sum + Number(a || 0), 0) -
                        Object.values(selectedPayslip.deductions).reduce((sum, a) => sum + Number(a || 0), 0)
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Card layout for mobile */}
            <div className="grid sm:hidden gap-3">
              {Object.entries(selectedPayslip.earnings).map(([key, value], idx) => (
                <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-gray-600 text-xs">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-gray-900 text-sm font-semibold">{formatCurrency(Number(value))}</p>
                </div>
              ))}
              {Object.entries(selectedPayslip.deductions).map(([key, value], idx) => (
                <div key={`ded-${idx}`} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-gray-600 text-xs">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-gray-900 text-sm font-semibold">{formatCurrency(Number(value))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-xs sm:text-sm border-t border-gray-200 pt-3 sm:pt-4">
            <p>** This is a computer generated payslip and does not require signature and stamp.</p>
          </div>

          {/* Download Button */}
          <div className="mt-6 sm:mt-8 flex justify-center">
            <button
              onClick={() => downloadPDF(selectedPayslip)}
              className="bg-green-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2 text-sm sm:text-base"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
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
            <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 space-y-2 max-w-xs sm:max-w-sm w-full">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 sm:p-4 rounded-lg border shadow-lg transform transition-all duration-300 ease-in-out ${getNotificationBgColor(notification.type)}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="ml-2 sm:ml-3 flex-1">
                      <p className={`text-xs sm:text-sm font-medium ${getNotificationTextColor(notification.type)}`}>
                        {notification.title}
                      </p>
                      <p className={`mt-1 text-xs sm:text-sm ${getNotificationTextColor(notification.type)}`}>
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="ml-2 sm:ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8">
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">Employee Payslips</h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {payslips.length > 0 
                      ? "Select an employee to view and download payslip" 
                      : "No payroll data available"}
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  Create New Payroll
                </button>
              </div>

              {payslips.length === 0 ? (
                <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-lg">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No Payroll Records Found</h3>
                  <p className="text-gray-500 mb-4 sm:mb-6 px-4">There are no payroll records available at the moment.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2 mx-auto text-sm sm:text-base"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    Create New Payroll
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {payslips.map((payslip) => (
                    <div
                      key={payslip.id}
                      className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 line-clamp-1">{payslip.employeeName}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{payslip.employeeId}</p>
                        <p className="text-xs sm:text-sm text-blue-600 font-medium mt-1">{payslip.period}</p>
                      </div>

                      {/* Attendance Summary in Card */}
                      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div>
                            <p className="text-blue-600 font-medium">STD</p>
                            <p className="font-bold text-blue-800 text-sm sm:text-base">{payslip.stdDays}</p>
                          </div>
                          <div>
                            <p className="text-red-600 font-medium">LOP</p>
                            <p className="font-bold text-red-800 text-sm sm:text-base">{payslip.lopDays}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                        <div className="flex justify-between">
                          <span>Department:</span>
                          <span className="font-medium text-right max-w-[60%] line-clamp-1">{payslip.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <span className="font-medium text-right max-w-[60%] line-clamp-1">{payslip.location}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:gap-3">
                        <button
                          onClick={() => {
                            setSelectedPayslip(payslip);
                            setShowPayslip(true);
                          }}
                          className="flex-1 bg-blue-600 text-white py-2 px-2 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          View
                        </button>
                        <button
                          onClick={() => downloadPDF(payslip)}
                          className="flex-1 bg-green-600 text-white py-2 px-2 sm:px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                          PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Payroll Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Create New Payroll</h3>
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleCreatePayroll} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
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
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
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
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        placeholder="Enter basic salary"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
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
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
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
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                        disabled={creating}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creating}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                      >
                        {creating ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-white"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
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

      {/* Responsive CSS */}
      <style jsx>{`
        @media (max-width: 640px) {
          .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
        
        @media (max-width: 480px) {
          .min-w-\[500px\] {
            min-width: 100%;
          }
          
          .min-w-\[600px\] {
            min-width: 100%;
          }
        }
        
        /* Ensure tables are scrollable on mobile */
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </DashboardLayout>
  );
}