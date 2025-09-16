import ProtectedRoute from '@/components/ProtectedRoute';
import RelaysPage from './relays-page';

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['coach','admin']}>
      <RelaysPage />
    </ProtectedRoute>
  );
}
