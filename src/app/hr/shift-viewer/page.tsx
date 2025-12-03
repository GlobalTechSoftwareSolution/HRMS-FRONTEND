"use client";
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ShiftViewer from "@/components/shift_viewer.page";

const ShiftViewerPage = () => {
  return (
    <DashboardLayout role="hr">
      <ShiftViewer />
    </DashboardLayout>
  );
};

export default ShiftViewerPage;