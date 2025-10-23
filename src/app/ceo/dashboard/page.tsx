// app/ceo/dashboard/page.js
"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function CEODashboard() {
  const [selectedYear, setSelectedYear] = useState("2021-2022");

  // Financial data
  const financialData = {
    totalHours: "100",
    totalEmployees: "50",
    totalSales: "10",
    totalConversion: "1",
    paymentDone: "+4",
    paymentPending: "+1",
    cost: "+10000",
    grossProfit: "+10"
  };

  // Highlights data
  const highlights = [
    {
      title: "Last Sales",
      date: "16 Oct 2021",
      amount: "₹1000",
      icon: "💰"
    },
    {
      title: "Last Receipt", 
      date: "18 Oct 2021",
      amount: "₹1000",
      icon: "📥"
    },
    {
      title: "Last Purchase",
      date: "16 Oct 2021", 
      amount: "₹1000",
      icon: "🛒"
    },
    {
      title: "Last Payment",
      date: "13 Oct 2021",
      amount: "₹1000",
      icon: "📤"
    },
    {
      title: "Due Customers",
      count: "10",
      value: "₹1000",
      icon: "👥"
    }
  ];

  // Monthly trend data
  const monthlyTrend = [
    { month: "Apr", hours: 95, productivity: 65 },
    { month: "May", hours: 87, productivity: 72 },
    { month: "Jun", hours: 76, productivity: 68 },
    { month: "Jul", hours: 82, productivity: 75 },
    { month: "Aug", hours: 91, productivity: 70 },
    { month: "Sep", hours: 89, productivity: 78 },
    { month: "Oct", hours: 94, productivity: 80 },
    { month: "Nov", hours: 88, productivity: 74 },
    { month: "Dec", hours: 92, productivity: 76 },
    { month: "Jan", hours: 85, productivity: 71 },
    { month: "Feb", hours: 90, productivity: 77 },
    { month: "Mar", hours: 96, productivity: 82 }
  ];

  return (
    <DashboardLayout role="ceo">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Global Tech Software Solutions</h1>
              <div className="flex flex-wrap gap-4 text-blue-100">
                <span>2023 - 2024</span>
                <span>•</span>
                <span>01-04-2024 to 31-03-2025</span>
              </div>
            </div>
            <div className="mt-4 lg:mt-0">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-blue-500 border border-blue-400 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="2021-2022">2023-2024</option>
                <option value="2020-2021">2024-2025</option>
                <option value="2019-2020">2025-2026</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Sales */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Hours</h3>
              <div className="text-green-500 text-2xl">📈</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{financialData.totalHours}</div>
            <div className="text-sm text-green-600 font-medium">+12.5% from last year</div>
          </div>

          {/* Total Receipt */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Employees</h3>
              <div className="text-blue-500 text-2xl">💳</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{financialData.totalEmployees}</div>
            <div className="text-sm text-blue-600 font-medium">+8.3% from last year</div>
          </div>

          {/* Total Purchase */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Sales</h3>
              <div className="text-orange-500 text-2xl">🛒</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">₹{financialData.totalSales}</div>
            <div className="text-sm text-orange-600 font-medium">+15.2% from last year</div>
          </div>

          {/* Total Payment */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Conversion</h3>
              <div className="text-purple-500 text-2xl">💸</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">₹{financialData.totalConversion}</div>
            <div className="text-sm text-purple-600 font-medium">+9.7% from last year</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statistics Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-3">Financial Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sales Credit Note */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Payment done</h3>
                  <div className="text-green-600 text-lg">📋</div>
                </div>
                <div className="text-2xl font-bold text-green-800">{financialData.paymentDone}</div>
              </div>

              {/* Purchase Debit Note */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Payment pending</h3>
                  <div className="text-red-600 text-lg">📄</div>
                </div>
                <div className="text-2xl font-bold text-red-800">{financialData.paymentPending}</div>
              </div>

              {/* Cost */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Operating Cost</h3>
                  <div className="text-orange-600 text-lg">⚡</div>
                </div>
                <div className="text-2xl font-bold text-orange-800">{financialData.cost}</div>
              </div>

              {/* Gross Profit */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Gross Profit</h3>
                  <div className="text-purple-600 text-lg">💰</div>
                </div>
                <div className="text-2xl font-bold text-purple-800">{financialData.grossProfit}</div>
              </div>
            </div>

            {/* Sales vs Purchase Chart */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Working hours vs Productivity Trend</h3>
              <div className="h-64 flex items-end justify-between space-x-2">
                {monthlyTrend.map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    <div className="flex flex-col items-center space-y-1 w-full">
                      <div 
                        className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-all duration-300 group-hover:shadow-lg"
                        style={{ height: `${item.hours}%` }}
                        title={`Hours: ${item.hours}%`}
                      ></div>
                      <div 
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all duration-300 group-hover:shadow-lg"
                        style={{ height: `${item.productivity}%` }}
                        title={`Productivity: ${item.productivity}%`}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 mt-2 font-medium">{item.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center space-x-6 mt-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  <span className="text-gray-600">Sales</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                  <span className="text-gray-600">Purchase</span>
                </div>
              </div>
            </div>
          </div>

          {/* Highlights Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-3">Recent Highlights</h2>
            <div className="space-y-4">
              {highlights.map((highlight, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="text-2xl">{highlight.icon}</div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{highlight.title}</h4>
                          <p className="text-xs text-gray-500">{highlight.date}</p>
                        </div>
                      </div>
                      {highlight.amount && (
                        <p className="text-lg font-bold text-green-700">{highlight.amount}</p>
                      )}
                      {highlight.count && (
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-700">{highlight.count} Customers</span>
                          <span className="text-sm font-semibold text-gray-700">{highlight.value}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200">
                  Generate Report
                </button>
                <button className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200">
                  Export Data
                </button>
                <button className="bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200">
                  View Analytics
                </button>
                <button className="bg-orange-100 hover:bg-orange-200 text-orange-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200">
                  Schedule Meeting
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">₹100</div>
              <div className="text-gray-300">Net Flow</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">10%</div>
              <div className="text-gray-300">Profit Margin</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">3%</div>
              <div className="text-gray-300">Quarterly Growth</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}