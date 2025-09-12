"use client";
import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type AttendanceRecord = {
  id: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "Half Day";
  checkIn: string;
  checkOut: string | null;
  hoursWorked: string | null;
};

type AttendanceStats = {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  totalHours: number;
};

export default function AttendancePortal() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [scanning, setScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [view, setView] = useState<"today" | "history" | "stats">("today");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const today = new Date();
  const todayFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const todayRecord = attendance.find(record => 
    new Date(record.date).toDateString() === today.toDateString()
  );

  const stats: AttendanceStats = attendance.reduce(
    (acc, record) => {
      if (record.status === "Present") acc.present++;
      if (record.status === "Absent") acc.absent++;
      if (record.status === "Late") acc.late++;
      if (record.status === "Half Day") acc.halfDay++;
      if (record.hoursWorked) acc.totalHours += parseFloat(record.hoursWorked);
      return acc;
    },
    { present: 0, absent: 0, late: 0, halfDay: 0, totalHours: 0 }
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("attendance");
    if (stored) setAttendance(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("attendance", JSON.stringify(attendance));
  }, [attendance]);

  // **Face recognition handler**
  const handleFaceRecognition = async (type: "checkin" | "checkout") => {
    try {
      setScanning(true);
      
      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Capture frame after 2 seconds
      await new Promise(res => setTimeout(res, 2000));

      if (!videoRef.current) return;
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageBlob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(blob => resolve(blob), "image/jpeg")
      );

      if (!imageBlob) throw new Error("Could not capture image");

      // Send to backend
      const formData = new FormData();
      formData.append("image", imageBlob);
      formData.append("type", type);

      const res = await fetch("http://127.0.0.1:8000/api/accounts/face_recognition/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Face recognition failed. Try again.");
        return;
      }

      // Stop camera
      stream.getTracks().forEach(track => track.stop());

      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

      if (type === "checkin") {
        const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
        const newRecord: AttendanceRecord = {
          id: Date.now().toString(),
          date: today.toISOString().split("T")[0],
          status: isLate ? "Late" : "Present",
          checkIn: timeStr,
          checkOut: null,
          hoursWorked: null,
        };
        setAttendance(prev => [newRecord, ...prev]);
        alert(`Check-in successful at ${timeStr} (${isLate ? "Late" : "On time"})`);
      } else if (type === "checkout" && todayRecord) {
        const [inHour, inMinute] = todayRecord.checkIn.split(":").map(Number);
        const [outHour, outMinute] = timeStr.split(":").map(Number);
        let hoursWorked = outHour - inHour + (outMinute - inMinute) / 60;
        if (hoursWorked < 0) hoursWorked += 24;

        setAttendance(prev =>
          prev.map(record =>
            record.id === todayRecord.id
              ? { ...record, checkOut: timeStr, hoursWorked: hoursWorked.toFixed(1) }
              : record
          )
        );
        alert(`Check-out successful at ${timeStr}`);
      }
    } catch (err) {
      console.error(err);
      alert("Camera or face recognition error. Check permissions.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <DashboardLayout role="employee">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header & Stats - keep your code */}
          
          {/* Hidden video element for camera */}
          <video ref={videoRef} className="hidden"></video>

          {/* Check-in/out buttons */}
          <div className="flex flex-col gap-2 md:gap-3 w-full md:w-auto">
            {!todayRecord ? (
              <button
                disabled={scanning}
                onClick={() => handleFaceRecognition("checkin")}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg text-white font-medium transition-colors flex items-center justify-center text-sm md:text-base ${
                  scanning ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {scanning ? <>🔍 Scanning...</> : <>📸 Check In</>}
              </button>
            ) : !todayRecord.checkOut ? (
              <button
                disabled={scanning}
                onClick={() => handleFaceRecognition("checkout")}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg text-white font-medium transition-colors flex items-center justify-center text-sm md:text-base ${
                  scanning ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {scanning ? <>🔍 Scanning...</> : <>🚪 Check Out</>}
              </button>
            ) : (
              <div className="text-center text-green-600 font-semibold py-2 md:py-3 text-sm md:text-base">
                ✅ Attendance completed for today
              </div>
            )}
          </div>

          {/* Rest of your attendance tables, stats, calendar etc. remain unchanged */}
        </div>
      </div>
    </DashboardLayout>
  );
}
