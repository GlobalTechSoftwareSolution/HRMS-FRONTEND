import DashboardLayout from '@/components/DashboardLayout'
import Ticket from '@/components/ticket'
import React from 'react'

const hr_TicketsPage = () => {
  return (
    <DashboardLayout role="hr">
    <div>
      <Ticket />
    </div>
    </DashboardLayout>
  )
}

export default hr_TicketsPage
