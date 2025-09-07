'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import {EventsPage} from "@/app/events/events-page";

export default function Page() {
  return (
      <ProtectedRoute allowedRoles={['coach', 'family']}>
        <EventsPage/>
      </ProtectedRoute>
  );

}
