import { z } from 'zod';

export const vitalsSchema = z.object({
    pulse_bpm: z.number().int().min(30).max(250),
    bp_systolic: z.number().int().min(50).max(250),
    bp_diastolic: z.number().int().min(30).max(180),
    spo2: z.number().min(0).max(100),
    temperature_f: z.number().min(90).max(115).nullable().optional(),
    weight_kg: z.number().min(1).max(500).nullable().optional(),
});

export const checkupSchema = z.object({
    patient_id: z.string().uuid(),
    doctor_id: z.string().uuid(),
    checkup_date: z.string().datetime(),
    diagnosis: z.string().min(1, 'Diagnosis is required'),
    notes: z.string().optional(),
    report_url: z.string().url().optional().or(z.literal('')),
    status: z.enum(['scheduled', 'completed', 'cancelled']),
    vitals: vitalsSchema.optional(),
});

export type VitalsInput = z.infer<typeof vitalsSchema>;
export type CheckupInput = z.infer<typeof checkupSchema>;
