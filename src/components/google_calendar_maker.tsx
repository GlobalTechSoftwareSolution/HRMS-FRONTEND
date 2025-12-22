"use client";

import React, { useState, useEffect, useMemo } from "react";

type Holiday = {
  id?: number;
  pk?: number;
  holiday_id?: number;
  _id?: number;
  year: number;
  month: number;
  country: string;
  date: string;
  name: string;
  type: string;
  weekday: string;
  canDelete?: boolean;
  _originalIndex?: number;
};

const HOLIDAY_COLORS: Record<string, string> = {
  "National Holiday": "bg-red-500",
  "Government Holiday": "bg-blue-500",
  "Jayanti/Festival": "bg-purple-500",
  "Festival": "bg-green-500",
  "Regional Festival": "bg-orange-400",
  "Harvest Festival": "bg-amber-500",
  "Observance": "bg-gray-500",
  "Observance/Restricted": "bg-gray-500",
  "Festival/National Holiday": "bg-pink-500",
  "Jayanti": "bg-purple-400",
  "Other": "bg-slate-400",
};

const HolidayCalendar: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  // State for new holiday form
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    country: "India",
    date: new Date().toISOString().split("T")[0],
    name: "",
    type: "National Holiday",
    weekday: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
  });

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchHolidays = async () => {
    try {
      setError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/holidays/`
      );
      if (!res.ok) throw new Error("Failed to fetch holidays");
      const data = await res.json();
      let holidaysData = Array.isArray(data) ? data : (data?.data || data?.holidays || []);
            
            // Ensure each holiday has an id property
            holidaysData = holidaysData.map((holiday: Holiday, index: number) => {
              // Log the raw holiday data for debugging
              console.log('Raw holiday data:', holiday);
              
              // Try to find an ID field
              const id = holiday.id || holiday.pk || holiday.holiday_id || holiday._id || null;
              console.log(`Processing holiday: ${holiday.name}, Found ID: ${id}`);
              
              // If no ID found, this holiday can't be deleted
              if (!id) {
                console.log(`Holiday '${holiday.name}' has no database ID and cannot be deleted`);
              } else {
                console.log(`Holiday '${holiday.name}' has valid ID: ${id} and can be deleted`);
              }
              
              const processedHoliday = {
                ...holiday,
                id: id,
                // Track if this holiday can be deleted (has an ID)
                canDelete: !!id,
                // Also preserve the original index for debugging
                _originalIndex: index
              };
              
              console.log('Processed holiday data:', processedHoliday);
              return processedHoliday;
            });
            
            console.log('Fetched holidays data:', holidaysData);
      setHolidays(holidaysData);
    } catch (err) {
      console.error("Error fetching holidays:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load holidays"
      );
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // Add a new holiday
  const addHoliday = async (holidayData: Omit<Holiday, 'id'>) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/holidays/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(holidayData),
        }
      );

      if (!res.ok) throw new Error("Failed to add holiday");
      
      // Optionally, we could add the new holiday to the list directly
      // But for simplicity, we'll just refresh all holidays
      await fetchHolidays();
      setIsAddModalOpen(false);
      setNewHoliday({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        country: "India",
        date: new Date().toISOString().split("T")[0],
        name: "",
        type: "National Holiday",
        weekday: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      });
      setError(null);
    } catch (err) {
      console.error("Error adding holiday:", err);
      setError(
        err instanceof Error ? err.message : "Failed to add holiday"
      );
    }
  };

  // Delete a holiday
  const deleteHoliday = async (id: number) => {
    console.log('Attempting to delete holiday with ID:', id);
    
    // Ensure ID is a valid number
    const holidayId = Number(id);
    if (!holidayId || holidayId <= 0 || isNaN(holidayId)) {
      console.log(`Cannot delete holiday: Invalid ID (${id}). This holiday may not be stored in the database.`);
      setNotification({message: 'Cannot delete this holiday. It may not be stored in the database.', type: 'error'});
      return;
    }
    
    // Show confirmation dialog
    const confirmDialog = window.confirm(`Are you sure you want to delete this holiday (ID: ${holidayId})?`);
    if (!confirmDialog) return;
    
    try {
      // Get auth token from localStorage if it exists
      const token = localStorage.getItem('authToken');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Use the direct API endpoint
      const endpoint = `https://hrms.globaltechsoftwaresolutions.cloud/api/accounts/holidays/${holidayId}/`;
      console.log('Trying DELETE endpoint:', endpoint);
      
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers,
      });

      console.log('Delete response status:', res.status);
      
      if (!res.ok) {
        const errorMsg = `Failed to delete holiday: ${res.status} ${res.statusText}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Refresh the holidays list to reflect the deletion
      console.log('Holiday deleted successfully, refreshing list');
      await fetchHolidays();
      setError(null);
      
      // Show success message
      setNotification({message: 'Holiday deleted successfully!', type: 'success'});
    } catch (err) {
      console.error("Error deleting holiday:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete holiday";
      // Don't show "Missing ID" errors to user
      if (errorMessage.includes('Missing ID')) return;
      setError(errorMessage);
      setNotification({message: `Error deleting holiday (ID: ${holidayId}): ${errorMessage}`, type: 'error'});
      // Refresh anyway in case the deletion actually worked but we got an error response
      setTimeout(() => fetchHolidays(), 1000);
    }
  };

  const normalizeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const selectedDateHolidays = useMemo(() => {
    return holidays.filter(
      (h) =>
        normalizeDate(h.date) === normalizeDate(selectedDate) &&
        new Date(h.date).getFullYear() === year
    );
  }, [holidays, selectedDate, year]);

  const goToPreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(today.toISOString().split("T")[0]);
  };

  // Simple Calendar Header
  const CalendarHeader = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={goToPreviousMonth}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <div className="text-base sm:text-xl font-bold text-gray-800">
            {monthsList[month]} {year}
          </div>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <button
        onClick={goToToday}
        className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Today
      </button>
    </div>
  );

  // Clean Week Days Header
  const WeekDaysHeader = () => {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center py-1 sm:py-2 text-[10px] sm:text-xs font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  // Compact Calendar Grid
  const CalendarGrid = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Empty days for the start of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 sm:h-16 md:h-20 border border-gray-200 bg-gray-50"></div>);
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1)
        .toString()
        .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const isToday = dateStr === new Date().toISOString().split("T")[0];
      const isSelected = dateStr === selectedDate;
      const dayHolidays = holidays.filter(
        (h) => normalizeDate(h.date) === dateStr
      );

      days.push(
        <div
          key={day}
          className={`h-12 sm:h-16 md:h-20 border border-gray-200 p-0.5 sm:p-1 cursor-pointer transition-all ${
            isSelected 
              ? "bg-blue-500 text-white" 
              : isToday 
                ? "bg-blue-100 border-blue-300" 
                : "bg-white hover:bg-gray-50"
          }`}
          onClick={() => setSelectedDate(dateStr)}
        >
          <div className={`text-[10px] sm:text-xs font-medium ${
            isSelected ? "text-white" : 
            isToday ? "text-blue-600 font-bold" : "text-gray-700"
          }`}>
            {day}
          </div>
          
          {/* Holidays - Compact */}
          <div className="mt-0.5 space-y-0.5 hidden sm:block">
            {dayHolidays.slice(0, 2).map((holiday, index) => (
              <div
                key={index}
                className={`flex items-center justify-between text-[9px] sm:text-[10px] px-0.5 sm:px-1 py-0.5 rounded text-white truncate ${HOLIDAY_COLORS[holiday.type] || "bg-gray-400"}`}
                title={holiday.name}
              >
                <span>{holiday.name.length > 8 ? holiday.name.substring(0, 8) + "..." : holiday.name}</span>
                {holiday.canDelete && holiday.id ? (
                  <button
                    onClick={() => {
                      console.log('Delete button clicked for holiday:', holiday);
                      console.log('Calling deleteHoliday with ID:', holiday.id);
                      console.log('Holiday ID type:', typeof holiday.id);
                      deleteHoliday(holiday.id as number);
                    }}
                    className="ml-1 text-white hover:text-gray-200"
                    title="Delete holiday"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                ) : (
                  <span className="ml-1 text-gray-300" title="This holiday cannot be deleted (not stored in database)">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
            {dayHolidays.length > 2 && (
              <div className={`text-[9px] sm:text-[10px] ${isSelected ? "text-blue-100" : "text-gray-500"}`}>
                +{dayHolidays.length - 2}
              </div>
            )}
          </div>
          
          {/* Mobile: Show dot indicator for holidays */}
          {dayHolidays.length > 0 && (
            <div className="sm:hidden flex justify-center mt-0.5">
              <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`}></div>
            </div>
          )}
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-0.5 sm:gap-1 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">{days}</div>;
  };

  // Holiday Cards for the bottom section
  const HolidayCards = () => {
    // Group holidays by month for the selected year only
    const holidaysByMonth = holidays
      .filter(h => new Date(h.date).getFullYear() === year)
      .reduce((acc, holiday) => {
        const month = new Date(holiday.date).getMonth();
        if (!acc[month]) acc[month] = [];
        acc[month].push(holiday);
        return acc;
      }, {} as Record<number, Holiday[]>);

    return (
      <div className="mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">All Holidays ({year})</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Object.entries(holidaysByMonth).map(([monthNum, monthHolidays]) => (
            <div key={monthNum} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 pb-2 border-b">
                {monthsList[parseInt(monthNum)]}
              </h3>
              
              <div className="space-y-1.5 sm:space-y-2">
                {monthHolidays
                  .sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate())
                  .map((holiday, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 hover:bg-gray-50 rounded transition-colors"
                  >
                    {/* Neutral style for holiday circle: gray background, text-gray-700 */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-gray-700 text-[10px] sm:text-xs font-medium bg-gray-200 flex-shrink-0">
                      {new Date(holiday.date).getDate()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-800 text-xs sm:text-sm mb-0.5">{holiday.name}</h4>
                        {holiday.canDelete && holiday.id ? (
                          <button
                            onClick={() => {
                              console.log('Delete button clicked for holiday:', holiday);
                              console.log('Calling deleteHoliday with ID:', holiday.id);
                              deleteHoliday(holiday.id as number);
                            }}
                            className="text-red-500 hover:text-red-700"
                            title="Delete holiday"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        ) : (
                          <span className="text-gray-300" title="This holiday cannot be deleted (not stored in database)">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600">
                        <span>{new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="truncate ml-1">{holiday.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Holiday Calendar</h1>
              <p className="text-gray-600 text-xs sm:text-sm">View company holidays for {year}</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Holiday
            </button>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2 mb-4">
          <label className="text-xs sm:text-sm font-medium text-gray-700">Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border rounded px-2 py-1 text-xs sm:text-sm"
          >
            {Array.from(new Set(holidays.map(h => new Date(h.date).getFullYear())))
              .sort()
              .map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Calendar - Smaller */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4">
              <CalendarHeader />
              <WeekDaysHeader />
              <CalendarGrid />
            </div>
          </div>

          {/* Right Sidebar - Compact */}
          <div className="space-y-3 sm:space-y-4">
            {/* Selected Date */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <h2 className="text-sm sm:text-md font-semibold text-gray-800 mb-2 sm:mb-3">Selected Date</h2>
              <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-xs sm:text-sm font-semibold text-gray-800">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-700 text-xs sm:text-sm">Holidays:</h3>
                {selectedDateHolidays.length > 0 ? (
                  selectedDateHolidays.map((h, i) => (
                    <div key={i} className="p-2 rounded border border-gray-200 bg-white">
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${HOLIDAY_COLORS[h.type] || "bg-gray-400"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h4 className="font-medium text-gray-800 text-xs sm:text-sm mb-0.5">{h.name}</h4>
                            {h.canDelete ? (
                              <button
                                onClick={() => {
                                  console.log('Delete button clicked for holiday:', h);
                                  console.log('Calling deleteHoliday with ID:', h.id);
                                  console.log('Holiday ID type:', typeof h.id);
                                  deleteHoliday(h.id as number);
                                }}
                                className="text-red-500 hover:text-red-700"
                                title="Delete holiday"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-gray-300" title="This holiday cannot be deleted (not stored in database)">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-600">{h.type}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 sm:py-3 text-gray-500">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <p className="text-[10px] sm:text-xs">No holidays</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats - Compact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <h2 className="text-sm sm:text-md font-semibold text-gray-800 mb-2 sm:mb-3">Overview</h2>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                <div className="text-center p-2 sm:p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="text-base sm:text-lg font-bold text-blue-600">
                    {holidays.filter(h => new Date(h.date).getFullYear() === year).length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-blue-600">Total Holidays</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Holiday Cards at Bottom */}
        <HolidayCards />

        {/* Add Holiday Modal */}
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
              <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Holiday</h2>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  addHoliday(newHoliday);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name *</label>
                  <input
                    type="text"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter holiday name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      setNewHoliday({
                        ...newHoliday, 
                        date: e.target.value,
                        year: selectedDate.getFullYear(),
                        month: selectedDate.getMonth() + 1,
                        weekday: selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newHoliday.type}
                    onChange={(e) => setNewHoliday({...newHoliday, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="National Holiday">National Holiday</option>
                    <option value="Government Holiday">Government Holiday</option>
                    <option value="Festival">Festival</option>
                    <option value="Regional Festival">Regional Festival</option>
                    <option value="Harvest Festival">Harvest Festival</option>
                    <option value="Observance">Observance</option>
                    <option value="Jayanti">Jayanti</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={newHoliday.country}
                    onChange={(e) => setNewHoliday({...newHoliday, country: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter country"
                  />
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
                    Add Holiday
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notification Popup */}
        {notification && (
          <div 
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
            style={{ minWidth: '250px' }}
          >
            <div className="flex justify-between items-start">
              <span>{notification.message}</span>
              <button 
                onClick={() => setNotification(null)}
                className="ml-4 text-white hover:text-gray-200 font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-red-50 border border-red-200 rounded text-red-700 text-center text-xs sm:text-sm">
            ⚠ {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidayCalendar;
