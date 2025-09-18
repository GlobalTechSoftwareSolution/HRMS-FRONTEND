"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Building, User, Lock, Mail } from "lucide-react";

const LoginPage = () => {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const endpoint = `${process.env.NEXT_PUBLIC_API_BASE}/accounts/signup/`;
    console.log("Login API:", endpoint);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email, password }),
      });

      let data: any;
      try {
        data = await response.json();
      } catch {
        setMessage("Invalid server response. Try again.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        setMessage(data.detail || "Login failed. Check credentials.");
        setIsLoading(false);
        return;
      }

      if (data.user && data.user.role === role) {
        if (!data.user.is_staff) {
          setMessage("Your account is waiting for admin approval.");
          setIsLoading(false);
          return;
        }

        // Store JWT token if backend provides it
        if (data.token) {
          localStorage.setItem("access_token", data.token);
          console.log("JWT Token stored:", data.token);
        } else {
          console.warn("No JWT token returned from backend");
        }

        localStorage.setItem("user_email", data.user.email);
        console.log("Logged-in user email:", data.user.email);

        localStorage.setItem(
          "userInfo",
          JSON.stringify({
            name: data.user.email,
            email: data.user.email,
            role: data.user.role,
            phone: data.user.phone || "",
            department: data.user.department || "",
            picture: data.user.picture || "",
          })
        );

        setMessage("Login successful!");
        setTimeout(() => {
          switch (role) {
            case "ceo":
              router.push("/ceo");
              break;
            case "manager":
              router.push("/manager");
              break;
            case "hr":
              router.push("/hr");
              break;
            case "employee":
              router.push("/employee");
              break;
            case "admin":
              router.push("/admin");
              break;
            default:
              router.push("/");
          }
        }, 1000);
      } else {
        setMessage("Role mismatch or check your credentials.");
      }
    } catch (error) {
      console.error("Network/login error:", error);
      setMessage("Network error. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Brand Section */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 text-white flex-col justify-center items-center p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full"></div>
          <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-blue-300 rounded-full"></div>
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Building className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">HR Management System</h1>
          <p className="text-lg opacity-90 leading-relaxed">
            Streamline your HR processes. Access your dashboard and manage your organization effortlessly.
          </p>
          <div className="mt-12 flex items-center justify-center space-x-4">
            <div className="w-3 h-3 bg-white rounded-full opacity-60"></div>
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div className="w-3 h-3 bg-white rounded-full opacity-60"></div>
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex flex-col justify-center w-full md:w-1/2 p-6 md:p-10">
        <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-xl text-center font-medium transition-colors duration-300 ${
                message.includes("successful")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
              role="alert"
            >
              {message}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role */}
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Select Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300 appearance-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="">Select your role</option>
                  <option value="ceo">CEO</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default LoginPage;