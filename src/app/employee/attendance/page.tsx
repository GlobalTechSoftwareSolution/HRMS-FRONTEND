"use client";
import React, { useState, useEffect } from "react";
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
    hoursWorked: string | null;
    email: string;
    fullname?: string;
    department?: string;
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
    // Absences state
    const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
    const [, setLoadingAbsences] = useState(false);

    // Profile data state (moved to top level)
    const [profileData, setProfileData] = useState<ProfileData | null>(null);

    useEffect(() => {
      const userEmail = localStorage.getItem("user_email");
      if (userEmail && !profileData) {
        fetch(`https://globaltechsoftwaresolutions.cloud/api/accounts/employees/${encodeURIComponent(userEmail)}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => setProfileData(data))
          .catch(() => {});
      }
    }, [profileData]);

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
          `https://globaltechsoftwaresolutions.cloud/api/accounts/employees/${encodeURIComponent(userEmail)}/`
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
              "https://globaltechsoftwaresolutions.cloud/api/accounts/office_attendance/",
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

    // Month summary for the pie chart
    const handleActiveStartDateChange = (
        { activeStartDate }: { activeStartDate: Date | null }
    ) => {
        if (activeStartDate) setCurrentMonth(activeStartDate);
    };

    const monthSummary = (() => {
        if (!isClient || !loggedInEmail) return { present: 0, absent: 0, workingIn: 0, late: 0, halfDay: 0, sunday: 0 };

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

        let present = 0, absent = 0, workingIn = 0, late = 0, halfDay = 0, sunday = 0;
        
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

        return { present, absent, workingIn, late, halfDay, sunday };
    })();

    const chartData = [
        { title: "Present", value: monthSummary.present, color: "#10b981" },
        { title: "Absent", value: monthSummary.absent, color: "#f97316" },
        { title: "Working In", value: monthSummary.workingIn, color: "#eab308" },
        { title: "Late", value: monthSummary.late, color: "#8b5cf6" },
        { title: "Half Day", value: monthSummary.halfDay, color: "#06b6d4" },
        { title: "Sunday", value: monthSummary.sunday, color: "#ef4444" },
    ].filter(item => item.value > 0);

    // Enhanced stats calculation
    const totalPresentDays = fetchedAttendance.filter(record => {
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

    const thisMonthPresent = fetchedAttendance.filter(record => {
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

        // Check absences first
        const absenceMatch = absences.find(
            abs => abs.date === dateStr && abs.email?.trim().toLowerCase() === normalizedEmail
        );
        if (absenceMatch) return "calendar-absent";

        // Then check attendance
        const record = fetchedAttendance.find(
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
            <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
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
                                            const record = fetchedAttendance.find(rec => {
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
                                                    className={`font-medium px-2 py-0.5 rounded text-xs ${getStatusColor(hoveredRecord.status)}`}
                                                >
                                                    {hoveredRecord.status}
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
                                            {hoveredRecord.status !== "Sunday" && (
                                                <>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Check-in:</span>
                                                        <span className="text-green-700 font-medium">{formatTime(hoveredRecord.checkIn)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Check-out:</span>
                                                        <span className="text-red-700 font-medium">{formatTime(hoveredRecord.checkOut)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Hours:</span>
                                                        <span className="text-blue-700 font-medium">{calculateHoursWorked(hoveredRecord)}</span>
                                                    </div>
                                                </>
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
                                        <div className="space-y-2">
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
                                          {selectedDateRecord.status !== "Sunday" && (
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Check-in:</span>
                                              <span className="font-medium text-green-600">
                                                {formatTime(selectedDateRecord.checkIn)}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`font-medium px-2 py-1 rounded text-xs sm:text-sm ${getStatusColor(selectedDateRecord.status)}`}>
                                              {selectedDateRecord.status}
                                            </span>
                                          </div>
                                          {selectedDateRecord.status !== "Sunday" && (
                                            <>
                                              <div className="flex justify-between">
                                                <span className="text-gray-600">Check-out:</span>
                                                <span className="font-medium text-red-600">
                                                  {formatTime(selectedDateRecord.checkOut)}
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-gray-600">Hours:</span>
                                                <span className="font-medium text-blue-600">
                                                  {calculateHoursWorked(selectedDateRecord)}
                                                </span>
                                              </div>
                                            </>
                                          )}
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
                                                  <button
                                                    type="button"
                                                    className="px-5 py-2 bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 transition-all duration-200"
                                                    onClick={() => alert('📩 Request sent to your manager! They will review your absence.')}
                                                  >
                                                    Request Manager
                                                  </button>
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
                                {chartData.map((item,) => (
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
                                    .filter(absence => absence.email.toLowerCase() === (loggedInEmail || "").toLowerCase())
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
                <div className="mt-12 sm:mt-16">
                    <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-700">Detailed Attendance Records</h2>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {(fetchedAttendance
                            .filter(record => {
                                const recordEmail = (record.email || "").trim().toLowerCase();
                                const currentEmail = (loggedInEmail || "").trim().toLowerCase();
                                return recordEmail === currentEmail;
                            })
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        ).map(record => {
                            const displayStatus =
                                record.checkIn && record.checkIn !== "-" && record.checkIn !== "null"
                                  ? record.checkOut && record.checkOut !== "-" && record.checkOut !== "null"
                                    ? "Present"
                                    : "Working In"
                                  : record.status || "-";
                            return (
                                <div
                                    key={record.id}
                                    className="bg-white rounded-lg shadow-sm sm:shadow-md p-3 sm:p-4 border hover:shadow-md sm:hover:shadow-lg transition flex flex-col gap-1 sm:gap-2"
                                    style={{minWidth: 0}}
                                >
                                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                                        <div className="text-xs sm:text-sm text-gray-500">{formatDateForDisplay(record.date)}</div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getStatusColor(displayStatus)}`}>
                                            {displayStatus}
                                        </span>
                                    </div>
                                    {record.fullname && (
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-gray-600">Name:</span>
                                            <span className="font-medium">{record.fullname}</span>
                                        </div>
                                    )}
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
                            );
                        })}
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

                /* Medium devices (tablets, 768px and down) */
                @media (max-width: 768px) {
                    .lg\\:flex-row {
                        flex-direction: column;
                    }
                    
                    .lg\\:w-80 {
                        width: 100%;
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
            {filteredRecords.map(record => (
                <div
                    key={record.id}
                    className={`bg-white rounded-lg border p-3 shadow-sm flex flex-col gap-1 ${record.status === "Absent" ? "border-orange-200 bg-orange-50" : record.status === "Sunday" ? "border-red-200 bg-red-50" : ""}`}
                    style={{ minWidth: 0 }}
                >
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">{new Date(record.date).toLocaleDateString("en-GB")}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(record.status)}`}>
                            {record.status}
                        </span>
                    </div>
                    {record.fullname && record.fullname !== "Sunday" && (
                        <div className="flex justify-between text-xs">
                            <span>Employee:</span>
                            <span className="font-medium">{record.fullname}</span>
                        </div>
                    )}
                    {record.status !== "Sunday" && (
                        <>
                            <div className="flex justify-between text-xs">
                                <span>Check-in:</span>
                                <span className={`font-medium ${record.status === "Absent" ? "text-orange-700" : "text-green-700"}`}>
                                    {record.checkIn === "-" || record.checkIn === "null"
                                        ? "-"
                                        : new Date(`${record.date}T${record.checkIn}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span>Check-out:</span>
                                <span className={`font-medium ${record.status === "Absent" ? "text-orange-700" : "text-red-700"}`}>
                                    {record.checkOut === "-" || record.checkOut === "null"
                                        ? "-"
                                        : new Date(`${record.date}T${record.checkOut}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span>Hours:</span>
                                <span className={`font-medium ${record.status === "Absent" ? "text-orange-700" : "text-blue-700"}`}>
                                    {calcHoursWorked(record)}
                                </span>
                            </div>
                        </>
                    )}
                    {record.status === "Sunday" && (
                        <div className="text-xs text-gray-600 text-center py-1">
                            Weekend - No work scheduled
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}