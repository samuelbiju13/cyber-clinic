'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types';

export function useAuth() {
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const fetchedRef = useRef(false);
    const router = useRouter();

    const fetchProfile = useCallback(async (force = false) => {
        if (fetchedRef.current && !force) return;
        fetchedRef.current = true;
        setLoading(true);
        setAuthError(null);

        const supabase = createClient();

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                setUser(null);
                setLoading(false);
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (profileError) {
                console.warn('useAuth: Profile fetch error', profileError);

                // 1. Recursion Check (42P17)
                if (profileError.code === '42P17') {
                    console.error('CRITICAL: Infinite Recursion Detected (42P17). Halting.');
                    setAuthError('Administrative Reset Required: Recursive Policy Error');
                    // Do NOT set a guest user here, as it might trigger components to fetch more data and loop again.
                    // We leave user as null or partial? 
                    // User asked for "Administrative Reset Required" message. 
                    // Best to set a limited guest state but ENSURE downstream components check error.
                    // Actually, to be safe, let's keep user NULL or specific 'error' state if possible.
                    // But existing code uses 'guest'. 
                    // Let's set guest but ensure we flag it.
                    setUser({
                        id: session.user.id,
                        role: 'guest',
                        full_name: 'System Error',
                        updated_at: new Date().toISOString()
                    } as Profile);
                    return; // Stop here
                }

                setUser({
                    id: session.user.id,
                    role: 'guest',
                    full_name: 'Guest User',
                    updated_at: new Date().toISOString()
                } as Profile);
            } else {
                setUser(profile);
                if (profile.role && profile.role !== 'guest') {
                    const isPublic = window.location.pathname === '/' || window.location.pathname === '/login';
                    if (isPublic) {
                        router.refresh();
                        router.replace('/dashboard');
                    }
                }
            }

        } catch (err: any) {
            console.error('useAuth: Critical error', err);
            setAuthError(err.message || 'Unexpected Auth Error');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchProfile();
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                fetchedRef.current = false;
            }
        });
        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    const signOut = async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setUser(null);
            window.location.href = '/login';
        }
    };

    // 2. Manual Refresh
    const refreshProfile = () => {
        console.log('useAuth: Manual Hard Refresh...');
        setUser(null); // Clear local state first
        setAuthError(null);
        fetchedRef.current = false; // Allow re-fetch
        fetchProfile(true);
    };

    return { user, loading, signOut, refreshProfile, authError };
}
