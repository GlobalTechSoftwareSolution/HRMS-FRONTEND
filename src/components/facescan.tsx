"use client";

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ApiResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  timestamp?: string;
  error?: string;
}

const FaceScanPage = () => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [error, setError] = useState<string>('');

  // Video constraints for better quality
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
    frameRate: 30
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setApiResponse(null);
      setError('');
    }
  }, []);

  const retake = () => {
    setCapturedImage(null);
    setApiResponse(null);
    setError('');
  };

  const upload = async () => {
    if (!capturedImage) return;

    setIsLoading(true);
    setError('');
    setApiResponse(null);

    try {
      // Convert base64 to Blob with better error handling
      const base64Response = await fetch(capturedImage);
      if (!base64Response.ok) throw new Error('Failed to process image');
      
      const blob = await base64Response.blob();
      
      // Validate image size
      if (blob.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image size too large. Please capture a smaller image.');
      }

      const file = new File([blob], "attendance.jpg", { 
        type: "image/jpeg",
        lastModified: Date.now()
      });

      const formData = new FormData();
      formData.append("image", file);
      formData.append("timestamp", new Date().toISOString());
      formData.append("device_info", navigator.userAgent);

      const response = await fetch(
        "https://globaltechsoftwaresolutions.cloud/api/accounts/mark_attendance/",
        {
          method: "POST",
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setApiResponse(data);

      // Auto-retake after successful upload if needed
      if (data.success) {
        setTimeout(() => {
          retake();
        }, 3000);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCamera = () => {
    setCameraEnabled(!cameraEnabled);
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Face Recognition Attendance
        </h1>
        <p className="text-gray-600">
          Capture your face to mark your attendance
        </p>
      </div>

      {/* Camera Section */}
      <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg mb-6">
        {cameraEnabled ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-auto max-h-96 object-cover"
            mirrored
            onUserMediaError={() => {
              setError('Camera access denied or not available');
              setCameraEnabled(false);
            }}
          />
        ) : (
          <div className="w-full h-96 bg-gray-800 flex items-center justify-center">
            <Camera className="w-16 h-16 text-gray-500" />
          </div>
        )}
        
        {/* Camera overlay */}
        <div className="absolute inset-0 border-2 border-white border-opacity-20 rounded-2xl pointer-events-none"></div>
      </div>

      {/* Camera Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={toggleCamera}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Camera className="w-4 h-4" />
          {cameraEnabled ? 'Disable Camera' : 'Enable Camera'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={capture}
          disabled={!cameraEnabled || isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg shadow hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          <Camera className="w-5 h-5" />
          Capture Photo
        </button>
        
        <button
          onClick={upload}
          disabled={!capturedImage || isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg shadow hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          {isLoading ? 'Processing...' : 'Mark Attendance'}
        </button>
      </div>

      {/* Retake Button */}
      {capturedImage && !isLoading && (
        <div className="flex justify-center mb-6">
          <button
            onClick={retake}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Retake Photo
          </button>
        </div>
      )}

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Captured Image</h3>
          <div className="relative bg-gray-100 rounded-lg p-4">
            <img
              src={capturedImage}
              alt="Captured for attendance"
              className="rounded-lg shadow-md max-w-full mx-auto max-h-64 object-cover"
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-3 p-6 bg-blue-50 rounded-lg mb-6">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-blue-700 font-medium">Processing your attendance...</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800">Error</h4>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* API Response Display */}
      {apiResponse && (
        <div className={`p-6 rounded-lg border-2 ${
          apiResponse.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {apiResponse.success ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <h3 className={`text-lg font-semibold ${
              apiResponse.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {apiResponse.success ? 'Attendance Marked Successfully!' : 'Attendance Failed'}
            </h3>
          </div>

          <div className="space-y-2 text-sm">
            {apiResponse.user && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{apiResponse.user.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{apiResponse.user.email}</span>
                </div>
              </>
            )}
            
            {apiResponse.timestamp && (
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{formatTimestamp(apiResponse.timestamp)}</span>
              </div>
            )}
            
            {apiResponse.message && (
              <div className="mt-3 p-3 bg-white rounded border">
                <span className="text-gray-700">{apiResponse.message}</span>
              </div>
            )}
            
            {apiResponse.error && (
              <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                <span className="text-red-700">{apiResponse.error}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          <p>Ensure good lighting and face the camera directly for best results</p>
          <p className="mt-1">Your image is processed securely and not stored</p>
        </div>
      </div>
    </div>
  );
};

export default FaceScanPage;