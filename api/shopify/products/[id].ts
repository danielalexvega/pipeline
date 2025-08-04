import type { VercelRequest, VercelResponse } from '@vercel/node';

// Storefront API types
type StorefrontProduct = {
  id: string;
  title: string;
  description: string;
  descriptionHtml: string;
  handle: string;
  productType: string;
  vendor: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  availableForSale: boolean;
  totalInventory: number;
  variants: {
    edges: Array<{
      node: StorefrontVariant;
    }>;
  };
  images: {
    edges: Array<{
      node: StorefrontImage;
    }>;
  };
  featuredImage: StorefrontImage | null;
  options: StorefrontOption[];
};

type StorefrontVariant = {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice: {
    amount: string;
    currencyCode: string;
  } | null;
  weight: number | null;
  weightUnit: string;
  image: StorefrontImage | null;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
};

type StorefrontOption = {
  id: string;
  name: string;
  values: string[];
};

type StorefrontImage = {
  id: string;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

type StorefrontResponse = {
  data: {
    product: StorefrontProduct | null;
  };
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
};

const PRODUCT_QUERY = `
  query getProduct($id: ID!, $handle: String!) {
    productById: product(id: $id) {
      id
      title
      description
      descriptionHtml
      handle
      productType
      vendor
      tags
      createdAt
      updatedAt
      publishedAt
      availableForSale
      totalInventory
      variants(first: 100) {
        edges {
          node {
            id
            title
            sku
            availableForSale
            quantityAvailable
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            weight
            weightUnit
            image {
              id
              url
              altText
              width
              height
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
      images(first: 10) {
        edges {
          node {
            id
            url
            altText
            width
            height
          }
        }
      }
      featuredImage {
        id
        url
        altText
        width
        height
      }
      options {
        id
        name
        values
      }
    }
    productByHandle: product(handle: $handle) {
      id
      title
      description
      descriptionHtml
      handle
      productType
      vendor
      tags
      createdAt
      updatedAt
      publishedAt
      availableForSale
      totalInventory
      variants(first: 100) {
        edges {
          node {
            id
            title
            sku
            availableForSale
            quantityAvailable
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            weight
            weightUnit
            image {
              id
              url
              altText
              width
              height
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
      images(first: 10) {
        edges {
          node {
            id
            url
            altText
            width
            height
          }
        }
      }
      featuredImage {
        id
        url
        altText
        width
        height
      }
      options {
        id
        name
        values
      }
    }
  }
`;

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

  // Check for required environment variables
  const shopDomain = process.env.VITE_SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!shopDomain || !accessToken) {
    console.error('Missing Shopify configuration');
    console.error('shopDomain:', shopDomain ? 'SET' : 'MISSING');
    console.error('storefrontAccessToken:', accessToken ? 'SET' : 'MISSING');
    return response.status(500).json({ error: 'Server configuration error' });
  }
  
  console.log('shopDomain:', shopDomain);
  console.log('storefrontAccessToken exists:', !!accessToken);

  try {
    // Try to parse as Shopify GID first, then as handle
    const isGid = id.startsWith('gid://shopify/Product/');
    const gqlId = isGid ? id : `gid://shopify/Product/${id}`;
    const handle = isGid ? '' : id;

    const url = `https://${shopDomain}/api/2024-10/graphql.json`;
    console.log("GraphQL URL:", url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const shopifyResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        query: PRODUCT_QUERY,
        variables: {
          id: gqlId,
          handle: handle,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error(`❌ Shopify Storefront API error: ${shopifyResponse.status} - ${errorText}`);
      
      return response.status(shopifyResponse.status).json({ 
        error: 'Failed to fetch product from Shopify Storefront API',
        shopifyStatus: shopifyResponse.status,
        productId: id
      });
    }

    const data = await shopifyResponse.json() as StorefrontResponse;
    
    if (data.errors && data.errors.length > 0) {
      console.error('GraphQL errors:', data.errors);
      return response.status(400).json({ 
        error: 'GraphQL query errors',
        errors: data.errors,
        productId: id
      });
    }

    // Try both queries - by ID and by handle
    const product = data.data.productById || data.data.productByHandle;
    
    if (!product) {
      console.warn(`Product not found: ${id}`);
      return response.status(404).json({ 
        error: 'Product not found in Shopify',
        productId: id
      });
    }

    console.log("✅ Successfully fetched product from Shopify Storefront API");
    
    return response.status(200).json(product);
  } catch (error) {
    console.error('💥 Error fetching Shopify product:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return response.status(408).json({ 
        error: 'Request timeout',
        productId: id,
        message: 'Request to Shopify timed out after 10 seconds'
      });
    }
    
    return response.status(500).json({ 
      error: 'Internal server error',
      productId: id,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}