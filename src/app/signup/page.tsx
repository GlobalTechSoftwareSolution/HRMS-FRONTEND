"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, AlertCircle, Building, User, Mail, Lock } from "lucide-react";

export default function SignupPage() {
  const [role, setRole] = useState("ceo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    return strength;
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setMessage("");

    const endpoint = `${process.env.NEXT_PUBLIC_API_BASE}/accounts/signup/`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error("Response was not JSON");
      }

      if (!res.ok) {
        console.error("Signup failed:", data);
        throw new Error(data.detail || JSON.stringify(data));
      }

      setMessage("Signup successful! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 80) return "Medium";
    return "Strong";
  };

  return (
    <main className="flex min-h-screen text-gray-800 bg-gray-50">
      {/* Left side - gradient background with illustration */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-green-700 to-green-500 text-white p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="20" cy="20" r="15" fill="white" />
            <circle cx="80" cy="30" r="10" fill="white" />
            <circle cx="40" cy="80" r="12" fill="white" />
            <circle cx="70" cy="70" r="8" fill="white" />
          </svg>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="bg-white/20 p-6 rounded-2xl shadow-lg">
              <Building className="h-16 w-16" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-6">HR Management System</h1>
          <p className="text-lg max-w-md text-center opacity-90">
            Streamline your HR processes with our comprehensive management platform. 
            Join thousands of companies managing their workforce efficiently.
          </p>
          
          <div className="mt-12 grid grid-cols-3 gap-6 opacity-90">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">Easy Onboarding</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">Employee Management</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">Analytics & Reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-green-700 mb-2">Create Account</h1>
            <p className="text-gray-600">Sign up to get started with HRMS</p>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8 flex flex-col gap-6">
            {/* Role Selection */}
           <div className="w-full max-w-lg mx-auto">
  <label className="block text-sm font-medium text-gray-700 mb-4">
    I am a
  </label>
  <div className="flex flex-wrap gap-4">
    {[
      { value: "ceo", label: "CEO" },
      { value: "manager", label: "Manager" },
      { value: "hr", label: "HR" },
      { value: "employee", label: "Employee" },
      { value: "admin", label: "Admin" },
    ].map((option) => (
      <div
        key={option.value}
        onClick={() => setRole(option.value)}
        className={`
          flex items-center cursor-pointer transition-all duration-300
          border rounded-2xl p-4 min-w-[120px] justify-center gap-2
          ${role === option.value
            ? "bg-gradient-to-r from-blue-100 to-blue-200 border-blue-400 shadow-lg scale-105"
            : "bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50"}
        `}
      >
        <User className={`h-5 w-5 ${role === option.value ? "text-blue-600" : "text-gray-400"}`} />
        <span className={`font-medium text-sm ${role === option.value ? "text-blue-700" : "text-gray-700"}`}>
          {option.label}
        </span>
      </div>
    ))}
  </div>
</div>


            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 w-full border ${errors.email ? "border-red-500" : "border-gray-300"} p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> {errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`pl-10 pr-10 w-full border ${errors.password ? "border-red-500" : "border-gray-300"} p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              
              {/* Password Strength Meter */}
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Password strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength < 40 ? "text-red-500" : 
                      passwordStrength < 80 ? "text-yellow-500" : "text-green-500"
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${getPasswordStrengthColor()}`} 
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {errors.password && <p className="mt-1 text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> {errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 w-full border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> {errors.confirmPassword}</p>}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the <Link href="/terms" className="text-green-600 hover:underline">Terms of Service</Link> 
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="py-3 rounded-lg transition-colors font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : "Create Account"}
            </button>

            {/* Message Display */}
            {message && (
              <div className={`rounded-lg p-3 ${message.includes("successful") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} flex items-center`}>
                {message.includes("successful") ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                {message}
              </div>
            )}

            <div className="text-center text-gray-600 pt-4 border-t border-gray-200">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-green-600 hover:underline">
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}