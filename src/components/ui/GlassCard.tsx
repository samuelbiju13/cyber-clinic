'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
    children: ReactNode;
    className?: string;
    glow?: 'cyan' | 'emerald' | 'danger' | 'none';
    hover?: boolean;
}

const glowStyles = {
    cyan: 'neon-border',
    emerald: 'emerald-glow border border-[var(--bio-emerald)]',
    danger: 'danger-glow border border-[var(--danger-red)]',
    none: '',
};

export default function GlassCard({
    children,
    className = '',
    glow = 'none',
    hover = true,
    ...motionProps
}: GlassCardProps) {
    return (
        <motion.div
            className={`
        ${hover ? 'glass-panel' : 'glass-panel-static'}
        ${glowStyles[glow]}
        p-6 ${className}
      `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            {...motionProps}
        >
            {children}
        </motion.div>
    );
}
