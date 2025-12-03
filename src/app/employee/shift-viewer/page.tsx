"use client";
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ShiftViewer from "@/components/shift_viewer.page";

const EmployeeShiftViewerPage = () => {
  return (
    <DashboardLayout role="employee">
      <ShiftViewer />
    </DashboardLayout>
  );
};

export default EmployeeShiftViewerPage;