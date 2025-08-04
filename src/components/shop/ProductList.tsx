import { FC, useState, useMemo } from "react";
import { ProductListItem } from "./ProductListItem";
import { Product } from "../../model";
import { 
  getUserInterestProfile, 
  getPersonalizedRecommendations,
  calculatePersonalizationScore 
} from "../../utils/personalization";

interface ProductListProps {
  products: Product[];
}

// Get product topics from the actual CMS taxonomy field
const getProductTopics = (product: Product): string[] => {
  return product.elements.australian_museum_topics?.value?.map(topic => topic.codename) || [];
};

const ProductList: FC<ProductListProps> = ({ 
  products, 
}) => {
  const [showPersonalized, setShowPersonalized] = useState(false);
  const userProfile = getUserInterestProfile();
  
  const { personalizedProducts, allProducts } = useMemo(() => {
    if (!userProfile.hasInterests) {
      return { personalizedProducts: [], allProducts: products };
    }
    
    const personalized = getPersonalizedRecommendations(
      products,
      getProductTopics,
      { minimumScore: 0.1, includeMixed: true }
    );
    
    return { 
      personalizedProducts: personalized, 
      allProducts: products 
    };
  }, [products, userProfile]);
  
  const displayProducts = showPersonalized ? personalizedProducts : allProducts;
  
  return (
    <div className="flex flex-col gap-6">
      {/* Personalization Controls */}
      {userProfile.hasInterests && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-blue-900">
                📊 Personalized Recommendations
              </h3>
              <p className="text-sm text-blue-700">
                Based on your interests: {userProfile.topInterests.slice(0, 3).map(t => t.topicName).join(', ')}
                {userProfile.topInterests.length > 3 && ` +${userProfile.topInterests.length - 3} more`}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {userProfile.totalVisits} articles read across {userProfile.totalTopics} topics
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPersonalized(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !showPersonalized 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                }`}
              >
                All Products ({allProducts.length})
              </button>
              <button
                onClick={() => setShowPersonalized(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  showPersonalized 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                }`}
              >
                For You ({personalizedProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayProducts.map((product) => {
          const topics = getProductTopics(product);
          const personalizationScore = calculatePersonalizationScore(topics);
          
          return (
            <div key={product.system.id} className="relative">
              {/* Personalization Badge */}
              {userProfile.hasInterests && personalizationScore > 0.3 && (
                <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                  ⭐ For You
                </div>
              )}
              
              <ProductListItem product={product} />
              
              {/* Debug Info (remove in production) */}
              {topics.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Topics: {product.elements.australian_museum_topics?.value?.map(t => t.name).join(', ') || topics.join(', ')} 
                  {userProfile.hasInterests && (
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
      {displayProducts.length === 0 && showPersonalized && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No personalized products found</p>
          <p className="text-sm">
            Read more articles to help us understand your interests and show relevant products.
          </p>
          <button
            onClick={() => setShowPersonalized(false)}
            className="mt-4 text-blue-600 hover:text-blue-800 underline"
          >
            View all products instead
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;
