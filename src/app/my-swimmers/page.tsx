import ProtectedRoute from '@/components/ProtectedRoute';
import MySwimmersPage from './my-swimmers-page';

export default function MySwimmersPageWrapper() {
  return (
    <ProtectedRoute allowedRoles={['family']}>
      <MySwimmersPage />
    </ProtectedRoute>
  );
}
