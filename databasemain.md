# Database Documentation - Dementia Care Web Application

*Last Updated: January 26, 2025*  
*Schema Version: 2.0 (Post-Migration)*

This document provides comprehensive documentation for the Dementia Care Web Application database schema. It explains the structure, relationships, and purpose of each table in the migrated database, designed to help developers, AI coding assistants, and team members understand the schema for efficient project development.

## Table of Contents
1. [Important Security Notice](#important-security-notice)
2. [Migration Summary](#migration-summary)
3. [Database Overview](#database-overview)
4. [Core User Management Tables](#core-user-management-tables)
5. [Healthcare Provider Tables](#healthcare-provider-tables)
6. [Patient Care & Medical Tables](#patient-care--medical-tables)
7. [IoT Device & Monitoring Tables](#iot-device--monitoring-tables)
8. [Cognitive Assessment & Gaming Tables](#cognitive-assessment--gaming-tables)
9. [Task Management & Analytics Tables](#task-management--analytics-tables)
10. [Relationship & Assignment Tables](#relationship--assignment-tables)
11. [Comprehensive Relationships Summary](#comprehensive-relationships-summary)
12. [Data Access Patterns](#data-access-patterns)
13. [Security & Compliance](#security--compliance)
14. [Performance Considerations](#performance-considerations)

---

## Important Security Notice

⚠️ **CRITICAL**: Do NOT interact with the database directly using SQL queries or SDK operations.

**Always use the provided API endpoints for:**
- Reading data
- Creating records
- Updating records
- Deleting records

**This ensures:**
- Security through RLS (Row Level Security) and backend validation
- Consistency with business logic
- Prevention of accidental data loss
- Compliance with healthcare data protection requirements
- Proper audit trail maintenance

---

## Migration Summary

### Schema Changes from Previous Version

This migrated database includes significant enhancements and new capabilities:

#### 🆕 **New Tables Added**
- `daily_task_progress` - Daily task completion analytics
- `task_adherence_summaries` - Weekly adherence analysis
- `game_performance_summaries` - Weekly gaming performance metrics

#### 📊 **Enhanced Tables**
- `monthly_reports` - Added detailed JSONB fields for comprehensive metrics
- All tables now have improved constraints and indexing

#### 🔧 **Schema Improvements**
- Enhanced foreign key relationships
- Improved data validation constraints
- Better performance through optimized indexing
- Standardized JSONB usage for analytics data

#### 🎯 **New Capabilities**
- **Advanced Analytics**: Comprehensive weekly and daily aggregation tables
- **Enhanced Reporting**: Detailed monthly reports with structured metrics
- **Improved Performance**: Optimized queries through proper indexing
- **Better Data Integrity**: Stricter constraints and validation rules

---

## Database Overview

The Dementia Care Web Application database consists of **20 core tables** organized into logical groups:

- **User Management** (5 tables): Authentication and role management
- **Healthcare & Medical** (4 tables): Medical records and assessments  
- **IoT & Monitoring** (3 tables): Device tracking and alerts
- **Gaming & Cognitive** (3 tables): Cognitive assessment games
- **Task Management** (3 tables): Scheduling and adherence tracking
- **Assignment & Relationships** (2 tables): User relationship management

---

## Core User Management Tables

### 1. `users` 
**Purpose**: Central authentication table storing core user accounts for all roles in the system.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Unique identifier for the user
- `email` (VARCHAR, NOT NULL, UNIQUE) – Login credential and primary identifier
- `user_type` (VARCHAR, CHECK constraint) – Role designation
  - Values: `patient`, `caregiver`, `doctor`, `hospital_admin`, `super_admin`
- `is_active` (BOOLEAN, Default: true) – Account activation status
- `created_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Account creation timestamp
- `updated_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Last modification timestamp

**Relationships**:
- Parent table for all role-specific tables (`patients`, `caregivers`, `doctors`)
- Referenced by `hospitals.admin_user_id`
- Referenced by audit fields in multiple tables (`created_by`, `resolved_by`, etc.)

**Security Notes**:
- Email addresses must be unique across the entire system
- User type determines access permissions and available features
- Inactive users cannot authenticate but data is preserved

---

### 2. `patients`
**Purpose**: Stores patient-specific medical and personal information linked to a user account.

**Key Columns**:
- `id` (UUID, PK, FK to `users.id`) – Patient's user account ID
- `patient_code` (VARCHAR, NOT NULL, UNIQUE) – Hospital-assigned patient identifier
- `first_name` (TEXT, NOT NULL) – Patient's first name
- `last_name` (TEXT, NOT NULL) – Patient's last name  
- `date_of_birth` (DATE) – Patient's date of birth
- `dementia_stage` (VARCHAR, CHECK constraint) – Current cognitive assessment
  - Values: `mild`, `moderate`, `severe`
- `medical_history` (JSONB) – Structured medical background data
- `profile_image_url` (TEXT) – Patient profile photo URL
- `iot_device_id` (UUID, FK to `iot_devices.id`) – Assigned IoT device
- `hospital_id` (UUID, FK to `hospitals.id`) – Associated hospital
- `primary_doctor_id` (UUID, FK to `doctors.id`) – Primary care physician
- `created_by` (UUID, FK to `users.id`) – User who created the record
- `updated_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Last modification

**Relationships**:
- Central to most patient-related operations (medical, gaming, scheduling)
- One-to-one with IoT device assignment
- Many-to-one with hospital and primary doctor
- Referenced by all patient activity tables

**Medical History JSONB Structure**:
```json
{
  "conditions": ["dementia", "hypertension"],
  "medications": [
    {"name": "Donepezil", "dosage": "10mg", "frequency": "daily"}
  ],
  "allergies": ["penicillin"],
  "emergency_contact": {
    "name": "John Doe",
    "relationship": "son",
    "phone": "+1234567890"
  }
}
```

---

### 3. `caregivers`
**Purpose**: Represents family members or professional caregivers who assist patients.

**Key Columns**:
- `id` (UUID, PK, FK to `users.id`) – Caregiver's user account
- `first_name` (VARCHAR, NOT NULL) – Caregiver's first name
- `last_name` (VARCHAR, NOT NULL) – Caregiver's last name
- `phone_number` (VARCHAR) – Primary contact number
- `emergency_contact` (VARCHAR) – Backup contact information
- `address` (TEXT) – Residential address

**Relationships**:
- Linked to `patient_caregiver_assignments` (one-to-one relationship)
- Referenced by `schedules.created_by_caregiver_id`
- Can create and manage patient schedules

**Usage Notes**:
- Each caregiver can be assigned to only one patient
- Caregivers have full access to their assigned patient's data
- Can create medication, meal, activity, and therapy schedules

---

### 4. `doctors`
**Purpose**: Represents medical professionals with diagnostic and treatment capabilities.

**Key Columns**:
- `id` (UUID, PK, FK to `users.id`) – Doctor's user account
- `first_name` (VARCHAR, NOT NULL) – Doctor's first name
- `last_name` (VARCHAR, NOT NULL) – Doctor's last name
- `hospital_id` (UUID, FK to `hospitals.id`) – Associated hospital
- `specialization` (VARCHAR) – Medical specialty (e.g., Neurologist, Psychiatrist)
- `department` (TEXT, Default: 'General') – Hospital department/unit
- `license_number` (VARCHAR, UNIQUE) – Professional license identifier
- `phone_number` (VARCHAR) – Contact number
- `created_by` (UUID, FK to `users.id`) – Admin who created the profile
- `updated_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Last modification

**Relationships**:
- Many-to-one with hospital
- Referenced by patients as primary doctor
- Linked through `patient_doctor_assignments` for multiple patients
- Can create medical notes and MRI scan records

**Professional Fields**:
- `specialization`: Medical expertise area (affects available features)
- `department`: Organizational unit within hospital
- `license_number`: Must be unique across all doctors in system

---

### 5. `hospitals`
**Purpose**: Healthcare facility management and organizational structure.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Hospital identifier
- `name` (VARCHAR, NOT NULL) – Hospital name
- `address` (TEXT) – Hospital physical address
- `phone_number` (VARCHAR) – Main hospital contact
- `admin_user_id` (UUID, UNIQUE, FK to `users.id`) – Hospital administrator
- `is_approved` (BOOLEAN, Default: false) – System approval status
- `created_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Registration date

**Relationships**:
- One-to-many with doctors and patients
- One-to-one with hospital admin user
- Referenced in medical records and assignments

**Administrative Notes**:
- Each hospital has exactly one admin user
- Approval required before hospital can be fully operational
- Admin can manage hospital's doctors and view patient assignments

---

## Healthcare Provider Tables

### 6. `medical_notes`
**Purpose**: Clinical observations, diagnoses, and treatment notes from medical professionals.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Note identifier
- `patient_id` (UUID, FK to `patients.id`) – Associated patient
- `doctor_id` (UUID, FK to `doctors.id`) – Note author
- `hospital_id` (UUID, FK to `hospitals.id`) – Hospital context
- `note_content` (TEXT, NOT NULL) – Clinical observations
- `recommendations` (TEXT) – Treatment recommendations
- `follow_up_date` (DATE) – Scheduled follow-up
- `created_by` (UUID, FK to `users.id`) – Note creator
- `created_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Creation time
- `updated_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Last modification

**Clinical Workflow**:
1. Doctor examines patient
2. Creates detailed medical note
3. Includes recommendations for treatment
4. Schedules follow-up if necessary
5. Note becomes part of patient's medical history

---

### 7. `mri_scans`
**Purpose**: MRI scan storage with AI-powered diagnosis capabilities.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Scan identifier
- `patient_id` (UUID, FK to `patients.id`) – Scanned patient
- `doctor_id` (UUID, FK to `doctors.id`) – Ordering physician
- `hospital_id` (UUID, FK to `hospitals.id`) – Scan location
- `scan_date` (DATE, NOT NULL) – Date of scan
- `file_url` (TEXT, NOT NULL) – Scan image storage URL
- `ai_diagnosis_stage` (VARCHAR, CHECK constraint) – AI assessment
  - Values: `mild`, `moderate`, `severe`
- `ai_confidence_score` (NUMERIC) – AI confidence percentage (0-1)
- `doctor_verified` (BOOLEAN, Default: false) – Manual verification status
- `doctor_notes` (TEXT) – Physician's diagnostic notes
- `uploaded_by` (UUID, FK to `users.id`) – User who uploaded scan
- `created_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Upload time
- `updated_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Last update

**AI Diagnosis Workflow**:
1. MRI scan uploaded to system
2. AI analysis provides preliminary diagnosis
3. Confidence score indicates reliability
4. Doctor reviews and verifies diagnosis
5. Results integrated into patient care plan

---

## Patient Care & Medical Tables

### 8. `monthly_reports`
**Purpose**: Comprehensive monthly patient progress reports with detailed analytics.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Report identifier
- `patient_id` (UUID, FK to `patients.id`) – Associated patient
- `report_year` (INTEGER, NOT NULL) – Report year
- `report_month` (INTEGER, NOT NULL, CHECK: 1-12) – Report month
- `task_adherence` (JSONB, NOT NULL) – Task completion metrics
- `overall_task_adherence` (NUMERIC) – Overall adherence percentage
- `task_completion_details` (JSONB) – Detailed completion analytics
- `game_performance` (JSONB, NOT NULL) – Gaming performance metrics
- `overall_game_performance` (NUMERIC) – Overall gaming score
- `current_dementia_stage` (VARCHAR, CHECK constraint) – Current assessment
- `caregiver_observations` (TEXT) – Caregiver input
- `doctor_feedback` (TEXT) – Medical professional assessment
- `generated_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Report creation
- `generated_by` (UUID, FK to `users.id`) – Report generator
- `reviewed_by` (UUID, FK to `users.id`) – Medical reviewer
- `reviewed_at` (TIMESTAMPTZ) – Review timestamp

**Enhanced JSONB Structures**:

**Task Adherence JSONB**:
```json
{
  "medication": {
    "adherence_pct": 85.5,
    "total_scheduled": 30,
    "completed": 26,
    "missed": 4
  },
  "meal": {
    "adherence_pct": 92.0,
    "total_scheduled": 90,
    "completed": 83,
    "missed": 7
  },
  "activity": {
    "adherence_pct": 78.3,
    "total_scheduled": 20,
    "completed": 15,
    "missed": 5
  },
  "therapy": {
    "adherence_pct": 88.9,
    "total_scheduled": 12,
    "completed": 10,
    "missed": 2
  }
}
```

**Game Performance JSONB**:
```json
{
  "memory_games": {
    "avg_score": 76.5,
    "sessions_played": 15,
    "improvement_trend": "positive"
  },
  "attention_games": {
    "avg_score": 82.1,
    "sessions_played": 12,
    "improvement_trend": "stable"
  },
  "executive_function": {
    "avg_score": 69.2,
    "sessions_played": 8,
    "improvement_trend": "improving"
  }
}
```

---

## IoT Device & Monitoring Tables

### 9. `iot_devices`
**Purpose**: Registry and management of IoT devices (safety pendants, sensors) assigned to patients.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Device identifier
- `device_mac_address` (VARCHAR, NOT NULL, UNIQUE) – Hardware identifier
- `device_type` (VARCHAR, Default: 'safety_pendant') – Device category
- `firmware_version` (VARCHAR) – Current firmware version
- `last_seen` (TIMESTAMPTZ) – Last communication timestamp
- `is_active` (BOOLEAN, Default: true) – Device operational status
- `patient_id` (UUID, FK to `patients.id`) – Assigned patient

**Device Management**:
- Unique MAC addresses prevent duplicate registrations
- Firmware version tracking for security updates
- Last seen timestamp for connectivity monitoring
- One device per patient assignment

---

### 10. `ble_connection_logs`
**Purpose**: Bluetooth Low Energy connection tracking between devices and patients.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Log entry identifier
- `device_id` (UUID, FK to `iot_devices.id`) – Connected device
- `patient_id` (UUID, FK to `patients.id`) – Patient with device
- `connection_status` (VARCHAR, CHECK constraint) – Connection state
  - Values: `connected`, `disconnected`
- `timestamp` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Event time
- `signal_strength` (INTEGER) – BLE signal strength (RSSI)

**Monitoring Capabilities**:
- Real-time connection status tracking
- Signal strength analysis for range optimization
- Disconnection alerts for safety monitoring
- Historical connectivity patterns

---

### 11. `location_alerts`
**Purpose**: Geofencing alerts and emergency notifications from IoT devices.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Alert identifier
- `patient_id` (UUID, FK to `patients.id`) – Affected patient
- `device_id` (UUID, FK to `iot_devices.id`) – Alert source device
- `latitude` (NUMERIC) – GPS latitude coordinate
- `longitude` (NUMERIC) – GPS longitude coordinate
- `alert_type` (VARCHAR, CHECK constraint) – Alert classification
  - Values: `disconnection`, `wandering`, `fall_detection`
- `alert_time` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Alert timestamp
- `resolved_at` (TIMESTAMPTZ) – Resolution timestamp
- `resolved_by` (UUID, FK to `users.id`) – Resolving user
- `notes` (TEXT) – Resolution notes

**Alert Workflow**:
1. IoT device detects safety event
2. Alert created with GPS coordinates
3. Caregivers/medical staff notified
4. Response team investigates
5. Alert resolved with notes

---

## Cognitive Assessment & Gaming Tables

### 12. `games`
**Purpose**: Catalog of cognitive assessment games designed for dementia patients.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Game identifier
- `game_name` (VARCHAR, NOT NULL) – Display name
- `game_code` (VARCHAR, NOT NULL, UNIQUE) – System identifier
- `dementia_stage` (VARCHAR, CHECK constraint) – Target patient stage
  - Values: `mild`, `moderate`, `severe`
- `cognitive_area` (VARCHAR, CHECK constraint) – Cognitive focus
  - Values: `memory`, `attention`, `executive_function`, `logical`, `motor`
- `description` (TEXT) – Game description and purpose
- `instructions` (TEXT) – Patient instructions
- `difficulty_level` (INTEGER, CHECK: 1-5) – Difficulty rating
- `is_active` (BOOLEAN, Default: true) – Game availability

**Cognitive Areas**:
- **Memory**: Recall and recognition exercises
- **Attention**: Focus and concentration tasks
- **Executive Function**: Planning and decision-making
- **Logical**: Problem-solving and reasoning
- **Motor**: Physical coordination activities

---

### 13. `game_sessions`
**Purpose**: Individual game play sessions with performance tracking.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Session identifier
- `patient_id` (UUID, FK to `patients.id`) – Playing patient
- `game_id` (UUID, FK to `games.id`) – Played game
- `start_time` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Session start
- `end_time` (TIMESTAMPTZ) – Session completion
- `score` (INTEGER) – Achieved score
- `max_score` (INTEGER) – Maximum possible score
- `performance_metrics` (JSONB) – Detailed performance data
- `completed` (BOOLEAN, Default: false) – Session completion status

**Performance Metrics JSONB**:
```json
{
  "reaction_time_avg": 1.2,
  "accuracy_percentage": 78.5,
  "difficulty_adjustments": 2,
  "hints_used": 3,
  "time_spent_seconds": 450,
  "error_patterns": ["sequence_confusion", "timing_issues"]
}
```

---

### 14. `game_performance_summaries` 🆕
**Purpose**: Weekly aggregated gaming performance metrics for analytics.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Summary identifier
- `patient_id` (UUID, FK to `patients.id`) – Associated patient
- `week_start_date` (DATE, NOT NULL) – Week beginning
- `week_end_date` (DATE, NOT NULL) – Week ending
- `week_number` (INTEGER, NOT NULL) – Week number in year
- `year` (INTEGER, NOT NULL) – Year
- `game_id` (UUID, NOT NULL, FK to `games.id`) – Game identifier
- `avg_score` (NUMERIC, NOT NULL) – Average score for the week
- `plays_count` (INTEGER, NOT NULL) – Total plays in week
- `total_duration_minutes` (INTEGER) – Total play time in minutes
- `created_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Summary creation
- `updated_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Last update

**Analytics Features**:
- Weekly performance trends
- Game-specific progress tracking
- Play frequency analysis
- Duration and engagement metrics

---

## Task Management & Analytics Tables

### 15. `schedules`
**Purpose**: Daily task scheduling system for patient care routines.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Schedule identifier
- `patient_id` (UUID, FK to `patients.id`) – Scheduled patient
- `created_by_caregiver_id` (UUID, FK to `caregivers.id`) – Schedule creator
- `schedule_type` (VARCHAR, CHECK constraint) – Task category
  - Values: `medication`, `meal`, `activity`, `therapy`
- `title` (VARCHAR, NOT NULL) – Task title
- `description` (TEXT) – Detailed task description
- `start_time` (TIME, NOT NULL) – Daily start time
- `end_time` (TIME) – Daily end time (optional)
- `recurrence_pattern` (JSONB) – Repetition rules
- `is_active` (BOOLEAN, Default: true) – Schedule status
- `created_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Creation time

**Recurrence Pattern JSONB**:
```json
{
  "frequency": "daily",
  "days_of_week": [1, 2, 3, 4, 5],
  "interval": 1,
  "end_date": "2025-12-31",
  "exceptions": ["2025-01-01", "2025-12-25"]
}
```

---

### 16. `task_completion_logs`
**Purpose**: Individual task completion tracking with status management.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Log identifier
- `schedule_id` (UUID, FK to `schedules.id`) – Associated schedule
- `patient_id` (UUID, FK to `patients.id`) – Task patient
- `scheduled_date` (DATE, NOT NULL) – Task date
- `scheduled_time` (TIME, NOT NULL) – Task time
- `completed_at` (TIMESTAMPTZ) – Completion timestamp
- `status` (VARCHAR, Default: 'pending', CHECK constraint) – Task status
  - Values: `pending`, `completed`, `missed`
- `notes` (TEXT) – Completion notes

**Task Lifecycle**:
1. `pending` - Task scheduled but not completed
2. `completed` - Task successfully completed
3. `missed` - Task not completed by deadline

---

### 17. `daily_task_progress` 🆕
**Purpose**: Daily aggregation of task completion progress by category.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Progress identifier
- `patient_id` (UUID, FK to `patients.id`) – Associated patient
- `progress_date` (DATE, NOT NULL) – Progress date
- `category_progress` (JSONB, NOT NULL) – Progress by task category
- `task_details` (JSONB) – Detailed task information
- `calculated_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Calculation time

**Category Progress JSONB**:
```json
{
  "medication": {
    "scheduled": 4,
    "completed": 3,
    "missed": 1,
    "adherence_pct": 75.0
  },
  "meal": {
    "scheduled": 3,
    "completed": 3,
    "missed": 0,
    "adherence_pct": 100.0
  },
  "activity": {
    "scheduled": 2,
    "completed": 1,
    "missed": 1,
    "adherence_pct": 50.0
  },
  "therapy": {
    "scheduled": 1,
    "completed": 1,
    "missed": 0,
    "adherence_pct": 100.0
  }
}
```

---

### 18. `task_adherence_summaries` 🆕
**Purpose**: Weekly task adherence analysis with trend identification.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Summary identifier
- `patient_id` (UUID, FK to `patients.id`) – Associated patient
- `week_start_date` (DATE, NOT NULL) – Week beginning
- `week_end_date` (DATE, NOT NULL) – Week ending
- `week_number` (INTEGER, NOT NULL) – Week number in year
- `year` (INTEGER, NOT NULL) – Year
- `schedule_type` (VARCHAR, NOT NULL, CHECK constraint) – Task category
- `adherence_pct` (NUMERIC, NOT NULL) – Weekly adherence percentage
- `total_scheduled` (INTEGER, Default: 0) – Total scheduled tasks
- `total_completed` (INTEGER, Default: 0) – Total completed tasks
- `total_missed` (INTEGER, Default: 0) – Total missed tasks
- `frequently_missed_tasks` (JSONB) – Problem task identification
- `consistently_completed_tasks` (JSONB) – Success task identification
- `notes` (TEXT) – Analysis notes
- `created_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Creation time
- `updated_at` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Last update

**Analytics Capabilities**:
- Weekly adherence trends
- Problem task identification
- Success pattern recognition
- Category-specific analysis

---

## Relationship & Assignment Tables

### 19. `patient_caregiver_assignments`
**Purpose**: One-to-one patient-caregiver relationship management.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Assignment identifier
- `patient_id` (UUID, UNIQUE, FK to `patients.id`) – Assigned patient
- `caregiver_id` (UUID, UNIQUE, FK to `caregivers.id`) – Assigned caregiver
- `is_primary` (BOOLEAN, Default: false) – Primary caregiver designation
- `assigned_date` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Assignment date

**Relationship Rules**:
- Each patient can have only one caregiver (UNIQUE constraint)
- Each caregiver can care for only one patient (UNIQUE constraint)
- One-to-one exclusive relationship model

---

### 20. `patient_doctor_assignments`
**Purpose**: Patient-doctor assignment management within hospital context.

**Key Columns**:
- `id` (UUID, PK, Default: uuid_generate_v4()) – Assignment identifier
- `patient_id` (UUID, FK to `patients.id`) – Assigned patient
- `doctor_id` (UUID, FK to `doctors.id`) – Assigned doctor
- `hospital_id` (UUID, FK to `hospitals.id`) – Assignment context
- `assigned_date` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP) – Assignment date
- `is_active` (BOOLEAN, Default: true) – Assignment status

**Assignment Features**:
- Patients can have multiple doctor assignments
- All assignments must be within the same hospital
- Historical assignment tracking through is_active flag
- Enables care team collaboration

---

## Comprehensive Relationships Summary

### Primary Relationships

#### User Hierarchy
```
users (1) → patients (1)
users (1) → caregivers (1)  
users (1) → doctors (1)
users (1) → hospitals.admin_user_id (1)
```

#### Patient-Centered Relationships
```
patients (1) → iot_devices (1)
patients (1) → medical_notes (*)
patients (1) → mri_scans (*)
patients (1) → game_sessions (*)
patients (1) → schedules (*)
patients (1) → task_completion_logs (*)
patients (1) → monthly_reports (*)
patients (1) → daily_task_progress (*) 🆕
patients (1) → patient_caregiver_assignments (1)
patients (1) → patient_doctor_assignments (*)
```

#### Hospital Context
```
hospitals (1) → doctors (*)
hospitals (1) → patients (*)
hospitals (1) → medical_notes (*)
hospitals (1) → mri_scans (*)
```

#### IoT Device Chain
```
iot_devices (1) → ble_connection_logs (*)
iot_devices (1) → location_alerts (*)
```

#### Gaming System
```
games (1) → game_sessions (*)
games (1) → game_performance_summaries (*) 🆕
```

#### Task Management Flow
```
schedules (1) → task_completion_logs (*)
schedules.schedule_type → task_adherence_summaries.schedule_type 🆕
```

### New Aggregation Relationships 🆕
```
patients (1) → game_performance_summaries (*)
patients (1) → task_adherence_summaries (*)
patients (1) → daily_task_progress (*)
```

---

## Data Access Patterns

### Recommended Query Patterns

#### Patient Dashboard Data
```sql
-- Patient overview with related data
SELECT p.*, h.name as hospital_name, d.first_name, d.last_name
FROM patients p
LEFT JOIN hospitals h ON p.hospital_id = h.id
LEFT JOIN doctors d ON p.primary_doctor_id = d.id
WHERE p.id = $1;
```

#### Weekly Performance Analytics 🆕
```sql
-- Weekly gaming performance
SELECT * FROM game_performance_summaries 
WHERE patient_id = $1 
  AND year = $2 
  AND week_number BETWEEN $3 AND $4
ORDER BY week_number, game_id;
```

#### Task Adherence Analysis 🆕
```sql
-- Weekly task adherence by category
SELECT schedule_type, adherence_pct, total_scheduled, total_completed
FROM task_adherence_summaries
WHERE patient_id = $1 
  AND year = $2 
  AND week_number = $3
ORDER BY schedule_type;
```

### JSONB Query Patterns

#### Medical History Access
```sql
-- Extract specific medical conditions
SELECT medical_history->'conditions' as conditions
FROM patients
WHERE medical_history ? 'conditions';
```

#### Task Category Progress 🆕
```sql
-- Daily medication adherence
SELECT progress_date, 
       category_progress->'medication'->>'adherence_pct' as med_adherence
FROM daily_task_progress
WHERE patient_id = $1
ORDER BY progress_date DESC;
```

---

## Security & Compliance

### Protected Health Information (PHI)
- **Patient Names**: Encrypted in transit and at rest
- **Medical History**: JSONB fields contain sensitive medical data
- **MRI Scans**: File URLs point to encrypted storage
- **Location Data**: GPS coordinates in location_alerts

### Role-Based Access Control
- **Super Admin**: Full system access
- **Hospital Admin**: Hospital-scoped access
- **Doctor**: Assigned patient access
- **Caregiver**: Single patient access
- **Patient**: Own data access only

### Audit Trail Requirements
- All tables include `created_at` timestamps
- User actions tracked through `created_by` fields
- Update timestamps in `updated_at` fields
- Assignment history preserved through `is_active` flags

### HIPAA Compliance Notes
- No direct database access allowed
- All queries through audited API endpoints
- User authentication required for all operations
- Access logs maintained for compliance reporting

---

## Performance Considerations

### Indexing Strategy
- Primary keys (UUID) automatically indexed
- Foreign keys indexed for join performance
- Unique constraints (email, patient_code, license_number) indexed
- Date fields indexed for time-based queries

### Aggregation Table Benefits 🆕
- **Pre-computed Metrics**: Weekly summaries reduce real-time calculation load
- **Faster Reporting**: Monthly reports query aggregated data instead of raw logs
- **Trend Analysis**: Time-series data optimized for analytics
- **Reduced Query Complexity**: Simple aggregation queries instead of complex joins

### JSONB Optimization
- GIN indexes on JSONB columns for containment queries
- Specific key extraction for frequently accessed paths
- Structured data reduces need for additional columns

### Query Performance Tips
- Use appropriate date ranges for time-series data
- Leverage aggregation tables for reporting queries
- Index on commonly filtered columns (patient_id, hospital_id)
- Consider materialized views for complex analytics

---

## Conclusion

This migrated database schema provides a robust foundation for the Dementia Care Web Application with enhanced analytics capabilities, improved performance, and comprehensive patient care tracking. The three new aggregation tables (`daily_task_progress`, `task_adherence_summaries`, `game_performance_summaries`) enable advanced reporting and trend analysis while maintaining data integrity and security standards.

The schema follows healthcare industry best practices for data protection, audit trails, and role-based access control, ensuring compliance with HIPAA and other healthcare regulations.

For any questions about specific tables, relationships, or query patterns, refer to this documentation or consult the development team.

---

*End of Database Documentation*