'use client';

import { useAuth } from '@/hooks/useAuth';
import NeonButton from '@/components/ui/NeonButton';
import { useRouter } from 'next/navigation';

export default function TopBar() {
    const { user, signOut, refreshProfile, authError } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        // Force header refresh to clear Supabase/Next.js cache
        window.location.href = '/login';
    };

    const isGuest = user?.role === 'guest';

    return (
        <header className="sticky top-0 z-30 glass-panel-static rounded-none border-b border-[var(--glass-border)]">
            {/* Guest Mode / Error Warning Banner */}
            {(isGuest || authError) && (
                <div className="bg-[var(--danger-red)] text-white text-xs font-bold px-4 py-1 text-center animate-pulse flex items-center justify-center gap-2">
                    <span>
                        ⚠️ {authError || 'Guest Mode: Profile Fetch Failed'}
                    </span>
                    <button
                        onClick={() => refreshProfile()}
                        className="underline hover:no-underline bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider"
                    >
                        Retry Connection
                    </button>
                    {authError?.includes('Recursive') && (
                        <span className="opacity-70 font-mono text-[10px]">(Error 42P17)</span>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between h-16 px-6">
                {/* Mobile logo */}
                <div className="lg:hidden flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--pulse-cyan)] flex items-center justify-center text-sm font-black text-[var(--bg-void)]">
                        C
                    </div>
                    <span className="text-sm font-bold neon-text">Cyber-Clinic</span>
                </div>

                <div className="hidden lg:block" />

                {/* Right section */}
                <div className="flex items-center gap-4">
                    {user && (
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                    {user.full_name}
                                </p>
                                <p className="text-[10px] uppercase tracking-wider text-[var(--pulse-cyan)]">
                                    {user.role}
                                    {user.specialization && ` · ${user.specialization}`}
                                </p>
                            </div>
                            <div className={`w-9 h-9 rounded-full border border-[var(--glass-border)] flex items-center justify-center text-sm ${isGuest ? 'bg-[var(--danger-red)] text-white' : 'bg-[var(--pulse-cyan-dim)]'}`}>
                                {user.full_name?.[0]?.toUpperCase() || '?'}
                            </div>
                        </div>
                    )}
                    <NeonButton variant="secondary" size="sm" onClick={handleSignOut}>
                        Logout
                    </NeonButton>
                    <button
                        onClick={async () => {
                            console.warn('Manual Session Purge Initiated');
                            await signOut();
                            window.location.href = '/login?purged=true';
                        }}
                        className="text-[10px] text-[var(--danger-red)] uppercase tracking-wider hover:underline ml-2"
                        title="Clear Session Cache"
                    >
                        [PURGE]
                    </button>
                </div>
            </div>
        </header>
    );
}
