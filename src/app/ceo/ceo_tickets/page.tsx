import React from 'react'
import Ticket from '@/components/ticket'
import DashboardLayout from '@/components/DashboardLayout'

const ceo_TicketsPage = () => {
  return (
    <DashboardLayout role="ceo">
    <div>
      <Ticket />
    </div>
    </DashboardLayout>
  )
}

export default ceo_TicketsPage
