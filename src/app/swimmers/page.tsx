'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import SwimmersPage from "@/app/swimmers/swimmers-page";

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['coach']}>
            <SwimmersPage/>
        </ProtectedRoute>
    );

}
