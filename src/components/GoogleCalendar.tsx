"use client";

import React, { useState, useEffect, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type Holiday = {
  date: string;
  summary: string;
  type: "Government" | "Bank" | "Festival" | "Jayanthi";
  description?: string;
};

type CalendarView = "month" | "year" | "decade" | "century";

type GoogleCalendarEvent = {
  start: { date?: string; dateTime?: string };
  summary?: string;
  description?: string;
};

const HolidayCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<CalendarView>("month");
  const [filter, setFilter] = useState<Holiday["type"] | "All">("All");

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        if (!API_KEY) throw new Error("Google API key is not configured");

        const calendarId = encodeURIComponent(
          "en.indian#holiday@group.v.calendar.google.com"
        );

        const currentYear = new Date().getFullYear();
        const endYear = currentYear + 1;
        const allHolidays: Holiday[] = [];

        for (let year = currentYear; year <= endYear; year++) {
          const timeMin = `${year}-01-01T00:00:00Z`;
          const timeMax = `${year}-12-31T23:59:59Z`;

          const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&maxResults=250&orderBy=startTime&singleEvents=true`;

          const res = await fetch(url);
          if (!res.ok) {
            const errorText = await res.text();
            console.error("API Error:", errorText);
            throw new Error(`Failed to fetch holidays: ${res.status}`);
          }

          const data = await res.json();
          if (!data.items || data.items.length === 0) continue;

          const mapped: Holiday[] = (data.items as GoogleCalendarEvent[]).map(
            (event) => {
              const date = event.start?.date
                ? event.start.date
                : event.start?.dateTime?.split("T")[0];
              const summary = event.summary || "Holiday";
              const description = event.description || "";

              let type: Holiday["type"] = "Festival";
              const summaryLower = summary.toLowerCase();
              if (summaryLower.includes("bank")) type = "Bank";
              else if (summaryLower.includes("jayanti")) type = "Jayanthi";
              else if (
                summaryLower.includes("independence") ||
                summaryLower.includes("republic") ||
                summaryLower.includes("gandhi") ||
                summaryLower.includes("government") ||
                summaryLower.includes("labour")
              )
                type = "Government";

              return { date: date!, summary, type, description };
            }
          );

          allHolidays.push(...mapped);
        }

        setHolidays(allHolidays);
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

  const filteredHolidays = useMemo(() => {
    if (filter === "All") return holidays;
    return holidays.filter((h) => h.type === filter);
  }, [holidays, filter]);

  const getSelectedDateHolidays = (date: Date) => {
    const formatted = date.toLocaleDateString("en-CA");
    return holidays.filter((h) => h.date === formatted);
  };

  const handleDateChange = (value: Date) => setSelectedDate(value);

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return "";
    const formatted = date.toLocaleDateString("en-CA");
    const dayHoliday = holidays.find((h) => h.date === formatted);
    if (dayHoliday) {
      switch (dayHoliday.type) {
        case "Government":
          return "holiday-gov";
        case "Bank":
          return "holiday-bank";
        case "Festival":
          return "holiday-festival";
        case "Jayanthi":
          return "holiday-jayanthi";
      }
    }
    return "";
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;
    const formatted = date.toLocaleDateString("en-CA");
    const dayHolidays = holidays.filter((h) => h.date === formatted);
    if (dayHolidays.length > 0) {
      return (
        <div className="absolute top-1 right-1 flex flex-col gap-0.5">
          {dayHolidays.map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-current opacity-70"
            />
          ))}
        </div>
      );
    }
    return null;
  };

  const holidayTypeCounts = useMemo(() => {
    const counts: Record<Holiday["type"] | "All", number> = {
      Government: 0,
      Bank: 0,
      Festival: 0,
      Jayanthi: 0,
      All: holidays.length,
    };
    holidays.forEach((h) => counts[h.type]++);
    return counts;
  }, [holidays]);

  const selectedDateHolidays = getSelectedDateHolidays(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Holiday Calendar
          </h1>
          <p className="text-gray-600">Indian national holidays and festivals</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* Calendar Section */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 lg:p-8">
                {/* Calendar Controls */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                  <div className="flex flex-wrap gap-5">
                    {(["month", "year", "decade"] as CalendarView[]).map(
                      (view) => (
                        <button
                          key={view}
                          onClick={() => setActiveView(view)}
                          className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                            activeView === view
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {view.charAt(0).toUpperCase() + view.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium shadow-lg shadow-green-500/25 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    📅 Today
                  </button>
                </div>

                {/* Calendar */}
                <div className="relative">
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-700 font-medium">
                          Loading holidays...
                        </p>
                      </div>
                    </div>
                  )}
                  <Calendar
                    onChange={handleDateChange}
                    value={selectedDate}
                    view={activeView}
                    onViewChange={(v) => setActiveView(v as CalendarView)}
                    tileClassName={tileClassName}
                    tileContent={tileContent}
                    className="rounded-xl border-0 shadow-inner bg-gray-50/50 p-4 mt-5 mb-5 gap-5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:space-y-8">
            {/* Selected Date */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Selected Date
              </h2>
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="text-lg font-semibold text-gray-800">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div className="space-y-3">
                {selectedDateHolidays.length > 0 ? (
                  selectedDateHolidays.map((h, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 bg-white hover:shadow-md"
                    >
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {h.summary}
                      </h3>
                      <p className="text-sm text-gray-600">{h.description}</p>
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {h.type}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 font-medium">
                    📅 No holidays today
                  </div>
                )}
              </div>
            </div>

            {/* Filter Holidays */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Filter Holidays
              </h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {(["All", "Government", "Bank", "Festival", "Jayanthi"] as const).map(
                  (t) => (
                    <button
                      key={t}
                      onClick={() => setFilter(t)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                        filter === t
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {t} <span>({holidayTypeCounts[t]})</span>
                    </button>
                  )
                )}
              </div>
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                {filteredHolidays.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 bg-white hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-800 text-sm">
                        {h.summary}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          h.type === "Government"
                            ? "bg-red-100 text-red-700"
                            : h.type === "Bank"
                            ? "bg-blue-100 text-blue-700"
                            : h.type === "Festival"
                            ? "bg-green-100 text-green-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {h.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(h.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium text-center">
            ⚠ {error}
          </div>
        )}
      </div>

      <style jsx global>{`
        .holiday-gov {
          background: linear-gradient(135deg, #dc2626, #ef4444) !important;
          color: white !important;
          border-radius: 12px !important;
        }
        .holiday-bank {
          background: linear-gradient(135deg, #2563eb, #3b82f6) !important;
          color: white !important;
          border-radius: 12px !important;
        }
        .holiday-festival {
          background: linear-gradient(135deg, #16a34a, #22c55e) !important;
          color: white !important;
          border-radius: 12px !important;
        }
        .holiday-jayanthi {
          background: linear-gradient(135deg, #9333ea, #a855f7) !important;
          color: white !important;
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
};

export default HolidayCalendar;
