"use client";

import React, { useState, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import { EventClickArg, EventContentArg } from "@fullcalendar/core";
import { DateClickArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

type Holiday = {
  date: string;
  summary: string;
  type: "Government" | "Bank" | "Festival" | "Jayanthi";
  description?: string;
};

interface GoogleCalendarEvent {
  start: {
    date?: string;
    dateTime?: string;
  };
  summary?: string;
  description?: string;
}

const HOLIDAY_COLORS: Record<Holiday["type"], string> = {
  Government: "bg-red-600",
  Bank: "bg-blue-600",
  Festival: "bg-green-600",
  Jayanthi: "bg-purple-600",
};

const HOLIDAY_EVENT_COLORS: Record<Holiday["type"], string> = {
  Government: "#dc2626",
  Bank: "#2563eb",
  Festival: "#16a34a",
  Jayanthi: "#9333ea",
};

const HolidayCalendar: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Holiday["type"] | "All">("All");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

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
        const endYear = 2030;
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

          const mapped: Holiday[] = data.items.map((event: GoogleCalendarEvent) => {
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
          });

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

  const events = useMemo(() => {
    return filteredHolidays.map((h) => ({
      title: h.summary,
      start: h.date + "T00:00:00",
      allDay: true,
      extendedProps: {
        type: h.type,
        description: h.description,
      },
      backgroundColor: HOLIDAY_EVENT_COLORS[h.type],
      borderColor: HOLIDAY_EVENT_COLORS[h.type],
      textColor: "#fff",
    }));
  }, [filteredHolidays]);

  const normalizeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateHolidays = useMemo(() => {
    return holidays.filter((h) => normalizeDate(h.date) === normalizeDate(selectedDate));
  }, [holidays, selectedDate]);

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedDate(normalizeDate(arg.dateStr));
  };

  const handleEventClick = (arg: EventClickArg) => {
    if (arg.jsEvent) {
      arg.jsEvent.preventDefault();
      arg.jsEvent.stopPropagation();
    }
    if (arg.event.start) {
      const dateStr = normalizeDate(arg.event.start.toISOString().split("T")[0]);
      if (dateStr !== normalizeDate(selectedDate)) {
        setSelectedDate(dateStr);
      }
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Calendar
          </h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
              <div className="p-6 lg:p-8">
                <div className="flex flex-wrap gap-5 mb-6">
                  {(["All", "Government", "Bank", "Festival", "Jayanthi"] as const).map(
                    (t) => (
                      <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
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

                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={events}
                  eventClick={handleEventClick}
                  dateClick={handleDateClick}
                  height="auto"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: '',
                  }}
                  dayMaxEventRows={3}
                  eventContent={(eventInfo: EventContentArg) => {
                    const type = eventInfo.event.extendedProps.type as Holiday["type"];
                    return (
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${HOLIDAY_COLORS[type]} shrink-0`}
                          aria-label={type}
                          title={type}
                        />
                        <span className="truncate">{eventInfo.event.title}</span>
                      </div>
                    );
                  }}
                  eventDisplay="block"
                  selectable={false}
                  fixedWeekCount={false}
                  dayCellClassNames={(arg) => {
                    const dateStr = normalizeDate(arg.date.toISOString());
                    if (dateStr === normalizeDate(selectedDate)) {
                      return ['!bg-blue-100'];
                    }
                    return [];
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:space-y-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Selected Date
              </h2>
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="text-lg font-semibold text-gray-800">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div className="space-y-3 min-h-[100px]">
                {selectedDateHolidays.length > 0 ? (
                  selectedDateHolidays.map((h, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 bg-white hover:shadow-md"
                    >
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {h.summary}
                      </h3>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{h.description}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${HOLIDAY_COLORS[h.type]} text-white`}>
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
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium text-center">
            ⚠ {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidayCalendar;
