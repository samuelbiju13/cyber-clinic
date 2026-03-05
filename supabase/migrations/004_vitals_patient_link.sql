-- =========================================================
-- Cyber-Clinic: Patient-Linked Vitals (004)
-- Goal: Allow patients to record vitals without a doctor checkup
-- =========================================================

-- 1. Add patient_id to vitals
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vitals' AND column_name = 'patient_id') THEN
        ALTER TABLE public.vitals ADD COLUMN patient_id UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- 2. Make checkup_id optional
ALTER TABLE public.vitals ALTER COLUMN checkup_id DROP NOT NULL;

-- 3. Backfill patient_id from existing checkups (if any)
UPDATE public.vitals
SET patient_id = checkups.patient_id
FROM public.checkups
WHERE vitals.checkup_id = checkups.id
AND vitals.patient_id IS NULL;

-- 4. RLS for Direct Vitals Access

-- Drop checkup-dependent policy if it interferes (Optional, usually we add new ones)
-- We add explicit policies for patient_id

CREATE POLICY "Patients insert own vitals"
  ON public.vitals FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients select own vitals (direct)"
  ON public.vitals FOR SELECT
  USING (auth.uid() = patient_id);

-- Ensure doctors can still see them via patient_id logic (or checkup logic)
CREATE POLICY "Doctors select patient vitals"
  ON public.vitals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.checkups
      WHERE checkups.patient_id = vitals.patient_id
        AND checkups.doctor_id = auth.uid()
    )
  );
