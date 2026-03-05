'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTimeRemaining } from '@/lib/utils/dates';

interface CountdownTimerProps {
    targetDate: string;
    label?: string;
    onExpire?: () => void;
}

export default function CountdownTimer({
    targetDate,
    label = 'Time to Refill',
    onExpire,
}: CountdownTimerProps) {
    const [time, setTime] = useState(getTimeRemaining(targetDate));

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = getTimeRemaining(targetDate);
            setTime(remaining);
            if (remaining.expired) {
                clearInterval(interval);
                onExpire?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate, onExpire]);

    const segments = [
        { value: time.days, label: 'D' },
        { value: time.hours, label: 'H' },
        { value: time.minutes, label: 'M' },
        { value: time.seconds, label: 'S' },
    ];

    return (
        <div className="flex flex-col items-center gap-2">
            {label && (
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                    {label}
                </span>
            )}
            <div className="flex items-center gap-1">
                {segments.map((seg, i) => (
                    <div key={seg.label} className="flex items-center gap-1">
                        <div className="flex flex-col items-center">
                            <AnimatePresence mode="popLayout">
                                <motion.span
                                    key={seg.value}
                                    className={`
                    inline-block w-9 text-center rounded-md py-1
                    font-mono text-base font-bold
                    ${time.expired
                                            ? 'bg-[var(--danger-red-dim)] text-[var(--danger-red)]'
                                            : 'bg-[var(--pulse-cyan-dim)] text-[var(--pulse-cyan)]'
                                        }
                  `}
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 10, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {String(seg.value).padStart(2, '0')}
                                </motion.span>
                            </AnimatePresence>
                            <span className="text-[9px] text-[var(--text-muted)] mt-0.5">
                                {seg.label}
                            </span>
                        </div>
                        {i < segments.length - 1 && (
                            <span className="text-[var(--text-muted)] font-mono text-xs mb-3">:</span>
                        )}
                    </div>
                ))}
            </div>
            {time.expired && (
                <span className="text-xs text-[var(--danger-red)] font-medium animate-pulse">
                    Expired — Refill needed
                </span>
            )}
        </div>
    );
}
