'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
    { href: '/dashboard', label: 'Neural Dashboard', icon: '🧠' },
    { href: '/history', label: 'History', icon: '📜' },
    { href: '/dashboard/prescriptions', label: 'Prescriptions', icon: '💊' },
    { href: '/dashboard/ai-auditor', label: 'AI Auditor', icon: '🧬' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 glass-panel-static rounded-none border-r border-[var(--glass-border)] z-40 hidden lg:flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--glass-border)]">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--pulse-cyan)] flex items-center justify-center text-lg font-black text-[var(--bg-void)]">
                        C
                    </div>
                    <div>
                        <h1 className="text-lg font-bold neon-text">Cyber-Clinic</h1>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                            Hospital OS v2.0
                        </p>
                    </div>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-xl
                  text-sm font-medium transition-colors duration-200
                  ${isActive
                                        ? 'text-[var(--pulse-cyan)] bg-[var(--pulse-cyan-dim)]'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.03)]'
                                    }
                `}
                                whileHover={{ x: 4 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isActive && (
                                    <motion.div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[var(--pulse-cyan)]"
                                        layoutId="sidebar-indicator"
                                        style={{
                                            boxShadow: '0 0 10px var(--pulse-cyan)',
                                        }}
                                    />
                                )}
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--glass-border)]">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <div className="w-2 h-2 rounded-full bg-[var(--bio-emerald)] pulse-ring" />
                    <span>System Online</span>
                </div>
            </div>
        </aside>
    );
}
