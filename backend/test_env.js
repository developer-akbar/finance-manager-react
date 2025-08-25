const path = require('path');
const fs = require('fs');

console.log('🔍 Testing environment variable loading...');

const envPath = path.join(__dirname, 'config.env');
console.log('🔍 Environment file path:', envPath);

// Check if file exists
if (fs.existsSync(envPath)) {
  console.log('✅ config.env file found');
  
  // Read file contents
  const fileContent = fs.readFileSync(envPath, 'utf8');
  console.log('📄 File contents:');
  console.log(fileContent);
  
  // Load with dotenv
  require('dotenv').config({ path: envPath });
  
  console.log('\n🔧 Environment variables after loading:');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  
} else {
  console.log('❌ config.env file not found');
}
