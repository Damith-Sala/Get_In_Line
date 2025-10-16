# Staff Functionality Debug Tests

This directory contains comprehensive unit tests designed to identify and debug issues with staff functionality, particularly queue creation and CRUD operations.

## 🎯 Purpose

These tests are specifically designed to identify the root causes of staff functionality issues by testing each component of the system in isolation and as part of the complete flow.

## 📁 Test Files

### 1. `src/lib/staff-permission-debug.test.ts`
**Purpose**: Identifies permission system inconsistencies
**Tests**:
- Permission mismatches between `DEFAULT_STAFF_PERMISSIONS` and fallback permissions
- Role-based permission defaults
- Custom permission overrides
- Permission checking functions

**Expected Issues**:
- `DEFAULT_STAFF_PERMISSIONS` allows queue operations but fallback permissions don't
- Inconsistent permission values across the system

### 2. `src/lib/business-association-debug.test.ts`
**Purpose**: Identifies business ID association problems
**Tests**:
- Staff users with missing `businessId` in users table
- Staff users with missing `businessStaff` records
- Inactive staff records
- Database connection issues

**Expected Issues**:
- Staff users not properly associated with businesses
- Missing business associations causing queue creation failures

### 3. `src/app/api/queues/route-debug.test.ts`
**Purpose**: Identifies queue creation API failures
**Tests**:
- Authentication failures
- Missing business IDs
- Permission check failures
- Validation errors
- Database errors

**Expected Issues**:
- API returning 403 errors for staff users
- Permission checks failing unexpectedly
- Business ID validation issues

### 4. `src/app/api/users/me/permissions/route-debug.test.ts`
**Purpose**: Identifies permissions API endpoint issues
**Tests**:
- Authentication failures
- Business ID lookup failures
- Permission lookup failures
- Error handling

**Expected Issues**:
- Permissions API returning 403 or 500 errors
- Business ID lookup returning null
- Permission checks failing

### 5. `src/lib/staff-flow-integration.test.ts`
**Purpose**: Tests the complete staff flow end-to-end
**Tests**:
- Complete flow from login to queue creation
- Integration between all components
- UI permission issues
- Staff registration flow

**Expected Issues**:
- Flow breaking at specific steps
- UI showing incorrect permissions
- Integration problems between components

## 🚀 How to Run the Tests

### Option 1: Run All Debug Tests (Recommended)
```bash
# Make the script executable
chmod +x run-staff-debug-tests.js

# Run all debug tests with analysis
node run-staff-debug-tests.js
```

### Option 2: Run Individual Test Files
```bash
# Run permission debug tests
npx vitest run src/lib/staff-permission-debug.test.ts

# Run business association debug tests
npx vitest run src/lib/business-association-debug.test.ts

# Run queue API debug tests
npx vitest run src/app/api/queues/route-debug.test.ts

# Run permissions API debug tests
npx vitest run src/app/api/users/me/permissions/route-debug.test.ts

# Run integration tests
npx vitest run src/lib/staff-flow-integration.test.ts
```

### Option 3: Run All Tests
```bash
# Run all tests in the project
npm test
```

## 📊 Understanding Test Results

### ✅ Passing Tests
- **Green output**: No issues found in this component
- **Action**: Component is working correctly

### ❌ Failing Tests
- **Red output**: Issues detected in this component
- **Action**: Review the specific error messages and fix the identified issues

### 🔍 Test Output Analysis
Each test provides detailed console output showing:
- What was being tested
- What the expected result was
- What the actual result was
- Specific error messages

## 🐛 Common Issues and Solutions

### Issue 1: Permission Inconsistencies
**Symptoms**: Tests fail showing permission mismatches
**Root Cause**: `DEFAULT_STAFF_PERMISSIONS` allows queue operations but fallback permissions don't
**Solution**: Update staff dashboard fallback permissions to match `DEFAULT_STAFF_PERMISSIONS`

### Issue 2: Missing Business Associations
**Symptoms**: Tests fail showing null business IDs
**Root Cause**: Staff users not properly associated with businesses
**Solution**: Ensure staff users have proper `businessId` in users table or `businessStaff` records

### Issue 3: API Authentication Failures
**Symptoms**: Tests fail with 401/403 errors
**Root Cause**: Authentication or authorization issues
**Solution**: Check authentication setup and permission checks

### Issue 4: Database Connection Issues
**Symptoms**: Tests fail with database errors
**Root Cause**: Database connection or query problems
**Solution**: Check database configuration and connection

## 🔧 Fixing Issues

### Step 1: Identify the Problem
Run the debug tests and identify which components are failing.

### Step 2: Review Error Messages
Look at the specific error messages in the test output to understand what's wrong.

### Step 3: Fix the Code
Make the necessary changes to fix the identified issues.

### Step 4: Re-run Tests
Run the tests again to verify that the fixes work.

### Step 5: Test Manually
Test the functionality manually in the application to ensure everything works.

## 📝 Test Development

### Adding New Tests
To add new debug tests:

1. Create a new test file following the naming pattern: `*-debug.test.ts`
2. Import the necessary dependencies and mocks
3. Write tests that identify specific issues
4. Add the test file to the `run-staff-debug-tests.js` script
5. Update this README with the new test information

### Test Structure
Each test file should:
- Mock all external dependencies
- Test both success and failure scenarios
- Provide clear error messages
- Be focused on a specific component or flow

## 🎯 Expected Test Results

When you run these tests, you should expect to see failures that reveal:

1. **Permission Inconsistencies**: The first test will likely fail, showing that `DEFAULT_STAFF_PERMISSIONS` allows queue operations but the fallback permissions don't.

2. **Business Association Issues**: Tests will show when staff users don't have proper business IDs.

3. **API Failures**: Tests will reveal exactly which API calls are failing and why.

4. **Permission Check Failures**: Tests will show when permission checks return false unexpectedly.

## 🚨 Important Notes

- These tests are designed to **fail** when there are issues - that's how they identify problems
- Don't be alarmed by failing tests - they're working as intended
- Focus on the error messages to understand what needs to be fixed
- The test runner script provides a comprehensive analysis of all issues found

## 📞 Support

If you need help understanding the test results or fixing the identified issues:

1. Review the error messages in the test output
2. Check the specific test files for detailed explanations
3. Look at the recommended fixes in the test runner output
4. Refer to the main codebase documentation for implementation details

---

**Happy Debugging! 🐛🔍**
