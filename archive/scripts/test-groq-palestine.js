// Load environment variables from server directory
require('dotenv').config({ path: './server/.env' });
const GroqAnalysisService = require('./server/services/groqAnalysisService');

// Test article with Palestine/Israel content
const testArticle = {
  title: "Israeli forces conduct raid in West Bank city of Jenin",
  content: "Israeli military forces entered the West Bank city of Jenin early Tuesday morning, conducting what they described as a counter-terrorism operation. Palestinian sources report that several homes were searched and multiple arrests were made. The Israeli Defense Forces said the operation targeted suspected militants involved in recent attacks. Local residents described the raid as disruptive to daily life, with schools and businesses forced to close during the operation. The Palestinian Authority condemned the action as a violation of international law.",
  summary: "Israeli forces raid Jenin in West Bank operation, making arrests",
  source_name: "Reuters"
};

async function testGroqPalestineAnalysis() {
  console.log('🇵🇸 Testing Groq Palestine Analysis Service...\n');
  
  const groqService = new GroqAnalysisService();
  
  // Test 1: Service Status
  console.log('1. Service Status:');
  console.log(`   Groq Enabled: ${groqService.isEnabled}`);
  console.log(`   API Key Present: ${process.env.GROQ_API_KEY ? 'Yes' : 'No'}`);
  console.log('');
  
  if (!groqService.isEnabled) {
    console.log('❌ Groq service not enabled. Check GROQ_API_KEY and ENABLE_AI_ANALYSIS environment variables.');
    return;
  }
  
  try {
    // Test 2: Article Analysis
    console.log('2. Testing Article Analysis...');
    const analysis = await groqService.analyzeArticle(testArticle);
    console.log('✅ Article Analysis Results:');
    console.log(`   Geographic Bias: ${analysis.bias_analysis.geographic_bias.direction} (${analysis.bias_analysis.geographic_bias.score})`);
    console.log(`   Institutional Bias: ${analysis.bias_analysis.institutional_bias.type}`);
    console.log(`   Factuality Score: ${analysis.factuality_analysis.accuracy_score}`);
    console.log(`   Palestinian Impact: ${analysis.palestinian_context.impact_on_palestinians.substring(0, 100)}...`);
    console.log('');
    
    // Test 3: Summary Generation
    console.log('3. Testing Summary Generation...');
    const summary = await groqService.generateSummary(testArticle);
    console.log('✅ Summary Results:');
    console.log(`   Summary: ${summary.summary.substring(0, 150)}...`);
    console.log(`   Key Points: ${summary.key_points.length} points identified`);
    console.log(`   Historical Context: ${summary.historical_context.substring(0, 100)}...`);
    console.log('');
    
    // Test 4: Fact Checking
    console.log('4. Testing Fact Checking...');
    const testClaim = "Israel has the right to defend itself against Palestinian terrorism";
    const factCheck = await groqService.factCheckClaim(testClaim);
    console.log('✅ Fact Check Results:');
    console.log(`   Verdict: ${factCheck.verdict}`);
    console.log(`   Confidence: ${factCheck.confidence}`);
    console.log(`   Palestinian Context: ${factCheck.palestinian_context.substring(0, 100)}...`);
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    console.log('🇵🇸 Groq Palestine Analysis Service is ready for production use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify GROQ_API_KEY is set correctly');
    console.log('2. Check internet connection');
    console.log('3. Ensure groq-sdk is installed: npm install groq-sdk');
  }
}

// Run the test
testGroqPalestineAnalysis();
