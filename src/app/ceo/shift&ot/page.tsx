// app/hr/calendar/page.tsx
import DashboardLayout from '@/components/DashboardLayout';
import ShiftmakerComponent from '@/components/Shift_maker';

export default function CalendarPage() {
  return (
    <DashboardLayout role='ceo'>
      <div>
      <ShiftmakerComponent/>
    </div>
    </DashboardLayout>
  );
}
