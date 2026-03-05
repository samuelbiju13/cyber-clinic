'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Checkup } from '@/types';

export function useCheckups(patientId?: string) {
    const [checkups, setCheckups] = useState<Checkup[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            let query = supabase
                .from('checkups')
                .select(`
          *,
          doctor:profiles!checkups_doctor_id_fkey(full_name, specialization),
          vitals(*)
        `)
                .order('checkup_date', { ascending: false });

            if (patientId) {
                query = query.eq('patient_id', patientId);
            }

            const { data } = await query;
            setCheckups((data as Checkup[]) || []);
            setLoading(false);
        }

        fetch();
    }, [patientId, supabase]);

    return { checkups, loading };
}
