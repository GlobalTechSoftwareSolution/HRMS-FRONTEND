'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import OTMakerComponent from './OT_maker';

interface Employee {
  email: string;
  fullname?: string;
  name?: string;
  department?: string;
  designation?: string;
  profile_picture?: string;
}

interface ShiftAllocation {
  id?: number;
  employee_email: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  date: string;
  ot_hours?: number;
  status: 'active' | 'inactive';
}

interface ShiftApiResponse {
  shift_id?: number;
  id?: number;
  emp_email?: string;
  employee_email?: string;
  shift?: string;
  shift_type?: string;
  start_time: string;
  end_time: string;
  date: string;
  status?: string;
}


interface ShiftColumn {
  id: string;
  title: string;
  timeRange: string;
  employees: Employee[];
}

// interface ShiftMakerComponentProps {
//   role?: string;
// }

const ShiftMakerComponent = () => {
  const [activeTab, setActiveTab] = useState<'shifts' | 'overtime'>('shifts');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<ShiftAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  // const [isShiftModalOpen, setIsShiftModalOpen] = useState(false); // Unused
  // const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  // const [selectedEmployeesForShift, setSelectedEmployeesForShift] = useState<Set<string>>(new Set()); // Unused
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true); // Start in view mode
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null); // For mobile click-to-move

  // Check if device is mobile/touch
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || 'ontouchstart' in window;
  };

  // Initialize shift columns - matching backend choices
  const [shiftColumns, setShiftColumns] = useState<ShiftColumn[]>([
    {
      id: 'Morning',
      title: 'Morning Shift',
      timeRange: '9:00 AM - 5:00 PM',
      employees: []
    },
    {
      id: 'Evening',
      title: 'Evening Shift',
      timeRange: '2:00 PM - 10:00 PM',
      employees: []
    },
    {
      id: 'Night',
      title: 'Night Shift',
      timeRange: '10:00 PM - 6:00 AM',
      employees: []
    }
  ]);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`);
        if (!res.ok) throw new Error('Failed to fetch employees');

        const data = await res.json();
        const employeesArray = Array.isArray(data) ? data : (data?.employees || data?.data || []);

        setEmployees(employeesArray);
      } catch (error) {
        console.error('Error loading employees:', error);
        setError('Failed to load employees');
      }
    };

    fetchEmployees();
  }, []);

  // Fetch shifts and OT allocations for selected date
  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        setLoading(true);
        setHasUnsavedChanges(false);

        // Fetch all shifts and filter for selected date
        const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_shifts/`);
        if (shiftRes.ok) {
          const shiftData = await shiftRes.json();
          // Map API response to our component format and filter for selected date
          const dateShifts = (shiftData.shifts || [])
            .filter((shift: ShiftApiResponse) => shift.date === selectedDate)
            .map((shift: ShiftApiResponse) => ({
              id: shift.shift_id || shift.id,
              employee_email: shift.emp_email || shift.employee_email, // Standardize on emp_email
              shift_type: shift.shift ? shift.shift.charAt(0).toUpperCase() + shift.shift.slice(1).toLowerCase() : 'Morning', // Capitalize first letter (Morning, Evening, Night)
              start_time: shift.start_time,
              end_time: shift.end_time,
              date: shift.date,
              status: shift.status || 'active',
            }));

          setShifts(dateShifts);

          // Auto-enter edit mode if no shifts exist (creation mode)
          const hasExistingShifts = dateShifts.filter((shift: ShiftAllocation) => shift.status === 'active').length > 0;
          setIsViewMode(hasExistingShifts); // View mode only if shifts exist, otherwise edit mode
        }



      } catch (error) {
        console.error('Error loading shift data:', error);
        setError('Failed to load shift data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllocations();
  }, [selectedDate]);



  // Check if date is today
  const isToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate === today;
  };

  // Check if date is in the past
  const isPastDate = () => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate < today;
  };

  // Check if date is in the future
  const isFutureDate = () => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate > today;
  };

  // Get current assigned employees count (unique employees assigned to shifts)
  const getTotalAssignedEmployees = () => {
    const assignedEmails = new Set(
      shifts
        .filter(shift => shift && shift.status === 'active')
        .map(shift => shift.employee_email)
    );
    return assignedEmails.size;
  };

  // Get manager email from localStorage
  const getManagerEmail = () => {
    return localStorage.getItem("user_email");
  };

  // Save all shifts to backend at once
  const handleSaveAllShifts = async () => {
    if (!isToday() && !isFutureDate()) return; // Only allow save for today and future dates

    setIsSaving(true);
    try {
      // Get all active shifts that need to be saved
      const activeShifts = shifts.filter(shift => shift.status === 'active');
      
      // Prepare bulk create data for all shifts
      const shiftsData = {
        shifts: activeShifts.map(shift => ({
          date: shift.date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          emp_email: shift.employee_email, // API expects emp_email
          manager_email: getManagerEmail(),
          shift: shift.shift_type // Use the actual shift type
        }))
      };

      // First, delete all existing shifts for this date
      const existingShifts = shifts.filter(shift => shift.id && shift.status === 'active');
      if (existingShifts.length > 0) {
        const shiftIdsToDelete = existingShifts.map(shift => shift.id).filter(Boolean) as number[];
        if (shiftIdsToDelete.length > 0) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/bulk_delete_shifts/`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shift_ids: shiftIdsToDelete }),
          });
        }
      }

      // Then create all shifts in bulk
      if (activeShifts.length > 0) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/bulk_create_shifts/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shiftsData),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to save shifts: ${res.status} - ${errorText}`);
        }
      }
      
      setHasUnsavedChanges(false);
      setIsViewMode(true); // Switch back to view mode after saving

      // Refresh data to get server-generated IDs
      const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_shifts/`);
      if (shiftRes.ok) {
        const shiftData = await shiftRes.json();
        const dateShifts = (shiftData.shifts || [])
          .filter((shift: ShiftApiResponse) => shift.date === selectedDate)
          .map((shift: ShiftApiResponse) => ({
            id: shift.shift_id || shift.id,
            employee_email: shift.emp_email || shift.employee_email, // Standardize on emp_email
            shift_type: shift.shift ? shift.shift.charAt(0).toUpperCase() + shift.shift.slice(1).toLowerCase() : 'Morning',
            start_time: shift.start_time,
            end_time: shift.end_time,
            date: shift.date,
            status: shift.status || 'active',
          }));
        setShifts(dateShifts);
      }
    } catch (err) {
      console.error('Error saving all shifts:', err);
      alert(`Error saving shifts: ${err instanceof Error ? err.message : 'Please check your connection and try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };





  // Update shift columns based on shifts data
  useEffect(() => {
    setShiftColumns(prevColumns => 
      prevColumns.map(column => {
        const columnShifts = shifts.filter(shift =>
          shift.shift_type === column.id &&
          shift.status === 'active' &&
          shift.date === selectedDate
        );

        const columnEmployees = columnShifts.map(shift =>
          employees.find(emp => emp.email === shift.employee_email)
        ).filter(Boolean) as Employee[];

        return {
          ...column,
          employees: columnEmployees
        };
      })
    );
  }, [shifts, employees, selectedDate]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, employee: Employee) => {
    // setDraggedEmployee(employee);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', employee.email);

    // Add visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Add visual feedback to drop zone
    const target = e.currentTarget as HTMLElement;
    target.style.backgroundColor = '#f0f9ff';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Reset visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.backgroundColor = '';
  };

  const handleDrop = async (e: React.DragEvent, targetShiftId: string) => {
    e.preventDefault();

    // Reset visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.backgroundColor = '';

    const employeeEmail = e.dataTransfer.getData('text/plain');
    if (!employeeEmail) {
      return;
    }

    const employee = employees.find(emp => emp.email === employeeEmail);
    if (!employee) {
      return;
    }

    // Check if employee is already in target shift
    const existingShiftInTarget = shifts.find(shift =>
      shift.employee_email === employee.email &&
      shift.shift_type === targetShiftId &&
      shift.date === selectedDate &&
      shift.status === 'active'
    );

    if (existingShiftInTarget) {
      console.log('Employee already in target shift');
      return;
    }

    try {
      // Find existing shifts for this employee on this date in the database
      const existingShifts = shifts.filter(shift =>
        shift.employee_email === employee.email &&
        shift.date === selectedDate &&
        shift.status === 'active'
      );

      console.log('Found existing shifts for employee:', existingShifts.length);

      // Delete existing shifts from database
      if (existingShifts.length > 0) {
        const shiftIdsToDelete = existingShifts.map(shift => shift.id).filter(Boolean) as number[];

        if (shiftIdsToDelete.length > 0) {
          console.log('Deleting existing shifts:', shiftIdsToDelete);

          // Delete each existing shift
          for (const shiftId of shiftIdsToDelete) {
            const deleteRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/delete_shift/${shiftId}/`,
              { method: 'DELETE' }
            );

            if (!deleteRes.ok) {
              const errorText = await deleteRes.text();
              console.error(`Failed to delete shift ${shiftId}:`, deleteRes.status, errorText);
            }
          }
        }
      }

      // Create new shift assignment
      const startTime = targetShiftId === 'Morning' ? '09:00' : targetShiftId === 'Evening' ? '14:00' : '22:00';
      const endTime = targetShiftId === 'Morning' ? '17:00' : targetShiftId === 'Evening' ? '22:00' : '06:00';

      const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_shift/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_email: employee.email, // API expects emp_email
          manager_email: getManagerEmail(),
          shift: targetShiftId,
          date: selectedDate,
          start_time: startTime,
          end_time: endTime
        }),
      });

      if (!createRes.ok) {
        const errorText = await createRes.text();
        throw new Error(`Failed to create shift: ${createRes.status} - ${errorText}`);
      }

      console.log(`✅ Successfully moved ${employee.fullname || employee.email} to ${targetShiftId} shift`);

      // Refresh shifts after creation
      const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_shifts/`);
      if (shiftRes.ok) {
        const shiftData = await shiftRes.json();
        const dateShifts = (shiftData.shifts || [])
          .filter((shift: ShiftApiResponse) => shift.date === selectedDate)
          .map((shift: ShiftApiResponse) => ({
            id: shift.shift_id || shift.id,
            employee_email: shift.emp_email || shift.employee_email, // Standardize on emp_email
            shift_type: shift.shift ? shift.shift.charAt(0).toUpperCase() + shift.shift.slice(1).toLowerCase() : 'Morning',
            start_time: shift.start_time,
            end_time: shift.end_time,
            date: shift.date,
            status: shift.status || 'active',
          }));
        setShifts(dateShifts);
      }

    } catch (err) {
      console.error('Error moving employee to new shift:', err);
      alert(`Error moving employee: ${err instanceof Error ? err.message : 'Please check your connection and try again.'}`);
    }
  };

  // Get unassigned employees
  const getUnassignedEmployees = () => {
    const assignedEmails = new Set(
      shifts
        .filter(shift => shift && shift.status === 'active' && shift.date === selectedDate)
        .map(shift => shift.employee_email)
    );

    return employees.filter(emp => !assignedEmails.has(emp.email));
  };

  if (loading) return <div className="p-6 text-center">Loading shift data...</div>;
  if (error) return <div className="p-6 text-red-600 text-center">Error: {error}</div>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('shifts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'shifts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Shift Management
                </div>
              </button>
              <button
                onClick={() => setActiveTab('overtime')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overtime'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Overtime Management
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'shifts' ? (
          <>
            {/* Shift Management Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Shift Management</h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-gray-600">
                    {isMobile()
                      ? "Tap employees and then tap shift columns to move them"
                      : "Drag and drop employees to assign shifts"
                    }
                  </p>
                  {selectedEmployee && (
                    <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                      Selected: {selectedEmployee.fullname || selectedEmployee.email}
                    </div>
                  )}
                  {getTotalAssignedEmployees() > 0 && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isPastDate() ? 'bg-gray-100 text-gray-600' :
                      isFutureDate() ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {isPastDate() ? 'Past Date - View Only' :
                       isFutureDate() ? 'Future Date - Planning' :
                       'Today - Editable'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {hasUnsavedChanges && (isToday() || isFutureDate()) && (
                  <button
                    onClick={handleSaveAllShifts}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving All...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                        </svg>
                        Save All Shifts ({getTotalAssignedEmployees()} employees)
                      </>
                    )}
                  </button>
                )}
                {getTotalAssignedEmployees() > 0 && !isPastDate() && isViewMode && (
                  <button
                    onClick={() => setIsViewMode(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Edit Shifts
                  </button>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Status Banner & Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {(() => {
                    const hasExistingShifts = getTotalAssignedEmployees() > 0;

                    if (isPastDate()) {
                      return (
                        <>
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-blue-900">Historical Data</h3>
                            <p className="text-sm text-blue-700">Viewing past shift assignments for {new Date(selectedDate).toLocaleDateString()}</p>
                          </div>
                        </>
                      );
                    } else if (hasExistingShifts) {
                      return (
                        <>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isToday() ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            <svg className={`w-4 h-4 ${isToday() ? 'text-green-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </div>
                          <div>
                            <h3 className={`font-semibold ${isToday() ? 'text-green-900' : 'text-blue-900'}`}>
                              Shift Assignments - {new Date(selectedDate).toLocaleDateString()}
                            </h3>
                            <p className={`text-sm ${isToday() ? 'text-green-700' : 'text-blue-700'}`}>
                              {getTotalAssignedEmployees()} employee{getTotalAssignedEmployees() !== 1 ? 's' : ''} assigned to shifts
                            </p>
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-yellow-900">Create Shift Assignments</h3>
                            <p className="text-sm text-yellow-700">
                              {isToday()
                                ? "Assign today's shifts by dragging employees to columns"
                                : `Plan shifts for ${new Date(selectedDate).toLocaleDateString()}`
                              }
                            </p>
                          </div>
                        </>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Shift Columns - Always Visible */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {shiftColumns.map((column) => {
                // Determine if this column should be interactive
                // Interactive when not in view mode and not past date
                const isInteractive = !isPastDate() && !isViewMode;

                return (
                  <div
                    key={column.id}
                    className={`rounded-2xl shadow-sm border p-6 min-h-[400px] transition-all duration-300 cursor-pointer ${
                      isPastDate()
                        ? 'bg-gray-50 border-gray-200 opacity-75'
                        : !isInteractive
                          ? 'bg-gray-50 border-gray-300 opacity-80'
                          : `bg-white border-gray-100 shadow-md ${
                              selectedEmployee ? 'ring-2 ring-blue-400' : ''
                            }`
                    }`}
                    onDragOver={isInteractive ? handleDragOver : undefined}
                    onDragLeave={isInteractive ? handleDragLeave : undefined}
                    onDrop={isInteractive ? (e) => handleDrop(e, column.id) : undefined}
                    onClick={isInteractive && selectedEmployee ? async () => {
                      // Move selected employee to this shift
                      try {
                        // Find existing shifts for this employee on this date
                        const existingShifts = shifts.filter(shift =>
                          shift.employee_email === selectedEmployee.email &&
                          shift.date === selectedDate &&
                          shift.status === 'active'
                        );

                        // Delete existing shifts from database
                        if (existingShifts.length > 0) {
                          const shiftIdsToDelete = existingShifts.map(shift => shift.id).filter(Boolean) as number[];
                          if (shiftIdsToDelete.length > 0) {
                            for (const shiftId of shiftIdsToDelete) {
                              await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/delete_shift/${shiftId}/`,
                                { method: 'DELETE' }
                              );
                            }
                          }
                        }

                        // Create new shift assignment
                        const startTime = column.id === 'Morning' ? '09:00' : column.id === 'Evening' ? '14:00' : '22:00';
                        const endTime = column.id === 'Morning' ? '17:00' : column.id === 'Evening' ? '22:00' : '06:00';

                        const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_shift/`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            emp_email: selectedEmployee.email,
                            manager_email: getManagerEmail(),
                            shift: column.id,
                            date: selectedDate,
                            start_time: startTime,
                            end_time: endTime
                          }),
                        });

                        if (createRes.ok) {
                          // Refresh data and clear selection
                          const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_shifts/`);
                          if (shiftRes.ok) {
                            const shiftData = await shiftRes.json();
                            const dateShifts = (shiftData.shifts || [])
                              .filter((shift: ShiftApiResponse) => shift.date === selectedDate)
                              .map((shift: ShiftApiResponse) => ({
                                id: shift.shift_id || shift.id,
                                employee_email: shift.emp_email || shift.employee_email,
                                shift_type: shift.shift ? shift.shift.charAt(0).toUpperCase() + shift.shift.slice(1).toLowerCase() : 'Morning',
                                start_time: shift.start_time,
                                end_time: shift.end_time,
                                date: shift.date,
                                status: shift.status || 'active',
                              }));
                            setShifts(dateShifts);
                          }
                          setSelectedEmployee(null);
                          console.log(`✅ Moved ${selectedEmployee.fullname || selectedEmployee.email} to ${column.title}`);
                        } else {
                          alert('Failed to move employee. Please try again.');
                        }
                      } catch (err) {
                        console.error('Error moving employee:', err);
                        alert('Error moving employee. Please try again.');
                      }
                    } : undefined}
                  >
                    <div className="text-center mb-4">
                      <div className="text-center mb-2">
                        <h3 className={`text-lg font-bold ${isPastDate() ? 'text-gray-700' : 'text-gray-900'}`}>
                          {column.title}
                        </h3>
                      </div>
                      <p className={`text-sm ${isPastDate() ? 'text-gray-500' : 'text-gray-600'}`}>
                        {column.timeRange}
                      </p>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                        column.id === 'Morning' ? 'bg-green-100 text-green-800' :
                        column.id === 'Evening' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {column.employees.length} employees
                      </div>
                    </div>

                    <div className="space-y-3 min-h-[300px]">
                      {column.employees.map((employee) => (
                        <div
                          key={employee.email}
                          draggable={isInteractive}
                          onDragStart={isInteractive ? (e) => handleDragStart(e, employee) : undefined}
                          // onDragEnd={isInteractive ? () => setDraggedEmployee(null) : undefined}
                          onClick={isInteractive && isMobile() ? () => setSelectedEmployee(employee) : undefined}
                          className={`border rounded-lg p-3 transition-shadow relative group ${
                            isPastDate()
                              ? 'bg-white border-gray-300 opacity-75'
                              : isInteractive
                                ? `bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 cursor-move hover:shadow-md active:shadow-lg ${
                                    selectedEmployee?.email === employee.email ? 'ring-2 ring-orange-400 bg-orange-50' : ''
                                  }`
                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 cursor-default'
                          }`}
                        >
                          {isInteractive && (
                            <button
                              onClick={async () => {
                                // Find the shift to delete
                                const shiftToDelete = shifts.find(shift =>
                                  shift.employee_email === employee.email &&
                                  shift.shift_type === column.id &&
                                  shift.date === selectedDate &&
                                  shift.status === 'active'
                                );

                                if (!shiftToDelete || !shiftToDelete.id) {
                                  console.error('Shift not found for deletion');
                                  return;
                                }

                                try {
                                  // Call API to delete from database
                                  const response = await fetch(
                                    `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/delete_shift/${shiftToDelete.id}/`,
                                    {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                    }
                                  );

                                  if (response.ok) {
                                    // Remove from local state on success
                                    setShifts(prevShifts =>
                                      prevShifts.filter(shift => shift.id !== shiftToDelete.id)
                                    );
                                    console.log(`✅ Successfully deleted ${employee.fullname || employee.email} from ${column.title} in database`);
                                  } else {
                                    const errorText = await response.text();
                                    console.error('Failed to delete shift:', response.status, errorText);
                                    alert(`Failed to delete shift: ${response.status}`);
                                  }
                                } catch (_err) {
                                  console.error('Error deleting shift:', _err);
                                  alert('Error deleting shift. Please try again.');
                                }
                              }}
                              className={`absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                                isMobile() ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              } transition-opacity`}
                              title={`Remove ${employee.fullname || employee.email} from ${column.title}`}
                            >
                              ×
                            </button>
                          )}
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                              {employee.profile_picture ? (
                                <Image
                                  src={employee.profile_picture}
                                  alt={employee.fullname || employee.email}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="w-full h-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                                        ${employee.fullname?.charAt(0).toUpperCase() || employee.email.charAt(0).toUpperCase()}
                                      </div>`;
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-blue-800 font-bold">
                                  {employee.fullname?.charAt(0).toUpperCase() || employee.email.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium truncate ${
                                isPastDate() ? 'text-gray-800' : 'text-gray-900'
                              }`}>
                                {employee.fullname || employee.email}
                              </p>
                              <p className={`text-sm truncate ${
                                isPastDate() ? 'text-gray-600' : 'text-gray-600'
                              }`}>
                                {employee.department || 'No Department'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {column.employees.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <p>{isInteractive ? 'Drop employees here' : 'No employees assigned'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unassigned Employees */}
            {getUnassignedEmployees().length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Unassigned Employees</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getUnassignedEmployees().map((employee) => (
                    <div
                      key={employee.email}
                      draggable={!isPastDate()}
                      onDragStart={!isPastDate() ? (e) => handleDragStart(e, employee) : undefined}
                      // onDragEnd={!isPastDate() ? () => setDraggedEmployee(null) : undefined}
                      onClick={!isPastDate() && isMobile() ? () => setSelectedEmployee(employee) : undefined}
                      className={`bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 transition-shadow ${
                        !isPastDate()
                          ? `cursor-move hover:shadow-md active:shadow-lg ${
                              selectedEmployee?.email === employee.email ? 'ring-2 ring-orange-400 bg-orange-50' : ''
                            }`
                          : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                          {employee.profile_picture ? (
                            <Image
                              src={employee.profile_picture}
                              alt={employee.fullname || employee.email}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold">
                                    ${employee.fullname?.charAt(0).toUpperCase() || employee.email.charAt(0).toUpperCase()}
                                  </div>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-gray-700 font-bold">
                              {employee.fullname?.charAt(0).toUpperCase() || employee.email.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {employee.fullname || employee.email}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {employee.department || 'No Department'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Overtime Management Tab */
          <OTMakerComponent />
        )}
      </div>
    </div>
  );
};

export default ShiftMakerComponent;
