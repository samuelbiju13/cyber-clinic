// ─── Cyber-Clinic Type Definitions ───────────────────────────────────

export type Role = 'doctor' | 'patient' | 'guest';
export type CheckupStatus = 'scheduled' | 'completed' | 'cancelled';
export type PrescriptionStatus = 'active' | 'expired' | 'refilled';
export type AuditAction = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
export type AiAuditStatus = 'pending' | 'clear' | 'flagged';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  specialization: string | null;
  avatar_url: string | null;
  phone: string | null;
  encrypted_gov_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Checkup {
  id: string;
  patient_id: string;
  doctor_id: string;
  checkup_date: string;
  diagnosis: string;
  encrypted_diagnosis: string | null;
  notes: string | null;
  report_url: string | null;
  ocr_extracted_text: string | null;
  status: CheckupStatus;
  created_at: string;
  // Joined
  doctor?: Profile;
  patient?: Profile;
  vitals?: Vitals;
}

export interface Vitals {
  id: string;
  checkup_id?: string; // Optional now
  patient_id: string;  // Direct link
  pulse_bpm: number;
  bp_systolic: number;
  bp_diastolic: number;
  spo2: number;
  temperature_f: number | null;
  weight_kg: number | null;
  recorded_at: string;
  // Joined
  patient?: Profile;
}

export interface Prescription {
  id: string;
  checkup_id: string;
  patient_id: string;
  doctor_id: string;
  prescribed_date: string;
  valid_until: string;
  status: PrescriptionStatus;
  ai_audit_status: AiAuditStatus;
  ai_audit_notes: string | null;
  created_at: string;
  // Joined
  items?: PrescriptionItem[];
  doctor?: Profile;
  patient?: Profile;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions: string | null;
}

export interface AuditLog {
  id: string;
  event_timestamp: string;
  user_id: string;
  action: AuditAction;
  target_table: string;
  target_row_id: string | null;
  ip_address: string;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  is_resolved?: boolean; // New field as per user request
}

export interface EncryptionMetadata {
  id: string;
  record_id: string;
  table_name: string;
  field_name: string;
  encryption_algo: string;
  iv: string;
  encrypted_at: string;
  encrypted_by: string;
}

// ─── Health Delta (Trend-Analyzer output) ────────────────────────────

export interface HealthDelta {
  bpSystolicDelta: number | null;
  bpDiastolicDelta: number | null;
  pulseDelta: number | null;
  spo2Delta: number | null;
  weightDelta: number | null;
}
