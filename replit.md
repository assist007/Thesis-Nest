# ThesisNest (THESYS)

A full-stack digital platform for thesis submission, review, feedback, and approval management.

## Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (via Drizzle ORM)
- **Authentication**: Session-based (express-session + connect-pg-simple)
- **State Management**: TanStack Query (React Query)
- **Routing**: wouter

## User Roles

### Student
- Submit thesis proposals (title, abstract, file name)
- Track thesis status (Submitted / Approved / Rejected / Need Changes)
- View version history and supervisor feedback
- Resubmit updated versions when changes requested

### Supervisor
- Review all submitted theses
- Approve / Reject / Request Changes on proposals
- Give written feedback to students
- Filter theses by status

### Admin
- Manage users (create, approve supervisors, delete)
- Manage academic departments (CRUD)
- View reports and statistics (theses by department, reviews by supervisor)
- Approve/reject pending supervisor accounts

## Demo Accounts

| Role       | Email                       | Password   |
|------------|---------------------------|------------|
| Admin      | admin@thesisnest.edu       | admin123   |
| Supervisor | supervisor@thesisnest.edu  | super123   |
| Student    | student@thesisnest.edu     | student123 |

## Database Schema

- `departments` - Academic departments (CSE, EEE, BBA, etc.)
- `users` - All platform users with role-based access
- `theses` - Thesis submissions with status tracking
- `thesis_versions` - Version history for each thesis
- `feedbacks` - Supervisor comments on theses

## Key Files

- `shared/schema.ts` - Drizzle ORM schema + Zod validation
- `server/storage.ts` - Database access layer (IStorage interface)
- `server/routes.ts` - Express API routes
- `server/seed.ts` - Database seeding with realistic demo data
- `client/src/App.tsx` - Route configuration with auth guards
- `client/src/components/layout.tsx` - App shell with sidebar navigation
- `client/src/pages/` - All page components organized by role

## Running

```bash
npm run dev       # Start development server
npm run db:push   # Sync database schema
```
