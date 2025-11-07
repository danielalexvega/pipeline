import { useLocation, useSearchParams } from "react-router-dom";
import { useState } from "react";
import IconSpain from "../icons/IconSpain";
import IconUnitedStates from "../icons/IconUnitedStates";
import Container from "./Container";
import Logo from "./Logo";
import Navigation from "./Navigation";
import { IconButton } from "../icons/IconButton";
import { useLogin } from "../context/LoginContext";
import { useTheme } from "../context/ThemeContext";
import LoginModal from "./LoginModal";

const Header: React.FC = () => {
  const location = useLocation();
  const isResearchPage = location.pathname.match(/^\/research\/[\w-]+$/);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const lang = searchParams.get("lang");
  const { isLoggedIn, logout } = useLogin();
  const { isDarkMode } = useTheme();

  return (
    <>
      <Container>
        <div className="py-8 flex flex-col gap-8 xl:gap-0 lg:flex-row items-center justify-between bg-darkGreen">
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-12 xl:gap-32 items-center list-none">
            <Logo />
            <Navigation />
          </div>
          <div className="flex items-center gap-4">
            {isResearchPage && (
              <div className="flex gap-2 items-center">
                <IconButton
                  icon={
                    <IconUnitedStates
                      className={`hover:cursor-pointer hover:scale-110`}
                    />
                  }
                  isSelected={lang === "en-US" || lang === null}
                  onClick={() =>
                    setSearchParams(prev => {
                      prev.delete("lang");
                      return prev;
                    })}
                />
                <IconButton
                  icon={
                    <IconSpain
                      className={`hover:cursor-pointer hover:scale-110`}
                    />
                  }
                  isSelected={lang === "es-ES"}
                  onClick={() => {
                    setSearchParams(prev => {
                      prev.set("lang", "es-ES");
                      return prev;
                    });
                  }}
                />
              </div>
            )}
            {isLoggedIn ? (
              <button
                onClick={logout}
                className={`text-base leading-5 text-white w-fit block uppercase font-lexend border-b-[2px] transition-all duration-300 ${
                  isDarkMode ? "border-black hover:border-white" : "border-darkGreen hover:text-mintGreen hover:border-mintGreen"
                }`}
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={`text-base leading-5 text-white w-fit block uppercase font-lexend border-b-[2px] transition-all duration-300 ${
                  isDarkMode ? "border-black hover:border-white" : "border-darkGreen hover:text-mintGreen hover:border-mintGreen"
                }`}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </Container>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};

export default Header;
