import { createContext, useContext, useEffect, FC, PropsWithChildren } from "react";
import { useLDClient } from "launchdarkly-react-client-sdk";
import { useLogin } from "./LoginContext";

type LaunchDarklyUserContextType = {
  // This context handles LaunchDarkly user identification automatically
  // No need to expose methods, it syncs with LoginContext
};

const LaunchDarklyUserContext = createContext<LaunchDarklyUserContextType | undefined>(undefined);

export const LaunchDarklyUserProvider: FC<PropsWithChildren> = ({ children }) => {
  const ldClient = useLDClient();
  const { isLoggedIn, username } = useLogin();

  // Update LaunchDarkly user context when login state or username changes
  useEffect(() => {
    if (!ldClient) return;

    if (isLoggedIn && username) {
      // Create user context with the logged-in user
      const userContext = {
        kind: "user",
        key: username.toLowerCase(), // Use lowercase username as key for consistency
        name: username,
        loggedIn: true,
        attributes: {
          loggedIn: true,
        },
      };

      ldClient.identify(userContext).then(() => {
        console.log(`✅ LaunchDarkly user context updated for: ${username}`);
      }).catch((error) => {
        console.error("Error updating LaunchDarkly user context:", error);
      });
    } else {
      // Reset to anonymous user when logged out
      const anonymousContext = {
        kind: "user",
        key: "anonymous-user",
        anonymous: true,
        loggedIn: false,
        attributes: {
          loggedIn: false,
        },
      };

      ldClient.identify(anonymousContext).then(() => {
        console.log("LaunchDarkly user context reset to anonymous");
      }).catch((error) => {
        console.error("Error resetting LaunchDarkly user context:", error);
      });
    }
  }, [ldClient, isLoggedIn, username]);

  return (
    <LaunchDarklyUserContext.Provider value={{}}>
      {children}
    </LaunchDarklyUserContext.Provider>
  );
};

// Hook to access LaunchDarkly user context (if needed in the future)
export const useLaunchDarklyUser = () => {
  const context = useContext(LaunchDarklyUserContext);
  if (context === undefined) {
    throw new Error("useLaunchDarklyUser must be used within a LaunchDarklyUserProvider");
  }
  return context;
};

