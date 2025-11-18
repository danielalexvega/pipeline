import React, { useCallback, useMemo } from "react";
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
type CloudinaryAsset = {
  url: string;
  alt?: string;
};

const parseCloudinaryAsset = (rawValue: string | undefined | null, fallbackAlt: string): CloudinaryAsset | null => {
  if (!rawValue) {
    return null;
  }

  const tryBuildAsset = (value: unknown): CloudinaryAsset | null => {
    if (!value) return null;

    if (Array.isArray(value)) {
      for (const item of value) {
        const asset = tryBuildAsset(item);
        if (asset) return asset;
      }
      return null;
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const secureUrl = typeof record.secure_url === "string" ? record.secure_url : undefined;
      const url = typeof record.url === "string" ? record.url : secureUrl;
      if (!url) return null;

      const alt =
        typeof record.alt === "string"
          ? record.alt
          : typeof record.altText === "string"
            ? record.altText
            : typeof record.description === "string"
              ? record.description
              : typeof record.public_id === "string"
                ? record.public_id
                : typeof (record.context as { custom?: { alt?: string } } | undefined)?.custom?.alt === "string"
                  ? (record.context as { custom?: { alt?: string } }).custom?.alt
                  : undefined;

      return { url, alt: alt || fallbackAlt };
    }

    if (typeof value === "string" && value.trim().length > 0) {
      return { url: value.trim(), alt: fallbackAlt };
    }

    return null;
  };

  try {
    const parsed = JSON.parse(rawValue);
    const asset = tryBuildAsset(parsed);
    if (asset) return asset;
  } catch {
    // Ignore JSON parse errors – fall back to using the raw value.
  }

  return tryBuildAsset(rawValue);
};

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

  const cloudinaryAsset = useMemo(() => {
    if (!product) return null;
    return parseCloudinaryAsset(
      product.elements.cloudinary_integration?.value,
      product.elements.name?.value || "Product image",
    );
  }, [product]);

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
              {product.elements.name?.value}
            </h1>
          </div>
          <div className="flex-1">
            {cloudinaryAsset ? (
              <img
                width={670}
                height={440}
                src={cloudinaryAsset.url}
                alt={cloudinaryAsset.alt || product.elements.name?.value || "Product image"}
                className="rounded-lg w-[670px] h-[440px] object-cover"
              />
            ) : (
              <div className="rounded-lg w-[670px] h-[440px] flex items-center justify-center bg-gray-100 text-gray-500 border border-gray-200">
                <span>No product image available</span>
              </div>
            )}
          </div>
        </div>
      </PageSection>

      <PageSection color="bg-white">
        <div className="flex flex-col gap-12 mx-auto items-center max-w-fit">
          {product.elements.body?.value && (
            <div className="rich-text-body flex mx-auto flex-col gap-5 items-center max-w-[728px]"
            {...createItemSmartLink(product.system.id)}
            {...createElementSmartLink("body")}
            >
              <PortableText
                value={transformToPortableText(product.elements.body.value)}
                components={defaultPortableRichTextResolvers()}
              />
            </div>
          )}
        </div>
      </PageSection>
    </div>
  );
};

export default ProductDetailPage;