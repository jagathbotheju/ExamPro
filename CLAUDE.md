@AGENTS.md

# ExamPro — Implementation Guide

## Overview

ExamPro is a full-stack exam-preparation platform with two role-based surfaces:

- **Student Dashboard** — take assigned exams, track progress, manage profile
- **Admin Dashboard** — manage students, exams, question bank, subjects, and grades

Design reference: `/Users/jagathbotheju/Downloads/design_handoff_exampro/` (high-fidelity prototype — recreate pixel-perfectly).

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router (already scaffolded) |
| Language | TypeScript (strict) |
| Styling | Shadcn UI + Tailwind CSS v4 |
| Theme | Dark mode primary; light mode compatible |
| Database | Neon (PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | Clerk (keys already in `.env`) |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| Icons | Lucide React (preferred) or Font Awesome 6 |
| Charts | Inline SVG (match the design) or Recharts with matching styles |

---

## Design System

All tokens come from `/Users/jagathbotheju/Downloads/design_handoff_exampro/styles.css`. Mirror these exactly.

### Colors (CSS custom properties on `:root`)

```css
/* Surfaces */
--bg:           #0a1220   /* app background */
--bg-elev:      #111c30   /* exam side panel */
--panel:        #16213a   /* card surfaces */
--panel-2:      #1a2640   /* inputs, segmented control bg */
--panel-hover:  #1f2d4a
--border:       #233152
--border-soft:  #1c2845

/* Text */
--text:         #e6ecf5
--text-muted:   #8a9bb8
--text-dim:     #5b6a85

/* Accent + status */
--accent:        #7c5cff   /* primary brand violet */
--accent-soft:   rgba(124, 92, 255, 0.16)
--accent-strong: #6b4cf0
--red:           #e63946
--red-strong:    #d12a37
--green:         #2dd4bf
--green-2:       #34d399
--cyan:          #22d3ee
--amber:         #fbbf24
--pink:          #f472b6
```

### Subject Color Palette

```
math     → #7c5cff  icon: square-root-variable
science  → #22d3ee  icon: flask
history  → #fbbf24  icon: landmark
english  → #f472b6  icon: book-open
buddhism → #2dd4bf  icon: dharmachakra (dharma-wheel in Lucide)
music    → #fb7185  icon: music
```

Subject icon chip: 40×40px, radius 10px, bg = `${color}22` (13% alpha), icon color = subject color, icon = 42% of chip size.

### Grading System

| Grade | Label | Range | Color token |
|-------|-------|-------|-------------|
| A | Distinction | 75 – 100 | `--green` |
| B | Very Good Pass | 65 – 74 | `--cyan` |
| C | Credit Pass | 50 – 64 | `--accent` |
| S | Ordinary Pass | 35 – 49 | `--amber` |
| F/W | Failure | 00 – 34 | `--red` |

Use this mapping everywhere a score is displayed (score pills, result screens, stat tiles, admin student rows). Implement a shared `getGrade(score: number)` utility in `lib/utils.ts`:

```ts
export function getGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 75) return { grade: 'A', label: 'Distinction',      color: 'var(--green)'  };
  if (score >= 65) return { grade: 'B', label: 'Very Good Pass',   color: 'var(--cyan)'   };
  if (score >= 50) return { grade: 'C', label: 'Credit Pass',      color: 'var(--accent)' };
  if (score >= 35) return { grade: 'S', label: 'Ordinary Pass',    color: 'var(--amber)'  };
  return            { grade: 'F/W', label: 'Failure',              color: 'var(--red)'    };
}
```

### Typography

- Primary font: **Inter** (Google Fonts; weights 400/500/600/700/800) — self-host in production
- Sinhala script font: **Noto Sans Sinhala** (Google Fonts; variable weight 100–900)
- `font-feature-settings: "tnum"` on stat numbers and timers
- `-webkit-font-smoothing: antialiased`
- H1: 26px / 700 / -0.01em. Card titles: 15px / 600. Stat numbers: 30px / 700 / -0.02em.
- Body: 13–14px. Meta/labels: 12px muted. Tiny labels: 11px / 600 / 0.08em uppercase.

#### Font loading in `app/layout.tsx`

```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Sinhala:wght@100..900&display=swap"
  rel="stylesheet"
/>
```

#### CSS font stack

```css
--font-ui:  'Inter', 'Noto Sans Sinhala', system-ui, -apple-system, sans-serif;
--font-num: 'Inter', system-ui, sans-serif;
```

Noto Sans Sinhala is included as a fallback in `--font-ui` so Sinhala characters render correctly anywhere body text appears without requiring a separate class. Apply `font-family: var(--font-ui)` to `body`.

### Spacing & Radii

- `--radius: 14px` (cards), `--radius-sm: 10px` (buttons/inputs), `--radius-lg: 20px`
- Card padding: 22px default, 28px hero
- Grid gap: 20px default, 16px for 4-col stat grids, 24px between sections
- Main content padding: `28px 36px 60px`

### Shadcn + Tailwind Integration

Configure `globals.css` so Tailwind v4's `@theme` block maps the above custom properties to Tailwind tokens so Shadcn components inherit them. The dark theme is the **default** (not toggled by a `dark` class) — set at `:root`, not inside `.dark {}`.

---

## Authentication (Clerk)

- API keys are already in `.env` — do not regenerate or hardcode them.
- Enable providers: **Email/Password**, **Google OAuth**, **Apple OAuth** in the Clerk dashboard.

### Middleware

Create `middleware.ts` at project root:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
};
```

### Role-Based Access

Store the user's role (`student` | `admin`) in Clerk's `publicMetadata.role`. Admin routes live under `/admin/(...)`. Students land on `/dashboard/(...)`.

Check role server-side in layout files — never trust client-only checks for routing.

```ts
// app/admin/layout.tsx (server component)
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  const { sessionClaims } = await auth();
  if (sessionClaims?.metadata?.role !== 'admin') redirect('/dashboard');
  return <>{children}</>;
}
```

### Profile Onboarding Gate

Students with an incomplete profile must be redirected to `/onboarding` and cannot access `/dashboard` or start exams. Profile is complete when: `name`, `school`, `grade`, `dateOfBirth`, and `sex` are all set in the DB row.

Check completeness in `app/dashboard/layout.tsx`:

```ts
const profile = await db.query.studentProfiles.findFirst({ where: eq(studentProfiles.userId, userId) });
if (!profile?.isComplete) redirect('/onboarding');
```

---

## Database Schema (Drizzle ORM + Neon)

Schema file: `db/schema.ts`. Connection: `db/index.ts`.

### `db/index.ts`

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Core Tables

```ts
// users / profiles
export const studentProfiles = pgTable('student_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().unique(),          // Clerk user ID
  name: text('name').notNull(),
  school: text('school'),
  grade: text('grade'),                                // 'Grade 7' … 'Grade 13'
  dateOfBirth: date('date_of_birth'),
  sex: text('sex'),                                    // 'Male' | 'Female'
  isComplete: boolean('is_complete').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// subjects (admin-managed)
export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),               // 'math', 'science' …
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
});

// grades (admin-managed)
export const grades = pgTable('grades', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: text('label').notNull().unique(),             // 'Grade 7' … 'Grade 13'
  order: integer('order').notNull(),
});

// questions
export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  body: text('body').notNull(),
  options: jsonb('options').notNull(),                 // string[]  (4 options)
  correctIndex: integer('correct_index').notNull(),    // 0–3
  subjectId: uuid('subject_id').references(() => subjects.id),
  gradeId: uuid('grade_id').references(() => grades.id),
  difficulty: text('difficulty').default('Medium'),    // 'Easy' | 'Medium' | 'Hard'
  usesCount: integer('uses_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// exams
export const exams = pgTable('exams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id),
  gradeId: uuid('grade_id').references(() => grades.id),
  durationMinutes: integer('duration_minutes').notNull(),
  status: text('status').default('draft'),             // 'draft' | 'published' | 'archived'
  createdBy: text('created_by').notNull(),             // admin Clerk user ID
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// exam ↔ question join (ordered)
export const examQuestions = pgTable('exam_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  examId: uuid('exam_id').references(() => exams.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').references(() => questions.id),
  order: integer('order').notNull(),
});

// student exam assignments
export const examAssignments = pgTable('exam_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  examId: uuid('exam_id').references(() => exams.id),
  studentId: uuid('student_id').references(() => studentProfiles.id),
  assignedAt: timestamp('assigned_at').defaultNow(),
  status: text('status').default('pending'),           // 'pending' | 'completed'
});

// exam submissions (one per student per exam)
export const examSubmissions = pgTable('exam_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  examId: uuid('exam_id').references(() => exams.id),
  studentId: uuid('student_id').references(() => studentProfiles.id),
  answers: jsonb('answers').notNull(),                 // Record<questionId, selectedIndex>
  score: integer('score').notNull(),                   // 0–100
  correctCount: integer('correct_count').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  timeSpentSeconds: integer('time_spent_seconds'),
  submittedAt: timestamp('submitted_at').defaultNow(),
});

// incorrect answer tracking (for smart exam generation)
export const incorrectAnswers = pgTable('incorrect_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => studentProfiles.id),
  questionId: uuid('question_id').references(() => questions.id),
  subjectId: uuid('subject_id').references(() => subjects.id),
  lastIncorrectAt: timestamp('last_incorrect_at').defaultNow(),
  incorrectCount: integer('incorrect_count').default(1),
  resolvedAt: timestamp('resolved_at'),               // null = still needs review
});
```

---

## App Routing Structure

```
app/
  (public)/
    sign-in/[[...sign-in]]/page.tsx
    sign-up/[[...sign-up]]/page.tsx
    onboarding/page.tsx              ← student profile completion
  (student)/
    layout.tsx                       ← ClerkProvider, profile gate, student shell
    dashboard/
      page.tsx                       ← Home tab (default)
    dashboard/exams/
      page.tsx                       ← "View all" pending & completed exams
    dashboard/profile/
      page.tsx                       ← Profile tab
    exam/[examId]/
      page.tsx                       ← Active exam (full-screen)
    exam/[examId]/result/
      page.tsx                       ← Exam result review
  (admin)/
    layout.tsx                       ← role guard → redirect if not admin
    admin/
      page.tsx                       ← Admin Home (students overview)
    admin/exams/
      page.tsx                       ← Exam management
    admin/questions/
      page.tsx                       ← Question bank
    admin/settings/
      page.tsx                       ← Admin profile + manage subjects/grades
  api/
    webhooks/clerk/route.ts          ← Clerk webhook: sync user to DB on sign-up
```

Use **route groups** (`(student)`, `(admin)`) so layouts don't bleed across surfaces.

---

## API Routes (Server Actions preferred)

Use **Next.js Server Actions** for mutations (forms, submissions) and **Route Handlers** only for webhook endpoints.

For reads that need caching/deduplication, wrap Server Actions or `fetch` calls in TanStack Query.

### Key Server Actions

```
actions/student/
  getProfile.ts
  updateProfile.ts
  getPendingExams.ts
  getCompletedExams.ts
  getExamQuestions.ts
  submitExam.ts            ← records submission + incorrectAnswers
  getExamResult.ts

actions/admin/
  getStudents.ts
  getStudentDetail.ts
  createExam.ts
  updateExam.ts
  deleteExam.ts
  assignExam.ts
  getExams.ts
  createQuestion.ts
  updateQuestion.ts
  deleteQuestion.ts
  getQuestions.ts
  loadQuestionsFromBank.ts ← random pick + include incorrectly-answered
  createSubject.ts
  updateSubject.ts
  deleteSubject.ts
  createGrade.ts
  updateGrade.ts
  deleteGrade.ts
```

---

## TanStack Query Setup

Create `lib/query-client.ts` and wrap the app in `QueryClientProvider` inside a `'use client'` provider component at `app/providers.tsx`. Use `getQueryClient()` pattern for server-component prefetching.

```ts
// Standard query key factory pattern
export const queryKeys = {
  pendingExams: (grade?: string, subject?: string) => ['exams', 'pending', { grade, subject }],
  completedExams: (grade?: string, subject?: string) => ['exams', 'completed', { grade, subject }],
  examQuestions: (examId: string) => ['exam', examId, 'questions'],
  students: (page: number) => ['admin', 'students', page],
  questionBank: (grade?: string, subject?: string, search?: string) => ['admin', 'questions', { grade, subject, search }],
};
```

---

## Zustand Stores

Only use Zustand for ephemeral UI state that cannot live in a URL param or server:

```ts
// store/exam-store.ts — active exam session
interface ExamStore {
  examId: string | null;
  questions: Question[];
  answers: Record<string, number>;        // questionId → selectedIndex
  flagged: Set<string>;                   // questionIds
  currentIndex: number;
  timeRemaining: number;                  // seconds
  phase: 'idle' | 'active' | 'grading' | 'done';
  // actions ...
}

// store/admin-store.ts — admin filter state
interface AdminStore {
  selectedStudentId: string | null;
  examFilters: { grade: string; subject: string; status: string };
  questionFilters: { grade: string; subject: string; search: string };
}
```

---

## Student Dashboard — Screen Specs

Reference: `home.jsx`, `exams.jsx`, `profile.jsx`, `exam-flow.jsx` in the design handoff.

### Layout Shell
- 240px fixed sidebar + flex main column (topbar + scrollable content)
- `display: grid; grid-template-columns: 240px 1fr; height: 100vh; overflow: hidden`

### Sidebar
- Brand: "ExamPro" (22px/700) + "EXPERT LEVEL" tag (11px/uppercase/dim)
- Nav: Home, Exams, Profile (icon + label). Active = accent-soft bg + accent text.
- Footer: study streak card (fire icon, streak count 28px/700, best record subtext)

### Topbar
- Left: `{firstName} · {grade}` greeting
- Right: search icon, bell (red dot if unread), moon (theme toggle placeholder), 36px avatar (gradient + initials)

### Home Tab
1. **Hero card** — 96px avatar tile (gradient + initials), PREMIUM LEARNER + rank pills, welcome message, score ring SVG (right side) showing overall % from all completed exams
2. **4 stat tiles** — Completed / Pending / Avg. Accuracy / Study Streak. Each: icon chip (tinted), 30px number, 12px label, 11px trend
3. **Performance Analytics** — subject select + Monthly/Yearly segmented control → SVG area chart with gradient fill (color = subject color). Y-axis 40/60/80/100, dashed gridlines.
4. **Pending Exams** — 5 most recent. Columns: subject block, name + meta, "Start Exam" button. "View All" → `/dashboard/exams`
5. **Completed Exams** — 5 most recent. Columns: subject block, name + meta, score pill (color-coded), "View" button → result page

### Exams Tab (`/dashboard/exams`)
- Grade + Subject filter dropdowns at top (updates lists below)
- 4 stat tiles (same as Home but grade-filtered)
- Full paginated pending list + full paginated completed list

### Profile Tab
- Hero: profile photo placeholder (gradient + initials + edit FAB), name, email, school, grade
- Editable fields card with inline editing
- Stats row (Exams Taken / Accuracy / Focus Hours / Rank)
- Logout button (red)

### Onboarding (`/onboarding`)
2-step modal/page:
1. School Name + Grade select
2. Date of Birth (calendar picker) + Sex (3-button selector: Male / Female / Other)

Back/Continue/Complete. **Complete** button enabled only when all fields are filled. On completion, set `isComplete = true` in DB, redirect to `/dashboard`.

### Active Exam (`/exam/[examId]`)
Full-viewport overlay (no sidebar/topbar):
- Top bar: exam name, countdown timer (mm:ss, red when < 60s), Submit + Cancel
- Body 1fr: question number, question body, 4 answer cards (A/B/C/D letter chip + text). Selected = accent border + soft bg.
- Previous / Next / Flag for Review buttons
- Right 280px sidebar: progress bar, 5-col question grid (current/answered/flagged/default states, clickable to jump), legend
- On Submit: 2s "Grading…" spinner → redirect to `/exam/[examId]/result`
- Auto-submit when timer reaches 0

### Exam Result (`/exam/[examId]/result`)
- Summary card: ScoreRing SVG + score headline + correct/wrong/time stats
- Per-question review: show all options; mark user's answer (`wrong` or `correct` class), mark correct answer. Show "CORRECT ANSWER" / "YOUR ANSWER" labels.
- "Back to Dashboard" button

---

## Admin Dashboard — Screen Specs

Reference: `admin-home.jsx`, `admin-exams.jsx`, `admin-questions.jsx`, `admin-shell.jsx` in the design handoff.

### Admin Shell
- Same 240px sidebar pattern, but with: "ExamPro" brand + "ADMIN CONSOLE" tag
- Nav: Home, Exams, Questions Bank, Settings
- Footer: admin name + role. No "Switch to Student" button in production.

### Admin Home (`/admin`)
1. "Overview" h1 + subtitle
2. 4 stat tiles: Total Students / Active Exams / Questions in Bank / Avg Score
3. **Students list** — 5 per page, sorted A-Z by name. Columns: avatar+name, grade, school, avg % (color-coded), last-active, status pill (active/paused). Click row = select student.
4. **Selected student label** — "Showing data for {name} · {grade}"
5. **Pending Exams for student** — 4 per page pagination. Columns: subject block, name + meta (subject, date, Q count). "View" button.
6. **Completed Exams for student** — 4 per page pagination. Columns: subject block, name + meta, score pill, "View" button → opens result detail.
7. **Results graph** — SVG line chart with gradient fill. Filters: Year select, Grade select, Monthly/Yearly segmented. Updates on student select + filter change.

### Admin Exams (`/admin/exams`)
- Header: "Exams" h1 + "Create New Exam" primary button (top right)
- Filter bar (card): Grade select + Subject select + result count
- Exam list (10/page with pagination). Per row: subject block, exam name (DRAFT/ARCHIVED pill if applicable), meta (subject · grade · published · Q count · assigned count), Assign button, View button, delete icon-button.
- **Create Exam dialog** (modal, large):
  - Fields: Exam Name, Subject, Grade, Duration (minutes), Question Count
  - Question picker: scrollable list of matching questions (subject+grade filtered) with checkboxes
  - "Load Questions from Bank" button — picks N random questions from bank, **prioritizing questions the target student(s) have previously answered incorrectly**
  - Checkbox: "Include incorrectly answered questions (recommended)"
  - Create button disabled until name + at least 1 question picked
- **Assign Exam dialog** (modal):
  - Search input with student autocomplete
  - Scrollable student list with checkboxes
  - "Select all" button
  - Assign to N button (disabled until ≥1 selected)
- **View/Edit Exam dialog** (modal, large): shows all questions as editable inputs. Save Changes button.

### Admin Questions Bank (`/admin/questions`)
- Header: "Questions Bank" h1 + "Create New MCQ Question" primary button
- Filter bar: search input + Grade select + Subject select
- Questions list (10/page). Per row: subject block, question body (2-line clamp), subject · grade · difficulty pill · used count, View + Edit + Delete buttons.
- **Question dialog** (create/edit, modal, large):
  - Question Body textarea (3 rows)
  - Subject / Grade / Difficulty selects (3-col grid)
  - 4 option inputs with letter chip (A/B/C/D). Click letter chip to mark correct answer (chip fills accent).
  - Create / Save Changes button

### Admin Settings (`/admin/settings`)
- Admin profile hero (same pattern as student profile)
- 2-col grid:
  - **Manage Subjects** card: list of subjects (subject block + name, edit/delete buttons), Add subject button, pagination
  - **Manage Grades** card: list of grades (name, edit/delete buttons), Add grade button, pagination
- **Admin Preferences** card: Dark Mode toggle, Activity Notifications toggle, 2FA toggle

---

## Smart Exam Generation

When admin clicks "Load Questions from Bank":

1. Query `incorrectAnswers` table for the selected students (or all students if assigning to many) filtered by `subjectId` where `resolvedAt IS NULL`
2. Union with general question pool for that subject+grade
3. Randomly sample `questionCount` questions, biasing toward unresolved incorrect answers
4. When a student correctly answers a previously incorrect question, update `incorrectAnswers.resolvedAt = now()`

---

## Forms & Validation

Use **React Hook Form** + **Zod** for all forms. Define schemas in `lib/schemas/`.

```ts
// Example
export const createQuestionSchema = z.object({
  body: z.string().min(10, 'Question must be at least 10 characters'),
  subjectId: z.string().uuid(),
  gradeId: z.string().uuid(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().min(0).max(3),
});
```

---

## Notifications (Sonner)

```ts
import { toast } from 'sonner';

toast.success('Exam submitted successfully');
toast.error('Failed to save question');
toast.loading('Grading exam…');
```

Place `<Toaster />` in the root layout.

---

## Component Library Guidelines

Use **Shadcn UI** components as the base, then override with the design tokens above. Priority: use Shadcn's `Dialog`, `Select`, `Input`, `Button`, `Switch`, `Pagination` — then style via Tailwind classes referencing the CSS custom properties.

Custom components to build (not covered by Shadcn):
- `SubjectBlock` — icon chip with subject color
- `ScoreRing` — SVG arc ring with gradient
- `PerformanceChart` — SVG line chart with gradient area
- `ResultsGraph` — admin version of chart (violet gradient)
- `StatTile` — icon chip + number + label + trend
- `QuestionNav` — 5-col grid of question number tiles
- `PendingExamRow` / `CompletedExamRow` — list row components

---

## Key Next.js 16 Conventions (Breaking Changes)

- `app/icon.tsx` is **reserved** as an App Icon metadata file — never use it for a component. Name icon wrappers `lucide-icon.tsx` or similar.
- All component/lib folders inside `app/` must use `_` prefix (`_components/`, `_lib/`) to opt out of routing.
- All interactive components require `'use client'` — do not mix server and client state in the same file.
- `<link>` tags for fonts/CDN can be placed in `<head>` inside `app/layout.tsx` directly.
- Clerk's `auth()` is async in Next.js 15+: `const { userId } = await auth()`.
- Use `import { headers } from 'next/headers'` only in Server Components / Route Handlers, not in client components.

---

## Environment Variables

These must be in `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...   # already set
CLERK_SECRET_KEY=...                    # already set
CLERK_WEBHOOK_SECRET=...                # set after creating webhook in Clerk dashboard
DATABASE_URL=...                        # Neon connection string
```

Never commit `.env.local` or `.env`.

---

## File & Folder Structure

```
exam-pro2/
  app/
    (public)/
      sign-in/[[...sign-in]]/page.tsx
      sign-up/[[...sign-up]]/page.tsx
      onboarding/page.tsx
    (student)/
      layout.tsx
      dashboard/page.tsx
      dashboard/exams/page.tsx
      exam/[examId]/page.tsx
      exam/[examId]/result/page.tsx
    (admin)/
      layout.tsx
      admin/page.tsx
      admin/exams/page.tsx
      admin/questions/page.tsx
      admin/settings/page.tsx
    api/
      webhooks/clerk/route.ts
    _components/
      ui/                           ← Shadcn components (do not hand-edit)
      student/                      ← Student-surface components
        sidebar.tsx
        topbar.tsx
        home-tab.tsx
        exams-tab.tsx
        profile-tab.tsx
        active-exam.tsx
        exam-results.tsx
        onboarding-form.tsx
      admin/                        ← Admin-surface components
        admin-sidebar.tsx
        admin-topbar.tsx
        admin-home-tab.tsx
        admin-exams-tab.tsx
        admin-questions-tab.tsx
        admin-settings-tab.tsx
        create-exam-dialog.tsx
        assign-exam-dialog.tsx
        question-dialog.tsx
      shared/                       ← Used by both surfaces
        subject-block.tsx
        score-ring.tsx
        performance-chart.tsx
        stat-tile.tsx
        pagination.tsx
        question-nav.tsx
        exam-row.tsx
    _lib/
      types.ts                      ← All shared TypeScript interfaces
      utils.ts                      ← cn(), score color helpers, etc.
      query-keys.ts
      schemas/                      ← Zod schemas
    globals.css
    layout.tsx
    providers.tsx                   ← QueryClientProvider + ClerkProvider
  db/
    schema.ts
    index.ts
    migrations/
  store/
    exam-store.ts
    admin-store.ts
  actions/
    student/
    admin/
  middleware.ts
  drizzle.config.ts
```

---

## Implementation Order

1. Database: schema, migrations, seed subjects + grades
2. Auth: Clerk middleware, sign-in/up pages, webhook to create `studentProfiles` row
3. Onboarding: profile completion form + gate in student layout
4. Shared components: SubjectBlock, ScoreRing, PerformanceChart, StatTile, Pagination
5. Student Dashboard: Home tab → Exams tab → Profile tab
6. Exam flow: Active Exam page → submit → Results page
7. Admin shell + Admin Home (student list + detail panels)
8. Admin Exams (CRUD + assign + create exam dialog)
9. Admin Questions Bank (CRUD)
10. Admin Settings (subjects + grades management)
11. Smart exam generation (incorrectAnswers tracking + biased question loading)
