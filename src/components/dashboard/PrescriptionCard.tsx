'use client';

import GlassCard from '@/components/ui/GlassCard';
import CountdownTimer from '@/components/ui/CountdownTimer';
import type { Prescription } from '@/types';

interface PrescriptionCardProps {
    prescription: Prescription;
}

export default function PrescriptionCard({ prescription }: PrescriptionCardProps) {
    const isExpiringSoon =
        new Date(prescription.valid_until).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
    const isExpired = new Date(prescription.valid_until).getTime() < Date.now();

    const glowType = isExpired ? 'danger' : isExpiringSoon ? 'cyan' : 'none';

    return (
        <GlassCard glow={glowType} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--pulse-cyan-dim)] flex items-center justify-center text-xl">
                        💊
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">
                            Prescription #{prescription.id.slice(0, 8)}
                        </h3>
                        {prescription.doctor && (
                            <p className="text-xs text-[var(--text-muted)]">
                                Dr. {prescription.doctor.full_name}
                            </p>
                        )}
                    </div>
                </div>
                <span
                    className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${prescription.ai_audit_status === 'flagged'
                            ? 'bg-[var(--danger-red-dim)] text-[var(--danger-red)]'
                            : prescription.ai_audit_status === 'clear'
                                ? 'bg-[var(--bio-emerald-dim)] text-[var(--bio-emerald)]'
                                : 'bg-[var(--pulse-cyan-dim)] text-[var(--pulse-cyan)]'
                        }
          `}
                >
                    {prescription.ai_audit_status === 'flagged' ? '⚠ AI: Flagged' :
                        prescription.ai_audit_status === 'clear' ? '✓ AI: Clear' : '⏳ AI: Pending'}
                </span>
            </div>

            {/* Medications */}
            {prescription.items && prescription.items.length > 0 && (
                <div className="space-y-2">
                    {prescription.items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-[rgba(0,245,255,0.03)] border border-[var(--glass-border)]"
                        >
                            <div>
                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                    {item.drug_name}
                                </span>
                                <span className="text-xs text-[var(--text-muted)] ml-2">
                                    {item.dosage}
                                </span>
                            </div>
                            <span className="text-xs text-[var(--pulse-cyan)]">
                                {item.frequency}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Countdown */}
            <div className="pt-2 border-t border-[var(--glass-border)]">
                <CountdownTimer targetDate={prescription.valid_until} />
            </div>
        </GlassCard>
    );
}
