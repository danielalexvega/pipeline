import React, { useCallback, useState, useEffect } from "react";
import PageSection from "../components/PageSection";
import { useAppContext } from "../context/AppContext";
import { createClient } from "../utils/client";
import { DeliveryError } from "@kontent-ai/delivery-sdk";
import { Page, Product } from "../model/content-types";
import { useSearchParams } from "react-router-dom";
import { defaultPortableRichTextResolvers, isEmptyRichText } from "../utils/richtext";
import { PortableText } from "@portabletext/react";
import { transformToPortableText } from "@kontent-ai/rich-text-resolver";
import { LanguageCodenames } from "../model";
import { IRefreshMessageData, IRefreshMessageMetadata, IUpdateMessageData, applyUpdateOnItemAndLoadLinkedItems } from "@kontent-ai/smart-link";
import { useCustomRefresh, useLivePreview } from "../context/SmartLinkContext";
import { createElementSmartLink, createItemSmartLink } from "../utils/smartlink";
import { Replace } from "../utils/types";
import { useSuspenseQueries } from "@tanstack/react-query";
import ProductList from "../components/shop/ProductList";

const useShopPage = (isPreview: boolean, lang: string | null) => {
  const { environmentId, apiKey } = useAppContext();
  const [page, setPage] = useState<Replace<Page, { elements: Partial<Page["elements"]> }> | null>(null);

  const handleLiveUpdate = useCallback((data: IUpdateMessageData) => {
    if (page) {
      // Use applyUpdateOnItemAndLoadLinkedItems to ensure all linked content is updated
      applyUpdateOnItemAndLoadLinkedItems(
        page,
        data,
        (codenamesToFetch) => createClient(environmentId, apiKey, isPreview)
          .items()
          .inFilter("system.codename", [...codenamesToFetch])
          .toPromise()
          .then(res => res.data.items)
      ).then((updatedItem) => {
        if (updatedItem) {
          setPage(updatedItem as Replace<Page, { elements: Partial<Page["elements"]> }>);
        }
      });
    }
  }, [page, environmentId, apiKey, isPreview]);

  useEffect(() => {
    createClient(environmentId, apiKey, isPreview)
      .item<Page>("shop")
      .languageParameter((lang ?? "default") as LanguageCodenames)
      .toPromise()
      .then(res => {
        setPage(res.data.item);
      })
      .catch((err) => {
        if (err instanceof DeliveryError) {
          setPage(null);
        } else {
          throw err;
        }
      });
  }, [environmentId, apiKey, isPreview, lang]);

  useLivePreview(handleLiveUpdate);

  return page;
};

const useProducts = (isPreview: boolean, lang: string | null) => {
  const { environmentId, apiKey } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  

  const handleLiveUpdate = useCallback((data: IUpdateMessageData) => {
    // Update the specific team member in the list
    setProducts(prevProducts => {
      return prevProducts.map(product => {
        if (product.system.codename === data.item.codename) {
          // Apply the update and handle the Promise
          applyUpdateOnItemAndLoadLinkedItems(
            product,
            data,
            (codenamesToFetch) => createClient(environmentId, apiKey, isPreview)
              .items()
              .inFilter("system.codename", [...codenamesToFetch])
              .toPromise()
              .then(res => res.data.items)
          ).then((updatedItem) => {
            if (updatedItem) {
              setProducts(prev => prev.map(m =>
                m.system.codename === data.item.codename ? updatedItem as Product : m
              ));
            }
          });
          return product; // Return the current member while waiting for the update
        }
        return product;
      });
    });
  }, [environmentId, apiKey, isPreview]);

  useEffect(() => {
    createClient(environmentId, apiKey, isPreview)
      .items<Product>()
      .type("product")
      .languageParameter((lang ?? "default") as LanguageCodenames)
      .toPromise()
      .then(res => {
        setProducts(res.data.items);
      })
      .catch((err) => {
        if (err instanceof DeliveryError) {
          setProducts([]);
        } else {
          throw err;
        }
      });
  }, [environmentId, apiKey, isPreview, lang]);

  useLivePreview(handleLiveUpdate);

  return products;
};

const OurShopPage: React.FC = () => {
  const { environmentId, apiKey } = useAppContext();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const lang = searchParams.get("lang");
  
  const shopPage = useShopPage(isPreview, lang);  
  const products = useProducts(isPreview, lang);

  const [shopPageData] = useSuspenseQueries({
    queries: [
      {
        queryKey: ["landing_page"],
        queryFn: () =>
          createClient(environmentId, apiKey, isPreview)
            .items()
            .type("landing_page")
            .limitParameter(1)
            .toPromise()
            .then(res =>
              res.data.items[0] as Replace<Page, { elements: Partial<Page["elements"]> }> ?? null
            )
            .catch((err) => {
              if (err instanceof DeliveryError) {
                return null;
              }
              throw err;
            }),
      },
    ],
  });

  const onRefresh = useCallback(
    (_: IRefreshMessageData, metadata: IRefreshMessageMetadata, originalRefresh: () => void) => {
      if (metadata.manualRefresh) {
        originalRefresh();
      } else {
        shopPageData.refetch();
      }
    },
    [shopPage],
  );

  useCustomRefresh(onRefresh);

  if (!shopPage || !products) {
    return <div className="flex-grow" />;
  }

  return (
    <div className="flex flex-col gap-12">
      <PageSection color="bg-creme">
        <div className="flex flex-col-reverse gap-16 lg:gap-0 lg:flex-row items-center py-16 lg:py-0 lg:pt-[104px] lg:pb-[160px]">
          <div className="flex flex-col flex-1 gap-6">
            <h1 className="text-heading-1 text-heading-1-color"
              {...createItemSmartLink(shopPage.system.id)}
              {...createElementSmartLink("headline")}
            >
              {shopPage.elements.headline?.value}
            </h1>
            <p className="text-body-lg text-body-color"
              {...createItemSmartLink(shopPage.system.id)}
              {...createElementSmartLink("subheadline")}
            >
              {shopPage.elements.subheadline?.value}
            </p>
          </div>
          <div className="flex flex-col flex-1">
            <img
              width={670}
              height={440}
              src={shopPage.elements.hero_image?.value[0]?.url}
              alt={shopPage.elements.hero_image?.value[0]?.description ?? ""}
              className="rounded-lg"
            />
          </div>
        </div>
      </PageSection>

      <PageSection color="bg-white">
        <ProductList products={products} />
      </PageSection>

      {!isEmptyRichText(shopPage.elements.body?.value ?? "") && (
        <PageSection color="bg-white">
          <div className="flex flex-col pt-10 mx-auto gap-6"
            {...createItemSmartLink(shopPage.system.id)}
            {...createElementSmartLink("body")}
          >
            <PortableText
              value={transformToPortableText(shopPage.elements.body?.value ?? "")}
              components={defaultPortableRichTextResolvers()}
            />
          </div>
        </PageSection>
      )}

    </div>
  );
};

export default OurShopPage;
