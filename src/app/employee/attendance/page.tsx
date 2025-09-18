"use client";
import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type AttendanceRecord = {
  id: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "Half Day" | string;
  checkIn: string;
  checkOut: string | null;
  hoursWorked: string | null;
  email: string;
};

type AttendanceStats = {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  totalHours: number;
};

export default function AttendancePortal() {
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [scanning, setScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [view, setView] = useState<"today" | "history" | "stats">("today");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [modalOpen, setModalOpen] = useState(false);
  const [recognizedName, setRecognizedName] = useState<string | null>(null);
  const [recognizedStatus, setRecognizedStatus] = useState<string | null>(null);
  const [recognizedEmail, setRecognizedEmail] = useState<string | null>(null);
  const [attendanceCompleted, setAttendanceCompleted] = useState(false);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [fetchedAttendance, setFetchedAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingFetchedAttendance, setLoadingFetchedAttendance] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const today = new Date();

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
    if (storedEmail) {
      setLoggedInEmail(storedEmail);
      console.log("✅ Logged in as:", storedEmail);
    } else {
      console.warn("⚠ No logged in user found in localStorage.");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("attendance", JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoadingFetchedAttendance(true);
      setFetchError(null);
      try {
        const res = await fetch("http://127.0.0.1:8000/api/accounts/list_attendance/");
        if (!res.ok) throw new Error(`Error fetching attendance: ${res.statusText}`);
        const data = await res.json();

        const transformed = (data.attendance || []).map((rec: any, idx: number) => ({
          id: idx.toString(),
          date: rec.date,
          status: rec.status || "",
          checkIn: rec.check_in || "-",
          checkOut: rec.check_out || "-",
          hoursWorked: "-",
          email: rec.email,
        }));

        setFetchedAttendance(transformed);
      } catch (err: any) {
        setFetchError(err.message || "Unknown error");
      } finally {
        setLoadingFetchedAttendance(false);
      }
    };
    fetchAttendance();
  }, []);

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

  const startWebcam = async () => {
    setRecognizedName(null);
    setRecognizedStatus(null);
    setRecognizedEmail(null);
    setAttendanceCompleted(false);
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
    if (!ctx) {
      setScanning(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpg");
    setCapturedImage(imageData);
    localStorage.setItem("capturedImage", imageData);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/accounts/recognize_face/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await res.json();

      if (res.ok && data.username && data.email) {
        setRecognizedName(data.username);
        setRecognizedEmail(data.email);

        if (data.email !== loggedInEmail) {
          setRecognizedStatus("❌ Scanned face email does not match logged-in user.");
          setAttendanceCompleted(false);
          setScanning(false);
          return;
        }

        const userTodayRecord = attendance.find(
          (record) =>
            new Date(record.date).toDateString() === today.toDateString() &&
            record.email === data.email
        );

        if (!userTodayRecord) {
          setRecognizedStatus("Ready to Check In");
          setAttendanceCompleted(false);
        } else if (userTodayRecord && !userTodayRecord.checkOut) {
          setRecognizedStatus("Ready to Check Out");
          setAttendanceCompleted(false);
        } else {
          setRecognizedStatus("Attendance completed for today");
          setAttendanceCompleted(true);
          stopWebcam();
        }
      } else {
        setRecognizedName("Unknown");
        setRecognizedEmail(null);
        setRecognizedStatus("Face not recognized");
        setAttendanceCompleted(false);
      }
    } catch (err) {
      console.error(err);
      setRecognizedName("Error");
      setRecognizedEmail(null);
      setRecognizedStatus("Scan failed");
      setAttendanceCompleted(false);
    }
    setScanning(false);
  };

  const handleCheckIn = () => {
    if (!recognizedEmail || !recognizedName) return;
    if (recognizedEmail !== loggedInEmail) return;

    const nowTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
    if (recognizedEmail !== loggedInEmail) return;

    const userTodayRecord = attendance.find(
      (record) =>
        new Date(record.date).toDateString() === today.toDateString() &&
        record.email === recognizedEmail &&
        !record.checkOut
    );
    if (!userTodayRecord) return;

    const nowTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const [inHour, inMinute] = userTodayRecord.checkIn.split(":").map(Number);
    const [outHour, outMinute] = nowTime.split(":").map(Number);
    let hoursWorked = outHour - inHour + (outMinute - inMinute) / 60;
    if (hoursWorked < 0) hoursWorked += 24;

    const updated = {
      ...userTodayRecord,
      checkOut: nowTime,
      hoursWorked: hoursWorked.toFixed(1),
    };
    setAttendance((prev) => prev.map((r) => (r.id === userTodayRecord.id ? updated : r)));
    setRecognizedStatus(`Checked Out at ${nowTime}`);
    setAttendanceCompleted(true);
    stopWebcam();
  };

  return (
    <DashboardLayout role="employee">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md relative">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setRecognizedName(null);
                  setRecognizedEmail(null);
                  setRecognizedStatus(null);
                  setAttendanceCompleted(false);
                  stopWebcam();
                }}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              >
                ✖
              </button>
              <h2 className="text-xl font-semibold mb-2">Face Scan</h2>

              {!attendanceCompleted && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    className="w-full rounded-lg border border-gray-200"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {!recognizedName ? (
                    <button
                      onClick={handleScanFace}
                      disabled={scanning}
                      className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {scanning ? "Scanning..." : "Scan Face"}
                    </button>
                  ) : (
                    <div className="text-center mt-4">
                      <div className="text-3xl font-bold mb-2">👋 {recognizedName}</div>
                      {capturedImage && (
                        <img
                          src={capturedImage}
                          alt="Captured"
                          className="mt-3 w-32 h-32 object-cover rounded-full mx-auto border shadow"
                        />
                      )}
                      <div className="text-lg mb-1">{recognizedStatus}</div>
                      <div className="text-gray-500">{currentTime.toLocaleTimeString()}</div>

                      {recognizedEmail && recognizedEmail === loggedInEmail && (
                        <>
                          {recognizedStatus === "Ready to Check In" && (
                            <button
                              onClick={handleCheckIn}
                              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
                            >
                              📥 Check In
                            </button>
                          )}
                          {recognizedStatus === "Ready to Check Out" && (
                            <button
                              onClick={handleCheckOut}
                              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full"
                            >
                              📤 Check Out
                            </button>
                          )}
                          {(recognizedStatus === "Checked In" ||
                            recognizedStatus?.startsWith("Checked Out") ||
                            recognizedStatus === "Attendance completed for today") && (
                            <button
                              onClick={handleScanFace}
                              disabled={scanning}
                              className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              {scanning ? "Scanning..." : "Scan Again"}
                            </button>
                          )}
                        </>
                      )}

                      {recognizedEmail && recognizedEmail !== loggedInEmail && (
                        <>
                          <div className="text-red-600 font-semibold my-2">
                            ❌ Scanned face email does not match logged-in user.
                          </div>
                          <button
                            onClick={handleScanFace}
                            disabled={scanning}
                            className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            {scanning ? "Scanning..." : "Scan Again"}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setModalOpen(false);
                          setRecognizedName(null);
                          setRecognizedEmail(null);
                          setRecognizedStatus(null);
                          setAttendanceCompleted(false);
                          stopWebcam();
                        }}
                        className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 w-full"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </>
              )}

              {attendanceCompleted && (
                <div className="text-center mt-4">
                  <div className="text-3xl font-bold mb-2">✅ {recognizedName}</div>
                  {capturedImage && (
                    <img
                      src={capturedImage}
                      alt="Captured"
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
                    }}
                    className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 w-full"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!modalOpen && (
          <div className="flex flex-col gap-2 md:gap-3 w-full md:w-auto">
            <button
              onClick={startWebcam}
              className="px-4 md:px-6 py-2 md:py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700"
            >
              📸 Scan Face to Mark Attendance
            </button>
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Your Attendance Records</h2>
          {loadingFetchedAttendance && <p>Loading attendance records...</p>}
          {fetchError && <p className="text-red-600">Error: {fetchError}</p>}
          {!loadingFetchedAttendance && !fetchError && (() => {
            const userAttendance = fetchedAttendance.filter(
              (rec) => rec.email === loggedInEmail
            );
            if (userAttendance.length === 0) {
              return (
                <div className="flex justify-center">
                  <div className="border border-gray-300 bg-white rounded-lg shadow p-6 text-center text-gray-500 max-w-md w-full">
                    No attendance records found.
                  </div>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 gap-6">
                {userAttendance.map((record, index) => {
                  let hoursWorked = "-";
                  let status = record.status || "-";
                  if (
                    record.checkIn &&
                    record.checkOut &&
                    record.checkIn !== "-" &&
                    record.checkOut !== "-"
                  ) {
                    const checkInDate = new Date(`${record.date}T${record.checkIn}`);
                    const checkOutDate = new Date(`${record.date}T${record.checkOut}`);
                    hoursWorked = (
                      (checkOutDate.getTime() - checkInDate.getTime()) /
                      3600000
                    ).toFixed(2);
                    status = "Present";
                  } else if (record.checkIn && record.checkIn !== "-") {
                    status = "Working In";
                  }
                  return (
                    <div
                      key={`${record.email}-${record.date}-${index}`}
                      className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 font-semibold mb-1">Date</div>
                          <div className="text-base font-medium">{record.date}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-semibold mb-1">Status</div>
                          <div
                            className={
                              "inline-block px-2 py-1 rounded " +
                              (status === "Present"
                                ? "bg-green-100 text-green-700"
                                : status === "Working In"
                                ? "bg-yellow-100 text-yellow-700"
                                : status === "Absent"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700")
                            }
                          >
                            {status}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-semibold mb-1">Check-In</div>
                          <div className="text-base">{record.checkIn}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-semibold mb-1">Check-Out</div>
                          <div className="text-base">{record.checkOut || "-"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-semibold mb-1">
                            Hours Worked
                          </div>
                          <div className="text-base">{hoursWorked}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-semibold mb-1">Email</div>
                          <div className="text-base break-all">{record.email}</div>
                        </div>
                        {capturedImage && (
                          <div className="col-span-1 md:col-span-2 flex flex-col items-center mt-4">
                            <div className="text-xs text-gray-500 font-semibold mb-1">Face</div>
                            <img
                              src={capturedImage}
                              alt="Captured face"
                              className="w-24 h-24 object-cover rounded-full border shadow"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </DashboardLayout>
  );
}
