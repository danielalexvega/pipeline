import { createContext, useContext, useEffect, useState, FC, PropsWithChildren } from "react";

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isDarkModeAllowed: boolean;
  setDarkModeAllowed: (allowed: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "pipeline-theme-preference";

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isDarkModeAllowed, setIsDarkModeAllowed] = useState<boolean>(true);
  
  // Initialize from localStorage or default to false
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved !== null) {
        return saved === "dark";
      }
      // Optionally check system preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Force light mode when dark mode is not allowed
  useEffect(() => {
    if (!isDarkModeAllowed && isDarkMode) {
      setIsDarkMode(false);
    }
  }, [isDarkModeAllowed, isDarkMode]);

  useEffect(() => {
    // Apply dark mode class to document element
    // Only apply dark mode if it's both enabled AND allowed
    const shouldBeDark = isDarkMode && isDarkModeAllowed;
    if (shouldBeDark) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
    // Save preference to localStorage only if dark mode is allowed
    if (isDarkModeAllowed) {
      localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, "light");
    }
  }, [isDarkMode, isDarkModeAllowed]);

  const toggleDarkMode = () => {
    if (isDarkModeAllowed) {
      setIsDarkMode((prev) => !prev);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, isDarkModeAllowed, setDarkModeAllowed: setIsDarkModeAllowed }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

