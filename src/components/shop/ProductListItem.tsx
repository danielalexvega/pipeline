import { FC, useEffect, useState } from "react";
import ButtonLink from "../ButtonLink";
import { createItemSmartLink } from "../../utils/smartlink";
import { Product } from "../../model";
import { getShopifyProduct } from "../../utils/api";
import { transformToPortableText } from "@kontent-ai/rich-text-resolver";
import { defaultPortableRichTextResolvers } from "../../utils/richtext";
import { PortableText } from "@portabletext/react";

// Import the Storefront API types from utils
import type { StorefrontProduct } from "../../utils/api";

type ProductListItemProps = {
  product: Product;
  useShopify?: boolean;
  shopifyProductHandle?: string;
};

export const ProductListItem: FC<ProductListItemProps> = ({
  product
}) => {

  const [shopifyProduct, setShopifyProduct] = useState<StorefrontProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the raw PIM integration value for dependency tracking
  const pimIntegrationValue = product.elements.pim_integration_e_g__shopify.value;

  useEffect(() => {
    if (!pimIntegrationValue) return;
    
    // Parse the JSON inside useEffect to avoid creating new objects on every render
    let pimData;
    try {
      pimData = JSON.parse(pimIntegrationValue);
    } catch (error) {
      console.error("Failed to parse PIM integration data:", error);
      setError("Invalid PIM integration data");
      return;
    }

    if (!pimData || !pimData[0]?.id) return;
    
    setLoading(true);
    setError(null);

    // Use the full Shopify GID or extract the numeric ID for backward compatibility
    const productIdentifier = pimData[0].id.startsWith('gid') 
      ? pimData[0].id  // Use full GID
      : pimData[0].id?.split('/').pop() || pimData[0].id; // Extract numeric ID or use as-is
      
    if (!productIdentifier) {
      setError("Invalid product ID format");
      setLoading(false);
      return;
    }
    
    getShopifyProduct(productIdentifier)
      .then((data) => {
        setShopifyProduct(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch product");
      })
      .finally(() => setLoading(false));
  }, [pimIntegrationValue]);

  const productUrl = `/shop/${product.system.codename}`;

  return (
    <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
      {...createItemSmartLink(product.system.id)}>


      {/* Product Image */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {shopifyProduct?.featuredImage?.url ? (
          <img
            src={shopifyProduct.featuredImage.url}
            alt={shopifyProduct.featuredImage.altText || product.elements.name.value || "Product image"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="text-gray-400 text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">No image</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4">
        {/* Loading indicator for Shopify data */}
        {loading && (
          <div className="mb-2">
            <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
          </div>
        )}

        {/* Error indicator for Shopify data */}
        {error && (
          <div className="mb-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-burgundy transition-colors">
          {shopifyProduct?.title || product.elements.name.value || "Untitled Product"}
        </h3>

        {/* Price from Shopify variants */}
        {shopifyProduct?.variants?.edges?.[0]?.node?.price && (
          <div className="mb-3">
            <span className="text-xl font-bold text-burgundy">
              {shopifyProduct.variants.edges[0].node.price.currencyCode === 'USD' ? '$' : ''}
              {parseFloat(shopifyProduct.variants.edges[0].node.price.amount).toFixed(2)}
              {shopifyProduct.variants.edges[0].node.price.currencyCode !== 'USD' && 
               ` ${shopifyProduct.variants.edges[0].node.price.currencyCode}`}
            </span>
            {shopifyProduct.variants.edges[0].node.compareAtPrice && 
             parseFloat(shopifyProduct.variants.edges[0].node.compareAtPrice.amount) > parseFloat(shopifyProduct.variants.edges[0].node.price.amount) && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                {shopifyProduct.variants.edges[0].node.compareAtPrice.currencyCode === 'USD' ? '$' : ''}
                {parseFloat(shopifyProduct.variants.edges[0].node.compareAtPrice.amount).toFixed(2)}
                {shopifyProduct.variants.edges[0].node.compareAtPrice.currencyCode !== 'USD' && 
                 ` ${shopifyProduct.variants.edges[0].node.compareAtPrice.currencyCode}`}
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        <ButtonLink
          href={productUrl}
          style="azure"
          className="w-full justify-center"
        >
          View Details
        </ButtonLink>
      </div>
    </div>
  );
};
