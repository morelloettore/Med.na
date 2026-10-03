export type UserRole = 'PATIENT' | 'EMPLOYEE' | 'DOCTOR' | 'ADMIN';
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
export type AppointmentMode = 'IN_PERSON' | 'TELEMEDICINE';
export type InsuranceCardStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Patient {
  user_id: string;
  cpf: string;
  birth_date: string;
  address_st?: string;
  address_city?: string;
  address_state?: string;
  user?: User;
}

export interface Employee {
  user_id: string;
  cpf: string;
  hire_date: string;
  job_title?: string;
  user?: User;
}

export interface Doctor {
  user_id: string;
  crm: string;
  crm_state: string;
  cpf: string;
  bio?: string;
  telemedicine_enabled: boolean;
  user?: User;
  specialties?: Specialty[];
  locations?: Location[];
}

export interface Specialty {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
  address_st: string;
  address_city: string;
  address_state: string;
  phone?: string;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  location_id?: string;
  weekday: number; // 0=Sun, 1=Mon, ..., 6=Sat
  start_time: string;
  end_time: string;
  slot_minutes: number;
  location?: Location;
}

export interface HealthInsurance {
  id: string;
  name: string;
  ans_code?: string;
  cnpj?: string;
}

export interface PatientInsurance {
  id: string;
  patient_id: string;
  insurance_id: string;
  card_number: string;
  valid_until?: string;
  status: InsuranceCardStatus;
  insurance?: HealthInsurance;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  specialty_id?: string;
  location_id?: string;
  insurance_id?: string;
  scheduled_at: string;
  duration_min: number;
  mode: AppointmentMode;
  status: AppointmentStatus;
  price?: number;
  telemedicine_url?: string;
  cancel_reason?: string;
  canceled_at?: string;
  canceled_by?: string;
  created_by?: string;
  created_at?: string;

  // Relations
  patient_user?: User;
  doctor_user?: User;
  doctor_info?: Doctor;
  specialty?: Specialty;
  location?: Location;
  insurance?: PatientInsurance;
}

export interface MedicalRecord {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  anamnesis?: string;
  diagnosis?: string;
  notes?: string;
  created_at?: string;
  doctor_user?: User;
  appointment?: Appointment;
}

export interface MedicationItem {
  name: string;
  dosage: string;
  instructions: string;
  quantity?: string;
}

export interface Prescription {
  id: string;
  record_id: string;
  medications: MedicationItem[];
  issued_at: string;
}
