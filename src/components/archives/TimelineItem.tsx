'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import type { Checkup } from '@/types';
import { formatCheckupDate } from '@/lib/utils/dates';

interface TimelineItemProps {
    checkup: Checkup;
    index: number;
}

export default function TimelineItem({ checkup, index }: TimelineItemProps) {
    return (
        <motion.div
            className="relative flex gap-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            {/* Timeline line & dot */}
            <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-[var(--pulse-cyan)] shadow-[0_0_12px_var(--pulse-cyan-glow)] z-10" />
                <div className="w-px flex-1 bg-gradient-to-b from-[var(--pulse-cyan-dim)] to-transparent" />
            </div>

            {/* Content */}
            <GlassCard className="flex-1 mb-6 space-y-3">
                {/* Date & Status */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[var(--pulse-cyan)]">
                        {formatCheckupDate(checkup.checkup_date)}
                    </span>
                    <span
                        className={`
              px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider
              ${checkup.status === 'completed'
                                ? 'bg-[var(--bio-emerald-dim)] text-[var(--bio-emerald)]'
                                : checkup.status === 'scheduled'
                                    ? 'bg-[var(--pulse-cyan-dim)] text-[var(--pulse-cyan)]'
                                    : 'bg-[var(--danger-red-dim)] text-[var(--danger-red)]'
                            }
            `}
                    >
                        {checkup.status}
                    </span>
                </div>

                {/* Doctor */}
                {checkup.doctor && (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--pulse-cyan-dim)] flex items-center justify-center text-sm">
                            🩺
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                Dr. {checkup.doctor.full_name}
                            </p>
                            {checkup.doctor.specialization && (
                                <p className="text-xs text-[var(--pulse-cyan)]">
                                    {checkup.doctor.specialization}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Diagnosis */}
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                    {checkup.diagnosis}
                </p>

                {/* Vitals summary */}
                {checkup.vitals && (
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-[var(--glass-border)]">
                        <span className="text-xs px-2 py-1 rounded bg-[var(--bio-emerald-dim)] text-[var(--bio-emerald)]">
                            ❤ {checkup.vitals.pulse_bpm} BPM
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-[var(--pulse-cyan-dim)] text-[var(--pulse-cyan)]">
                            🩸 {checkup.vitals.bp_systolic}/{checkup.vitals.bp_diastolic}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-[var(--bio-emerald-dim)] text-[var(--bio-emerald)]">
                            💨 {checkup.vitals.spo2}%
                        </span>
                    </div>
                )}

                {/* Report download */}
                {checkup.report_url && (
                    <a
                        href={checkup.report_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-[var(--pulse-cyan)] hover:underline mt-2"
                    >
                        📄 Download Report (PDF)
                    </a>
                )}

                {/* OCR text */}
                {checkup.ocr_extracted_text && (
                    <details className="mt-2">
                        <summary className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--pulse-cyan)] transition-colors">
                            🔍 View OCR Extracted Text
                        </summary>
                        <pre className="mt-2 p-3 rounded-lg bg-[rgba(0,0,0,0.3)] text-xs text-[var(--text-muted)] whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                            {checkup.ocr_extracted_text}
                        </pre>
                    </details>
                )}
            </GlassCard>
        </motion.div>
    );
}
