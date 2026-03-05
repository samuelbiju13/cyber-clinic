import { z } from 'zod';

export const prescriptionItemSchema = z.object({
    drug_name: z.string().min(1, 'Drug name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    frequency: z.string().min(1, 'Frequency is required'),
    duration_days: z.number().int().min(1, 'Minimum 1 day'),
    instructions: z.string().optional(),
});

export const prescriptionSchema = z.object({
    checkup_id: z.string().uuid(),
    patient_id: z.string().uuid(),
    doctor_id: z.string().uuid(),
    prescribed_date: z.string().datetime(),
    valid_until: z.string().datetime(),
    status: z.enum(['active', 'expired', 'refilled']),
    items: z.array(prescriptionItemSchema).min(1, 'At least one medication required'),
});

export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
