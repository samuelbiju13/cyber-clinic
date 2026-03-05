import { type Role } from '@/types';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server-side role guard — redirects if the current user's role
 * does not match one of the allowed roles.
 */
export async function requireRole(allowedRoles: Role[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !allowedRoles.includes(profile.role as Role)) {
        redirect('/dashboard');
    }

    return { user, role: profile.role as Role };
}

/**
 * Check if a user has one of the allowed roles (non-redirecting).
 */
export async function hasRole(allowedRoles: Role[]): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return !!profile && allowedRoles.includes(profile.role as Role);
}
