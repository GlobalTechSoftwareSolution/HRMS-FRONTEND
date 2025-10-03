// app/hr/calendar/page.tsx
import GoogleCalendar from '@/components/GoogleCalendar'
import DashboardLayout from '@/components/DashboardLayout';

export default function CalendarPage() {
  return (
    <DashboardLayout role='admin'>
      <div>
      <GoogleCalendar />
    </div>
    </DashboardLayout>
  );
}
