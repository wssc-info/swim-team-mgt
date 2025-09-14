import ProtectedRoute from '@/components/ProtectedRoute';
import AdminEventsPage from './admin-events-page';

export default function EventsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminEventsPage />
    </ProtectedRoute>
  );
}
