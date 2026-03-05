'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import ScanLine from '@/components/ui/ScanLine';
import NeonButton from '@/components/ui/NeonButton';
import GlassCard from '@/components/ui/GlassCard';
import type { Profile } from '@/types';

export default function ConsultationPortal() {
    const router = useRouter();
    const supabase = createClient();
    const [patients, setPatients] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        patient_id: '',
        diagnosis: '',
        notes: '',
    });

    useEffect(() => {
        async function fetchPatients() {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'patient')
                .order('full_name');

            if (data) setPatients(data);
            setLoading(false);
        }
        fetchPatients();
    }, [supabase]);

    const handleStartConsultation = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Create Checkup Record
            const { data: checkup, error } = await supabase
                .from('checkups')
                .insert({
                    patient_id: form.patient_id,
                    doctor_id: user.id,
                    checkup_date: new Date().toISOString(),
                    diagnosis: form.diagnosis,
                    notes: form.notes,
                    status: 'completed' // Approving immediately for now, or 'scheduled'
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Redirect to Prescription issuance with checkup_id
            router.push(`/dashboard/consultation/prescription?patientId=${form.patient_id}&checkupId=${checkup.id}`);

        } catch (error) {
            console.error('Consultation creation failed:', error);
            alert('Failed to start consultation. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-[var(--pulse-cyan)] border-t-transparent animate-spin" />
                    <p className="text-[var(--text-muted)] animate-pulse">
                        Loading Patient Database...
                    </p>
                </div>
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
                    <h1 className="text-3xl font-bold neon-text mb-1">Consultation Portal</h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        New Patient Encounter
                    </p>
                </div>
                <NeonButton onClick={() => router.push('/dashboard')} variant="secondary">
                    Cancel
                </NeonButton>
            </motion.div>

            {/* Form */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="max-w-2xl mx-auto"
            >
                <GlassCard>
                    <form onSubmit={handleStartConsultation} className="space-y-6">

                        {/* Patient Select */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                                Select Patient
                            </label>
                            <select
                                required
                                className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-md p-3 text-white focus:border-[var(--pulse-cyan)] outline-none"
                                value={form.patient_id}
                                onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                            >
                                <option value="">-- Choose a Patient --</option>
                                {patients.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.full_name} ({p.phone || 'No Contact'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Medical Notes */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                                Diagnosis / Chief Complaint
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-md p-3 text-white focus:border-[var(--pulse-cyan)] outline-none"
                                value={form.diagnosis}
                                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                                placeholder="e.g. Acute Bronchitis, Hypertension Follow-up..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                                Clinical Notes
                            </label>
                            <textarea
                                required
                                rows={4}
                                className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-md p-3 text-white focus:border-[var(--pulse-cyan)] outline-none resize-none"
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="Patient presents with..."
                            />
                        </div>

                        <div className="pt-4">
                            <NeonButton
                                type="submit"
                                variant="primary"
                                className="w-full justify-center"
                                disabled={submitting}
                            >
                                {submitting ? 'Initializing...' : 'Proceed to Prescription →'}
                            </NeonButton>
                        </div>

                    </form>
                </GlassCard>
            </motion.div>
        </div>
    );
}
