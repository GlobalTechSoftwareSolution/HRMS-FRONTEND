"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";

// Types
type Employee = {
  email: string;
  fullname: string;
  department?: string;
  designation?: string;
};

type ShiftType = "morning" | "evening" | "night";

type ShiftAllocation = {
  [date: string]: {
    [shiftType in ShiftType]: string[]; // Array of employee emails
  };
};

type OTData = {
  id: number;
  email: string;
  manager_email: string;
  ot_start: string;
  ot_end: string;
  emp_name: string;
};

const ShiftMaker = () => {
  // Get manager email from localStorage
  const [managerEmail, setManagerEmail] = useState<string>('manager@globaltechsoftwaresolutions.com');
  
  useEffect(() => {
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('user_email');
      if (email) {
        setManagerEmail(email);
      }
    }
  }, []);
  
  // Define the shift data type
  type ShiftData = {
    shift_id: number;
    date: string;
    start_time: string;
    end_time: string;
    emp_email: string;
    emp_name: string;
    manager_email: string;
    manager_name: string;
    shift: string;
  };
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [shiftAllocations, setShiftAllocations] = useState<ShiftAllocation>({});
  const [savedShifts, setSavedShifts] = useState<ShiftAllocation>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [existingShifts, setExistingShifts] = useState<ShiftData[]>([]);
  const [today] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isTodayLocked, setIsTodayLocked] = useState<boolean>(false);
  const [editMode, setEditMode] = useState(false);
  const [otRecords, setOtRecords] = useState<OTData[]>([]);
  const [otLoading, setOtLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; otId: number | null; employeeName: string }>({ show: false, otId: null, employeeName: '' });

  // Fetch employees and existing shifts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch employees
        const employeesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`);
        if (!employeesRes.ok) throw new Error("Failed to fetch employees");
        const employeesData = await employeesRes.json();
        setEmployees(employeesData || []);
        
        // Fetch existing shifts
        const shiftsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_shifts/`);
        if (!shiftsRes.ok) throw new Error("Failed to fetch shifts");
        const shiftsData = await shiftsRes.json();
        setExistingShifts(shiftsData || []);
        
        // Check if today&apos;s date has existing shifts
        const todayShifts = (shiftsData || []).filter((shift: ShiftData) => shift.date === today);
        setIsTodayLocked(todayShifts.length > 0);
      } catch (err) {
        console.error("Error fetching data:", err);
        showNotification("error", "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [today]);

  // Show notification
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Define shift times (for display only)
  const shiftTimes = useMemo(() => ({
    morning: { start: "09:00 AM", end: "05:00 PM" },
    evening: { start: "05:00 PM", end: "01:00 AM" },
    night: { start: "01:00 AM", end: "09:00 AM" }
  }), []);

  // Check if employee is already assigned to any shift on the selected date
  const isEmployeeAssigned = (employeeEmail: string): boolean => {
    const currentDate = selectedDate;
    if (!shiftAllocations[currentDate]) return false;
    
    const shifts = shiftAllocations[currentDate];
    return (
      shifts.morning.includes(employeeEmail) ||
      shifts.evening.includes(employeeEmail) ||
      shifts.night.includes(employeeEmail)
    );
  };

  // Handle employee selection for a shift
  const handleEmployeeSelect = (shiftType: ShiftType, employeeEmail: string) => {
    setShiftAllocations(prev => {
      const currentDate = selectedDate;
      
      // Initialize date entry if it doesn't exist
      if (!prev[currentDate]) {
        prev[currentDate] = {
          morning: [],
          evening: [],
          night: []
        };
      }
      
      // Copy current allocations
      const newAllocations = { ...prev };
      const currentDateAllocations = { ...newAllocations[currentDate] };
      
      // Toggle employee in selected shift
      if (currentDateAllocations[shiftType].includes(employeeEmail)) {
        // Remove employee
        currentDateAllocations[shiftType] = currentDateAllocations[shiftType].filter(email => email !== employeeEmail);
      } else {
        // Add employee only if not already assigned to another shift on the same day
        if (!isEmployeeAssigned(employeeEmail)) {
          currentDateAllocations[shiftType] = [...currentDateAllocations[shiftType], employeeEmail];
        }
      }
      
      newAllocations[currentDate] = currentDateAllocations;
      return newAllocations;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, employeeEmail: string) => {
    e.dataTransfer.setData("employeeEmail", employeeEmail);
    // Add visual feedback
    (e.target as HTMLElement).classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Remove visual feedback
    (e.target as HTMLElement).classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Add visual feedback to drop zone
    (e.target as HTMLElement).classList.add('bg-blue-100');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Remove visual feedback from drop zone
    (e.target as HTMLElement).classList.remove('bg-blue-100');
  };

  const handleDrop = (e: React.DragEvent, shiftType: ShiftType) => {
    e.preventDefault();
    // Remove visual feedback from drop zone
    (e.currentTarget as HTMLElement).classList.remove('bg-blue-100');
    
    const employeeEmail = e.dataTransfer.getData("employeeEmail");
    
    // Only add employee if not already assigned to another shift on the same day
    if (employeeEmail && !isEmployeeAssigned(employeeEmail)) {
      handleEmployeeSelect(shiftType, employeeEmail);
    }
  };

  // Edit saved shifts
  const editSavedShifts = (date: string) => {
    if (savedShifts[date]) {
      setShiftAllocations(prev => ({
        ...prev,
        [date]: savedShifts[date]
      }));
      setSelectedDate(date);
    }
  };

  // Remove saved shifts
  const removeSavedShifts = (date: string) => {
    setSavedShifts(prev => {
      const newSavedShifts = { ...prev };
      delete newSavedShifts[date];
      return newSavedShifts;
    });
  };

  // Get saved shifts for display
  const getSavedShifts = () => {
    return Object.keys(savedShifts).filter(date => date !== selectedDate);
  };

  // Save shifts
  const saveShifts = async () => {
    // Block editing for past dates
    if (new Date(selectedDate) < new Date(today)) {
      showNotification("error", "Cannot modify past shifts. They are already done.");
      return;
    }
    // Check if trying to edit today's date when it's locked
    if (!editMode && selectedDate === today && isTodayLocked) {
      showNotification("error", "Cannot modify shifts for today as they already exist");
      return;
    }

    // If editing existing shifts → delete old shifts first
    let shiftIdsToDelete: number[] = [];
    if (editMode) {
      const shiftsForDate = existingShifts.filter(
        (shift) => shift.date === selectedDate
      );
      shiftIdsToDelete = shiftsForDate.map((s) => s.shift_id);
      if (shiftIdsToDelete.length > 0) {
        try {
          const token = localStorage.getItem("authToken");
          const deleteResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/bulk_delete_shifts/`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify({ shift_ids: shiftIdsToDelete }),
            }
          );
          await deleteResponse.text();
          if (!deleteResponse.ok) {
            throw new Error(
              `Failed to delete old shifts: ${deleteResponse.status} ${deleteResponse.statusText}`
            );
          }
        } catch (err) {
          console.error("Delete error:", err);
          showNotification("error", "Failed to delete old shifts");
          return;
        }
      }
    }
    setSaving(true);
    try {
      // Format shift data according to API requirements
      interface ShiftPayload {
        date: string;
        start_time: string;
        end_time: string;
        emp_email: string;
        manager_email: string;
        shift: string;
      }
      const shiftData: ShiftPayload[] = [];
      // Get current allocations for the selected date
      const allocations = getCurrentAllocations();
      // Add morning shifts
      allocations.morning.forEach(email => {
        shiftData.push({
          date: selectedDate,
          start_time: "09:00",
          end_time: "17:00",
          emp_email: email,
          manager_email: managerEmail,
          shift: "Morning"
        });
      });
      // Add evening shifts
      allocations.evening.forEach((email: string) => {
        shiftData.push({
          date: selectedDate,
          start_time: "17:00",
          end_time: "01:00",
          emp_email: email,
          manager_email: managerEmail,
          shift: "Evening"
        });
      });
      // Add night shifts
      allocations.night.forEach(email => {
        shiftData.push({
          date: selectedDate,
          start_time: "01:00",
          end_time: "09:00",
          emp_email: email,
          manager_email: managerEmail,
          shift: "Night"
        });
      });
      // If no shifts to save, show a message
      if (shiftData.length === 0) {
        showNotification("error", "No shifts to save");
        setSaving(false);
        return;
      }
      // Send data to API
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/bulk_create_shifts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ shifts: shiftData }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`Failed to save shifts: ${response.status} ${response.statusText}. Response: ${responseText}`);
      }
      // Update saved shifts
      setSavedShifts(prev => ({
        ...prev,
        [selectedDate]: shiftAllocations[selectedDate]
      }));
      showNotification("success", "Shifts saved successfully!");
      setEditMode(false);
    } catch (err: unknown) {
      console.error("Error saving shifts:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      showNotification("error", `Failed to save shifts: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };


  // Get employee name by email
  const getEmployeeName = (email: string) => {
    const employee = employees.find(emp => emp.email === email);
    return employee ? employee.fullname : email;
  };

  // Get current allocations for selected date
  const getCurrentAllocations = () => {
    const allocations = shiftAllocations[selectedDate];
    if (!allocations) {
      return { morning: [], evening: [], night: [] };
    }
    
    // Ensure all shift types are present
    return {
      morning: allocations.morning || [],
      evening: allocations.evening || [],
      night: allocations.night || []
    };
  };

  // Get employees not assigned to any shift on the selected date
  const getAvailableEmployees = () => {
    return employees.filter(emp => !isEmployeeAssigned(emp.email));
  };

  // Fetch OT records
  const fetchOtRecords = useCallback(async () => {
    try {
      setOtLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_ot/`);
      if (!response.ok) throw new Error("Failed to fetch OT records");
      const data = await response.json();
      setOtRecords(data.ot_records || []);
    } catch (err) {
      console.error("Error fetching OT records:", err);
      showNotification("error", "Failed to load OT records");
    } finally {
      setOtLoading(false);
    }
  }, []);

  // Create OT record
  const createOtRecord = async (employeeEmail: string, otStart: string, otEnd: string) => {
    try {
      setOtLoading(true);

      // Format datetime strings to match API expectation (ISO 8601 with Z suffix)
      const formatDateTime = (dateTimeStr: string) => {
        // Convert local datetime to ISO string with Z suffix
        const date = new Date(dateTimeStr);
        return date.toISOString();
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_ot/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: employeeEmail,
          manager_email: managerEmail,
          ot_start: formatDateTime(otStart),
          ot_end: formatDateTime(otEnd),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create OT record');
      }

      showNotification("success", "OT record created successfully!");
      await fetchOtRecords(); // Refresh OT records
    } catch (err) {
      console.error("Error creating OT record:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create OT record";
      showNotification("error", errorMessage);
    } finally {
      setOtLoading(false);
    }
  };

  // Delete OT record
  const deleteOtRecord = async (otId: number) => {
    try {
      console.log('Attempting to delete OT record with ID:', otId);
      console.log('OT record details:', otRecords.find(ot => ot.id === otId));

      const token = localStorage.getItem('authToken');
      console.log('Auth token:', token ? 'Present' : 'Not found');
      console.log('Auth token value:', token);

      const deleteUrl = `https://hrms.globaltechsoftwaresolutions.cloud/api/accounts/delete_ot/${otId}/`;
      console.log('Delete URL:', deleteUrl);
      console.log('All OT records:', otRecords);

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`Failed to delete OT record: ${response.status} ${response.statusText}`);
      }

      const result = await response.text();
      console.log('Delete result:', result);

      showNotification("success", "OT record deleted successfully!");
      await fetchOtRecords(); // Refresh OT records
    } catch (err) {
      console.error("Error deleting OT record:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete OT record";
      showNotification("error", errorMessage);
    } finally {
      setDeleteConfirm({ show: false, otId: null, employeeName: '' });
    }
  };

  // Fetch OT records on component mount
  useEffect(() => {
    fetchOtRecords();
  }, [fetchOtRecords]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Shift Maker</h1>
        
        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg ${notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {notification.message}
          </div>
        )}
        
        {/* Date Selector */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Select Date</h2>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* OT Records for Selected Date */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Overtime Records for {new Date(selectedDate).toLocaleDateString()}</h2>

          {otLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading OT records...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Filter OT records for the selected date
                const selectedDateOT = otRecords.filter((ot) => {
                  const otDate = new Date(ot.ot_start);
                  const selected = new Date(selectedDate);
                  return otDate.toDateString() === selected.toDateString();
                });

                if (selectedDateOT.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p>No overtime records found for this date.</p>
                    </div>
                  );
                }

                return selectedDateOT.map((ot, index) => {
                  const startTime = new Date(ot.ot_start).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                  const endTime = new Date(ot.ot_end).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });

                  // Calculate duration in hours and minutes
                  const start = new Date(ot.ot_start);
                  const end = new Date(ot.ot_end);
                  const diffMs = end.getTime() - start.getTime();
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                  const duration = diffHours > 0
                    ? `${diffHours}h ${diffMinutes}m`
                    : `${diffMinutes}m`;

                  return (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-green-800 text-sm">
                          {ot.emp_name || getEmployeeName(ot.email)}
                        </h4>
                        <button
                          onClick={() => setDeleteConfirm({
                            show: true,
                            otId: ot.id,
                            employeeName: ot.emp_name || getEmployeeName(ot.email)
                          })}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs rounded font-medium transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">🕐 Start:</span>
                          <span className="text-sm font-medium text-gray-700">{startTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">🕐 End:</span>
                          <span className="text-sm font-medium text-gray-700">{endTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">⏱️ Duration:</span>
                          <span className="text-sm font-bold text-green-600">{duration}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading employees...</p>
          </div>
        ) : (
          <>
            {/* Shift Allocation */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Allocate Shifts for {new Date(selectedDate).toLocaleDateString()}
                {selectedDate === today && isTodayLocked && " (Locked)"}
              </h2>

              {/* Display existing shifts for the selected date */}
              {!editMode && existingShifts.filter(shift => shift.date === selectedDate).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-blue-800">Existing Shifts for {new Date(selectedDate).toLocaleDateString()}</h3>
                    {/* Edit button to modify existing shifts */}
                    <button
                      disabled={new Date(selectedDate) < new Date(today)}
                      onClick={() => {

                        // Convert existing shifts to the allocation format
                        const shiftsForDate = existingShifts.filter(shift => shift.date === selectedDate);
                        const newAllocations: ShiftAllocation = {};
                        
                        newAllocations[selectedDate] = {
                          morning: shiftsForDate.filter(s => s.shift === "Morning").map(s => s.emp_email),
                          evening: shiftsForDate.filter(s => s.shift === "Evening").map(s => s.emp_email),
                          night: shiftsForDate.filter(s => s.shift === "Night").map(s => s.emp_email)
                        };
                        
                        setShiftAllocations(prev => ({
                          ...prev,
                          ...newAllocations
                        }));

                        setEditMode(true);

                        showNotification("success", "Loaded existing shifts for editing. Make changes and save when ready.");
                      }}
                      className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        new Date(selectedDate) < new Date(today)
                          ? "bg-gray-300 cursor-not-allowed text-gray-500"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      Edit Shifts
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Group shifts by shift type */}
                    {(() => {
                      const shiftsForDate = existingShifts.filter(shift => shift.date === selectedDate);
                      const morningShifts = shiftsForDate.filter(shift => shift.shift === "Morning");
                      const eveningShifts = shiftsForDate.filter(shift => shift.shift === "Evening");
                      const nightShifts = shiftsForDate.filter(shift => shift.shift === "Night");
                      
                      return (
                        <>
                          {/* Morning Shifts */}
                          {morningShifts.length > 0 && (
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                              <h4 className="font-semibold text-blue-700 mb-2">Morning Shift</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {new Date(`1970-01-01T09:00:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} - {new Date(`1970-01-01T17:00:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} (8 hrs)
                              </p>
                              <ul className="space-y-1">
                                {morningShifts.map((shift) => (
                                  <li key={`morning-${shift.shift_id}`} className="text-sm flex justify-between">
                                    <span>{shift.emp_name}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Evening Shifts */}
                          {eveningShifts.length > 0 && (
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                              <h4 className="font-semibold text-yellow-700 mb-2">Evening Shift</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {new Date(`1970-01-01T17:00:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} - {new Date(`1970-01-01T01:00:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} (8 hrs)
                              </p>
                              <ul className="space-y-1">
                                {eveningShifts.map((shift) => (
                                  <li key={`evening-${shift.shift_id}`} className="text-sm flex justify-between">
                                    <span>{shift.emp_name}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Night Shifts */}
                          {nightShifts.length > 0 && (
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                              <h4 className="font-semibold text-purple-700 mb-2">Night Shift</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {new Date(`1970-01-01T01:00:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} - {new Date(`1970-01-01T09:00:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} (8 hrs)
                              </p>
                              <ul className="space-y-1">
                                {nightShifts.map((shift) => (
                                  <li key={`night-${shift.shift_id}`} className="text-sm flex justify-between">
                                    <span>{shift.emp_name}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Always show shift creation section when in edit mode or when there are no existing shifts */}
              {(editMode || existingShifts.filter(s => s.date === selectedDate).length === 0) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Morning Shift */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg mb-4">
                      <h3 className="font-semibold">Morning Shift</h3>
                      <p className="text-sm">{shiftTimes.morning.start} - {shiftTimes.morning.end} (8 hrs)</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Assigned Employees</h4>
                      <div 
                        className="min-h-[100px] bg-gray-50 rounded-lg p-3"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, "morning")}
                      >
                        {getCurrentAllocations().morning.length > 0 ? (
                          <div className="space-y-2">
                            {getCurrentAllocations().morning.map(email => (
                              <div 
                                key={email} 
                                className="flex items-center justify-between bg-white p-2 rounded border cursor-move"
                                draggable
                                onDragStart={(e) => handleDragStart(e, email)}
                                onDragEnd={handleDragEnd}
                              >
                                <span className="text-sm">{getEmployeeName(email)}</span>
                                <button 
                                  onClick={() => handleEmployeeSelect("morning", email)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Drag employees here or click &quot;Add&quot; below</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Available Employees</h4>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {getAvailableEmployees()
                          .filter((emp: Employee) => !getCurrentAllocations().morning.includes(emp.email))
                          .map(employee => (
                            <div 
                              key={employee.email} 
                              className="flex items-center justify-between bg-gray-50 p-2 rounded cursor-move"
                              draggable
                              onDragStart={(e) => handleDragStart(e, employee.email)}
                              onDragEnd={handleDragEnd}
                            >
                              <span className="text-sm truncate">{employee.fullname}</span>
                              <button 
                                onClick={() => handleEmployeeSelect("morning", employee.email)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Add
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Evening Shift */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="bg-yellow-50 text-yellow-800 px-3 py-2 rounded-lg mb-4">
                      <h3 className="font-semibold">Evening Shift</h3>
                      <p className="text-sm">{shiftTimes.evening.start} - {shiftTimes.evening.end} (8 hrs)</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Assigned Employees</h4>
                      <div 
                        className="min-h-[100px] bg-gray-50 rounded-lg p-3"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, "evening")}
                      >
                        {getCurrentAllocations().evening.length > 0 ? (
                          <div className="space-y-2">
                            {getCurrentAllocations().evening.map(email => (
                              <div 
                                key={email} 
                                className="flex items-center justify-between bg-white p-2 rounded border cursor-move"
                                draggable
                                onDragStart={(e) => handleDragStart(e, email)}
                                onDragEnd={handleDragEnd}
                              >
                                <span className="text-sm">{getEmployeeName(email)}</span>
                                <button 
                                  onClick={() => handleEmployeeSelect("evening", email)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Drag employees here or click &quot;Add&quot; below</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Available Employees</h4>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {getAvailableEmployees()
                          .filter((emp: Employee) => !getCurrentAllocations().evening.includes(emp.email))
                          .map(employee => (
                            <div 
                              key={employee.email} 
                              className="flex items-center justify-between bg-gray-50 p-2 rounded cursor-move"
                              draggable
                              onDragStart={(e) => handleDragStart(e, employee.email)}
                              onDragEnd={handleDragEnd}
                            >
                              <span className="text-sm truncate">{employee.fullname}</span>
                              <button 
                                onClick={() => handleEmployeeSelect("evening", employee.email)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Add
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Night Shift */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="bg-purple-50 text-purple-800 px-3 py-2 rounded-lg mb-4">
                      <h3 className="font-semibold">Night Shift</h3>
                      <p className="text-sm">{shiftTimes.night.start} - {shiftTimes.night.end} (8 hrs)</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Assigned Employees</h4>
                      <div 
                        className="min-h-[100px] bg-gray-50 rounded-lg p-3"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, "night")}
                      >
                        {getCurrentAllocations().night.length > 0 ? (
                          <div className="space-y-2">
                            {getCurrentAllocations().night.map(email => (
                              <div 
                                key={email} 
                                className="flex items-center justify-between bg-white p-2 rounded border cursor-move"
                                draggable
                                onDragStart={(e) => handleDragStart(e, email)}
                                onDragEnd={handleDragEnd}
                              >
                                <span className="text-sm">{getEmployeeName(email)}</span>
                                <button 
                                  onClick={() => handleEmployeeSelect("night", email)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Drag employees here or click &quot;Add&quot; below</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Available Employees</h4>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {getAvailableEmployees()
                          .filter((emp: Employee) => !getCurrentAllocations().night.includes(emp.email))
                          .map(employee => (
                            <div 
                              key={employee.email} 
                              className="flex items-center justify-between bg-gray-50 p-2 rounded cursor-move"
                              draggable
                              onDragStart={(e) => handleDragStart(e, employee.email)}
                              onDragEnd={handleDragEnd}
                            >
                              <span className="text-sm truncate">{employee.fullname}</span>
                              <button 
                                onClick={() => handleEmployeeSelect("night", employee.email)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Add
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button - show when in edit mode or when there are no existing shifts */}
              {(editMode || existingShifts.filter(s => s.date === selectedDate).length === 0) && (
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={saveShifts}
                    disabled={saving || (!editMode && selectedDate === today && isTodayLocked)}
                    className={`px-6 py-3 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center ${
                      saving || (!editMode && selectedDate === today && isTodayLocked)
                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Shifts"
                    )}
                  </button>
                </div>
              )}

              {/* Saved Shifts Section */}
              {getSavedShifts().length > 0 && (
                <div className="mt-8 bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved Shifts</h2>
                  <div className="space-y-4">
                    {getSavedShifts().map(date => (
                      <div key={date} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-gray-800">
                            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </h3>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => editSavedShifts(date)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                              disabled={date === today && isTodayLocked}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => removeSavedShifts(date)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Morning Shift */}
                          <div className="bg-blue-50 p-3 rounded">
                            <h4 className="font-medium text-blue-800 text-sm mb-2">Morning Shift</h4>
                            <div className="text-xs">
                              {savedShifts[date].morning.length > 0 ? (
                                <ul className="space-y-1">
                                  {savedShifts[date].morning.map(email => (
                                    <li key={`${date}-morning-${email}`} className="truncate">
                                      {getEmployeeName(email)}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-500">No employees</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Evening Shift */}
                          <div className="bg-yellow-50 p-3 rounded">
                            <h4 className="font-medium text-yellow-800 text-sm mb-2">Evening Shift</h4>
                            <div className="text-xs">
                              {savedShifts[date].evening.length > 0 ? (
                                <ul className="space-y-1">
                                  {savedShifts[date].evening.map((email: string) => (
                                    <li key={`${date}-evening-${email}`} className="truncate">
                                      {getEmployeeName(email)}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-500">No employees</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Night Shift */}
                          <div className="bg-purple-50 p-3 rounded">
                            <h4 className="font-medium text-purple-800 text-sm mb-2">Night Shift</h4>
                            <div className="text-xs">
                              {savedShifts[date].night.length > 0 ? (
                                <ul className="space-y-1">
                                  {savedShifts[date].night.map(email => (
                                    <li key={`${date}-night-${email}`} className="truncate">
                                      {getEmployeeName(email)}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-500">No employees</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* OT Records for Selected Date */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Overtime Records for {new Date(selectedDate).toLocaleDateString()}</h2>

              {otLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading OT records...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    // Filter OT records for the selected date
                    const selectedDateOT = otRecords.filter((ot) => {
                      const otDate = new Date(ot.ot_start);
                      const selected = new Date(selectedDate);
                      return otDate.toDateString() === selected.toDateString();
                    });

                    if (selectedDateOT.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <p>No overtime records found for this date.</p>
                        </div>
                      );
                    }

                    return selectedDateOT.map((ot, index) => {
                      const startTime = new Date(ot.ot_start).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });
                      const endTime = new Date(ot.ot_end).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });

                      // Calculate duration in hours and minutes
                      const start = new Date(ot.ot_start);
                      const end = new Date(ot.ot_end);
                      const diffMs = end.getTime() - start.getTime();
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                      const duration = diffHours > 0
                        ? `${diffHours}h ${diffMinutes}m`
                        : `${diffMinutes}m`;

                      return (
                        <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-green-800 text-sm">
                              {ot.emp_name || getEmployeeName(ot.email)}
                            </h4>
                            <button
                              onClick={() => setDeleteConfirm({
                                show: true,
                                otId: ot.id,
                                employeeName: ot.emp_name || getEmployeeName(ot.email)
                              })}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs rounded font-medium transition-colors"
                            >
                              🗑️ Delete
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">🕐 Start:</span>
                              <span className="text-sm font-medium text-gray-700">{startTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">🕐 End:</span>
                              <span className="text-sm font-medium text-gray-700">{endTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">⏱️ Duration:</span>
                              <span className="text-sm font-bold text-green-600">{duration}</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* OT (Overtime) Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Overtime (OT) Management</h2>

              {/* OT Creation Form */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mb-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Create Overtime Session</h3>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const employeeEmail = formData.get('employee') as string;
                    const otDate = formData.get('otDate') as string;
                    const startTime = formData.get('startTime') as string;
                    const endTime = formData.get('endTime') as string;

                    if (!employeeEmail || !otDate || !startTime || !endTime) {
                      showNotification("error", "Please fill in all fields");
                      return;
                    }

                    // Combine date and time
                    const otStart = `${otDate}T${startTime}:00`;
                    const otEnd = `${otDate}T${endTime}:00`;

                    await createOtRecord(employeeEmail, otStart, otEnd);
                    (e.target as HTMLFormElement).reset();
                  }}
                  className="space-y-6"
                >
                  {/* Employee Selection */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      👤 Select Employee
                    </label>
                    <select
                      name="employee"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="">Choose an employee...</option>
                      {employees.map(employee => (
                        <option key={employee.email} value={employee.email}>
                          {employee.fullname}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Selection */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      📅 Overtime Date
                    </label>
                    <input
                      type="date"
                      name="otDate"
                      required
                      defaultValue={new Date().toISOString().split('T')[0]}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>

                  {/* Time Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        🕐 Start Time
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 bg-gray-50 hover:bg-white transition-colors"
                      />
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        🕐 End Time
                      </label>
                      <input
                        type="time"
                        name="endTime"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 bg-gray-50 hover:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center pt-4">
                    <button
                      type="submit"
                      disabled={otLoading}
                      className={`px-8 py-3 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center gap-2 min-w-[200px] transition-all duration-200 ${
                        otLoading
                          ? "bg-gray-300 cursor-not-allowed text-gray-500"
                          : "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      }`}
                    >
                      {otLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating OT Session...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                          Create Overtime Session
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* OT Records Display */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Existing OT Records</h3>

                {otLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading OT records...</p>
                  </div>
                ) : otRecords.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otRecords.map((ot, index) => (
                      <div
                        key={`ot-${index}`}
                        className="bg-green-50 border border-green-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-green-800 text-sm">
                            {ot.emp_name || getEmployeeName(ot.email)}
                          </h4>
                          <button
                            onClick={() => setDeleteConfirm({
                              show: true,
                              otId: ot.id,
                              employeeName: ot.emp_name || getEmployeeName(ot.email)
                            })}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs rounded font-medium transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>

                        <div className="space-y-2">
                          {/* Start Time */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">🕐 Start:</span>
                            <span className="text-sm font-medium text-gray-700">
                              {new Date(ot.ot_start).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>

                          {/* End Time */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">🕐 End:</span>
                            <span className="text-sm font-medium text-gray-700">
                              {new Date(ot.ot_end).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>

                          {/* Date */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">📅 Date:</span>
                            <span className="text-xs text-gray-600">
                              {new Date(ot.ot_start).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>

                          {/* Total Hours */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">⏱️ Duration:</span>
                            <span className="text-xs font-medium text-green-600">
                              {(() => {
                                const start = new Date(ot.ot_start);
                                const end = new Date(ot.ot_end);
                                const diffMs = end.getTime() - start.getTime();
                                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                                if (diffHours > 0) {
                                  return diffMinutes > 0 ? `${diffHours} hr ${diffMinutes} min` : `${diffHours} hr`;
                                } else {
                                  return `${diffMinutes} min`;
                                }
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No OT records found.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      }
      {/* Monthly Shift Overview */}
      {Object.keys(shiftAllocations).length > 0 && (
        <div className="mt-10 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Monthly Shift Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(shiftAllocations).map((date) => (
              <div
                key={date}
                className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50"
              >
                <h3 className="font-semibold text-gray-800 mb-3">
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>

                <div className="space-y-3">
                  {/* Morning */}
                  <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-medium text-blue-800 text-sm mb-1">
                      Morning Shift
                    </h4>
                    {shiftAllocations[date].morning.length > 0 ? (
                      <ul className="text-xs space-y-1">
                        {shiftAllocations[date].morning.map((email) => (
                          <li key={`${date}-m-${email}`} className="truncate">
                            {getEmployeeName(email)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-xs">No employees</p>
                    )}
                  </div>

                  {/* Evening */}
                  <div className="bg-yellow-50 p-3 rounded">
                    <h4 className="font-medium text-yellow-800 text-sm mb-1">
                      Evening Shift
                    </h4>
                    {shiftAllocations[date].evening.length > 0 ? (
                      <ul className="text-xs space-y-1">
                        {shiftAllocations[date].evening.map((email: string) => (
                          <li key={`${date}-a-${email}`} className="truncate">
                            {getEmployeeName(email)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-xs">No employees</p>
                    )}
                  </div>

                  {/* Night */}
                  <div className="bg-purple-50 p-3 rounded">
                    <h4 className="font-medium text-purple-800 text-sm mb-1">
                      Night Shift
                    </h4>
                    {shiftAllocations[date].night.length > 0 ? (
                      <ul className="text-xs space-y-1">
                        {shiftAllocations[date].night.map((email) => (
                          <li key={`${date}-n-${email}`} className="truncate">
                            {getEmployeeName(email)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-xs">No employees</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete OT Record</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete the OT record for <strong>{deleteConfirm.employeeName}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false, otId: null, employeeName: '' })}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteOtRecord(deleteConfirm.otId!)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftMaker;
