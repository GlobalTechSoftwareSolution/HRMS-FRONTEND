import React from 'react'
import Notice from "../../../components/notice"
import DashboardLayout from '@/components/DashboardLayout'

const manager_notice = () => {
  return (
    <div>
      <DashboardLayout role='manager'>

      <Notice />
      </DashboardLayout>
    </div>
  )
}


export default manager_notice