"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { PieChart } from "react-minimal-pie-chart";

type AttendanceRecord = {
    id: string;
    date: string;
    status: "Present" | "Absent" | "Working In" | "Late" | "Half Day" | string;
    checkIn: string;
    checkOut: string | null;
    checkInPhoto?: string | null;
    checkOutPhoto?: string | null;
    hoursWorked: string | null;
    email: string;
    fullname?: string;
    department?: string;
    shift?: string;
    shiftTime?: string;
    otHours?: number;
    breakHours?: number;
    otPeriods?: { start: string; end: string; hours: number }[];
    breakPeriods?: { start: string; end: string; duration: number }[];
};

type ShiftRecord = {
    id?: number;
    shift_id?: number;
    emp_email: string;
    employee_email?: string;
    shift: string;
    shift_type?: string;
    start_time: string;
    end_time: string;
    date: string;
    status?: string;
    ot_hours?: number;
};

type OTRecord = {
    id?: number;
    email: string;
    manager_email: string;
    ot_start: string;
    ot_end: string;
    date?: string;
    status?: string;
    hours?: number;
};

type BreakRecord = {
    id?: number;
    email: string;
    manager_email: string;
    break_start: string;
    break_end: string;
    date?: string;
    status?: string;
    duration?: number;
};

interface PhotoDisplayProps {
    src: string | null | undefined;
    alt: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

type APIResponseRecord = {
    date: string;
    status?: string;
    check_in?: string | null;
    check_out?: string | null;
    check_in_photo?: string | null;
    check_out_photo?: string | null;
    email: string;
};

type Leave = {
    id: string;
    employee_name: string;
    employee_email?: string;
    email?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    from_date?: string;
    to_date?: string;
    status: "Pending" | "Approved" | "Rejected";
    reason: string;
};

type AbsenceRecord = {
    email: string;
    fullname: string;
    department: string;
    date: string;
};

type ProfileData = {
    email: string;
    fullname: string;
    phone?: string;
    department?: string | null;
    designation?: string | null;
    date_of_birth?: string | null;
    date_joined?: string | null;
    skills?: string | null;
    profile_picture?: string | null;
    gender?: string | null;
    marital_status?: string | null;
    nationality?: string | null;
    residential_address?: string | null;
    permanent_address?: string | null;
    emergency_contact_name?: string | null;
};
const deriveStatus = (record: AttendanceRecord): string => {
    if (!record) return "-";
    if (record.status === "Sunday") return "Sunday";
    if (record.status === "Absent") return "Absent";

    const hasIn = !!(record.checkIn && record.checkIn !== "-" && record.checkIn !== "null");
    const hasOut = !!(record.checkOut && record.checkOut !== "-" && record.checkOut !== "null");

    if (hasIn && hasOut) return "Present";
    if (hasIn && !hasOut) return "Working In";

    return record.status && record.status !== "-" ? record.status : "-";
};

// Photo Display Component
const PhotoDisplay: React.FC<PhotoDisplayProps> = ({
    src,
    alt,
    className = '',
    size = 'md'
}) => {
    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-20 h-20',
        lg: 'w-32 h-32'
    };

    // Handle cases where src is null or undefined
    if (!src) {
        return (
            <div className={`photo-display-container relative ${sizeClasses[size]} ${className} rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center`}>
                <span className="text-gray-400 text-xs text-center">No Photo</span>
            </div>
        );
    }

    // Simple approach - just show the image directly
    return (
        <div
            className={`photo-display-container relative ${sizeClasses[size]} ${className} group rounded-full border-2 border-white shadow-md transition-all duration-300`}
        >
            <Image
                src={src}
                alt={alt}
                width={80}
                height={80}
                loading="lazy"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                    // If image fails to load, show placeholder
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                        let placeholder = parent.querySelector('.image-placeholder') as HTMLElement;
                        if (!placeholder) {
                            placeholder = document.createElement('div') as HTMLElement;
                            placeholder.className = 'image-placeholder w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs';
                            placeholder.innerHTML = 'No Img';
                            parent.appendChild(placeholder);
                        }
                        placeholder.style.display = 'flex';
                    }
                }}
            />
        </div>
    );
};

export default function AttendancePortal() {
    const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
    const [fetchedAttendance, setFetchedAttendance] = useState<AttendanceRecord[]>([]);
    const [loadingFetchedAttendance, setLoadingFetchedAttendance] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [approvedLeavesCount, setApprovedLeavesCount] = useState<number>(0);
    const [selectedDateRecord, setSelectedDateRecord] = useState<AttendanceRecord | null>(null);
    const [isClient, setIsClient] = useState(false);
    // Modal state for photo viewing
    const [modalOpen, setModalOpen] = useState(false);
    const [modalPhotoSrc, setModalPhotoSrc] = useState('');
    const [modalPhotoAlt, setModalPhotoAlt] = useState('');
    // Tooltip state for calendar hover
    const [hoveredRecord, setHoveredRecord] = useState<AttendanceRecord | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
    // Month summary and pie chart hover
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    // Absences state
    const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
    const [, setLoadingAbsences] = useState(false);
    const [raiseReason, setRaiseReason] = useState("");
    const [raiseSubmitting, setRaiseSubmitting] = useState(false);
    const [raiseMessage, setRaiseMessage] = useState<string | null>(null);
    // Track submitted requests: { "email|date": { reason, status, timestamp } }
    const [submittedRequests, setSubmittedRequests] = useState<Record<string, { reason: string; status: string; timestamp: number }>>({});

    // Profile data state (moved to top level)
    const [profileData, setProfileData] = useState<ProfileData | null>(null);

    // Shift and OT data state
    const [shifts, setShifts] = useState<ShiftRecord[]>([]);
    const [otRecords, setOtRecords] = useState<OTRecord[]>([]);
    const [breaks, setBreaks] = useState<BreakRecord[]>([]);

    // Normalize leave dates (supports single date or start/end range fields)
    const getLeaveDates = (l: Leave): string[] => {
        const dates: string[] = [];
        const single = l.date;
        const start = l.start_date || l.from_date;
        const end = l.end_date || l.to_date;

        if (single) {
            dates.push(formatDateForComparison(single));
            return dates;
        }
        if (start) {
            const startD = new Date(start);
            const endD = end ? new Date(end) : new Date(startD);
            // iterate inclusive
            for (let d = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate()); d <= new Date(endD.getFullYear(), endD.getMonth(), endD.getDate()); d.setDate(d.getDate() + 1)) {
                dates.push(formatDateForComparison(new Date(d)));
            }
        }
        return dates;
    };

    useEffect(() => {
        const userEmail = localStorage.getItem("user_email");
        if (userEmail && !profileData) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(userEmail)}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => setProfileData(data))
                .catch(() => { });
        }
    }, [profileData]);

    // Handle photo modal events
    useEffect(() => {
        const attendancePortal = document.getElementById('attendance-portal');
        if (!attendancePortal) return;

        const handleOpenPhotoModal = (event: Event) => {
            const customEvent = event as CustomEvent;
            setModalPhotoSrc(customEvent.detail.src);
            setModalPhotoAlt(customEvent.detail.alt);
            setModalOpen(true);
        };

        attendancePortal.addEventListener('openPhotoModal', handleOpenPhotoModal);

        return () => {
            attendancePortal.removeEventListener('openPhotoModal', handleOpenPhotoModal);
        };
    }, []);

    useEffect(() => {
        setIsClient(true);
        const storedEmail = localStorage.getItem("user_email") || localStorage.getItem("loggedInUser");
        if (storedEmail) setLoggedInEmail(storedEmail);

        // Load submitted requests from localStorage
        const stored = localStorage.getItem("attendance_requests");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSubmittedRequests(parsed);
            } catch (e) {
                console.error("Failed to parse stored requests:", e);
            }
        }
    }, []);

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoadingFetchedAttendance(true);
            setFetchError(null);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_attendance/`);
                if (!res.ok) throw new Error(`Error fetching attendance: ${res.statusText}`);
                const data: { attendance: APIResponseRecord[] } = await res.json();

                // Helper to ensure absolute URLs
                const getAbsoluteImageUrl = (url: string | null | undefined): string | null => {
                    if (!url || url === "-" || url === "null" || url === "None") return null;
                    
                    // If it's already an absolute URL, return as is
                    if (url.startsWith("http") || url.startsWith("data:")) return url;
                    
                    // Handle relative URLs that might be missing the leading slash
                    let cleanUrl = url.trim();
                    if (!cleanUrl.startsWith('/')) {
                        cleanUrl = '/' + cleanUrl;
                    }
                    
                    // Construct full URL
                    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
                    return `${baseUrl}${cleanUrl}`;
                };

                // Calculate hoursWorked for present records
                const transformed: AttendanceRecord[] = (data.attendance || []).map((rec, idx) => {
                    let hoursWorked: string | null = "-";
                    if (
                        rec.check_in &&
                        rec.check_in !== "-" &&
                        rec.check_in !== "null" &&
                        rec.check_out &&
                        rec.check_out !== "-" &&
                        rec.check_out !== "null"
                    ) {
                        // Calculate hours worked
                        const checkInDate = new Date(`${rec.date}T${rec.check_in}`);
                        const checkOutDate = new Date(`${rec.date}T${rec.check_out}`);
                        let diffMs = checkOutDate.getTime() - checkInDate.getTime();
                        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
                        let totalMinutes = Math.floor(diffMs / 60000);
                        const leftoverMs = diffMs % 60000;
                        if (leftoverMs >= 30000) totalMinutes += 1;
                        const hoursPart = Math.floor(totalMinutes / 60);
                        const minutesPart = totalMinutes % 60;
                        hoursWorked = `${hoursPart}h ${minutesPart}m`;
                    }
                    return {
                        id: idx.toString(),
                        date: rec.date,
                        status: rec.status || "-",
                        checkIn: rec.check_in || "-",
                        checkOut: rec.check_out || "-",
                        checkInPhoto: getAbsoluteImageUrl(rec.check_in_photo),
                        checkOutPhoto: getAbsoluteImageUrl(rec.check_out_photo),
                        hoursWorked,
                        email: rec.email,
                    };
                });

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

    const handleRaiseAttendance = async (forDate: string) => {
        const email = (loggedInEmail || profileData?.email || localStorage.getItem("user_email") || "").trim();
        if (!email || !forDate || !raiseReason.trim()) return;

        const requestKey = `${email}|${forDate}`;

        // Check if already submitted
        if (submittedRequests[requestKey]) {
            setRaiseMessage("You have already submitted a request for this date.");
            return;
        }

        try {
            setRaiseSubmitting(true);
            setRaiseMessage(null);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/raise_attendance/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, date: forDate, reason: raiseReason.trim() })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to submit request");
            }
            const data = await res.json();
            const status = data.status || "Pending";

            // Save to state and localStorage
            const newRequest = { reason: raiseReason.trim(), status, timestamp: Date.now() };
            const updated = { ...submittedRequests, [requestKey]: newRequest };
            setSubmittedRequests(updated);
            localStorage.setItem("attendance_requests", JSON.stringify(updated));

            setRaiseMessage(`Request sent to your manager. Status: ${status}`);
            setRaiseReason("");
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed";
            setRaiseMessage(msg);
        } finally {
            setRaiseSubmitting(false);
        }
    };

    useEffect(() => {
        const fetchAbsences = async () => {
            if (!loggedInEmail) return;
            setLoadingAbsences(true);
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/get_absent/${encodeURIComponent(loggedInEmail)}/`
                );
                if (!res.ok) throw new Error("Failed to fetch absences");
                const data: AbsenceRecord[] = await res.json();
                setAbsences(data || []);

                // Merge absences into attendance
                setFetchedAttendance(prev => {
                    const normalizedEmail = loggedInEmail.trim().toLowerCase();
                    const merged = [...prev];

                    data.forEach((absence, idx) => {
                        const existsIndex = merged.findIndex(
                            rec =>
                                rec.date === absence.date &&
                                rec.email?.trim().toLowerCase() === normalizedEmail
                        );
                        const absenceRecord: AttendanceRecord = {
                            id: `absence-${idx}`,
                            date: absence.date,
                            status: "Absent",
                            checkIn: "-",
                            checkOut: "-",
                            hoursWorked: "-",
                            email: absence.email,
                            fullname: absence.fullname,
                            department: absence.department,
                        };

                        if (existsIndex === -1) {
                            merged.push(absenceRecord);
                        } else {
                            // override only if existing is empty or null
                            const existing = merged[existsIndex];
                            if (!existing.checkIn || existing.checkIn === "-" || existing.checkIn === "null") {
                                merged[existsIndex] = absenceRecord;
                            }
                        }
                    });

                    // Sort by date descending
                    return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                });
            } catch (err) {
                console.error("Error fetching absences:", err);
            } finally {
                setLoadingAbsences(false);
            }
        };

        fetchAbsences();
    }, [loggedInEmail]);

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

    // Fetch absences for the logged-in user
    useEffect(() => {
        const fetchAbsences = async () => {
            if (!loggedInEmail) return;

            setLoadingAbsences(true);
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/get_absent/${encodeURIComponent(loggedInEmail)}/`
                );
                if (!res.ok) throw new Error("Failed to fetch absences");
                const data: AbsenceRecord[] = await res.json();
                setAbsences(data || []);

                // Transform absences into attendance records
                const absenceRecords: AttendanceRecord[] = (data || []).map((absence, idx) => ({
                    id: `absence-${idx}`,
                    date: absence.date,
                    status: "Absent",
                    checkIn: "-",
                    checkOut: "-",
                    hoursWorked: "-",
                    email: absence.email,
                    fullname: absence.fullname,
                    department: absence.department,
                }));

                // Merge with existing attendance records
                setFetchedAttendance(prev => {
                    const merged = [...prev];

                    absenceRecords.forEach(absenceRec => {
                        const existingIndex = merged.findIndex(rec =>
                            rec.date === absenceRec.date &&
                            rec.email.toLowerCase() === absenceRec.email.toLowerCase()
                        );

                        if (existingIndex === -1) {
                            // Add absence record if no record exists for that date
                            merged.push(absenceRec);
                        } else {
                            // Update existing record if it's marked as absent
                            const existing = merged[existingIndex];
                            if ((!existing.checkIn || existing.checkIn === "-" || existing.checkIn === "null") &&
                                (!existing.status || existing.status === "Absent")) {
                                merged[existingIndex] = {
                                    ...existing,
                                    status: "Absent",
                                    fullname: absenceRec.fullname,
                                    department: absenceRec.department,
                                };
                            }
                        }
                    });

                    return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                });
            } catch (err) {
                console.error("Error fetching absences:", err);
            } finally {
                setLoadingAbsences(false);
            }
        };

        fetchAbsences();
    }, [loggedInEmail]);

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

    // Fetch shifts, OT, and breaks data
    useEffect(() => {
        const fetchShiftsAndOT = async () => {
            if (!loggedInEmail) return;

            try {
                // Fetch shifts
                const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_shifts/`);
                if (shiftRes.ok) {
                    const shiftData = await shiftRes.json();
                    const userShifts = (shiftData.shifts || [])
                        .filter((shift: ShiftRecord) =>
                            shift.emp_email === loggedInEmail || shift.employee_email === loggedInEmail
                        )
                        .map((shift: ShiftRecord) => ({
                            id: shift.shift_id || shift.id,
                            emp_email: shift.emp_email || shift.employee_email,
                            shift: shift.shift || shift.shift_type || 'Morning',
                            shift_type: shift.shift || shift.shift_type || 'Morning',
                            start_time: shift.start_time,
                            end_time: shift.end_time,
                            date: shift.date,
                            status: shift.status || 'active',
                            ot_hours: shift.ot_hours
                        }));
                    setShifts(userShifts);
                } else {
                    console.error('Failed to fetch shifts:', shiftRes.status, shiftRes.statusText);
                }

                // Fetch OT records
                const otRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_ot/`);
                if (otRes.ok) {
                    const otData = await otRes.json();
                    const userOT = (otData.ot_records || otData || [])
                        .filter((ot: OTRecord) => ot.email === loggedInEmail)
                        .map((ot: OTRecord) => ({
                            id: ot.id,
                            email: ot.email,
                            manager_email: ot.manager_email,
                            ot_start: ot.ot_start,
                            ot_end: ot.ot_end,
                            date: ot.date,
                            status: ot.status,
                            hours: ot.hours
                        }));
                    setOtRecords(userOT);
                }

                // Fetch breaks
                const breakRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_breaks/`);
                if (breakRes.ok) {
                    const breakData = await breakRes.json();
                    // Handle different response formats
                    let breaksArray = [];
                    if (Array.isArray(breakData)) {
                        breaksArray = breakData;
                    } else if (breakData.break_records && Array.isArray(breakData.break_records)) {
                        breaksArray = breakData.break_records;
                    } else if (breakData.breaks && Array.isArray(breakData.breaks)) {
                        breaksArray = breakData.breaks;
                    } else if (breakData.data && Array.isArray(breakData.data)) {
                        breaksArray = breakData.data;
                    } else {
                        breaksArray = [];
                    }

                    const userBreaks = breaksArray
                        .filter((br: BreakRecord) => br.email === loggedInEmail)
                        .map((br: BreakRecord) => ({
                            id: br.id,
                            email: br.email,
                            manager_email: br.manager_email,
                            break_start: br.break_start,
                            break_end: br.break_end,
                            date: br.date,
                            status: br.status,
                            duration: br.duration
                        }));
                    setBreaks(userBreaks);
                }
            } catch (error) {
                console.error('Error fetching shifts, OT, and breaks:', error);
            }
        };

        fetchShiftsAndOT();
    }, [loggedInEmail]);

    // Merge shifts, OT, and break data into attendance records
    const mergedAttendance = useMemo(() => {
        if (fetchedAttendance.length === 0) return fetchedAttendance;

        return fetchedAttendance.map(record => {                // Find shift for this date
            const shiftForDate = shifts.find(shift => shift.date === record.date);
            const shiftInfo = shiftForDate ? {
                shift: shiftForDate.shift,
                shiftTime: `${shiftForDate.start_time} - ${shiftForDate.end_time}`
            } : null;

            // Calculate OT hours and collect OT periods for this date
            const otForDate = otRecords.filter(ot => {
                const otDate = ot.date || new Date(ot.ot_start).toISOString().split('T')[0];
                return otDate === record.date;
            });

            const totalOtHours = otForDate.reduce((total, ot) => {
                if (ot.hours) return total + ot.hours;

                // Calculate hours from ot_start and ot_end if hours not provided
                if (ot.ot_start && ot.ot_end) {
                    const start = new Date(ot.ot_start);
                    const end = new Date(ot.ot_end);
                    const diffMs = end.getTime() - start.getTime();
                    const hours = diffMs / (1000 * 60 * 60);
                    return total + Math.max(0, hours);
                }

                return total;
            }, 0);

            // Collect OT periods
            const otPeriods = otForDate.map(ot => ({
                start: ot.ot_start,
                end: ot.ot_end,
                hours: ot.hours || (ot.ot_start && ot.ot_end ? (new Date(ot.ot_end).getTime() - new Date(ot.ot_start).getTime()) / (1000 * 60 * 60) : 0)
            }));

            // Calculate total break hours and collect break periods for this date
            const breaksForDate = breaks.filter(br => {
                const breakDate = br.date || new Date(br.break_start).toISOString().split('T')[0];
                return breakDate === record.date;
            });

            const totalBreakHours = breaksForDate.reduce((total, br) => {
                if (br.duration) return total + br.duration;

                // Calculate duration from break_start and break_end if duration not provided
                if (br.break_start && br.break_end) {
                    const start = new Date(br.break_start);
                    const end = new Date(br.break_end);
                    const diffMs = end.getTime() - start.getTime();
                    const hours = diffMs / (1000 * 60 * 60);
                    return total + Math.max(0, hours);
                }

                return total;
            }, 0);

            // Collect break periods
            const breakPeriods = breaksForDate.map(br => ({
                start: br.break_start,
                end: br.break_end,
                duration: br.duration || (br.break_start && br.break_end ? (new Date(br.break_end).getTime() - new Date(br.break_start).getTime()) / (1000 * 60 * 60) : 0)
            }));

            return {
                ...record,
                shift: shiftInfo?.shift || undefined,
                shiftTime: shiftInfo?.shiftTime || undefined,
                otHours: totalOtHours > 0 ? totalOtHours : undefined,
                otPeriods: otPeriods.length > 0 ? otPeriods : undefined,
                breakHours: totalBreakHours > 0 ? totalBreakHours : undefined,
                breakPeriods: breakPeriods.length > 0 ? breakPeriods : undefined
            };
        });
    }, [fetchedAttendance, shifts, otRecords, breaks]);

    // Update selected date record when selectedDate changes
    useEffect(() => {
        if (selectedDate) {
            const record = mergedAttendance.find(rec => {
                const recordEmail = (rec.email || "").trim().toLowerCase();
                const currentEmail = (loggedInEmail || "").trim().toLowerCase();
                const recordDate = formatDateForComparison(rec.date);
                return recordDate === selectedDate && recordEmail === currentEmail;
            });
            setSelectedDateRecord(record || null);
        } else {
            setSelectedDateRecord(null);
        }
    }, [selectedDate, mergedAttendance, loggedInEmail]);

    // Helper function to format dates consistently for comparison
    const formatDateForComparison = (date: Date | string): string => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // ✅ Define handleMarkAttendance for check-in / check-out
    const handleMarkAttendance = async () => {
        try {
            const userEmail = localStorage.getItem("user_email");
            if (!userEmail) {
                alert("⚠️ No user email found. Please log in again.");
                return;
            }

            // Fetch employee info
            const empRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(userEmail)}/`
            );

            if (!empRes.ok) {
                alert("❌ Could not fetch employee info.");
                return;
            }

            const empData = await empRes.json();

            // Get GPS coordinates
            if (!navigator.geolocation) {
                alert("❌ GPS not supported in this browser.");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;

                    const formData = new FormData();
                    formData.append("email", userEmail);
                    formData.append("latitude", latitude.toString());
                    formData.append("longitude", longitude.toString());

                    // Attach profile image if available
                    if (empData?.profile_picture) {
                        const imgResponse = await fetch(empData.profile_picture);
                        const imgBlob = await imgResponse.blob();
                        formData.append("image", imgBlob, "mani2.jpeg");
                    }

                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/office_attendance/`,
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                    if (response.ok) {
                        alert("✅ Attendance marked successfully!");
                    } else {
                        const error = await response.text();
                        alert("❌ Failed to mark attendance: " + error);
                    }
                },
                (err) => {
                    console.error("GPS Error:", err);
                    alert("⚠️ Please enable GPS and allow location access in your browser settings!");
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } catch (error) {
            console.error("Error marking attendance:", error);
            alert("❌ Something went wrong. Try again.");
        }
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
        if (record.status === "Absent") return "-";
        if (!record.checkIn || record.checkIn === "-" || record.checkIn === "null" ||
            !record.checkOut || record.checkOut === "-" || record.checkOut === "null") {
            return "-";
        }
        // If already calculated, return it
        if (record.hoursWorked && record.hoursWorked !== "-") return record.hoursWorked;
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

    const deriveStatus = (record: AttendanceRecord): string => {
        if (!record) return "-";
        if (record.status === "Sunday") return "Sunday";
        if (record.status === "Absent") return "Absent";
        const hasIn = !!(record.checkIn && record.checkIn !== "-" && record.checkIn !== "null");
        const hasOut = !!(record.checkOut && record.checkOut !== "-" && record.checkOut !== "null");
        if (hasIn && hasOut) return "Present";
        if (hasIn && !hasOut) return "Working In";
        return record.status && record.status !== "-" ? record.status : "-";
    };

    // Month summary for the pie chart
    const handleActiveStartDateChange = (
        { activeStartDate }: { activeStartDate: Date | null }
    ) => {
        if (activeStartDate) setCurrentMonth(activeStartDate);
    };

    const monthSummary = (() => {
        if (!isClient || !loggedInEmail) return { present: 0, absent: 0, workingIn: 0, late: 0, halfDay: 0, sunday: 0, leave: 0 };

        const normalizedEmail = (loggedInEmail || "").trim().toLowerCase();
        const filtered = mergedAttendance.filter(rec => {
            const recordEmail = (rec.email || "").trim().toLowerCase();
            const d = new Date(rec.date);
            return (
                recordEmail === normalizedEmail &&
                d.getMonth() === currentMonth.getMonth() &&
                d.getFullYear() === currentMonth.getFullYear()
            );
        });

        let present = 0, absent = 0, workingIn = 0, late = 0, halfDay = 0, sunday = 0, leave = 0;

        // Count Sundays in the current month
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (date.getDay() === 0) {
                sunday++;
            }
        }

        filtered.forEach(rec => {
            const recordDate = new Date(rec.date);
            if (recordDate.getDay() === 0) {
                // Sunday records are handled separately
                return;
            }

            if (rec.status === "Absent") {
                absent++;
            } else if (rec.status === "Late") {
                late++;
            } else if (rec.status === "Half Day") {
                halfDay++;
            } else if (rec.checkIn && rec.checkIn !== "-" && rec.checkIn !== "null") {
                if (rec.checkOut && rec.checkOut !== "-" && rec.checkOut !== "null") {
                    present++;
                } else {
                    workingIn++;
                }
            } else {
                absent++;
            }
        });

        // Count approved leaves for current user in this month (support single day and ranges)
        const normalizedEmailLeaves = (loggedInEmail || "").trim().toLowerCase();
        leave = 0;
        (leaves || []).forEach(l => {
            const email = (l.employee_email || l.email || "").trim().toLowerCase();
            const status = (l.status || "").trim().toLowerCase();
            if (email !== normalizedEmailLeaves || status !== "approved") return;
            const dates = getLeaveDates(l);
            dates.forEach(ds => {
                const d = new Date(ds);
                if (d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()) {
                    leave += 1;
                }
            });
        });

        // Include recorded absences for the month that don't already appear in attendance records
        const attendanceDatesSet = new Set(
            filtered.map(r => formatDateForComparison(r.date))
        );
        (absences || [])
            .filter(abs => (abs.email || "").trim().toLowerCase() === normalizedEmailLeaves)
            .forEach(abs => {
                const d = new Date(abs.date);
                if (d.getMonth() !== currentMonth.getMonth() || d.getFullYear() !== currentMonth.getFullYear()) return;
                if (d.getDay() === 0) return; // exclude Sundays
                const key = formatDateForComparison(abs.date);
                if (!attendanceDatesSet.has(key)) {
                    absent++;
                    attendanceDatesSet.add(key);
                }
            });

        return { present, absent, workingIn, late, halfDay, sunday, leave };
    })();

    const chartData = [
        { title: "Present", value: monthSummary.present, color: "#10b981" },
        { title: "Absent", value: monthSummary.absent, color: "#f97316" },
        { title: "Working In", value: monthSummary.workingIn, color: "#eab308" },
        { title: "Late", value: monthSummary.late, color: "#8b5cf6" },
        { title: "Half Day", value: monthSummary.halfDay, color: "#06b6d4" },
        { title: "Sunday", value: monthSummary.sunday, color: "#ef4444" },
        { title: "Leave", value: monthSummary.leave, color: "#0ea5e9" },
    ];

    // Enhanced stats calculation
    const totalPresentDays = mergedAttendance.filter(record => {
        const recordEmail = (record.email || "").trim().toLowerCase();
        const currentEmail = (loggedInEmail || "").trim().toLowerCase();
        return recordEmail === currentEmail &&
            record.checkIn &&
            record.checkIn !== "-" &&
            record.checkIn !== "null" &&
            record.checkOut &&
            record.checkOut !== "-" &&
            record.checkOut !== "null";
    }).length;

    const thisMonthPresent = mergedAttendance.filter(record => {
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
    }).length;

    const totalAbsences = absences.filter(absence =>
        absence.email.toLowerCase() === (loggedInEmail || "").toLowerCase()
    ).length;

    // Helper function for status colors
    const getStatusColor = (status: string): string => {
        switch (status) {
            case "Present":
                return "bg-green-100 text-green-800";
            case "Absent":
                return "bg-orange-100 text-orange-800";
            case "Working In":
                return "bg-yellow-100 text-yellow-800";
            case "Late":
                return "bg-purple-100 text-purple-800";
            case "Half Day":
                return "bg-cyan-100 text-cyan-800";
            case "Sunday":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };


    const getTileClassName = (date: Date): string => {
        if (!loggedInEmail) return "";

        const dateStr = formatDateForComparison(date);
        const normalizedEmail = loggedInEmail.trim().toLowerCase();

        // Check if it's Sunday
        if (date.getDay() === 0) return "calendar-sunday";

        // Check approved leave (supports single date or range)
        const isLeave = (leaves || []).some(l => {
            const email = (l.employee_email || l.email || "").trim().toLowerCase();
            const status = (l.status || "").trim().toLowerCase();
            if (status !== "approved" || email !== normalizedEmail) return false;
            const dates = getLeaveDates(l);
            return dates.includes(dateStr);
        });
        if (isLeave) return "calendar-leave";

        // Check absences first
        const absenceMatch = absences.find(
            abs => abs.date === dateStr && abs.email?.trim().toLowerCase() === normalizedEmail
        );
        if (absenceMatch) return "calendar-absent";

        // Then check attendance
        const record = mergedAttendance.find(
            rec => formatDateForComparison(rec.date) === dateStr &&
                rec.email?.trim().toLowerCase() === normalizedEmail
        );

        if (record) {
            switch (record.status) {
                case "Present": return "calendar-present";
                case "Working In": return "calendar-workingin";
                case "Late": return "calendar-late";
                case "Half Day": return "calendar-halfday";
                case "Absent": return "calendar-absent";
                default:
                    // Fallback based on check-in/out
                    if (record.checkIn && record.checkIn !== "-" && record.checkIn !== "null") {
                        if (record.checkOut && record.checkOut !== "-" && record.checkOut !== "null")
                            return "calendar-present";
                        return "calendar-workingin";
                    }
                    return "calendar-absent";
            }
        }

        // Default for other days
        return "";
    };

    // Create Sunday record for display
    const createSundayRecord = (date: Date): AttendanceRecord => {
        return {
            id: `sunday-${date.toISOString()}`,
            date: date.toISOString().split('T')[0],
            status: "Sunday",
            checkIn: "-",
            checkOut: "-",
            hoursWorked: "-",
            email: loggedInEmail || "",
            fullname: "Sunday",
            department: "Weekend"
        };
    };

    return (
        <DashboardLayout role="employee">
            <div id="attendance-portal" className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
                {/* Header Section */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                        Employee Attendance Portal
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                        Track and manage your attendance records and absences
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs sm:text-sm text-gray-500 font-medium">Total Present</div>
                                <div className="text-xl sm:text-2xl font-bold text-gray-800">
                                    {totalPresentDays}
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 text-lg">✓</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs sm:text-sm text-gray-500 font-medium">This Month</div>
                                <div className="text-xl sm:text-2xl font-bold text-gray-800">
                                    {thisMonthPresent}
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-lg">📅</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs sm:text-sm text-gray-500 font-medium">Approved Leaves</div>
                                <div className="text-xl sm:text-2xl font-bold text-gray-800">
                                    {approvedLeavesCount}
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 text-lg">🌴</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs sm:text-sm text-gray-500 font-medium">Recorded Absences</div>
                                <div className="text-xl sm:text-2xl font-bold text-gray-800">
                                    {totalAbsences}
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 text-lg">⚠️</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today's Schedule Widget */}
                <div className="mb-8 sm:mb-10">
                    <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-700">Today&apos;s Schedule</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Schedule for Today</h3>
                            <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{(() => {
                                const today = new Date().toISOString().split('T')[0];
                                const todayShifts = shifts.filter(shift => shift.date === today);
                                const todayOT = otRecords.filter(ot => ot.ot_start?.startsWith(today));
                                return todayShifts.length + todayOT.length;
                            })()}</span>
                        </div>
                        <div className="p-4 space-y-3">
                            {/* Today's Shifts */}
                            {(() => {
                                const today = new Date().toISOString().split('T')[0];
                                const todayShifts = shifts.filter(shift => shift.date === today);
                                const todayOT = otRecords.filter(ot => ot.ot_start?.startsWith(today));

                                return (
                                    <>
                                        {todayShifts.map((shift) => (
                                            <div key={`shift-${shift.id}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-semibold text-gray-800">{shift.shift} Shift</h4>
                                                    <p className="text-xs text-gray-600">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</p>
                                                </div>
                                                <span className="text-xs font-bold bg-blue-200 text-blue-700 px-2 py-1 rounded-full">Shift</span>
                                            </div>
                                        ))}

                                        {/* Today's OT */}
                                        {todayOT.map((ot) => {
                                            const startTime = new Date(ot.ot_start);
                                            const endTime = new Date(ot.ot_end);
                                            const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

                                            return (
                                                <div key={`ot-${ot.id}`} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-semibold text-gray-800">Overtime</h4>
                                                        <p className="text-xs text-gray-600">{startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} - {endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                                                    </div>
                                                    <span className="text-xs font-bold bg-orange-200 text-orange-700 px-2 py-1 rounded-full">{Math.abs(hours).toFixed(1)}h</span>
                                                </div>
                                            );
                                        })}

                                        {todayShifts.length === 0 && todayOT.length === 0 && (
                                            <div className="text-center py-4 text-gray-400 text-xs">No schedule for today</div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Calendar Section */}
                <div className="mb-8 sm:mb-10">
                    <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-700">Attendance Calendar</h2>
                    <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8 items-stretch">
                        {/* Calendar Card */}
                        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
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
                                        tileContent={({ date, view }) => {
                                            if (view !== "month") return null;
                                            const dateStr = formatDateForComparison(date);
                                            const normalizedEmail = (loggedInEmail || "").trim().toLowerCase();

                                            // Check if it's Sunday
                                            if (date.getDay() === 0) {
                                                const sundayRecord = createSundayRecord(date);
                                                return (
                                                    <div
                                                        onMouseOver={e => {
                                                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                                                            setHoveredRecord(sundayRecord);
                                                            setHoveredPosition({
                                                                x: rect.left + rect.width / 2,
                                                                y: rect.top + rect.height,
                                                            });
                                                        }}
                                                        onMouseMove={e => {
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
                                            }

                                            // Check for attendance record
                                            const record = mergedAttendance.find(rec => {
                                                const recordDate = formatDateForComparison(new Date(rec.date));
                                                const recordEmail = (rec.email || "").trim().toLowerCase();
                                                return recordDate === dateStr && recordEmail === normalizedEmail;
                                            });

                                            // Check for absence
                                            const absence = absences.find(abs =>
                                                abs.date === dateStr &&
                                                abs.email?.trim().toLowerCase() === normalizedEmail
                                            );

                                            const displayRecord = record || (absence ? {
                                                id: `absence-${dateStr}`,
                                                date: dateStr,
                                                status: "Absent",
                                                checkIn: "-",
                                                checkOut: "-",
                                                hoursWorked: "-",
                                                email: normalizedEmail,
                                                fullname: absence?.fullname,
                                                department: absence?.department,
                                            } as AttendanceRecord : null);

                                            if (!displayRecord) return null;

                                            return (
                                                <div
                                                    onMouseOver={e => {
                                                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                                                        setHoveredRecord(displayRecord);
                                                        setHoveredPosition({
                                                            x: rect.left + rect.width / 2,
                                                            y: rect.top + rect.height,
                                                        });
                                                    }}
                                                    onMouseMove={e => {
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
                                {/* Enhanced Tooltip */}
                                {hoveredRecord && hoveredPosition && (
                                    <div
                                        className="fixed bg-white/95 border shadow-lg rounded-lg p-3 text-xs z-[9999] pointer-events-none transition-opacity duration-200 opacity-100"
                                        style={{
                                            left: Math.max(8, Math.min(window.innerWidth - 280, hoveredPosition.x - 120)),
                                            top: hoveredPosition.y + 4,
                                            minWidth: 200,
                                            maxWidth: 260,
                                            boxShadow: "0 6px 24px 0 rgba(0,0,0,0.15)"
                                        }}
                                    >
                                        <div className="font-semibold mb-2 text-gray-800 border-b pb-1">
                                            {formatDateForDisplay(hoveredRecord.date)}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Status:</span>
                                                <span
                                                    className={`font-medium px-2 py-0.5 rounded text-xs ${getStatusColor(deriveStatus(hoveredRecord))}`}
                                                >
                                                    {deriveStatus(hoveredRecord)}
                                                </span>
                                            </div>
                                            {hoveredRecord.fullname && hoveredRecord.fullname !== "Sunday" && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Employee:</span>
                                                    <span className="font-medium">{hoveredRecord.fullname}</span>
                                                </div>
                                            )}
                                            {hoveredRecord.department && hoveredRecord.department !== "Weekend" && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Department:</span>
                                                    <span className="font-medium">{hoveredRecord.department}</span>
                                                </div>
                                            )}
                                            {/* Shift Information */}
                                            {hoveredRecord.shift && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Shift:</span>
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="font-medium text-blue-700">{hoveredRecord.shift}</span>
                                                        {hoveredRecord.shiftTime && (
                                                            <span className="text-xs text-blue-600">({hoveredRecord.shiftTime})</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {/* OT Information */}
                                            {hoveredRecord.otHours && hoveredRecord.otHours > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Overtime:</span>
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                        <span className="font-medium text-purple-700">{hoveredRecord.otHours.toFixed(1)}h</span>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Break Information */}
                                            {hoveredRecord.breakHours && hoveredRecord.breakHours > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Break:</span>
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z M9 3v1m6-1v1m-7 5h8m-4 4v.01" />
                                                        </svg>
                                                        <span className="font-medium text-green-700">{hoveredRecord.breakHours.toFixed(1)}h</span>
                                                    </div>
                                                </div>
                                            )}
                                            {hoveredRecord.status !== "Sunday" && (
                                                <div className="pt-1">
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <div className="flex-1">
                                                            <div className="text-xs text-gray-600 mb-1">Check-in</div>
                                                            <div className="font-medium text-green-700">{formatTime(hoveredRecord.checkIn)}</div>
                                                        </div>

                                                        {hoveredRecord.checkInPhoto && (
                                                            <div className="flex flex-col items-center">
                                                                <PhotoDisplay
                                                                    src={hoveredRecord.checkInPhoto}
                                                                    alt="Check-in"
                                                                    size="sm"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="flex-1 text-center">
                                                            <div className="text-xs text-gray-500 mb-1">→</div>
                                                            <div className="text-xs font-medium text-blue-600">{calculateHoursWorked(hoveredRecord)}</div>
                                                        </div>

                                                        {hoveredRecord.checkOutPhoto && (
                                                            <div className="flex flex-col items-center">
                                                                <PhotoDisplay
                                                                    src={hoveredRecord.checkOutPhoto}
                                                                    alt="Check-out"
                                                                    size="sm"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="flex-1">
                                                            <div className="text-xs text-gray-600 mb-1 text-right">Check-out</div>
                                                            <div className="font-medium text-red-700 text-right">{formatTime(hoveredRecord.checkOut)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Selected Date Card */}
                            {selectedDate && (
                                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
                                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                                        <h3 className="text-base sm:text-lg font-semibold text-blue-800">
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

                                    {selectedDateRecord ? (
                                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                            <div className="space-y-3">
                                                {selectedDateRecord.fullname && selectedDateRecord.fullname !== "Sunday" && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Employee:</span>
                                                        <span className="font-medium">{selectedDateRecord.fullname}</span>
                                                    </div>
                                                )}
                                                {selectedDateRecord.department && selectedDateRecord.department !== "Weekend" && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Department:</span>
                                                        <span className="font-medium">{selectedDateRecord.department}</span>
                                                    </div>
                                                )}
                                                {/* Shift Information */}
                                                {selectedDateRecord.shift && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600">Shift:</span>
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="font-medium text-blue-700">{selectedDateRecord.shift}</span>
                                                            {selectedDateRecord.shiftTime && (
                                                                <span className="text-sm text-blue-600">({selectedDateRecord.shiftTime})</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* OT Information */}
                                                {selectedDateRecord.otHours && selectedDateRecord.otHours > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600">Overtime:</span>
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                            </svg>
                                                            <span className="font-medium text-purple-700">{selectedDateRecord.otHours.toFixed(1)} hours</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Break Information */}
                                                {selectedDateRecord.breakHours && selectedDateRecord.breakHours > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600">Break:</span>
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z M9 3v1m6-1v1m-7 5h8m-4 4v.01" />
                                                            </svg>
                                                            <span className="font-medium text-green-700">{selectedDateRecord.breakHours.toFixed(1)} hours</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Time and Photo Section */}
                                                <div className="pt-2">
                                                    {(() => {
                                                        const displayStatus = deriveStatus(selectedDateRecord);
                                                        const isAbsent = displayStatus === "Absent";
                                                        const isSunday = displayStatus === "Sunday";

                                                        return (
                                                            <div className="relative border border-blue-100 bg-white/50 rounded-xl p-4 flex flex-col gap-3">
                                                                {!isAbsent && !isSunday && (
                                                                    <div className="flex items-center justify-between relative mt-2">
                                                                        {/* Connecting Line */}
                                                                        <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-gray-100 -z-10"></div>

                                                                        {/* Check In */}
                                                                        <div className="flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm p-2 rounded-lg z-0 min-w-[80px]">
                                                                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Check In</span>
                                                                            <div className="relative">
                                                                                {selectedDateRecord.checkInPhoto ? (
                                                                                    <PhotoDisplay
                                                                                        src={selectedDateRecord.checkInPhoto}
                                                                                        alt="In"
                                                                                        size="md"
                                                                                        className="border-2 border-green-100 shadow-sm"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 font-bold text-xs shadow-sm">
                                                                                        IN
                                                                                    </div>
                                                                                )}
                                                                                {/* <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div> */}
                                                                            </div>
                                                                            <span className="text-xs font-bold text-gray-800 mt-1">{formatTime(selectedDateRecord.checkIn)}</span>
                                                                        </div>

                                                                        {/* Hours Pill (Center) */}
                                                                        <div className="flex flex-col items-center z-10">
                                                                            <span className="text-[10px] text-gray-400 font-medium mb-1 bg-white px-1">Duration</span>
                                                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5">
                                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                                {calculateHoursWorked(selectedDateRecord)}
                                                                            </div>
                                                                        </div>

                                                                        {/* Check Out */}
                                                                        <div className="flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm p-2 rounded-lg z-0 min-w-[80px]">
                                                                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Check Out</span>
                                                                            <div className="relative">
                                                                                {selectedDateRecord.checkOutPhoto ? (
                                                                                    <PhotoDisplay
                                                                                        src={selectedDateRecord.checkOutPhoto}
                                                                                        alt="Out"
                                                                                        size="md"
                                                                                        className="border-2 border-red-100 shadow-sm"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold text-xs shadow-sm">
                                                                                        OUT
                                                                                    </div>
                                                                                )}
                                                                                {/* {selectedDateRecord.checkOut && selectedDateRecord.checkOut !== "-" ? (
                                                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                                                                                ) : (
                                                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-300 rounded-full border-2 border-white shadow-sm"></div>
                                                                                )} */}
                                                                            </div>
                                                                            <span className="text-xs font-bold text-gray-800 mt-1">{formatTime(selectedDateRecord.checkOut)}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between pt-2 border-t border-gray-100">
                                                                    <span className="text-gray-600 font-medium">Status:</span>
                                                                    <span className={`font-bold px-3 py-1 rounded-full text-xs shadow-sm ${getStatusColor(displayStatus)}`}>
                                                                        {displayStatus}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            {/* Mark Attendance Button or Request Manager logic */}
                                            {(() => {
                                                // --- Improved absence & button logic for today's date ---
                                                const today = new Date();
                                                const todayStr = formatDateForComparison(today);
                                                const todayISO = formatDateForComparison(new Date());
                                                // Determine user email robustly (loggedInEmail, profileData, or localStorage)
                                                const userEmailForCheck = (loggedInEmail || profileData?.email || localStorage.getItem("user_email") || "").trim().toLowerCase();
                                                const record = selectedDateRecord ?? ({} as AttendanceRecord);
                                                const buttonLabel =
                                                    !record.checkIn || record.checkIn === "-" || record.checkIn === "null"
                                                        ? "Mark Check-In"
                                                        : !record.checkOut || record.checkOut === "-" || record.checkOut === "null"
                                                            ? "Mark Check-Out"
                                                            : "";

                                                // Absence logic for today
                                                const normalizedUserEmail = (userEmailForCheck || "").trim().toLowerCase();
                                                const isAbsentToday = absences.some(abs => {
                                                    const absDate = formatDateForComparison(abs.date);
                                                    const absEmail = (abs.email || "").trim().toLowerCase();
                                                    return absDate === todayISO && absEmail === normalizedUserEmail;
                                                });

                                                // Wait for absences to be fetched before showing any button
                                                if (!absences || absences.length === 0) {
                                                    return (
                                                        <div className="mt-4 text-center text-gray-500">
                                                            Loading attendance data...
                                                        </div>
                                                    );
                                                }

                                                // Only show button logic for today
                                                const isToday = selectedDate === todayStr;
                                                if (isToday) {
                                                    // If today is absent, show "Request Manager"
                                                    if (isAbsentToday) {
                                                        // Check if request already submitted for this date
                                                        const requestKey = `${normalizedUserEmail}|${selectedDate}`;
                                                        const existingRequest = submittedRequests[requestKey];

                                                        if (existingRequest) {
                                                            // Show already submitted status
                                                            return (
                                                                <div className="mt-6 text-center">
                                                                    <div className="flex justify-center mb-3">
                                                                        <Image
                                                                            src={profileData?.profile_picture || "/default-avatar.png"}
                                                                            alt="Profile"
                                                                            width={64}
                                                                            height={64}
                                                                            className="rounded-full border-2 border-green-400 shadow-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-4">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <span className="text-green-600 text-xl">✓</span>
                                                                            <h3 className="font-semibold text-green-800">Request Already Submitted</h3>
                                                                        </div>
                                                                        <p className="text-sm text-gray-700 mb-2">
                                                                            <strong>Status:</strong> <span className="text-green-700">{existingRequest.status}</span>
                                                                        </p>
                                                                        <p className="text-sm text-gray-700 mb-2">
                                                                            <strong>Reason:</strong> {existingRequest.reason}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            Submitted: {new Date(existingRequest.timestamp).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        // Show request form
                                                        return (
                                                            <div className="mt-6 text-center">
                                                                <div className="flex justify-center mb-3">
                                                                    <Image
                                                                        src={profileData?.profile_picture || "/default-avatar.png"}
                                                                        alt="Profile"
                                                                        width={64}
                                                                        height={64}
                                                                        className="rounded-full border-2 border-orange-400 shadow-sm"
                                                                    />
                                                                </div>
                                                                <div className="max-w-md mx-auto text-left">
                                                                    <label className="block text-sm text-gray-700 mb-1">Describe the issue</label>
                                                                    <textarea
                                                                        className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                                        rows={3}
                                                                        placeholder="E.g., Network issue; could not check-in before 10:45."
                                                                        value={raiseReason}
                                                                        onChange={e => setRaiseReason(e.target.value)}
                                                                    />
                                                                    {raiseMessage && (
                                                                        <p className={`mt-2 text-sm ${raiseMessage.includes('Request sent') || raiseMessage.includes('Status:') ? 'text-green-600' : 'text-red-600'}`}>{raiseMessage}</p>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        className="mt-3 px-5 py-2 bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 transition-all duration-200 disabled:opacity-60"
                                                                        disabled={raiseSubmitting || !raiseReason.trim()}
                                                                        onClick={() => selectedDate && handleRaiseAttendance(selectedDate)}
                                                                    >
                                                                        {raiseSubmitting ? 'Sending...' : 'Request Manager'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    // Else show Mark Check-In or Check-Out
                                                    if (buttonLabel) {
                                                        return (
                                                            <div className="mt-6 text-center">
                                                                <div className="flex justify-center mb-3">
                                                                    <Image
                                                                        src={profileData?.profile_picture || "/default-avatar.png"}
                                                                        alt="Profile"
                                                                        width={64}
                                                                        height={64}
                                                                        className="rounded-full border-2 border-blue-400 shadow-sm"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200"
                                                                    onClick={handleMarkAttendance}
                                                                >
                                                                    {buttonLabel}
                                                                </button>
                                                            </div>
                                                        );
                                                    }
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    ) : new Date(selectedDate).getDay() === 0 ? (
                                        // Sunday card
                                        <div className="text-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Status:</span>
                                                <span className={`font-medium px-2 py-1 rounded text-xs sm:text-sm ${getStatusColor("Sunday")}`}>
                                                    Sunday
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm">Weekend - No work scheduled</p>
                                        </div>
                                    ) : (() => {
                                        // ✅ Local date comparison
                                        const today = new Date();
                                        const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                                        const isToday = selectedDate === localToday;
                                        if (isToday) {
                                            if (!absences || absences.length === 0) {
                                                return (
                                                    <div className="text-center">
                                                        <p className="text-gray-600 text-sm mb-3">Loading attendance data...</p>
                                                    </div>
                                                );
                                            }
                                            // Check if today is marked absent; if so, show Request Manager instead of Mark Check-In
                                            const todayISO = localToday; // already in YYYY-MM-DD
                                            const normalizedUserEmail = (loggedInEmail || profileData?.email || localStorage.getItem("user_email") || "").trim().toLowerCase();
                                            const isAbsentToday = absences.some(abs => {
                                                const absDate = formatDateForComparison(abs.date);
                                                const absEmail = (abs.email || "").trim().toLowerCase();
                                                return absDate === todayISO && absEmail === normalizedUserEmail;
                                            });

                                            if (isAbsentToday) {
                                                // Check if request already submitted for this date
                                                const requestKey = `${normalizedUserEmail}|${selectedDate}`;
                                                const existingRequest = submittedRequests[requestKey];

                                                if (existingRequest) {
                                                    // Show already submitted status
                                                    return (
                                                        <div className="text-center">
                                                            <p className="text-gray-600 text-sm mb-3">You have been marked absent for today.</p>
                                                            <div className="flex justify-center mb-3">
                                                                <Image
                                                                    src={profileData?.profile_picture || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI0MCIgcj0iMTIiIGZpbGw9IiM5OTkiLz48cGF0aCBkPSJNNDAgNjAgTDYwIDYwIEw2MCA5MCBMNDAgOTAgWiIgZmlsbD0iIzk5OSIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZGRkIi8+PC9zdmc+"}
                                                                    alt="Profile"
                                                                    width={64}
                                                                    height={64}
                                                                    className="rounded-full border-2 border-green-400 shadow-sm"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI0MCIgcj0iMTIiIGZpbGw9IiM5OTkiLz48cGF0aCBkPSJNNDAgNjAgTDYwIDYwIEw2MCA5MCBMNDAgOTAgWiIgZmlsbD0iIzk5OSIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZGRkIi8+PC9zdmc+';
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-4">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="text-green-600 text-xl">✓</span>
                                                                    <h3 className="font-semibold text-green-800">Request Already Submitted</h3>
                                                                </div>
                                                                <p className="text-sm text-gray-700 mb-2">
                                                                    <strong>Status:</strong> <span className="text-green-700">{existingRequest.status}</span>
                                                                </p>
                                                                <p className="text-sm text-gray-700 mb-2">
                                                                    <strong>Reason:</strong> {existingRequest.reason}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Submitted: {new Date(existingRequest.timestamp).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="text-center">
                                                        <p className="text-gray-600 text-sm mb-3">You have been marked absent for today.</p>
                                                        <div className="flex justify-center mb-3">
                                                            <Image
                                                                src={profileData?.profile_picture || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI0MCIgcj0iMTIiIGZpbGw9IiM5OTkiLz48cGF0aCBkPSJNNDAgNjAgTDYwIDYwIEw2MCA5MCBMNDAgOTAgWiIgZmlsbD0iIzk5OSIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZGRkIi8+PC9zdmc+"}
                                                                alt="Profile"
                                                                width={64}
                                                                height={64}
                                                                className="rounded-full border-2 border-orange-400 shadow-sm"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI0MCIgcj0iMTIiIGZpbGw9IiM5OTkiLz48cGF0aCBkPSJNNDAgNjAgTDYwIDYwIEw2MCA5MCBMNDAgOTAgWiIgZmlsbD0iIzk5OSIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZGRkIi8+PC9zdmc+';
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="max-w-md mx-auto text-left">
                                                            <label className="block text-sm text-gray-700 mb-1">Describe the issue</label>
                                                            <textarea
                                                                className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                                rows={3}
                                                                placeholder="E.g., Network issue; could not check-in before 10:45."
                                                                value={raiseReason}
                                                                onChange={e => setRaiseReason(e.target.value)}
                                                            />
                                                            {raiseMessage && (
                                                                <p className={`mt-2 text-sm ${raiseMessage.includes('Request sent') || raiseMessage.includes('Status:') ? 'text-green-600' : 'text-red-600'}`}>{raiseMessage}</p>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="mt-3 px-5 py-2 bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 transition-all duration-200 disabled:opacity-60"
                                                                disabled={raiseSubmitting || !raiseReason.trim()}
                                                                onClick={() => selectedDate && handleRaiseAttendance(selectedDate)}
                                                            >
                                                                {raiseSubmitting ? 'Sending...' : 'Request Manager'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="text-center">
                                                    <p className="text-gray-600 text-sm mb-3">No attendance record yet for today.</p>
                                                    <button
                                                        className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200"
                                                        onClick={handleMarkAttendance}
                                                    >
                                                        Mark Check-In
                                                    </button>
                                                </div>
                                            );
                                        }
                                        return <p className="text-gray-500 text-sm">No attendance record found for this date.</p>;
                                    })()}
                                </div>
                            )}

                            {/* Enhanced Legend */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6 w-full text-xs">
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
                                    <span className="inline-block w-3 h-3 rounded-sm bg-orange-100 border border-orange-400"></span>
                                    <span className="text-gray-600">Absent</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-sky-100 border border-sky-400"></span>
                                    <span className="text-gray-600">Leave</span>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Pie Chart Card */}
                        <div className="w-full lg:w-80 bg-white rounded-lg border border-gray-200 p-4 sm:p-6 relative shadow-sm">
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">
                                {new Date(currentMonth).toLocaleString("default", { month: "long", year: "numeric" })} Summary
                            </h3>

                            <div className="flex justify-center mb-4">
                                <PieChart
                                    data={chartData}
                                    animate
                                    onMouseOver={(e, index) => setHoveredIndex(index)}
                                    onMouseOut={() => setHoveredIndex(null)}
                                    label={({ dataEntry }) => (dataEntry.value > 0 ? `${dataEntry.value}` : "")}
                                    labelStyle={{ fontSize: "10px", fontFamily: "inherit", fill: "#374151" }}
                                    radius={42}
                                    labelPosition={75}
                                    style={{ height: 200 }}
                                />
                            </div>

                            {hoveredIndex !== null && (
                                <div className="absolute top-8 sm:top-10 left-1/2 transform -translate-x-1/2 bg-white border shadow-lg px-3 py-2 rounded-lg text-xs text-gray-700 animate-fade-in">
                                    <span className="font-semibold">{chartData[hoveredIndex].title}:</span> {chartData[hoveredIndex].value} days (
                                    {(
                                        (chartData[hoveredIndex].value /
                                            (chartData.reduce((sum, item) => sum + item.value, 0) || 1)) *
                                        100
                                    ).toFixed(1)}
                                    %)
                                </div>
                            )}

                            {/* Detailed Summary */}
                            <div className="space-y-2 text-xs">
                                {chartData.filter(item => item.value > 0).map((item,) => (
                                    <div key={item.title} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="inline-block w-3 h-3 rounded-sm"
                                                style={{ backgroundColor: item.color }}
                                            ></span>
                                            <span className="text-gray-600">{item.title}</span>
                                        </div>
                                        <span className="font-semibold">{item.value} days</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Absences Section */}
                {absences.length > 0 && (
                    <div className="mb-8 sm:mb-10">
                        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-700">
                            Recorded Absences
                        </h2>
                        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {absences
                                    .filter(absence => {
                                        const absenceDate = new Date(absence.date);
                                        return absence.email.toLowerCase() === (loggedInEmail || "").toLowerCase() &&
                                               absenceDate.getMonth() === currentMonth.getMonth() &&
                                               absenceDate.getFullYear() === currentMonth.getFullYear();
                                    })
                                    .map(absence => (
                                        <div key={absence.date + '-' + (absence.email || '')} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-semibold text-orange-800">Absence Record</h3>
                                                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Absent</span>
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Date:</span>
                                                    <span className="font-medium">{formatDateForDisplay(absence.date)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Employee:</span>
                                                    <span className="font-medium">{absence.fullname}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Department:</span>
                                                    <span className="font-medium">{absence.department}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Records */}
                <div className="mt-6 sm:mt-8">
                    <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-700">
                        {selectedDate ? `${formatDateForDisplay(selectedDate)} Attendance` : "All Attendance Records"}
                    </h2>

                    <AttendanceRecordsWithDatePicker
                        mergedAttendance={mergedAttendance}
                        loggedInEmail={loggedInEmail}
                        loadingFetchedAttendance={loadingFetchedAttendance}
                        fetchError={fetchError}
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                        formatDateForComparison={formatDateForComparison}
                        absences={absences}
                        formatTime={formatTime}
                        shifts={shifts}
                        otRecords={otRecords}
                        currentMonth={currentMonth}
                        breaks={breaks}
                    />
                </div>

                {/* Responsive Attendance Cards Section */}
                <div className="mt-12 sm:mt-16">
                    <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-700">Detailed Attendance Records</h2>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {
                            // Helper to derive status for any record (copied for local use)
                            // This is injected just above the map section as requested.
                            // eslint-disable-next-line
                            // @ts-ignore
                            (() => {
                                const deriveStatus = (record: AttendanceRecord): string => {
                                    if (!record) return "-";
                                    if (record.status === "Sunday") return "Sunday";
                                    if (record.status === "Absent") return "Absent";
                                    const hasIn = !!(record.checkIn && record.checkIn !== "-" && record.checkIn !== "null");
                                    const hasOut = !!(record.checkOut && record.checkOut !== "-" && record.checkOut !== "null");
                                    if (hasIn && hasOut) return "Present";
                                    if (hasIn && !hasOut) return "Working In";
                                    return record.status && record.status !== "-" ? record.status : "-";
                                };
                                return (
                                    mergedAttendance
                                        .filter(record => {
                                            const recordEmail = (record.email || "").trim().toLowerCase();
                                            const currentEmail = (loggedInEmail || "").trim().toLowerCase();
                                            return recordEmail === currentEmail;
                                        })
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map(record => {
                                            const displayStatus = deriveStatus(record);
                                            const isAbsent = displayStatus === "Absent";
                                            const isSunday = displayStatus === "Sunday";
                                            const cardBorderColor = isAbsent ? "border-orange-200" : isSunday ? "border-red-200" : "border-gray-100";
                                            const cardBgColor = isAbsent ? "bg-orange-50/50" : isSunday ? "bg-red-50/50" : "bg-white";

                                            return (
                                                <div
                                                    key={record.id}
                                                    className={`relative rounded-xl border ${cardBorderColor} ${cardBgColor} p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3 group`}
                                                >
                                                    {/* Card Header */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-gray-800">
                                                                {new Date(record.date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                            <span className="text-xs text-gray-500 font-medium">
                                                                {new Date(record.date).toLocaleDateString("en-US", { weekday: 'long' })}
                                                            </span>
                                                        </div>
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(displayStatus)}`}>
                                                            {displayStatus}
                                                        </span>
                                                    </div>

                                                    {/* Shift, OT, and Break Info */}
                                                    {(record.shift || record.otHours || record.breakHours) && (
                                                        <div className="flex gap-2 flex-wrap">
                                                            {record.shift && (
                                                                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    {record.shift}
                                                                    {record.shiftTime && <span className="text-blue-600">({record.shiftTime})</span>}
                                                                </div>
                                                            )}
                                                            {record.otPeriods && record.otPeriods.length > 0 && (
                                                                <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                                    </svg>
                                                                    OT: {record.otPeriods.map((ot) => `${new Date(ot.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}-${new Date(ot.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`).join(', ')}
                                                                </div>
                                                            )}
                                                            {record.breakHours && record.breakHours > 0 && (
                                                                <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z M9 3v1m6-1v1m-7 5h8m-4 4v.01" />
                                                                    </svg>
                                                                    Break: {record.breakHours.toFixed(1)}h
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Timeline Section */}
                                                    {!isAbsent && !isSunday && (
                                                        <div className="flex items-center justify-between relative mt-2">
                                                            {/* Connecting Line */}
                                                            <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-gray-100 -z-10"></div>

                                                            {/* Check In */}
                                                            <div className="flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-lg z-0">
                                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Check In</span>
                                                                <div className="relative">
                                                                    {record.checkInPhoto ? (
                                                                        <PhotoDisplay
                                                                            src={record.checkInPhoto}
                                                                            alt="In"
                                                                            size="sm"
                                                                            className="border-2 border-green-100 shadow-sm"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 font-bold text-xs shadow-sm">
                                                                            IN
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-800 mt-0.5">{formatTime(record.checkIn)}</span>
                                                            </div>

                                                            {/* Hours Pill (Center) */}
                                                            <div className="flex flex-col items-center z-10">
                                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm flex items-center gap-1">
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    {calculateHoursWorked(record)}
                                                                </div>
                                                            </div>

                                                            {/* Check Out */}
                                                            <div className="flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-lg z-0">
                                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Check Out</span>
                                                                <div className="relative">
                                                                    {record.checkOutPhoto ? (
                                                                        <PhotoDisplay
                                                                            src={record.checkOutPhoto}
                                                                            alt="Out"
                                                                            size="sm"
                                                                            className="border-2 border-red-100 shadow-sm"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold text-xs shadow-sm">
                                                                            OUT
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-800 mt-0.5">{formatTime(record.checkOut)}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Footer Info (if needed) */}
                                                    {(isAbsent || isSunday) && (
                                                        <div className="text-xs text-gray-500 text-center italic py-2">
                                                            {isSunday ? "Weekend Break" : "No attendance recorded"}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                );
                            })()
                        }
                    </div>
                </div>
            </div>

            {/* Photo Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4" onClick={() => setModalOpen(false)}>
                    <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
                        <button
                            className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300 transition-colors"
                            onClick={() => setModalOpen(false)}
                        >
                            ×
                        </button>
                        <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
                            <Image
                                src={modalPhotoSrc}
                                alt={modalPhotoAlt}
                                width={300}
                                height={200}
                                loading="lazy"
                                className="max-w-full max-h-[80vh] object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMzAwIDIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                                }}
                            />
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                <p className="text-gray-700 font-medium text-center">{modalPhotoAlt}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                    padding: 8px 12px;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f8fafc;
                }

                @media (min-width: 640px) {
                    .react-calendar__navigation {
                        padding: 12px 16px;
                    }
                }

                .react-calendar__navigation button {
                    background: white;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    padding: 6px 10px;
                    font-weight: 600;
                    color: #374151;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-width: 40px;
                    font-size: 0.875rem;
                }

                @media (min-width: 640px) {
                    .react-calendar__navigation button {
                        padding: 8px 12px;
                        min-width: 44px;
                        font-size: 1rem;
                    }
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
                    font-size: 0.875rem;
                }

                @media (min-width: 640px) {
                    .react-calendar__navigation__label {
                        font-size: 1rem;
                        }
                }

                .react-calendar__month-view__weekdays {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    background: #f8fafc;
                    border-bottom: 1px solid #e5e7eb;
                }

                .react-calendar__month-view__weekdays__weekday {
                    padding: 8px 6px;
                    text-align: center;
                    font-weight: 600;
                    color: #374151;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    border-right: 1px solid #e5e7eb;
                }

                @media (min-width: 640px) {
                    .react-calendar__month-view__weekdays__weekday {
                        padding: 12px 8px;
                        font-size: 0.875rem;
                    }
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
                    padding: 8px 6px;
                    font-size: 0.75rem;
                    transition: all 0.3s ease;
                    min-height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                @media (min-width: 640px) {
                    .react-calendar__tile {
                        padding: 12px 8px;
                        font-size: 0.875rem;
                        min-height: 48px;
                    }
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

                /* Enhanced Attendance Status Styling */
                .calendar-present {
                    background: #dcfce7 !important;
                    color: #166534 !important;
                    font-weight: 600;
                    border: 2px solid #16a34a !important;
                }

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
                    background: #ffedd5 !important;
                    color: #9a3412 !important;
                    font-weight: 600;
                    border: 2px solid #ea580c !important;
                }

                .calendar-leave {
                    background: #e0f2fe !important; /* sky-100 */
                    color: #075985 !important; /* sky-800 */
                    font-weight: 600;
                    border: 2px solid #0ea5e9 !important; /* sky-500 */
                }

                .calendar-late {
                    background: #f3e8ff !important;
                    color: #7c3aed !important;
                    font-weight: 600;
                    border: 2px solid #8b5cf6 !important;
                }

                .calendar-halfday {
                    background: #cffafe !important;
                    color: #0e7490 !important;
                    font-weight: 600;
                    border: 2px solid #06b6d4 !important;
                }

                /* FIXED: Remove any special styling for Saturdays */
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

                /* Professional Photo Display Styles */
                .photo-display-container {
                    transition: all 0.3s ease;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border: 1px solid #e2e8f0;
                }

                .photo-display-container:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }

                .photo-label {
                    font-weight: 500;
                    color: #4b5563;
                    margin-bottom: 0.25rem;
                }

                .photo-placeholder {
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    font-size: 0.75rem;
                    text-align: center;
                    padding: 0.5rem;
                }

                .photo-error {
                    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #991b1b;
                    font-size: 0.75rem;
                    text-align: center;
                    padding: 0.5rem;
                }

                /* Photo Modal Styles */
                .photo-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.75);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }

                .photo-modal-content {
                    background: white;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    max-width: 90vw;
                    max-height: 90vh;
                }

                .photo-modal-image {
                    max-width: 100%;
                    max-height: 80vh;
                    object-fit: contain;
                }

                .photo-modal-caption {
                    padding: 1rem;
                    background-color: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                    font-weight: 500;
                    color: #374151;
                }

                .photo-modal-close {
                    position: absolute;
                    top: -2.5rem;
                    right: 0;
                    color: white;
                    font-size: 2rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0.5rem;
                    transition: color 0.2s;
                }

                .photo-modal-close:hover {
                    color: #d1d5db;
                }

                /* Extra small devices (phones, 480px and down) */
                @media (max-width: 480px) {
                    .react-calendar__tile {
                        min-height: 36px;
                        padding: 6px 4px;
                        font-size: 0.7rem;
                    }

                    .react-calendar__navigation button {
                        padding: 4px 8px;
                        min-width: 36px;
                        font-size: 0.75rem;
                    }

                    .react-calendar__month-view__weekdays__weekday {
                        padding: 6px 4px;
                        font-size: 0.7rem;
                    }
                }

                /* Small devices (phones, 640px and down) */
                @media (max-width: 640px) {
                    .grid-cols-1\\ xs\\:grid-cols-2 > * {
                        min-width: 0;
                    }
                }

                /* Medium devices (tablets, 768px to 1023px) */
                @media (min-width: 768px) and (max-width: 1023px) {
                    .react-calendar__tile {
                        padding: 10px 6px;
                        font-size: 0.8rem;
                        min-height: 44px;
                    }

                    .react-calendar__navigation button {
                        padding: 7px 10px;
                        min-width: 42px;
                        font-size: 0.9rem;
                    }

                    .react-calendar__month-view__weekdays__weekday {
                        padding: 10px 6px;
                        font-size: 0.8rem;
                    }

                    /* Calendar and pie chart side by side on tablets */
                    .lg\\:flex-row {
                        flex-direction: row;
                    }

                    .lg\\:w-80 {
                        width: 280px;
                    }

                    /* Adjust grid layouts for tablets */
                    .grid-cols-1 {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }

                    .md\\:grid-cols-3 {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }

                    /* Adjust card spacing */
                    .gap-4 {
                        gap: 1rem;
                    }

                    .sm\\:gap-6 {
                        gap: 1.25rem;
                    }
                }

                /* Large devices (desktops, 1024px and up) */
                @media (min-width: 1024px) {
                    .react-calendar__tile {
                        padding: 12px 8px;
                        font-size: 0.875rem;
                        min-height: 48px;
                    }

                    .react-calendar__navigation button {
                        padding: 8px 12px;
                        min-width: 44px;
                        font-size: 1rem;
                    }

                    .react-calendar__month-view__weekdays__weekday {
                        padding: 12px 8px;
                        font-size: 0.875rem;
                    }

                    /* Calendar and pie chart side by side on large screens */
                    .lg\\:flex-row {
                        flex-direction: row;
                    }

                    .lg\\:w-80 {
                        width: 320px;
                    }

                    /* Full grid layouts on large screens */
                    .grid-cols-1 {
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                    }

                    .md\\:grid-cols-3 {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                    }

                    .lg\\:grid-cols-4 {
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                    }
                }

                /* Custom breakpoint for very small screens */
                @media (max-width: 360px) {
                    .xs\\:grid-cols-2 {
                        grid-template-columns: 1fr;
                    }
                    
                    .p-3 {
                        padding: 0.75rem;
                    }
                    
                    .gap-4 {
                        gap: 0.75rem;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
}

function AttendanceRecordsWithDatePicker({
    mergedAttendance,
    loggedInEmail,
    loadingFetchedAttendance,
    fetchError,
    selectedDate,
    formatDateForComparison,
    absences,
    formatTime,
    shifts,
    otRecords,
    currentMonth,
    breaks,
}: {
    mergedAttendance: AttendanceRecord[];
    loggedInEmail: string | null;
    loadingFetchedAttendance: boolean;
    fetchError: string | null;
    selectedDate: string | null;
    onDateChange: (date: string | null) => void;
    formatDateForComparison: (date: Date | string) => string;
    absences: AbsenceRecord[];
    formatTime: (time: string | null | undefined) => string;
    shifts: ShiftRecord[];
    otRecords: OTRecord[];
    currentMonth: Date;
    breaks: BreakRecord[];
}) {
    if (loadingFetchedAttendance) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading attendance records...</span>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">Error fetching attendance: {fetchError}</p>
            </div>
        );
    }

    const normalizedEmail = (loggedInEmail || "").trim().toLowerCase();

    const filteredRecords = mergedAttendance
        .filter((record: AttendanceRecord) => {
            const recordEmail = (record.email || "").trim().toLowerCase();
            if (recordEmail !== normalizedEmail) return false;
            if (selectedDate) {
                return formatDateForComparison(record.date) === selectedDate;
            }
            // When no date selected, filter by current month
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth.getMonth() &&
                   recordDate.getFullYear() === currentMonth.getFullYear();
        })
        .sort((a: AttendanceRecord, b: AttendanceRecord) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filteredRecords.length === 0) {
        // If there are no attendance records for the selected day, but the day is marked absent, show an absence info card
        if (selectedDate) {
            const absentForSelected = absences.find(abs =>
                formatDateForComparison(abs.date) === selectedDate &&
                (abs.email || "").trim().toLowerCase() === normalizedEmail
            );
            if (absentForSelected) {
                return (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-orange-800">Absence Record</h3>
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Absent</span>
                        </div>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Date:</span>
                                <span className="font-medium">{new Date(selectedDate).toLocaleDateString("en-GB")}</span>
                            </div>
                            {absentForSelected.fullname && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Employee:</span>
                                    <span className="font-medium">{absentForSelected.fullname}</span>
                                </div>
                            )}
                            {absentForSelected.department && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Department:</span>
                                    <span className="font-medium">{absentForSelected.department}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
        }
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-500 text-sm">No attendance records found.</p>
            </div>
        );
    }

    // Calculate hoursWorked for present records, show "-" for absent
    const calcHoursWorked = (record: AttendanceRecord): string => {
        if (record.status === "Absent") return "-";
        if (
            record.checkIn &&
            record.checkIn !== "-" &&
            record.checkIn !== "null" &&
            record.checkOut &&
            record.checkOut !== "-" &&
            record.checkOut !== "null"
        ) {
            if (record.hoursWorked && record.hoursWorked !== "-") return record.hoursWorked;
            // fallback calculation
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
        }
        return "-";
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case "Present":
                return "bg-green-100 text-green-800";
            case "Absent":
                return "bg-orange-100 text-orange-800";
            case "Working In":
                return "bg-yellow-100 text-yellow-800";
            case "Late":
                return "bg-purple-100 text-purple-800";
            case "Half Day":
                return "bg-cyan-100 text-cyan-800";
            case "Sunday":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {filteredRecords.map(record => {
                const displayStatus = deriveStatus(record);
                const isAbsent = displayStatus === "Absent";
                const isSunday = displayStatus === "Sunday";
                const cardBorderColor = isAbsent ? "border-orange-200" : isSunday ? "border-red-200" : "border-gray-100";
                const cardBgColor = isAbsent ? "bg-orange-50/50" : isSunday ? "bg-red-50/50" : "bg-white";

                return (
                    <div
                        key={record.id}
                        className={`relative rounded-xl border ${cardBorderColor} ${cardBgColor} p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3 group`}
                    >
                        {/* Card Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-800">
                                    {new Date(record.date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(displayStatus)}`}>
                                {displayStatus}
                            </span>
                        </div>

                        {/* Schedule Information */}
                        <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="text-xs font-semibold text-gray-700 mb-1">Schedule:</h4>
                            <div className="space-y-1">
                                {(() => {
                                    const dateShifts = shifts.filter(shift => shift.date === record.date);
                                    const dateOT = otRecords.filter(ot => {
                                        try {
                                            const otDate = new Date(ot.ot_start).toISOString().split('T')[0];
                                            return otDate === record.date;
                                        } catch {
                                            return false;
                                        }
                                    });
                                    const dateBreaks = breaks.filter(br => {
                                        try {
                                            const breakDate = new Date(br.break_start).toISOString().split('T')[0];
                                            return breakDate === record.date && br.break_end;
                                        } catch {
                                            return false;
                                        }
                                    });
                                    if (dateShifts.length === 0 && dateOT.length === 0 && dateBreaks.length === 0) {
                                        return (
                                            <div className="text-xs text-gray-500 italic">No scheduled shifts, overtime or breaks</div>
                                        );
                                    }

                                    return (
                                        <>
                                            {dateShifts.map((shift) => (
                                                <div key={`shift-${shift.id}`} className="flex items-center gap-1 text-xs">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                    <span className="text-blue-700 font-medium">{shift.shift} Shift:</span>
                                                    <span className="text-gray-600">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
                                                </div>
                                            ))}
                                            {dateOT.map((ot) => {
                                                const startTime = new Date(ot.ot_start);
                                                const endTime = new Date(ot.ot_end);
                                                const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

                                                const formatTime12Hour = (date: Date) => {
                                                    const hours = date.getHours();
                                                    const minutes = date.getMinutes();
                                                    const ampm = hours >= 12 ? 'PM' : 'AM';
                                                    const displayHours = hours % 12 || 12;
                                                    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                                                };

                                                return (
                                                    <div key={`ot-${ot.id}`} className="flex items-center gap-1 text-xs">
                                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                                        <span className="text-orange-700 font-medium">Overtime:</span>
                                                        <span className="text-gray-600">{formatTime12Hour(startTime)} - {formatTime12Hour(endTime)} ({Math.abs(hours).toFixed(1)}h)</span>
                                                    </div>
                                                );
                                            })}
                                            {dateBreaks.map((breakRecord) => {
                                                const breakStart = new Date(breakRecord.break_start);
                                                const breakEnd = new Date(breakRecord.break_end!);
                                                const duration = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);

                                                const formatTime12Hour = (date: Date) => {
                                                    const hours = date.getHours();
                                                    const minutes = date.getMinutes();
                                                    const ampm = hours >= 12 ? 'PM' : 'AM';
                                                    const displayHours = hours % 12 || 12;
                                                    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                                                };

                                                return (
                                                    <div key={`break-${breakRecord.id}`} className="flex items-center gap-1 text-xs">
                                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                                        <span className="text-red-700 font-medium">Break:</span>
                                                        <span className="text-gray-600">{formatTime12Hour(breakStart)} - {formatTime12Hour(breakEnd)} ({Math.abs(duration).toFixed(1)}h)</span>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Timeline Section */}
                        {!isAbsent && !isSunday && (
                            <div className="flex items-center justify-between relative mt-2">
                                {/* Connecting Line */}
                                <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-gray-100 -z-10"></div>

                                {/* Check In */}
                                <div className="flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-lg z-0">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Check In</span>
                                    <div className="relative">
                                        {record.checkInPhoto ? (
                                            <PhotoDisplay
                                                src={record.checkInPhoto}
                                                alt="In"
                                                size="sm"
                                                className="border-2 border-green-100 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 font-bold text-xs shadow-sm">
                                                IN
                                            </div>
                                        )}
                                        {/* <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div> */}
                                    </div>
                                    <span className="text-xs font-bold text-gray-800 mt-0.5">{formatTime(record.checkIn)}</span>
                                </div>

                                {/* Hours Pill (Center) */}
                                <div className="flex flex-col items-center z-10">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {calcHoursWorked(record)}
                                    </div>
                                </div>

                                {/* Check Out */}
                                <div className="flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-lg z-0">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Check Out</span>
                                    <div className="relative">
                                        {record.checkOutPhoto ? (
                                            <PhotoDisplay
                                                src={record.checkOutPhoto}
                                                alt="Out"
                                                size="sm"
                                                className="border-2 border-red-100 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold text-xs shadow-sm">
                                                OUT
                                            </div>
                                        )}
                                        {/* {record.checkOut && record.checkOut !== "-" ? (
                                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                                        ) : (
                                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-gray-300 rounded-full border-2 border-white shadow-sm"></div>
                                        )} */}
                                    </div>
                                    <span className="text-xs font-bold text-gray-800 mt-0.5">{formatTime(record.checkOut)}</span>
                                </div>
                            </div>
                        )}

                        {/* Footer Info (if needed) */}
                        {(isAbsent || isSunday) && (
                            <div className="text-xs text-gray-500 text-center italic py-2">
                                {isSunday ? "Weekend Break" : "No attendance recorded"}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
