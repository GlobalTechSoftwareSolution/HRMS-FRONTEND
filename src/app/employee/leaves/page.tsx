"use client";
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Leave = {
  id: number;
  reason: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected";
  daysRequested: number;
  submittedDate: string;
};

export default function LeaveSection() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateBusinessDays = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let count = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    }
    
    return count;
  };

  const handleAddLeave = () => {
    if (!reason || !startDate || !endDate) {
      alert("Please fill all fields");
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      alert("End date cannot be before start date");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const daysRequested = calculateBusinessDays(startDate, endDate);
      
      const newLeave: Leave = {
        id: Date.now(), // Use timestamp for unique ID
        reason,
        startDate,
        endDate,
        status: "Pending",
        daysRequested,
        submittedDate: new Date().toISOString().split('T')[0]
      };

      setLeaves([newLeave, ...leaves]);
      setReason("");
      setStartDate("");
      setEndDate("");
      setIsSubmitting(false);
    }, 800);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: Leave["status"]) => {
    switch(status) {
      case "Approved": return "✓";
      case "Rejected": return "✗";
      default: return "⏳";
    }
  };

  return (
    <DashboardLayout role="employee">
          <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Leave Management</h2>
        <p className="text-gray-600">Request and track your time off</p>
      </div>

      {/* Add Leave Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
          <span className="mr-2">📋</span> New Leave Request
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
         <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
  <select
    value={reason}
    onChange={(e) => setReason(e.target.value)}
    className="border border-gray-300 rounded-md p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
  >
    <option value="">Select a reason</option>
    <option value="Vacation">Vacation</option>
    <option value="Medical Appointment">Medical Appointment</option>
    <option value="Personal Work">Personal Work</option>
    <option value="Sick Leave">Sick Leave</option>
    <option value="Other">Other</option>
  </select>
</div>

          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {startDate && endDate && (
              <span>
                {calculateBusinessDays(startDate, endDate)} business day(s)
              </span>
            )}
          </div>
          
          <button
            onClick={handleAddLeave}
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400 flex items-center"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">⏳</span> Processing...
              </>
            ) : (
              <>
                <span className="mr-2">+</span> Submit Request
              </>
            )}
          </button>
        </div>
      </div>

      {/* Leaves Summary */}
      {leaves.length > 0 && (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
            <span className="mr-2">📊</span> Leave Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-blue-600 font-semibold">
                {leaves.filter(l => l.status === "Pending").length}
              </div>
              <div className="text-sm text-gray-600">Pending Requests</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="text-green-600 font-semibold">
                {leaves.filter(l => l.status === "Approved").length}
              </div>
              <div className="text-sm text-gray-600">Approved Leaves</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="text-red-600 font-semibold">
                {leaves.filter(l => l.status === "Rejected").length}
              </div>
              <div className="text-sm text-gray-600">Rejected Requests</div>
            </div>
          </div>
        </div>
      )}

      {/* Display Leaves */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
          <span className="mr-2">📅</span> Leave History
        </h3>
        
        {leaves.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <div className="text-4xl mb-3">📋</div>
            <p>No leave requests yet</p>
            <p className="text-sm mt-1">Submit your first request above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                  <th className="pb-3">Reason</th>
                  <th className="pb-3">Period</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Submitted</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="font-medium text-gray-800">{leave.reason}</div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="text-gray-700">{formatDate(leave.startDate)}</div>
                      <div className="text-gray-400 text-sm">to {formatDate(leave.endDate)}</div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="text-gray-700">{leave.daysRequested} day(s)</div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="text-gray-600 text-sm">{formatDate(leave.submittedDate)}</div>
                    </td>
                    <td className="py-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        leave.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : leave.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        <span className="mr-1.5">{getStatusIcon(leave.status)}</span>
                        {leave.status}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  
  );
}