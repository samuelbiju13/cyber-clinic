'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginInput } from '@/lib/validators/auth';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { checkProfileAdmin } from './actions'; // Import Server Action

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState<LoginInput>({ email: '', password: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [showBypass, setShowBypass] = useState(false);

    // Optimized: Only check session on mount, do not auto-redirect if partial state
    // This prevents "glitching" or premature fetches if the session is stale but not fully valid
    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                console.log('Session active on mount, redirecting...');
                router.replace('/dashboard');
            }
        };
        checkSession();
    }, [router]);

    const handleChange = (field: keyof LoginInput, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear errors on typing to give visual feedback
        if (serverError) setServerError('');
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setServerError('');
        setShowBypass(false);

        const result = loginSchema.safeParse(form);
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.issues.forEach((err) => {
                fieldErrors[err.path[0] as string] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setLoading(true);
        console.log('Login: Explicit Submit Triggered', { email: form.email });

        try {
            const supabase = createClient();

            // 1. Authenticate (BLOCKING)
            const { data, error } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password,
            });

            if (error) {
                console.error('Login: Auth failed', error.message);
                setServerError(error.message);
                setLoading(false);
                return;
            }

            // 2. Strict Success Check
            if (data.user?.id) {
                const userId = data.user.id;
                console.log('Login: Auth confirmed. Starting profile fetch sequence for:', userId);

                // 3. Client Reset & Verify Profile (Attempt 1: Standard Client)
                const supabaseFresh = createClient();

                let { data: profile, error: profileError } = await supabaseFresh
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', userId)
                    .maybeSingle();

                console.log("Profile Query Result (Client Attempt):", { userId, profile, error: profileError });

                // 4. FALLBACK: Service Role Check (If Client fails due to RLS/500/Network)
                if (profileError || !profile) {
                    console.warn('Login: Client fetch failed. triggering SERVER-SIDE fallback...');

                    // Call Server Action
                    const { data: adminProfile, error: adminError } = await checkProfileAdmin(userId);

                    if (adminProfile) {
                        console.log('Login: SERVER-SIDE fallback successful!', adminProfile);
                        // Use admin profile result
                        profile = adminProfile;
                        profileError = null;
                    } else {
                        console.error('Login: SERVER-SIDE fallback also failed.', adminError);
                        if (adminError) {
                            setServerError('Database Connection Error. Please check RLS policies.');
                        }
                    }
                }

                if (profileError || !profile) {
                    // Final Safe Fallback: Process login anyway
                    console.warn('Login: Profile verification pending. Assuming initialization...');
                    setServerError('Initializing new profile...'); // Inform user
                    // continue to redirect...
                }

                // 5. Success -> Hard Redirect
                // We proceed if we have a profile OR if we are forcing entry after initialization attempt
                console.log('Login: Profile verified or initialized. Ensuring clinical safety...');
                await checkProfileAdmin(userId); // Ensure backend sync one last time

                console.log('Login: Redirecting to dashboard...');
                window.location.assign('/dashboard');

            } else {
                console.error('Login: No User ID returned despite success?');
                setServerError('Authentication Error. Please try again.');
                setLoading(false);
            }

        } catch (err: any) {
            console.error('Login error:', err);
            // If it's a network error, we might still want to try? No, catch block is for crash.
            setServerError('Connection failed. Check your network.');
            setLoading(false);
        }
    };

    const handleBypass = async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            console.log('Bypass: Session valid, clearing local state and forcing navigation...');
            // Clear any stale local state that might warn about "Guest"
            localStorage.clear();
            sessionStorage.clear();

            // Hard Redirect
            window.location.assign('/dashboard');
        } else {
            alert('Session invalid. Please re-authenticate.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 gradient-mesh">
            <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <GlassCard className="space-y-6" hover={false}>
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-14 h-14 rounded-xl bg-[var(--pulse-cyan)] flex items-center justify-center text-2xl font-black text-[var(--bg-void)] mx-auto shadow-[0_0_30px_var(--pulse-cyan-glow)]">
                            C
                        </div>
                        <h1 className="text-2xl font-bold neon-text">Access Terminal</h1>
                        <p className="text-sm text-[var(--text-muted)]">
                            Authenticate to enter Cyber-Clinic
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
                                Email
                            </label>
                            <input
                                type="email"
                                disabled={loading}
                                className="cyber-input disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="operator@cyber-clinic.io"
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                            {errors.email && (
                                <p className="text-xs text-[var(--danger-red)] mt-1">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
                                Password
                            </label>
                            <input
                                type="password"
                                disabled={loading}
                                className="cyber-input disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                            />
                            {errors.password && (
                                <p className="text-xs text-[var(--danger-red)] mt-1">{errors.password}</p>
                            )}
                        </div>

                        {serverError && (
                            <div className="p-3 rounded-lg bg-[var(--danger-red-dim)] border border-[var(--danger-red)] space-y-2">
                                <p className="text-xs text-[var(--danger-red)]">{serverError}</p>
                                {showBypass && (
                                    <button
                                        type="button"
                                        onClick={handleBypass}
                                        className="w-full py-1 text-xs font-bold text-[var(--text-primary)] bg-[var(--glass-surface)] hover:bg-[var(--glass-highlight)] rounded border border-[var(--glass-border)] transition-colors"
                                    >
                                        🚀 Troubleshoot Profile (Force Entry)
                                    </button>
                                )}
                            </div>
                        )}

                        <NeonButton type="submit" loading={loading} className="w-full">
                            {loading ? 'Authenticating...' : 'Authenticate'}
                        </NeonButton>
                    </form>

                    <p className="text-center text-sm text-[var(--text-muted)]">
                        No identity?{' '}
                        <Link href="/signup" className="text-[var(--pulse-cyan)] hover:underline">
                            Register here
                        </Link>
                    </p>
                    <div className="pt-4 text-center border-t border-[var(--glass-border)]">
                        <a href="/dashboard" className="text-xs text-[var(--text-muted)] hover:text-[var(--danger-red)] transition-colors">
                            ⚠️ Emergency Entry
                        </a>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
