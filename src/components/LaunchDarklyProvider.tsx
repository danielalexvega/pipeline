import { FC, useEffect } from "react";
import { LDProvider, useLDClient } from "launchdarkly-react-client-sdk";

const LaunchDarklyInit: FC = () => {
  const ldClient = useLDClient();

  useEffect(() => {
    if (ldClient) {
      // Wait for SDK to be ready
      const handleReady = () => {
        // Track an event to confirm connectivity with source "cursor" as specified
        ldClient.track("sdk-initialized", { source: "cursor" });
        
        // Evaluate a flag to ensure SDK is working
        // Using a flag key that can be configured in LaunchDarkly
        const flagValue = ldClient.variation("sdk-check", false);
        if (flagValue) {
          console.log("LaunchDarkly SDK: Flag evaluation successful");
        }
        console.log("LaunchDarkly SDK initialized and tracking event sent");
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
        }
      });

      return () => {
        isCancelled = true;
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

  if (!sdkKey) {
    console.warn("LaunchDarkly SDK key not found. Please set VITE_LAUNCHDARKLY_SDK_KEY environment variable.");
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
      }}
    >
      <LaunchDarklyInit />
      {children}
    </LDProvider>
  );
};

export default LaunchDarklyProviderWrapper;

