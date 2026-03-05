'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import type { HealthDelta } from '@/types';
import { getTrendDirection } from '@/lib/utils/trend-analyzer';

interface HealthDeltaProps {
    delta: HealthDelta;
}

function DeltaItem({
    label,
    value,
    inverse = false,
}: {
    label: string;
    value: number | null;
    inverse?: boolean;
}) {
    const dir = getTrendDirection(value);
    const isGood =
        dir === 'stable' || (inverse ? dir === 'down' : dir === 'up');

    const color =
        dir === 'unknown'
            ? 'var(--text-muted)'
            : dir === 'stable'
                ? 'var(--pulse-cyan)'
                : isGood
                    ? 'var(--bio-emerald)'
                    : 'var(--danger-red)';

    const arrow =
        dir === 'up' ? '▲' : dir === 'down' ? '▼' : dir === 'stable' ? '●' : '—';

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] w-24">{label}</span>
            <motion.span
                className="text-sm font-mono font-bold"
                style={{ color }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
            >
                {arrow}{' '}
                {value !== null ? `${value > 0 ? '+' : ''}${value}%` : 'N/A'}
            </motion.span>
        </div>
    );
}

export default function HealthDeltaWidget({ delta }: HealthDeltaProps) {
    return (
        <GlassCard className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📊</span>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Health Delta
                </h3>
            </div>
            <DeltaItem label="BP Systolic" value={delta.bpSystolicDelta} inverse />
            <DeltaItem label="BP Diastolic" value={delta.bpDiastolicDelta} inverse />
            <DeltaItem label="Pulse" value={delta.pulseDelta} inverse />
            <DeltaItem label="SpO₂" value={delta.spo2Delta} />
            <DeltaItem label="Weight" value={delta.weightDelta} inverse />
        </GlassCard>
    );
}
