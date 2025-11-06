import { FC, useEffect } from "react";
import { useFlags, useLDClient } from "launchdarkly-react-client-sdk";
import { useTheme } from "../context/ThemeContext";
import IconSun from "../icons/IconSun";
import IconMoon from "../icons/IconMoon";

const DarkModeToggle: FC = () => {
  const flags = useFlags();
  const ldClient = useLDClient();
  const { isDarkMode, toggleDarkMode, setDarkModeAllowed } = useTheme();

  // Check if dark mode feature flag is enabled
  // When enabled, users can choose between light and dark mode
  // Default to false if flag doesn't exist
  const isDarkModeEnabled = flags["darkMode"] ?? false;

  // Update ThemeContext when flag changes
  useEffect(() => {
    setDarkModeAllowed(isDarkModeEnabled);
  }, [isDarkModeEnabled, setDarkModeAllowed]);

  // Debug: Log flags and flag value
  useEffect(() => {
    console.log("LaunchDarkly flags:", flags);
    console.log("darkMode flag value:", isDarkModeEnabled);
    
    // Also check via direct variation call
    if (ldClient) {
      const directValue = ldClient.variation("darkMode", false);
      console.log("Direct variation call result:", directValue);
    }
  }, [flags, isDarkModeEnabled, ldClient]);

  // Don't render if flag is disabled - user cannot choose when flag is off
  if (!isDarkModeEnabled) {
    return null;
  }

  // When flag is enabled, always show the toggle button
  // Users can click to switch between light and dark modes
  return (
    <button
      onClick={toggleDarkMode}
      className={`fixed top-4 right-4 z-50 p-3 rounded-full backdrop-blur-sm border transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-azure focus:ring-offset-2 shadow-lg pb-[6px] ${
        isDarkMode
          ? "bg-white/10 border-white/30 hover:bg-white/20"
          : "bg-darkGreen border-white/20 hover:bg-darkGreen "
      }`}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <IconSun className="text-white" size="24" />
      ) : (
        <IconMoon className="text-white color-white" size="24" />
      )}
    </button>
  );
};

export default DarkModeToggle;

