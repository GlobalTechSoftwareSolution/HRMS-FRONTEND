import React from 'react'
import Ticket from '@/components/ticket'
import DashboardLayout from '@/components/DashboardLayout'

const employees_TicketsPage = () => {
  return (
    <DashboardLayout role="employee">
      <Ticket />
    </DashboardLayout>
  )
}

export default employees_TicketsPage
