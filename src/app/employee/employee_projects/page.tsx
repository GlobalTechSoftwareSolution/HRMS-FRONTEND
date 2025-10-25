import DashboardLayout from '@/components/DashboardLayout'
import React from 'react'
import ProjectPage from '@/components/projects'

const employee_projectpage = () => {
  return (
    <DashboardLayout role="employee">
      <ProjectPage />
    </DashboardLayout>
  )
}

export default employee_projectpage
