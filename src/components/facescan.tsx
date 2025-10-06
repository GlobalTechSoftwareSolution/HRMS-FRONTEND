

/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useEffect } from "react";

type APIResponse = {
  status?: string;
  message?: string;
  username?: string;
  email?: string;
  check_in_status?: "Checked In" | "Checked Out" | null;
};

const FaceScanPage = () => {
  const [modalOpen, setModalOpen] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modalOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setApiResponse(null);
    }
    // Cleanup when component unmounts or modal closes
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error("Error accessing webcam: ", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/png");
    setCapturedImage(imageDataUrl);
    sendImageToAPI(imageDataUrl);
  };

  const sendImageToAPI = async (imageDataUrl: string) => {
    setLoading(true);
    setApiResponse(null);
    try {
      // Convert base64 image data to Blob
      const byteString = atob(imageDataUrl.split(",")[1]);
      const mimeString = imageDataUrl.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      // Prepare form data
      const formData = new FormData();
      formData.append("image", blob, "capture.png");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/mark_attendance/`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data: APIResponse = await response.json();
      setApiResponse(data);
    } catch {
      setApiResponse({ status: "error", message: "Failed to communicate with server." });
    }
    setLoading(false);
  };

  return (
    <>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 text-black">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto p-6 relative flex flex-col">
            <button
              onClick={handleCloseModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 transition text-3xl font-bold"
              aria-label="Close modal"
              title="Close"
            >
              &times;
            </button>

            <h2 className="text-2xl font-semibold mb-4 text-center">Face Scan Attendance</h2>

            <div className="w-full aspect-video rounded-lg overflow-hidden shadow-md mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            <button
              onClick={captureImage}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50 mb-6"
            >
              {loading ? "Scanning..." : "Capture & Scan"}
            </button>

            {capturedImage && (
              <div className="rounded-lg shadow-md bg-gray-50 p-4 mb-4">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full rounded-lg object-contain mb-4"
                />
                {apiResponse && (
                  <div
                    className={`p-3 rounded text-center font-semibold ${
                      apiResponse.status === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    } shadow`}
                  >
                    <p>Status: {apiResponse.status ?? "Unknown"}</p>
                    {apiResponse.message && <p className="mt-1">{apiResponse.message}</p>}
                    {apiResponse.username && <p className="mt-1">User: {apiResponse.username}</p>}
                    {apiResponse.email && <p className="mt-1">Email: {apiResponse.email}</p>}
                  </div>
                )}
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </>
  );
};

export default FaceScanPage;