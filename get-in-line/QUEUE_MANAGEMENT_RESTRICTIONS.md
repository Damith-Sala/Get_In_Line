# Queue Management Restrictions - Business Users Only

## 🔒 Changes Made

### Summary
Queue creation and management is now **restricted to business accounts only** (staff, admin, super_admin). Regular customers can only **join** and **leave** queues, not create or manage them.

---

## ✅ What Was Changed

### 1. **API Level Restrictions** (`/api/queues` POST)

**File:** `src/app/api/queues/route.ts`

**Changes:**
- ✅ Added role-based authentication check
- ✅ Only allows users with roles: `staff`, `admin`, `super_admin`
- ✅ Verifies user has a business association (`businessId`)
- ✅ Automatically associates created queues with user's business
- ❌ Blocks regular users (`role: 'user'`) with `403 Forbidden`

**Error Messages:**
- `"Only business accounts can create queues"` - If user is not a business user
- `"User must be associated with a business to create queues"` - If business user has no business

---

### 2. **UI Level Restrictions**

#### A. Removed "Create Queue" Button from Customer Pages

**File:** `src/app/queues/page.tsx`

**Before:**
- Customers could see "Create Queue" button on `/queues` page

**After:**
- ❌ "Create Queue" button removed from customer queue browser
- ✅ Only shows "My Queues" and "Dashboard" buttons

---

#### B. Added Access Control to Queue Creation Page

**File:** `src/app/queues/create/page.tsx`

**Changes:**
- ✅ Checks user role before allowing access
- ✅ Redirects non-business users to `/queues` page
- ✅ Shows error message: "Only business accounts can create queues"
- ⏱️ Auto-redirects after 2 seconds

---

### 3. **Business Admin Dashboard** (No Changes)

**File:** `src/app/business-admin/page.tsx`

**Status:**
- ✅ Keeps "Create Queue" button (as intended)
- ✅ This is the **primary** queue creation interface for business users

---

## 🎯 User Permissions Matrix

| Role | Can Create Queues | Can Manage Queues | Can Join Queues | Can Leave Queues |
|------|------------------|-------------------|-----------------|------------------|
| **Customer** (`user`) | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Staff** (`staff`) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Business Admin** (`admin`) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Super Admin** (`super_admin`) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 📋 Queue Creation Flow (Business Users)

### For Business Owners/Staff:

1. **Login** to business account
2. **Navigate** to `/business-admin`
3. **Click** "Create Queue" button
4. **Fill in** queue details:
   - Name
   - Description
   - Max size
   - Estimated wait time
5. **Submit** - Queue is created and automatically linked to their business

---

## 🔐 Security Improvements

### Before:
- ❌ ANY authenticated user could create queues
- ❌ Queues not properly linked to businesses
- ❌ No role-based access control

### After:
- ✅ Only business users can create queues
- ✅ Queues automatically linked to creator's business
- ✅ Full role-based access control
- ✅ Proper authorization checks at API level
- ✅ UI prevents unauthorized access attempts

---

## 🚀 Benefits

1. **Better Organization**
   - All queues properly associated with businesses
   - Clear ownership and responsibility

2. **Security**
   - Prevents spam queue creation by regular users
   - Protects business data integrity

3. **User Experience**
   - Customers see only relevant actions (join/leave queues)
   - Business users have full queue management capabilities

4. **Scalability**
   - Easier to implement business-specific features
   - Clear separation of concerns

---

## 🧪 Testing

### Test 1: Regular User Attempts Queue Creation

**Steps:**
1. Login as regular customer
2. Try to access `/queues/create`

**Expected:**
- Error message: "Only business accounts can create queues"
- Redirect to `/queues` after 2 seconds

### Test 2: Regular User API Call

**Steps:**
1. Login as customer
2. Make POST request to `/api/queues`

**Expected:**
- `403 Forbidden` response
- Error: "Only business accounts can create queues"

### Test 3: Business User Creates Queue

**Steps:**
1. Login as business admin/staff
2. Go to `/business-admin`
3. Click "Create Queue"
4. Fill form and submit

**Expected:**
- ✅ Queue created successfully
- ✅ Queue linked to business
- ✅ User redirected to queues page

---

## 🔄 Migration Notes

**No Database Migration Required!**

The existing schema already supports:
- ✅ `users.role` field (user, staff, admin, super_admin)
- ✅ `users.businessId` field
- ✅ `queues.businessId` field
- ✅ `queues.creatorId` field

All changes are **code-level only**, no schema changes needed.

---

## 📝 Future Enhancements

Potential future improvements:

1. **Fine-Grained Permissions**
   - Specific permissions per staff member
   - Some staff can create, others only manage

2. **Queue Templates**
   - Pre-defined queue templates for different service types
   - Business-specific defaults

3. **Bulk Queue Management**
   - Create multiple queues at once
   - Import/export queue configurations

4. **Queue Analytics Dashboard**
   - Business-specific queue performance metrics
   - Customer flow analysis

---

## ✅ Files Modified

1. `src/app/api/queues/route.ts` - Added role-based authorization
2. `src/app/queues/page.tsx` - Removed create button for customers
3. `src/app/queues/create/page.tsx` - Added access control check

---

**Status:** ✅ Complete  
**Date:** 2025-10-09  
**Impact:** High - Significantly improves security and user experience

