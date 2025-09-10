"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  FiUsers, FiFileText, FiPieChart, FiTrendingUp, FiArrowUp, FiArrowDown,
  FiCalendar, FiBell, FiSearch, FiMoreVertical
} from "react-icons/fi";
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Types
interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
}

interface DashboardData {
  totalEmployees: number;
  totalReports: number;
  pendingReports: number;
  completedReports: number;
  employeeGrowth: number;
  reportCompletionRate: number;
}

export default function OverviewPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalEmployees: 0,
    totalReports: 0,
    pendingReports: 0,
    completedReports: 0,
    employeeGrowth: 0,
    reportCompletionRate: 0,
  });

  const [performanceData, setPerformanceData] = useState<ChartData<'bar'>>({ datasets: [], labels: [] });
  const [departmentDistribution, setDepartmentDistribution] = useState<ChartData<'pie'>>({ datasets: [], labels: [] });
  const [reportTrends, setReportTrends] = useState<ChartData<'line'>>({ datasets: [], labels: [] });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Simulate dynamic updates
  useEffect(() => {
    const fetchData = () => {
      // Simulate fetching data from API
      setDashboardData(prev => ({
        totalEmployees: prev.totalEmployees + Math.floor(Math.random() * 3), // new employees auto-added
        totalReports: prev.totalReports + Math.floor(Math.random() * 5),
        pendingReports: Math.max(0, prev.pendingReports + Math.floor(Math.random() * 2) - 1),
        completedReports: prev.completedReports + Math.floor(Math.random() * 4),
        employeeGrowth: parseFloat((Math.random() * 10).toFixed(1)),
        reportCompletionRate: parseFloat((Math.random() * 100).toFixed(1)),
      }));

      setPerformanceData({
        labels: ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [
          { label:'Productivity', data:[85,78,90,88,94,92], backgroundColor:'rgba(54,162,235,0.5)', borderColor:'rgb(54,162,235)', borderWidth:2 },
          { label:'Efficiency', data:[72,80,75,82,86,90], backgroundColor:'rgba(75,192,192,0.5)', borderColor:'rgb(75,192,192)', borderWidth:2 }
        ]
      });

      setDepartmentDistribution({
        labels:['Engineering','Marketing','Sales','HR','Operations'],
        datasets:[{ data:[35,20,18,12,15], backgroundColor:['rgba(255,99,132,0.7)','rgba(54,162,235,0.7)','rgba(255,206,86,0.7)','rgba(75,192,192,0.7)','rgba(153,102,255,0.7)'], borderWidth:1 }]
      });

      setReportTrends({
        labels:['Jan','Feb','Mar','Apr','May','Jun'],
        datasets:[
          { label:'Reports Submitted', data:[42,48,50,55,60,65], borderColor:'rgb(54,162,235)', backgroundColor:'rgba(54,162,235,0.1)', fill:true, tension:0.4 },
          { label:'Reports Completed', data:[38,42,45,50,58,62], borderColor:'rgb(75,192,192)', backgroundColor:'rgba(75,192,192,0.1)', fill:true, tension:0.4 }
        ]
      });

      setNotifications(prev => [
        { id: prev.length + 1, message:'New employee joined the team', time:'Just now', read:false },
        ...prev
      ]);

      setUnreadNotifications(prev => prev + 1);
    };

    // Fetch initially
    fetchData();

    // Auto-refresh every 10 seconds to simulate live updates
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Chart Options
  const barOptions: ChartOptions<'bar'> = { responsive:true, plugins:{ legend:{position:'top'} }, scales:{ y:{ beginAtZero:true, max:100, ticks:{ callback:(v)=>`${v}%` } } } };
  const lineOptions: ChartOptions<'line'> = { responsive:true, plugins:{legend:{position:'top'}}, scales:{y:{beginAtZero:true}} };

  const markNotificationAsRead = (id:number) => {
    setNotifications(notifications.map(n => n.id===id ? {...n, read:true} : n));
    setUnreadNotifications(prev => Math.max(prev-1,0));
  };

  return (
    <DashboardLayout role="ceo">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">CEO Dashboard</h1>
            <p className="text-gray-600 text-sm sm:text-base">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex flex-row items-center space-x-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <FiSearch className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="relative">
              <FiBell className="text-gray-600 text-xl cursor-pointer" />
              {unreadNotifications>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">{unreadNotifications}</span>}
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">JD</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          {[
            { label:'Total Employees', value:dashboardData.totalEmployees, icon:<FiUsers className="text-blue-500 text-xl"/>, growth:dashboardData.employeeGrowth, bg:'bg-blue-50', arrow:dashboardData.employeeGrowth>0 ? <FiArrowUp className="text-green-500 mr-1"/> : <FiArrowDown className="text-red-500 mr-1"/> },
            { label:'Total Reports', value:dashboardData.totalReports, icon:<FiFileText className="text-green-500 text-xl"/>, growth:15, bg:'bg-green-50', arrow:<FiArrowUp className="text-green-500 mr-1"/> },
            { label:'Pending Reports', value:dashboardData.pendingReports, icon:<FiPieChart className="text-yellow-500 text-xl"/>, growth:8, bg:'bg-yellow-50', arrow:<FiArrowDown className="text-red-500 mr-1"/> },
            { label:'Completion Rate', value:dashboardData.reportCompletionRate, icon:<FiTrendingUp className="text-purple-500 text-xl"/>, growth:5.2, bg:'bg-purple-50', arrow:<FiArrowUp className="text-green-500 mr-1"/> },
          ].map((stat,i)=>(
            <div key={i} className={`bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}{stat.label==='Completion Rate' ? '%' : ''}</p>
                  <div className="flex items-center mt-1 text-sm">{stat.arrow}<span className={stat.growth>0 ? 'text-green-500' : 'text-red-500'}>{stat.growth}% from last period</span></div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Performance Metrics</h2>
              <div className="flex items-center text-sm text-gray-500"><span className="mr-2">Last 6 months</span><FiCalendar/></div>
            </div>
            <div className="h-64 sm:h-80"><Bar data={performanceData} options={barOptions}/></div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Department Distribution</h2>
              <div className="flex items-center text-sm text-gray-500"><span className="mr-2">By headcount</span><FiMoreVertical/></div>
            </div>
            <div className="h-64 sm:h-80 flex items-center justify-center"><Pie data={departmentDistribution} options={{ responsive:true, maintainAspectRatio:false }}/></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Report Trends</h2>
              <div className="flex items-center text-sm text-gray-500"><span className="mr-2">Last 6 months</span><FiCalendar/></div>
            </div>
            <div className="h-64 sm:h-80"><Line data={reportTrends} options={lineOptions}/></div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Recent Notifications</h2>
            <button className="text-blue-500 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {notifications.map(n => (
              <div key={n.id} className={`p-3 sm:p-4 rounded-lg border flex justify-between items-center ${n.read ? 'border-gray-100 bg-gray-50' : 'border-blue-100 bg-blue-50'}`} onClick={()=>!n.read && markNotificationAsRead(n.id)}>
                <div>
                  <p className={`font-medium ${n.read ? 'text-gray-700' : 'text-gray-800'}`}>{n.message}</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">{n.time}</p>
                </div>
                {!n.read && <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
