'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // SESSION INTEGRITY: Refresh session on mount to resolve Navigator LockManager warnings
    useEffect(() => {
        const supabase = createClient();
        const refreshAuth = async () => {
            // FIX: LockManager warnings requiring active session touch
            await supabase.auth.refreshSession();
            await supabase.auth.getSession();
        };
        refreshAuth();
    }, []);

    return (
        <div className="min-h-screen">
            <Sidebar />
            <div className="lg:ml-64">
                <TopBar />
                <main className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
                    {children}
                </main>
            </div>
            <MobileNav />
        </div>
    );
}
