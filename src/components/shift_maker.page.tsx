"use client";
import React, { useState, useEffect, useMemo } from "react";

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
                                  <li key={shift.shift_id} className="text-sm flex justify-between">
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
                                  <li key={shift.shift_id} className="text-sm flex justify-between">
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
                                  <li key={shift.shift_id} className="text-sm flex justify-between">
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
    </div>
  );
};

export default ShiftMaker;