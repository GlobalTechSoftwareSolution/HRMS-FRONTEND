// app/hr/calendar/page.tsx
import HolidayCalendar from '@/components/google_calendar_maker';
import DashboardLayout from '@/components/DashboardLayout';

export default function CalendarPage() {
  return (
    <DashboardLayout role='manager'>
      <div>
      <HolidayCalendar />  
    </div>
    </DashboardLayout>
  );
}
