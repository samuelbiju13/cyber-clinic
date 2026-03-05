'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ScanLine from '@/components/ui/ScanLine';
import NeonButton from '@/components/ui/NeonButton';
import GlassCard from '@/components/ui/GlassCard';
import type { Profile, Vitals } from '@/types';
import { formatCheckupDate } from '@/lib/utils/dates';

interface PatientHistoryViewProps {
    patient: Profile;
    vitals: Vitals[];
}

export default function PatientHistoryView({ patient, vitals }: PatientHistoryViewProps) {
    const router = useRouter();

    // Group by Checkup ID
    const groupedVitals = vitals.reduce((acc, vital) => {
        const key = vital.checkup_id || 'self-reported';
        if (!acc[key]) acc[key] = [];
        acc[key].push(vital);
        return acc;
    }, {} as Record<string, Vitals[]>);

    // Sort groups by most recent vital in that group
    const sortedGroups = Object.entries(groupedVitals).sort(([, a], [, b]) => {
        const dateA = new Date(a[0].recorded_at).getTime();
        const dateB = new Date(b[0].recorded_at).getTime();
        return dateB - dateA;
    });

    return (
        <div className="space-y-8 relative min-h-screen pb-12">
            <ScanLine />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold neon-text mb-1">
                        {patient.full_name} <span className="text-sm font-mono text-[var(--text-dim)]">(ID: {patient.id.slice(0, 8)}...)</span>
                    </h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        Clinical History & Vitals Log
                    </p>
                </div>

                <NeonButton onClick={() => router.push('/dashboard')} variant="secondary">
                    ← Return to Registry
                </NeonButton>
            </motion.div>

            {/* Grouped Vitals Sections */}
            <div className="space-y-6">
                {sortedGroups.length > 0 ? (
                    sortedGroups.map(([groupId, groupVitals], index) => (
                        <motion.div
                            key={groupId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <GlassCard className="p-0 overflow-hidden">
                                <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--surface-dim)]">
                                    <h2 className="text-base font-semibold text-[var(--pulse-cyan)] flex items-center gap-2">
                                        {groupId === 'self-reported' ? (
                                            <>📱 Patient Self-Reported</>
                                        ) : (
                                            <>🩺 Clinical Session - {formatCheckupDate(groupVitals[0].recorded_at)}</>
                                        )}
                                    </h2>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-[var(--glass-surface)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                                            <tr>
                                                <th className="p-4">Time</th>
                                                <th className="p-4">Heart Rate</th>
                                                <th className="p-4">BP</th>
                                                <th className="p-4">SpO2</th>
                                                <th className="p-4">Temp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--glass-border)]">
                                            {groupVitals.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-[var(--glass-highlight)] transition-colors">
                                                    <td className="p-4 text-[var(--text-dim)]">
                                                        {new Date(entry.recorded_at).toLocaleTimeString('en-IN', {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="p-4 font-mono text-[var(--text-primary)]">
                                                        <span className={`${entry.pulse_bpm > 100 || entry.pulse_bpm < 60 ? 'text-[var(--danger-red)]' : ''}`}>
                                                            {entry.pulse_bpm}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-mono text-[var(--text-primary)]">
                                                        {entry.bp_systolic}/{entry.bp_diastolic}
                                                    </td>
                                                    <td className="p-4 font-mono text-[var(--text-primary)]">
                                                        <span className={`${entry.spo2 < 95 ? 'text-[var(--danger-red)]' : 'text-[var(--bio-emerald)]'}`}>
                                                            {entry.spo2}%
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-mono text-[var(--text-primary)]">
                                                        {entry.temperature_f || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))
                ) : (
                    <div className="p-8 text-center text-[var(--text-muted)] border border-dashed border-[var(--glass-border)] rounded-lg">
                        No records found for this patient.
                    </div>
                )}
            </div>
        </div>
    );
}
