# Get In Line - Queue Management System

A comprehensive queue management system built with Next.js, supporting both individual users and business administrators. Perfect for clinics, restaurants, banks, and any service-oriented business.

## 🚀 Features

### For Users
- Join queues and track position in real-time
- View queue status and estimated wait times
- Receive notifications about position changes
- Manage personal queue history

### For Business Admins
- Create and manage business accounts with multiple branches
- Set up queues for different service types
- Control queue operations (open/close, call next, add walk-ins)
- Manage staff with role-based permissions
- View analytics and performance metrics
- Send announcements and notifications

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth
- **Validation**: Zod schemas

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Supabase account

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd get-in-line
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
# Add your Supabase and database credentials
```

3. **Set up database:**
```bash
npm run generate  # Generate migrations
npm run migrate   # Run migrations
```

4. **Start development server:**
```bash
npm run dev
```

5. **Open the application:**
   - User interface: http://localhost:3000
   - Business admin: http://localhost:3000/business-admin

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Login user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { "id": "uuid", "email": "user@example.com" },
  "session": { "access_token": "..." }
}
```

#### POST `/api/auth/signup`
Register new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": { "id": "uuid", "email": "user@example.com" }
}
```

### Queue Management Endpoints

#### GET `/api/queues`
Get all available queues.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Doctor Consultation",
    "description": "General medical consultation",
    "max_size": 50,
    "is_active": true,
    "estimated_wait_time": 15
  }
]
```

#### POST `/api/queues`
Create a new queue (requires authentication).

**Request:**
```json
{
  "name": "Lab Test",
  "description": "Blood test and lab work",
  "serviceType": "medical",
  "maxSize": 30,
  "estimatedWaitTime": 10
}
```

#### POST `/api/queues/[id]/join`
Join a specific queue.

**Request:**
```json
{
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "id": "entry-uuid",
  "position": 5,
  "status": "waiting",
  "enteredAt": "2024-01-01T10:00:00Z"
}
```

#### POST `/api/queues/[id]/leave`
Leave a queue.

**Request:**
```json
{
  "userId": "user-uuid"
}
```

#### POST `/api/queues/[id]/next`
Call next person in queue (staff/admin only).

**Response:**
```json
{
  "id": "entry-uuid",
  "position": 1,
  "status": "serving",
  "user": { "name": "John Doe", "email": "john@example.com" }
}
```

### Business Management Endpoints

#### GET `/api/businesses`
Get all businesses.

#### POST `/api/businesses`
Create a new business account.

**Request:**
```json
{
  "name": "City Medical Clinic",
  "description": "Full-service medical clinic",
  "businessType": "clinic",
  "subscriptionPlan": "premium"
}
```

**Response:**
```json
{
  "id": "business-uuid",
  "name": "City Medical Clinic",
  "businessType": "clinic",
  "subscriptionPlan": "premium",
  "ownerId": "user-uuid"
}
```

#### GET `/api/businesses/[id]/branches`
Get all branches for a business.

#### POST `/api/businesses/[id]/branches`
Add a new branch to a business.

**Request:**
```json
{
  "name": "Downtown Branch",
  "address": "123 Main St, Downtown",
  "phone": "+1-555-0123",
  "email": "downtown@clinic.com"
}
```

#### GET `/api/businesses/[id]/staff`
Get all staff members for a business.

#### POST `/api/businesses/[id]/staff`
Add a staff member to a business.

**Request:**
```json
{
  "userId": "user-uuid",
  "role": "staff",
  "permissions": "{\"canManageQueues\": true, \"canViewAnalytics\": false}"
}
```

### Queue Control Endpoints

#### POST `/api/businesses/[id]/queues/[queueId]/control`
Control queue operations (admin/staff only).

**Actions:**
- `next` - Call next person in queue
- `open` - Open the queue
- `close` - Close the queue
- `walkin` - Add walk-in customer

**Request:**
```json
{
  "action": "next"
}
```

**For walk-in:**
```json
{
  "action": "walkin",
  "userId": "user-uuid"
}
```

### Analytics Endpoints

#### GET `/api/businesses/[id]/analytics`
Get business analytics and metrics.

**Query Parameters:**
- `days` - Number of days to analyze (default: 7)

**Response:**
```json
{
  "summary": {
    "totalQueues": 3,
    "totalEntries": 150,
    "averageWaitTime": 12.5,
    "peakHour": 10,
    "completedServices": 120,
    "cancelledServices": 5
  },
  "dailyStats": [
    {
      "date": "2024-01-01",
      "totalEntries": 25,
      "completedServices": 20,
      "cancelledServices": 1
    }
  ],
  "queueStats": [
    {
      "queueId": "queue-uuid",
      "queueName": "Doctor Consultation",
      "totalEntries": 50,
      "completedServices": 45,
      "averageWaitTime": 15
    }
  ],
  "hourlyDistribution": [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 8, 12, 10, 8, 6, 4, 3, 2, 1, 0, 0, 0, 0, 0]
}
```

### Notification Endpoints

#### GET `/api/businesses/[id]/notifications`
Get notifications for a business.

**Query Parameters:**
- `limit` - Number of notifications to return (default: 50)

#### POST `/api/businesses/[id]/notifications`
Send a notification/announcement.

**Request:**
```json
{
  "type": "announcement",
  "title": "Queue Update",
  "message": "Current wait time is approximately 15 minutes",
  "queueId": "queue-uuid"
}
```

### User Management Endpoints

#### GET `/api/users`
Get all users (admin only).

#### POST `/api/sync-user`
Sync user data with Supabase.

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts and authentication
- **businesses** - Business accounts and settings
- **branches** - Business locations
- **queues** - Queue definitions and settings
- **queue_entries** - Individual queue participations
- **business_staff** - Staff roles and permissions
- **notifications** - Announcements and updates
- **queue_analytics** - Performance metrics

## 🔐 Authentication & Authorization

- **Supabase Auth** for user authentication
- **Role-based access control** (user, staff, admin, super_admin)
- **Business-level permissions** for staff management
- **Protected routes** with middleware

## 🚀 Deployment

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgres_connection_string
NEXT_PUBLIC_SITE_URL=your_domain_url
```

### Deploy to Vercel
```bash
npm run build
vercel --prod
```

## 📱 Usage Examples

### For a Clinic Manager
1. Create business account at `/business-admin/create`
2. Add branches for different locations
3. Create queues: "Doctor Consultation", "Lab Test", "Pharmacy"
4. Add staff and assign roles
5. Monitor analytics to identify peak hours
6. Control queues in real-time
7. Send notifications about wait times

### For Customers
1. Browse available queues at `/queues`
2. Join a queue and get position number
3. Receive real-time updates on position
4. Get notified when it's their turn

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
