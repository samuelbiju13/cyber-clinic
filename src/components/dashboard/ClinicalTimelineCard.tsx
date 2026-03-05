'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import type { Vitals } from '@/types';

interface ClinicalTimelineCardProps {
    vital: Vitals;
    index: number;
}

export default function ClinicalTimelineCard({ vital, index }: ClinicalTimelineCardProps) {
    const isCritical = (vital.spo2 < 90) || (vital.pulse_bpm > 100 || vital.pulse_bpm < 60);
    const auditStatus = vital.spo2 > 94 ? 'AI Auditor: PASS' : 'AI Auditor: FLAG';
    const auditColor = vital.spo2 > 94 ? 'text-[var(--bio-emerald)]' : 'text-[var(--danger-red)]';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <GlassCard className={`relative overflow-hidden group border-l-4 ${isCritical ? 'border-l-[var(--danger-red)]' : 'border-l-[var(--pulse-cyan)]'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                    {/* Time & Date */}
                    <div className="min-w-[120px]">
                        <p className="text-xl font-bold text-[var(--text-primary)]">
                            {new Date(vital.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">
                            {new Date(vital.recorded_at).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Vitals Grid */}
                    <div className="flex-1 grid grid-cols-3 gap-4 w-full md:w-auto">
                        <div className="text-center md:text-left">
                            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Heart Rate</p>
                            <p className="text-lg font-mono text-[var(--pulse-cyan)]">{vital.pulse_bpm} <span className="text-xs">BPM</span></p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">BP</p>
                            <p className="text-lg font-mono text-[var(--text-primary)]">{vital.bp_systolic}/{vital.bp_diastolic}</p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">SpO2</p>
                            <p className={`text-lg font-mono ${vital.spo2 < 95 ? 'text-[var(--danger-red)]' : 'text-[var(--bio-emerald)]'}`}>
                                {vital.spo2}%
                            </p>
                        </div>
                    </div>

                    {/* AI Badge */}
                    <div className="absolute top-2 right-2 md:static md:block">
                        <span className={`text-[10px] font-bold uppercase tracking-widest border border-current px-2 py-0.5 rounded-full ${auditColor} opacity-80`}>
                            {auditStatus}
                        </span>
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    );
}
