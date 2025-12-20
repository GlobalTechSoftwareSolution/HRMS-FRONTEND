'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Employee {
  email: string;
  fullname?: string;
  name?: string;
  department?: string;
  designation?: string;
  profile_picture?: string;
}

interface OvertimeRecord {
  id?: number;
  employee_email: string;
  date: string;
  hours: number;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  status: 'pending' | 'approved' | 'rejected';
  ot_start?: string;
  ot_end?: string;
  emp_name?: string;
}

interface OTApiResponse {
  id?: number;
  email?: string;
  manager_email?: string;
  ot_start?: string;
  ot_end?: string;
  approved?: boolean;
  approved_by?: string;
  approved_at?: string;
  status?: string;
  emp_name?: string;
}

interface OTFormData {
  employee_email: string;
  ot_start: string;
  ot_end: string;
}

const OTMakerComponent = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<OTFormData>({
    employee_email: '',
    ot_start: '',
    ot_end: ''
  });

  // Default overtime rates - commented out as not currently used
  // const DEFAULT_OT_RATES = {
  //   weekday: 1.5,
  //   weekend: 2.0,
  //   holiday: 3.0
  // };

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`);
        if (!res.ok) throw new Error('Failed to fetch employees');

        const data = await res.json();
        const employeesArray = Array.isArray(data) ? data : (data?.employees || data?.data || []);

        setEmployees(employeesArray);
      } catch (err) {
        console.error('Error loading employees:', err);
        setError('Failed to load employees');
      }
    };

    fetchEmployees();
  }, []);

  // Fetch overtime records for selected date
  useEffect(() => {
    const fetchOvertimeRecords = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_ot/`);
        if (!res.ok) throw new Error('Failed to fetch overtime records');

        const data = await res.json();
        // Handle various possible API response formats
        let allRecords = [];
        if (Array.isArray(data)) {
          allRecords = data;
        } else if (data?.data && Array.isArray(data.data)) {
          allRecords = data.data;
        } else if (data?.results && Array.isArray(data.results)) {
          allRecords = data.results;
        } else if (data?.ot_records && Array.isArray(data.ot_records)) {
          // Handle the specific ot_records format from our API
          allRecords = data.ot_records;
        } else {
          // If data itself is an object with OT records
          allRecords = [data];
        }

        // Filter records for selected date (if they have ot_start field)
        const records = allRecords.filter((record: OTApiResponse) => {
          if (!record.ot_start) return false;
          // Handle different date formats and timezones
          const recordDate = new Date(record.ot_start);
          const selectedDateObj = new Date(selectedDate);
          
          // Compare dates by year, month, and day only (ignore time)
          return recordDate.getFullYear() === selectedDateObj.getFullYear() &&
                 recordDate.getMonth() === selectedDateObj.getMonth() &&
                 recordDate.getDate() === selectedDateObj.getDate();
        });

        const formattedRecords: OvertimeRecord[] = records.map((record: OTApiResponse) => {
          // Calculate hours from start and end time - simple end - start calculation
          const startTime = new Date(record.ot_start!);
          const endTime = new Date(record.ot_end!);
          const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

          return {
            id: record.id,
            employee_email: record.email || '',
            date: selectedDate,
            hours: Math.abs(hours), // Ensure positive value
            reason: '',
            approved: record.approved || false,
            approved_by: record.approved_by,
            approved_at: record.approved_at,
            status: (record.status as OvertimeRecord['status']) || 'pending',
            emp_name: record.emp_name,
            ot_start: record.ot_start,
            ot_end: record.ot_end
          };
        });

        setOvertimeRecords(formattedRecords);
      } catch (err) {
        console.error('Error loading overtime records:', err);
        setError('Failed to load overtime records');
      } finally {
        setLoading(false);
      }
    };

    fetchOvertimeRecords();
  }, [selectedDate]);

  // Add new overtime record
  const addOvertimeRecord = async (data: OTFormData) => {
    try {
      // Format datetime strings to match API expectations
      const startDate = new Date(data.ot_start);
      const endDate = new Date(data.ot_end);
      
      const recordData = {
        email: data.employee_email,
        manager_email: 'manager@globaltechsoftwaresolutions.com',
        ot_start: startDate.toISOString(),
        ot_end: endDate.toISOString()
      };

      // Using hardcoded manager email as per API specification
      // const managerEmail = localStorage.getItem('user_email');
      // if (!managerEmail) {
      //   throw new Error('Manager email not found. Please log in again.');
      // }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_ot/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to add overtime record: ${res.status} - ${errorText}`);
      }

      // Refresh records
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_ot/`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        // Handle various possible API response formats
        let allRecords = [];
        if (Array.isArray(refreshData)) {
          allRecords = refreshData;
        } else if (refreshData?.data && Array.isArray(refreshData.data)) {
          allRecords = refreshData.data;
        } else if (refreshData?.results && Array.isArray(refreshData.results)) {
          allRecords = refreshData.results;
        } else if (refreshData?.ot_records && Array.isArray(refreshData.ot_records)) {
          // Handle the specific ot_records format from our API
          allRecords = refreshData.ot_records;
        } else {
          // If data itself is an object with OT records
          allRecords = [refreshData];
        }

        // Filter records for selected date
        const records = allRecords.filter((record: OTApiResponse) => {
          if (!record.ot_start) return false;
          // Handle different date formats and timezones
          const recordDate = new Date(record.ot_start);
          const selectedDateObj = new Date(selectedDate);
          
          // Compare dates by year, month, and day only (ignore time)
          return recordDate.getFullYear() === selectedDateObj.getFullYear() &&
                 recordDate.getMonth() === selectedDateObj.getMonth() &&
                 recordDate.getDate() === selectedDateObj.getDate();
        });

        const formattedRecords: OvertimeRecord[] = records.map((record: OTApiResponse) => {
          const startTime = new Date(record.ot_start!);
          const endTime = new Date(record.ot_end!);
          
          // Handle cases where end time crosses midnight
          let hours;
          if (endTime >= startTime) {
            // Same day
            hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          } else {
            // End time is on next day (crossed midnight)
            // Add 24 hours to account for the day rollover
            hours = ((24 * 60 * 60 * 1000) - (startTime.getTime() - endTime.getTime())) / (1000 * 60 * 60);
          }

          return {
            id: record.id,
            employee_email: record.email || '',
            date: selectedDate,
            hours: Math.abs(hours), // Ensure positive value
            reason: '',
            approved: record.approved || false,
            approved_by: record.approved_by,
            approved_at: record.approved_at,
            status: (record.status as OvertimeRecord['status']) || 'pending',
            ot_start: record.ot_start,
            ot_end: record.ot_end
          };
        });

        setOvertimeRecords(formattedRecords);
      }

      setIsAddModalOpen(false);
      setFormData({
        employee_email: '',
        ot_start: '',
        ot_end: ''
      });
      setError(null);
    } catch (err) {
      console.error('Error adding overtime record:', err);
      setError(err instanceof Error ? err.message : 'Failed to add overtime record');
    }
  };

  // Delete overtime record
  const deleteOvertimeRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this overtime record?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/delete_ot/${id}/`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete overtime record: ${res.status} - ${errorText}`);
      }

      // Remove from local state
      setOvertimeRecords(prevRecords => prevRecords.filter(record => record.id !== id));
      
      alert('Overtime record deleted successfully');
    } catch (err) {
      console.error('Error deleting overtime record:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete overtime record');
    }
  };

  // Approve/reject overtime record and other functions removed as they are not used

  // Calculate totals - commented out as not currently used
  // const totalOvertimeHours = overtimeRecords.reduce((sum, record) => sum + record.hours, 0);
  // const pendingRecords = overtimeRecords.filter(record => record.status === 'pending').length;

  // Get employee details
  const getEmployeeDetails = (email: string) => {
    return employees.find(emp => emp.email === email);
  };

  // Check if date is today or in the future
  const isTodayOrFuture = (dateString?: string) => {
    if (!dateString) return false;
    try {
      const recordDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate >= today;
    } catch {
      return false;
    }
  };

  if (loading) return <div className="p-6 text-center">Loading overtime records...</div>;
  if (error) return <div className="p-6 text-red-600 text-center">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Overtime Management</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Track and manage employee overtime hours and payments
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add OT
                </button>
              </div>
            </div>
          </div>
        </div>



        {/* Overtime Records Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Overtime Records - {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
          </div>

          <div className="mt-6">
            {overtimeRecords.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>

                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>

                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {overtimeRecords.map((record) => {
                    const employee = getEmployeeDetails(record.employee_email);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                              {employee?.profile_picture ? (
                                <Image
                                  src={employee.profile_picture}
                                  alt={employee.fullname || employee.email}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-600 font-bold text-sm">
                                  {(employee?.fullname || employee?.email || 'U')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {employee?.fullname || employee?.email || record.employee_email}
                              </div>
                              <div className="text-sm text-gray-500">
                                {employee?.department || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.hours} hrs
                        </td>

                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No overtime records</h3>
                <p className="text-gray-500">No overtime has been recorded for this date.</p>
              </div>
            )}
            
            {/* Card Layout for Overtime Records */}
            {overtimeRecords.length > 0 && (
              <>
                {/* Total Hours Calculation - temporarily commented out */}
                {/* <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-blue-800">Total Overtime Hours</h3>
                    <span className="text-2xl font-bold text-blue-600">
                      {overtimeRecords.reduce((total, record) => total + Math.abs(record.hours), 0).toFixed(2)} hrs
                    </span>
                  </div>
                </div> */}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overtimeRecords.map((record) => {
                  // Format start and end times
                  let startTime = 'N/A';
                  let endTime = 'N/A';

                  if (record.ot_start) {
                    try {
                      const startDate = new Date(record.ot_start);
                      if (!isNaN(startDate.getTime())) {
                        // Show date and time
                        startTime = startDate.toLocaleString();
                      }
                    } catch (e) {
                      console.error('Error parsing start time:', e);
                    }
                  }

                  if (record.ot_end) {
                    try {
                      const endDate = new Date(record.ot_end);
                      if (!isNaN(endDate.getTime())) {
                        // Show date and time
                        endTime = endDate.toLocaleString();
                      }
                    } catch (e) {
                      console.error('Error parsing end time:', e);
                    }
                  }

                  return (
                    <div key={record.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow relative">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mr-4 flex-shrink-0">
                          {(() => {
                            const employee = getEmployeeDetails(record.employee_email);
                            if (employee?.profile_picture) {
                              return (
                                <Image
                                  src={employee.profile_picture}
                                  alt={record.emp_name || record.employee_email}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              );
                            } else {
                              return (
                                <span className="text-gray-600 font-bold">
                                  {(record.emp_name || record.employee_email || 'U')[0].toUpperCase()}
                                </span>
                              );
                            }
                          })()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {record.emp_name || record.employee_email}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {record.employee_email}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Start Time</p>
                          <p className="font-medium text-gray-900">{startTime}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">End Time</p>
                          <p className="font-medium text-gray-900">{endTime}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Hours</p>
                          <p className="font-medium text-gray-900">{Math.abs(record.hours).toFixed(2)} hrs</p>
                        </div>
                      </div>

                      {/* Delete button - only for today and future dates */}
                      {isTodayOrFuture(record.ot_start) && (
                        <button
                          onClick={() => record.id && deleteOvertimeRecord(record.id)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                          title="Delete overtime record"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>)}
          </div>
        </div>

        {/* Add Overtime Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold rounded-full p-1 hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4 text-gray-800">Add Overtime Record</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedEmployee) {
                    addOvertimeRecord({
                      ...formData,
                      employee_email: selectedEmployee.email
                    });
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                  <select
                    value={selectedEmployee?.email || ''}
                    onChange={(e) => {
                      const employee = employees.find(emp => emp.email === e.target.value);
                      setSelectedEmployee(employee || null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.email} value={employee.email}>
                        {employee.fullname || employee.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.ot_start}
                      onChange={(e) => setFormData({...formData, ot_start: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.ot_end}
                      onChange={(e) => setFormData({...formData, ot_end: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>


                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add Overtime Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OTMakerComponent;
