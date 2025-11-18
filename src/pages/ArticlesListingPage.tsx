import React, { useCallback, useState, useEffect, useMemo } from "react";
import PageSection from "../components/PageSection";
import { useAppContext } from "../context/AppContext";
import { createClient } from "../utils/client";
import { DeliveryError, ITaxonomyTerms } from "@kontent-ai/delivery-sdk";
import ArticleList from "../components/articles/ArticleList";
import { Page, Article, LanguageCodenames } from "../model";
import { useSearchParams } from "react-router-dom";
import { defaultPortableRichTextResolvers, isEmptyRichText } from "../utils/richtext";
import { PortableText } from "@portabletext/react";
import { transformToPortableText } from "@kontent-ai/rich-text-resolver";
import { IRefreshMessageData, IRefreshMessageMetadata, IUpdateMessageData, applyUpdateOnItemAndLoadLinkedItems } from "@kontent-ai/smart-link";
import { useCustomRefresh, useLivePreview } from "../context/SmartLinkContext";
import { createElementSmartLink, createItemSmartLink } from "../utils/smartlink";
import ImageWithTag from "../components/ImageWithTag";
import Tags from "../components/Tags";
import ButtonLink from "../components/ButtonLink";
import { useSuspenseQueries } from "@tanstack/react-query";
import { Replace } from "../utils/types";
import { useTheme } from "../context/ThemeContext";
import { useFlags } from "launchdarkly-react-client-sdk";

type FeaturedArticleProps = Readonly<{
  image: {
    url: string;
    alt: string;
    width: number;
    height: number;
  };
  title: string;
  published: string;
  tags: ReadonlyArray<string>;
  description: string;
  urlSlug: string;
  itemId: string;
}>;

const FeaturedArticleVertical: React.FC<FeaturedArticleProps> = ({ image, title, published, tags, description, urlSlug, itemId }) => {
  const { isDarkMode } = useTheme();
  return (
    <div className="flex flex-col lg:flex-row items-center pt-[104px] gap-12"
      {...createItemSmartLink(itemId)}
      {...createElementSmartLink("featured_article")}>
      <ImageWithTag
        image={{
          url: image.url,
          alt: image.alt,
          width: image.width,
          height: image.height,
        }}
        tagText="Featured Article"
        className="lg:basis-1/2 xl:basis-2/5"
      />

      <div className="lg:basis-1/2 xl:basis-3/5">
        <h2 className={`text-heading-2 mb-4 ${ isDarkMode ? "text-white" : "text-black"}`}>{title}</h2>
        {/* Published Date */}
        <p className="text-gray-light text-body-sm mb-3">
          {published
            && `Published on ${new Date(published).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
              day: "numeric",
            })
            }`}
        </p>



        <Tags tags={tags} className="mt-4" />
        <p className="text-body-md text-body-color pt-3">
          {description}
        </p>
        <ButtonLink href={urlSlug} className="mt-6">Read More</ButtonLink>
      </div>
    </div>
  );
};

const useArticlesListingPage = (isPreview: boolean, lang: string | null) => {
  const { environmentId, apiKey } = useAppContext();
  const [page, setPage] = useState<Page | null>(null);

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
          setPage(updatedItem as Page);
        }
      });
    }
  }, [page, environmentId, apiKey, isPreview]);

  useEffect(() => {
    createClient(environmentId, apiKey, isPreview)
      .item<Page>("articles")
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
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);

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
        // Set a random featured article
        if (res.data.items.length > 0) {
          const randomIndex = Math.floor(Math.random() * res.data.items.length);
          setFeaturedArticle(res.data.items[randomIndex] || null);
        } else {
          setFeaturedArticle(null);
        }
      })
      .catch((err) => {
        if (err instanceof DeliveryError) {
          setArticles([]);
          setFeaturedArticle(null);
        } else {
          throw err;
        }
      });
  }, [environmentId, apiKey, isPreview, lang]);

  useLivePreview(handleLiveUpdate);

  return { articles, featuredArticle };
};

type FilterOption = {
  label: string;
  codename: string;
};

const useArticleTypes = (isPreview: boolean) => {
  const { environmentId, apiKey } = useAppContext();
  const [types, setTypes] = useState<{ terms: ITaxonomyTerms[] }>({ terms: [] });

  useEffect(() => {
    createClient(environmentId, apiKey, isPreview)
      .taxonomy("music_articles")
      .toPromise()
      .then(res => {
        setTypes(res.data.taxonomy);
      })
      .catch((err) => {
        if (err instanceof DeliveryError) {
          setTypes({ terms: [] });
        } else {
          throw err;
        }
      });
  }, [environmentId, apiKey, isPreview]);

  return types;
};


const ArticlesListingPage: React.FC = () => {
  const { environmentId, apiKey } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const lang = searchParams.get("lang");

  const articlesListingPage = useArticlesListingPage(isPreview, lang);
  const { articles, featuredArticle } = useArticles(isPreview, lang);
  const articleTypes = useArticleTypes(isPreview);
  const flags = useFlags();
  const isArtistSearchEnabled = flags["artistSearch"] ?? false;

  console.log("isArtistSearchEnabled", isArtistSearchEnabled);

  const [selectedType, setSelectedType] = useState<string>(searchParams.get("type") || "");
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("search") || "");
  const { isDarkMode } = useTheme();

  const filterOptions = useMemo<FilterOption[]>(() => {
    const taxonomyOptions =
      articleTypes.terms?.map(term => ({
        label: term.name,
        codename: term.codename,
      })) ?? [];
    return [
      { label: "All", codename: "" },
      ...taxonomyOptions,
    ];
  }, [articleTypes]);

  const handleArticleTypeChange = (option: FilterOption) => {
    setSelectedType(option.codename);
    const newSearchParams = new URLSearchParams(searchParams);
    if (!option.codename) {
      newSearchParams.delete("type");
    } else {
      newSearchParams.set("type", option.codename);
    }
    setSearchParams(newSearchParams);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const newSearchParams = new URLSearchParams(searchParams);
    if (!query) {
      newSearchParams.delete("search");
    } else {
      newSearchParams.set("search", query);
    }
    setSearchParams(newSearchParams);
  };

  const filteredArticles = useMemo(() => {
    let filtered = articles;

    // Filter by taxonomy type
    if (selectedType) {
      filtered = filtered.filter(article =>
        article.elements.music_topics?.value?.some(topic => topic.codename === selectedType),
      );
    }

    // Filter by search query (keywords and/or title) - only if feature flag is enabled
    if (isArtistSearchEnabled && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(article => {
        const title = article.elements.title.value?.toLowerCase() || "";
        const keywords = article.elements.metadata__keywords?.value?.toLowerCase() || "";
        
        // Match if title contains the query OR keywords contain the query
        return title.includes(query) || keywords.includes(query);
      });
    }

    return filtered;
  }, [articles, selectedType, searchQuery, isArtistSearchEnabled]);

  const [landingPageData] = useSuspenseQueries({
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
        landingPageData.refetch();
      }
    },
    [articlesListingPage],
  );

  useCustomRefresh(onRefresh);

  if (!articlesListingPage || !articles) {
    return <div className="flex-grow" />;
  }

  return (
    <div className="flex flex-col">
      <PageSection color={isDarkMode ? "bg-black" : "bg-mintGreen"}>
        <div className="flex flex-col-reverse gap-16 lg:gap-0 lg:flex-row items-center py-16 lg:py-0 lg:pt-[104px] lg:pb-[160px]">
          <div className="flex flex-col flex-1 gap-6 pr-20">
            <h1 className="text-heading-1 text-heading-1-color"
              {...createItemSmartLink(articlesListingPage.system.id)}
              {...createElementSmartLink("headline")}
            >
              {articlesListingPage.elements.headline.value}
            </h1>
            <p className="text-body-lg text-body-color"
              {...createItemSmartLink(articlesListingPage.system.id)}
              {...createElementSmartLink("subheadline")}
            >
              {articlesListingPage.elements.subheadline.value}
            </p>
          </div>
          <div className="flex flex-col flex-1">
            <img
              width={670}
              height={440}
              src={articlesListingPage.elements.hero_image?.value[0]?.url}
              alt={articlesListingPage.elements.hero_image?.value[0]?.description ?? ""}
              className="rounded-lg"
            />
          </div>
        </div>
      </PageSection>

      {!isEmptyRichText(articlesListingPage.elements.body.value) && (
        <PageSection color="bg-white">
          <div className="flex flex-col pt-10 mx-auto gap-6"
            {...createItemSmartLink(articlesListingPage.system.id)}
            {...createElementSmartLink("body")}
          >
            <PortableText
              value={transformToPortableText(articlesListingPage.elements.body.value)}
              components={defaultPortableRichTextResolvers}
            />
          </div>
        </PageSection>
      )}

      {featuredArticle && (
        <PageSection color={isDarkMode ? "bg-black" : "bg-white"}>
          <FeaturedArticleVertical
            key={featuredArticle.system.id}
            image={{
              url: featuredArticle.elements.image.value[0]?.url ?? "",
              alt: featuredArticle.elements.image.value[0]?.description ?? featuredArticle.elements.title.value,
              width: 670,
              height: 440,
            }}
            title={featuredArticle.elements.title.value}
            published={featuredArticle.elements.publish_date.value ?? ""}
            tags={featuredArticle.elements.music_topics?.value?.map(t => t.name) || []}
            description={featuredArticle.elements.introduction.value}
            urlSlug={featuredArticle.elements.url_slug.value}
            itemId={featuredArticle.system.id}
          />
        </PageSection>
      )}

      <PageSection color={isDarkMode ? "bg-black" : "bg-white"}>
        <div className="flex flex-col gap-8 pt-[104px] pb-[160px]">
          <div className="flex flex-col gap-4">
            {isArtistSearchEnabled && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by keywords or title..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border text-sm ${
                    isDarkMode
                      ? "bg-black text-white border-white/40 placeholder-white/60 focus:border-white focus:outline-none"
                      : "bg-white text-black border-darkGreen/40 placeholder-darkGreen/60 focus:border-darkGreen focus:outline-none"
                  }`}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {filterOptions.map(option => {
                const isActive = option.codename === selectedType;
                return (
                  <button
                    key={option.codename || "all"}
                    onClick={() => handleArticleTypeChange(option)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? isDarkMode
                          ? "bg-white text-black"
                          : "bg-darkGreen text-white"
                        : isDarkMode
                          ? "bg-black text-white border border-white/40 hover:bg-white/10"
                          : "bg-white text-darkGreen border border-darkGreen/40 hover:bg-darkGreen/10"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <ArticleList
            articles={filteredArticles.map(article => ({
              image: {
                url: article.elements.image.value[0]?.url ?? "",
                alt: article.elements.image.value[0]?.description ?? article.elements.title.value,
              },
              title: article.elements.title.value,
              introduction: article.elements.introduction.value,
              publishDate: article.elements.publish_date.value ?? "",
              topics: article.elements.music_topics?.value?.map(term => term.name) || [],
              urlSlug: article.elements.url_slug.value,
              itemId: article.system.id,
            }))}
          />
        </div>
      </PageSection>
    </div>
  );
};

export default ArticlesListingPage;
