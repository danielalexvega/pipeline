import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import LandingPage from "./pages/LandingPage.tsx";
import { createBrowserRouter, RouteObject, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BlogPage from "./pages/BlogPage.tsx";
import Layout from "./components/Layout.tsx";
import BlogDetail from "./pages/BlogDetail.tsx";
import ServicesListingPage from "./pages/ServicesListingPage.tsx";
import ServiceDetail from "./pages/ServiceDetail.tsx";
import NotFound from "./components/NotFound.tsx";
import ArticlesListingPage from "./pages/ArticlesListingPage.tsx";
import ArticleDetailPage from "./pages/ArticleDetailPage.tsx";
import OurTeamPage from "./pages/OurTeamPage.tsx";
import PersonDetailPage from "./pages/PersonDetailPage.tsx";
import { ErrorBoundary } from "react-error-boundary";
import Loader from "./components/Loader.tsx";
import Page from "./pages/Page.tsx";
import OurShopPage from "./pages/ShopPage.tsx";
import ProductDetailPage from "./pages/ProductDetailPage.tsx";

const queryClient = new QueryClient();

const BaseRouting: RouteObject[] = [
  {
    path: "",
    Component: LandingPage,
  },
  {
    path: "blog",
    Component: BlogPage,
  },
  {
    path: "blog/:slug",
    Component: BlogDetail,
  },
  {
    path: "services",
    Component: ServicesListingPage,
  },
  {
    path: "services/:slug",
    Component: ServiceDetail,
  },
  {
    path: "articles",
    Component: ArticlesListingPage,
  },
  {
    path: "articles/:slug",
    Component: ArticleDetailPage,
  },
  {
    path: "our-team",
    Component: OurTeamPage,
  },
  {
    path: "our-team/:slug",
    Component: PersonDetailPage,
  },
  {
    path: "shop",
    Component: OurShopPage,
  },
  {
    path: "shop/:slug",
    Component: ProductDetailPage,
  },
  {
    path: ":slug",
    Component: Page,
  },
  {
    path: "*",
    Component: NotFound,
  },
];

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: BaseRouting,
  },
  {
    path: "/envid/:envId",
    element: (
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <div>
            There was an error! <pre>{error.message}</pre>
          </div>
        )}
      >
        <Suspense
          fallback={
            <div className="flex w-screen h-screen justify-center">
              <Loader />
            </div>
          }
        >
          <Layout />
        </Suspense>
      </ErrorBoundary>
    ),
    children: BaseRouting.map(p => ({
      path: `envid/:envId/${p.path}`,
      ...p,
    })),
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
