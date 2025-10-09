# Business Signup Testing Guide

## Phase 1 Implementation - Complete ✅

This guide helps you test the new unified business registration system.

## What's New

### 1. **Business Registration Page** (`/signup/business`)
- Unified registration for both business owners and staff members
- Multi-step form with clear user flow
- Real-time business search for staff registration

### 2. **Registration Types**

#### Business Owner
- Creates a new business account
- Automatically becomes business admin
- Can manage queues, staff, and analytics

#### Staff Member
- Joins an existing business
- Searches and selects business during registration
- Gets staff role with queue management permissions

## Testing Steps

### Test 1: Business Owner Registration

1. **Navigate to registration page:**
   ```
   http://localhost:3000/signup/business
   ```

2. **Step 1 - User Information:**
   - Enter your full name
   - Enter email (use a new email not in system)
   - Enter password (minimum 8 characters)
   - Click "Continue"

3. **Step 2 - Registration Type:**
   - Select "Create a Business"
   - Click "Continue"

4. **Step 3 - Business Details:**
   - Enter business name (e.g., "City Medical Clinic")
   - Enter description (optional)
   - Select business type (e.g., "Medical Clinic")
   - Click "Create Business Account"

5. **Expected Result:**
   - Account created successfully
   - Redirected to `/business-admin`
   - User has `admin` role
   - Business is created in database
   - User is linked to business

### Test 2: Staff Member Registration

**Prerequisites:** You need an existing business in the system first (create one using Test 1)

1. **Navigate to registration page:**
   ```
   http://localhost:3000/signup/business
   ```

2. **Step 1 - User Information:**
   - Enter different user details
   - Click "Continue"

3. **Step 2 - Registration Type:**
   - Select "Join Existing Business"
   - Click "Continue"

4. **Step 3 - Business Search:**
   - Type business name in search box
   - Wait for search results (debounced)
   - Click on your business from results
   - Click "Join as Staff"

5. **Expected Result:**
   - Staff account created
   - User has `staff` role
   - User is added to `business_staff` table
   - User is linked to selected business
   - Redirected to `/business-admin`

### Test 3: Customer Registration (Existing Flow)

1. **Navigate to customer signup:**
   ```
   http://localhost:3000/signup
   ```

2. **Verify:**
   - Form shows "Create Customer Account"
   - Link to "Business signup" is visible
   - Registration creates user with `user` role

### Test 4: Login Flow

All user types use the same login endpoint:
```
http://localhost:3000/login
```

**Test with different user types:**
- Business owner → redirected to `/business-admin`
- Staff member → redirected to `/business-admin`
- Customer → redirected to `/dashboard`

## API Endpoints Created

### 1. Business Signup
```
POST /api/auth/signup/business
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "registrationType": "owner",
  "businessData": {
    "name": "My Business",
    "description": "Business description",
    "businessType": "clinic",
    "subscriptionPlan": "free"
  }
}
```

### 2. Business Search
```
GET /api/businesses/search?q=clinic
```

**Response:**
```json
{
  "businesses": [
    {
      "id": "uuid",
      "name": "City Medical Clinic",
      "description": "...",
      "businessType": "clinic",
      "isActive": true
    }
  ]
}
```

## Database Changes

No migrations needed! The existing schema already supports all features:

- ✅ `users.role` - supports 'admin' and 'staff'
- ✅ `users.businessId` - links users to businesses
- ✅ `businesses` table - stores business data
- ✅ `business_staff` table - manages staff permissions

## Features Implemented

### Multi-Step Form
- ✅ Step 1: User information
- ✅ Step 2: Registration type selection
- ✅ Step 3a: Business creation (for owners)
- ✅ Step 3b: Business search (for staff)

### Business Search
- ✅ Real-time search with debouncing
- ✅ Search by business name or type
- ✅ Visual selection feedback
- ✅ Only shows active businesses

### Validation
- ✅ Zod schema validation
- ✅ Email format validation
- ✅ Password minimum length
- ✅ Required field validation
- ✅ Business data validation based on type

### User Experience
- ✅ Clear step indicators
- ✅ Back navigation between steps
- ✅ Error message display
- ✅ Loading states
- ✅ Success redirects

## Common Issues & Solutions

### Issue 1: "Business not found" error
**Solution:** Make sure you've created at least one business before testing staff registration.

### Issue 2: Search returns no results
**Solution:** 
- Check business name spelling
- Ensure business `isActive` is `true`
- Try searching with fewer characters

### Issue 3: "Email already exists"
**Solution:** Use a different email or check if user already exists in database.

### Issue 4: Redirect not working
**Solution:** Check Supabase configuration and email verification settings.

## Next Steps (Phase 2)

- [ ] Update `/signup` to be customer-only
- [ ] Add invitation system for staff
- [ ] Implement staff approval workflow
- [ ] Add email verification for business accounts
- [ ] Create business onboarding tutorial

## Manual Database Verification

To verify registration worked correctly:

**Check user created:**
```sql
SELECT id, email, name, role, businessId FROM users WHERE email = 'your-email@example.com';
```

**Check business created (for owners):**
```sql
SELECT * FROM businesses WHERE ownerId = 'user-id';
```

**Check staff assignment (for staff):**
```sql
SELECT * FROM business_staff WHERE userId = 'user-id';
```

## File Structure

```
get-in-line/src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── signup/
│   │   │       └── business/
│   │   │           └── route.ts          # Business signup endpoint
│   │   └── businesses/
│   │       └── search/
│   │           └── route.ts              # Business search endpoint
│   └── signup/
│       └── business/
│           ├── page.tsx                   # Business signup page
│           └── components/
│               └── BusinessSignupForm.tsx # Main form component
└── lib/
    └── validation.ts                      # Updated with businessSignupSchema
```

## Success Criteria

- [x] Business owners can create accounts and businesses
- [x] Staff members can search and join existing businesses
- [x] All validations work correctly
- [x] Proper role assignment (admin for owners, staff for staff)
- [x] Database relationships established correctly
- [x] No linter errors
- [x] Proper redirects after registration

---

**Status:** Phase 1 Complete ✅  
**Date:** 2025-10-09

