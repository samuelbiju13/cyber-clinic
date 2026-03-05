'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import type { Vitals, Prescription } from '@/types';

interface DoctorHistoryViewProps {
    vitals: Vitals[];
    prescriptions: Prescription[];
}

type HistoryType = 'all' | 'vital' | 'prescription';
type SortOption = 'date' | 'patient';

export default function DoctorHistoryView({ vitals, prescriptions }: DoctorHistoryViewProps) {
    const [filterType, setFilterType] = useState<HistoryType>('all');
    const [sortBy, setSortBy] = useState<SortOption>('date');

    // Unite and Normalize Data
    const combinedData = [
        ...vitals.map(v => ({ ...v, type: 'vital' as const, date: v.recorded_at })),
        ...prescriptions.map(p => ({ ...p, type: 'prescription' as const, date: p.prescribed_date }))
    ];

    // Filter & Sort
    const processedData = combinedData
        .filter(item => filterType === 'all' || item.type === filterType)
        .sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            if (sortBy === 'patient') {
                const nameA = a.patient?.full_name || '';
                const nameB = b.patient?.full_name || '';
                return nameA.localeCompare(nameB);
            }
            return 0;
        });

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 bg-[var(--glass-surface)] p-4 rounded-lg border border-[var(--glass-border)]">
                <div className="flex gap-2">
                    {(['all', 'vital', 'prescription'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterType === type
                                    ? 'bg-[var(--pulse-cyan-dim)] text-[var(--pulse-cyan)] border border-[var(--pulse-cyan)]'
                                    : 'text-[var(--text-muted)] hover:text-white'
                                }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}s
                        </button>
                    ))}
                </div>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-[var(--card-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] rounded px-3 py-1.5 text-sm outline-none focus:border-[var(--pulse-cyan)]"
                >
                    <option value="date">Sort by Date (Newest)</option>
                    <option value="patient">Sort by Patient Name (A-Z)</option>
                </select>
            </div>

            {/* Table */}
            <GlassCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--surface-dim)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)]">
                            <AnimatePresence>
                                {processedData.map((item) => (
                                    <motion.tr
                                        key={`${item.type}-${item.id}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-[var(--glass-highlight)] transition-colors"
                                    >
                                        <td className="p-4 whitespace-nowrap text-[var(--text-dim)]">
                                            {new Date(item.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        <td className="p-4 font-medium text-[var(--text-primary)]">
                                            {item.patient?.full_name || 'Unknown'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.type === 'vital'
                                                    ? 'bg-[var(--pulse-cyan-dim)] text-[var(--pulse-cyan)]'
                                                    : 'bg-[var(--bio-emerald-dim)] text-[var(--bio-emerald)]'
                                                }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-[var(--text-primary)]">
                                            {item.type === 'vital' ? (
                                                <div className="flex gap-3 text-xs">
                                                    <span>❤ {(item as Vitals).pulse_bpm}</span>
                                                    <span>🩸 {(item as Vitals).bp_systolic}/{(item as Vitals).bp_diastolic}</span>
                                                    <span>💨 {(item as Vitals).spo2}%</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    {(item as Prescription).items?.map((drug, i) => (
                                                        <span key={i} className="text-xs">
                                                            💊 {drug.drug_name} ({drug.dosage})
                                                        </span>
                                                    )) || <span className="text-xs text-[var(--text-muted)]">No items</span>}
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>

                            {processedData.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-[var(--text-muted)]">
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
