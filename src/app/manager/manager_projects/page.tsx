import DashboardLayout from '@/components/DashboardLayout'
import React from 'react'
import ProjectPage from '@/components/projects'

const manager_projectpage = () => {
  return (
    <DashboardLayout role="manager">
      <ProjectPage role="manager" />
    </DashboardLayout>
  )
}

export default manager_projectpage