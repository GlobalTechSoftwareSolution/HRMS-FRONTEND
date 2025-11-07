"use client";
import DashboardLayout from "@/components/DashboardLayout";
import PettyCashComponent from "@/components/PettyCashComponent";

export default function AdminPettyCashPage() {
  return (
    <DashboardLayout role="admin">
      <PettyCashComponent />
    </DashboardLayout>
  );
}
