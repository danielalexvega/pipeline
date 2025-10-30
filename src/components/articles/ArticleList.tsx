import React from "react";
import FeaturedArticle from "../landingPage/FeaturedArticle";

// Define the ArticleData type with a flattened structure
type ArticleData = Readonly<{
  image: Readonly<{
    url: string;
    alt: string;
  }>;
  title: string;
  introduction: string;
  publishDate: string;
  topics: ReadonlyArray<string>;
  urlSlug: string;
  itemId: string;
}>;

type ArticleListProps = Readonly<{
  articles: ReadonlyArray<ArticleData>;
}>;

const ArticleList: React.FC<ArticleListProps> = ({ articles }) => {
  return (
    <div className="w-full">
      {articles.length === 0
        ? <p className="text-center text-grey text-body-xl">No articles available</p>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((article) => (
              <FeaturedArticle
                key={article.urlSlug}
                article={{
                  image: article.image,
                  title: article.title,
                  introduction: article.introduction,
                  publishDate: article.publishDate,
                  topics: article.topics,
                  itemId: article.itemId
                }}
                urlSlug={article.urlSlug}
              />
            ))}
          </div>
        )}
    </div>
  );
};

export default ArticleList;
