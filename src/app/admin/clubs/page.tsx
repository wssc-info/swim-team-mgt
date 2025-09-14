'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import ClubsPage from "@/app/admin/clubs/admin-clubs-page";

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <ClubsPage/>
    </ProtectedRoute>
  );

}
