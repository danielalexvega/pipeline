import { FC, useEffect } from "react";
import { LDProvider, useLDClient } from "launchdarkly-react-client-sdk";

const LaunchDarklyInit: FC = () => {
  const ldClient = useLDClient();

  useEffect(() => {
    if (ldClient) {
      // Listen for errors
      const handleError = (error: any) => {
        console.error("LaunchDarkly SDK error:", error);
        if (error?.status === 401) {
          console.error(
            "🚨 LaunchDarkly 401 Error: Authentication failed.\n" +
            "This usually means:\n" +
            "1. Your SDK key is incorrect or missing\n" +
            "2. You're using a Server-side SDK key instead of Client-side ID\n" +
            "3. The SDK key doesn't match your environment\n" +
            "\n" +
            "To fix this:\n" +
            "1. Go to LaunchDarkly Dashboard → Account Settings → Projects → Your Project → Environments\n" +
            "2. Copy the 'Client-side ID' (NOT the Server-side SDK key)\n" +
            "3. Set it in your .env file as: VITE_LAUNCHDARKLY_SDK_KEY=your-client-side-id\n" +
            "4. Restart your dev server"
          );
        }
      };

      // Listen for flag changes
      const handleChange = () => {
        console.log("LaunchDarkly flags updated");
      };

      ldClient.on("error", handleError);
      ldClient.on("change", handleChange);

      // Wait for SDK to be ready
      const handleReady = () => {
        console.log("✅ LaunchDarkly SDK initialized successfully");
        // Track an event to confirm connectivity with source "cursor" as specified
        ldClient.track("sdk-initialized", { source: "cursor" });
        
        // Evaluate a flag to ensure SDK is working
        // Using a flag key that can be configured in LaunchDarkly
        const flagValue = ldClient.variation("sdk-check", false);
        if (flagValue) {
          console.log("LaunchDarkly SDK: Flag evaluation successful");
        }
      };

      // Use waitUntilReady() which resolves immediately if already ready
      let isCancelled = false;
      ldClient.waitUntilReady().then(() => {
        if (!isCancelled) {
          handleReady();
        }
      }).catch((error) => {
        if (!isCancelled) {
          console.error("LaunchDarkly SDK initialization error:", error);
          handleError(error);
        }
      });

      return () => {
        isCancelled = true;
        ldClient.off("error", handleError);
        ldClient.off("change", handleChange);
      };
    }
  }, [ldClient]);

  return null;
};

type LaunchDarklyProviderProps = {
  children: React.ReactNode;
};

const LaunchDarklyProviderWrapper: FC<LaunchDarklyProviderProps> = ({ children }) => {
  const sdkKey = import.meta.env.VITE_LAUNCHDARKLY_SDK_KEY;

  // Validate SDK key format
  useEffect(() => {
    if (sdkKey) {
      // Client-side IDs typically start with specific patterns
      // Log first 10 chars for debugging (not the full key for security)
      console.log("LaunchDarkly SDK Key loaded:", sdkKey.substring(0, 10) + "...");
      
      // Warn if it looks like a server-side key (starts with "sdk-")
      if (sdkKey.startsWith("sdk-")) {
        console.warn(
          "⚠️ Warning: Your SDK key starts with 'sdk-' which suggests it might be a Server-side SDK key.\n" +
          "For React apps, you need the Client-side ID instead.\n" +
          "Get it from: LaunchDarkly Dashboard → Account Settings → Projects → Your Project → Environments → Client-side ID"
        );
      }
    }
  }, [sdkKey]);

  if (!sdkKey) {
    console.warn(
      "⚠️ LaunchDarkly SDK key not found.\n" +
      "Please set VITE_LAUNCHDARKLY_SDK_KEY environment variable.\n" +
      "Get your Client-side ID from: LaunchDarkly Dashboard → Account Settings → Projects → Your Project → Environments"
    );
    return <>{children}</>;
  }

  // Create a user context for LaunchDarkly
  const userContext = {
    kind: "user",
    key: "anonymous-user",
    anonymous: true,
  };

  return (
    <LDProvider
      clientSideID={sdkKey}
      context={userContext}
      options={{
        bootstrap: "localStorage",
        // Streaming is enabled by default for client-side SDK
        // This allows real-time flag updates when flags change in LaunchDarkly
      }}
    >
      <LaunchDarklyInit />
      {children}
    </LDProvider>
  );
};

export default LaunchDarklyProviderWrapper;

