
# Pipeline Music Personalization Demo

This repository contains the source for **Pipeline**, a music discovery experience powered by [Kontent.ai](https://kontent.ai/) and feature-flagged with [LaunchDarkly](https://launchdarkly.com/). The application is built with [React + Vite](https://vitejs.dev/), styled with Tailwind, and demonstrates cookie-based personalization, LaunchDarkly AI Configs, and OpenAI recommendations.

## Highlights

- **Kontent.ai CMS**  
  - Content models for articles, featured content, and personalization demos live in Kontent.ai.  
  - Types are generated via the Kontent.ai Model Generator for strong typing in the app.

- **LaunchDarkly Integration**  
  - Feature flags gate personalization UI (e.g., `personalization-debugger`) and AI-powered music recommendations.  
  - AI Configs fetch prompt templates and desired OpenAI models at runtime.  
  - Article page tracks `article-views` events (using the LaunchDarkly context persisted in a cookie).

- **Personalization + Cookies**  
  - Browsing articles stores topic interests in a cookie (`user_topic_interests`).  
  - The Personal Taste page surfaces personalized recommendations and AI-generated music suggestions.  
  - A LaunchDarkly-controlled debug panel provides visibility into the personalization profile.

- **AI Music Recommendations**  
  - Frontend calls a backend route (Express demo) that reads the personalization cookie, fetches the LaunchDarkly AI Config, and then calls OpenAI to generate recommendations.

## Getting Started

1. **Install dependencies**
   ```bash
   npm ci
   ```

2. **Environment variables**  
   Copy `.env.template` to `.env` and fill in:
   - `VITE_LAUNCHDARKLY_SDK_KEY` (client-side ID)
   - `VITE_ENVIRONMENT_ID`, `VITE_MANAGEMENT_API_KEY` (for Kontent.ai model generation)
   - `VITE_RECOMMENDATION_ENDPOINT` pointing to your recommendation backend

3. **Run the app**
   ```bash
   npm run dev
   ```

4. **Recommended extras**
   ```bash
   npm run model:generate   # refresh TypeScript models after changing content types
   npm run model:import     # optional: restore demo content from /scripts/backups
   ```

### Required Environment Variables

All variables are loaded by Vite (prefix with `VITE_`). Typical setup:

| Variable | Description |
| --- | --- |
| `VITE_LAUNCHDARKLY_SDK_KEY` | LaunchDarkly client-side ID (environment-specific) |
| `VITE_ENVIRONMENT_ID` | Kontent.ai environment ID (for model generation) |
| `VITE_MANAGEMENT_API_KEY` | Kontent.ai management API key (model generation) |
| `VITE_RECOMMENDATION_ENDPOINT` | URL of the recommendation backend (`/api/recommend` equivalent) |
| `VITE_KONTENT_DELIVERY_API_KEY` (optional) | Only if your Kontent.ai delivery API requires an API key |

## LaunchDarkly Context

- Frontend stores the LaunchDarkly user context in `ldcontext` cookie when requesting recommendations.  
- Article detail pages read the cookie, re-identify the user in LaunchDarkly, and track an `article-views` event.

## Personalization Data

- Interests are stored locally in `user_topic_interests`.  
- The Personalization Debug widget (flagged by `personalization-debugger`) displays profile stats, raw cookie data, and offers a “Clear” action.

## License

This project is licensed under the MIT License – see [LICENSE](LICENSE).

---

For help or questions, reach out via [Kontent.ai Support](https://kontent.ai/support/).

