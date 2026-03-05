'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import ScanLine from '@/components/ui/ScanLine';
import NeonButton from '@/components/ui/NeonButton';
import GlassCard from '@/components/ui/GlassCard';

function PrescriptionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // IDs from previous step
    const patientId = searchParams.get('patientId');
    const checkupId = searchParams.get('checkupId');

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        drug_name: '',
        dosage: '',
        frequency: '',
        duration_days: '7',
        instructions: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId || !checkupId) {
            alert('Missing consultation context. Please restart.');
            return;
        }

        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Calculate expiry
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + parseInt(form.duration_days));

            // 1. Create Prescription Header
            const { data: prescription, error: rxError } = await supabase
                .from('prescriptions')
                .insert({
                    checkup_id: checkupId,
                    patient_id: patientId,
                    doctor_id: user.id,
                    prescribed_date: new Date().toISOString(),
                    valid_until: validUntil.toISOString(),
                    status: 'active',
                    ai_audit_status: 'pending'
                })
                .select()
                .maybeSingle();

            if (!prescription) throw new Error('Failed to create prescription record.');

            if (rxError) throw rxError;

            // 2. Add Prescription Item
            const { error: itemError } = await supabase
                .from('prescription_items')
                .insert({
                    prescription_id: prescription.id,
                    drug_name: form.drug_name,
                    dosage: form.dosage,
                    frequency: form.frequency,
                    duration_days: parseInt(form.duration_days),
                    instructions: form.instructions
                });

            if (itemError) throw itemError;

            // Success!
            // In a real app we might show a Toast here.
            router.push('/dashboard');

        } catch (error) {
            console.error('Prescription failed:', error);
            alert('Failed to issue prescription.');
        } finally {
            setLoading(false);
        }
    };

    if (!patientId || !checkupId) {
        return (
            <div className="flex h-screen items-center justify-center text-[var(--danger-red)]">
                Error: Missing Patient Context
            </div>
        );
    }

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
                    <h1 className="text-3xl font-bold neon-text mb-1">Digital Prescription Pad</h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        Issue Rx for Consult #{checkupId.slice(0, 8)}...
                    </p>
                </div>
            </motion.div>

            {/* Form */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="max-w-2xl mx-auto"
            >
                <GlassCard className="border-[var(--pulse-cyan)]">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                                Medication Name
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-md p-3 text-white focus:border-[var(--pulse-cyan)] outline-none"
                                value={form.drug_name}
                                onChange={(e) => setForm({ ...form, drug_name: e.target.value })}
                                placeholder="e.g. Amoxicillin, Lisinopril..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                                    Dosage
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-md p-3 text-white focus:border-[var(--pulse-cyan)] outline-none"
                                    value={form.dosage}
                                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                                    placeholder="e.g. 500mg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                                    Frequency
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-md p-3 text-white focus:border-[var(--pulse-cyan)] outline-none"
                                    value={form.frequency}
                                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                                    placeholder="e.g. Twice daily"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                                    Duration (Days)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="365"
                                    className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-md p-3 text-white focus:border-[var(--pulse-cyan)] outline-none"
                                    value={form.duration_days}
                                    onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                                Special Instructions
                            </label>
                            <textarea
                                rows={2}
                                className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-md p-3 text-white focus:border-[var(--pulse-cyan)] outline-none resize-none"
                                value={form.instructions}
                                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                                placeholder="e.g. Take with food"
                            />
                        </div>

                        <div className="pt-4">
                            <NeonButton
                                type="submit"
                                variant="primary"
                                className="w-full justify-center"
                                disabled={loading}
                            >
                                {loading ? 'Issuing...' : 'Finish & Issue Rx'}
                            </NeonButton>
                        </div>

                    </form>
                </GlassCard>
            </motion.div>
        </div>
    );
}

export default function DigitalPrescriptionPad() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-t-[var(--pulse-cyan)] border-r-transparent animate-spin" />
                    <p className="text-[var(--text-muted)] animate-pulse">Initializing Secure Pad...</p>
                </div>
            </div>
        }>
            <PrescriptionContent />
        </Suspense>
    );
}
