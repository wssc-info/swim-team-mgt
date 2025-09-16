'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import TimesPage from "@/app/times/times-page";

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['coach', 'admin']}>
            <TimesPage/>
        </ProtectedRoute>
    );

}
