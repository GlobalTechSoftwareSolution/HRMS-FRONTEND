"use client"
import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

interface User {
  email: string
  role?: string
  is_staff: boolean
}

const Approvalpage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching users via local proxy API...')
      const response = await fetch('/api/proxy-users', { method: 'GET' })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      const data: User[] = await response.json()
      console.log('Received data:', data)
      setUsers(data)
    } catch (err: unknown) {
      console.error('Fetch error:', err)
      if (err instanceof Error) {
        setError('Failed to load users: ' + err.message)
      } else {
        setError('Failed to load users: Unknown error')
      }
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || ''

  const handleApprove = async (email: string) => {
    try {
      const response = await fetch(`${apiBase}/accounts/approve/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      console.log('Approved:', email)
      fetchUsers()
    } catch (err: unknown) {
      console.error('Approve error:', err)
      if (err instanceof Error) {
        alert('Failed to approve user: ' + err.message)
      } else {
        alert('Failed to approve user: Unknown error')
      }
    }
  }

  const handleReject = async (email: string) => {
    try {
      const response = await fetch(`${apiBase}/accounts/reject/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      console.log('Rejected:', email)
      fetchUsers()
    } catch (err: unknown) {
      console.error('Reject error:', err)
      if (err instanceof Error) {
        alert('Failed to reject user: ' + err.message)
      } else {
        alert('Failed to reject user: Unknown error')
      }
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <DashboardLayout role='admin'>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 text-center md:text-center underline">User Management</h1>

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

        {!loading && users.length === 0 && !error && <p className="text-gray-600 text-center">No users found.</p>}

        {/* Pending Approval Section */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-yellow-700">Pending Approval</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {users.filter((user) => !user.is_staff).length === 0 && (
              <p className="text-gray-500 col-span-full text-center">No users pending approval.</p>
            )}
            {users.filter((user) => !user.is_staff).map((user, index) => (
              <div
                key={`pending-${index}`}
                className="bg-white border border-gray-200 rounded-lg shadow-md p-4 md:p-6 flex flex-col justify-between hover:shadow-xl transition-shadow duration-300"
              >
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-1 md:mb-2 truncate">{user.email}</h3>
                <p className="text-gray-600 mb-1"><span className="font-medium">Role:</span> {user.role || 'N/A'}</p>
                <p className="text-gray-600 mb-4"><span className="font-medium">Staff:</span> No</p>
                <div className="flex flex-col sm:flex-row gap-2 mt-auto">
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

        {/* Approved Users Section */}
        <section className="mb-10 mt-10">
          <h2 className="text-2xl md:text-3xl font-semibold mb-5 text-green-700">Approved Users</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {users.filter((user) => user.is_staff).length === 0 && (
              <p className="text-gray-500 col-span-full text-center">No approved users.</p>
            )}
            {users.filter((user) => user.is_staff).map((user, index) => (
              <div
                key={`approved-${index}`}
                className="bg-white border border-gray-200 rounded-lg shadow-md p-4 md:p-6 flex flex-col justify-between"
              >
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-1 md:mb-2 truncate">{user.email}</h3>
                <p className="text-gray-600 mb-1"><span className="font-medium">Role:</span> {user.role || 'N/A'}</p>
                <p className="text-gray-600"><span className="font-medium">Staff:</span> Yes</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}

export default Approvalpage
