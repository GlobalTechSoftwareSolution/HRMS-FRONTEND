import DashboardLayout from '@/components/DashboardLayout'
import React from 'react'
import ProjectPage from '@/components/projects'

const admin_projectpage = () => {
  return (
    <DashboardLayout role="admin">
      <ProjectPage role="admin" />
    </DashboardLayout>
  )
}

export default admin_projectpage