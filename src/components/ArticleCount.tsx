import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFlags } from "launchdarkly-react-client-sdk";
import { NavLink, useSearchParams } from "react-router-dom";
import { createClient } from "../utils/client";
import { useAppContext } from "../context/AppContext";
import { useLogin } from "../context/LoginContext";
import { useTheme } from "../context/ThemeContext";
import { createPreviewLink } from "../utils/link";
import { Article, LanguageCodenames } from "../model";
import { DeliveryError } from "@kontent-ai/delivery-sdk";

const ArticleCount: FC = () => {
  const flags = useFlags();
  const { isLoggedIn } = useLogin();
  const { isDarkMode } = useTheme();
  const { environmentId, apiKey } = useAppContext();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const lang = searchParams.get("lang");

  // Check if ArticleCount feature flag is enabled
  const isArticleCountEnabled = flags["articleCount"] ?? false;

  const { data: articleCount } = useQuery({
    queryKey: ["articleCount", lang, isPreview],
    queryFn: async () => {
      try {
        const response = await createClient(environmentId, apiKey, isPreview)
          .items<Article>()
          .type("article")
          .languageParameter((lang ?? "default") as LanguageCodenames)
          .toPromise();
        
        return response.data.items.length;
      } catch (err) {
        if (err instanceof DeliveryError) {
          return 0;
        }
        throw err;
      }
    },
    enabled: isLoggedIn && isArticleCountEnabled, // Only fetch if logged in AND flag is enabled
  });

  // Don't render if not logged in
  if (!isLoggedIn) {
    return null;
  }

  // Don't render if feature flag is disabled
  if (!isArticleCountEnabled) {
    return null;
  }

  // Don't render if count is still loading or undefined
  if (articleCount === undefined) {
    return null;
  }

  return (
    <div className="w-full flex justify-center py-12">
      <div className={`flex flex-col md:flex-row gap-8 items-center max-w-[50%] border-[2px]  p-10 rounded-3xl ${isDarkMode ? "border-white" : "border-black" }`}>
        <div className="flex-1">
          <h3 
            className={`text-[200px] font-bold leading-none ${
              isDarkMode ? "text-white" : "text-darkGreen"
            }`}
          >
            {articleCount}
          </h3> 
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <p 
            className={`text-body-lg ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            Articles on your favorite artists in Pipeline. Everything from Hardcore to Hip Hop, from Bebop to French Touch. 
          </p>
          <NavLink
            to={createPreviewLink("/articles", isPreview)}
            className={`px-6 py-3 rounded-full font-medium text-center transition-all duration-300 w-fit ${
              isDarkMode
                ? "bg-black text-white border-2 border-white hover:bg-white hover:text-black hover:border-black"
                : "bg-darkGreen text-white border-2 border-darkGreen hover:bg-white hover:text-black hover:border-black"
            }`}
          >
            Read them all
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default ArticleCount;

