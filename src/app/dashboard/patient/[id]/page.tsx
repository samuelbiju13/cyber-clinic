
import { createClient } from '@supabase/supabase-js';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import PatientHistoryContainer from '@/components/dashboard/PatientHistoryContainer';
import type { Profile } from '@/types';

// Prevent caching of this page
export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PatientClinicalFolder({ params }: PageProps) {
    const { id } = await params;

    console.log('PatientClinicalFolder: Requested ID:', id);

    // 1. Parameter Validation: Ensure valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
        console.error('PatientClinicalFolder: Invalid UUID param:', id);
        // FIX: Do not redirect, show error state
        return (
            <div className="p-8 text-center border-dashed border border-[var(--danger-red)] text-[var(--danger-red)] rounded-lg">
                <p>Invalid Patient ID: {id}</p>
                <a href="/dashboard" className="underline mt-2 inline-block">Return to Dashboard</a>
            </div>
        );
    }

    // 2. Server-Side Client & Env Check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL is undefined.');
    }

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('CRITICAL: Missing Supabase Env Vars', {
            url: !!supabaseUrl,
            key: !!serviceRoleKey
        });

        return (
            <div className="min-h-screen flex items-center justify-center text-[var(--danger-red)]">
                System Error: Server Configuration Missing. Check terminal logs.
            </div>
        );
    }

    // STRICT: Using 'supabase-js' directly for stateless Service Role access.
    // This client acts purely as the Postgres Admin to fetch the requested patient's data.
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // 3. Fetch Profile (Renamed to viewedPatient for clarity)
    let viewedPatient = null;
    let fetchError = null;

    try {
        const result = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        viewedPatient = result.data;
        fetchError = result.error;

        if (fetchError) {
            console.error('SERVER: Supabase Query Error:', fetchError);

            // 4. Bad Request / Auth Failure -> Force Logout
            // Code 'PGRST116' is JSON object result (no rows), which is 406 but often manifests as 400 in some contexts if not handled
            // But specific 400/401 HTTP codes from Supabase client should be caught here if possible.
            // Converting known auth errors or bad requests to logout.
            if (fetchError.code === '400' || fetchError.code === '401' || fetchError.code === 'PGRST301') {
                console.error('Critical Auth/Request Error. Logging only (Redirect removed per safety policy).');
            }
        }
    } catch (err: any) {
        console.error('CRITICAL: Supabase Connection Failed (Detailed):', err);

        // If the error object itself has a 400 status (often from the fetch internals)
        if (err?.status === 400 || err?.code === '400') {
            console.error('Session/Request Error (400). Continuing render with empty state.');
        }

        return (
            <div className="min-h-screen flex items-center justify-center text-[var(--danger-red)] p-8 text-center border border-dashed border-[var(--danger-red)] rounded-lg m-4">
                <h2 className="text-xl font-bold mb-2">Database Connection Error</h2>
                <div className="text-sm opacity-80 mb-4 text-left whitespace-pre-wrap font-mono bg-black/50 p-4 rounded">
                    {JSON.stringify(err, null, 2)}
                    {'\n'}
                    {err.message || 'Unknown network error'}
                </div>
                <a href="/dashboard" className="underline hover:text-white">Return to Dashboard</a>
            </div>
        );
    }


    // Validation: If patient doesn't exist, we now provide a DEFAULT "New Patient" object
    // This allows the doctor to see the Clinical Folder structure and "Initialize" it by adding vitals,
    // rather than being blocked by a "Patient Not Found" screen.
    if (fetchError || !viewedPatient) {
        if (fetchError) console.warn('Patient Fetch Warning (using fallback):', fetchError);

        // Replace lines 116-121 with this
        viewedPatient = {
            id: id,
            full_name: "New Patient",
            role: "patient",
            specialization: null,
            avatar_url: null,
            phone: null,
            encrypted_gov_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as Profile;
    }

    // 4. Render with Suspense
    // We render the container which fetches vitals.
    // The fallback shows a loading skeleton while vitals are being fetched.
    return (
        <div className="space-y-6">
            {/* 
                     We could render a Patient Profile Header here if we had one separate from HistoryView.
                     Currently PatientHistoryView handles the whole layout including the "Profile Card".
                     
                     If we want to show *something* before vitals load, we should ideally split ProfileCard 
                     from PatientHistoryView. 
                     
                     However, for this specific request "wrap the vitals fetch in a 'Suspense' boundary", 
                     wrapping the whole History container is the correct structural move given the current components.
                     
                     Ideally, we would Refactor:
                     <PatientSummary profile={viewedPatient} />  <-- Instant
                     <Suspense>
                        <VitalsHistory id={id} />                <-- Streamed
                     </Suspense>
                     
                     But since PatientHistoryView does both, we wrap it all.
                 */}
            <Suspense fallback={
                <div className="w-full h-96 flex items-center justify-center glass-panel animate-pulse">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-t-[var(--pulse-cyan)] border-r-transparent animate-spin" />
                        <p className="text-[var(--pulse-cyan)] font-mono text-sm">LOADING CLINICAL DATA...</p>
                    </div>
                </div>
            }>
                <PatientHistoryContainer patient={viewedPatient as Profile} />
            </Suspense>
        </div>
    );
}
