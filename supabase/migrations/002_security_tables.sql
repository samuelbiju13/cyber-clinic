-- =========================================================
-- Cyber-Clinic: Security Tables (002)
-- Tables: audit_logs (immutable), encryption_metadata
-- =========================================================

-- 1. Audit Logs (append-only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_timestamp TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL CHECK (action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  target_table TEXT NOT NULL,
  target_row_id UUID,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  metadata JSONB
);

-- 2. Encryption Metadata
CREATE TABLE IF NOT EXISTS public.encryption_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  encryption_algo TEXT NOT NULL DEFAULT 'AES-256-GCM',
  iv TEXT NOT NULL,
  encrypted_at TIMESTAMPTZ DEFAULT now(),
  encrypted_by UUID NOT NULL REFERENCES public.profiles(id)
);

-- =========================================================
-- Row-Level Security
-- =========================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encryption_metadata ENABLE ROW LEVEL SECURITY;

-- Audit logs: INSERT only (via server-side / service_role)
-- NO SELECT, UPDATE, or DELETE policies for regular users.
-- The service_role key bypasses RLS to write.
CREATE POLICY "Service can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Encryption metadata: server-side read only
CREATE POLICY "Server reads encryption metadata"
  ON public.encryption_metadata FOR SELECT
  USING (encrypted_by = auth.uid());

CREATE POLICY "Server inserts encryption metadata"
  ON public.encryption_metadata FOR INSERT
  WITH CHECK (true);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(target_table);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(event_timestamp DESC);
