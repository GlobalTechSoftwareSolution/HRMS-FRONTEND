import DashboardLayout from '@/components/DashboardLayout'
import Ticket from '@/components/ticket'
import React from 'react'

const manager_TicketsPage = () => {
  return (
    <DashboardLayout role="manager">
    <div>
      <Ticket />
    </div>
    </DashboardLayout>
  )
}

export default manager_TicketsPage
