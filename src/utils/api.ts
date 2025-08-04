import { get, post, RequestContext } from "./fetch";

type ProjectContainer = Readonly<{
  projectContainerId: string;
}>;

type TokenSeedResponse = Readonly<{
  token_seed_id: string;
}>;

type KeyFromSeedResponse = Readonly<{
  api_key: string;
}>;

// Shopify Storefront API types
export type StorefrontProduct = Readonly<{
  id: string;
  title: string;
  description: string;
  descriptionHtml: string;
  handle: string;
  productType: string;
  vendor: string;
  tags: ReadonlyArray<string>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  availableForSale: boolean;
  totalInventory: number;
  variants: {
    edges: ReadonlyArray<{
      node: StorefrontVariant;
    }>;
  };
  images: {
    edges: ReadonlyArray<{
      node: StorefrontImage;
    }>;
  };
  featuredImage: StorefrontImage | null;
  options: ReadonlyArray<StorefrontOption>;
}>;

export type StorefrontVariant = Readonly<{
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
  selectedOptions: ReadonlyArray<{
    name: string;
    value: string;
  }>;
}>;

export type StorefrontOption = Readonly<{
  id: string;
  name: string;
  values: ReadonlyArray<string>;
}>;

export type StorefrontImage = Readonly<{
  id: string;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}>;


export const getProjectContainerForEnvironment = (
  authToken: string,
  environmentId: string,
): Promise<ProjectContainer | null> => {
  const requestContext: RequestContext = { authToken };
  const url = `https://app.${import.meta.env.VITE_KONTENT_URL}/api/project-management/${environmentId}`;

  return get(url, requestContext)
    .then(async (res) => {
      if (res.ok) {
        return await res.json() as ProjectContainer;
      }

      console.error((await res.json()).description);
      return null;
    });
};

export const getPreviewApiTokenSeed = (
  authToken: string,
  projectContainerId: string,
  environmentId: string,
): Promise<ReadonlyArray<TokenSeedResponse> | null> => {
  const requestContext: RequestContext = {
    authToken: authToken,
  };
  const url =
    `https://app.${import.meta.env.VITE_KONTENT_URL}/api/project-container/${projectContainerId}/keys/listing`;
  const data = {
    query: "",
    api_key_types: ["delivery-api"],
    environments: [environmentId],
  };

  return post(url, data, requestContext)
    .then(async res => {
      if (!res.ok) {
        console.error((await res.json()).description);
        return null;
      }

      const tokens = await res.json() as TokenSeedResponse[];

      if (!tokens.length) {
        console.error(`There is no Delivery API key for environment ${environmentId}`);
        return null;
      }

      return tokens;
    });
};

export const getKeyForTokenSeed = (
  authToken: string,
  projectContainerId: string,
  tokenSeed: string,
): Promise<KeyFromSeedResponse> => {
  const requestContext: RequestContext = {
    authToken: authToken,
  };
  const url =
    `https://app.${import.meta.env.VITE_KONTENT_URL}/api/project-container/${projectContainerId}/keys/${tokenSeed}`;

  return get(url, requestContext).then(res => res.json());
};

// Shopify Storefront API functions (calling our serverless endpoints)
export const getShopifyProducts = async (): Promise<ReadonlyArray<StorefrontProduct> | null> => {
  // This would need a separate API endpoint for multiple products
  // For now, returning null as you're only using single product fetching
  console.warn('getShopifyProducts not implemented for serverless API');
  return null;
};

export const getShopifyProduct = async (
  productIdOrHandle: string | number,
): Promise<StorefrontProduct | null> => {
  try {
    const response = await fetch(`/api/shopify/products/${productIdOrHandle}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    if (response.ok) {
      const product = await response.json() as StorefrontProduct;
      return product;
    }

    if (response.status === 404) {
      console.warn(`Shopify product ${productIdOrHandle} not found`);
      return null;
    }

    console.error(`Failed to fetch Shopify product ${productIdOrHandle}:`, response.status, await response.text());
    return null;
  } catch (error) {
    console.error(`Error fetching Shopify product ${productIdOrHandle}:`, error);
    return null;
  }
};

// Helper functions to work with Storefront API data structure
export const getProductVariants = (product: StorefrontProduct): ReadonlyArray<StorefrontVariant> => {
  return product.variants.edges.map(edge => edge.node);
};

export const getProductImages = (product: StorefrontProduct): ReadonlyArray<StorefrontImage> => {
  return product.images.edges.map(edge => edge.node);
};

export const getVariantPrice = (variant: StorefrontVariant): string => {
  return `${variant.price.amount} ${variant.price.currencyCode}`;
};

export const getVariantCompareAtPrice = (variant: StorefrontVariant): string | null => {
  return variant.compareAtPrice 
    ? `${variant.compareAtPrice.amount} ${variant.compareAtPrice.currencyCode}`
    : null;
};