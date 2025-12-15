import KPAPage from '@/components/kpa'
import React from 'react'
import KRA from '@/components/kra'
import DashboardLayout from '@/components/DashboardLayout'

const Kraandkpapage = () => {
  return (
    <DashboardLayout role="employee">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <KRA />
        </div>
        <div className="mt-8">
          <KPAPage />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Kraandkpapage