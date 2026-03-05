'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { motion, AnimatePresence } from 'framer-motion';

export default function VitalsForm({ onClose }: { onClose: () => void }) {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        pulse_bpm: '',
        blood_pressure_sys: '',
        blood_pressure_dia: '',
        spo2_percent: '',
        temperature_f: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // FIXED: Use UPSERT with conflict handling to update existing patient vitals
            // Restoring recorded_at to ensure the timestamp reflects the LATEST update
            const { error: insertError } = await supabase.from('vitals').upsert({
                patient_id: user.id,
                pulse_bpm: parseInt(form.pulse_bpm),
                bp_systolic: parseInt(form.blood_pressure_sys),
                bp_diastolic: parseInt(form.blood_pressure_dia),
                spo2: parseInt(form.spo2_percent),
                temperature_f: form.temperature_f ? parseFloat(form.temperature_f) : null,
                recorded_at: new Date().toISOString(),
            }, {
                onConflict: 'patient_id'
            });

            if (insertError) throw insertError;

            // Wait for cache/propagation
            await new Promise(resolve => setTimeout(resolve, 1000));

            router.refresh();
            onClose();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GlassCard className="border-[var(--pulse-cyan)]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold neon-text">Record Vitals</h2>
                            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white">✕</button>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 text-sm border border-red-500/30">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">Heart Rate (BPM)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded p-2 text-white focus:border-[var(--pulse-cyan)] outline-none"
                                        value={form.pulse_bpm}
                                        onChange={(e) => setForm({ ...form, pulse_bpm: e.target.value })}
                                        placeholder="72"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">SpO2 (%)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.1"
                                        className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded p-2 text-white focus:border-[var(--pulse-cyan)] outline-none"
                                        value={form.spo2_percent}
                                        onChange={(e) => setForm({ ...form, spo2_percent: e.target.value })}
                                        placeholder="98"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">BP (Systolic)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded p-2 text-white focus:border-[var(--pulse-cyan)] outline-none"
                                        value={form.blood_pressure_sys}
                                        onChange={(e) => setForm({ ...form, blood_pressure_sys: e.target.value })}
                                        placeholder="120"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">BP (Diastolic)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded p-2 text-white focus:border-[var(--pulse-cyan)] outline-none"
                                        value={form.blood_pressure_dia}
                                        onChange={(e) => setForm({ ...form, blood_pressure_dia: e.target.value })}
                                        placeholder="80"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">Temperature (°F)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded p-2 text-white focus:border-[var(--pulse-cyan)] outline-none"
                                    value={form.temperature_f}
                                    onChange={(e) => setForm({ ...form, temperature_f: e.target.value })}
                                    placeholder="98.6"
                                />
                            </div>

                            <NeonButton
                                type="submit"
                                variant="primary"
                                className="w-full justify-center"
                                disabled={loading}
                            >
                                {loading ? 'Syncing...' : 'Log Vitals'}
                            </NeonButton>
                        </form>
                    </GlassCard>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
