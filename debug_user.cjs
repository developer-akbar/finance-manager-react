const mongoose = require('mongoose');
const UserSettings = require('./backend/models/UserSettings');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/finance-manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugUserSettings() {
  try {
    console.log('Connected to MongoDB');
    
    // Get all user settings
    const allSettings = await UserSettings.find({});
    console.log('\n=== All User Settings ===');
    console.log('Total users with settings:', allSettings.length);
    
    allSettings.forEach((setting, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('User ID:', setting.user);
      console.log('Accounts:', setting.accounts);
      console.log('Categories count:', setting.categories.size);
      console.log('Categories:', Object.fromEntries(setting.categories));
      console.log('Account Groups:', setting.accountGroups);
    });
    
    // Check if there are any users without settings
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\n=== All Users ===');
    console.log('Total users:', users.length);
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`, user._id);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugUserSettings(); 