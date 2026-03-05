'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import type { Prescription } from '@/types';
import { revokePrescription, updateDosage } from '@/app/dashboard/prescriptions/actions';

interface DoctorPrescriptionsListProps {
    initialPrescriptions: Prescription[];
}

export default function DoctorPrescriptionsList({ initialPrescriptions }: DoctorPrescriptionsListProps) {
    const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
    const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
    const [editingItem, setEditingItem] = useState<{ id: string, dosage: string } | null>(null);

    // Sorting Logic
    const sorted = [...prescriptions].sort((a, b) => {
        if (sortBy === 'date') {
            return new Date(b.prescribed_date).getTime() - new Date(a.prescribed_date).getTime();
        }
        if (sortBy === 'name') {
            const nameA = a.patient?.full_name || '';
            const nameB = b.patient?.full_name || '';
            return nameA.localeCompare(nameB);
        }
        if (sortBy === 'status') {
            return a.status.localeCompare(b.status);
        }
        return 0;
    });

    const handleRevoke = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this prescription?')) return;

        const result = await revokePrescription(id);
        if (result.success) {
            // Optimistic update
            setPrescriptions(prev => prev.map(p =>
                p.id === id ? { ...p, status: 'expired' } : p
            ));
        } else {
            alert('Failed to revoke: ' + result.error);
        }
    };

    const handleUpdateDosage = async () => {
        if (!editingItem) return;

        const result = await updateDosage(editingItem.id, editingItem.dosage);
        if (result.success) {
            setPrescriptions(prev => prev.map(p => ({
                ...p,
                items: p.items?.map(i => i.id === editingItem.id ? { ...i, dosage: editingItem.dosage } : i)
            })));
            setEditingItem(null);
        } else {
            alert('Failed to update: ' + result.error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex justify-end">
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] rounded-md px-4 py-2 outline-none focus:border-[var(--pulse-cyan)]"
                >
                    <option value="date">Sort by Date (Newest)</option>
                    <option value="name">Sort by Patient Name</option>
                    <option value="status">Sort by Status</option>
                </select>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                    {sorted.map((rx) => (
                        <motion.div
                            key={rx.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <GlassCard className={`border-l-4 ${rx.status === 'active' ? 'border-l-[var(--bio-emerald)]' : 'border-l-[var(--text-muted)]'}`}>
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-[var(--text-primary)]">
                                                {rx.patient?.full_name || 'Unknown Patient'}
                                            </h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${rx.status === 'active'
                                                    ? 'bg-[var(--bio-emerald-dim)] text-[var(--bio-emerald)]'
                                                    : 'bg-[var(--surface-dim)] text-[var(--text-muted)]'
                                                }`}>
                                                {rx.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)] mb-4">
                                            Prescribed: {new Date(rx.prescribed_date).toLocaleDateString()}
                                            {' · '}
                                            Valid until: {new Date(rx.valid_until).toLocaleDateString()}
                                        </p>

                                        {/* Items */}
                                        <div className="space-y-2">
                                            {rx.items?.map(item => (
                                                <div key={item.id} className="flex flex-wrap items-center gap-2 p-2 bg-[var(--surface-dim)] rounded border border-[var(--glass-border)]">
                                                    <span className="font-medium text-[var(--pulse-cyan)]">{item.drug_name}</span>

                                                    {editingItem?.id === item.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={editingItem.dosage}
                                                                onChange={(e) => setEditingItem({ ...editingItem, dosage: e.target.value })}
                                                                className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded px-2 py-0.5 text-sm w-24"
                                                                autoFocus
                                                            />
                                                            <button onClick={handleUpdateDosage} className="text-[var(--bio-emerald)] text-xs hover:underline">Save</button>
                                                            <button onClick={() => setEditingItem(null)} className="text-[var(--text-muted)] text-xs hover:underline">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--pulse-cyan)] border-b border-dashed border-[var(--text-muted)]"
                                                            onClick={() => rx.status === 'active' && setEditingItem({ id: item.id, dosage: item.dosage })}
                                                            title="Click to edit dosage"
                                                        >
                                                            {item.dosage}
                                                        </span>
                                                    )}

                                                    <span className="text-xs text-[var(--text-muted)] ml-auto">{item.duration_days} days</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 justify-center border-l border-[var(--glass-border)] pl-4">
                                        {rx.status === 'active' && (
                                            <NeonButton
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleRevoke(rx.id)}
                                                className="text-[var(--danger-red)] border-[var(--danger-red)] hover:bg-[var(--danger-red-dim)]"
                                            >
                                                Revoke Rx
                                            </NeonButton>
                                        )}
                                        {/* Edit logic handled inline above for UX */}
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {sorted.length === 0 && (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                        No prescriptions found matching your filter.
                    </div>
                )}
            </div>
        </div>
    );
}
