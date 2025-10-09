# Registration Flow Diagrams

## Overall Registration Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Get In Line Registration                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Registration   │
                    │   Entry Point   │
                    └─────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
    ┌─────────────────┐           ┌─────────────────┐
    │    /signup      │           │ /signup/business│
    │   (Customer)    │           │ (Business User) │
    └─────────────────┘           └─────────────────┘
              │                               │
              │                               │
              ▼                               ▼
        role: 'user'              ┌───────────┴───────────┐
              │                   ▼                       ▼
              │            Business Owner           Staff Member
              │            role: 'admin'            role: 'staff'
              │                   │                       │
              │                   ▼                       ▼
              │            Creates business      Joins existing business
              │                   │                       │
              └───────────────────┴───────────────────────┘
                                  │
                                  ▼
                            Login (/login)
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
        /dashboard        /business-admin    /business-admin
        (Customer)        (Owner)            (Staff)
```

## Business Registration Flow (Detail)

```
┌─────────────────────────────────────────────────────────────┐
│              /signup/business - Multi-Step Form              │
└─────────────────────────────────────────────────────────────┘

STEP 1: User Information
┌────────────────────────────────┐
│ Enter Your Information         │
│ ─────────────────────────────  │
│ Name:     [____________]       │
│ Email:    [____________]       │
│ Password: [____________]       │
│                                │
│         [Continue →]           │
└────────────────────────────────┘
              │
              ▼
STEP 2: Registration Type Selection
┌────────────────────────────────────────────────────┐
│ How do you want to use Get In Line?               │
│                                                    │
│  ◉ Create a Business                              │
│    Start managing queues for your business        │
│                                                    │
│  ○ Join Existing Business                         │
│    Work as staff for an existing business         │
│                                                    │
│     [← Back]              [Continue →]            │
└────────────────────────────────────────────────────┘
              │
        ┌─────┴─────┐
        ▼           ▼
    OWNER        STAFF
    FLOW         FLOW

┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│ STEP 3A: Business Details        │  │ STEP 3B: Business Search         │
│ ──────────────────────────────   │  │ ──────────────────────────────   │
│ Business Name: [__________]      │  │ Search: [type business name...]  │
│ Description:   [__________]      │  │                                  │
│                [__________]      │  │ Results:                         │
│ Type: [Clinic ▼]                 │  │ ┌──────────────────────────────┐ │
│                                  │  │ │ ✓ City Medical Clinic        │ │
│ Plan: Free (Included)            │  │ │   Type: Medical Clinic       │ │
│                                  │  │ └──────────────────────────────┘ │
│ [← Back] [Create Account →]     │  │                                  │
└──────────────────────────────────┘  │ [← Back] [Join as Staff →]      │
              │                       └──────────────────────────────────┘
              │                                     │
              └─────────────┬─────────────────────┘
                            ▼
                   Account Created!
                            │
                            ▼
                   POST /api/auth/signup/business
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      Create Business              Verify Business Exists
      Create Admin User            Create Staff User
              │                           │
              └─────────────┬─────────────┘
                            ▼
                  Redirect to /business-admin
```

## API Request Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Registration Request Flow                  │
└──────────────────────────────────────────────────────────────┘

CLIENT                           SERVER                    DATABASE
  │                                 │                          │
  │  1. Submit Form                 │                          │
  ├────────────────────────────────>│                          │
  │  POST /api/auth/signup/business │                          │
  │                                 │                          │
  │                                 │  2. Validate Data        │
  │                                 │  (Zod Schema)            │
  │                                 │                          │
  │                                 │  3. Create Supabase User │
  │                                 ├─────────────────────────>│
  │                                 │                          │
  │                                 │<─────────────────────────┤
  │                                 │  User Created            │
  │                                 │                          │
  │                                 │  IF OWNER:               │
  │                                 │  4. Create Business      │
  │                                 ├─────────────────────────>│
  │                                 │                          │
  │                                 │  5. Create User Record   │
  │                                 │     role: 'admin'        │
  │                                 ├─────────────────────────>│
  │                                 │                          │
  │                                 │  IF STAFF:               │
  │                                 │  4. Verify Business      │
  │                                 ├─────────────────────────>│
  │                                 │                          │
  │                                 │  5. Create User Record   │
  │                                 │     role: 'staff'        │
  │                                 ├─────────────────────────>│
  │                                 │                          │
  │                                 │  6. Add to business_staff│
  │                                 ├─────────────────────────>│
  │                                 │                          │
  │<────────────────────────────────┤                          │
  │  Success Response                │                          │
  │  { user, business, session }    │                          │
  │                                 │                          │
  │  7. Redirect to /business-admin │                          │
  └─────────────────────────────────┴──────────────────────────┘
```

## Business Search Flow (Staff Registration)

```
┌──────────────────────────────────────────────────────────────┐
│                   Business Search Mechanism                   │
└──────────────────────────────────────────────────────────────┘

USER TYPES                    DEBOUNCE              SEARCH API
    │                            │                       │
    │  "Cit"                     │                       │
    ├───────────────────────────>│                       │
    │                            │ Wait 300ms            │
    │  "City"                    │                       │
    ├───────────────────────────>│                       │
    │                            │ Reset timer           │
    │  "City Med"                │                       │
    ├───────────────────────────>│                       │
    │                            │ Reset timer           │
    │                            │                       │
    │                            │ 300ms elapsed         │
    │                            │ Send request          │
    │                            ├──────────────────────>│
    │                            │ GET /api/businesses/  │
    │                            │     search?q=City+Med │
    │                            │                       │
    │                            │                       │ Search DB
    │                            │                       │ WHERE name
    │                            │                       │ LIKE '%City Med%'
    │                            │                       │
    │                            │<──────────────────────┤
    │                            │ Results:              │
    │<───────────────────────────┤ [City Medical Clinic] │
    │                            │                       │
    │  Display results           │                       │
    │                            │                       │
    │  User clicks result        │                       │
    ├─────────────────────────>  │                       │
    │  Business selected         │                       │
    └────────────────────────────┴───────────────────────┘
```

## Role-Based Access After Registration

```
┌──────────────────────────────────────────────────────────────┐
│                Role-Based Dashboard Access                    │
└──────────────────────────────────────────────────────────────┘

After Login (/login)
        │
        ▼
Check user.role
        │
        ├──────────────────┬─────────────────┬──────────────────┐
        ▼                  ▼                 ▼                  ▼
   role: 'user'      role: 'admin'    role: 'staff'    role: 'super_admin'
        │                  │                 │                  │
        ▼                  ▼                 ▼                  ▼
   /dashboard       /business-admin   /business-admin   /admin (future)
        │                  │                 │                  │
        │                  │                 │                  │
   ┌────┴────┐       ┌─────┴─────┐    ┌─────┴─────┐     ┌─────┴─────┐
   │Customer │       │  Owner    │    │   Staff   │     │  Platform │
   │Features │       │  Features │    │  Features │     │   Admin   │
   ├─────────┤       ├───────────┤    ├───────────┤     ├───────────┤
   │• Join   │       │• All Staff│    │• Manage   │     │• Manage   │
   │  queues │       │  features │    │  queues   │     │  all      │
   │• Track  │       │• Manage   │    │• Call next│     │  businesses│
   │  position│      │  business │    │• Add      │     │• System   │
   │• History│       │• Add staff│    │  walk-ins │     │  settings │
   │• Profile│       │• Analytics│    │• View     │     │           │
   │         │       │• Branches │    │  queue    │     │           │
   │         │       │• Settings │    │  status   │     │           │
   └─────────┘       └───────────┘    └───────────┘     └───────────┘
```

## Database Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                   Database Entity Relationships               │
└──────────────────────────────────────────────────────────────┘

┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   users     │         │  businesses  │         │  branches   │
├─────────────┤         ├──────────────┤         ├─────────────┤
│ id          │◄────┐   │ id           │◄───┐    │ id          │
│ email       │     │   │ name         │    │    │ name        │
│ name        │     │   │ ownerId ─────┼────┘    │ businessId ─┼───┐
│ role        │     │   │ businessType │         │ address     │   │
│ businessId ─┼─┐   │   │ isActive     │         │ managerId ──┼─┐ │
└─────────────┘ │   │   └──────────────┘         └─────────────┘ │ │
                │   │          ▲                         ▲        │ │
                │   │          │                         │        │ │
                │   │          │                         │        │ │
                │   │   ┌──────┴───────┐         ┌───────┴──────┐ │ │
                │   │   │ business_staff│        │    queues    │ │ │
                │   │   ├──────────────┤         ├──────────────┤ │ │
                │   └───┤ userId       │         │ id           │ │ │
                │       │ businessId ──┼─────┐   │ name         │ │ │
                └───────┤ role         │     │   │ businessId ──┼─┘ │
                        │ permissions  │     │   │ branchId ────┼───┘
                        └──────────────┘     │   │ creatorId ───┼───┐
                                             │   │ isActive     │   │
                                             │   └──────────────┘   │
                                             │          ▲           │
                                             │          │           │
                                             │   ┌──────┴────────┐  │
                                             │   │ queue_entries │  │
                                             │   ├───────────────┤  │
                                             │   │ id            │  │
                                             │   │ queueId ──────┼──┘
                                             │   │ userId ───────┼──┐
                                             │   │ position      │  │
                                             │   │ status        │  │
                                             │   └───────────────┘  │
                                             │                      │
                                             └──────────────────────┘

RELATIONSHIPS:
• businesses.ownerId → users.id (One-to-One: Owner)
• users.businessId → businesses.id (Many-to-One: Business Association)
• business_staff.userId → users.id (Many-to-One: Staff Link)
• business_staff.businessId → businesses.id (Many-to-One: Business Link)
• branches.businessId → businesses.id (Many-to-One: Business Branches)
• branches.managerId → users.id (Many-to-One: Branch Manager)
• queues.businessId → businesses.id (Many-to-One: Business Queues)
• queues.branchId → branches.id (Many-to-One: Branch Queues)
• queues.creatorId → users.id (Many-to-One: Queue Creator)
• queue_entries.queueId → queues.id (Many-to-One: Queue Participation)
• queue_entries.userId → users.id (Many-to-One: User in Queue)
```

---

**These diagrams show the complete flow and architecture of the business registration system implemented in Phase 1.**

