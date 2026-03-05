-- =========================================================
-- Cyber-Clinic: Doctor Vitals Access (005)
-- Goal: Allow doctors to view ALL patient vitals (Registry Mode)
-- =========================================================

-- The previous policy "Doctors select patient vitals" required a checkup to exist.
-- Ideally, doctors should be able to see vitals from the registry before a checkup.

DROP POLICY IF EXISTS "Doctors select patient vitals" ON public.vitals;

CREATE POLICY "Doctors view all vitals"
  ON public.vitals FOR SELECT
  USING (
    -- Allow if user is a doctor
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'doctor'
  );

-- Note: We assume "Patients select own vitals (direct)" from 004 handles patients.
