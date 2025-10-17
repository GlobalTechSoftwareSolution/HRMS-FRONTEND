import KPAPage from '@/components/kpa'
import React from 'react'
import KRA from '@/components/kra'
import DashboardLayout from '@/components/DashboardLayout'

const Kraandkpapage = () => {
  return (
    <div>
      <DashboardLayout role="employee">
      <KRA />
      <KPAPage />
      </DashboardLayout>
    </div>
  )
}

export default Kraandkpapage

