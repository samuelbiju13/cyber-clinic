'use client';

import GlassCard from '@/components/ui/GlassCard';
import type { Profile } from '@/types';
import { motion } from 'framer-motion';

interface PatientSummaryProps {
    profile: Profile | null;
    loading: boolean;
}

export default function PatientSummary({ profile, loading }: PatientSummaryProps) {
    if (loading) {
        return (
            <GlassCard className="h-full flex items-center justify-center animate-pulse">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-[var(--glass-border)]" />
                    <div className="h-4 w-32 bg-[var(--glass-border)] rounded" />
                </div>
            </GlassCard>
        );
    }

    if (!profile) return null;

    return (
        <GlassCard className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pulse-cyan)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar / Placeholder */}
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--pulse-cyan-dim)] to-[var(--background)] p-0.5">
                        <div className="w-full h-full rounded-full bg-[var(--card-bg)] flex items-center justify-center overflow-hidden">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl">👤</span>
                            )}
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-[var(--bio-emerald)] border-4 border-[var(--card-bg)] rounded-full" />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                            {profile.full_name}
                        </h2>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-[var(--pulse-cyan-dim)] text-[var(--pulse-cyan)]">
                                {profile.role}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] font-mono">
                                ID: {profile.id.slice(0, 8)}...
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm pt-2 border-t border-[var(--glass-border)]">
                        <div>
                            <span className="text-[var(--text-muted)] block text-xs uppercase tracking-wider mb-0.5">Phone</span>
                            <span className="font-mono text-[var(--text-primary)]">
                                {profile.phone || 'Not linked'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[var(--text-muted)] block text-xs uppercase tracking-wider mb-0.5">Gov ID</span>
                            <span className="font-mono text-[var(--pulse-cyan)]">
                                {profile.encrypted_gov_id ? '🔒 Encrypted' : 'Not verified'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
