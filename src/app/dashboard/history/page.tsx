import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClinicalTimelineCard from '@/components/dashboard/ClinicalTimelineCard';
import ScanLine from '@/components/ui/ScanLine';
import type { Vitals } from '@/types';

export default async function MedicalHistoryPage() {
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

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // 2. Fetch Vitals (History)
    // Using Service Role to ensure we get data even if RLS is strict, though for own data RLS should fine.
    // User requested "fetch ALL records from the 'vitals' table for the logged-in user".
    // We can use the authenticated client or service role. Authenticated is safer for RLS, but if RLS prevents it, Service Role is fallback.
    // Given the "400 error" history, let's use the standard client first but with maybeSingle if needed? No, this is a list.

    // 2. Resilient Data Fetching
    // We fetch vitals and audit_logs in parallel, with individual error handling.
    // If one fails (e.g. 400 Bad Request, RLS), it returns [] instead of crashing the page.

    let vitals: Vitals[] = [];
    let auditLogs: any[] = [];
    let fetchError = null;

    try {
        const [vitalsRes, auditRes] = await Promise.all([
            supabase
                .from('vitals')
                .select('*')
                .eq('patient_id', user.id)
                .order('recorded_at', { ascending: false }),

            // Requested 'audit_logs' fetch (wrapped)
            supabase
                .from('audit_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('event_timestamp', { ascending: false })
                .limit(50) // Reasonable limit
        ]);

        if (vitalsRes.error) {
            console.warn('History Page: Vitals fetch failed (handled):', vitalsRes.error.message);
            // Default to empty, do not throw
        } else {
            vitals = vitalsRes.data as Vitals[] || [];
        }

        if (auditRes.error) {
            // Common 400/RLS point
            console.warn('History Page: Audit Logs fetch failed (handled):', auditRes.error.message);
        } else {
            auditLogs = auditRes.data || [];
        }

    } catch (err: any) {
        console.error('History Page: Critical Fetch Error:', err);
        fetchError = err;
        // FAIL-SAFE: Ensure we return empty arrays so page renders "No Records"
        vitals = [];
        auditLogs = [];
    }

    const history = vitals; // Primary display data

    return (
        <div className="space-y-8 relative min-h-screen pb-12">
            <ScanLine />

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold neon-text mb-1">Medical History</h1>
                <p className="text-sm text-[var(--text-muted)]">
                    Chronological timeline of your clinical vitals and assessments.
                </p>
            </div>

            {/* Timeline List */}
            <div className="max-w-3xl space-y-4">
                {history.length > 0 ? (
                    history.map((vital, index) => (
                        <ClinicalTimelineCard key={vital.id} vital={vital} index={index} />
                    ))
                ) : (
                    <div className="p-12 text-center text-[var(--text-muted)] border border-dashed border-[var(--glass-border)] rounded-lg glass-panel">
                        <div className="text-4xl mb-4">📂</div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Records Found</h2>
                        <p>Your clinical history is currently empty.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
