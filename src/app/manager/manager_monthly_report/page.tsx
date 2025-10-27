import React from 'react'
import MonthlyReportDashboard from '../../../components/monthlyreport'
import DashboardLayout from '@/components/DashboardLayout'

const ceo_monthly_report = () => {
  return (
    <div>
      <DashboardLayout role="manager" >
      <MonthlyReportDashboard />
        </DashboardLayout>
    </div>
  )
}

export default ceo_monthly_report
