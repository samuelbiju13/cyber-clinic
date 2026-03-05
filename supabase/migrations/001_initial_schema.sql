-- =========================================================
-- Cyber-Clinic: Initial Schema (001)
-- Core tables: profiles, checkups, vitals, prescriptions, prescription_items
-- =========================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'patient')),
  specialization TEXT,
  avatar_url TEXT,
  phone TEXT,
  encrypted_gov_id TEXT,  -- AES-256 encrypted (Aadhaar/SSN)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Checkups
CREATE TABLE IF NOT EXISTS public.checkups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id),
  checkup_date TIMESTAMPTZ NOT NULL,
  diagnosis TEXT NOT NULL,
  encrypted_diagnosis TEXT,  -- AES-256 for sensitive diagnoses
  notes TEXT,
  report_url TEXT,
  ocr_extracted_text TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Vitals
CREATE TABLE IF NOT EXISTS public.vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id UUID NOT NULL REFERENCES public.checkups(id) ON DELETE CASCADE,
  pulse_bpm INTEGER NOT NULL,
  blood_pressure TEXT NOT NULL,
  spo2_percent REAL NOT NULL,
  temperature_f REAL,
  weight_kg REAL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id UUID NOT NULL REFERENCES public.checkups(id),
  patient_id UUID NOT NULL REFERENCES public.profiles(id),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id),
  prescribed_date TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'refilled')),
  ai_audit_status TEXT DEFAULT 'pending' CHECK (ai_audit_status IN ('pending', 'clear', 'flagged')),
  ai_audit_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Prescription Items
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  drug_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  instructions TEXT
);

-- =========================================================
-- Row-Level Security Policies
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Doctors can read assigned patients"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.checkups
      WHERE checkups.patient_id = profiles.id
        AND checkups.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Checkups
CREATE POLICY "Patients read own checkups"
  ON public.checkups FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors read/write own checkups"
  ON public.checkups FOR ALL
  USING (doctor_id = auth.uid());

-- Vitals
CREATE POLICY "Read vitals via checkup"
  ON public.vitals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.checkups
      WHERE checkups.id = vitals.checkup_id
        AND (checkups.patient_id = auth.uid() OR checkups.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Doctors write vitals"
  ON public.vitals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.checkups
      WHERE checkups.id = vitals.checkup_id
        AND checkups.doctor_id = auth.uid()
    )
  );

-- Prescriptions
CREATE POLICY "Patients read own prescriptions"
  ON public.prescriptions FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors manage prescriptions"
  ON public.prescriptions FOR ALL
  USING (doctor_id = auth.uid());

-- Prescription Items
CREATE POLICY "Read items via prescription"
  ON public.prescription_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.prescriptions
      WHERE prescriptions.id = prescription_items.prescription_id
        AND (prescriptions.patient_id = auth.uid() OR prescriptions.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Doctors write items"
  ON public.prescription_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prescriptions
      WHERE prescriptions.id = prescription_items.prescription_id
        AND prescriptions.doctor_id = auth.uid()
    )
  );
