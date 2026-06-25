import 'dotenv/config';

// The API Key you generated in Demo Mode
const API_KEY = process.env.API_KEY || 'gwa_jj1HNkxVkLRBw7TjoWfAHgqpTOc3mUdd8ys4zU26z0';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/v1';

// Replace these IDs with actual IDs from your dashboard when testing real data
const KB_ID = 16; 
const DB_ID = 1;

/**
 * Utility function to perform API requests just like a developer would
 */
async function apiRequest(endpoint: string, method: string = 'GET', body?: any) {
  console.log(`\n======================================================`);
  console.log(`🚀 Testing: ${method} ${BASE_URL}${endpoint}`);
  console.log(`======================================================`);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const status = response.status;
    const data = await response.json().catch(() => null);

    if (status === 200) {
      console.log(`✅ SUCCESS (${status}):`);
      console.dir(data, { depth: null, colors: true });
    } else if (status === 401) {
      console.log(`❌ UNAUTHORIZED (${status}):`);
      console.log(`Note: You are using a Demo Mode API Key that is not saved in the database.`);
      console.log(`To get a 200 OK, generate a key while logged in and paste it into this script.`);
      console.dir(data, { colors: true });
    } else {
      console.log(`⚠️ ERROR (${status}):`);
      console.dir(data, { colors: true });
    }
  } catch (err: any) {
    console.error(`💥 FATAL ERROR:`, err.message);
  }
}

/**
 * Main function executing the test suite against all GenWorkAI API endpoints
 */
async function runTestSuite() {
  console.log(`Starting API Test Suite using Key: ${API_KEY.substring(0, 10)}...`);

  // 1. Knowledge Base - Semantic Search
  await apiRequest(`/kb/${KB_ID}/search`, 'POST', {
    query: "What is GenWorkAI?",
    limit: 3
  });

  // 2. Knowledge Base - Ask Question (RAG)
  await apiRequest(`/kb/${KB_ID}/ask`, 'POST', {
    question: "Summarize the onboarding documentation."
  });

  // 3. Knowledge Base - Generate Artifact
  await apiRequest(`/kb/${KB_ID}/generate`, 'POST', {
    prompt: "Create a brief summary of the project architecture.",
    outputType: "summary"
  });

  // 4. Database - Extract Schema
  await apiRequest(`/db/${DB_ID}/schema`, 'GET');

  // 5. Database - Text-to-SQL Query
  await apiRequest(`/db/${DB_ID}/ask`, 'POST', {
    question: "How many users signed up this week?",
    execute: false // Only generates the SQL without executing
  });

  // 6. Database - Documentation Generation
  await apiRequest(`/db/${DB_ID}/documentation`, 'GET');

  console.log(`\n🎉 Test suite completed!`);
}

runTestSuite();
