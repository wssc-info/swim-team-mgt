'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import MeetsPage from "@/app/meets/meets-page";

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['coach']}>
            <MeetsPage/>
        </ProtectedRoute>
    );

}
