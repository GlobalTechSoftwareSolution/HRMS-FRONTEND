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


  // 🔹 Fetch real user data from API (as requested)
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/users/`
      console.log('Fetching from:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Remove Cache-Control header that might be causing CORS issues
        }
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('API Response:', responseData) // Debug log as requested

      // Extract users array from response
      const data = Array.isArray(responseData) ? responseData : (responseData?.users || responseData?.data || [])

      console.log('Extracted data:', data)

      if (!data || data.length === 0) {
        setError("No users found in API response.")
        setUsers([])
      } else {
        setUsers(data)
        setError(null)
      }

    } catch (err: unknown) {
      console.error('API Error:', err)
      setUsers([])

      // Provide detailed error information
      let errorMessage = 'Failed to load users'
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`
      }
      errorMessage += '. Check console for details.'

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Approve user (mock implementation)
  const handleApprove = async (email: string) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.email === email
            ? { ...user, is_staff: true }
            : user
        )
      )

      alert(`User ${email} has been approved successfully!`)
    } catch (err: unknown) {
      console.error('Approve error:', err)
      alert('Failed to approve user. Please try again.')
    }
  }

  // Reject user (mock implementation)
  const handleReject = async (email: string) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      // Remove user from the list (simulate rejection)
      setUsers(prevUsers => prevUsers.filter(user => user.email !== email))

      alert(`User ${email} has been rejected and removed.`)
    } catch (err: unknown) {
      console.error('Reject error:', err)
      alert('Failed to reject user. Please try again.')
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
                <p className="break-all overflow-hidden text-ellipsis"><span className="font-medium">Email:</span> {user.email}</p>
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
                <p className="break-all overflow-hidden text-ellipsis"><span className="font-medium">Email:</span> {user.email}</p>
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
