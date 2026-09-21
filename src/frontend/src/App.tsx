import { LoadingState } from "@/components/ui-bits";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider, useTranslation } from "@/lib/i18n";
import { AccountPage } from "@/pages/AccountPage";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { AdminPage } from "@/pages/AdminPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RecordsPage } from "@/pages/RecordsPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ServicePage } from "@/pages/ServicePage";
import { StartPage } from "@/pages/StartPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";

function RootLayout() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </I18nProvider>
  );
}

function FullScreenLoading() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <LoadingState label={t("common.loading")} />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      void navigate({ to: "/login", replace: true });
    }
  }, [isReady, isAuthenticated, navigate]);

  if (!isReady) return <FullScreenLoading />;
  if (!isAuthenticated) return <FullScreenLoading />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login", replace: true });
    } else if (!isAdmin) {
      void navigate({ to: "/", replace: true });
    }
  }, [isReady, isAuthenticated, isAdmin, navigate]);

  if (!isReady || !isAuthenticated || !isAdmin) return <FullScreenLoading />;
  return <>{children}</>;
}

const rootRoute = createRootRoute({ component: RootLayout });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLoginPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <RequireAuth>
      <HomePage />
    </RequireAuth>
  ),
});

const recordsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/records",
  component: () => (
    <RequireAuth>
      <RecordsPage />
    </RequireAuth>
  ),
});

const startRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/start",
  component: () => (
    <RequireAuth>
      <StartPage />
    </RequireAuth>
  ),
});

const serviceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/service",
  component: () => (
    <RequireAuth>
      <ServicePage />
    </RequireAuth>
  ),
});

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/account",
  component: () => (
    <RequireAuth>
      <AccountPage />
    </RequireAuth>
  ),
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <RequireAdmin>
      <AdminPage />
    </RequireAdmin>
  ),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  adminLoginRoute,
  homeRoute,
  recordsRoute,
  startRoute,
  serviceRoute,
  accountRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
