'use client';

import { motion } from 'framer-motion';

interface PulseIndicatorProps {
    value: number | string;
    label: string;
    status?: 'normal' | 'warning' | 'critical';
    unit?: string;
}

const statusColors = {
    normal: 'var(--bio-emerald)',
    warning: '#F59E0B',
    critical: 'var(--danger-red)',
};

export default function PulseIndicator({
    value,
    label,
    status = 'normal',
    unit = '',
}: PulseIndicatorProps) {
    const color = statusColors[status];

    return (
        <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="relative w-20 h-20">
                {/* Outer ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="6"
                    />
                    <motion.circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke={color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                        animate={{
                            strokeDashoffset:
                                2 * Math.PI * 34 * (1 - (typeof value === 'number' ? Math.min(value / 100, 1) : 0.75)),
                        }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        style={{
                            filter: `drop-shadow(0 0 6px ${color})`,
                        }}
                    />
                </svg>
                {/* Center value */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className="text-lg font-bold"
                        style={{ color }}
                    >
                        {value}
                    </span>
                    {unit && (
                        <span className="text-[10px] text-[var(--text-muted)]">{unit}</span>
                    )}
                </div>
            </div>
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                {label}
            </span>
        </motion.div>
    );
}
