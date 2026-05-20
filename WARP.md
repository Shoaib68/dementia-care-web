# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev              # Start development server with Turbopack (fast)
npm run dev:legacy       # Start development server without Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Bundle Analysis
```bash
npm run analyze          # Analyze bundle size with webpack bundle analyzer
```

## Tech Stack

- **Framework**: Next.js 15.4.5 (App Router)
- **Language**: TypeScript 5+ (strict mode enabled)
- **Styling**: Tailwind CSS 4.1.11 (modern CSS-based config, no separate config file)
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: 
  - **Client State**: Zustand 5.0.7 with persistence middleware
  - **Server State**: TanStack Query 5.85.5 with DevTools
- **Backend**: Supabase (PostgreSQL + Auth)
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion 12.23.12
- **Charts**: Recharts 3.1.2

## Architecture Overview

This is a **feature-first clean architecture** healthcare application with three role-based portals:

1. **Super Admin Portal** (`/super-admin`) - System-wide hospital management
2. **Hospital Admin Portal** (`/hospital-admin`) - Hospital-level doctor & patient management
3. **Doctor Portal** (`/doctor`) - Patient care and medical records

### Core Architectural Principles

#### Feature-First Directory Structure
```
features/
  ├── auth/              # Authentication logic
  │   ├── hooks/         # React hooks (useAuth)
  │   ├── services/      # Business logic
  │   ├── context/       # React context
  │   └── types.ts       # Feature-specific types
  ├── super-admin/       # Super admin features
  ├── hospital/          # Hospital admin features
  └── doctor/            # Doctor features
```

**CRITICAL RULE**: Features contain ONLY domain-specific logic (services, hooks, types, utils). All UI components live in `shared/components/`.

#### Dependency Flow
```
UI Components → Feature Hooks → Feature Services → Database (Supabase)
       ↓
  Shared Utilities
```
**Never allow circular dependencies or UI components in feature directories.**

#### API Route Pattern
API routes in `app/api/` **must delegate to feature services**, not contain business logic:
```typescript
// ✅ CORRECT: API route delegates to service
export async function POST(request: NextRequest) {
  const data = await request.json();
  const result = await hospitalService.createHospital(data);
  return NextResponse.json(result);
}

// ❌ WRONG: Business logic in API route
export async function POST(request: NextRequest) {
  const data = await request.json();
  const result = await supabase.from('hospitals').insert(data); // Direct DB access
  return NextResponse.json(result);
}
```

## Critical Development Workflows

### Before Writing Any Code

**ALWAYS read these files first:**

1. **`structure.md`** - Complete project structure, recent updates, and architectural decisions
2. **`databasemain.md`** - Database schema, foreign key relationships, and data integrity rules

### When Creating New Features

1. **Read `structure.md`** to understand existing patterns
2. **Add new files to `structure.md`** as you create them
3. **Follow feature-first architecture**: services → hooks → UI
4. **Reuse existing components** from `shared/components/` before creating new ones
5. **Never modify database directly** - always use Supabase service layer

### Common Component Patterns

#### Reusable Dashboard Components
Always use these standardized components across all portals:

```typescript
// Metric cards
<DashboardMetricCard 
  title="Total Patients" 
  value={45} 
  icon={Users} 
  iconColor="blue" 
/>

// Page headers with actions
<PageHeader 
  title="Hospital Management"
  subtitle="Manage hospitals in the system"
  actions={[
    { label: "Refresh", variant: "outline", icon: RefreshCw, onClick: refresh }
  ]}
/>

// Loading states
<LoadingSpinner size="lg" />
```

#### Modal Pattern
All modals follow this structure:
- Use `Dialog` from shadcn/ui
- Framer Motion animations with consistent variants
- Form validation with React Hook Form + Zod
- TanStack Query mutations with optimistic updates

## State Management Patterns

### TanStack Query Configuration

**Environment-Aware Settings** (Critical for data loading):
```typescript
// Development: Fresh data on every mount
staleTime: 0
refetchOnMount: true
refetchOnWindowFocus: false

// Production: 5-minute cache
staleTime: 5 * 60 * 1000
refetchOnMount: true
refetchOnWindowFocus: true
```

**Use query configuration presets** from `shared/lib/query-config.ts`:
```typescript
import { analyticsQueryConfig, hospitalQueryConfig } from '@/shared/lib/query-config';

// For analytics data
useQuery({
  queryKey: queryKeys.analytics.system(),
  queryFn: fetchAnalytics,
  ...analyticsQueryConfig,
});
```

### Query Keys Factory
Always use centralized query keys from `shared/lib/query-keys.ts`:
```typescript
// Hierarchical structure for cache invalidation
queryKeys.hospitals.all()           // ['hospitals']
queryKeys.hospitals.detail(id)      // ['hospitals', 'detail', id]
queryKeys.hospitals.statistics(id)  // ['hospitals', 'statistics', id]
```

### Optimistic Updates Pattern
```typescript
const mutation = useMutation({
  mutationFn: updatePatient,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['patients'] });
    const previousData = queryClient.getQueryData(['patients']);
    queryClient.setQueryData(['patients'], (old) => [...old, newData]);
    return { previousData };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['patients'], context.previousData);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['patients'] });
  },
});
```

## Authentication & Authorization

### Role-Based Access Control
Three user types with strict portal isolation:
- `super_admin` - Full system access
- `hospital_admin` - Single hospital management
- `doctor` - Patient care within assigned hospital

### Middleware Protection
`middleware.ts` enforces:
- Cookie-based authentication (`dementia-care-auth`)
- Role-based route protection
- Active account verification
- Hospital data isolation via headers (`x-hospital-id`)

### Using Auth Hook
```typescript
const { user, hospital, isAuthenticated, login, logout } = useAuth();

// User object includes:
// - user.id, user.email, user.user_type
// - user.is_active (account status)
// - user.hospital (for hospital_admin)
// - user.doctor_profile (for doctors)
```

## Database Guidelines

### NEVER Modify Database Directly
**Always use Supabase service layer** with proper error handling:

```typescript
// ✅ CORRECT: Use service layer
import { createClient } from '@/shared/lib/supabase-server';
const supabase = createClient();
const { data, error } = await supabase.from('patients').select('*');

// ❌ WRONG: Direct SQL or manual queries
```

### Foreign Key Relationships
**Refer to `databasemain.md`** for complete schema. Key relationships:
- Hospitals → Hospital Admins (1:1)
- Hospitals → Doctors (1:N)
- Doctors → Patients (1:N via `patient_doctor_assignments`)
- Patients → Caregivers (1:1 via `patient_caregiver_assignments` with `is_primary: true`)

### Cascade Deletion Order
When deleting entities with relationships, follow this order:
1. Child records (IoT devices, game sessions, medical notes)
2. Assignment tables (patient-doctor, patient-caregiver)
3. Role-specific records (caregivers, patients, doctors)
4. Parent records (hospitals)
5. User authentication records (Supabase Auth)

**See `CascadeDeletionService` in `shared/services/cascade-deletion.service.ts`**

## Form Validation

### Validation Pattern
All forms use **React Hook Form + Zod schemas**:

```typescript
// 1. Define Zod schema
const patientSchema = z.object({
  firstName: z.string().min(2, "First name required"),
  email: z.string().email("Invalid email"),
  dementiaStage: z.enum(['Mild', 'Moderate', 'Severe']),
});

// 2. Use with React Hook Form
const form = useForm<z.infer<typeof patientSchema>>({
  resolver: zodResolver(patientSchema),
  defaultValues: { ... },
});

// 3. Handle submission
const onSubmit = async (data) => {
  await createPatientMutation.mutateAsync(data);
};
```

### Real-Time Email Validation
Use debounced validation hooks for email fields:
```typescript
import { useEmailValidation } from '@/features/doctor/hooks';

const { isValidating, validationError, validationSuccess } = useEmailValidation({
  email: watch('email'),
  userId: patient?.id, // For edit forms
});
```

## Important Files Reference

### Must-Read Before Any Changes
- **`structure.md`** - Complete project structure and update history
- **`databasemain.md`** - Database schema and constraints
- **`middleware.ts`** - Route protection and role enforcement
- **`shared/lib/query-keys.ts`** - Centralized query key factory
- **`shared/lib/query-config.ts`** - Reusable query configurations

### Component Libraries
- **`shared/components/ui/`** - shadcn/ui base components
- **`shared/components/common/`** - Reusable dashboard components
- **`shared/components/modals/`** - Standard modal patterns
- **`shared/components/charts/`** - Recharts chart components

### Services
- **`features/{role}/services/`** - Business logic for each role
- **`shared/services/cascade-deletion.service.ts`** - Safe entity deletion
- **`features/credential-management/`** - User credential generation

## Key Patterns to Follow

### Component Reusability
**ALWAYS check for existing components before creating new ones:**
- Buttons, inputs, dialogs → `shared/components/ui/`
- Metric cards, page headers → `shared/components/common/`
- Modals → `shared/components/modals/`
- Charts → `shared/components/charts/`

**Reuse across portals**: A button component in super admin should be reused in hospital admin and doctor portals.

### Error Handling
Standard error pattern:
```typescript
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  console.error('[Service Name] Error:', error);
  return { 
    success: false, 
    error: error.message || 'Operation failed' 
  };
}
```

### Loading States
Use skeleton components during data fetching:
```typescript
if (isLoading) return <TableSkeleton />;
if (error) return <ErrorState message={error.message} />;
return <DataTable data={data} />;
```

## Theme System

### Light Healthcare Theme
Uses dementia care brand colors:
- **Primary**: Teal (#2dd4bf)
- **Secondary**: Purple (#a855f7)
- **Accent**: Green (#86efac)

### Theme Configuration
Located in `shared/lib/theme.ts`:
- `colorTheme` - Brand colors and semantic tokens
- `layoutTheme` - Soft neutral backgrounds (WCAG AA compliant)
- `spacingTheme` - 8px grid system
- `accentTheme` - Strategic brand color usage

### Design Principles
- **Soft neutral backgrounds** (from-neutral-50 via-white to-neutral-100)
- **Dark readable text** (neutral-700, neutral-900)
- **Brand colors as accents only** (60-30-10 rule)
- **4.5:1+ contrast ratios** for accessibility

## Animations

### Framer Motion Patterns
Consistent animation variants from `shared/animations/`:
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
```

### Common Use Cases
- **Modal entrance**: Fade + scale from 0.95 to 1
- **List items**: Stagger with 0.1s delay
- **Hover effects**: Scale (1.02) + lift (-2px translateY)
- **Loading states**: Skeleton pulse animations

## Windows Development Notes

This project is developed on Windows (`pwsh` shell). File paths use Windows-style separators in local development but Unix-style in code.

### Path Handling
- Code imports use `/` (handled by TypeScript/Node.js)
- Use `@/` alias for absolute imports (defined in `tsconfig.json`)
- Next.js handles path normalization automatically

## Production Checklist

Before deploying or committing significant changes:
1. ✅ Run `npm run lint` to check for errors
2. ✅ Test across all three portals (super admin, hospital admin, doctor)
3. ✅ Verify TanStack Query cache invalidation
4. ✅ Check middleware protection for new routes
5. ✅ Update `structure.md` with new files/features
6. ✅ Ensure no console.log statements (removed in production build)
7. ✅ Test optimistic updates rollback on errors
8. ✅ Verify foreign key relationships in database operations

## Recent Architectural Updates

### TanStack Query Data Loading Fix (December 2025)
- **Development environment**: `staleTime: 0` for immediate data refresh
- **Production environment**: `staleTime: 5 * 60 * 1000` for caching
- **All queries**: `refetchOnMount: true` to ensure data loads on component mount
- **Reusable query configs**: Use presets from `shared/lib/query-config.ts`

### Doctor Deletion with Patient Reassignment (September 2025)
- Check for assigned patients before deletion
- Interactive reassignment workflow with bulk assignment
- Data integrity throughout deletion process

### Cascading Status Management (January 2025)
- Hospital deactivation cascades to all doctors and admins
- Atomic transactions with rollback protection
- Real-time doctor count fetching for impact assessment

---

**Last Updated**: January 2025

For detailed architectural decisions and feature history, refer to `structure.md`.
For database schema and relationships, refer to `databasemain.md`.
