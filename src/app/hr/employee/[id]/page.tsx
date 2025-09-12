"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

type Employee = {
  id: number;
  employeeName: string;
  joinDate: string;
  monthlySalary: number;
  paymentDate: string;
};

export default function EmployeeDetailsPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [offboardReason, setOffboardReason] = useState("");
  const [lastDay, setLastDay] = useState(new Date().toISOString().split("T")[0]);
  const [confirmOffboard, setConfirmOffboard] = useState(false);
  const [showOffboardModal, setShowOffboardModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    // Simulate fetching employee data
    setTimeout(() => {
      const emp: Employee = {
        id: 12345,
        employeeName: "Sarah Johnson",
        joinDate: "2022-03-15",
        monthlySalary: 6500,
        paymentDate: "2023-09-28",
      };
      setEmployee(emp);
      setLoading(false);
    }, 1500);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const generateSalaryReport = () => {
    if (!employee) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Employee Salary Report", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Employee ID: ${employee.id}`, 20, 40);
    doc.text(`Employee Name: ${employee.employeeName}`, 20, 50);
    doc.text(`Join Date: ${formatDate(employee.joinDate)}`, 20, 60);
    doc.text(`Monthly Salary: ${formatCurrency(employee.monthlySalary)}`, 20, 70);
    doc.save(`${employee.employeeName}_Salary_Report.pdf`);
    showNotification("Salary report generated successfully", "success");
  };

  const generateOffboardingReport = () => {
    if (!employee) return;
    if (!offboardReason || !lastDay || !confirmOffboard) {
      showNotification("Please fill all required fields", "error");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Employee Offboarding Report", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Employee ID: ${employee.id}`, 20, 40);
    doc.text(`Employee Name: ${employee.employeeName}`, 20, 50);
    doc.text(`Last Working Day: ${formatDate(lastDay)}`, 20, 60);
    doc.text(`Reason: ${offboardReason}`, 20, 70);
    doc.save(`${employee.employeeName}_Offboarding_Report.pdf`);

    setNotification({ message: "Employee offboarded successfully", type: "success" });
    setShowOffboardModal(false);
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Calculate tenure
  const calculateTenure = (joinDate: string) => {
    const start = new Date(joinDate);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const months = now.getMonth() - start.getMonth();
    return `${years} years, ${months >= 0 ? months : months + 12} months`;
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div></div>;

  if (!employee) return <p>Employee not found</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Details</h1>
        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">Active</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div><span className="font-semibold">Employee ID:</span> {employee.id}</div>
        <div><span className="font-semibold">Full Name:</span> {employee.employeeName}</div>
        <div><span className="font-semibold">Join Date:</span> {formatDate(employee.joinDate)}</div>
        <div><span className="font-semibold">Monthly Salary:</span> {formatCurrency(employee.monthlySalary)}</div>
        <div><span className="font-semibold">Payment Date:</span> {formatDate(employee.paymentDate)}</div>
        <div><span className="font-semibold">Tenure:</span> {calculateTenure(employee.joinDate)}</div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <button className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300" onClick={() => window.history.back()}>Back</button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={generateSalaryReport}>Generate Salary Report</button>
        <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={() => setShowOffboardModal(true)}>Offboard Employee</button>
      </div>

      {/* Offboard Modal */}
      {showOffboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Offboard Employee</h2>
            <p className="mb-4">You are about to offboard <strong>{employee.employeeName}</strong>.</p>
            <textarea
              className="w-full border p-2 rounded mb-2"
              placeholder="Reason for offboarding"
              value={offboardReason}
              onChange={(e) => setOffboardReason(e.target.value)}
            />
            <input
              type="date"
              className="w-full border p-2 rounded mb-2"
              value={lastDay}
              onChange={(e) => setLastDay(e.target.value)}
            />
            <label className="flex items-center mb-4">
              <input type="checkbox" className="mr-2" checked={confirmOffboard} onChange={() => setConfirmOffboard(!confirmOffboard)} />
              I confirm offboarding
            </label>
            <div className="flex gap-4">
              <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setShowOffboardModal(false)}>Cancel</button>
              <button
                className={`px-4 py-2 rounded text-white ${confirmOffboard ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"}`}
                disabled={!confirmOffboard}
                onClick={generateOffboardingReport}
              >
                Confirm Offboarding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded text-white ${notification.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
