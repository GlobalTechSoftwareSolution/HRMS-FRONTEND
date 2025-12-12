"use client";

import React, { useState, useEffect, useMemo } from "react";

type Holiday = {
  year: number;
  month: number;
  country: string;
  date: string;
  name: string;
  type: string;
  weekday: string;
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
  const [, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/holidays/`
        );
        if (!res.ok) throw new Error("Failed to fetch holidays");
        const data = await res.json();
        const holidaysData = Array.isArray(data) ? data : (data?.data || data?.holidays || []);
        setHolidays(holidaysData);
      } catch (err) {
        console.error("Error fetching holidays:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load holidays"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchHolidays();
  }, []);

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
                className={`text-[9px] sm:text-[10px] px-0.5 sm:px-1 py-0.5 rounded text-white truncate ${HOLIDAY_COLORS[holiday.type] || "bg-gray-400"}`}
                title={holiday.name}
              >
                {holiday.name.length > 8 ? holiday.name.substring(0, 8) + "..." : holiday.name}
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
                      <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                        <h4 className="font-medium text-gray-800 text-xs sm:text-sm truncate">{holiday.name}</h4>
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Holiday Calendar</h1>
          <p className="text-gray-600 text-xs sm:text-sm">View company holidays for {year}</p>
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
                          <h4 className="font-medium text-gray-800 text-xs sm:text-sm mb-0.5">{h.name}</h4>
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
