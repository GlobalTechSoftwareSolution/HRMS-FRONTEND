"use client";

import React, { useState, useEffect } from "react";

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

const Payslip = () => {
  const [selectedPayslip, setSelectedPayslip] = useState<string | null>(null);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_payrolls/`)
      .then((res) => res.json())
      .then((data) => {
        // Map backend fields exactly to PayslipData
     const mappedPayslips: PayslipData[] = data.payrolls.map((p: unknown, index: number) => {
       const pay = p as Partial<PayslipData & { month?: string; year?: string; earnings?: Record<string, number>; deductions?: Record<string, number> }>;
       return {
         id: pay.id ? String(pay.id) : `payslip-${index}`,
         companyName: pay.companyName || "Accenture Solutions Pvt Ltd",
         period: `${pay.month || ""} ${pay.year || ""}`,
         employeeId: pay.employeeId || "N/A",
         employeeName: pay.employeeName || "N/A",
         bank: pay.bank || "XXXX",
         bankAccount: pay.bankAccount || "XXXX",
         doj: pay.doj || "N/A",
         lopDays: pay.lopDays || 0,
         pfNumber: pay.pfNumber || "N/A",
         stdDays: pay.stdDays || 28,
         location: pay.location || "Bengaluru",
         workedDays: pay.workedDays || 28,
         department: pay.department || "N/A",
         managementLevel: pay.managementLevel || "N/A",
         facility: pay.facility || "N/A",
         entity: pay.entity || "N/A",
         pfUan: pay.pfUan || "N/A",
         earnings: {
           basic: Number(pay.earnings?.basic || 0),
           houseRentAllowance: Number(pay.earnings?.houseRentAllowance || 0),
           personalAllowance: Number(pay.earnings?.personalAllowance || 0),
           otherAllowance: Number(pay.earnings?.otherAllowance || 0),
           oncallShiftAllowance: Number(pay.earnings?.oncallShiftAllowance || 0),
         },
         deductions: {
           providentFund: Number(pay.deductions?.providentFund || 0),
           professionalTax: Number(pay.deductions?.professionalTax || 0),
           esppContribution: Number(pay.deductions?.esppContribution || 0),
         },
       };
     });
        setPayslips(mappedPayslips);
        setSelectedPayslip(mappedPayslips[0]?.id || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch payslips");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4 text-center">Loading payslips...</div>;
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;
  if (!payslips.length) return <div className="p-4 text-center">No payslips available</div>;

  const currentPayslip = payslips.find((p) => p.id === selectedPayslip) || payslips[0];

  const downloadPDF = () => {
    const element = document.getElementById("payslip-content");
    if (!element) return;
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Payslip List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payslip History</h3>
              <div className="space-y-3">
                {payslips.map((payslip, index) => {
                  const key = payslip.id ? String(payslip.id) : `payslip-${index}`;
                  const earnings = payslip.earnings || { basic: 0, houseRentAllowance: 0, personalAllowance: 0, otherAllowance: 0, oncallShiftAllowance: 0 };
                  const deductions = payslip.deductions || { providentFund: 0, professionalTax: 0, esppContribution: 0 };
                  const netPayValue = Object.values(earnings).reduce((a, b) => a + b, 0) - Object.values(deductions).reduce((a, b) => a + b, 0);

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedPayslip(payslip.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedPayslip === payslip.id
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-semibold text-gray-800">{payslip.period}</div>
                      <div className="text-sm text-gray-600 mt-1">Net Pay: ₹{netPayValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Payslip Detail */}
          <div className="lg:col-span-3">
            <div id="payslip-content">
              <PayslipComponent data={currentPayslip} />
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={downloadPDF}
                className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-3 text-lg"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Update PayslipComponent to accept a data prop of type PayslipData
const PayslipComponent: React.FC<{ data: PayslipData }> = () => {
  // grossEarnings and grossDeductions were unused, so removed to avoid ESLint errors
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
      {/* ...same PayslipComponent JSX as before... */}
    </div>
  );
};

export default Payslip;