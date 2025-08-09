const fs = require('fs');

// Read the test data
const testData = JSON.parse(fs.readFileSync('test_transactions_corrected.json', 'utf8'));

// Get the first user ID from the test data
const firstUserId = testData[0].user['$oid'];
console.log('Current user ID in test data:', firstUserId);

// Ask user to provide the correct user ID
console.log('\nTo fix the user ID issue:');
console.log('1. Log into your application');
console.log('2. Open browser developer tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Type: localStorage.getItem("token")');
console.log('5. Copy the user ID from the decoded token');
console.log('6. Replace the user ID in the test data');

console.log('\nOr you can manually edit the test_transactions_corrected.json file');
console.log('and replace all occurrences of the user ID with your actual user ID.');

// Create a sample of what to replace
console.log('\nSample replacement:');
console.log(`Replace: "${firstUserId}"`);
console.log('With: "YOUR_ACTUAL_USER_ID"'); 