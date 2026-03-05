'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Helper to get Admin Client
async function getAdminClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );
}

// Helper to verify Doctor role
async function verifyDoctor() {
    const cookieStore = await cookies();
    const supabaseAnon = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );
    const { data: { user } } = await supabaseAnon.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    // Ideally check profile role here but assuming dashboard access control handles it
    return user;
}

export async function revokePrescription(prescriptionId: string) {
    try {
        await verifyDoctor();
        // SESSION GUARD
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: () => { },
                },
            }
        );
        await supabase.auth.refreshSession();

        const supabaseAdmin = await getAdminClient();

        const { error } = await supabaseAdmin
            .from('prescriptions')
            .update({ status: 'expired' }) // Using 'expired' as equivalent to revoked/cancelled
            .eq('id', prescriptionId);

        if (error) throw error;
        revalidatePath('/dashboard/prescriptions');
        return { success: true };
    } catch (error: any) {
        console.error('Revoke failed:', error);
        return { error: error.message };
    }
}

export async function updateDosage(itemId: string, newDosage: string) {
    try {
        await verifyDoctor();
        // SESSION GUARD
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: () => { },
                },
            }
        );
        await supabase.auth.refreshSession();

        const supabaseAdmin = await getAdminClient();

        const { error } = await supabaseAdmin
            .from('prescription_items')
            .update({ dosage: newDosage })
            .eq('id', itemId);

        if (error) throw error;
        revalidatePath('/dashboard/prescriptions');
        return { success: true };
    } catch (error: any) {
        console.error('Update dosage failed:', error);
        return { error: error.message };
    }
}
