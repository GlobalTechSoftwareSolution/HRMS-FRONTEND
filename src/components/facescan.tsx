"use client";
import React, { useEffect, useRef, useState } from "react";

export default function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("Getting location...");
  const [mapUrl, setMapUrl] = useState<string>("https://www.google.com/maps?q=0,0&z=15&output=embed");
  const [mounted, setMounted] = useState(false);
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanLine, setScanLine] = useState(0);
  const [confirmation, setConfirmation] = useState<{ userName: string; time: string } | null>(null);
  // Add attendanceType state: 'office' | 'work' | null
  const [attendanceType, setAttendanceType] = useState<"office" | "work" | null>(null);

  // State for simulated face tracking offsets
  const [faceOffset, setFaceOffset] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const showMessage = (text: string, type: "success" | "error" | "warning") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (!mounted) return;

    // Only start camera/location if attendanceType is selected
    if (!attendanceType) return;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          showMessage("Camera API not available. Ensure you are using HTTPS or localhost.", "error");
          return;
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      } catch (err) {
        showMessage("Cannot access camera", "error");
        console.error(err);
      }
    };

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    };

    const getLocation = () => {
      if (!navigator.geolocation) {
        showMessage("Geolocation is not supported or restricted. Use HTTPS.", "error");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setMapUrl(`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}&z=17&output=embed`);

          // Fetch address from geocoding API
          try {
            const geoRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/geocoding?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              setLocationAddress(geoData.display_name || `📍 Latitude: ${pos.coords.latitude.toFixed(5)}, Longitude: ${pos.coords.longitude.toFixed(5)}`);
            } else {
              setLocationAddress(`📍 Latitude: ${pos.coords.latitude.toFixed(5)}, Longitude: ${pos.coords.longitude.toFixed(5)}`);
            }
          } catch {
            setLocationAddress(`📍 Latitude: ${pos.coords.latitude.toFixed(5)}, Longitude: ${pos.coords.longitude.toFixed(5)}`);
          }
        },
        () => showMessage("Unable to access location. Allow permission.", "error"),
        { enableHighAccuracy: true }
      );
    };

    startCamera();
    getLocation();

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, attendanceType]);

  // Simple scan line animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scanning) {
      setScanLine(0);
      interval = setInterval(() => {
        setScanLine(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [scanning]);

  // Face tracking offset simulation: update every 1 second with subtle random values
  useEffect(() => {
    if (!scanning) {
      setFaceOffset({ x: 0, y: 0, scale: 1 });
      return;
    }
    const interval = setInterval(() => {
      const x = (Math.random() - 0.5) * 6; // ±3px
      const y = (Math.random() - 0.5) * 6; // ±3px
      const scale = 1 + (Math.random() - 0.5) * 0.04; // scale from 0.98 to 1.02
      setFaceOffset({ x, y, scale });
    }, 1000);
    return () => clearInterval(interval);
  }, [scanning]);

  const captureAndUpload = () => {
    if (!videoRef.current || !canvasRef.current) {
      showMessage("Start camera first!", "error");
      return;
    }

    // Start simple scanning animation
    setScanning(true);
    setScanLine(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCanvasVisible(true);
    video.pause();

    // Wait for scan to complete
    setTimeout(() => {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await uploadImage(blob, "attendance.jpg", () => {
          setCanvasVisible(false);
          setScanning(false);
          video.play();
        });
      }, "image/jpeg");
    }, 1000);
  };

  const uploadImage = async (file: Blob, filename: string, callback?: () => void) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file, filename);
      if (latitude && longitude) {
        formData.append("latitude", latitude.toString());
        formData.append("longitude", longitude.toString());
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      let endpoint = "";
      if (attendanceType === "office") {
        endpoint = `${apiUrl}/api/accounts/office_attendance/`;
      } else if (attendanceType === "work") {
        endpoint = `${apiUrl}/api/accounts/work_attendance/`;
      } else {
        endpoint = `${apiUrl}/api/accounts/mark_attendance/`;
      }

      const token = localStorage.getItem("access_token");
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      const text = await res.text();

      // --- Handle non-JSON ---
      if (!res.ok) {
        console.error("Server responded with error:", res.status, text ? text.slice(0, 200) : "Empty response");
        showMessage("Time up — marked absent. You can contact your manager for clarification.", "warning");
        return;
      }

      if (text && text.trim().startsWith("<")) {
        console.error("HTML response (likely 404/500 from backend):", text.slice(0, 200));
        showMessage("Time up — marked absent. You can contact your manager for clarification.", "warning");
        return;
      }

      const data = JSON.parse(text);

      if (data.status === "success") {
        showMessage(data.message, "success");
        const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setConfirmation({ userName: data.userName || "User", time: currentTime });
        setTimeout(() => setConfirmation(null), 3000);
      } else {
        showMessage("Time up — marked absent. You can contact your manager for clarification.", "warning");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showMessage("Time up — marked absent. You can contact your manager for clarification.", "warning");
    } finally {
      setLoading(false);
      if (callback) callback();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Face Recognition Attendance</h1>
        </div>

        {attendanceType === null ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-2xl">
              {/* Back button aligned with boxes */}
              <div className="mb-6 flex justify-start">
                <button
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                  onClick={() => window.location.href = '/'}
                  type="button"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Home
                </button>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                  {/* Office Attendance button */}
                  <button
                    className="flex flex-col items-center justify-center rounded-2xl shadow-lg px-10 py-12 bg-gradient-to-br from-purple-600 to-blue-500 text-white hover:scale-105 transition-all duration-200"
                    onClick={() => setAttendanceType("office")}
                    style={{ minHeight: 200, fontSize: "1.35rem" }}
                  >
                    <span className="font-bold text-2xl mb-2">Office Attendance</span>
                    <span className="text-base font-normal opacity-90 mt-2 text-center w-4/5">
                      Mark your attendance at your company office using face recognition and location.
                    </span>
                  </button>
                  {/* Workplace Attendance button */}
                  <button
                    className="flex flex-col items-center justify-center rounded-2xl shadow-lg px-10 py-12 bg-gradient-to-br from-green-500 to-teal-400 text-white hover:scale-105 transition-all duration-200"
                    onClick={() => setAttendanceType("work")}
                    style={{ minHeight: 200, fontSize: "1.35rem" }}
                  >
                    <span className="font-bold text-2xl mb-2">Workplace Attendance</span>
                    <span className="text-base font-normal opacity-90 mt-2 text-center w-4/5">
                      Mark attendance when working remotely, in the field, or at a client location.
                    </span>
                  </button>
                </div>
                <div className="mt-8 text-gray-600 text-center text-lg font-medium">
                  Please select your attendance type to continue.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Back button for camera screen - kept for usability */}
            <div className="mb-4">
              <button
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all duration-200"
                onClick={() => setAttendanceType(null)}
                type="button"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Change Type
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Camera Section - Full width on mobile, half on desktop */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Camera Feed</h2>
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
                  {/* Video feed */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${canvasVisible ? 'hidden' : 'block'}`}
                  />
                  {/* Canvas for captured image */}
                  <canvas
                    ref={canvasRef}
                    className={`absolute top-0 left-0 w-full h-full ${canvasVisible ? 'block' : 'hidden'}`}
                  />
                  {(!scanning && !canvasVisible) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 rounded-full border-2 border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.15)]" style={{ boxShadow: "0 0 60px rgba(59,130,246,0.25) inset" }}></div>
                    </div>
                  )}
                  {/* Facial scan overlay */}
                  {scanning && (
                    <div
                      className="absolute inset-0 pointer-events-none flex items-center justify-center"
                      style={{
                        transform: `translate(${faceOffset.x}px, ${faceOffset.y}px) scale(${faceOffset.scale})`,
                        transition: "transform 1s ease-in-out",
                      }}
                    >
                      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(59,130,246,0.20) 0%, rgba(0,0,0,0.0) 60%)" }}></div>
                      <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 120px rgba(0,0,0,0.35)" }}></div>
                      {/* Hexagonal wireframe with smooth opacity animation */}
                      <svg
                        viewBox="0 0 200 200"
                        className="w-48 h-48"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeOpacity="0.5"
                        style={{ animation: "hex-opacity 3s ease-in-out infinite alternate" }}
                      >
                        <polygon points="100,15 155,50 155,120 100,155 45,120 45,50" />
                      </svg>
                      <svg viewBox="0 0 200 200" className="absolute w-60 h-60" style={{ animation: "rotate-ring 6s linear infinite" }}>
                        <defs>
                          <linearGradient id="grad">
                            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
                          </linearGradient>
                        </defs>
                        <circle cx="100" cy="100" r="86" fill="none" stroke="url(#grad)" strokeWidth="2" strokeDasharray="6 10" strokeLinecap="round" />
                      </svg>
                      {/* Multiple layered scanning grid lines */}
                      <svg
                        className="absolute inset-0 w-full h-full"
                        style={{ pointerEvents: "none" }}
                      >
                        {/* Vertical lines */}
                        {[...Array(6)].map((_, i) => {
                          const x = (100 / 5) * i + "%";
                          return (
                            <line
                              key={"v" + i}
                              x1={x}
                              y1="0"
                              x2={x}
                              y2="100%"
                              stroke="white"
                              strokeWidth="1"
                              strokeOpacity="0.2"
                              style={{
                                animation: `pulse-line 2.1s ease-in-out infinite`,
                                animationDelay: `${i * 0.3}s`,
                              }}
                            />
                          );
                        })}
                        {/* Horizontal lines */}
                        {[...Array(6)].map((_, i) => {
                          const y = (100 / 5) * i + "%";
                          return (
                            <line
                              key={"h" + i}
                              x1="0"
                              y1={y}
                              x2="100%"
                              y2={y}
                              stroke="white"
                              strokeWidth="1"
                              strokeOpacity="0.2"
                              style={{
                                animation: `pulse-line 2.1s ease-in-out infinite`,
                                animationDelay: `${i * 0.3 + 1.2}s`,
                              }}
                            />
                          );
                        })}
                        {/* Animated scanning lines (horizontal) */}
                        <line
                          x1="0"
                          y1={`${scanLine}%`}
                          x2="100%"
                          y2={`${scanLine}%`}
                          stroke="white"
                          strokeWidth="2"
                          strokeOpacity="0.85"
                          style={{ filter: "drop-shadow(0 0 4px white)" }}
                        />
                        {/* Animated scanning lines (vertical) */}
                        <line
                          x1={`${scanLine}%`}
                          y1="0"
                          x2={`${scanLine}%`}
                          y2="100%"
                          stroke="white"
                          strokeWidth="2"
                          strokeOpacity="0.85"
                          style={{ filter: "drop-shadow(0 0 4px white)" }}
                        />
                      </svg>
                      {/* Animated corner brackets */}
                      <div className="absolute w-48 h-48 pointer-events-none">
                        <span className="absolute top-0 left-0 border-4 border-white border-opacity-80 rounded-sm w-10 h-10 animate-bracket-top-left"></span>
                        <span className="absolute top-0 right-0 border-4 border-white border-opacity-80 rounded-sm w-10 h-10 animate-bracket-top-right"></span>
                        <span className="absolute bottom-0 left-0 border-4 border-white border-opacity-80 rounded-sm w-10 h-10 animate-bracket-bottom-left"></span>
                        <span className="absolute bottom-0 right-0 border-4 border-white border-opacity-80 rounded-sm w-10 h-10 animate-bracket-bottom-right"></span>
                      </div>
                      <style>{`
                        @keyframes bracket-pulse {
                          0%, 100% {
                            opacity: 0.8;
                            transform: scale(1);
                          }
                          50% {
                            opacity: 0.4;
                            transform: scale(1.1);
                          }
                        }
                        .animate-bracket-top-left {
                          animation: bracket-pulse 1.5s ease-in-out infinite;
                          border-right: none;
                          border-bottom: none;
                        }
                        .animate-bracket-top-right {
                          animation: bracket-pulse 1.5s ease-in-out infinite;
                          border-left: none;
                          border-bottom: none;
                        }
                        .animate-bracket-bottom-left {
                          animation: bracket-pulse 1.5s ease-in-out infinite;
                          border-top: none;
                          border-right: none;
                        }
                        .animate-bracket-bottom-right {
                          animation: bracket-pulse 1.5s ease-in-out infinite;
                          border-top: none;
                          border-left: none;
                        }
                        @keyframes pulse-line {
                          0%, 100% {
                            stroke-opacity: 0.15;
                          }
                          50% {
                            stroke-opacity: 0.35;
                          }
                        }
                        @keyframes hex-opacity {
                          0% {
                            stroke-opacity: 0.3;
                          }
                          50% {
                            stroke-opacity: 0.6;
                          }
                          100% {
                            stroke-opacity: 0.3;
                          }
                        }
                        @keyframes rotate-ring {
                          0% { transform: rotate(0deg); }
                          100% { transform: rotate(360deg); }
                        }
                      `}</style>
                      <div className="absolute top-3 right-3 px-2.5 py-1.5 rounded-full bg-black/50 text-white text-xs font-semibold backdrop-blur" style={{ boxShadow: "0 0 10px rgba(99,102,241,0.5)" }}>
                        {`${Math.min(100, Math.max(0, scanLine))}%`}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={captureAndUpload}
                  disabled={loading || scanning}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition disabled:opacity-50 font-semibold text-lg"
                >
                  {scanning ? "Scanning Face..." : loading ? "Processing..." : "Mark Attendance"}
                </button>
                {/* Status Message */}
                {message && (
                  <div className={`mt-4 p-3 rounded-lg font-medium text-center ${message.type === "success" ? "bg-green-100 text-green-800 border border-green-200" :
                    message.type === "error" ? "bg-red-100 text-red-800 border border-red-200" :
                      "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    }`}>
                    <div className="font-bold">{message.type.toUpperCase()}</div>
                    <div>{message.text}</div>
                    {/* Show time below status when confirmation exists */}
                    {confirmation && message.type === "success" && (
                      <div className="mt-2 text-sm font-normal">
                        Time: {confirmation.time}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Location Section - Full width on mobile, half on desktop */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Location Information</h2>
                <div className="mb-4">
                  <p className="text-gray-600 mb-2 font-medium">Current Location:</p>
                  <p className="text-gray-800 p-3 bg-gray-50 rounded-lg">
                    {locationAddress}
                  </p>
                </div>
                <div className="w-full h-64 rounded-lg shadow-md overflow-hidden">
                  <iframe
                    src={mapUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
