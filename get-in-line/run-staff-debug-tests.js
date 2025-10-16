#!/usr/bin/env node

/**
 * Staff Debug Test Runner
 * 
 * This script runs all the staff functionality debug tests and provides
 * a comprehensive analysis of the issues found.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Staff Functionality Debug Test Runner');
console.log('==========================================\n');

// List of test files to run
const testFiles = [
  'src/lib/staff-permission-debug.test.ts',
  'src/lib/business-association-debug.test.ts',
  'src/app/api/queues/route-debug.test.ts',
  'src/app/api/users/me/permissions/route-debug.test.ts',
  'src/lib/staff-flow-integration.test.ts'
];

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTest(testFile) {
  log('blue', `\n🧪 Running ${testFile}...`);
  log('cyan', '─'.repeat(50));
  
  try {
    const command = `npx vitest run ${testFile} --reporter=verbose`;
    const output = execSync(command, { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    log('green', '✅ Test completed successfully');
    console.log(output);
    return { success: true, output };
  } catch (error) {
    log('red', '❌ Test failed or had issues');
    console.log(error.stdout || error.message);
    return { success: false, output: error.stdout || error.message };
  }
}

function analyzeResults(results) {
  log('bold', '\n📊 Analysis Results');
  log('cyan', '═'.repeat(50));
  
  const issues = [];
  
  results.forEach((result, index) => {
    const testFile = testFiles[index];
    log('white', `\n📁 ${testFile}`);
    
    if (result.success) {
      log('green', '   ✅ All tests passed - No issues found');
    } else {
      log('red', '   ❌ Tests failed - Issues detected');
      
      // Analyze specific issues based on test file
      if (testFile.includes('staff-permission-debug')) {
        issues.push('Permission inconsistencies between DEFAULT_STAFF_PERMISSIONS and fallback permissions');
        log('yellow', '   🔍 Issue: Permission system inconsistencies');
      }
      
      if (testFile.includes('business-association-debug')) {
        issues.push('Business ID association problems for staff users');
        log('yellow', '   🔍 Issue: Business association problems');
      }
      
      if (testFile.includes('route-debug')) {
        issues.push('Queue creation API failures');
        log('yellow', '   🔍 Issue: Queue creation API problems');
      }
      
      if (testFile.includes('permissions/route-debug')) {
        issues.push('Permissions API endpoint failures');
        log('yellow', '   🔍 Issue: Permissions API problems');
      }
      
      if (testFile.includes('staff-flow-integration')) {
        issues.push('Staff flow integration issues');
        log('yellow', '   🔍 Issue: End-to-end flow problems');
      }
    }
  });
  
  return issues;
}

function generateReport(issues) {
  log('bold', '\n📋 Staff Functionality Issues Report');
  log('cyan', '═'.repeat(50));
  
  if (issues.length === 0) {
    log('green', '🎉 No issues found! Staff functionality should be working correctly.');
    return;
  }
  
  log('red', `❌ Found ${issues.length} major issue(s):`);
  issues.forEach((issue, index) => {
    log('yellow', `   ${index + 1}. ${issue}`);
  });
  
  log('bold', '\n🔧 Recommended Fixes:');
  log('cyan', '─'.repeat(30));
  
  if (issues.some(issue => issue.includes('Permission inconsistencies'))) {
    log('white', '1. Fix permission inconsistencies:');
    log('white', '   - Update staff dashboard fallback permissions to match DEFAULT_STAFF_PERMISSIONS');
    log('white', '   - Ensure canCreateQueues, canEditQueues, canDeleteQueues are true by default');
  }
  
  if (issues.some(issue => issue.includes('Business ID association'))) {
    log('white', '2. Fix business association issues:');
    log('white', '   - Ensure staff users have proper businessId in users table');
    log('white', '   - Verify businessStaff records are created correctly');
    log('white', '   - Check that businessStaff.isActive is true');
  }
  
  if (issues.some(issue => issue.includes('Queue creation API'))) {
    log('white', '3. Fix queue creation API issues:');
    log('white', '   - Verify authentication is working correctly');
    log('white', '   - Check permission checks are returning correct values');
    log('white', '   - Ensure business ID validation is working');
  }
  
  if (issues.some(issue => issue.includes('Permissions API'))) {
    log('white', '4. Fix permissions API issues:');
    log('white', '   - Verify getUserBusinessId is working correctly');
    log('white', '   - Check getUserPermissions is returning correct values');
    log('white', '   - Ensure error handling is working properly');
  }
  
  if (issues.some(issue => issue.includes('Staff flow integration'))) {
    log('white', '5. Fix integration issues:');
    log('white', '   - Review the complete staff flow from login to queue creation');
    log('white', '   - Ensure all components work together correctly');
    log('white', '   - Check for any missing steps in the flow');
  }
  
  log('bold', '\n📝 Next Steps:');
  log('cyan', '─'.repeat(20));
  log('white', '1. Review the failing tests above to understand specific issues');
  log('white', '2. Check the console output for detailed error messages');
  log('white', '3. Fix the identified issues in the codebase');
  log('white', '4. Re-run these tests to verify fixes');
  log('white', '5. Test manually in the application');
}

function main() {
  log('bold', 'Starting staff functionality debug tests...\n');
  
  const results = [];
  
  // Run each test file
  testFiles.forEach(testFile => {
    const result = runTest(testFile);
    results.push(result);
  });
  
  // Analyze results
  const issues = analyzeResults(results);
  
  // Generate report
  generateReport(issues);
  
  log('bold', '\n🏁 Debug test run completed!');
  
  if (issues.length > 0) {
    log('red', `Found ${issues.length} issue(s) that need to be addressed.`);
    process.exit(1);
  } else {
    log('green', 'No issues found - staff functionality should be working!');
    process.exit(0);
  }
}

// Run the main function
main();
