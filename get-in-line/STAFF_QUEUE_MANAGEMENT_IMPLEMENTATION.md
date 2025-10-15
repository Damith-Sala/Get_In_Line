# Staff Queue Management Implementation

## Overview
This implementation adds comprehensive queue management functionality for staff members, including create, update, and delete operations.

## Changes Made

### 1. New API Endpoint
- **File**: `src/app/api/users/me/permissions/route.ts`
- **Purpose**: Provides real-time permission checking for the current user
- **Features**:
  - Returns user's actual permissions based on role and business association
  - Handles cases where staff don't have explicit `businessStaff` records
  - Provides fallback permissions for different user types

### 2. Enhanced Permission System
- **File**: `src/lib/permission-helpers.ts`
- **Changes**:
  - Added `QUEUE_MANAGER_PERMISSIONS` for staff with queue management access
  - Updated `getUserPermissions()` to handle missing staff records gracefully
  - Staff without explicit records now get queue management permissions by default

### 3. Updated Staff Dashboard
- **File**: `src/app/staff-dashboard/page.tsx`
- **Changes**:
  - Now fetches real permissions from the API instead of hardcoded values
  - Uses the new `/api/users/me/permissions` endpoint
  - Provides fallback permissions if API fails

### 4. Queue Management Component
- **File**: `src/components/QueueManagement.tsx`
- **Features**:
  - Create new queues with full form validation
  - Edit existing queue settings
  - Delete queues with confirmation dialog
  - Toggle queue status (open/close)
  - Permission-based UI (buttons show/hide based on user permissions)

### 5. Individual Queue API
- **File**: `src/app/api/queues/[id]/route.ts`
- **Features**:
  - GET: Retrieve individual queue details with statistics
  - PUT: Update queue information with permission checks
  - DELETE: Delete queues with proper authorization

## Permission Levels

### Default Staff Permissions (DEFAULT_STAFF_PERMISSIONS)
- `canCreateQueues: false`
- `canEditQueues: false`
- `canDeleteQueues: false`
- `canManageQueueOperations: true`

### Queue Manager Permissions (QUEUE_MANAGER_PERMISSIONS)
- `canCreateQueues: true` ✅
- `canEditQueues: true` ✅
- `canDeleteQueues: false`
- `canManageQueueOperations: true`

### Manager Permissions (MANAGER_PERMISSIONS)
- `canCreateQueues: true` ✅
- `canEditQueues: true` ✅
- `canDeleteQueues: false`
- `canManageQueueOperations: true`
- Plus analytics and branch management

### Admin Permissions (ADMIN_PERMISSIONS)
- `canCreateQueues: true` ✅
- `canEditQueues: true` ✅
- `canDeleteQueues: true` ✅
- `canManageQueueOperations: true`
- Plus full system access

## How It Works

1. **Staff Login**: When a staff member logs in, the dashboard fetches their permissions
2. **Permission Check**: The system checks if the user has a `businessStaff` record
3. **Fallback Logic**: If no record exists, staff get `QUEUE_MANAGER_PERMISSIONS` by default
4. **UI Updates**: The queue management interface shows/hides features based on permissions
5. **API Protection**: All queue operations are protected by server-side permission checks

## Testing

### Test the API Endpoint
```bash
node test-permissions-api.js
```

### Manual Testing Steps
1. Login as a staff member
2. Navigate to Staff Dashboard
3. Go to "Queue Management" tab
4. Verify you can see "Create Queue" button
5. Test creating a new queue
6. Test editing an existing queue
7. Test toggling queue status

## Security Features

- **Server-side validation**: All operations are validated on the server
- **Permission-based access**: UI elements are hidden based on user permissions
- **Business isolation**: Users can only manage queues from their own business
- **Role-based defaults**: Different permission sets for different roles
- **Graceful fallbacks**: System works even if permission records are missing

## Future Enhancements

1. **Granular Permissions**: Allow business admins to set custom permissions for each staff member
2. **Audit Logging**: Track who created/modified/deleted queues
3. **Bulk Operations**: Allow managing multiple queues at once
4. **Queue Templates**: Pre-configured queue setups for common scenarios
5. **Advanced Scheduling**: Time-based queue availability

## Troubleshooting

### Staff Can't See Queue Management
- Check if user has `businessId` set in their user record
- Verify the permissions API is returning correct data
- Check browser console for any JavaScript errors

### Permission Denied Errors
- Ensure user has the correct role (`staff`, `business_admin`, etc.)
- Check if `businessStaff` record exists and is active
- Verify business association is correct

### API Errors
- Check server logs for detailed error messages
- Verify database connections are working
- Ensure all required environment variables are set


