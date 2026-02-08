const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.join(__dirname, 'backend', 'data', 'healthguard.db');

console.log('🔄 SCRIPT REPORT: Force Cleanup Database');
console.log('---------------------------------------');

try {
  // 1. Kill any running node processes (backend)
  console.log('🔪 Attempting to kill Node.js processes...');
  try {
    execSync('taskkill /F /IM node.exe'); // Windows specific
    console.log('✅ Node processes killed.');
  } catch (e) {
    console.log('ℹ️  No Node processes found or failed to kill (might be already stopped).');
  }

  // 2. Delete the database file
  if (fs.existsSync(dbPath)) {
    console.log(`🗑️  Found database at: ${dbPath}`);
    fs.unlinkSync(dbPath);
    console.log('✅ Database deleted successfully!');
  } else {
    console.log('ℹ️  Database file not found (already deleted).');
  }

  console.log('\n✅ CLEANUP COMPLETE');
  console.log('---------------------------------------');
  console.log('👉 Now run: cd backend && npm run dev');
  
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
}
