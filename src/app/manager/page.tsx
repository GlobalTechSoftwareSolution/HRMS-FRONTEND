
import DashboardLayout from "@/components/DashboardLayout";

export default function ManagerPage() {
  return (
    <DashboardLayout role="manager">
        <div className="mb-6 text-black">
            <h1 className="text-2xl font-bold mb-4">Welcome Manager 📊</h1>
            <p className="text-gray-600">Here you can manage your team and projects effectively.</p>
        </div>
      {/* Add widgets, charts, tables here */}
    </DashboardLayout>
  );
}