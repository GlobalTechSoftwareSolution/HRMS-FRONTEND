
import DashboardLayout from "@/components/DashboardLayout";

export default function HRPage() {
  return (
    <DashboardLayout role="hr">
        <div className="mb-6 text-black">
            <h1 className="text-2xl font-bold mb-4">Welcome HR 🧑‍💻</h1>
            <p className="text-gray-600">Here you can manage employee records and HR tasks.</p>
        </div>
      {/* Add widgets, charts, tables here */}
    </DashboardLayout>
  );
}