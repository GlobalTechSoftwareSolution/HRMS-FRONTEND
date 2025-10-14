import React from 'react'
import Ticket from '@/components/ticket'
import DashboardLayout from '@/components/DashboardLayout'

const admin_TicketsPage = () => {
  return (
    <DashboardLayout role="admin">
      <Ticket />
    </DashboardLayout>
  )
}

export default admin_TicketsPage
