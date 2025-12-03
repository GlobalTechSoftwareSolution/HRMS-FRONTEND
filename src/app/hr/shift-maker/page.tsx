"use client";
import React from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import ShiftMaker from "../../../components/shift_maker.page";

const HrShiftMakerPage = () => {
  return (
    <DashboardLayout role="hr">
      <ShiftMaker />
    </DashboardLayout>
  );
};

export default HrShiftMakerPage;