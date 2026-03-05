'use client';

import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';

export default function HistoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            <Sidebar />
            <div className="lg:ml-64">
                <TopBar />
                <main className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">{children}</main>
            </div>
            <MobileNav />
        </div>
    );
}
