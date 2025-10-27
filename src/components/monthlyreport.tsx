'use client';
import React, { useState, useEffect } from 'react';

// TypeScript interfaces for data structures
interface Task {
  id: number | string;
  name?: string;
  title?: string;
  task_name?: string;
  status?: string;
  state?: string;
  completed_date?: string;
  date?: string;
  created_at?: string;
  assigned_to?: number | string;
  owner?: string;
  email?: string;
  [key: string]: unknown;
}

interface Attendance {
  id?: number | string;
  date?: string;
  attendance_date?: string;
  timestamp?: string;
  check_in?: string;
  check_out?: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  worked_hours?: number;
  hours?: number;
  attendance_percentage?: number;
  present?: boolean;
  employee_id?: number | string;
  employee_name?: string;
  employee_email?: string;
  email?: string;
  [key: string]: unknown;
}

interface Employee {
  id: number | string;
  name?: string;
  email?: string;
  position?: string;
  department?: string;
  join_date?: string;
  phone?: string;
  status?: string;
  profile_picture?: string;
  [key: string]: unknown;
}

interface Report {
  id?: number | string;
  title?: string;
  name?: string;
  date?: string;
  [key: string]: unknown;
}

interface AbsentRecord {
  id?: number | string;
  date?: string;
  absent_date?: string;
  reason?: string;
  email?: string;
  fullname?: string;
  department?: string;
  [key: string]: unknown;
}

interface MonthlyReportData {
  employees: Employee[];
  attendance: Attendance[];
  leaves: unknown[];
  reports: Report[];
  tasks: Task[];
  absent: AbsentRecord[];
}

const MonthlyReportDashboard = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeReport, setShowEmployeeReport] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<MonthlyReportData>({
    employees: [],
    attendance: [],
    leaves: [],
    reports: [],
    tasks: [],
    absent: [],
  });
  const [loading, setLoading] = useState(true);
  const [employeeAttendanceData, setEmployeeAttendanceData] = useState<{[key: string]: Attendance[]}>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const endpoints = [
          'employees/',
          'list_leaves/',
          'list_reports/',
          'list_tasks/',
        ];

        const baseURL = 'https://globaltechsoftwaresolutions.cloud/api/accounts/';

        // Fetch main endpoints
        const responses = await Promise.all(
          endpoints.map(ep => fetch(`${baseURL}${ep}`))
        );

        // Check if any response failed
        for (let i = 0; i < responses.length; i++) {
          if (!responses[i].ok) {
            throw new Error(`Failed to fetch ${endpoints[i]}: ${responses[i].status}`);
          }
        }

        const responsesData = await Promise.all(responses.map(r => r.json()));

        const employeesRaw = responsesData[0];
        const leavesRaw = responsesData[1];
        const reportsRaw = responsesData[2];
        const tasksRaw = responsesData[3];

        // Employees mapping: strictly use emp_id for id and designation for position, remove status
        const employees: Employee[] = (Array.isArray(employeesRaw) ? employeesRaw : employeesRaw.results || employeesRaw.data || [])
          .map((emp: Record<string, unknown>) => {
            // Remove status from the mapped employee object
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { status, ...rest } = emp;
            return {
              ...rest,
              id: emp.emp_id as number | string, // strictly use emp_id from API
              name: (emp.fullname as string) || 'Unknown Employee',
              position: emp.designation as string, // strictly use designation from API
              join_date: (emp.date_joined as string) || null,
              profile_picture: emp.profile_picture && emp.profile_picture !== ''
                ? (emp.profile_picture as string)
                : 'https://via.placeholder.com/150?text=User'
            };
          });
        const leaves = Array.isArray(leavesRaw) ? leavesRaw : leavesRaw.results || leavesRaw.data || [];
        const reports = Array.isArray(reportsRaw) ? reportsRaw : reportsRaw.results || reportsRaw.data || [];
        
        // Tasks: ensure tasks array is under tasks
        let tasks: Task[] = [];
        if (Array.isArray(tasksRaw)) {
          tasks = tasksRaw;
        } else if (Array.isArray(tasksRaw.tasks)) {
          tasks = tasksRaw.tasks;
        } else if (Array.isArray(tasksRaw.results)) {
          tasks = tasksRaw.results;
        } else if (Array.isArray(tasksRaw.data)) {
          tasks = tasksRaw.data;
        }

        // Process task names to handle empty names
        tasks = tasks.map((task: Task) => ({
          ...task,
          name: task.name || task.title || task.task_name || `Task ${task.id}`
        }));

        // Fetch attendance data for each employee
        const attendanceMap: { [key: string]: Attendance[] } = {};
        
        // Fetch attendance for each employee with email
        for (const employee of employees) {
          if (employee.email) {
            try {
              const attendanceResponse = await fetch(`${baseURL}get_attendance/${employee.email}/`);
              if (attendanceResponse.ok) {
                const attendanceJson = await attendanceResponse.json();
                attendanceMap[employee.email] = (attendanceJson.attendance || []) as Attendance[];
              }
            } catch {
              console.warn(`Failed to fetch attendance for ${employee.email}`);
              attendanceMap[employee.email] = [];
            }
          }
        }

        // Fetch absences (new endpoint) - FIXED: Properly handle the absent data
        let absent: AbsentRecord[] = [];
        try {
          const absentResp = await fetch(`${baseURL}list_absent/`);
          if (!absentResp.ok) throw new Error(`Failed to fetch list_absent/: ${absentResp.status}`);
          const absentData = await absentResp.json();
          
          // Handle the API response format properly
          if (Array.isArray(absentData)) {
            absent = absentData as AbsentRecord[];
          } else if (absentData.results && Array.isArray(absentData.results)) {
            absent = absentData.results as AbsentRecord[];
          } else if (absentData.data && Array.isArray(absentData.data)) {
            absent = absentData.data as AbsentRecord[];
          } else {
            // If it's an object with array data, try to find any array property
            const arrayKeys = Object.keys(absentData).filter(key => Array.isArray(absentData[key]));
            if (arrayKeys.length > 0) {
              absent = absentData[arrayKeys[0]] as AbsentRecord[];
            } else {
              absent = [];
            }
          }
          
          console.log('Fetched absent records:', absent.length, absent);
        } catch (error) {
          console.warn("Failed to fetch absences:", error);
          absent = [];
        }

        setEmployeeAttendanceData(attendanceMap);
        setData({ 
          employees: employees || [], 
          attendance: [], // We're using individual attendance endpoints now
          leaves: leaves || [], 
          reports: reports || [], 
          tasks: tasks || [], 
          absent: absent || [],
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle employee click
  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeReport(true);
  };

  // Close employee report dialog
  const closeEmployeeReport = () => {
    setShowEmployeeReport(false);
    setSelectedEmployee(null);
  };

  // Months for dropdown
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate a 6-year range centered around the current year for dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

  // Get unique departments from employees
  const departments = ['All Departments', ...new Set(data.employees
    .map(emp => emp.department)
    .filter(dept => dept && dept !== '')
  )];

  // Filter employees by department and search
  const filteredEmployees = data.employees.filter(employee => {
    const matchesDept = selectedDept === 'All Departments' || employee.department === selectedDept;
    const matchesSearch = searchQuery === '' || 
      employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesDept && matchesSearch;
  });

  // Calculate employee-specific metrics using individual attendance endpoints
  const getEmployeeMetrics = (employee: Employee) => {
    // Find tasks for this employee by email
    const employeeTasks = data.tasks.filter(task => {
      return task.email === employee.email || task.assigned_to === employee.email;
    });

    const completedTasks = employeeTasks.filter(task => {
      const statusStr = (task.status || '').toLowerCase();
      return statusStr === 'completed' || statusStr === 'done';
    }).length;

    // Get attendance data from individual endpoint
    const employeeAttendance = employeeAttendanceData[employee.email || ''] || [];

    // Calculate worked hours from check_in and check_out
    let totalHours = 0;
    let validAttendanceRecords = 0;

    for (const record of employeeAttendance as Attendance[]) {
      if (record.check_in && record.check_out) {
        try {
          // Parse time strings (format: "HH:MM:SS.milliseconds")
          const [checkInTime] = record.check_in.split('.');
          const [checkOutTime] = record.check_out.split('.');
          
          const [inHours, inMinutes, inSeconds] = checkInTime.split(':').map(Number);
          const [outHours, outMinutes, outSeconds] = checkOutTime.split(':').map(Number);
          
          const checkInTotalMinutes = inHours * 60 + inMinutes + inSeconds / 60;
          const checkOutTotalMinutes = outHours * 60 + outMinutes + outSeconds / 60;
          
          let diffMinutes = checkOutTotalMinutes - checkInTotalMinutes;
          
          // Handle overnight shifts (if check_out is earlier than check_in, assume next day)
          if (diffMinutes < 0) {
            diffMinutes += 24 * 60; // Add 24 hours
          }
          
          const diffHours = diffMinutes / 60;
          
          // Only count reasonable work hours (0.5-16 hours per day)
          if (diffHours >= 0.5 && diffHours <= 16) {
            totalHours += diffHours;
            validAttendanceRecords++;
          }
        } catch {
          console.warn('Invalid time format for attendance record:', record);
        }
      }
    }

    // Calculate average hours per valid attendance day
    const avgHours = validAttendanceRecords > 0 ? (totalHours / validAttendanceRecords).toFixed(1) : '0.0';

    // Total attendance days (unique dates)
    const totalAttendanceDays = employeeAttendance.length;

    // Productivity: percent of completed tasks
    const productivity = employeeTasks.length > 0 ? Math.round((completedTasks / employeeTasks.length) * 100) : 0;

    return {
      totalTasks: employeeTasks.length,
      completedTasks,
      pendingTasks: employeeTasks.length - completedTasks,
      productivity,
      avgWorkingHours: avgHours,
      attendanceRecords: totalAttendanceDays,
      totalHours: totalHours.toFixed(1),
      validAttendanceRecords
    };
  };

  // Get employee tasks for display
  const getEmployeeTasks = (employee: Employee) => {
    return data.tasks
      .filter(task => task.email === employee.email || task.assigned_to === employee.email)
      .map(task => ({
        ...task,
        displayName: task.name || task.title || task.task_name || `Task ${task.id}`,
        displayDate: String(task.date || task.completed_date || task.created_at || task.updated_at || '')
      }))
      .sort((a, b) => {
        const dateA = a.displayDate ? new Date(String(a.displayDate)).getTime() : 0;
        const dateB = b.displayDate ? new Date(String(b.displayDate)).getTime() : 0;
        return dateB - dateA;
      });
  };

  // Get employee attendance for display, filtered by selected month and year
  const getEmployeeAttendance = (employee: Employee) => {
    const allAttendance = employeeAttendanceData[employee.email || ''] || [];
    return allAttendance.filter((record: Attendance) => {
      if (!record.date) return false;
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
    });
  };

  // Get employee absences for display, filtered by selected month and year
  const getEmployeeAbsences = (employee: Employee) => {
    return data.absent.filter((absence: AbsentRecord) => {
      // Match by email or fullname
      const matchesEmployee = absence.email === employee.email || 
                            absence.fullname === employee.name;
      
      if (!matchesEmployee) return false;
      
      // Filter by date and selected month/year
      const dateStr = absence.date || absence.absent_date;
      if (!dateStr) return false;
      
      const absenceDate = new Date(dateStr);
      return absenceDate.getMonth() === selectedMonth && 
             absenceDate.getFullYear() === selectedYear;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Team Performance Dashboard</h1>
        <p className="text-gray-600">
          {data.employees.length} employees loaded • {data.absent.length} absence records • Tech team attendance and task tracking
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Search Bar */}
        <div className="flex-1 min-w-[200px]">
          <input 
            type="text"
            placeholder="Search employees by name, position, department, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Department Filter */}
        <select 
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {departments.map(dept => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        
        {/* Month Selector */}
        <select 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {months.map((month, index) => (
            <option key={month} value={index}>
              {month}
            </option>
          ))}
        </select>

        {/* Year Selector */}
        <select 
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {years.map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Period Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900">
          Viewing data for {months[selectedMonth]} {selectedYear}
        </h3>
        <p className="text-blue-700 text-sm">
          {filteredEmployees.length} employees found
          {selectedDept !== 'All Departments' && ` in ${selectedDept}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.map((employee: Employee) => {
          const metrics = getEmployeeMetrics(employee);
          const absences = getEmployeeAbsences(employee);
          
          return (
            <div 
              key={employee.id}
              onClick={() => handleEmployeeClick(employee)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer transition-all hover:shadow-md hover:border-blue-300"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={employee.profile_picture as string} 
                    alt={employee.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=User';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 truncate">
                    {employee.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {employee.position || 'No Position'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {employee.department || 'No Department'}
                  </p>
                  {employee.email && (
                    <p className="text-xs text-gray-400 truncate">
                      {employee.email}
                    </p>
                  )}
                  {absences.length > 0 && (
                    <p className="text-xs text-red-500 font-medium mt-1">
                      {absences.length} absence{absences.length > 1 ? 's' : ''} this month
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-xs text-blue-600">Tasks</p>
                  <p className="text-sm font-bold text-gray-900">
                    {metrics.completedTasks}/{metrics.totalTasks}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-xs text-green-600">Avg Hours</p>
                  <p className="text-sm font-bold text-gray-900">{metrics.avgWorkingHours}h</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2">
                  <p className="text-xs text-purple-600">Productivity</p>
                  <p className="text-sm font-bold text-gray-900">{metrics.productivity}%</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2">
                  <p className="text-xs text-yellow-600">Attendance</p>
                  <p className="text-sm font-bold text-gray-900">{metrics.attendanceRecords} days</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results Message */}
      {filteredEmployees.length === 0 && data.employees.length > 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600">
            {searchQuery 
              ? `No employees match "${searchQuery}" in ${selectedDept}`
              : `No employees in ${selectedDept}`
            }
          </p>
        </div>
      )}

      {/* No Employees Message */}
      {data.employees.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600">No employee data available from the API</p>
        </div>
      )}

      {/* Employee Monthly Report Dialog */}
      {showEmployeeReport && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">Employee Performance Report</h2>
                  <p className="text-blue-100">Detailed overview for {selectedEmployee.name}</p>
                </div>
                <button 
                  onClick={closeEmployeeReport}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-blue-200">Employee</p>
                  <p className="font-semibold">{selectedEmployee.name}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-200">Department</p>
                  <p className="font-semibold">{selectedEmployee.department || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-200">Period</p>
                  <p className="font-semibold">{months[selectedMonth]} {selectedYear}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-200">Email</p>
                  <p className="font-semibold text-xs">{selectedEmployee.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="p-6 space-y-6">
              {/* Employee Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Employee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedEmployee.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedEmployee.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Join Date:</span>
                      <span className="font-medium">
                        {typeof selectedEmployee.join_date === 'string' ? new Date(selectedEmployee.join_date).toLocaleDateString("en-GB") : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reports To:</span>
                      <span className="font-medium">
                        {typeof selectedEmployee.reports_to === 'string' ? selectedEmployee.reports_to : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employee ID:</span>
                      <span className="font-medium">{selectedEmployee.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span className="font-medium">
                        {typeof selectedEmployee.position === 'string' ? selectedEmployee.position : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Performance Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const metrics = getEmployeeMetrics(selectedEmployee);
                    
                    return (
                      <>
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600">Tasks Completed</p>
                          <p className="text-xl font-bold text-green-600">{metrics.completedTasks}/{metrics.totalTasks}</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600">Productivity</p>
                          <p className="text-xl font-bold text-purple-600">{metrics.productivity}%</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600">Avg Hours/Day</p>
                          <p className="text-xl font-bold text-blue-600">{metrics.avgWorkingHours}h</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600">Attendance Days</p>
                          <p className="text-xl font-bold text-yellow-600">{metrics.attendanceRecords}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Interactive Attendance Chart and Cards */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Attendance Hours (This Month)</h3>
                {/* Interactive Chart */}
             <AttendanceChart
  attendance={getEmployeeAttendance(selectedEmployee)}
  selectedMonth={selectedMonth}
  selectedYear={selectedYear}
  absences={getEmployeeAbsences(selectedEmployee)}
  employeeEmail={selectedEmployee.email || ""}
/>
                {/* Attendance Cards */}
                <div className="mt-6">
                  <h4 className="text-base font-semibold text-gray-800 mb-2">Daily Attendance</h4>
                  {/* --- Helper function to format time in 12-hour format with AM/PM --- */}
                  {(() => {
                    const formatTime12Hour = (timeStr: string | null | undefined): string => {
                      if (!timeStr) return "N/A";
                      const [h, m] = timeStr.split(":");
                      let hour = parseInt(h, 10);
                      const minute = parseInt(m, 10);
                      const ampm = hour >= 12 ? "PM" : "AM";
                      hour = hour % 12 || 12;
                      return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
                    };
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getEmployeeAttendance(selectedEmployee).length === 0 && (
                          <p className="text-gray-500 text-center py-4 col-span-2">No attendance records found</p>
                        )}
                        {getEmployeeAttendance(selectedEmployee).map((record: Attendance, idx: number) => {
                          let hours = 0;
                          const checkIn = record.check_in;
                          const checkOut = record.check_out;
                          try {
                            if (checkIn && checkOut) {
                              const [checkInTime] = checkIn.split('.');
                              const [checkOutTime] = checkOut.split('.');
                              const [inHours, inMinutes, inSeconds] = checkInTime.split(':').map(Number);
                              const [outHours, outMinutes, outSeconds] = checkOutTime.split(':').map(Number);
                              const checkInTotalMinutes = inHours * 60 + inMinutes + inSeconds / 60;
                              const checkOutTotalMinutes = outHours * 60 + outMinutes + outSeconds / 60;
                              let diffMinutes = checkOutTotalMinutes - checkInTotalMinutes;
                              if (diffMinutes < 0) diffMinutes += 24 * 60;
                              hours = diffMinutes / 60;
                            }
                          } catch { hours = 0; }
                          return (
                            <div key={idx} className="flex flex-col md:flex-row items-center justify-between bg-white rounded-lg shadow-sm p-3">
                              <div className="flex-1 flex flex-col gap-1">
                                <span className="font-medium text-gray-900">
                                  {record.date ? new Date(record.date).toLocaleDateString("en-GB") : 'N/A'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Check-in: <span className="font-mono">{formatTime12Hour(checkIn)}</span>
                                </span>
                                <span className="text-xs text-gray-500">
                                  Check-out: <span className="font-mono">{formatTime12Hour(checkOut)}</span>
                                </span>
                              </div>
                              <div className="text-right mt-2 md:mt-0">
                                <span className="text-lg font-bold text-blue-700">
                                  {`${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`}
                                </span>
                                <div className="text-xs text-gray-400">Worked</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Absence Records */}
                <div className="mt-6">
                  <h4 className="text-base font-semibold text-gray-800 mb-2">Absence Records</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getEmployeeAbsences(selectedEmployee).length === 0 && (
                      <p className="text-gray-500 text-center py-4 col-span-2">No absence records found</p>
                    )}
                    {getEmployeeAbsences(selectedEmployee).map((absence: AbsentRecord, idx: number) => {
                      const dateStr = absence.date || absence.absent_date;
                      return (
                        <div key={idx} className="flex flex-col md:flex-row items-center justify-between bg-red-50 rounded-lg shadow-sm p-3 border border-red-200">
                          <div className="flex-1 flex flex-col gap-1">
                            <span className="font-medium text-red-900">
                              {dateStr ? new Date(dateStr).toLocaleDateString("en-GB") : 'N/A'}
                            </span>
                            <span className="text-xs text-red-700">Status: <span className="font-semibold">Absent</span></span>
                            {absence.reason && (
                              <span className="text-xs text-red-600">Reason: {absence.reason}</span>
                            )}
                          </div>
                          <div className="text-right mt-2 md:mt-0">
                            <span className="text-lg font-bold text-red-700">ABSENT</span>
                            <div className="text-xs text-red-500">Full Day</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Tasks */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Recent Tasks</h3>
                <div className="space-y-3">
                  {getEmployeeTasks(selectedEmployee)
                    .slice(0, 5)
                    .map((task: Task & { displayName: string; displayDate: string }, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{task.displayName}</p>
                          <p className="text-sm text-gray-500">
                            Status: <span className={`font-medium ${
                              (task.status || '').toLowerCase() === 'completed' ? 'text-green-600' :
                              (task.status || '').toLowerCase() === 'in progress' ? 'text-blue-600' :
                              (task.status || '').toLowerCase() === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                            }`}>
                              {task.status || 'Unknown'}
                            </span>
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                          {task.displayDate ? 
                            new Date(task.displayDate).toLocaleDateString("en-GB") : 
                            'No date'
                          }
                        </span>
                      </div>
                    ))}
                  {getEmployeeTasks(selectedEmployee).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No tasks found for this employee</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={closeEmployeeReport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ChartData interface for AttendanceChart
interface ChartData {
  day: number;
  date: Date;
  dateStr: string;
  hours: number;
  absent: boolean;
  isSunday: boolean;
  present: boolean;
  checkIn?: string;
  checkOut?: string;
}

// Attendance Chart Component (updated)
const AttendanceChart = ({
  attendance,
  selectedMonth,
  selectedYear,
  absences,
  employeeEmail,
}: {
  attendance: Attendance[];
  selectedMonth: number;
  selectedYear: number;
  absences: AbsentRecord[];
  employeeEmail: string;
}) => {
  const [chartData, setChartData] = React.useState<ChartData[]>([]);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  useEffect(() => {
    const attendanceMap: Record<string, Attendance> = {};
    attendance.forEach((rec) => {
      if (rec.date) {
        const d = new Date(rec.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
        attendanceMap[key] = rec;
      }
    });

    const absentMap: Record<string, AbsentRecord> = {};
    absences
      .filter((a) => a.email?.toLowerCase() === employeeEmail.toLowerCase())
      .forEach((abs) => {
        const d = new Date(abs.date || abs.absent_date || "");
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
        absentMap[key] = abs;
      });

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const newChartData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const key = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const record = attendanceMap[key];
      const isAbsent = !!absentMap[key];
      const isSunday = date.getDay() === 0;

      let hours = 0;
      if (record?.check_in && record?.check_out) {
        const [inH, inM] = record.check_in.split(":").map(Number);
        const [outH, outM] = record.check_out.split(":").map(Number);
        hours = Math.max(0, Math.min(((outH * 60 + outM) - (inH * 60 + inM)) / 60, 16));
      }

      newChartData.push({
        day,
        date,
        dateStr: `${String(day).padStart(2, "0")}/${String(selectedMonth + 1).padStart(2, "0")}/${selectedYear}`,
        hours,
        absent: isAbsent,
        isSunday,
        present: !!record,
        checkIn: record?.check_in,
        checkOut: record?.check_out,
      });
    }

    setChartData(newChartData);
  }, [attendance, absences, employeeEmail, selectedMonth, selectedYear]);

  const maxHours = Math.max(...chartData.map((d) => d.hours), 8, 1);

  // Helper function to format 24-hour time to 12-hour with AM/PM
  const formatTime12Hour = (timeStr?: string) => {
    if (!timeStr) return "N/A";
    const [hourStr, minuteStr] = timeStr.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minuteStr} ${ampm}`;
  };

  return (
    <div className="relative w-full overflow-x-auto overflow-y-visible px-1 py-4 sm:px-2 md:px-4 lg:px-6">
      <div className="min-w-[320px] sm:min-w-[400px] md:min-w-[600px] lg:min-w-[800px] mx-auto">
        <div className="flex items-end h-48 gap-1 md:gap-2">
          {chartData.map((d, idx) => {
            const barHeight = d.absent ? 160 : Math.min((d.hours / maxHours) * 160, 160);
            const barColor = d.absent
              ? "bg-red-600 hover:bg-red-800"
              : d.isSunday
              ? "bg-orange-500 hover:bg-orange-700"
              : d.present
              ? "bg-blue-600 hover:bg-blue-800"
              : "bg-gray-300";

            return (
              <div
                key={idx}
                className="flex flex-col items-center group relative min-w-[20px]"
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                <div className={`w-3 sm:w-4 rounded-t ${barColor}`} style={{ height: `${barHeight}px` }} />
                <span className="text-[10px] text-gray-600 mt-1">{d.day}</span>

                {hoverIdx === idx && (
                  <div
                    className={`fixed z-50 left-1/2 -translate-x-1/2 bg-white border rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap ${
                      d.absent ? "border-red-300" : d.isSunday ? "border-orange-300" : "border-blue-200"
                    }`}
                    style={{ top: `${(window?.scrollY || 0) + 120}px` }}
                  >
                    <div
                      className={`font-semibold mb-1 ${
                        d.absent ? "text-red-700" : d.isSunday ? "text-orange-600" : "text-blue-700"
                      }`}
                    >
                      {d.dateStr}
                    </div>
                    {d.absent ? (
                      <div className="text-red-600 font-bold text-center py-1">Absent</div>
                    ) : d.isSunday ? (
                      <div className="text-orange-600 font-bold text-center py-1">Sunday</div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Check-in:</span>
                          <span className="font-mono text-blue-900">
                            {formatTime12Hour(d.checkIn)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Check-out:</span>
                          <span className="font-mono text-blue-900">
                            {formatTime12Hour(d.checkOut)}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-500">Worked:</span>
                          <span className="font-bold text-blue-800">
                            {`${Math.floor(d.hours)}h ${Math.round((d.hours % 1) * 60)}m`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthlyReportDashboard;