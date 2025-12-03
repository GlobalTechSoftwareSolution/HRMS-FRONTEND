"use client";
import React, { useState, useEffect } from "react";

const ShiftViewer = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Define shift times
  const shiftTimes = {
    morning: { start: "08:00", end: "16:00" },
    afternoon: { start: "16:00", end: "00:00" },
    night: { start: "00:00", end: "08:00" }
  };

  // Generate dates for the selected month
  const generateMonthDates = () => {
    const year = parseInt(selectedMonth.split("-")[0]);
    const month = parseInt(selectedMonth.split("-")[1]) - 1; // JS months are 0-indexed
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  // Get day of week
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  // Check if date is weekend
  const isWeekend = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Shift Viewer</h1>
        

        
        {/* Month Selector */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-800">View Shifts</h2>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading employees...</p>
          </div>
        ) : (
          <>
            {/* Shift Calendar View */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Shift Schedule for {new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Morning Shift<br/>
                        <span className="text-gray-400 font-normal">{shiftTimes.morning.start} - {shiftTimes.morning.end}</span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Afternoon Shift<br/>
                        <span className="text-gray-400 font-normal">{shiftTimes.afternoon.start} - {shiftTimes.afternoon.end}</span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Night Shift<br/>
                        <span className="text-gray-400 font-normal">{shiftTimes.night.start} - {shiftTimes.night.end}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generateMonthDates().map((date) => (
                      <tr 
                        key={date} 
                        className={isWeekend(date) ? "bg-gray-50" : "even:bg-gray-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isWeekend(date) ? "text-red-600 font-medium" : "text-gray-500"}`}>
                          {getDayOfWeek(date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            {/* In a real implementation, you would show actual assigned employees */}
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              0 employees
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              0 employees
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              0 employees
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Shift Summary */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Shift Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Morning Shift Summary */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg mb-4">
                    <h3 className="font-semibold">Morning Shift</h3>
                    <p className="text-sm">{shiftTimes.morning.start} - {shiftTimes.morning.end}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Employees:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg. per day:</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </div>
                
                {/* Afternoon Shift Summary */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="bg-yellow-50 text-yellow-800 px-3 py-2 rounded-lg mb-4">
                    <h3 className="font-semibold">Afternoon Shift</h3>
                    <p className="text-sm">{shiftTimes.afternoon.start} - {shiftTimes.afternoon.end}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Employees:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg. per day:</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </div>
                
                {/* Night Shift Summary */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="bg-purple-50 text-purple-800 px-3 py-2 rounded-lg mb-4">
                    <h3 className="font-semibold">Night Shift</h3>
                    <p className="text-sm">{shiftTimes.night.start} - {shiftTimes.night.end}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Employees:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg. per day:</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShiftViewer;