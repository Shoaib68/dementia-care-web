# Database Documentation

This document explains the structure, relationships, and purpose of each table in the database. It is designed to help developers, AI coding assistants, and team members understand the schema for efficient project development.

# Important note
Do NOT interact with the Supabase database directly using SQL queries or SDK operations.
Always use the provided API endpoints for:
- Reading data
- Creating records
- Updating records
- Deleting records

This ensures:
- Security through RLS and backend validation
- Consistency with business logic
- Preventing accidental data loss


## 1. `users`
**Purpose**: Stores core user accounts for all roles (patients, caregivers, doctors, hospital admins, super admins).  
**Key Columns**:
- `id` (UUID, PK) – Unique identifier for the user.
- `email` (Unique) – Login credential.
- `user_type` – Role of the user (`patient`, `caregiver`, `doctor`, `hospital_admin`, `super_admin`).
- `is_active` – Whether the user account is active.
- `created_at` / `updated_at` – Timestamps for record lifecycle.

**Relationships**:
- Referenced by multiple tables (`patients`, `caregivers`, `doctors`, `hospitals`, etc.) to link a role to its user account.

---

## 2. `patients`
**Purpose**: Stores patient-specific details linked to a `users` record.  
**Key Columns**:
- `id` (UUID, PK, FK to `users.id`) – Patient's user account ID.
- `patient_code` – Unique patient identifier for hospitals.
- `first_name` / `last_name` – Personal details.
- `date_of_birth` – DOB of the patient.
- `dementia_stage` – Current dementia stage (`mild`, `moderate`, `severe`).
- `medical_history` (JSONB) – Structured medical data.
- `iot_device_id` (FK to `iot_devices`) – Linked IoT device.
- `hospital_id` (FK to `hospitals`) – Patient's hospital.
- `primary_doctor_id` (FK to `doctors`) – Assigned doctor.
- `created_by` (FK to `users`) – User who created the record.
- `updated_at` – Timestamp for last modification.



**Relationships**:
- Referenced in medical, game, scheduling, and monitoring tables.

---

## 3. `caregivers`
**Purpose**: Represents caregivers who assist patients.  
**Key Columns**:
- `id` (UUID, PK, FK to `users.id`) – Caregiver's user account.
- `first_name`, `last_name` – Name.
- `phone_number`, `emergency_contact` – Contact details.
- `address` – Residence.

**Relationships**:
- Linked to `patient_caregiver_assignments` and `schedules`.

---

## 4. `doctors`
**Purpose**: Represents doctors linked to the system.  
**Key Columns**:
- `id` (UUID, PK, FK to `users.id`) – Doctor's user account.
- `hospital_id` (FK to `hospitals`) – Associated hospital.
- `first_name` – Doctor's first name.
- `last_name` – Doctor's last name.
- `specialization` – Medical specialty (e.g., Neurologist, Psychiatrist).
- `department` – Hospital department/unit where doctor works (e.g., Neurology, Emergency, Cardiology).
- `license_number` (Unique) – Professional license.
- `phone_number` – Contact phone number.
- `created_by` (FK to `users`) – Admin who created the doctor profile.
- `updated_at` – Timestamp for last modification.

**Relationships**:
- Linked to patients, `mri_scans`, `medical_notes`.

**Notes**:
- `department` represents the organizational unit within the hospital where the doctor is assigned
- `specialization` represents the doctor's medical specialty, which may differ from their department assignment
- Both fields are useful for different organizational and filtering purposes

---

## 5. `hospitals`
**Purpose**: Stores hospital details.  
**Key Columns**:
- `id` (UUID, PK)
- `name` – Hospital name.
- `admin_user_id` (FK to `users`) – Hospital administrator.
- `is_approved` – Approval status.

**Relationships**:
- Linked to doctors, patients, and medical records.

---

## 6. `iot_devices`
**Purpose**: IoT devices (e.g., safety pendants) linked to patients.  
**Key Columns**:
- `id` (UUID, PK)
- `device_mac_address` (Unique) – Hardware ID.
- `device_type` – Device category.
- `firmware_version` – Version info.
- `patient_id` (FK to `patients`) – Assigned patient.

**Relationships**:
- Used in BLE logs and location alerts.

---

## 7. `ble_connection_logs`
**Purpose**: Logs Bluetooth connections between IoT devices and patients.  
**Key Columns**:
- `device_id` (FK to `iot_devices`) – Linked device.
- `patient_id` (FK to `patients`) – Patient using the device.
- `connection_status` – `connected` or `disconnected`.
- `signal_strength` – BLE signal.

---

## 8. `location_alerts`
**Purpose**: Alerts for disconnection, wandering, or fall detection.  
**Key Columns**:
- `patient_id` (FK to `patients`)
- `device_id` (FK to `iot_devices`)
- `alert_type` – Event type.
- `resolved_by` (FK to `users`) – Who resolved it.

---

## 9. `games`
**Purpose**: Cognitive games for dementia therapy.  
**Key Columns**:
- `game_name` – Title.
- `game_code` (Unique) – Identifier.
- `dementia_stage` – Target stage.
- `cognitive_area` – E.g., memory, attention.
- `difficulty_level` – 1–5.

---

## 10. `game_sessions`
**Purpose**: Tracks patient game play sessions.  
**Key Columns**:
- `patient_id` (FK to `patients`)
- `game_id` (FK to `games`)
- `score`, `max_score`, `performance_metrics`.

---

## 11. `medical_notes`
**Purpose**: Stores doctor notes about patients.  
**Key Columns**:
- `patient_id` (FK to `patients`)
- `doctor_id` (FK to `doctors`)
- `hospital_id` (FK to `hospitals`)
- `created_by` (FK to users) – User who created the note.

- `updated_at` – Timestamp for last modification.

---

## 12. `mri_scans`
**Purpose**: Stores MRI scan details with AI diagnosis.  
**Key Columns**:
- `ai_diagnosis_stage`, `ai_confidence_score`
- `uploaded_by` (FK to `users`)
- `hospital_id` (FK to hospitals) – Hospital where scan was recorded.

- `updated_at` – Timestamp for last modification.

---

## 13. `monthly_reports`
**Purpose**: Monthly progress reports for patients.  
**Key Columns**:
- `task_adherence_percentage`
- `games_played_count`
- `average_game_score`
- `report_year` – Year of report.

- `report_month` – Month of report (1–12 constraint).

---

## 14. `patient_caregiver_assignments`
**Purpose**: Maps patients to their caregivers.  
**Key Columns**:
- `patient_id` (Unique FK)
- `caregiver_id` (Unique FK)
note: Both patient_id and caregiver_id are UNIQUE individually, meaning one patient can have only one caregiver and one caregiver can have only one patient.

---

## 15. `patient_doctor_assignments`
**Purpose**: Assigns patients to doctors and hospitals.  
**Key Columns**:
- `is_active` – If assignment is current.

---

## 16. `schedules`
**Purpose**: Defines daily schedules for patients.  
**Key Columns**:
- `schedule_type` – Medication, meal, activity, therapy.
- `created_by_caregiver_id` (FK to `caregivers`)
- `recurrence_pattern` (JSONB) – Defines repetition rules for the schedule.

---

## 17. `task_completion_logs`
**Purpose**: Tracks if scheduled tasks were completed.  
**Key Columns**:
- `status` – `pending`, `completed`, `missed`.


---

## Relationships Summary
- `users` → parent table for `patients`, `caregivers`, `doctors`, `hospitals`.
- `patients` → central to most relationships (medical, games, schedules, devices).
- IoT-related tables (`iot_devices`, `ble_connection_logs`, `location_alerts`) focus on monitoring and alerts.
- Medical records (`medical_notes`, `mri_scans`, `monthly_reports`) store health progress.
- Therapy/game tracking handled via `games` and `game_sessions`.
- Scheduling handled via `schedules` and `task_completion_logs`.

---
