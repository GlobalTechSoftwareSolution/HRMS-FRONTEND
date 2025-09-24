"use client"
import React, { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

interface User {
  email: string
  role: string
  is_staff: boolean
  is_superuser: boolean
  is_active: boolean
  last_login?: string | null
}

const Approvalpage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apiBase = process.env.NEXT_PUBLIC_API_URL

  // 🔹 Wrap fetchUsers with useCallback
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${apiBase}/api/accounts/users/`)
      if (!response.ok) throw new Error(`Server error: ${response.status} ${response.statusText}`)
      const data: User[] = await response.json()
      setUsers(data)
    } catch (err: unknown) {
      console.error('Fetch error:', err)
      setUsers([])
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  // Approve user
  const handleApprove = async (email: string) => {
    try {
      const response = await fetch(`${apiBase}/api/accounts/approve/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      fetchUsers()
    } catch (err: unknown) {
      console.error('Approve error:', err)
      alert(err instanceof Error ? err.message : "Unknown error")
    }
  }

  // Reject user
  const handleReject = async (email: string) => {
    try {
      const response = await fetch(`${apiBase}/api/accounts/reject/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      fetchUsers()
    } catch (err: unknown) {
      console.error('Reject error:', err)
      alert(err instanceof Error ? err.message : "Unknown error")
    }
  }

  // ✅ Use fetchUsers in useEffect
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const pendingUsers = users.filter(u => !u.is_staff)
  const approvedUsers = users.filter(u => u.is_staff)

  return (
    <DashboardLayout role='admin'>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 text-center underline">
          User Management
        </h1>

        {loading && <p className="text-gray-600 text-center">Loading users...</p>}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <button 
              onClick={fetchUsers}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && users.length === 0 && !error && (
          <p className="text-gray-600 text-center">No users found.</p>
        )}

        {/* Pending Approval */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-yellow-700">Pending Approval</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {pendingUsers.length === 0 && <p className="text-gray-500 col-span-full text-center">No users pending approval.</p>}
            {pendingUsers.map((user, index) => (
              <div key={`pending-${index}`} className="bg-white border border-gray-200 rounded-lg shadow-md p-4 md:p-6 flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Role:</span> {user.role}</p>
                <p><span className="font-medium">Staff:</span> {user.is_staff ? "Yes" : "No"}</p>
                <p><span className="font-medium">Superuser:</span> {user.is_superuser ? "Yes" : "No"}</p>
                <p><span className="font-medium">Active:</span> {user.is_active ? "Yes" : "No"}</p>

                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <button
                    onClick={() => handleApprove(user.email)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(user.email)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Approved Users */}
        <section className="mt-10 mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold mb-5 text-green-700">Approved Users</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {approvedUsers.length === 0 && <p className="text-gray-500 col-span-full text-center">No approved users.</p>}
            {approvedUsers.map((user, index) => (
              <div key={`approved-${index}`} className="bg-white border border-gray-200 rounded-lg shadow-md p-4 md:p-6 flex flex-col justify-between">
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Role:</span> {user.role}</p>
                <p><span className="font-medium">Staff:</span> {user.is_staff ? "Yes" : "No"}</p>
                <p><span className="font-medium">Superuser:</span> {user.is_superuser ? "Yes" : "No"}</p>
                <p><span className="font-medium">Active:</span> {user.is_active ? "Yes" : "No"}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}

export default Approvalpage
