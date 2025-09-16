'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import ExportPage from "@/app/export/export-page";

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['coach', 'admin']}>
      <ExportPage/>
    </ProtectedRoute>
  );

}
