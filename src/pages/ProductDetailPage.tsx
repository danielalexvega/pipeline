import React, { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { createClient } from "../utils/client";
import { useAppContext } from "../context/AppContext";
import { LanguageCodenames, Product } from "../model";
import { DeliveryError } from "@kontent-ai/delivery-sdk";
import { PortableText } from "@portabletext/react";
import { transformToPortableText } from "@kontent-ai/rich-text-resolver";
import { defaultPortableRichTextResolvers } from "../utils/richtext";
import PageSection from "../components/PageSection";
import { IRefreshMessageData, IRefreshMessageMetadata, IUpdateMessageData, applyUpdateOnItemAndLoadLinkedItems } from "@kontent-ai/smart-link";
import { useCustomRefresh, useLivePreview } from "../context/SmartLinkContext";
import { createElementSmartLink, createItemSmartLink } from "../utils/smartlink";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getShopifyProduct, type StorefrontProduct } from "../utils/api";

const ProductDetailPage: React.FC = () => {
  const { environmentId, apiKey } = useAppContext();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const lang = searchParams.get("lang");
  const queryClient = useQueryClient();

  const { data: product, refetch } = useQuery({
    queryKey: ["product-detail", slug, lang, isPreview],
    queryFn: async () => {
      try {
        const response = await createClient(environmentId, apiKey, isPreview)
          .item<Product>(slug ?? "")
          .languageParameter((lang ?? "default") as LanguageCodenames)
          .toPromise();

        return response.data.item ?? null;
      } catch (err) {
        if (err instanceof DeliveryError) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!slug,
  });

  // Shopify product data
  const [shopifyProduct, setShopifyProduct] = useState<StorefrontProduct | null>(null);
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [shopifyError, setShopifyError] = useState<string | null>(null);

  // Fetch Shopify product data when CMS product is loaded
  useEffect(() => {
    if (!product?.elements.pim_integration_e_g__shopify.value) return;
    
    // Parse the JSON inside useEffect to avoid creating new objects on every render
    let pimData;
    try {
      pimData = JSON.parse(product.elements.pim_integration_e_g__shopify.value);
    } catch (error) {
      console.error("Failed to parse PIM integration data:", error);
      setShopifyError("Invalid PIM integration data");
      return;
    }

    if (!pimData || !pimData[0]?.id) return;
    
    setShopifyLoading(true);
    setShopifyError(null);

    // Use the full Shopify GID or extract the numeric ID for backward compatibility
    const productIdentifier = pimData[0].id?.split('/').pop() || pimData[0].id;
      
    if (!productIdentifier) {
      setShopifyError("Invalid product ID format");
      setShopifyLoading(false);
      return;
    }
    
    getShopifyProduct(productIdentifier)
      .then((data) => {
        setShopifyProduct(data);
      })
      .catch((err) => {
        setShopifyError(err.message || "Failed to fetch product");
      })
      .finally(() => setShopifyLoading(false));
  }, [product?.elements.pim_integration_e_g__shopify.value]);

  const handleLiveUpdate = useCallback((data: IUpdateMessageData) => {
    if (product) {
      applyUpdateOnItemAndLoadLinkedItems(
        product,
        data,
        (codenamesToFetch: readonly string[]) => createClient(environmentId, apiKey, isPreview)
          .items()
          .inFilter("system.codename", [...codenamesToFetch])
          .toPromise()
          .then(res => res.data.items)
      ).then((updatedItem) => {
        if (updatedItem) {
          queryClient.setQueryData(["product-detail", slug, lang, isPreview], updatedItem);
        }
      });
    }
  }, [product, environmentId, apiKey, isPreview, slug, lang, queryClient]);

  useLivePreview(handleLiveUpdate);

  const onRefresh = useCallback(
    (_: IRefreshMessageData, metadata: IRefreshMessageMetadata, originalRefresh: () => void) => {
      if (metadata.manualRefresh) {
        originalRefresh();
      } else {
        refetch();
      }
    },
    [refetch],
  );

  useCustomRefresh(onRefresh);

  if (!product) {
    return <div className="flex-grow" />;
  }

  return (
    <div className="flex flex-col gap-12">
      <PageSection color="bg-azure">
        <div className="azure-theme flex flex-col-reverse gap-16 lg:flex-row items-center pt-[104px] pb-[160px]">
          <div className="flex flex-col flex-1 gap-6">
            <div className="w-fit text-xs text-body-color border tracking-wider font-[700] border-tag-border-color px-4 py-2 rounded-lg uppercase">
              {product.system.language === "es-ES" ? "Producto" : "Product"}
            </div>
            <h1 className="text-heading-1 leading-[84%] text-heading-1-color"
            {...createItemSmartLink(product.system.id)}
            {...createElementSmartLink("name")}
            >
              {shopifyProduct?.title || product.elements.name?.value}
            </h1>
            
            {/* Shopify Price */}
            {shopifyProduct?.variants?.edges?.[0]?.node?.price && (
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-burgundy">
                    {shopifyProduct.variants.edges[0].node.price.currencyCode === 'USD' ? '$' : ''}
                    {parseFloat(shopifyProduct.variants.edges[0].node.price.amount).toFixed(2)}
                    {shopifyProduct.variants.edges[0].node.price.currencyCode !== 'USD' && 
                     ` ${shopifyProduct.variants.edges[0].node.price.currencyCode}`}
                  </span>
                  {shopifyProduct.variants.edges[0].node.compareAtPrice && 
                   parseFloat(shopifyProduct.variants.edges[0].node.compareAtPrice.amount) > parseFloat(shopifyProduct.variants.edges[0].node.price.amount) && (
                    <span className="text-xl text-gray-500 line-through">
                      {shopifyProduct.variants.edges[0].node.compareAtPrice.currencyCode === 'USD' ? '$' : ''}
                      {parseFloat(shopifyProduct.variants.edges[0].node.compareAtPrice.amount).toFixed(2)}
                      {shopifyProduct.variants.edges[0].node.compareAtPrice.currencyCode !== 'USD' && 
                       ` ${shopifyProduct.variants.edges[0].node.compareAtPrice.currencyCode}`}
                    </span>
                  )}
                </div>
                {shopifyProduct.variants.edges[0].node.compareAtPrice && 
                 parseFloat(shopifyProduct.variants.edges[0].node.compareAtPrice.amount) > parseFloat(shopifyProduct.variants.edges[0].node.price.amount) && (
                  <div className="text-sm text-green-600 font-medium">
                    Save ${(parseFloat(shopifyProduct.variants.edges[0].node.compareAtPrice.amount) - parseFloat(shopifyProduct.variants.edges[0].node.price.amount)).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Loading indicator for Shopify data */}
            {shopifyLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
                <span>Loading price...</span>
              </div>
            )}

            {/* Error indicator for Shopify data */}
            {shopifyError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {shopifyError}
              </div>
            )}
          </div>
          <div className="flex-1">
            {shopifyProduct?.featuredImage?.url ? (
              <img
                width={670}
                height={440}
                src={shopifyProduct.featuredImage.url}
                alt={shopifyProduct.featuredImage.altText || product.elements.name?.value || "Product image"}
                className="rounded-lg w-[670px] h-[440px] object-cover"
              />
            ) : (
              <img
                width={670}
                height={440}
                src={product.elements.cloudinary_integration?.value ?? ""}
                alt={product.elements.name?.value ?? ""}
                className="rounded-lg w-[670px] h-[440px] object-cover"
              />
            )}
          </div>
        </div>
      </PageSection>

      <PageSection color="bg-white">
        <div className="flex flex-col gap-12 mx-auto items-center max-w-fit">
          {/* Shopify Description */}
          {shopifyProduct?.description && (
            <div className="flex mx-auto flex-col gap-5 items-center max-w-[728px]">
              <h2 className="text-2xl font-semibold text-gray-900 text-center">Product Description</h2>
              <div className="text-lg text-gray-700 leading-relaxed text-center">
                {shopifyProduct.description}
              </div>
            </div>
          )}
          
          {/* CMS Body Content */}
          {product.elements.body?.value && (
            <div className="rich-text-body flex mx-auto flex-col gap-5 items-center max-w-[728px]"
            {...createItemSmartLink(product.system.id)}
            {...createElementSmartLink("body")}
            >
              {shopifyProduct?.description && (
                <h2 className="text-2xl font-semibold text-gray-900 text-center mt-8">Additional Information</h2>
              )}
              <PortableText
                value={transformToPortableText(product.elements.body.value)}
                components={defaultPortableRichTextResolvers}
              />
            </div>
          )}
        </div>
      </PageSection>
    </div>
  );
};

export default ProductDetailPage;