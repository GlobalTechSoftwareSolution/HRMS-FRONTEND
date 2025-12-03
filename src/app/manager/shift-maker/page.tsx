"use client";
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ShiftMaker from "@/components/shift_maker.page";

const ManagerShiftMakerPage = () => {
  return (
    <DashboardLayout role="manager">
      <ShiftMaker />
    </DashboardLayout>
  );
};

export default ManagerShiftMakerPage;