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

// Shopify types
type ShopifyProduct = Readonly<{
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
  variants: ReadonlyArray<ShopifyVariant>;
  options: ReadonlyArray<ShopifyOption>;
  images: ReadonlyArray<ShopifyImage>;
  image: ShopifyImage | null;
}>;

type ShopifyVariant = Readonly<{
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
}>;

type ShopifyOption = Readonly<{
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: ReadonlyArray<string>;
}>;

type ShopifyImage = Readonly<{
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: ReadonlyArray<number>;
  admin_graphql_api_id: string;
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

// Shopify API functions (now calling our serverless endpoints)
export const getShopifyProducts = async (): Promise<ReadonlyArray<ShopifyProduct> | null> => {
  // This would need a separate API endpoint for multiple products
  // For now, returning null as you're only using single product fetching
  console.warn('getShopifyProducts not implemented for serverless API');
  return null;
};

export const getShopifyProduct = async (
  productId: number | string,
): Promise<ShopifyProduct | null> => {
  try {
    const response = await fetch(`/api/shopify/products/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    if (response.ok) {
      const product = await response.json() as ShopifyProduct;
      return product;
    }

    if (response.status === 404) {
      console.warn(`Shopify product ${productId} not found`);
      return null;
    }

    console.error(`Failed to fetch Shopify product ${productId}:`, response.status, await response.text());
    return null;
  } catch (error) {
    console.error(`Error fetching Shopify product ${productId}:`, error);
    return null;
  }
};