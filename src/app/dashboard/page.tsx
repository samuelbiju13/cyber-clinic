'use client';

import { useAuth } from '@/hooks/useAuth';
import PatientDashboard from '@/components/dashboard/PatientDashboard';
import DoctorDashboard from '@/components/dashboard/DoctorDashboard';

export default function NeuralDashboard() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-[var(--pulse-cyan)] border-t-transparent animate-spin" />
                    <p className="text-[var(--text-muted)] animate-pulse">
                        Authenticating Neural Link...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Auth hook handles redirect, or show access denied
    }

    return user.role === 'doctor' ? (
        <DoctorDashboard user={user} />
    ) : (
        <PatientDashboard user={user} />
    );
}
