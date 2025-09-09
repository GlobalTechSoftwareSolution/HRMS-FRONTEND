"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const endpoint = 'http://127.0.0.1:8000/api/accounts/login/';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.user && data.user.role === role) {
          setMessage('Login successful!');
          setTimeout(() => {
            if (role === 'ceo') router.push('/ceo');
            else if (role === 'manager') router.push('/manager');
            else if (role === 'hr') router.push('/hr');
            else if (role === 'employee') router.push('/employee');
          }, 1000);
        } else {
          setMessage(`Role mismatch or check your credentials.`);
        }
      } else {
        setMessage(data.detail || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side with gradient and welcome text */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-400 via-blue-600 to-blue-700 text-white flex-col justify-center items-center p-16">
        <h1 className="text-5xl font-extrabold mb-6 select-none">
          Welcome Back!
        </h1>
        <p className="text-lg max-w-md leading-relaxed opacity-90">
          Access your dashboard and manage your tasks effortlessly.
        </p>
      </div>

      {/* Right Side with card */}
      <div className="flex flex-col justify-center w-full md:w-1/2 p-10 bg-gray-50">
        <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-2xl p-10">

          {/* Message */}
          {message && (
            <div
              className={`mb-6 text-center p-3 rounded-lg font-medium transition-colors duration-300 ${
                message.includes('successful')
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-700'
              }`}
              role="alert"
            >
              {message}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="role" className="block mb-2 font-semibold text-gray-700 text-md">
                Role
              </label>
              <select
                id="role"
                className="w-full p-3 border rounded-xl text-gray-900 text-md transition duration-300 focus:outline-none focus:ring-4 border-blue-300 focus:ring-blue-300 hover:shadow-md"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">Select role</option>
                <option value="ceo">CEO</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div>
              <label htmlFor="username" className="block mb-2 font-semibold text-gray-700 text-md">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="w-full p-3 border rounded-xl text-gray-900 text-md transition duration-300 focus:outline-none focus:ring-4 border-blue-300 focus:ring-blue-300 hover:shadow-md"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block mb-2 font-semibold text-gray-700 text-md">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full p-3 border rounded-xl text-gray-900 text-md transition duration-300 focus:outline-none focus:ring-4 border-blue-300 focus:ring-blue-300 hover:shadow-md"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-400 hover:shadow-xl focus:outline-none focus:ring-4 bg-blue-600 hover:bg-blue-700 focus:ring-blue-400"
            >
              Login
            </button>
          </form>
          <p
            className="mt-4 text-center text-blue-600 hover:underline cursor-pointer"
            onClick={() => router.push('/signup')}
          >
            Don't have an account? Sign up
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
