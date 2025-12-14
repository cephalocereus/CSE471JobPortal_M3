/**
 * IPinfo API Test Script
 * Run this to verify your IPinfo API token is working
 * 
 * Usage: node test-ipinfo-api.js
 */

require('dotenv').config();

const ipinfoToken = process.env.IPINFO_API_TOKEN;

console.log('\n' + '='.repeat(60));
console.log('🧪 TESTING IPINFO API');
console.log('='.repeat(60));

// Check if token is configured
if (!ipinfoToken) {
  console.log('\n❌ ERROR: IPINFO_API_TOKEN not found in .env file');
  console.log('💡 Please add: IPINFO_API_TOKEN=your_token_here');
  console.log('\n' + '='.repeat(60));
  process.exit(1);
}

console.log(`\n✅ Token found: ${ipinfoToken.substring(0, 8)}...`);
console.log('\n📡 Testing API with different IP addresses...\n');

// Test IPs from different locations
const testIPs = [
  { ip: '8.8.8.8', description: 'Google DNS (USA)' },
  { ip: '1.1.1.1', description: 'Cloudflare DNS (USA)' },
  { ip: '103.15.200.1', description: 'Bangladesh IP' },
  { ip: '151.101.0.1', description: 'UK IP' }
];

async function testIP(ipAddress, description) {
  try {
    console.log(`\n🌐 Testing: ${description}`);
    console.log(`   IP: ${ipAddress}`);
    
    const url = `https://ipinfo.io/${ipAddress}?token=${ipinfoToken}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API token (401 Unauthorized)');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded (429 Too Many Requests)');
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    }
    
    const data = await response.json();
    
    // Display results
    console.log(`   ✅ SUCCESS!`);
    console.log(`   📍 City: ${data.city || 'N/A'}`);
    console.log(`   🌍 Country: ${data.country || 'N/A'}`);
    console.log(`   🏢 ISP: ${data.org || 'N/A'}`);
    console.log(`   📮 Postal: ${data.postal || 'N/A'}`);
    console.log(`   🕒 Timezone: ${data.timezone || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    return false;
  }
}

async function runTests() {
  let successCount = 0;
  
  for (const test of testIPs) {
    const success = await testIP(test.ip, test.description);
    if (success) successCount++;
    
    // Add small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}/${testIPs.length}`);
  console.log(`❌ Failed: ${testIPs.length - successCount}/${testIPs.length}`);
  
  if (successCount === testIPs.length) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Your IPinfo API token is working correctly!');
    console.log('✅ The API is returning real geolocation data!');
    console.log('\n💡 Your login tracking system will now show real locations!');
  } else if (successCount > 0) {
    console.log('\n⚠️  PARTIAL SUCCESS');
    console.log('Some tests passed but others failed.');
    console.log('Check the errors above for details.');
  } else {
    console.log('\n❌ ALL TESTS FAILED');
    console.log('Please check:');
    console.log('  1. Your API token is valid');
    console.log('  2. You have internet connection');
    console.log('  3. You haven\'t exceeded the API rate limit');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📚 API Usage Info:');
  console.log('   Free Tier: 50,000 requests/month');
  console.log('   Get token at: https://ipinfo.io/signup');
  console.log('='.repeat(60) + '\n');
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});

