"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [role, setRole] = useState("ceo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const endpoint = `${process.env.NEXT_PUBLIC_API_BASE}/accounts/signup/`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email, password }),
      });

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        throw new Error("Response was not JSON");
      }

      if (!res.ok) {
        console.error("Signup failed:", data);
        // if backend sends { detail: "..." }
        if (typeof data === "object" && data !== null && "detail" in data) {
          throw new Error((data as { detail: string }).detail);
        }
        throw new Error(JSON.stringify(data));
      }

      setMessage("Signup successful! You can now log in.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
    }
  }

  return (
    <main className="flex min-h-screen text-black">
      {/* Left side - gradient background with heading and info */}
      <div className="flex flex-col justify-center items-center w-1/2 bg-gradient-to-b from-green-700 to-green-400 text-white p-12">
        <h1 className="text-5xl font-extrabold mb-6">Welcome to HRMS</h1>
        <p className="text-lg max-w-md text-center">
          Join our team and manage your company&apos;s human resources
          efficiently. Create your account to get started with HRMS today!
        </p>
      </div>

      {/* Right side - form card */}
      <div className="flex flex-col justify-center items-center w-1/2 bg-green-50 p-12">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 flex flex-col gap-6"
        >
          <h2 className="text-3xl font-bold text-green-700 text-center mb-4">
            Create an Account
          </h2>

          <select
            className="border border-green-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="ceo">CEO</option>
            <option value="manager">Manager</option>
            <option value="hr">HR</option>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-green-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className="border border-green-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            type="submit"
            className="py-3 rounded-md transition-colors font-semibold bg-green-600 text-white hover:bg-green-700"
          >
            Signup
          </button>

          {message && (
            <p
              className={`text-center mt-2 font-medium ${
                message.includes("Ensure") ? "text-red-600" : "text-green-700"
              }`}
            >
              {message}
            </p>
          )}

          <p className="text-center text-green-600 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
