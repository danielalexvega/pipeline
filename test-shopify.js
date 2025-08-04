// Simple test script for Shopify API function
const handler = require('./api/shopify/products/[id].ts').default;

// Mock Vercel request/response objects
const mockRequest = {
  method: 'GET',
  url: '/api/shopify/products/test',
  query: { id: 'test' }
};

const mockResponse = {
  status: (code) => ({
    json: (data) => {
      console.log(`Status: ${code}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      return data;
    }
  }),
  setHeader: (key, value) => {
    console.log(`Header: ${key} = ${value}`);
  }
};

// Test the function
console.log('🧪 Testing Shopify API function...\n');
handler(mockRequest, mockResponse)
  .then(() => console.log('\n✅ Test completed'))
  .catch(err => console.error('\n❌ Test failed:', err));