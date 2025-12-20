// app/hr/calendar/page.tsx
import DashboardLayout from '@/components/DashboardLayout';
import ShiftMakerComponent from '@/components/Shift_maker';

export default function CalendarPage() {
  return (
    <DashboardLayout role='admin'>
      <div>
        <ShiftMakerComponent />
    </div>
    </DashboardLayout>
  );
}
