import React, { useCallback, useState, useEffect } from "react";
import PageSection from "../components/PageSection";
import { useAppContext } from "../context/AppContext";
import { createClient } from "../utils/client";
import { DeliveryError } from "@kontent-ai/delivery-sdk";
import { Page, Article } from "../model/content-types";
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
import PersonalTasteList from "../components/articles/PersonalTasteList";
import MusicRecommendation from "../components/MusicRecommendation";
import { useTheme } from "../context/ThemeContext";

const usePersonalTastePage = (isPreview: boolean, lang: string | null) => {
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
      .item<Page>("personal_taste")
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

const useArticles = (isPreview: boolean, lang: string | null) => {
  const { environmentId, apiKey } = useAppContext();
  const [articles, setArticles] = useState<Article[]>([]);
  

  const handleLiveUpdate = useCallback((data: IUpdateMessageData) => {
    // Update the specific article in the list
    setArticles(prevArticles => {
      return prevArticles.map(article => {
        if (article.system.codename === data.item.codename) {
          // Apply the update and handle the Promise
          applyUpdateOnItemAndLoadLinkedItems(
            article,
            data,
            (codenamesToFetch) => createClient(environmentId, apiKey, isPreview)
              .items()
              .inFilter("system.codename", [...codenamesToFetch])
              .toPromise()
              .then(res => res.data.items)
          ).then((updatedItem) => {
            if (updatedItem) {
              setArticles(prev => prev.map(a =>
                a.system.codename === data.item.codename ? updatedItem as Article : a
              ));
            }
          });
          return article; // Return the current article while waiting for the update
        }
        return article;
      });
    });
  }, [environmentId, apiKey, isPreview]);

  useEffect(() => {
    createClient(environmentId, apiKey, isPreview)
      .items<Article>()
      .type("article")
      .languageParameter((lang ?? "default") as LanguageCodenames)
      .orderByAscending("elements.publish_date")
      .toPromise()
      .then(res => {
        setArticles(res.data.items);
      })
      .catch((err) => {
        if (err instanceof DeliveryError) {
          setArticles([]);
        } else {
          throw err;
        }
      });
  }, [environmentId, apiKey, isPreview, lang]);

  useLivePreview(handleLiveUpdate);

  return articles;
};

const PersonalTastePage: React.FC = () => {
  const { environmentId, apiKey } = useAppContext();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const lang = searchParams.get("lang");
  
  const personalTastePage = usePersonalTastePage(isPreview, lang);  
  const articles = useArticles(isPreview, lang);
  const { isDarkMode } = useTheme();
  const [personalTastePageData] = useSuspenseQueries({
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
        personalTastePageData.refetch();
      }
    },
    [personalTastePage],
  );

  useCustomRefresh(onRefresh);

  if (!personalTastePage || !articles) {
    return <div className="flex-grow" />;
  }

  return (
    <div className="flex flex-col gap-12">
      <PageSection color={isDarkMode ? "bg-black" : "bg-mintGreen"}>
        <div className="flex flex-col-reverse gap-16 lg:gap-0 lg:flex-row items-center py-16 lg:py-0 lg:pt-[104px] lg:pb-[160px]">
          <div className="flex flex-col flex-1 gap-6 lg:pr-20">
            <h1 className="text-heading-1 text-heading-1-color"
              {...createItemSmartLink(personalTastePage.system.id)}
              {...createElementSmartLink("headline")}
            >
              {personalTastePage.elements.headline?.value}
            </h1>
            <p className="text-body-lg text-body-color"
              {...createItemSmartLink(personalTastePage.system.id)}
              {...createElementSmartLink("subheadline")}
            >
              {personalTastePage.elements.subheadline?.value}
            </p>
          </div>
          <div className="flex flex-col flex-1">
            <img
              width={670}
              height={440}
              src={personalTastePage.elements.hero_image?.value[0]?.url}
              alt={personalTastePage.elements.hero_image?.value[0]?.description ?? ""}
              className="rounded-lg"
            />
          </div>
        </div>
      </PageSection>

      <PageSection color={isDarkMode ? "bg-black" : "bg-white"}>
        <div className="mt-12">
          <MusicRecommendation />
        </div>
        <PersonalTasteList articles={articles} />
      </PageSection>

      {!isEmptyRichText(personalTastePage.elements.body?.value ?? "") && (
        <PageSection color="bg-white">
          <div className="flex flex-col pt-10 mx-auto gap-6"
            {...createItemSmartLink(personalTastePage.system.id)}
            {...createElementSmartLink("body")}
          >
            <PortableText
              value={transformToPortableText(personalTastePage.elements.body?.value ?? "")}
              components={defaultPortableRichTextResolvers}
            />
          </div>
        </PageSection>
      )}

    </div>
  );
};

export default PersonalTastePage;

