const fs = require('fs');

// Read the test data
const testData = JSON.parse(fs.readFileSync('test_transactions_corrected.json', 'utf8'));

// Convert to the expected format
const convertedData = {
  transactions: testData
};

// Save the converted data
fs.writeFileSync('test_transactions_for_import.json', JSON.stringify(convertedData, null, 2));

console.log('✅ Test data converted successfully!');
console.log('📁 Original file: test_transactions_corrected.json');
console.log('📁 Converted file: test_transactions_for_import.json');
console.log(`📊 Total transactions: ${testData.length}`);
console.log('\nYou can now import test_transactions_for_import.json using the Data Management feature.'); 