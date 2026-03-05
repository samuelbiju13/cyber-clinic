'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Prescription } from '@/types';

export function usePrescriptions(patientId?: string) {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            let query = supabase
                .from('prescriptions')
                .select(`
          *,
          items:prescription_items(*),
          doctor:profiles!prescriptions_doctor_id_fkey(full_name, specialization)
        `)
                .order('prescribed_date', { ascending: false });

            if (patientId) {
                query = query.eq('patient_id', patientId);
            }

            const { data } = await query;
            setPrescriptions((data as Prescription[]) || []);
            setLoading(false);
        }

        fetch();
    }, [patientId, supabase]);

    return { prescriptions, loading };
}
