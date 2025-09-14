'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import SwimmersPage from "@/app/admin/swimmers/swimmers-page";

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['coach', 'admin']}>
            <SwimmersPage/>
        </ProtectedRoute>
    );

}
