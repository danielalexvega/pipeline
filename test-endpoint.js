// Test the Shopify API endpoint function directly
import 'dotenv/config';

// Mock the Vercel request/response for testing
const mockRequest = (id) => ({
  method: 'GET',
  url: `/api/shopify/products/${id}`,
  query: { id }
});

const mockResponse = () => {
  const res = {
    statusCode: 200,
    headers: {},
    setHeader: function(key, value) {
      this.headers[key] = value;
      return this;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log(`\n🔍 Response Status: ${this.statusCode}`);
      console.log('📋 Response Headers:', this.headers);
      console.log('📦 Response Data:');
      console.log(JSON.stringify(data, null, 2));
      return this;
    }
  };
  return res;
};

// Test function
async function testAPI() {
  console.log('🧪 Testing Shopify API Endpoint...\n');
  
  // Test 1: Test endpoint
  console.log('=== Test 1: Health Check ===');
  try {
    const { default: handler } = await import('./api/shopify/products/[id].js');
    await handler(mockRequest('test'), mockResponse());
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Test 2: Real product by handle
  console.log('\n=== Test 2: Real Product (by handle) ===');
  try {
    const { default: handler } = await import('./api/shopify/products/[id].js');
    await handler(mockRequest('dirt-king'), mockResponse());
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Test 3: Real product by ID
  console.log('\n=== Test 3: Real Product (by GID) ===');
  try {
    const { default: handler } = await import('./api/shopify/products/[id].js');
    await handler(mockRequest('gid://shopify/Product/6914596208832'), mockResponse());
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI().then(() => {
  console.log('\n✅ Testing complete!');
}).catch(error => {
  console.error('\n❌ Testing failed:', error);
});