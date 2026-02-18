import React from 'react'
import AttendancePage from '@/components/facescan'
import { Footer } from '@/components/footer'

const facescan = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <AttendancePage />
      </main>
      <Footer />
    </div>
  )
}

export default facescan
