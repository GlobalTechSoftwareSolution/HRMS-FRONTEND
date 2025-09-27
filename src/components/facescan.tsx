import React, { useRef, useState, useEffect } from "react";

interface FaceScanProps {
  username: string;
  email: string;
  onRecognized: (data: { username: string; email: string | null }) => void;
  backendUrl?: string;
  show: boolean;
  onClose: () => void;
}

const FaceScan: React.FC<FaceScanProps> = ({
  username,
  email,
  onRecognized,
  backendUrl,
  show,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognizedData, setRecognizedData] = useState<{
    username: string;
    email: string | null;
  } | null>(null);

  useEffect(() => {
    if (!show) return;

    const startCamera = async () => {
      try {
        const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err: unknown) {
        console.error("Failed to access camera:", err);
        setError("Cannot access camera.");
      }
    };

    startCamera();

    // ✅ Fix ref warning by copying video element
    const videoEl = videoRef.current;

    return () => {
      if (videoEl && videoEl.srcObject) {
        (videoEl.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
      setRecognizedData(null);
      setError(null);
      setCapturing(false);
    };
  }, [show]);

  const captureAndSend = async () => {
    setCapturing(true);
    setError(null);
    setRecognizedData(null);
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to Blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg")
      );
      if (!blob) return;

      const formData = new FormData();
      formData.append("file", blob, "face.jpg");
      formData.append("username", username);
      formData.append("email", email);

      const response = await fetch(backendUrl || "/face/recognize_face/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Face recognition failed");
      }

      const data: { username: string; email: string | null } =
        await response.json();
      setRecognizedData({ username: data.username, email: data.email });
      onRecognized({ username: data.username, email: data.email });
    } catch (err: unknown) {
      // ✅ Fix: no more `any`
      if (err instanceof Error) {
        console.error(err);
        setError(err.message);
      } else {
        console.error("Unknown error:", err);
        setError("Unknown error occurred");
      }
    } finally {
      setCapturing(false);
    }
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "25px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 5px 25px rgba(0,0,0,0.4)",
          textAlign: "center",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "red",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            fontSize: "18px",
            cursor: "pointer",
            zIndex: 10000,
          }}
          aria-label="Close modal"
        >
          &times;
        </button>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: "100%", borderRadius: "6px", marginBottom: "15px" }}
        />

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <button
          onClick={captureAndSend}
          disabled={capturing}
          style={{
            marginTop: "10px",
            padding: "12px 25px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: capturing ? "not-allowed" : "pointer",
            backgroundColor: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: "6px",
            width: "100%",
          }}
        >
          {capturing ? "Scanning..." : "Scan Face"}
        </button>

        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        {recognizedData && (
          <div
            style={{
              marginTop: "15px",
              textAlign: "left",
              backgroundColor: "#f0f0f0",
              padding: "10px",
              borderRadius: "6px",
            }}
          >
            <h4>Recognition Result:</h4>
            <p>
              <strong>Username:</strong> {recognizedData.username}
            </p>
            <p>
              <strong>Email:</strong> {recognizedData.email || "N/A"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceScan;
