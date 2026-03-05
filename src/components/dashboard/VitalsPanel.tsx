'use client';

import PulseIndicator from '@/components/ui/PulseIndicator';
import GlassCard from '@/components/ui/GlassCard';
import type { Vitals } from '@/types';

interface VitalsPanelProps {
    vitals: Vitals[];
}

function getBPStatus(bp: string): 'normal' | 'warning' | 'critical' {
    const match = bp.match(/^(\d+)\/(\d+)$/);
    if (!match) return 'normal';
    const systolic = parseInt(match[1]);
    if (systolic > 180 || systolic < 80) return 'critical';
    if (systolic > 140 || systolic < 90) return 'warning';
    return 'normal';
}

function getPulseStatus(bpm: number): 'normal' | 'warning' | 'critical' {
    if (bpm > 120 || bpm < 50) return 'critical';
    if (bpm > 100 || bpm < 60) return 'warning';
    return 'normal';
}

function getSpO2Status(spo2: number): 'normal' | 'warning' | 'critical' {
    if (spo2 < 90) return 'critical';
    if (spo2 < 95) return 'warning';
    return 'normal';
}

export default function VitalsPanel({ vitals }: VitalsPanelProps) {
    const latest = vitals[0];
    const history = vitals.slice(0, 3); // Show top 3

    if (!latest) {
        return (
            <GlassCard className="p-6 text-center text-[var(--text-muted)]">
                <p>No vital signs recorded.</p>
            </GlassCard>
        );
    }

    const bpString = `${latest.bp_systolic}/${latest.bp_diastolic}`;

    return (
        <GlassCard className="space-y-6">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--bio-emerald)] pulse-ring" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Last Recorded Vitals
                </h3>
            </div>

            {/* Latest Indicators */}
            <div className="flex flex-wrap justify-around gap-6 pb-6 border-b border-[var(--glass-border)]">
                <PulseIndicator
                    value={latest.pulse_bpm}
                    label="Pulse"
                    unit="BPM"
                    status={getPulseStatus(latest.pulse_bpm)}
                />
                <PulseIndicator
                    value={bpString}
                    label="BP"
                    unit="mmHg"
                    status={getBPStatus(bpString)}
                />
                <PulseIndicator
                    value={latest.spo2}
                    label="SpO2"
                    unit="%"
                    status={getSpO2Status(latest.spo2)}
                />
                {latest.temperature_f && (
                    <PulseIndicator
                        value={latest.temperature_f}
                        label="Temp"
                        unit="°F"
                        status={latest.temperature_f > 100.4 ? 'warning' : 'normal'}
                    />
                )}
            </div>

            {/* History Table */}
            <div>
                <h4 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">Recent History</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="text-[var(--text-muted)] border-b border-[var(--glass-border)]">
                                <th className="pb-2 font-medium">Date</th>
                                <th className="pb-2 font-medium">HR</th>
                                <th className="pb-2 font-medium">BP</th>
                                <th className="pb-2 font-medium">SpO2</th>
                                <th className="pb-2 font-medium">Temp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((v) => (
                                <tr key={v.id} className="border-b border-[var(--glass-border)] last:border-0 hover:bg-[var(--glass-surface)] transition-colors">
                                    <td className="py-2 text-[var(--text-dim)]">
                                        {new Date(v.recorded_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-2 font-mono text-[var(--text-primary)]">{v.pulse_bpm}</td>
                                    <td className="py-2 font-mono text-[var(--text-primary)]">{v.bp_systolic}/{v.bp_diastolic}</td>
                                    <td className="py-2 font-mono text-[var(--text-primary)]">{v.spo2}%</td>
                                    <td className="py-2 font-mono text-[var(--text-primary)]">{v.temperature_f || '-'}°F</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </GlassCard>
    );
}
