"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { PieChart } from "react-minimal-pie-chart";

type AttendanceRecord = {
    id: string;
    date: string;
    status: "Present" | "Absent" | "Late" | "Half Day" | "Working In" | string;
    checkIn: string;
    checkOut: string | null;
    hoursWorked: string | null;
    email: string;
};

type APIResponseRecord = {
    date: string;
    status?: string;
    check_in?: string | null;
    check_out?: string | null;
    email: string;
};

type Leave = {
    id: string;
    employee_name: string;
    employee_email?: string;
    email?: string;
    date: string;
    status: "Pending" | "Approved" | "Rejected";
    reason: string;
};

export default function AttendancePortal() {
    const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
    const [fetchedAttendance, setFetchedAttendance] = useState<AttendanceRecord[]>([]);
    const [loadingFetchedAttendance, setLoadingFetchedAttendance] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [, setLeaves] = useState<Leave[]>([]);
    const [approvedLeavesCount, setApprovedLeavesCount] = useState<number>(0);
    const [selectedDateRecord, setSelectedDateRecord] = useState<AttendanceRecord | null>(null);
    const [isClient, setIsClient] = useState(false);
    // Tooltip state for calendar hover
    const [hoveredRecord, setHoveredRecord] = useState<AttendanceRecord | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
    // Month summary and pie chart hover
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    useEffect(() => {
        setIsClient(true);
        const storedEmail = localStorage.getItem("user_email") || localStorage.getItem("loggedInUser");
        if (storedEmail) setLoggedInEmail(storedEmail);
    }, []);

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoadingFetchedAttendance(true);
            setFetchError(null);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_attendance/`);
                if (!res.ok) throw new Error(`Error fetching attendance: ${res.statusText}`);
                const data: { attendance: APIResponseRecord[] } = await res.json();

                const transformed: AttendanceRecord[] = (data.attendance || []).map((rec, idx) => ({
                    id: idx.toString(),
                    date: rec.date,
                    status: rec.status || "-",
                    checkIn: rec.check_in || "-",
                    checkOut: rec.check_out || "-",
                    hoursWorked: "-",
                    email: rec.email,
                }));

                setFetchedAttendance(transformed);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Unknown error";
                setFetchError(message);
            } finally {
                setLoadingFetchedAttendance(false);
            }
        };
        fetchAttendance();
    }, []);

    useEffect(() => {
        const fetchLeaves = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_leaves/`);
                if (!res.ok) throw new Error(`Failed to fetch leaves: ${res.status}`);
                const data = await res.json();
                setLeaves(Array.isArray(data) ? data : data.leaves || []);
            } catch (err) {
                console.error("Error fetching leaves:", err);
                setLeaves([]);
            }
        };
        fetchLeaves();
    }, []);

    useEffect(() => {
        const fetchApprovedLeaves = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_leaves/`);
                if (!res.ok) throw new Error("Failed to fetch approved leaves");
                const data = await res.json();

                let leavesArray: Leave[] = [];
                if (Array.isArray(data)) {
                    leavesArray = data;
                } else if (Array.isArray(data.leaves)) {
                    leavesArray = data.leaves;
                }

                const normalizedEmail = (loggedInEmail || "").trim().toLowerCase();
                const approvedLeaves = leavesArray.filter((leave: Leave) => {
                    const email = (leave.employee_email || leave.email || "").trim().toLowerCase();
                    const status = (leave.status || "").trim().toLowerCase();
                    return email === normalizedEmail && status === "approved";
                });

                setApprovedLeavesCount(approvedLeaves.length);
            } catch {
                setApprovedLeavesCount(0);
            }
        };
        if (loggedInEmail) {
            fetchApprovedLeaves();
        }
    }, [loggedInEmail]);

    // Update selected date record when selectedDate changes
    useEffect(() => {
        if (selectedDate) {
            const record = fetchedAttendance.find(rec => {
                const recordEmail = (rec.email || "").trim().toLowerCase();
                const currentEmail = (loggedInEmail || "").trim().toLowerCase();
                const recordDate = formatDateForComparison(rec.date);
                return recordDate === selectedDate && recordEmail === currentEmail;
            });
            setSelectedDateRecord(record || null);
        } else {
            setSelectedDateRecord(null);
        }
    }, [selectedDate, fetchedAttendance, loggedInEmail]);


    // Helper function to format dates consistently for comparison
    const formatDateForComparison = (date: Date | string): string => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDateForDisplay = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Function to format time for display
    const formatTime = (timeStr: string | null | undefined): string => {
        if (!timeStr || timeStr === "-" || timeStr === "null") return "-";
        const match = /^(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/.exec(timeStr);
        if (!match) return timeStr;
        const [, hour, min, sec] = match;
        let h = parseInt(hour, 10);
        let m = parseInt(min, 10);
        const s = sec !== undefined ? parseInt(sec, 10) : 0;
        if (s >= 30) {
            m += 1;
            if (m >= 60) {
                m = 0;
                h = (h + 1) % 24;
            }
        }
        const period = h >= 12 ? "PM" : "AM";
        let displayHour = h % 12;
        if (displayHour === 0) displayHour = 12;
        const mm = m.toString().padStart(2, "0");
        return `${displayHour}:${mm} ${period}`;
    };

    // Calculate hours worked
    const calculateHoursWorked = (record: AttendanceRecord): string => {
        if (!record.checkIn || record.checkIn === "-" || record.checkIn === "null" ||
            !record.checkOut || record.checkOut === "-" || record.checkOut === "null") {
            return "-";
        }

        const checkInDate = new Date(`${record.date}T${record.checkIn}`);
        const checkOutDate = new Date(`${record.date}T${record.checkOut}`);
        let diffMs = checkOutDate.getTime() - checkInDate.getTime();

        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;

        let totalMinutes = Math.floor(diffMs / 60000);
        const leftoverMs = diffMs % 60000;
        if (leftoverMs >= 30000) totalMinutes += 1;

        const hoursPart = Math.floor(totalMinutes / 60);
        const minutesPart = totalMinutes % 60;
        return `${hoursPart}h ${minutesPart}m`;
    };

    // Month summary for the pie chart
    // Update to match react-calendar's onActiveStartDateChange signature and types
    const handleActiveStartDateChange = (
        { activeStartDate }: { activeStartDate: Date | null }
        // ignore unused parameters to avoid ESLint warnings
    ) => {
        if (activeStartDate) setCurrentMonth(activeStartDate);
    };

    const monthSummary = (() => {
        if (!isClient || !loggedInEmail) return { present: 0, absent: 0, workingIn: 0 };

        const normalizedEmail = (loggedInEmail || "").trim().toLowerCase();

        const filtered = fetchedAttendance.filter(rec => {
            const recordEmail = (rec.email || "").trim().toLowerCase();
            const d = new Date(rec.date);

            return (
                recordEmail === normalizedEmail &&
                d.getMonth() === currentMonth.getMonth() &&
                d.getFullYear() === currentMonth.getFullYear()
            );
        });

        let present = 0, absent = 0, workingIn = 0;
        filtered.forEach(rec => {
            if (rec.checkIn && rec.checkIn !== "-" && rec.checkIn !== "null") {
                if (rec.checkOut && rec.checkOut !== "-" && rec.checkOut !== "null") {
                    present++;
                } else {
                    workingIn++;
                }
            } else {
                absent++;
            }
        });

        return { present, absent, workingIn };
    })();

    const chartData = [
        { title: "Present", value: monthSummary.present, color: "#10b981" },
        { title: "Absent", value: monthSummary.absent, color: "#ef4444" },
        { title: "Working In", value: monthSummary.workingIn, color: "#f59e0b" },
    ];

    return (
        <DashboardLayout role="employee">
            <div className="min-h-screen bg-gray-50 p-4 md:p-6">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                        Employee Attendance
                    </h1>
                    <p className="text-gray-600">
                        Track and manage your attendance records
                    </p>
                </div>

                {/* Calendar Section */}
                <div className="mb-10">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Attendance Calendar</h2>
                    <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 items-stretch">
                        {/* Calendar Card */}
                        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
                            <div className="relative">
                                {isClient && (
                                    <Calendar
                                        value={selectedDate ? new Date(selectedDate) : undefined}
                                        onChange={(val) => {
                                            const dateObj = Array.isArray(val) ? val[0] : val;
                                            if (dateObj) {
                                                const dateStr = formatDateForComparison(dateObj);
                                                setSelectedDate(dateStr);
                                            }
                                        }}
                                        tileClassName={({ date, view }) => {
                                            if (view !== "month") return "";
                                            return getTileClassName(date);
                                        }}
                                        // Add tooltip logic here via tileContent
                                        tileContent={({ date, view }) => {
                                            if (view !== "month") return null;
                                            // Only show tooltip for this user's records
                                            const dateStr = formatDateForComparison(date);
                                            const record = fetchedAttendance.find(rec => {
                                                const recordDate = formatDateForComparison(new Date(rec.date));
                                                const recordEmail = (rec.email || "").trim().toLowerCase();
                                                const currentEmail = (loggedInEmail || "").trim().toLowerCase();
                                                return recordDate === dateStr && recordEmail === currentEmail;
                                            });
                                            if (!record) return null;
                                            return (
                                                <div
                                                    onMouseOver={e => {
                                                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                                                        setHoveredRecord(record);
                                                        setHoveredPosition({
                                                            x: rect.left + rect.width / 2,
                                                            y: rect.top + rect.height,
                                                        });
                                                    }}
                                                    onMouseMove={e => {
                                                        // Update position as mouse moves
                                                        setHoveredPosition({
                                                            x: e.clientX,
                                                            y: e.clientY + 10,
                                                        });
                                                    }}
                                                    onMouseOut={() => {
                                                        setHoveredRecord(null);
                                                        setHoveredPosition(null);
                                                    }}
                                                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, cursor: "pointer" }}
                                                />
                                            );
                                        }}
                                        showNeighboringMonth={false}
                                        onActiveStartDateChange={handleActiveStartDateChange}
                                    />
                                )}
                                {/* Tooltip */}
                                {hoveredRecord && hoveredPosition && (
                                    <div
                                        className={`absolute bg-white/80 backdrop-blur-sm border shadow-lg rounded-lg p-2 text-xs z-50 pointer-events-none transition-opacity duration-300 ${hoveredRecord ? 'opacity-100' : 'opacity-0'
                                            }`}
                                        style={{
                                            left: hoveredPosition.x - 210 < 0 ? 0 : hoveredPosition.x - 210,
                                            top: hoveredPosition.y - 100,
                                            minWidth: 180,
                                            maxWidth: 240,
                                        }}
                                    >
                                        <div className="font-semibold mb-1 text-gray-800">
                                            {formatDateForDisplay(hoveredRecord.date)}
                                        </div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-gray-600">Status:</span>
                                            <span
                                                className={`font-medium px-2 py-0.5 rounded ${hoveredRecord.checkIn && hoveredRecord.checkIn !== '-' && hoveredRecord.checkIn !== 'null'
                                                        ? hoveredRecord.checkOut && hoveredRecord.checkOut !== '-' && hoveredRecord.checkOut !== 'null'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {hoveredRecord.checkIn && hoveredRecord.checkIn !== '-' && hoveredRecord.checkIn !== 'null'
                                                    ? hoveredRecord.checkOut && hoveredRecord.checkOut !== '-' && hoveredRecord.checkOut !== 'null'
                                                        ? 'Present'
                                                        : 'Working In'
                                                    : 'Absent'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-gray-600">Check-in:</span>
                                            <span className="text-green-700 font-medium">{formatTime(hoveredRecord.checkIn)}</span>
                                        </div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-gray-600">Check-out:</span>
                                            <span className="text-red-700 font-medium">{formatTime(hoveredRecord.checkOut)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Hours:</span>
                                            <span className="text-blue-700 font-medium">{calculateHoursWorked(hoveredRecord)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Selected Date Card - Appears below calendar when date is selected */}
                            {selectedDate && selectedDateRecord && (
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-blue-800">
                                            {new Date(selectedDate).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setSelectedDate(null);
                                                setSelectedDateRecord(null);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Check-in:</span>
                                                <span className="font-medium text-green-600">
                                                    {formatTime(selectedDateRecord.checkIn)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Check-out:</span>
                                                <span className="font-medium text-red-600">
                                                    {formatTime(selectedDateRecord.checkOut)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Status:</span>
                                                <span className={`font-medium px-2 py-1 rounded ${selectedDateRecord.checkIn && selectedDateRecord.checkIn !== "-" && selectedDateRecord.checkIn !== "null"
                                                        ? selectedDateRecord.checkOut && selectedDateRecord.checkOut !== "-" && selectedDateRecord.checkOut !== "null"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                        : "bg-red-100 text-red-800"
                                                    }`}>
                                                    {selectedDateRecord.checkIn && selectedDateRecord.checkIn !== "-" && selectedDateRecord.checkIn !== "null"
                                                        ? selectedDateRecord.checkOut && selectedDateRecord.checkOut !== "-" && selectedDateRecord.checkOut !== "null"
                                                            ? "Present"
                                                            : "Working In"
                                                        : "Absent"
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Hours:</span>
                                                <span className="font-medium text-blue-600">
                                                    {calculateHoursWorked(selectedDateRecord)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedDate && !selectedDateRecord && (
                                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-fade-in">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {new Date(selectedDate).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </h3>
                                        <button
                                            onClick={() => setSelectedDate(null)}
                                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <p className="text-gray-500 text-sm">No attendance record found for this date.</p>
                                </div>
                            )}

                            {!selectedDate && (
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="mt-4 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition w-full text-sm font-medium opacity-50 cursor-not-allowed"
                                    disabled
                                >
                                    Select a date to view details
                                </button>
                            )}

                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-3 mt-6 w-full text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-green-100 border border-green-400"></span>
                                    <span className="text-gray-600">Present</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-400"></span>
                                    <span className="text-gray-600">Sunday</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-400"></span>
                                    <span className="text-gray-600">Working</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-gray-100 border border-gray-400"></span>
                                    <span className="text-gray-600">Absent</span>
                                </div>
                            </div>
                        </div>

                        {/* Pie Chart Card */}
                        <div className="w-full md:w-80 bg-white rounded-lg border border-gray-200 p-6 relative">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">
                                {new Date(currentMonth).toLocaleString("default", { month: "long", year: "numeric" })} Attendance Summary
                            </h3>
                            {(() => {
                                // Find out how many categories have value > 0
                                const nonZeroSegments = chartData.filter(d => d.value > 0);
                                if (nonZeroSegments.length === 1) {
                                    // Only one category has value > 0. Show number in center.
                                    const category = nonZeroSegments[0];
                                    return (
                                        <div className="relative flex items-center justify-center" style={{ height: 180 }}>
                                            <PieChart
                                                data={chartData}
                                                animate
                                                label={() => ""}
                                                radius={38}
                                                style={{ height: 180 }}
                                            />
                                            <div
                                                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                                                style={{ top: 0, left: 0 }}
                                            >
                                                <span
                                                    className="text-4xl font-bold"
                                                    style={{ color: "#000" }}
                                                >
                                                    {category.value}
                                                </span>
                                                <span className="text-xs text-gray-600 mt-1">{category.title}</span>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    // Multiple segments: show normal PieChart with label and hovered info
                                    return (
                                        <>
                                            <PieChart
                                                data={chartData}
                                                animate
                                                onMouseOver={(e, index) => setHoveredIndex(index)}
                                                onMouseOut={() => setHoveredIndex(null)}
                                                label={({ dataEntry }) => (dataEntry.value > 0 ? `${dataEntry.value}` : "")}
                                                labelStyle={{ fontSize: "10px", fontFamily: "inherit", fill: "#374151" }}
                                                radius={38}
                                                labelPosition={68}
                                                style={{ height: 180 }}
                                            />
                                            {hoveredIndex !== null && (
                                                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white border shadow-lg px-3 py-2 rounded-lg text-xs text-gray-700 animate-fade-in">
                                                    <span className="font-semibold">{chartData[hoveredIndex].title}:</span> {chartData[hoveredIndex].value} days (
                                                    {(
                                                        (chartData[hoveredIndex].value /
                                                            (chartData[0].value + chartData[1].value + chartData[2].value)) *
                                                        100
                                                    ).toFixed(1)}
                                                    %)
                                                </div>
                                            )}
                                        </>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-500 font-medium">Total Present Days</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {fetchedAttendance.filter(record => {
                                const recordEmail = (record.email || "").trim().toLowerCase();
                                const currentEmail = (loggedInEmail || "").trim().toLowerCase();
                                return recordEmail === currentEmail &&
                                    record.checkIn &&
                                    record.checkIn !== "-" &&
                                    record.checkIn !== "null" &&
                                    record.checkOut &&
                                    record.checkOut !== "-" &&
                                    record.checkOut !== "null";
                            }).length}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-500 font-medium">This Month Present</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {fetchedAttendance.filter(record => {
                                const recordEmail = (record.email || "").trim().toLowerCase();
                                const currentEmail = (loggedInEmail || "").trim().toLowerCase();
                                const recordDate = new Date(record.date);
                                const currentDate = new Date();
                                return recordEmail === currentEmail &&
                                    record.checkIn &&
                                    record.checkIn !== "-" &&
                                    record.checkIn !== "null" &&
                                    record.checkOut &&
                                    record.checkOut !== "-" &&
                                    record.checkOut !== "null" &&
                                    recordDate.getMonth() === currentDate.getMonth() &&
                                    recordDate.getFullYear() === currentDate.getFullYear();
                            }).length}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-500 font-medium">Approved Leaves</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {approvedLeavesCount}
                        </div>
                    </div>
                </div>

                {/* Attendance Records */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        {selectedDate ? `${formatDateForDisplay(selectedDate)} Attendance` : "Attendance Records"}
                    </h2>

                    <AttendanceRecordsWithDatePicker
                        fetchedAttendance={fetchedAttendance}
                        loggedInEmail={loggedInEmail}
                        loadingFetchedAttendance={loadingFetchedAttendance}
                        fetchError={fetchError}
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                        formatDateForComparison={formatDateForComparison}
                    />
                </div>
                {/* Responsive Attendance Cards Section */}
                <div className="mt-16">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">All Attendance Records</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {(fetchedAttendance
                            .filter(record => {
                                const recordEmail = (record.email || "").trim().toLowerCase();
                                const currentEmail = (loggedInEmail || "").trim().toLowerCase();
                                return recordEmail === currentEmail;
                            })
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        ).map(record => (
                            <div
                                key={record.id}
                                className="bg-white rounded-lg shadow-md p-4 border hover:shadow-lg transition flex flex-col gap-2"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm text-gray-500">{formatDateForDisplay(record.date)}</div>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${record.checkIn && record.checkIn !== "-" && record.checkIn !== "null"
                                            ? record.checkOut && record.checkOut !== "-" && record.checkOut !== "null"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                        }`}>
                                        {record.checkIn && record.checkIn !== "-" && record.checkIn !== "null"
                                            ? record.checkOut && record.checkOut !== "-" && record.checkOut !== "null"
                                                ? "Present"
                                                : "Working In"
                                            : "Absent"
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-gray-600">Check-in:</span>
                                    <span className="font-medium text-green-700">{formatTime(record.checkIn)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-gray-600">Check-out:</span>
                                    <span className="font-medium text-red-700">{formatTime(record.checkOut)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-gray-600">Hours:</span>
                                    <span className="font-medium text-blue-700">{calculateHoursWorked(record)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                /* Professional Calendar Styling with Excel-like Grid */
                .react-calendar {
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    background: white;
                    font-family: inherit;
                    width: 100%;
                }

                .react-calendar__navigation {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f8fafc;
                }

                .react-calendar__navigation button {
                    background: white;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    padding: 8px 12px;
                    font-weight: 600;
                    color: #374151;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-width: 44px;
                }

                .react-calendar__navigation button:hover {
                    background: #f3f4f6;
                    border-color: #9ca3af;
                }

                .react-calendar__navigation button:disabled {
                    background: #f9fafb;
                    color: #d1d5db;
                    cursor: not-allowed;
                }

                .react-calendar__navigation__label {
                    font-weight: 600;
                    color: #111827;
                    font-size: 1rem;
                }

                .react-calendar__month-view__weekdays {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    background: #f8fafc;
                    border-bottom: 1px solid #e5e7eb;
                }

                .react-calendar__month-view__weekdays__weekday {
                    padding: 12px 8px;
                    text-align: center;
                    font-weight: 600;
                    color: #374151;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    border-right: 1px solid #e5e7eb;
                }

                .react-calendar__month-view__weekdays__weekday:last-child {
                    border-right: none;
                }

                .react-calendar__month-view__days {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 0;
                    background-color: #e5e7eb;
                    border: 1px solid #e5e7eb;
                }

                .react-calendar__tile {
                    background: white;
                    border: none;
                    border-right: 1px solid #e5e7eb;
                    border-bottom: 1px solid #e5e7eb;
                    padding: 12px 8px;
                    font-size: 0.875rem;
                    transition: all 0.3s ease;
                    min-height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .react-calendar__tile:hover {
                    background: #f8fafc;
                    transform: scale(1.05);
                    z-index: 1;
                }

                .react-calendar__tile:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: -2px;
                    z-index: 1;
                }

                .react-calendar__tile--now {
                    background: #dbeafe;
                    color: #1e40af;
                    font-weight: 600;
                }

                .react-calendar__tile--active {
                    background: #3b82f6 !important;
                    color: white !important;
                    font-weight: 600;
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .react-calendar__tile:disabled {
                    background: #f9fafb;
                    color: #d1d5db;
                }

                .react-calendar__month-view__days__day--neighboringMonth {
                    display: none !important;
                }

                /* Remove borders for grid edges */
                .react-calendar__month-view__days .react-calendar__tile:nth-child(7n) {
                    border-right: none;
                }

                .react-calendar__month-view__days .react-calendar__tile:nth-last-child(-n+7) {
                    border-bottom: none;
                }

                /* Attendance Status Styling */
                .calendar-present {
                    background: #dcfce7 !important;
                    color: #166534 !important;
                    font-weight: 600;
                    border: 2px solid #16a34a !important;
                }

                /* Only Sundays (date.getDay() === 0) are styled as red/off-day.
                   Saturdays (date.getDay() === 6) are regular working days and
                   should NOT have any special color or border. */
                .calendar-sunday {
                    background: #fef2f2 !important;
                    color: #dc2626 !important;
                    font-weight: 600;
                    border: 2px solid #dc2626 !important;
                }

                .calendar-workingin {
                    background: #fef3c7 !important;
                    color: #92400e !important;
                    font-weight: 600;
                    border: 2px solid #d97706 !important;
                }

                .calendar-absent {
                    background: #f3f4f6 !important;
                    color: #6b7280 !important;
                    border: 2px solid #9ca3af !important;
                }

                /* FIXED: Remove any special styling for Saturdays */
                /* This ensures Saturdays appear as normal working days */
                .react-calendar__tile[data-day="6"] {
                    background: white !important;
                    color: #374151 !important;
                    border: 1px solid #e5e7eb !important;
                }

                .react-calendar__tile[data-day="6"]:hover {
                    background: #f8fafc !important;
                }

                .react-calendar__tile[data-day="6"].react-calendar__tile--now {
                    background: #dbeafe !important;
                    color: #1e40af !important;
                }

                .react-calendar__tile[data-day="6"].react-calendar__tile--active {
                    background: #3b82f6 !important;
                    color: white !important;
                }

                /* Animation for the selected date card */
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }

                /* Pulse animation for selected date */
                @keyframes pulse-glow {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
                    }
                    50% {
                        box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
                    }
                }

                .react-calendar__tile--active {
                    animation: pulse-glow 2s infinite;
                }
            `}</style>
        </DashboardLayout>
    );

    // Calendar tile classification:
    // - Sundays (date.getDay() === 0) are marked as "calendar-sunday" (red, off day).
    // - Saturdays (date.getDay() === 6) are treated as normal working days (no special color).
    // - Attendance records override the above.
    function getTileClassName(date: Date): string {
        const dateStr = formatDateForComparison(date);

        // Find matching attendance record
        const record = fetchedAttendance.find(rec => {
            const recordDate = formatDateForComparison(new Date(rec.date));
            const recordEmail = (rec.email || "").trim().toLowerCase();
            const currentEmail = (loggedInEmail || "").trim().toLowerCase();
            return recordDate === dateStr && recordEmail === currentEmail;
        });

        if (record) {
            if (record.checkIn && record.checkIn !== "-" && record.checkIn !== "null") {
                if (record.checkOut && record.checkOut !== "-" && record.checkOut !== "null") {
                    return "calendar-present";
                } else {
                    return "calendar-workingin";
                }
            } else {
                return "calendar-absent";
            }
        }

        // Only Sundays (day 0) should be red
        if (date.getDay() === 0) return "calendar-sunday";

        // Saturdays (day 6) are normal working days — no special color
        return "";
    }
}

function AttendanceRecordsWithDatePicker({
    fetchedAttendance,
    loggedInEmail,
    loadingFetchedAttendance,
    fetchError,
    selectedDate,
    formatDateForComparison,
}: {
    fetchedAttendance: AttendanceRecord[];
    loggedInEmail: string | null;
    loadingFetchedAttendance: boolean;
    fetchError: string | null;
    selectedDate: string | null;
    onDateChange: (date: string | null) => void;
    formatDateForComparison: (date: Date | string) => string;
}) {
    if (loadingFetchedAttendance) {
        return <p className="text-gray-500 text-sm">Loading attendance records...</p>;
    }

    if (fetchError) {
        return <p className="text-red-500 text-sm">Error fetching attendance: {fetchError}</p>;
    }

    const normalizedEmail = (loggedInEmail || "").trim().toLowerCase();

    const filteredRecords = fetchedAttendance
        .filter(record => {
            const recordEmail = (record.email || "").trim().toLowerCase();
            if (recordEmail !== normalizedEmail) return false;
            if (selectedDate) {
                return formatDateForComparison(record.date) === selectedDate;
            }
            return true;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filteredRecords.length === 0) {
        return <p className="text-gray-500 text-sm">No attendance records found.</p>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredRecords.map(record => (
                <div key={record.id} className="bg-white rounded-lg border p-3 shadow-sm flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                        <span>{new Date(record.date).toLocaleDateString()}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${record.checkIn && record.checkIn !== "-" && record.checkIn !== "null"
                                ? record.checkOut && record.checkOut !== "-" && record.checkOut !== "null"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                            {record.checkIn && record.checkIn !== "-" && record.checkIn !== "null"
                                ? record.checkOut && record.checkOut !== "-" && record.checkOut !== "null"
                                    ? "Present"
                                    : "Working In"
                                : "Absent"
                            }
                        </span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>Check-in:</span>
                        <span className="text-green-700 font-medium">{record.checkIn}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>Check-out:</span>
                        <span className="text-red-700 font-medium">{record.checkOut}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>Hours:</span>
                        <span className="text-blue-700 font-medium">{record.hoursWorked || "-"}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}