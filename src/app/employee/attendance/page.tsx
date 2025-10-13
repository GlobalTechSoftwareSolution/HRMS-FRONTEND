"use client";
import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Image from "next/image";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "react-calendar/dist/Calendar.css";

// API response type for mark_attendance endpoint
type APIResponse = {
    status?: string;
    message?: string;
    username?: string;
    email?: string;
};

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

type Holiday = {
    date: string;
    summary: string;
    type: "Government" | "Bank" | "Festival" | "Jayanthi";
    description?: string;
};

type Leave = {
    id: string;
    employee_name: string;
    employee_email: string;
    date: string;
    status: "Pending" | "Approved" | "Rejected";
    reason: string;
};

export default function AttendancePortal() {
    const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [scanning, setScanning] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [modalOpen, setModalOpen] = useState(false);
    const [recognizedName, setRecognizedName] = useState<string | null>(null);
    const [recognizedStatus, setRecognizedStatus] = useState<string | null>(null);
    const [recognizedEmail, setRecognizedEmail] = useState<string | null>(null);
    const [attendanceCompleted, setAttendanceCompleted] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const [fetchedAttendance, setFetchedAttendance] = useState<AttendanceRecord[]>([]);
    const [loadingFetchedAttendance, setLoadingFetchedAttendance] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    
    // New state for calendar and selection
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [apiResponse, setApiResponse] = useState<APIResponse | null>(null);
    // Approved leaves count state
    const [approvedLeavesCount, setApprovedLeavesCount] = useState<number>(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const today = new Date();

    // ------------------------- TIMERS & STORAGE -------------------------
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem("attendance");
        if (stored) setAttendance(JSON.parse(stored));
    }, []);

    useEffect(() => {
        const storedImage = localStorage.getItem("capturedImage");
        if (storedImage) setCapturedImage(storedImage);
    }, []);

    useEffect(() => {
        const storedEmail =
            localStorage.getItem("user_email") || localStorage.getItem("loggedInUser");
        if (storedEmail) setLoggedInEmail(storedEmail);
    }, []);

    useEffect(() => {
        localStorage.setItem("attendance", JSON.stringify(attendance));
    }, [attendance]);

    // ------------------------- FETCH FROM DB -------------------------
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

    // ------------------------- FETCH HOLIDAYS & LEAVES -------------------------
    // Google Calendar API item type
    interface GoogleCalendarItem {
        start?: { date?: string; dateTime?: string };
        summary?: string;
        description?: string;
    }
    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
                if (!API_KEY) throw new Error("Google API key missing");
                const calendarId = encodeURIComponent("en.indian#holiday@group.v.calendar.google.com");
                const timeMin = new Date("2024-01-01").toISOString();
                const timeMax = new Date("2030-12-31").toISOString();
                const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&maxResults=250&orderBy=startTime&singleEvents=true`;

                const res = await fetch(url);
                const data = await res.json();
                const holidaysParsed: Holiday[] = (data.items || []).map((item: GoogleCalendarItem) => {
                    const date = item.start?.date || item.start?.dateTime;
                    const summary = item.summary || "Unnamed Holiday";
                    const description = item.description || "";
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
                    return { date, summary, type, description };
                });
                setHolidays(holidaysParsed);
            } catch (err) {
                console.error("Error fetching holidays", err);
            }
        };
        fetchHolidays();
    }, []);

    useEffect(() => {
        const fetchLeaves = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/leaves`);
                if (!res.ok) throw new Error("Failed to fetch leaves");
                const data = await res.json();
                setLeaves(data);
            } catch (err) {
                console.error("Error fetching leaves:", err);
            }
        };
        fetchLeaves();
    }, []);

    // Fetch approved leaves count from /api/accounts/list_leaves/
    useEffect(() => {
        const fetchApprovedLeaves = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_leaves/`);
                if (!res.ok) throw new Error("Failed to fetch approved leaves");
                const data = await res.json();
                // The API is expected to return an array of leave objects
                if (Array.isArray(data)) {
                    setApprovedLeavesCount(
                        data.filter(
                            (leave: Leave) =>
                                leave.status === "Approved" &&
                                leave.employee_email === loggedInEmail
                        ).length
                    );
                } else if (Array.isArray(data.leaves)) {
                    setApprovedLeavesCount(
                        data.leaves.filter(
                            (leave: Leave) =>
                                leave.status === "Approved" &&
                                leave.employee_email === loggedInEmail
                        ).length
                    );
                } else {
                    setApprovedLeavesCount(0);
                }
            } catch {
                setApprovedLeavesCount(0);
                // Optionally log error
            }
        };
        if (loggedInEmail) {
            fetchApprovedLeaves();
        }
    }, [loggedInEmail]);

    // Calendar events for FullCalendar
    const calendarEvents = [
        ...holidays.map((h) => ({
            title: `${h.summary} (${h.type})`,
            start: h.date,
            backgroundColor:
                h.type === "Government"
                    ? "#3b82f6"
                    : h.type === "Bank"
                    ? "#a855f7"
                    : h.type === "Jayanthi"
                    ? "#22c55e"
                    : "#f97316",
            textColor: "#fff",
        })),
        ...leaves
            .filter(leave => leave.employee_email === loggedInEmail)
            .map((l) => ({
                title: `Leave - ${l.status}`,
                start: l.date,
                backgroundColor: l.status === "Approved" ? "#eab308" : "#f97316",
                textColor: "#000",
            })),
        ...fetchedAttendance
            .filter(record => record.email === loggedInEmail && record.checkIn && record.checkIn !== "-")
            .map((record) => ({
                title: "",
                start: record.date,
                display: "background",
                backgroundColor: record.checkOut ? "#10b981" : "#f59e0b",
            })),
    ];

    // ------------------------- WEBCAM & FACE SCAN -------------------------
    const startWebcam = async () => {
        setRecognizedName(null);
        setRecognizedStatus(null);
        setRecognizedEmail(null);
        setAttendanceCompleted(false);
        setApiResponse(null);
        setModalOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error("Error accessing webcam:", err);
        }
    };

    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleScanFace = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setScanning(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return setScanning(false);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Convert canvas to Blob (JPEG)
        canvas.toBlob(
            async (blob) => {
                if (!blob) {
                    setScanning(false);
                    return;
                }
                // For preview, still set capturedImage as data URL
                const previewUrl = canvas.toDataURL("image/jpeg");
                setCapturedImage(previewUrl);
                localStorage.setItem("capturedImage", previewUrl);

                try {
                    const formData = new FormData();
                    // Use a fixed filename like "mani2.jpeg" as in Postman
                    formData.append("image", blob, "mani2.jpeg");

                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/mark_attendance/`,
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                    // Accept any shape of response
                    const data: APIResponse = await res.json();
                    setApiResponse(data); // Save the API response

                    if (res.ok && data.username && data.email) {
                        setRecognizedName(data.username);
                        setRecognizedEmail(data.email);

                        if (data.email !== loggedInEmail) {
                            setRecognizedStatus("⚠ Please scan your own face / login with your email");
                            setAttendanceCompleted(false);
                            setScanning(false);
                            return;
                        }

                        // Only show attendance info if API recognized correct user
                        const userTodayRecord = attendance.find(
                            (record) =>
                                new Date(record.date).toDateString() === today.toDateString() &&
                                record.email === data.email
                        ) || fetchedAttendance.find(
                            (record) =>
                                new Date(record.date).toDateString() === today.toDateString() &&
                                record.email === data.email
                        );

                        if (!userTodayRecord) {
                            setRecognizedStatus("Ready to Check In");
                            setAttendanceCompleted(false);
                        } else if (
                            userTodayRecord &&
                            !userTodayRecord.checkOut &&
                            userTodayRecord.checkIn &&
                            userTodayRecord.checkIn !== "-"
                        ) {
                            setRecognizedStatus("Ready to Check Out");
                            setAttendanceCompleted(false);
                        } else {
                            setRecognizedStatus("Attendance completed for today");
                            setAttendanceCompleted(true);
                            stopWebcam();
                        }
                    } else if (
                        res.ok &&
                        typeof data.status === "string" &&
                        typeof data.message === "string" &&
                        !data.username &&
                        !data.email
                    ) {
                        // Try to extract the name from parentheses in the message
                        // e.g., "Attendance already marked for today (John Doe)"
                        let extractedName = "Unknown";
                        const match = data.message.match(/\(([^)]+)\)/);
                        if (match && match[1]) {
                            extractedName = match[1];
                        }
                        // Fallback: If today attendance exists for loggedInEmail, use that name/email
                        let fallbackName = extractedName;
                        let fallbackEmail = null;
                        const userTodayRecord =
                            attendance.find(
                                (record) =>
                                    new Date(record.date).toDateString() === today.toDateString() &&
                                    record.email === loggedInEmail
                            ) ||
                            fetchedAttendance.find(
                                (record) =>
                                    new Date(record.date).toDateString() === today.toDateString() &&
                                    record.email === loggedInEmail
                            );
                        if (
                            extractedName === "Unknown" &&
                            userTodayRecord &&
                            loggedInEmail
                        ) {
                            fallbackName = loggedInEmail;
                            fallbackEmail = loggedInEmail;
                        }
                        setRecognizedName(fallbackName);
                        setRecognizedEmail(fallbackEmail);
                        // Decide status string based on message
                        let status = "Attendance completed for today";
                        if (data.message.toLowerCase().includes("already marked")) {
                            status = "Attendance already marked for today";
                        } else if (data.message.toLowerCase().includes("completed")) {
                            status = "Attendance completed for today";
                        }
                        // If fallback to DB record, adjust status for check-out
                        if (
                            fallbackName === loggedInEmail &&
                            userTodayRecord &&
                            userTodayRecord.checkIn &&
                            !userTodayRecord.checkOut
                        ) {
                            status = "Attendance already marked for today";
                        }
                        setRecognizedStatus(status);
                        setAttendanceCompleted(true);
                        stopWebcam();
                    } else {
                        // Fallback: If today attendance exists for loggedInEmail, use that
                        const userTodayRecord =
                            attendance.find(
                                (record) =>
                                    new Date(record.date).toDateString() === today.toDateString() &&
                                    record.email === loggedInEmail
                            ) ||
                            fetchedAttendance.find(
                                (record) =>
                                    new Date(record.date).toDateString() === today.toDateString() &&
                                    record.email === loggedInEmail
                            );
                        if (userTodayRecord && loggedInEmail) {
                            setRecognizedName(loggedInEmail);
                            setRecognizedEmail(loggedInEmail);
                            setRecognizedStatus(
                                userTodayRecord.checkOut
                                    ? "Attendance completed for today"
                                    : "Attendance already marked for today"
                            );
                            setAttendanceCompleted(true);
                            stopWebcam();
                        } else {
                            setRecognizedName("Unknown");
                            setRecognizedEmail(null);
                            setRecognizedStatus("Face not recognized");
                            setAttendanceCompleted(false);
                        }
                    }
                } catch (err: unknown) {
                    console.error(err);
                    setRecognizedName("Error");
                    setRecognizedEmail(null);
                    setRecognizedStatus("Scan failed");
                    setAttendanceCompleted(false);
                }
                setScanning(false);
            },
            "image/jpeg"
        );
    };

    const handleCheckIn = () => {
        if (!recognizedEmail || !recognizedName) return;
        if (recognizedEmail !== loggedInEmail) {
            setRecognizedStatus("⚠ Please scan your own face / login with your email");
            return;
        }

        const nowTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        const newRecord: AttendanceRecord = {
            id: Date.now().toString(),
            date: today.toISOString().split("T")[0],
            status: "Present",
            checkIn: nowTime,
            checkOut: null,
            hoursWorked: null,
            email: recognizedEmail,
        };
        setAttendance((prev) => [newRecord, ...prev]);
        setRecognizedStatus("Checked In");
    };

    const handleCheckOut = () => {
        if (!recognizedEmail || !recognizedName) return;
        if (recognizedEmail !== loggedInEmail) {
            setRecognizedStatus("⚠ Please scan your own face / login with your email");
            return;
        }

        const userTodayRecord = attendance.find(
            (record) =>
                new Date(record.date).toDateString() === today.toDateString() &&
                record.email === recognizedEmail &&
                !record.checkOut
        );
        if (!userTodayRecord) return;

        const nowTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        const [inHour, inMinute] = userTodayRecord.checkIn.split(":").map(Number);
        const [outHour, outMinute] = nowTime.split(":").map(Number);
        let hoursWorked = outHour - inHour + (outMinute - inMinute) / 60;
        if (hoursWorked < 0) hoursWorked += 24;

        const updated: AttendanceRecord = {
            ...userTodayRecord,
            checkOut: nowTime,
            hoursWorked: hoursWorked.toFixed(1),
        };
        setAttendance((prev) =>
            prev.map((r) => (r.id === userTodayRecord.id ? updated : r))
        );
        setRecognizedStatus(`Checked Out at ${nowTime}`);
        setAttendanceCompleted(true);
        stopWebcam();
    };

    // Format date helper
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // ------------------------- RENDER -------------------------
    return (
        <DashboardLayout role="employee">
            <div className="min-h-screen bg-gray-50 p-4 md:p-6">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                        EMPLOYEE ATTENDANCE 📋
                    </h1>
                    <p className="text-gray-600">
                        Welcome back! Mark your attendance and track your records.
                    </p>
                </div>

                {/* Face Scan Button */}
                {!modalOpen && (
                    <div className="mb-8">
                        <button
                            onClick={startWebcam}
                            className="px-6 py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                            📸 Scan Face to Mark Attendance
                        </button>
                    </div>
                )}

                {/* Calendar Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Attendance Calendar</h2>
                    <div className="bg-white p-4 rounded-xl shadow-md w-full max-w-5xl">
                        {selectedDate && (
                            <div className="mb-2 text-center text-gray-700 font-semibold">
                                Showing attendance for: {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            </div>
                        )}
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            height="auto"
                            events={calendarEvents}
                            eventClick={(info) => {
                                const clickedDate = info.event.startStr.split("T")[0];
                                setSelectedDate(clickedDate);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                                const cell = info.el.closest(".fc-daygrid-day");
                                if (cell) {
                                    document.querySelectorAll(".fc-daygrid-day.highlight-day").forEach((el) => {
                                        el.classList.remove("highlight-day");
                                    });
                                    cell.classList.add("highlight-day");
                                }
                            }}
                            dateClick={(arg) => {
                                const local = new Date(arg.date.getTime() - arg.date.getTimezoneOffset() * 60000);
                                const dateStr = local.toISOString().split("T")[0];
                                if (dateStr !== selectedDate) {
                                    setSelectedDate(dateStr);
                                }
                                window.scrollTo({ top: 0, behavior: "smooth" });
                                const cell = arg.dayEl;
                                if (cell) {
                                    document.querySelectorAll(".fc-daygrid-day.highlight-day").forEach((el) => {
                                        el.classList.remove("highlight-day");
                                    });
                                    cell.classList.add("highlight-day");
                                }
                            }}
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: "dayGridMonth,dayGridWeek",
                            }}
                            dayCellClassNames={(arg) => {
                              const local = new Date(arg.date.getTime() - arg.date.getTimezoneOffset() * 60000);
                              const dateStr = local.toISOString().split("T")[0];
                              const classes: string[] = [];

                              // Highlight present days
                              if (
                                fetchedAttendance.some(
                                  (rec) =>
                                    rec.email === loggedInEmail &&
                                    rec.date === dateStr &&
                                    rec.checkIn &&
                                    rec.checkIn !== "-"
                                )
                              ) {
                                classes.push("user-present-day");
                              }

                              // Highlight Sundays
                              if (local.getDay() === 0) {
                                classes.push("sunday-day");
                              }

                              return classes;
                            }}
                        />
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="mt-3 px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 transition w-full"
                            >
                                Clear Date Selection
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-500">
                        <div className="text-sm text-gray-500">Total Present Days</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {fetchedAttendance.filter(record => 
                                record.email === loggedInEmail && 
                                record.checkIn && 
                                record.checkIn !== "-"
                            ).length}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
                        <div className="text-sm text-gray-500">This Month</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {fetchedAttendance.filter(record => 
                                record.email === loggedInEmail && 
                                record.checkIn && 
                                record.checkIn !== "-" &&
                                new Date(record.date).getMonth() === new Date().getMonth()
                            ).length}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-purple-500">
                        <div className="text-sm text-gray-500">Approved Leaves</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {approvedLeavesCount}
                        </div>
                    </div>
                </div>

                {/* Attendance Records */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        {selectedDate ? `${formatDate(selectedDate)} Attendance` : "Your Attendance Records"}
                    </h2>

                    <AttendanceRecordsWithDatePicker
                        fetchedAttendance={fetchedAttendance}
                        loggedInEmail={loggedInEmail}
                        loadingFetchedAttendance={loadingFetchedAttendance}
                        fetchError={fetchError}
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                    />
                </div>

                {/* Modal & Webcam */}
                {modalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl w-full max-w-md relative shadow-lg">
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    setRecognizedName(null);
                                    setRecognizedEmail(null);
                                    setRecognizedStatus(null);
                                    setAttendanceCompleted(false);
                                    setApiResponse(null);
                                    stopWebcam();
                                }}
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                            >
                                ✖
                            </button>

                            <h2 className="text-xl font-semibold mb-4">Face Scan</h2>

                            {!attendanceCompleted && (
                                <>
                                    <video ref={videoRef} autoPlay className="w-full rounded-lg border border-gray-200" />
                                    <canvas ref={canvasRef} className="hidden" />

                                    {!recognizedName ? (
                                        <button
                                            onClick={handleScanFace}
                                            disabled={scanning}
                                            className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            {scanning ? "Scanning..." : "Scan Face"}
                                        </button>
                                    ) : (
                                        <div className="text-center mt-4">
                                            {(() => {
                                                if (
                                                    recognizedEmail === loggedInEmail &&
                                                    recognizedName &&
                                                    recognizedName !== "Unknown"
                                                ) {
                                                    return (
                                                        <>
                                                            <div className="text-3xl font-bold mb-2">👋 {recognizedName}</div>
                                                            {capturedImage && (
                                                                <Image
                                                                    src={capturedImage}
                                                                    alt="Captured"
                                                                    width={128}
                                                                    height={128}
                                                                    className="mt-3 w-32 h-32 object-cover rounded-full mx-auto border shadow"
                                                                />
                                                            )}
                                                            <div className="text-lg mb-1">{recognizedStatus}</div>
                                                            <div className="text-gray-500">{currentTime.toLocaleTimeString()}</div>
                                                            {recognizedStatus === "Ready to Check In" && (
                                                                <button
                                                                    onClick={handleCheckIn}
                                                                    className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                                >
                                                                    📥 Check In
                                                                </button>
                                                            )}
                                                            {recognizedStatus === "Ready to Check Out" && (
                                                                <button
                                                                    onClick={handleCheckOut}
                                                                    className="mt-4 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                                >
                                                                    📤 Check Out
                                                                </button>
                                                            )}
                                                        </>
                                                    );
                                                }
                                                return (
                                                    <>
                                                        <div className="text-3xl font-bold mb-2">👋 {recognizedName}</div>
                                                        {capturedImage && (
                                                            <Image
                                                                src={capturedImage}
                                                                alt="Captured"
                                                                width={128}
                                                                height={128}
                                                                className="mt-3 w-32 h-32 object-cover rounded-full mx-auto border shadow"
                                                            />
                                                        )}
                                                        <div className="text-lg mb-1">{recognizedStatus}</div>
                                                        <div className="text-gray-500">{currentTime.toLocaleTimeString()}</div>
                                                    </>
                                                );
                                            })()}
                                            {apiResponse && (
                                              <div className="mt-5">
                                                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                      apiResponse?.status === "success"
                                                        ? "bg-green-100 text-green-700"
                                                        : apiResponse?.status === "error"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                    }`}>
                                                      {apiResponse?.status || "Info"}
                                                    </span>
                                                    <span className="text-gray-400 text-xs">API Response</span>
                                                  </div>
                                                  <div className="text-gray-800 text-sm">{apiResponse?.message}</div>
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {attendanceCompleted && (
                                <div className="text-center mt-4">
                                    {(() => {
                                        if (
                                            recognizedEmail === loggedInEmail &&
                                            recognizedName &&
                                            recognizedName !== "Unknown"
                                        ) {
                                            return (
                                                <>
                                                    <div className="text-3xl font-bold mb-2">✅ {recognizedName}</div>
                                                    {capturedImage && (
                                                        <Image
                                                            src={capturedImage}
                                                            alt="Captured"
                                                            width={128}
                                                            height={128}
                                                            className="mt-3 w-32 h-32 object-cover rounded-full mx-auto border shadow"
                                                        />
                                                    )}
                                                    <div className="text-lg mb-1">
                                                        {(attendance.find(
                                                            (record) =>
                                                                new Date(record.date).toDateString() === today.toDateString() &&
                                                                record.email === recognizedEmail
                                                        ) ||
                                                        fetchedAttendance.find(
                                                            (record) =>
                                                                new Date(record.date).toDateString() === today.toDateString() &&
                                                                record.email === recognizedEmail
                                                        ))?.checkOut
                                                            ? "Attendance completed for today"
                                                            : "Attendance already marked for today"}
                                                    </div>
                                                    <div className="text-gray-500">{currentTime.toLocaleTimeString()}</div>
                                                    <button
                                                        onClick={() => {
                                                            setModalOpen(false);
                                                            setRecognizedName(null);
                                                            setRecognizedEmail(null);
                                                            setRecognizedStatus(null);
                                                            setAttendanceCompleted(false);
                                                            setApiResponse(null);
                                                        }}
                                                        className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 w-full"
                                                    >
                                                        Close
                                                    </button>
                                                    {apiResponse && (
                                                      <div className="mt-5">
                                                        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                                                          <div className="flex items-center justify-between mb-2">
                                                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                              apiResponse?.status === "success"
                                                                ? "bg-green-100 text-green-700"
                                                                : apiResponse?.status === "error"
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-yellow-100 text-yellow-700"
                                                            }`}>
                                                              {apiResponse?.status || "Info"}
                                                            </span>
                                                            <span className="text-gray-400 text-xs">API Response</span>
                                                          </div>
                                                          <div className="text-gray-800 text-sm">{apiResponse?.message}</div>
                                                        </div>
                                                      </div>
                                                    )}
                                                </>
                                            );
                                        }
                                        return (
                                            <>
                                                <div className="text-3xl font-bold mb-2">✅ {recognizedName}</div>
                                                {capturedImage && (
                                                    <Image
                                                        src={capturedImage}
                                                        alt="Captured"
                                                        width={128}
                                                        height={128}
                                                        className="mt-3 w-32 h-32 object-cover rounded-full mx-auto border shadow"
                                                    />
                                                )}
                                                <div className="text-lg mb-1">{recognizedStatus}</div>
                                                <div className="text-gray-500">{currentTime.toLocaleTimeString()}</div>
                                                <button
                                                    onClick={() => {
                                                        setModalOpen(false);
                                                        setRecognizedName(null);
                                                        setRecognizedEmail(null);
                                                        setRecognizedStatus(null);
                                                        setAttendanceCompleted(false);
                                                        setApiResponse(null);
                                                    }}
                                                    className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 w-full"
                                                >
                                                    Close
                                                </button>
                                                {apiResponse && (
                                                  <div className="mt-5">
                                                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                                                      <div className="flex items-center justify-between mb-2">
                                                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                          apiResponse?.status === "success"
                                                            ? "bg-green-100 text-green-700"
                                                            : apiResponse?.status === "error"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                        }`}>
                                                          {apiResponse?.status || "Info"}
                                                        </span>
                                                        <span className="text-gray-400 text-xs"></span>
                                                      </div>
                                                      <div className="text-gray-800 text-sm">{apiResponse?.message}</div>
                                                    </div>
                                                  </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                /* Present day blocks */
                .user-present-day {
                  background-color: #bbf7d0 !important; /* Tailwind green-200 */
                  border: 2px solid #059669; /* bolder border */
                  border-radius: 8px;
                  transition: background-color 0.3s ease, border 0.3s ease;
                }

                /* Sundays */
                .sunday-day {
                  background-color: #fecaca !important; /* Tailwind red-200 */
                  border: 2px solid #dc2626; /* bolder border */
                  border-radius: 8px;
                  transition: background-color 0.3s ease, border 0.3s ease;
                }

                /* Remove event text inside calendar cells */
                .fc-event-title {
                  display: none;
                }

                .highlight-day {
                  background-color: rgba(59, 130, 246, 0.15) !important;
                  border-radius: 8px;
                  transition: background-color 0.3s ease;
                }
            `}</style>
        </DashboardLayout>
    );
}

// Updated AttendanceRecordsWithDatePicker with calendar integration
type AttendanceRecordsWithDatePickerProps = {
    fetchedAttendance: AttendanceRecord[];
    loggedInEmail: string | null;
    loadingFetchedAttendance: boolean;
    fetchError: string | null;
    selectedDate: string | null;
    onDateChange: (date: string | null) => void;
};

function AttendanceRecordsWithDatePicker({
    fetchedAttendance,
    loggedInEmail,
    loadingFetchedAttendance,
    fetchError,
    selectedDate,
    onDateChange,
}: AttendanceRecordsWithDatePickerProps) {
    // Compute today and yesterday in YYYY-MM-DD format
    const todayObj = new Date();
    const todayStr = todayObj.toISOString().split("T")[0];
    const yesterdayObj = new Date(todayObj);
    yesterdayObj.setDate(todayObj.getDate() - 1);
    // const yesterdayStr = yesterdayObj.toISOString().split("T")[0];

    // Filter attendance based on selected date
    let filtered = fetchedAttendance.filter((rec) => rec.email === loggedInEmail);
    
    if (selectedDate) {
        filtered = filtered.filter((rec) => rec.date === selectedDate);
    } else {
        // Show last 7 days by default when no date is selected
        const last7Days = new Date();
        last7Days.setDate(todayObj.getDate() - 7);
        filtered = filtered.filter((rec) => new Date(rec.date) >= last7Days);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <>
            <div className="mb-4 flex items-center gap-3 flex-wrap">
                <label htmlFor="attendance-date-picker" className="text-sm text-gray-700 font-medium">
                    Filter by date:
                </label>
                <input
                    id="attendance-date-picker"
                    type="date"
                    className="border px-3 py-2 rounded text-sm"
                    max={todayStr}
                    value={selectedDate || ""}
                    onChange={(e) => onDateChange(e.target.value || null)}
                />
                {selectedDate && (
                    <button
                        className="ml-2 text-sm text-blue-600 underline"
                        onClick={() => onDateChange(null)}
                        type="button"
                    >
                        Show Last 7 Days
                    </button>
                )}
            </div>

            {loadingFetchedAttendance && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {fetchError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <strong>Error:</strong> {fetchError}
                </div>
            )}

            {!loadingFetchedAttendance && !fetchError && (
                <>
                    {filtered.length === 0 ? (
                        <div className="border border-gray-300 bg-white rounded-lg shadow p-8 text-center text-gray-500 max-w-md mx-auto">
                            <div className="text-4xl mb-4">📊</div>
                            No attendance records found{selectedDate ? ` for ${selectedDate}` : " in the last 7 days"}.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((record, idx) => {
                                let status = record.status || "-";
                                let hoursWorked = "-";
                                let statusColor = "bg-gray-100 text-gray-700";

                                if (record.checkIn && record.checkIn !== "-") {
                                    if (record.checkOut && record.checkOut !== "-") {
                                        const checkInDate = new Date(`${record.date}T${record.checkIn}`);
                                        const checkOutDate = new Date(`${record.date}T${record.checkOut}`);
                                        const hours = ((checkOutDate.getTime() - checkInDate.getTime()) / 3600000).toFixed(2);
                                        hoursWorked = `${hours}h`;
                                        status = "Present";
                                        statusColor = "bg-green-100 text-green-700";
                                    } else {
                                        status = "Working In";
                                        statusColor = "bg-yellow-100 text-yellow-700";
                                    }
                                } else {
                                    status = "Absent";
                                    statusColor = "bg-red-100 text-red-700";
                                }

                                return (
                                    <div
                                        key={`${record.email}-${record.date}-${idx}`}
                                        className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-sm text-gray-500 font-medium mb-1">
                                                    {new Date(record.date).toLocaleDateString('en-US', { 
                                                        weekday: 'long', 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </div>
                                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                                                    {status}
                                                </div>
                                            </div>
                                            <div className="text-2xl">
                                                {status === "Present" ? "✅" : 
                                                 status === "Working In" ? "⏳" : 
                                                 status === "Absent" ? "❌" : "📊"}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Check-in:</span>
                                                <span className="font-medium">{record.checkIn}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Check-out:</span>
                                                <span className="font-medium">{record.checkOut || "-"}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                                <span className="text-sm text-gray-600">Hours worked:</span>
                                                <span className="font-medium text-blue-600">{hoursWorked}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </>
    );
}