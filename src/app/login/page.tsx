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
    const endpoint = `${process.env.NEXT_PUBLIC_API_BASE}/accounts/login/`;
    console.log("Login API:", endpoint);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role, email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        setMessage("Invalid response from server. Please try again.");
        setIsLoading(false);
        return;
      }

      if (response.ok) {
        if (data.user && data.user.role === role) {
          // Check if is_staff is true
          if (data.user.is_staff !== true) {
            setMessage("Your account is waiting for admin approval.");
            setIsLoading(false);
            return;
          }
          // ✅ Save token & user info
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          localStorage.setItem(
            "userInfo",
            JSON.stringify({
              name: data.user.email, // use email from Supabase
              email: data.user.email || "", // if email exists
              role: data.user.role,
              phone: data.user.phone || "", // optional
              department: data.user.department || "", // optional
              picture: data.user.picture || "" // optional
            })
          );

          setMessage("Login successful!");
          setTimeout(() => {
            if (role === "ceo") router.push("/ceo");
            else if (role === "manager") router.push("/manager");
            else if (role === "hr") router.push("/hr");
            else if (role === "employee") router.push("/employee");
            else if (role === "admin") router.push("/admin");
          }, 1000);
        } else {
          setMessage("Role mismatch or check your credentials.");
        }
      } else {
        setMessage(
          data.detail || "Login failed. Please check your credentials."
        );
      }
    } catch (error) {
      console.error(error);
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Side - Brand Section */}
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
            Streamline your HR processes with our comprehensive management platform. 
            Access your dashboard and manage your organization effortlessly.
          </p>
          
          <div className="mt-12 flex items-center justify-center space-x-4">
            <div className="w-3 h-3 bg-white rounded-full opacity-60"></div>
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div className="w-3 h-3 bg-white rounded-full opacity-60"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-col justify-center w-full md:w-1/2 p-6 md:p-10">
        <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {/* Message */}
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300 appearance-none"
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

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
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

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
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
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-gray-700">
                  Remember me
                </label>
              </div>
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Log in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/signup")}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ChevronDown icon component
const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default LoginPage;