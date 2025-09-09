
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminPage() {
  return (
    <DashboardLayout role="admin">
        <div className="mb-6 text-black">
            <h1 className="text-2xl font-bold mb-4">Welcome Admin 🚀</h1>
            <p className="text-gray-600">Here you can manage your company efficiently.</p>
        </div>
      {/* Add widgets, charts, tables here */}
    </DashboardLayout>
  );
}