import { FC, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  getUserInterestProfile, 
  clearUserInterests,
  getUserInterests 
} from '../utils/personalization';

const PersonalizationDebug: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const profile = getUserInterestProfile();
  const interests = getUserInterests();

  const handleClear = () => {
    if (confirm('This will clear all your tracked interests. Are you sure?')) {
      clearUserInterests();
      window.location.reload();
    }
  };

  if (!profile.hasInterests) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm border">
          👤 No personalization data yet - read some articles!
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white shadow-lg rounded-lg border transition-all duration-300 ${
        isOpen ? 'w-80' : 'w-auto'
      }`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 text-left text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-lg"
        >
          📊 Personalization Debug {isPreview && '(Preview)'} {isOpen ? '−' : '+'}
        </button>
        
        {isOpen && (
          <div className="p-4 border-t space-y-3">
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Profile Summary</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Topics: {profile.totalTopics}</div>
                <div>Total Visits: {profile.totalVisits}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Top Interests</h4>
              <div className="space-y-1">
                {profile.topInterests.slice(0, 5).map((interest) => (
                  <div key={interest.topicCodename} className="flex justify-between text-xs">
                    <span className="text-gray-700 truncate">{interest.topicName}</span>
                    <span className="text-blue-600 ml-2">{interest.visitCount}x</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Recent Activity</h4>
              <div className="space-y-1">
                {profile.recentInterests.slice(0, 3).map((interest) => (
                  <div key={interest.topicCodename} className="text-xs text-gray-600">
                    {interest.topicName} - {new Date(interest.lastVisited).toLocaleDateString()}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <button
                onClick={handleClear}
                className="w-full px-3 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              >
                Clear All Data
              </button>
            </div>
            
            <details className="pt-2 border-t">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Raw Data (Developer)
              </summary>
              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(interests, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizationDebug;