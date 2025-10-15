import React from 'react'
import Notice from "../../../components/notice"
import DashboardLayout from '@/components/DashboardLayout'

const admin_notice = () => {
  return (
    <div>
      <DashboardLayout role='admin'>

      <Notice />
      </DashboardLayout>
    </div>
  )
}


export default admin_notice