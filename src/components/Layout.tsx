import { FC, PropsWithChildren } from "react";
import Footer from "./Footer";
import Header from "./Header";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { SmartLinkContextComponent } from "../context/SmartLinkContext";
import { AppContextComponent } from "../context/AppContext";
import { ThemeProvider } from "../context/ThemeContext";
import { LoginProvider } from "../context/LoginContext";
import { LaunchDarklyUserProvider } from "../context/LaunchDarklyUserContext";
import PersonalizationDebug from "./PersonalizationDebug";
import DarkModeToggle from "./DarkModeToggle";

const Layout: FC<PropsWithChildren> = () => (
  <ThemeProvider>
    <LoginProvider>
      <LaunchDarklyUserProvider>
        <AppContextComponent>
          <SmartLinkContextComponent>
            <div className="flex flex-col min-h-screen bg-darkGreen">
              <ScrollRestoration getKey={location => location.pathname} />
              <Header />
              <DarkModeToggle />
              <Outlet />
              <Footer />
              <PersonalizationDebug />
            </div>
          </SmartLinkContextComponent>
        </AppContextComponent>
      </LaunchDarklyUserProvider>
    </LoginProvider>
  </ThemeProvider>
);

export default Layout;
