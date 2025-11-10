import { FC, useCallback, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLogin } from "../context/LoginContext";
import { getUserInterests } from "../utils/personalization";

type RecommendationResponse = {
  recommendation: string;
  prompt?: string;
};

type MusicRecommendationProps = {
  endpoint?: string;
  className?: string;
};

const DEFAULT_ENDPOINT = import.meta.env.VITE_RECOMMENDATION_ENDPOINT ?? "/api/recommend";

const MusicRecommendation: FC<MusicRecommendationProps> = ({
  endpoint = DEFAULT_ENDPOINT,
  className = "",
}) => {
  const { isLoggedIn, username } = useLogin();
  const { isDarkMode } = useTheme();

  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [promptUsed, setPromptUsed] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const interests = useMemo(() => getUserInterests(), []);
  const genres = useMemo(
    () =>
      Object.values(interests)
        .map(interest => interest.topicName || interest.topicCodename || "")
        .filter(Boolean),
    [interests],
  );

  const handleFetchRecommendation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);
    setPromptUsed(undefined);

    try {
      const ldContext = {
        kind: "user",
        key: (username ?? "anonymous-user").toLowerCase(),
        name: username ?? undefined,
        attributes: {
          loggedIn: isLoggedIn,
          genres,
        },
      };

      // Persist the LaunchDarkly context in a cookie for debugging/inspection
      try {
        document.cookie = `ldcontext=${encodeURIComponent(JSON.stringify(ldContext))}; path=/; SameSite=Lax`;
      } catch (cookieError) {
        console.warn("Failed to persist LaunchDarkly context cookie:", cookieError);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          genres,
          interests,
          ldContext,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as RecommendationResponse;
      let recommendationText = "No recommendation available.";
      if (typeof data.recommendation === "string") {
        recommendationText = data.recommendation;
      } else if (data.recommendation) {
        recommendationText = JSON.stringify(data.recommendation, null, 2);
      }
      setRecommendation(recommendationText);
      if (typeof data.prompt === "string") {
        setPromptUsed(data.prompt);
      } else if (data.prompt) {
        setPromptUsed(JSON.stringify(data.prompt, null, 2));
      } else {
        setPromptUsed(undefined);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, genres, interests, isLoggedIn, username]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-4 border rounded-xl p-6 shadow-sm ${
        isDarkMode ? "bg-black border-white/30 text-white" : "bg-white border-black/10 text-darkGreen"
      } ${className}`}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">AI Music Recommendations</h2>
        <p className="text-sm opacity-80">
          Discover new music based on the articles you have read.
        </p>
      </div>

      {genres.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide opacity-80">
          {genres.map(genre => (
            <span
              key={genre}
              className={`px-3 py-1 rounded-full border ${
                isDarkMode ? "border-white/40" : "border-darkGreen/30"
              }`}
            >
              {genre}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm italic opacity-70">Read a few articles to build your profile.</p>
      )}

      <button
        onClick={handleFetchRecommendation}
        disabled={isLoading || genres.length === 0}
        className={`self-start px-6 py-3 rounded-full font-medium transition-all duration-200 ${
          isDarkMode
            ? "bg-white text-darkGreen hover:bg-grey-light disabled:bg-white/40 disabled:text-darkGreen/60"
            : "bg-darkGreen text-white hover:bg-grey-dark disabled:bg-darkGreen/40 disabled:text-white/60"
        }`}
      >
        {isLoading ? "Finding tunes..." : "Get Recommendation"}
      </button>

      {error && (
        <div
          className={`text-sm border rounded-md p-3 ${
            isDarkMode ? "border-red-500 text-red-300" : "border-red-200 text-red-600"
          }`}
        >
          {error}
        </div>
      )}

      {recommendation && (
        <div
          className={`border rounded-lg p-4 text-sm leading-relaxed ${
            isDarkMode ? "border-white/30 bg-white/5" : "border-darkGreen/20 bg-darkGreen/5"
          }`}
        >
          <p className="font-semibold mb-2">Your AI Recommendation</p>
          <pre className="whitespace-pre-wrap break-words text-sm">
            {recommendation}
          </pre>
          {promptUsed && (
            <details className="mt-3 text-xs opacity-70">
              <summary>Prompt used</summary>
              <pre className="mt-1 whitespace-pre-wrap break-words">{promptUsed}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default MusicRecommendation;

