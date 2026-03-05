'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';

interface StatItem {
    label: string;
    value: string | number;
    icon: string;
    trend?: 'up' | 'down' | 'stable';
    color?: string;
    subtext?: string;
}

interface StatsGridProps {
    stats: StatItem[];
}

const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
};

const trendColors = {
    up: 'var(--bio-emerald)',
    down: 'var(--danger-red)',
    stable: 'var(--text-muted)',
};

export default function StatsGrid({ stats }: StatsGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <GlassCard
                    key={stat.label}
                    className="flex items-start gap-4"
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{
                            background: 'var(--pulse-cyan-dim)',
                        }}
                    >
                        {stat.icon}
                    </div>
                    <div className="flex-1">
                        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
                            {stat.label}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <motion.span
                                className="text-2xl font-bold text-[var(--text-primary)]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                            >
                                {stat.value}
                            </motion.span>
                            {stat.trend && (
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: trendColors[stat.trend] }}
                                >
                                    {trendIcons[stat.trend]}
                                </span>
                            )}
                        </div>
                        {stat.subtext && (
                            <p className="text-[10px] text-[var(--pulse-cyan)] mt-1 font-medium tracking-wide">
                                {stat.subtext}
                            </p>
                        )}
                    </div>
                </GlassCard>
            ))}
        </div>
    );
}
