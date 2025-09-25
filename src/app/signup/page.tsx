"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface SignupFormData {
  role: string;
  email: string;
  password: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  terms?: string;
}

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    role: "ceo",
    email: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Password strength indicators
  const passwordStrength = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumbers: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    // Terms validation
    if (!acceptedTerms) {
      errors.terms = "You must accept the Terms & Conditions to proceed";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear validation errors when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear message when user makes changes
    if (message) {
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/signup/`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = "Signup failed. Please try again.";

        if (typeof data === "object" && data !== null) {
          if ("detail" in data) {
            errorMessage = (data as { detail: string }).detail;
          } else if ("email" in data && Array.isArray(data.email)) {
            errorMessage = data.email[0];
          } else if ("password" in data && Array.isArray(data.password)) {
            errorMessage = data.password[0];
          }
        }

        throw new Error(errorMessage);
      }

      setMessage({
        type: "success",
        text: "Account created successfully! Redirecting to login...",
      });

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const roleDescriptions = {
    ceo: "Company executive with full system access",
    manager: "Team management and reporting capabilities",
    hr: "Human resources management and employee data",
    employee: "Basic access to personal information and features",
    admin: "System administration and user management",
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden text-black">
        {/* Left Section - Branding (hidden on mobile, shown only on lg+) */}
        <div className="hidden lg:flex bg-gradient-to-br from-green-600 to-green-800 text-white p-8 lg:p-12 flex-col justify-center">
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                HR Management System
              </h1>
              <p className="text-lg lg:text-xl text-green-100 leading-relaxed">
                Streamline your human resources processes with our comprehensive
                management platform. Join thousands of companies optimizing their HR operations.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Automated employee management</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Real-time analytics and reporting</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Secure data handling</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Create Your Account
              </h2>
              <p className="text-gray-600">
                Choose your role and start managing HRMS efficiently
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="ceo">CEO</option>
            <option value="manager">Manager</option>
            <option value="hr">HR</option>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {roleDescriptions[formData.role as keyof typeof roleDescriptions]}
                </p>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    validationErrors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="your.email@company.com"
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors pr-12 ${
                      validationErrors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm text-black">
                      <div
                        className={`flex items-center ${
                          passwordStrength.minLength ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        8+ characters
                      </div>
                      <div
                        className={`flex items-center ${
                          passwordStrength.hasUpperCase ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Uppercase letter
                      </div>
                      <div
                        className={`flex items-center ${
                          passwordStrength.hasLowerCase ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Lowercase letter
                      </div>
                      <div
                        className={`flex items-center ${
                          passwordStrength.hasNumbers ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Number
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (validationErrors.terms) {
                        setValidationErrors((prev) => ({ ...prev, terms: undefined }));
                      }
                    }}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  />
                  <span>
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-green-600 hover:text-green-700 font-medium underline"
                    >
                      Terms & Policy
                    </Link>
                  </span>
                </label>
                {validationErrors.terms && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationErrors.terms}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              {/* Message Display */}
              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <div className="flex items-center">
                    {message.type === "success" ? (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2" />
                    )}
                    {message.text}
                  </div>
                </div>
              )}

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-green-600 hover:text-green-700 font-semibold transition-colors hover:underline"
                  >
                    log in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
