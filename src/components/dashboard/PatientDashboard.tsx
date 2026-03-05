'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import StatsGrid from '@/components/dashboard/StatsGrid';
import PrescriptionCard from '@/components/dashboard/PrescriptionCard';
import VitalsPanel from '@/components/dashboard/VitalsPanel';
import HealthDeltaWidget from '@/components/dashboard/HealthDelta';
import PatientSummary from '@/components/dashboard/PatientSummary';
import ScanLine from '@/components/ui/ScanLine';
import VitalsForm from '@/components/dashboard/VitalsForm';
import NeonButton from '@/components/ui/NeonButton';
import { calculateHealthDelta } from '@/lib/utils/trend-analyzer';
import Link from 'next/link';
import type { Vitals, Profile } from '@/types';

interface PatientDashboardProps {
    user: Profile;
}

export default function PatientDashboard({ user }: PatientDashboardProps) {
    // Unified State
    const [data, setData] = useState<{
        vitals: Vitals[];
        prescriptions: any[];
        auditCount: number;
    }>({
        vitals: [],
        // DEFAULT UI STATE: Prevent crashes if data is missing
        prescriptions: [],
        auditCount: 0
    });

    const [loadingData, setLoadingData] = useState(true);
    const [showVitalsForm, setShowVitalsForm] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (!user?.id || user.role === 'guest') {
            setLoadingData(false);
            return;
        }

        async function fetchDashboardData() {
            setLoadingData(true);
            try {
                await supabase.auth.refreshSession();
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError || !session || session.user.id !== user.id) return;

                // Fetching all three concurrently
                const [vitalsRes, rxRes, auditRes] = await Promise.all([
                    supabase.from('vitals').select('*').eq('patient_id', user.id).order('recorded_at', { ascending: false }).limit(5),
                    supabase.from('prescriptions').select('*, doctor:profiles(*), items:prescription_items(*)').eq('patient_id', user.id),
                    supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('is_resolved', false)
                ]);

                if (vitalsRes.error) console.error("Vitals Fetch Error:", vitalsRes.error);

                const hasVitals = (vitalsRes.data as Vitals[])?.length > 0;
                const safeVitals = hasVitals ? (vitalsRes.data as Vitals[]) : [{
                    id: 'default',
                    patient_id: user.id,
                    pulse_bpm: 0, bp_systolic: 0, bp_diastolic: 0, spo2: 0, temperature_f: 98.6, recorded_at: new Date().toISOString()
                } as Vitals];

                setData({
                    vitals: safeVitals,
                    prescriptions: rxRes.data || [],
                    auditCount: auditRes.count || 0
                });

            } catch (error: any) {
                console.error('Critical Dashboard sync failure:', error);
                // Fallback to empty state on catch
                setData(prev => ({ ...prev, vitals: [{ id: 'default', patient_id: user.id, pulse_bpm: 0, bp_systolic: 0, bp_diastolic: 0, spo2: 0, temperature_f: 98.6, recorded_at: new Date().toISOString() } as Vitals] }));
            } finally {
                setLoadingData(false);
            }
        }

        fetchDashboardData();
    }, [user.id, supabase, showVitalsForm]);

    // UNIVERSAL PERSISTENCE LOGIC
    // 1. Global Sync Effect: Listen for changes to vital state
    useEffect(() => {
        if (!data.vitals.length || !user?.id) return;

        const current = data.vitals[0];
        // Skip default/placeholder unless we want to initialize it
        if (current.id === 'default' && data.vitals.length === 1) {
            // We can choose to persist the default zero-state to "initialize" the DB
        }

        const syncVitals = async () => {
            // 3. Data Normalization
            const normalized = {
                patient_id: user.id,
                pulse_bpm: Math.round(Math.max(0, Math.min(300, current.pulse_bpm || 0))),
                bp_systolic: Math.round(Math.max(0, Math.min(250, current.bp_systolic || 0))),
                bp_diastolic: Math.round(Math.max(0, Math.min(180, current.bp_diastolic || 0))),
                spo2: Math.round(Math.max(0, Math.min(100, current.spo2 || 0))),
                temperature_f: Math.max(0, Math.min(115, current.temperature_f || 98.6)),
                // Ensure we preserve the recorded_at or update it?
                // User says "Debounced Upsert: When a value changes..."
                // Usually implies we want to update the *record*.
                // We will update the *current* record's values.
                recorded_at: current.recorded_at || new Date().toISOString()
            };

            // 2. Debounced Upsert
            const { error } = await supabase.from('vitals').upsert(normalized, { onConflict: 'patient_id, recorded_at' });

            if (error) {
                console.warn("Vitals Auto-Sync Warning:", error.message);
            } else {
                console.log("Vitals Auto-Synced.");
            }
        };

        const timer = setTimeout(syncVitals, 1000); // 1s Debounce

        return () => clearTimeout(timer);
    }, [data.vitals, supabase, user.id]);

    // Derived State
    const activePrescriptions = data.prescriptions.filter(
        (rx) => rx.status === 'active'
    );

    // DEBUG: Check why pending aren't showing or if we need them
    if (data.prescriptions.length > 0 && activePrescriptions.length === 0) {
        console.log("Dashboard Debug: No active prescriptions found. Raw statuses:", data.prescriptions.map(p => p.status));
    }

    const pendingCount = 0; // Reverted logic, so pending count is unused/zero for now in stats

    const currentVitals = data.vitals[0];
    const previousVitals = data.vitals[1];

    const delta =
        currentVitals && previousVitals
            ? calculateHealthDelta(currentVitals, previousVitals)
            : {
                bpSystolicDelta: null,
                bpDiastolicDelta: null,
                pulseDelta: null,
                spo2Delta: null,
                weightDelta: null,
            };

    // Stats logic
    const stats = [
        {
            label: 'Latest Pulse',
            value: currentVitals ? `${currentVitals.pulse_bpm} BPM` : '0 BPM', // Default 0
            icon: '❤',
            trend: 'stable' as const,
        },
        {
            label: 'Active Prescriptions',
            value: activePrescriptions.length,
            icon: '💊',
            trend: activePrescriptions.length > 0 ? ('stable' as const) : ('down' as const),
            subtext: pendingCount > 0 ? `Includes ${pendingCount} Pending` : undefined,
        },
        {
            label: 'AI Auditor Flags',
            value: data.auditCount,
            icon: '⚠️',
            trend: 'down' as const,
            color: 'var(--danger-red)',
        },
    ];

    if (loadingData) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-[var(--pulse-cyan)] border-t-transparent animate-spin" />
                    <p className="text-[var(--text-muted)] animate-pulse">
                        Syncing Neural Link...
                    </p>
                </div>
            </div>
        );
    }

    // Safety: If guest mode (likely due to error), show nothing or a specific state
    // TopBar will handle the error message and retry button.
    if (user.role === 'guest') {
        return (
            <div className="flex h-96 items-center justify-center flex-col gap-4 text-center p-8 glass-panel border border-[var(--danger-red)]">
                <div className="text-4xl">⚠️</div>
                <h2 className="text-xl font-bold text-[var(--danger-red)]">Restricted Access</h2>
                <p className="text-[var(--text-muted)] max-w-md">
                    System is unable to verify your medical profile. <br />
                    Please use the <strong>Retry Connection</strong> button in the top bar.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            <ScanLine />

            {/* Vitals Modal */}
            {showVitalsForm && (
                <VitalsForm onClose={() => setShowVitalsForm(false)} />
            )}

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold neon-text mb-1">Neural Dashboard</h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        System health overview ·{' '}
                        {new Date().toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>

                <NeonButton variant="primary" onClick={() => setShowVitalsForm(true)}>
                    + Record Vitals
                </NeonButton>
            </motion.div>

            {/* Patient Summary Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <PatientSummary profile={user} loading={false} />
            </motion.div>

            {/* Stats */}
            <StatsGrid stats={stats} />

            {/* Two-column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Vitals + Delta */}
                <div className="xl:col-span-1 space-y-6">
                    <VitalsPanel vitals={data.vitals} />
                    {currentVitals && <HealthDeltaWidget delta={delta} />}
                </div>

                {/* Active Prescriptions */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <span className="text-[var(--pulse-cyan)]">⚡</span>
                            Active Prescriptions
                        </h2>
                        <Link
                            href="/dashboard/prescriptions"
                            className="text-xs text-[var(--pulse-cyan)] hover:underline"
                        >
                            View All
                        </Link>
                    </div>

                    {activePrescriptions.length > 0 ? (
                        activePrescriptions.map((rx) => (
                            <PrescriptionCard key={rx.id} prescription={rx} />
                        ))
                    ) : (
                        <div className="glass-panel p-8 text-center text-[var(--text-muted)]">
                            <p>No active prescriptions.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
