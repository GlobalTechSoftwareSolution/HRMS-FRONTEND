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
  const [mapUrl, setMapUrl] = useState<string>("https://www.google.com/maps?q=0,0&z=15&output=embed");
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [canvasVisible, setCanvasVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showMessage = (text: string, type: "success" | "error" | "warning") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (!mounted) return;

    const startCamera = async () => {
      try {
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
        showMessage("Geolocation not supported", "error");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setMapUrl(`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}&z=17&output=embed`);
        },
        () => showMessage("Unable to access location. Allow permission.", "error"),
        { enableHighAccuracy: true }
      );
    };

    startCamera();
    getLocation();

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const captureAndUpload = () => {
    if (!videoRef.current || !canvasRef.current) {
      showMessage("Start camera first!", "error");
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCanvasVisible(true);
    video.pause();

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await uploadImage(blob, "attendance.jpg", () => {
        setCanvasVisible(false);
        video.play();
      });
    }, "image/jpeg");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file) {
      showMessage("Please select a file first.", "error");
      return;
    }
    await uploadImage(file, file.name);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/mark_attendance/`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") showMessage(data.message, "success");
      else showMessage(data.message || "Failed", "error");
    } catch (err) {
      console.error(err);
      showMessage("Failed to mark attendance", "error");
    } finally {
      setLoading(false);
      if (callback) callback();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-blue-400 to-purple-700 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Face Recognition Attendance</h1>

        <div className="relative mb-4 w-full aspect-video">
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full rounded-lg shadow-md object-cover ${canvasVisible ? 'hidden' : 'block'}`} />
          <canvas ref={canvasRef} className={`absolute top-0 left-0 w-full h-full ${canvasVisible ? 'block' : 'hidden'}`} />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center mb-4">
          <button onClick={captureAndUpload} disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition disabled:opacity-50">
            {loading ? "Scanning..." : "Mark Attendance (Camera)"}
          </button>
        </div>

  
        <p className="text-gray-600 mb-2">
          {latitude && longitude ? `📍 Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}` : "Getting location..."}
        </p>
        <iframe src={mapUrl} className="w-full h-64 rounded-lg shadow-md" />

        {message && (
          <p className={`mt-4 p-2 rounded font-medium ${message.type === "success" ? "bg-green-100 text-green-800" : message.type === "error" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}