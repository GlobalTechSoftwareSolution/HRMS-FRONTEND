import React from 'react'
import Notice from "../../../components/notice"
import DashboardLayout from '@/components/DashboardLayout'

const ceo_notice = () => {
  return (
    <div>
      <DashboardLayout role='ceo'>

      <Notice />
      </DashboardLayout>
    </div>
  )
}


export default ceo_notice