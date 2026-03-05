'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '🧠' },
    { href: '/history', label: 'History', icon: '📜' },
    { href: '/dashboard/prescriptions', label: 'Rx', icon: '💊' },
    { href: '/dashboard/ai-auditor', label: 'Auditor', icon: '🧬' },
];

export default function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel-static rounded-none border-t border-[var(--glass-border)]">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-lg
                transition-colors duration-200
                ${isActive
                                    ? 'text-[var(--pulse-cyan)]'
                                    : 'text-[var(--text-muted)]'
                                }
              `}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-[10px] font-medium">{item.label}</span>
                            {isActive && (
                                <div
                                    className="absolute bottom-0 w-8 h-0.5 rounded-full bg-[var(--pulse-cyan)]"
                                    style={{ boxShadow: '0 0 8px var(--pulse-cyan)' }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
