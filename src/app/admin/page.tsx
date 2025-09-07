'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AdminPage from "@/app/admin/admin-page";

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['coach']}>
            <AdminPage/>
        </ProtectedRoute>
    );

}
