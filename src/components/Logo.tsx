import { FC, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const Logo: FC = () => {
  const { isDarkMode } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Reset error state when dark mode changes
  useEffect(() => {
    setImageError(false);
  }, [isDarkMode]);

  // Determine which logo to use
  const logoSrc = isDarkMode && !imageError 
    ? "/pipeline-logo-dark.png" 
    : "/pipeline-logo3.png";

  const handleImageError = () => {
    // If dark logo fails to load, fallback to default logo
    if (isDarkMode && !imageError) {
      setImageError(true);
    }
  };

  return (
    <Link to="/?preview=true">
      <div className="flex gap-4 items-center">
        <img 
          src={logoSrc}
          alt="Pipeline Logo"
          width="200"
          height="200"
          className="object-contain"
          onError={handleImageError}
        />
      </div>
    </Link>
  );
};

export default Logo;