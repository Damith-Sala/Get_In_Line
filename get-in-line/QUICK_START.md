# Quick Start Guide - Business Registration

## 🚀 Getting Started

### 1. Start the Development Server
```bash
cd get-in-line
npm run dev
```

Visit: `http://localhost:3000`

---

## 📱 Registration URLs

| User Type | URL | Description |
|-----------|-----|-------------|
| **Customer** | `/signup` | Regular users who join queues |
| **Business Users** | `/signup/business` | Business owners & staff |
| **Login** | `/login` | All user types use same login |

---

## 🎯 Testing Scenarios

### Scenario 1: Create a Business (Owner)

1. **Go to:** `http://localhost:3000/signup/business`

2. **Step 1 - User Info:**
   ```
   Name: John Smith
   Email: john@example.com
   Password: password123
   ```

3. **Step 2 - Select:**
   - ✓ Create a Business

4. **Step 3 - Business Info:**
   ```
   Business Name: City Medical Clinic
   Description: Full-service medical clinic
   Type: Medical Clinic
   ```

5. **Result:**
   - Account created ✓
   - Business created ✓
   - Role: admin ✓
   - Redirected to `/business-admin` ✓

---

### Scenario 2: Join as Staff

**Prerequisites:** You need a business created first (use Scenario 1)

1. **Go to:** `http://localhost:3000/signup/business`

2. **Step 1 - User Info:**
   ```
   Name: Jane Doe
   Email: jane@example.com
   Password: password123
   ```

3. **Step 2 - Select:**
   - ✓ Join Existing Business

4. **Step 3 - Search:**
   ```
   Type: "City Medical"
   Click: City Medical Clinic from results
   ```

5. **Result:**
   - Staff account created ✓
   - Linked to business ✓
   - Role: staff ✓
   - Redirected to `/business-admin` ✓

---

## 🔑 Login After Registration

**URL:** `http://localhost:3000/login`

Use the email and password you registered with.

**Redirects:**
- Business Owner → `/business-admin`
- Staff Member → `/business-admin`
- Customer → `/dashboard`

---

## 📊 Check Database

### Verify User Created
```sql
SELECT id, email, name, role, businessId 
FROM users 
WHERE email = 'your-email@example.com';
```

### Verify Business Created
```sql
SELECT * FROM businesses 
WHERE ownerId = 'user-id-from-above';
```

### Verify Staff Assignment
```sql
SELECT * FROM business_staff 
WHERE userId = 'user-id-from-above';
```

---

## 🎨 User Interface Features

### Multi-Step Form
- ✓ Step 1: User Information
- ✓ Step 2: Registration Type
- ✓ Step 3: Business Details/Search

### Real-Time Search
- Type business name
- Results appear instantly (300ms debounce)
- Click to select

### Visual Feedback
- Selected state highlighting
- Loading indicators
- Error messages
- Success confirmations

---

## 🔧 API Endpoints

### Business Signup
```http
POST /api/auth/signup/business

Body:
{
  "name": "John Smith",
  "email": "john@example.com",
  "password": "password123",
  "registrationType": "owner",
  "businessData": {
    "name": "City Medical Clinic",
    "description": "Full-service clinic",
    "businessType": "clinic"
  }
}
```

### Business Search
```http
GET /api/businesses/search?q=medical

Response:
{
  "businesses": [
    {
      "id": "uuid",
      "name": "City Medical Clinic",
      "businessType": "clinic",
      "isActive": true
    }
  ]
}
```

---

## ⚡ Quick Tips

1. **Search Tips:**
   - Type at least 2 characters
   - Results filter as you type
   - Only active businesses shown

2. **Password Requirements:**
   - Minimum 8 characters
   - No special requirements (can be simple for testing)

3. **Business Types Available:**
   - Medical Clinic
   - Hospital
   - Restaurant
   - Bank
   - Government Office
   - Retail Store
   - Salon/Spa
   - Other

4. **Default Plan:**
   - All new businesses start on Free plan
   - Includes unlimited queues
   - Up to 5 staff members
   - Basic analytics

---

## 🐛 Troubleshooting

### "Email already exists"
- Use a different email
- Or check if account already created

### "Business not found" (during staff signup)
- Make sure business exists
- Check business is active
- Try exact business name

### Search returns no results
- Check spelling
- Try fewer characters
- Verify business exists in database

### Not redirected after signup
- Check Supabase configuration
- Check browser console for errors
- Verify session created

---

## 📝 Next Steps After Registration

### For Business Owners:
1. Go to `/business-admin`
2. Create branches (optional)
3. Create queues
4. Add staff members
5. Start managing queues

### For Staff Members:
1. Go to `/business-admin`
2. View available queues
3. Start managing queues
4. Add walk-in customers
5. Call next in queue

### For Customers:
1. Go to `/queues`
2. Browse available queues
3. Join a queue
4. Track your position
5. Get notified when it's your turn

---

## 📚 Additional Resources

- **Full Testing Guide:** `BUSINESS_SIGNUP_TESTING.md`
- **Implementation Details:** `PHASE1_IMPLEMENTATION_SUMMARY.md`
- **Flow Diagrams:** `REGISTRATION_FLOW_DIAGRAM.md`
- **Main README:** `README.md`

---

**Need Help?** Check the testing guide or implementation summary for detailed information.

