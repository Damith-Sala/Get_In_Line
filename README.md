Developer Specification Document — Get In Line
Project Summary
Get In Line is a virtual queuing web app. It replaces physical waiting lines with digital ones. Users check in remotely for appointments or services, monitor their queue status in real-time, and get notified when their turn is approaching. The platform helps businesses manage queues efficiently and reduce congestion.
________________________________________
1. Tech Stack
Frontend:
●	Next.js 15 (App Router)

●	React 19

●	TypeScript

●	ShadCN UI

●	TailwindCSS

●	Zustand or Jotai for state management

●	React Query or TanStack Query for server communication

●	React Hook Form + Zod for validation

●	Socket.IO or Supabase Realtime for real-time queue updates

Backend:
●	Next.js API routes (edge or serverless)

●	Drizzle ORM (with migrations)

●	PostgreSQL (Supabase-hosted or RDS)

●	Redis (optional, for caching queue states)

●	WebSocket real-time events

Infrastructure:
●	Docker for containerization

●	Nginx or Traefik for reverse proxy

●	CI/CD via GitHub Actions

●	Vercel (for front) + Supabase (for backend + DB)

●	Optional: AWS SES or Resend for email notifications

●	Firebase Cloud Messaging or OneSignal for push notifications

________________________________________
2. Core Modules
2.1 User-Facing Features
Feature	Description
Login/Signup	Email, Google, or Apple login. JWT or Supabase Auth.
Home Page	Search or browse nearby businesses that use Get In Line.
Check-In Flow	User selects a business → service type → check-in → gets virtual ticket (with queue number).
Queue Dashboard	Displays real-time queue status (e.g., “5 people ahead,” “estimated wait time: 12 mins”).
Notifications	Push, SMS, or email when user’s turn is near.
My Tickets Page	Lists current and past queue entries.
Cancel Queue Entry	User can cancel a check-in before their turn.
Profile Settings	Edit name, phone, email, notification preferences.
________________________________________
2.2 Business/Admin Features
Feature	Description
Admin Dashboard	Overview of queues, customer flow, wait times, and analytics.
Branch Management	Businesses can register multiple branches.
Queue Management	Create and manage queues by service type. Set queue rules (max people, time slots, etc.).
Manual Check-In	For walk-ins. Admin can add someone to the queue manually.
Announcements/Display View	A “TV Mode” showing the current serving number and next few numbers.
Queue Analytics	Metrics like average wait time, peak hours, drop-off rates, etc.
Notifications	Send bulk announcements or individual messages.
User Roles	Super Admin (platform-level), Business Admin, and Staff.
Subscription Plans (optional)	Businesses can subscribe to Premium tiers for features like analytics, custom branding, etc.
________________________________________
2.3 Super Admin (Platform Owner)
Feature	Description
System Dashboard	View all businesses, usage metrics, and queue statistics globally.
Business Verification	Approve/reject new business registrations.
Subscription Management	Stripe or Lemon Squeezy integration.
Email Templates	Manage notification templates.
Global Settings	Manage feature toggles, rate limits, etc.
________________________________________
3. Database Schema (Drizzle ORM)
Core Tables
1.	users

○	id (uuid, pk)

○	name

○	email

○	phone

○	role (enum: user, staff, admin, super_admin)

○	created_at

○	updated_at

2.	businesses

○	id (uuid)

○	name

○	owner_id (fk → users.id)

○	address

○	latitude

○	longitude

○	verified (boolean)

○	created_at

○	updated_at

3.	branches

○	id (uuid)

○	business_id (fk)

○	name

○	location

○	contact_number

○	created_at

4.	queues

○	id (uuid)

○	branch_id (fk)

○	name

○	estimated_wait_time (integer)

○	status (enum: open, closed)

○	created_at

○	updated_at

5.	queue_entries

○	id (uuid)

○	queue_id (fk)

○	user_id (fk)

○	number (integer)

○	status (enum: waiting, called, missed, served, canceled)

○	check_in_time

○	called_time

○	served_time

6.	notifications

○	id (uuid)

○	user_id (fk)

○	message

○	type (enum: sms, push, email)

○	read (boolean)

○	created_at

7.	subscriptions

○	id (uuid)

○	business_id (fk)

○	plan (string)

○	status (active/inactive)

○	start_date

○	end_date

________________________________________
4. App Folder Structure
src/
 ├─ app/
 │   ├─ (public)/
 │   │   ├─ page.tsx               # Landing Page
 │   │   ├─ login/
 │   │   └─ signup/
 │   ├─ dashboard/
 │   │   ├─ layout.tsx
 │   │   ├─ page.tsx               # Queue Dashboard
 │   │   ├─ queues/
 │   │   │   ├─ [id]/page.tsx
 │   │   └─ settings/
 │   ├─ admin/
 │   │   ├─ businesses/
 │   │   ├─ analytics/
 │   │   ├─ queues/
 │   │   └─ display/
 │   └─ api/
 │       ├─ queues/
 │       ├─ businesses/
 │       ├─ entries/
 │       └─ notifications/
 │
 ├─ components/
 │   ├─ ui/                        # ShadCN components
 │   ├─ layout/
 │   ├─ queue-card.tsx
 │   ├─ ticket-view.tsx
 │   ├─ business-list.tsx
 │   └─ form/
 │
 ├─ lib/
 │   ├─ drizzle/
 │   ├─ auth.ts
 │   ├─ socket.ts
 │   ├─ helpers.ts
 │   └─ notifications.ts
 │
 ├─ hooks/
 │   ├─ useQueue.ts
 │   ├─ useAuth.ts
 │   └─ useNotifications.ts
 │
 ├─ store/
 │   ├─ queueStore.ts
 │   ├─ userStore.ts
 │   └─ settingsStore.ts
 │
 └─ styles/a
     └─ globals.cssa
________________________________________
5. APIs
Base URL: /api/
Endpoints
Endpoint	Method	Description
/auth/register	POST	Register a user
/auth/login	POST	Authenticate user
/businesses	GET/POST	Manage business profiles
/queues	GET/POST/PUT	Manage queues
/queues/[id]/join	POST	User joins a queue
/queues/[id]/next	POST	Call next person
/entries	GET	List user’s queue entries
/notifications	GET	Fetch notifications
________________________________________
6. Real-Time Logic
●	Use WebSockets (via Socket.IO ) for:

○	Broadcasting queue updates (when a number is called, missed, or canceled)

○	Updating estimated wait times live

○	Showing the user’s queue position instantly

●	Redis can cache the current queue state for fast reads.

________________________________________
7. Developer Guidelines
●	Code must be fully typed (TypeScript).

●	Use Zod for schema validation (API + forms).

●	Follow feature-based folder structure.

●	Use ESLint + Prettier and commit hooks.

●	Unit test with Vitest/Jest.

●	Write integration tests for critical API routes.

●	All components must be responsive and accessible (ARIA-compliant).

●	Use Drizzle migrations for DB schema updates.

●	PRs require passing CI checks.


________________________________________
8. Deliverables
1.	Functional App

○	User app

○	Business admin dashboard

○	Super admin panel

2.	Documentation

○	API documentation (OpenAPI)

○	README setup guide

○	ER diagram

○	Deployment instructions

3.	Testing

○	Unit and integration tests

○	Manual testing checklist


