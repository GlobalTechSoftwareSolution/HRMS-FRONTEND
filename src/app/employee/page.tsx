
import Dashboard from '@/app/employee/dashboard/page';

export default function EmployeePage() {
  return (
    <Dashboard role="employee">
        <div className="mb-6 text-black">
            <h1 className="text-2xl font-bold mb-4">Welcome Employee 👩‍💼</h1>
            <p className="text-gray-600">Here you can manage your tasks and profile.</p>
        </div>
      {/* Add widgets, charts, tables here */}
    </Dashboard>
  );
}