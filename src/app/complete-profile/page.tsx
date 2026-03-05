'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';

export default function CompleteProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [form, setForm] = useState({
        full_name: '',
        role: 'patient',
        specialization: '',
    });

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                router.push('/login');
                return;
            }
            setUserId(user.id);
            // Pre-fill from metadata if available
            if (user.user_metadata) {
                setForm({
                    full_name: user.user_metadata.full_name || '',
                    role: user.user_metadata.role || 'patient',
                    specialization: user.user_metadata.specialization || '',
                });
            }
        });
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        setLoading(true);
        const supabase = createClient();

        try {
            const { error } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    full_name: form.full_name,
                    role: form.role,
                    specialization: form.role === 'doctor' ? form.specialization : null,
                });

            if (error) throw error;

            // Success -> Dashboard
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Profile creation failed:', error);
            alert('Failed to create profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!userId) return null;

    return (
        <div className="min-h-screen flex items-center justify-center px-4 gradient-mesh">
            <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <GlassCard>
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold neon-text">Complete Identity</h1>
                        <p className="text-sm text-[var(--text-muted)]">
                            Your account was created but your profile is incomplete.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                className="cyber-input"
                                value={form.full_name}
                                onChange={e => setForm({ ...form, full_name: e.target.value })}
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
                                Role
                            </label>
                            <select
                                className="cyber-input bg-[var(--bg-void)]"
                                value={form.role}
                                onChange={e => setForm({ ...form, role: e.target.value })}
                            >
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
                            </select>
                        </div>

                        {form.role === 'doctor' && (
                            <div>
                                <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
                                    Specialization
                                </label>
                                <input
                                    type="text"
                                    className="cyber-input"
                                    value={form.specialization}
                                    onChange={e => setForm({ ...form, specialization: e.target.value })}
                                    placeholder="e.g. Cardiology"
                                />
                            </div>
                        )}

                        <NeonButton type="submit" loading={loading} className="w-full mt-4">
                            Establish Identity
                        </NeonButton>
                    </form>
                </GlassCard>
            </motion.div>
        </div>
    );
}
