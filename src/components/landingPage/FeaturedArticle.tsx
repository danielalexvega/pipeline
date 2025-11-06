import React from "react";
import Tags from "../Tags";
import Link from "../Link";
import { createItemSmartLink } from "../../utils/smartlink";
import { useTheme } from "../../context/ThemeContext";

type FeaturedArticleProps = Readonly<{
  article: Readonly<{
    image: Readonly<{
      url: string;
      alt: string;
    }>;
    title: string;
    publishDate: string;
    introduction: string;
    topics: ReadonlyArray<string>;
    itemId: string;
  }>;
  displayFeatured?: boolean;
  urlSlug: string;
}>;

const FeaturedArticle: React.FC<FeaturedArticleProps> = ({ article, urlSlug }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={isDarkMode ? "flex flex-col h-full bg-black rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow" : "flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"}>
      {/* Image */}
      <div className="relative">
        {/* {displayFeatured && (
          <span className="absolute top-4 left-4 px-3.5 py-1.5 text-body-xs bg-azure text-white rounded-md font-bold z-10">
            FEATURED ARTICLE
          </span>
        )} */}
        <img
          width={300}
          height={200}
          src={article.image.url ? `${article.image.url}?auto=format&w=600` : ""}
          alt={article.image.alt ?? "image alt"}
          className="w-full h-48 object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        <div
          {...createItemSmartLink(article.itemId)}
          className="flex flex-col flex-1"
        >
          {/* Title */}
          <h3 className={isDarkMode ? "text-heading-4 font-semibold text-white mb-3 line-clamp-2 leading-[120%]" : "text-heading-4 font-semibold text-black mb-3 line-clamp-2 leading-[120%]"}>
            {article.title}
          </h3>
          
          {/* Published Date */}
          <p className={isDarkMode ? "text-white text-body-sm mb-3" : "text-gray-dark text-body-sm mb-3"}>
            {article.publishDate
              && `Published on ${
                new Date(article.publishDate).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                  day: "numeric",
                })
              }`}
          </p>
          
          {/* Topics */}
          {article.topics.length > 0 && (
            <div className="mb-4">
              <Tags
                tags={article.topics}
                className="flex-wrap"
              />
            </div>
          )}
          
          {/* Introduction */}
          <p className={`${isDarkMode ? "text-white": "text-gray-700"} text-body-sm mb-4 flex-1 line-clamp-3`}>
            {article.introduction}
          </p>
        </div>
        
        {/* Read More Link */}
        <div className="mt-auto test">
          <Link href={urlSlug} text="Read more" className="text-azure hover:text-burgundy font-medium" />
        </div>
      </div>
    </div>
  );
};

export default FeaturedArticle;
