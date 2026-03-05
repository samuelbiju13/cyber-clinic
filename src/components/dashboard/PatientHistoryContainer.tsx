import { createClient } from '@supabase/supabase-js';
import type { Profile, Vitals } from '@/types';
import PatientHistoryView from './PatientHistoryView';

interface PatientHistoryContainerProps {
    patient: Profile;
}

export default async function PatientHistoryContainer({ patient }: PatientHistoryContainerProps) {
    // Service Role Client for consistent access
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    console.log(`HistoryContainer: Fetching vitals for ${patient.full_name}...`);

    let vitals: Vitals[] = [];
    try {
        // Artificial delay to demonstrate Suspense (optional, but good for verification)
        // await new Promise(resolve => setTimeout(resolve, 1000));

        const { data, error } = await supabaseAdmin
            .from('vitals')
            .select('*')
            .eq('patient_id', patient.id)
            .order('recorded_at', { ascending: false });

        if (error) {
            // PGRST116: JSON object requested, multiple (or no) rows returned
            // Although we use select('*'), if we ever switched to .single(), this would trigger.
            // User requested explicit suppression.
            if (error.code === 'PGRST116') {
                console.warn('HistoryContainer: No vitals found (PGRST116). Returning empty.');
                vitals = [];
            } else {
                console.error('HistoryContainer Error:', error);
            }
        } else {
            vitals = data as Vitals[];
        }
    } catch (err) {
        console.error('HistoryContainer Exception:', err);
    }

    return (
        <PatientHistoryView
            patient={patient}
            vitals={vitals}
        />
    );
}
