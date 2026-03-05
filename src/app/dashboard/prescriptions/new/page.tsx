import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import QuickPrescriptionForm from '@/components/dashboard/QuickPrescriptionForm';
import ScanLine from '@/components/ui/ScanLine';
import NeonButton from '@/components/ui/NeonButton';

export default async function QuickPrescriptionPage({ searchParams }: { searchParams: Promise<{ patientId: string }> }) {
    const { patientId } = await searchParams;

    if (!patientId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="text-[var(--danger-red)] text-xl font-bold">
                    Error: Missing Patient Context
                </div>
                <p className="text-[var(--text-muted)]">
                    Please return to the Patient Registry and select "Issue Rx".
                </p>
                <a href="/dashboard" className="px-4 py-2 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded hover:border-[var(--pulse-cyan)] transition-colors">
                    Return to Dashboard
                </a>
            </div>
        );
    }

    // Server Action (Inline) for Service Role Access
    async function issuePrescriptionAction(formData: FormData) {
        'use server';

        const cookieStore = await cookies();

        // 1. Auth Check (Doctor)
        const supabaseAnon = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
        );
        const { data: { user } } = await supabaseAnon.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        // 2. Service Role Write
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
        );

        const patient_id = formData.get('patient_id') as string;
        const drugName = formData.get('medication_name') as string; // Mapped from UI
        const dosage = formData.get('dosage') as string;
        const duration = formData.get('duration') as string;
        const instructions = formData.get('instructions') as string || '';

        // A. Auto-Create Checkup
        const { data: checkup, error: checkupError } = await supabaseAdmin
            .from('checkups')
            .insert({
                patient_id: patient_id,
                doctor_id: user.id,
                checkup_date: new Date().toISOString(),
                diagnosis: 'Speed Prescription',
                status: 'completed'
            })
            .select()
            .single();

        if (checkupError) {
            console.error('Checkup create failed:', checkupError);
            throw new Error('Failed to init checkup');
        }

        // B. Create Prescription
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + parseInt(duration || '7'));

        const { data: rx, error: rxError } = await supabaseAdmin
            .from('prescriptions')
            .insert({
                checkup_id: checkup.id,
                patient_id: patient_id,
                doctor_id: user.id,
                prescribed_date: new Date().toISOString(),
                valid_until: validUntil.toISOString(),
                status: 'active'
            })
            .select()
            .single();

        if (rxError) {
            console.error('Rx header failed:', rxError);
            throw new Error('Failed to create Rx header');
        }

        // C. Create Items (Schema Mapped: drug_name, duration_days)
        const { error: itemError } = await supabaseAdmin
            .from('prescription_items')
            .insert({
                prescription_id: rx.id,
                drug_name: drugName,
                dosage: dosage,
                frequency: 'As needed',
                duration_days: parseInt(duration || '7'),
                instructions: instructions
            });

        if (itemError) {
            console.error('Rx item failed:', itemError);
            throw new Error('Failed to add meds');
        }

        redirect('/dashboard');
    }

    // Service Role Fetch for Patient Name
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );

    const { data: patient } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', patientId)
        .single();

    return (
        <div className="space-y-8 relative pb-12">
            <ScanLine />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold neon-text mb-1">Quick Prescription Issue</h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        Patient: <span className="text-[var(--pulse-cyan)]">{patient?.full_name || 'Unknown ID'}</span>
                    </p>
                </div>
                <a href="/dashboard" className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                    Cancel
                </a>
            </div>

            {/* Form */}
            <div className="max-w-2xl mx-auto">
                <QuickPrescriptionForm patientId={patientId} action={issuePrescriptionAction} />
            </div>

            <div className="text-center text-xs text-[var(--text-dim)] mt-8">
                * This will automatically create a "Quick Consult" record for compliance.
            </div>
        </div>
    );
}
