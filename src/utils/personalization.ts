// Personalization utilities for tracking user interests based on article topics

export type TopicInterest = {
  topicName: string;
  topicCodename: string;
  visitCount: number;
  lastVisited: string; // ISO date string
  firstVisited: string; // ISO date string
};

export type UserInterests = Record<string, TopicInterest>;

const COOKIE_NAME = 'user_topic_interests';
const COOKIE_EXPIRY_DAYS = 365; // 1 year

/**
 * Get user interests from cookie
 */
export function getUserInterests(): UserInterests {
  if (typeof document === 'undefined') return {};
  
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${COOKIE_NAME}=`));
    
  if (!cookie) return {};
  
  try {
    const cookieParts = cookie.split('=');
    if (cookieParts.length < 2 || !cookieParts[1]) return {};
    const value = decodeURIComponent(cookieParts[1]);
    return JSON.parse(value);
  } catch (error) {
    console.warn('Failed to parse user interests cookie:', error);
    return {};
  }
}

/**
 * Save user interests to cookie
 */
export function saveUserInterests(interests: UserInterests): void {
  if (typeof document === 'undefined') return;
  
  try {
    const value = JSON.stringify(interests);
    const encodedValue = encodeURIComponent(value);
    
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + COOKIE_EXPIRY_DAYS);
    
    document.cookie = `${COOKIE_NAME}=${encodedValue}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error('Failed to save user interests:', error);
  }
}

/**
 * Track a topic visit - increment count and update timestamps
 */
export function trackTopicVisit(topicName: string, topicCodename: string): void {
  const interests = getUserInterests();
  const now = new Date().toISOString();
  
  if (interests[topicCodename]) {
    // Existing topic - increment count and update last visited
    interests[topicCodename] = {
      ...interests[topicCodename],
      visitCount: interests[topicCodename].visitCount + 1,
      lastVisited: now
    };
  } else {
    // New topic - create initial entry
    interests[topicCodename] = {
      topicName,
      topicCodename,
      visitCount: 1,
      lastVisited: now,
      firstVisited: now
    };
  }
  
  saveUserInterests(interests);
}

/**
 * Track multiple topics from an article visit
 */
export function trackArticleTopics(topics: Array<{ name: string; codename: string }>): void {
  topics.forEach(topic => {
    trackTopicVisit(topic.name, topic.codename);
  });
}

/**
 * Get user's top interests sorted by visit count
 */
export function getTopInterests(limit?: number): TopicInterest[] {
  const interests = getUserInterests();
  const sortedInterests = Object.values(interests)
    .sort((a, b) => b.visitCount - a.visitCount);
    
  return limit ? sortedInterests.slice(0, limit) : sortedInterests;
}

/**
 * Get user's recent interests sorted by last visited date
 */
export function getRecentInterests(limit?: number): TopicInterest[] {
  const interests = getUserInterests();
  const sortedInterests = Object.values(interests)
    .sort((a, b) => new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime());
    
  return limit ? sortedInterests.slice(0, limit) : sortedInterests;
}

/**
 * Get interest level for a specific topic (0-1 scale based on visit count)
 */
export function getTopicInterestLevel(topicCodename: string): number {
  const interests = getUserInterests();
  const maxVisits = Math.max(...Object.values(interests).map(i => i.visitCount), 1);
  const topicInterest = interests[topicCodename];
  
  return topicInterest ? topicInterest.visitCount / maxVisits : 0;
}

/**
 * Check if user has interest in any of the provided topics
 */
export function hasInterestInTopics(topicCodenames: string[]): boolean {
  const interests = getUserInterests();
  return topicCodenames.some(codename => interests[codename]);
}

/**
 * Get total visit count across all topics
 */
export function getTotalVisitCount(): number {
  const interests = getUserInterests();
  return Object.values(interests).reduce((total, interest) => total + interest.visitCount, 0);
}

/**
 * Clear all user interests (for privacy/testing purposes)
 */
export function clearUserInterests(): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Get user's interest profile summary
 */
export function getUserInterestProfile() {
  const interests = getUserInterests();
  const topInterests = getTopInterests(5);
  const recentInterests = getRecentInterests(3);
  const totalVisits = getTotalVisitCount();
  
  return {
    totalTopics: Object.keys(interests).length,
    totalVisits,
    topInterests,
    recentInterests,
    hasInterests: Object.keys(interests).length > 0
  };
}

/**
 * Calculate personalization score for content based on user interests
 * Returns a score between 0 and 1, where 1 means highly relevant to user interests
 */
export function calculatePersonalizationScore(contentTopics: string[]): number {
  if (contentTopics.length === 0) return 0;
  
  const interests = getUserInterests();
  const maxVisits = Math.max(...Object.values(interests).map(i => i.visitCount), 1);
  
  let totalScore = 0;
  let matchingTopics = 0;
  
  contentTopics.forEach(topicCodename => {
    const interest = interests[topicCodename];
    if (interest) {
      totalScore += interest.visitCount / maxVisits;
      matchingTopics++;
    }
  });
  
  // Return average score for matching topics, or 0 if no matches
  return matchingTopics > 0 ? totalScore / matchingTopics : 0;
}

/**
 * Sort items by personalization relevance
 * Higher scores come first
 */
export function sortByPersonalization<T>(
  items: T[], 
  getTopics: (item: T) => string[]
): T[] {
  return items.sort((a, b) => {
    const scoreA = calculatePersonalizationScore(getTopics(a));
    const scoreB = calculatePersonalizationScore(getTopics(b));
    return scoreB - scoreA;
  });
}

/**
 * Filter items that match user interests
 * Optionally specify minimum interest level (0-1)
 */
export function filterByUserInterests<T>(
  items: T[], 
  getTopics: (item: T) => string[],
  minimumScore: number = 0.5
): T[] {
  return items.filter(item => {
    const score = calculatePersonalizationScore(getTopics(item));
    return score >= minimumScore;
  });
}

/**
 * Get personalized recommendations from a list of items
 * Combines filtering and sorting for best results
 */
export function getPersonalizedRecommendations<T>(
  items: T[], 
  getTopics: (item: T) => string[],
  options: {
    minimumScore?: number;
    maxResults?: number;
    includeMixed?: boolean; // Include some non-personalized items for discovery
  } = {}
): T[] {
  const { minimumScore = 0.5, maxResults, includeMixed = true } = options;
  
  // Get personalized items
  const personalizedItems = sortByPersonalization(
    filterByUserInterests(items, getTopics, minimumScore),
    getTopics
  );
  
  if (!includeMixed || personalizedItems.length === 0) {
    return maxResults ? personalizedItems.slice(0, maxResults) : personalizedItems;
  }
  
  // Mix in some non-personalized items for discovery (20% of results)
  const remainingItems = items.filter(item => 
    !personalizedItems.includes(item)
  );
  
  const mixedResults = [...personalizedItems];
  const discoveryCount = Math.ceil(mixedResults.length * 0.2);
  
  // Add random discovery items
  for (let i = 0; i < discoveryCount && remainingItems.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * remainingItems.length);
    const discoveryItem = remainingItems.splice(randomIndex, 1)[0];
    if (discoveryItem) {
      mixedResults.push(discoveryItem);
    }
  }
  
  return maxResults ? mixedResults.slice(0, maxResults) : mixedResults;
}