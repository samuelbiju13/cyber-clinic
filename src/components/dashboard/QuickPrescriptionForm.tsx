'use client';

import { useFormStatus } from 'react-dom';
import NeonButton from '@/components/ui/NeonButton';
import GlassCard from '@/components/ui/GlassCard';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <NeonButton type="submit" variant="primary" disabled={pending} className="w-full justify-center">
            {pending ? 'Issuing Rx...' : 'Finish & Issue Rx'}
        </NeonButton>
    );
}

interface QuickPrescriptionFormProps {
    patientId: string;
    action: (formData: FormData) => Promise<void>;
}

export default function QuickPrescriptionForm({ patientId, action }: QuickPrescriptionFormProps) {
    return (
        <GlassCard className="border-[var(--pulse-cyan)]">
            <form action={action} className="space-y-6">
                <input type="hidden" name="patient_id" value={patientId} />

                <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                        Medication Name
                    </label>
                    <input
                        type="text"
                        name="medication_name" // User requested name
                        required
                        className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-md p-3 text-white focus:border-[var(--pulse-cyan)] outline-none"
                        placeholder="e.g. Amoxicillin 500mg"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                            Dosage
                        </label>
                        <input
                            type="text"
                            name="dosage"
                            required
                            className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-md p-3 text-white focus:border-[var(--pulse-cyan)] outline-none"
                            placeholder="e.g. 1 tablet"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                            Duration (Days)
                        </label>
                        <input
                            type="number"
                            name="duration" // User requested name
                            required
                            min="1"
                            defaultValue="7"
                            className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-md p-3 text-white focus:border-[var(--pulse-cyan)] outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                        Instructions / Notes
                    </label>
                    <textarea
                        name="instructions"
                        rows={3}
                        className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-md p-3 text-white focus:border-[var(--pulse-cyan)] outline-none resize-none"
                        placeholder="e.g. Take with food..."
                    />
                </div>

                <div className="pt-4">
                    <SubmitButton />
                </div>
            </form>
        </GlassCard>
    );
}
