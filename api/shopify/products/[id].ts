import type { VercelRequest, VercelResponse } from '@vercel/node';

type ShopifyProduct = {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  handle: string;
  updated_at: string;
  published_at: string;
  template_suffix: string | null;
  published_scope: string;
  tags: string;
  status: string;
  admin_graphql_api_id: string;
  variants: ShopifyVariant[];
  options: ShopifyOption[];
  images: ShopifyImage[];
  image: ShopifyImage | null;
};

type ShopifyVariant = {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string | null;
  fulfillment_service: string;
  inventory_management: string;
  option1: string;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string;
  grams: number;
  image_id: number | null;
  weight: number;
  weight_unit: string;
  inventory_item_id: number;
  inventory_quantity: number;
  old_inventory_quantity: number;
  admin_graphql_api_id: string;
};

type ShopifyOption = {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
};

type ShopifyImage = {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
  admin_graphql_api_id: string;
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {

  console.log("🚀 Vercel function called!", { method: request.method, url: request.url });
  
  // Only allow GET requests
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { id } = request.query;

  // Validate product ID
  if (!id || Array.isArray(id)) {
    return response.status(400).json({ error: 'Invalid product ID' });
  }

  // Test endpoint - return success without calling Shopify
  if (id === 'test') {
    return response.status(200).json({ 
      message: '✅ Vercel function is working!', 
      timestamp: new Date().toISOString() 
    });
  }

  const productId = parseInt(id, 10);
  if (isNaN(productId)) {
    return response.status(400).json({ error: 'Product ID must be a number' });
  }
  console.log("productId", productId);
  // Check for required environment variables
  const shopDomain = process.env.VITE_SHOPIFY_SHOP_DOMAIN || process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.VITE_SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shopDomain || !accessToken) {
    console.error('Missing Shopify configuration');
    console.error('shopDomain:', shopDomain ? 'SET' : 'MISSING');
    console.error('accessToken:', accessToken ? 'SET' : 'MISSING');
    return response.status(500).json({ error: 'Server configuration error' });
  }
  
  console.log('shopDomain:', shopDomain);
  console.log('accessToken exists:', !!accessToken);

  try {
    const url = `https://${shopDomain}/admin/api/2023-10/products/${productId}.json`;
    console.log("url", url);
    const shopifyResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error(`❌ Shopify API error: ${shopifyResponse.status} - ${errorText}`);
      
      if (shopifyResponse.status === 404) {
        return response.status(404).json({ 
          error: 'Product not found in Shopify',
          shopifyStatus: shopifyResponse.status,
          productId 
        });
      }
      
      return response.status(shopifyResponse.status).json({ 
        error: 'Failed to fetch product from Shopify',
        shopifyStatus: shopifyResponse.status,
        productId
      });
    }

    console.log("✅ Successfully fetched product from Shopify");

    const data = await shopifyResponse.json() as { product: ShopifyProduct };
    
    return response.status(200).json(data.product);
  } catch (error) {
    console.error('💥 Error fetching Shopify product:', error);
    return response.status(500).json({ 
      error: 'Internal server error',
      productId,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}