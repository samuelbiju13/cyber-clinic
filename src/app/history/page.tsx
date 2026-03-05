import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DoctorHistoryView from '@/components/history/DoctorHistoryView';
import TimelineItem from '@/components/archives/TimelineItem';
import ScanLine from '@/components/ui/ScanLine';
import type { Checkup, Vitals, Prescription } from '@/types';

export default async function HistoryPage() {
    const cookieStore = await cookies();

    // 1. Auth Check
    const supabaseAnon = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );
    const { data: { user } } = await supabaseAnon.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const isDoctor = user.user_metadata?.role === 'doctor';

    // 2. Doctor: Universal Access (Service Role)
    if (isDoctor) {
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
        );

        // Fetch ALL Vitals
        const { data: vitals } = await supabaseAdmin
            .from('vitals')
            .select(`
                *,
                patient:profiles!patient_id(*)
            `)
            .order('recorded_at', { ascending: false });

        // Fetch ALL Prescriptions
        const { data: prescriptions } = await supabaseAdmin
            .from('prescriptions')
            .select(`
                *,
                patient:profiles!patient_id(*),
                items:prescription_items(*)
            `)
            .order('prescribed_date', { ascending: false });

        return (
            <div className="space-y-8 relative">
                <ScanLine />
                <div>
                    <h1 className="text-3xl font-bold neon-text mb-1">Medical Archives</h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        Universal Records Registry
                    </p>
                </div>
                <DoctorHistoryView
                    vitals={(vitals || []) as Vitals[]}
                    prescriptions={(prescriptions || []) as Prescription[]}
                />
            </div>
        );
    }

    // 3. Patient: Personal Timeline (Standard RLS)
    // Replicating useCheckups logic server-side
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );

    const { data: rawCheckups } = await supabase
        .from('checkups')
        .select(`
            *,
            doctor:profiles!doctor_id(*),
            vitals(*)
        `)
        .eq('patient_id', user.id)
        .order('checkup_date', { ascending: false });

    // Sanitize vitals (Supabase returns array for one-to-many, we need single object for UI)
    const checkups = rawCheckups?.map(checkup => ({
        ...checkup,
        vitals: Array.isArray(checkup.vitals) ? checkup.vitals[0] : checkup.vitals
    }));

    return (
        <div className="space-y-8 relative">
            <ScanLine />
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold neon-text mb-1">Medical History</h1>
                <p className="text-sm text-[var(--text-muted)]">
                    Chronological timeline of your health journey
                </p>
            </div>

            {/* Timeline */}
            <div className="max-w-3xl">
                {(checkups && checkups.length > 0) ? (
                    checkups.map((checkup, index) => (
                        <TimelineItem key={checkup.id} checkup={checkup as Checkup} index={index} />
                    ))
                ) : (
                    <div className="p-8 text-center text-[var(--text-muted)] border border-dashed border-[var(--glass-border)] rounded-lg">
                        <p>No medical history found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
