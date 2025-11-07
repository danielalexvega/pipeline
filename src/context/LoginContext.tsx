import { createContext, useContext, useEffect, useState, FC, PropsWithChildren } from "react";

type LoginContextType = {
  isLoggedIn: boolean;
  username: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const LoginContext = createContext<LoginContextType | undefined>(undefined);

const LOGIN_STORAGE_KEY = "pipeline-login-state";
const USERNAME_STORAGE_KEY = "pipeline-username";
const ALLOWED_USERNAMES = ["daniel", "glynn", "maarten", "mark"];

export const LoginProvider: FC<PropsWithChildren> = ({ children }) => {
  // Initialize from localStorage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOGIN_STORAGE_KEY);
      return saved === "true";
    }
    return false;
  });

  const [username, setUsername] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(USERNAME_STORAGE_KEY);
    }
    return null;
  });

  // Save login state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOGIN_STORAGE_KEY, isLoggedIn ? "true" : "false");
    if (username) {
      localStorage.setItem(USERNAME_STORAGE_KEY, username);
    } else {
      localStorage.removeItem(USERNAME_STORAGE_KEY);
    }
  }, [isLoggedIn, username]);

  const login = (usernameInput: string): boolean => {
    // Check if username is in the allowed list (case-sensitive)
    // Password is ignored (can be blank)
    const trimmedUsername = usernameInput.trim();
    if (ALLOWED_USERNAMES.includes(trimmedUsername)) {
      setIsLoggedIn(true);
      setUsername(trimmedUsername);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUsername(null);
  };

  return (
    <LoginContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </LoginContext.Provider>
  );
};

export const useLogin = () => {
  const context = useContext(LoginContext);
  if (context === undefined) {
    throw new Error("useLogin must be used within a LoginProvider");
  }
  return context;
};

