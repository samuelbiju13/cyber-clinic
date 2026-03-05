import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import DoctorPrescriptionsList from '@/components/dashboard/DoctorPrescriptionsList';
import PrescriptionCard from '@/components/dashboard/PrescriptionCard';
import type { Prescription, Profile } from '@/types';

// Force dynamic to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function PrescriptionsPage() {
    // 1. Authenticate User
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // 2. Initialize Service Role Client (for Data Fetching)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceRoleKey) {
        return (
            <div className="p-8 text-[var(--danger-red)]">
                Critical Error: Server configuration missing.
            </div>
        );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // 3. Fetch User Profile to determine Role
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // SAFETY: No 400s if missing

    if (profileError || !profile) {
        console.error('Profile fetch failed:', profileError);
        return <div>Error loading user profile.</div>;
    }

    const userProfile = profile as Profile;
    let prescriptions: Prescription[] = [];
    let fetchError = null;

    // 4. Fetch Prescriptions based on Role
    try {
        if (userProfile.role === 'doctor') {
            // Doctor: Fetch ALL prescriptions
            const { data, error } = await supabaseAdmin
                .from('prescriptions')
                .select(`
                    *,
                    items:prescription_items(*),
                    patient:profiles!patient_id(*),
                    doctor:profiles!doctor_id(*)
                `)
                .order('prescribed_date', { ascending: false });

            if (error) {
                console.warn('Doctor prescriptions fetch warning:', error.message);
                // Do not throw, default to empty
            } else {
                prescriptions = data as Prescription[];
            }
        } else {
            // Patient: Fetch OWN prescriptions
            const { data, error } = await supabaseAdmin
                .from('prescriptions')
                .select(`
                    *,
                    items:prescription_items(*),
                    doctor:profiles!doctor_id(*)
                `)
                .eq('patient_id', user.id)
                .order('valid_until', { ascending: true }); // Show expiring soon first

            if (error) {
                console.warn('Patient prescriptions fetch warning:', error.message);
                // Do not throw, default to empty
            } else {
                prescriptions = data as Prescription[];
            }
        }
    } catch (err: any) {
        console.error('Prescriptions fetch error (Safe Fallback):', err);
        // Page continues to render with empty list
    }

    // 5. Render View
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <header>
                <h1 className="text-2xl font-bold neon-text mb-2">
                    {userProfile.role === 'doctor' ? 'Prescription Registry' : 'My Medications'}
                </h1>
                <p className="text-[var(--text-muted)]">
                    {userProfile.role === 'doctor'
                        ? 'Manage and audit active prescriptions.'
                        : 'Track your active prescriptions and refill schedules.'}
                </p>
            </header>

            {fetchError ? (
                <div className="p-4 border border-dashed border-[var(--warning-yellow)] rounded text-[var(--warning-yellow)]">
                    Note: Unable to sync latest prescriptions. Showing cached/empty view.
                </div>
            ) : (
                <>
                    {userProfile.role === 'doctor' ? (
                        <DoctorPrescriptionsList initialPrescriptions={prescriptions} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {prescriptions.length > 0 ? (
                                prescriptions.map(rx => (
                                    <PrescriptionCard key={rx.id} prescription={rx} />
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-[var(--text-muted)]">
                                    No active prescriptions found.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
