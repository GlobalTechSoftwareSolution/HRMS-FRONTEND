'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SelectRolePage() {
  const [role, setRole] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) {
      router.push(`/${role}`);
    }
  };

  const roles = [
    { value: 'ceo', label: 'CEO' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr', label: 'HR' },
    { value: 'employee', label: 'Employee' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-black">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full"
      >
        <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          Select Your Role
        </h1>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {roles.map(({ value, label }) => (
            <label
              key={value}
              className={`cursor-pointer rounded-lg border-2 p-4 flex items-center justify-center text-lg font-medium transition-colors duration-200 select-none
                ${
                  role === value
                    ? 'border-blue-600 bg-blue-100 text-blue-700'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
            >
              <input
                type="radio"
                name="role"
                value={value}
                className="hidden"
                checked={role === value}
                onChange={() => setRole(value)}
              />
              {label}
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={!role}
          className={`w-full py-3 rounded-md text-white font-semibold transition-colors duration-200 ${
            role
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-blue-300 cursor-not-allowed'
          }`}
        >
          Submit
        </button>
      </form>
    </div>
  );
}
