'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import StatsGrid from '@/components/dashboard/StatsGrid';
import ScanLine from '@/components/ui/ScanLine';
import NeonButton from '@/components/ui/NeonButton';
import GlassCard from '@/components/ui/GlassCard';
import Link from 'next/link';
import type { Profile } from '@/types';

interface DoctorDashboardProps {
    user: Profile;
}

export default function DoctorDashboard({ user }: DoctorDashboardProps) {
    const [stats, setStats] = useState({
        totalPatients: 0,
        pendingReports: 0,
        auditStatus: 'Online',
        auditColor: 'var(--bio-emerald)',
    });
    const [patients, setPatients] = useState<Profile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchDoctorData() {
            setLoading(true);
            try {
                // SESSION GUARD
                await supabase.auth.refreshSession();

                // 1. Stats: Total Patients
                const { count: patientCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'patient');

                // 2. Stats: Pending Checkups
                const { count: pendingCount } = await supabase
                    .from('checkups')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'scheduled');

                // 3. Stats: Audit Logs (Security Check)
                const { data: auditLogs } = await supabase
                    .from('audit_logs')
                    .select('action')
                    .order('event_timestamp', { ascending: false })
                    .limit(50); // Check recent 50 logs for anomalies

                const hasHighSeverity = auditLogs?.some(log => log.action === 'DELETE');
                const auditStatus = hasHighSeverity ? 'Action Required' : 'Online';
                const auditColor = hasHighSeverity ? 'var(--danger-red)' : 'var(--bio-emerald)';

                // 4. Patient Registry
                const { data: patientList } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'patient')
                    .order('created_at', { ascending: false })
                    .limit(50); // Fetch more to allow effective client-side search

                setStats({
                    totalPatients: patientCount || 0,
                    pendingReports: pendingCount || 0,
                    auditStatus,
                    auditColor,
                });
                setPatients(patientList || []);
            } catch (error) {
                console.error('Doctor dashboard sync failed:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchDoctorData();
    }, [supabase]);

    // Client-side Search Logic
    const filteredPatients = patients.filter(p =>
        p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const dashboardStats = [
        {
            label: 'Total Patients',
            value: stats.totalPatients,
            icon: '👥',
            trend: 'up' as const,
        },
        {
            label: 'Pending Lab Results',
            value: stats.pendingReports,
            icon: '🧪',
            trend: 'stable' as const,
            color: 'var(--pulse-cyan)',
        },
        {
            label: 'Critical Vitals (24h)',
            value: '0',
            icon: '⚠️',
            trend: 'stable' as const,
            color: 'var(--danger-red)',
        },
        {
            label: 'AI Auditor Status',
            value: stats.auditStatus,
            icon: '🤖',
            trend: 'up' as const,
            color: stats.auditColor,
        },
    ];

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-[var(--pulse-cyan)] border-t-transparent animate-spin" />
                    <p className="text-[var(--text-muted)] animate-pulse">
                        Accessing Medical Database...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            <ScanLine />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold neon-text mb-1">Medical Command</h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        Dr. {user.full_name} · {user.specialization || 'General Practice'}
                    </p>
                </div>

                <Link href="/dashboard/consultation">
                    <NeonButton variant="primary">
                        + New Consultation
                    </NeonButton>
                </Link>
            </motion.div>

            {/* Stats */}
            <StatsGrid stats={dashboardStats} />

            {/* Patient Registry */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <GlassCard className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-[var(--glass-border)] flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                            Patient Registry
                        </h2>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Search Patients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[var(--surface-dim)] border border-[var(--glass-border)] rounded-full px-4 py-2 pl-10 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--pulse-cyan)] transition-colors"
                            />
                            <span className="absolute left-3 top-2.5 text-[var(--text-muted)]">🔍</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--glass-surface)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="p-4">Patient Name</th>
                                    <th className="p-4">Contact</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--glass-border)]">
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-[var(--glass-highlight)] transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[var(--pulse-cyan-dim)] flex items-center justify-center text-[var(--pulse-cyan)] font-bold">
                                                        {patient.full_name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-[var(--text-primary)]">
                                                        {patient.full_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-[var(--text-dim)]">
                                                {patient.phone || 'N/A'}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <Link href={`/dashboard/patient/${patient.id}`}>
                                                        <NeonButton variant="secondary" size="sm">
                                                            View Records
                                                        </NeonButton>
                                                    </Link>
                                                    <Link href={`/dashboard/prescriptions/new?patientId=${patient.id}`}>
                                                        <NeonButton variant="secondary" size="sm">
                                                            Issue Rx
                                                        </NeonButton>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-[var(--text-muted)]">
                                            {searchQuery ? 'No matching patients found.' : 'No patients found in directory.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
