
import DashboardLayout from "@/components/DashboardLayout";

export default function CEOPage() {
  return (
    <DashboardLayout role="ceo">
        <div className="mb-6 text-black">
            <h1 className="text-2xl font-bold mb-4">Welcome CEO 👑</h1>
            <p className="text-gray-600">Here you can manage your company at a high level.</p>
        </div>
      {/* Add widgets, charts, tables here */}
    </DashboardLayout>
  );
}