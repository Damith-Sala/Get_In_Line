# Guest Queue Browsing Feature

## Overview
Implemented a guest queue browsing feature that allows users to view and join queues without creating an account. This improves user experience by letting people explore available queues before committing to sign up.

## Features Implemented

### 1. Guest Queue Viewing Page (`/guest-queues`)
- **Public Access**: No authentication required
- **Queue Information**: Shows queue name, business name, description, current position, wait time
- **Visual Status**: Active/Inactive indicators
- **Join Options**: Both guest joining and login-to-join options

### 2. Updated Home Page
- **Guest-Friendly**: Clear call-to-action for browsing queues
- **Three Main Options**: Browse as guest, sign up as customer, sign up as business
- **Modern Design**: Clean, professional landing page

### 3. Enhanced API Endpoints

#### GET `/api/queues`
- **Guest Access**: No authentication required
- **Business Information**: Includes business name and type
- **Active Queues Only**: Only shows active queues to guests
- **Rich Data**: Current position, wait time, creation date

#### POST `/api/queues/[id]/guest-join`
- **Guest Joining**: Allows joining without account
- **Position Tracking**: Assigns next available position
- **Guest Entries**: Creates entries with `userId: null`
- **Validation**: Checks queue exists and is active

### 4. Database Schema Support
- **Guest Entries**: `queueEntries` table supports `userId: null`
- **Business Joins**: Queues linked to businesses for display
- **Position Management**: Automatic position assignment

## User Experience Flow

### For Guests:
1. **Land on Home Page** → See "Browse Queues" option
2. **View All Queues** → See available queues with details
3. **Join as Guest** → Get position number immediately
4. **Option to Sign Up** → Can create account for better tracking

### For Businesses:
1. **Create Queues** → Business users can create queues
2. **Guest Visibility** → Their queues appear in guest browsing
3. **Customer Acquisition** → Guests can become customers

## Technical Implementation

### Frontend Components:
- `src/app/guest-queues/page.tsx` - Guest queue browsing page
- `src/app/page.tsx` - Updated home page with guest options
- Responsive design with Tailwind CSS

### Backend APIs:
- `src/app/api/queues/route.ts` - Enhanced GET endpoint
- `src/app/api/queues/[id]/guest-join/route.ts` - Guest joining endpoint
- Database queries with business information

### Database Queries:
```sql
-- Get queues with business info
SELECT 
  queues.*,
  businesses.name as business_name,
  businesses.business_type
FROM queues 
LEFT JOIN businesses ON queues.business_id = businesses.id 
WHERE queues.is_active = true
```

## Benefits

### For Users:
- **No Commitment**: Browse without signing up
- **Quick Access**: Join queues immediately
- **Better Decisions**: See all options before choosing
- **Reduced Friction**: Lower barrier to entry

### For Businesses:
- **Increased Visibility**: More people see their queues
- **Customer Acquisition**: Guests can become customers
- **Better Engagement**: People more likely to try the service

### For Platform:
- **Higher Conversion**: More people try the service
- **Better UX**: Professional, user-friendly interface
- **Scalability**: Supports both guest and authenticated users

## Security Considerations

### Guest Limitations:
- **No Personal Data**: Guests don't provide personal information
- **Limited Tracking**: Can't track individual guest history
- **Position Only**: Get position number, no notifications

### Data Protection:
- **No PII Storage**: Guest entries don't store personal data
- **Temporary Names**: Use "Guest X" for identification
- **Queue Validation**: Verify queue exists and is active

## Future Enhancements

### Potential Features:
- **Guest Notifications**: SMS/email for position updates
- **Guest History**: Temporary session-based tracking
- **Queue Filtering**: Filter by business type, location
- **Real-time Updates**: Live position updates
- **Guest Analytics**: Track guest conversion rates

## Testing

### Test Scenarios:
1. **Guest Browsing**: View queues without login
2. **Guest Joining**: Join queue and get position
3. **Business Creation**: Create queues as business user
4. **Queue Visibility**: Verify queues appear in guest view
5. **Error Handling**: Test invalid queue IDs, inactive queues

### Test Data:
- Create test businesses and queues
- Verify guest entries in database
- Test position assignment logic
- Validate business information display

## Deployment Notes

### Environment Variables:
- No additional environment variables required
- Uses existing database and Supabase configuration

### Database Migrations:
- No schema changes required
- Existing tables support guest functionality

### Performance:
- Efficient queries with proper joins
- Caching opportunities for queue data
- Optimized for guest access patterns
