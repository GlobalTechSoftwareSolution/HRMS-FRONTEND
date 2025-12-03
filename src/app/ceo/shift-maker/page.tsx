"use client";
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ShiftMaker from "@/components/shift_maker.page";

const CeoShiftMakerPage = () => {
  return (
    <DashboardLayout role="ceo">
      <ShiftMaker />
    </DashboardLayout>
  );
};

export default CeoShiftMakerPage;