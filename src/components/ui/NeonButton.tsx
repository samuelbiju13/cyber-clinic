'use client';

import { motion } from 'framer-motion';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

const variantStyles = {
    primary:
        'bg-[var(--pulse-cyan)] text-[var(--bg-void)] hover:shadow-[0_0_25px_var(--pulse-cyan-glow)]',
    secondary:
        'bg-transparent border border-[var(--pulse-cyan)] text-[var(--pulse-cyan)] hover:bg-[var(--pulse-cyan-dim)]',
    danger:
        'bg-[var(--danger-red)] text-white hover:shadow-[0_0_25px_var(--danger-red-dim)]',
};

const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
};

export default function NeonButton({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className = '',
    ...props
}: NeonButtonProps) {
    return (
        <motion.button
            className={`
        inline-flex items-center justify-center gap-2
        rounded-xl font-semibold
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-[var(--pulse-cyan)] focus:ring-offset-2 focus:ring-offset-[var(--bg-void)]
        disabled:opacity-40 disabled:cursor-not-allowed
        cursor-pointer
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            disabled={disabled || loading}
            {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                        cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="3"
                        fill="none" strokeDasharray="60" strokeLinecap="round"
                    />
                </svg>
            )}
            {children}
        </motion.button>
    );
}
