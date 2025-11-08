import { FC, useState, useMemo } from "react";
import FeaturedArticle from "../landingPage/FeaturedArticle";
import { Article } from "../../model";
import { 
  getUserInterestProfile, 
  getPersonalizedRecommendations,
  calculatePersonalizationScore 
} from "../../utils/personalization";
import { useTheme } from "../../context/ThemeContext";
import { useLogin } from "../../context/LoginContext";
import { useFlags } from "launchdarkly-react-client-sdk";
interface PersonalTasteListProps {
  articles: Article[];
}


// Get article topics from the actual CMS taxonomy field (music_topics)
const getArticleTopics = (article: Article): string[] => {
  return article.elements.music_topics?.value?.map(topic => topic.codename) || [];
};

const PersonalTasteList: FC<PersonalTasteListProps> = ({ 
  articles, 
}) => {
  const [showPersonalized, setShowPersonalized] = useState(true);
  const userProfile = getUserInterestProfile();
  const { isDarkMode } = useTheme();
  const { isLoggedIn } = useLogin();
  const flags = useFlags();
  const showPersonalizationDebug = isLoggedIn && (flags["personalizationDebugger"] ?? false);

  const { personalizedArticles, allArticles } = useMemo(() => {
    if (!userProfile.hasInterests) {
      return { personalizedArticles: [], allArticles: articles };
    }
    
    const personalized = getPersonalizedRecommendations(
      articles,
      getArticleTopics,
      { minimumScore: 0.4, includeMixed: false }
    );
    
    return { 
      personalizedArticles: personalized, 
      allArticles: articles 
    };
  }, [articles, userProfile]);
  
  const displayArticles = showPersonalized ? personalizedArticles : allArticles;
  
  return (
    <div className="flex flex-col gap-6">
      {/* Personalization Controls */}
      {userProfile.hasInterests && (
        <div className={`${isDarkMode ? "bg-black border-white" : "bg-white border-darkGreen"} rounded-lg p-4 border-[2px] mt-10`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col">
              <h3 className={`text-2xl font-semibold ${isDarkMode ? "text-white" : "text-black"} uppercase font-lexend`}>
                🎵 Your Personal Taste
              </h3>
              <p className={`text-base ${isDarkMode ? "text-white" : "text-black" } mt-1`}>
                Based on your interests: {userProfile.topInterests.slice(0, 3).map(t => t.topicName).join(', ')}
                {userProfile.topInterests.length > 3 && ` +${userProfile.topInterests.length - 3} more`}
              </p>
              <p className={`text-base ${isDarkMode ? "text-white" : "text-black" } mt-1`}>
                {userProfile.totalVisits} articles read across {userProfile.totalTopics} topics
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPersonalized(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !showPersonalized 
                    ? `${isDarkMode ? "bg-white text-black" : "bg-darkGreen text-white"}` 
                    : `${isDarkMode ? "bg-black text-white border border-white" : "bg-white text-darkGreen border border-darkGreen hover:bg-mintGreen"}`
                }`}
              >
                All Articles ({allArticles.length})
              </button>
              <button
                onClick={() => setShowPersonalized(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  showPersonalized 
                    ? `${isDarkMode ? "bg-white text-black" : "bg-darkGreen text-white"}` 
                    : `${isDarkMode ? "bg-black text-white border border-white" : "bg-white text-darkGreen border border-darkGreen hover:bg-mintGreen"}`
                }`}
              >
                For You ({personalizedArticles.length})
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Article Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 gap-y-8 pt-10 pb-10">
        {displayArticles.map((article) => {
          const topics = getArticleTopics(article);
          const personalizationScore = calculatePersonalizationScore(topics);
          
          return (
            <div key={article.system.id} className="relative">
              {/* Personalization Badge */}
              {userProfile.hasInterests && personalizationScore > 0.3 && (
                <div className="absolute top-2 right-2 z-10 text-white text-xs px-2 py-1 rounded-full font-medium bg-darkGreen">
                  ⭐ For You
                </div>
              )}
              
              <FeaturedArticle
                article={{
                  image: {
                    url: article.elements.image.value[0]?.url ?? "",
                    alt: article.elements.image.value[0]?.description ?? "",
                  },
                  title: article.elements.title.value,
                  publishDate: article.elements.publish_date.value ?? "",
                  introduction: article.elements.introduction.value,
                  topics: article.elements.music_topics?.value?.map(t => t.name) || [],
                  itemId: article.system.id,
                }}
                urlSlug={`/articles/${article.elements.url_slug.value}`}
              />
              
              {/* Debug Info (remove in production) */}
              {topics.length > 0 && (
                <div className="mt-2 text-xs text-gray-500 mb-2">
                  Topics: {article.elements.music_topics?.value?.map(t => t.name).join(', ') || topics.join(', ')} 
                  {userProfile.hasInterests && showPersonalizationDebug && (
                    <span className="ml-2 text-blue-600">
                      (Score: {(personalizationScore * 100).toFixed(0)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Empty State */}
      {displayArticles.length === 0 && showPersonalized && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No personalized articles found</p>
          <p className="text-sm">
            Read more articles to help us understand your interests and show relevant content.
          </p>
          <button
            onClick={() => setShowPersonalized(false)}
            className="mt-4 text-blue-600 hover:text-blue-800 underline"
          >
            View all articles instead
          </button>
        </div>
      )}
      
      {/* No Interests State */}
      {!userProfile.hasInterests && (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🎵 Discover Your Personal Taste
          </h3>
          <p className="text-sm text-gray-600">
            Start reading articles to help us understand your music interests and provide personalized recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default PersonalTasteList;

