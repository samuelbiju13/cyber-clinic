'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function issueQuickPrescription(prevState: any, formData: FormData) {
    const cookieStore = await cookies();

    // 1. Auth Client (to identify the Doctor)
    const supabaseAnon = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { }, // Server Action doesn't need to set auth cookies usually
            },
        }
    );

    const { data: { user } } = await supabaseAnon.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized: Doctor not logged in' };
    }

    // SESSION GUARD
    await supabaseAnon.auth.refreshSession();

    // 2. Service Role Client (to write Checkup/Rx bypassing RLS if needed)
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );

    const patientId = formData.get('patientId') as string;
    const drugName = formData.get('drug_name') as string;
    const dosage = formData.get('dosage') as string;
    const durationDays = parseInt(formData.get('duration_days') as string);
    const instructions = formData.get('instructions') as string || 'Take as directed';

    if (!patientId || !drugName || !dosage || !durationDays) {
        return { error: 'Missing required fields' };
    }

    try {
        // A. Auto-Create "Quick Consult" Checkup (Required by Schema)
        const { data: checkup, error: checkupError } = await supabaseAdmin
            .from('checkups')
            .insert({
                patient_id: patientId,
                doctor_id: user.id,
                checkup_date: new Date().toISOString(),
                diagnosis: 'Speed Prescription (Auto-Generated)',
                notes: 'Quick Rx issued via Dashboard Shortcuts',
                status: 'completed'
            })
            .select()
            .maybeSingle();

        if (checkupError) throw checkupError;
        if (!checkup) throw new Error('Failed to create checkup record');

        // B. Create Prescription
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + durationDays);

        const { data: prescription, error: rxError } = await supabaseAdmin
            .from('prescriptions')
            .insert({
                checkup_id: checkup.id,
                patient_id: patientId,
                doctor_id: user.id,
                prescribed_date: new Date().toISOString(),
                valid_until: validUntil.toISOString(),
                status: 'active',
                ai_audit_status: 'pending'
            })
            .select()
            .maybeSingle();

        if (!prescription) throw new Error('Failed to create prescription');

        if (rxError) throw rxError;

        // C. Create Prescription Item
        const { error: itemError } = await supabaseAdmin
            .from('prescription_items')
            .insert({
                prescription_id: prescription.id,
                drug_name: drugName,
                dosage: dosage,
                frequency: 'As needed', // Default for Quick Rx
                duration_days: durationDays,
                instructions: instructions
            });

        if (itemError) throw itemError;

    } catch (error: any) {
        console.error('Quick Rx Error:', error);
        return { error: error.message || 'Failed to issue prescription' };
    }

    // Success redirect
    redirect('/dashboard');
}
