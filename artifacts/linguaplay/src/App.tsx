import { useEffect, useRef } from "react";
import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, useAuth, useClerk } from "@clerk/react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { getClerkAppearance, clerkLocalization } from "@/lib/clerk-appearance";

import Learn from "@/pages/learn";
import Courses from "@/pages/courses";
import Leaderboard from "@/pages/leaderboard";
import Achievements from "@/pages/achievements";
import Shop from "@/pages/shop";
import Profile from "@/pages/profile";
import Goal from "@/pages/goal";
import Lesson from "@/pages/lesson";
import LessonComplete from "@/pages/lesson-complete";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AuthLoading />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <>{children}</>;
}

function HomeGate() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AuthLoading />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return (
    <Layout>
      <Learn />
    </Layout>
  );
}

function WelcomeGate() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AuthLoading />;
  if (isSignedIn) return <Redirect to="/" />;
  return <Landing />;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/welcome" component={WelcomeGate} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      <Route path="/lesson/:lessonId">
        {() => (
          <Protected>
            <Lesson />
          </Protected>
        )}
      </Route>
      <Route path="/lesson/:lessonId/complete">
        {() => (
          <Protected>
            <LessonComplete />
          </Protected>
        )}
      </Route>

      <Route path="/" component={HomeGate} />
      <Route path="/courses">
        {() => (
          <Protected>
            <Layout>
              <Courses />
            </Layout>
          </Protected>
        )}
      </Route>
      <Route path="/leaderboard">
        {() => (
          <Protected>
            <Layout>
              <Leaderboard />
            </Layout>
          </Protected>
        )}
      </Route>
      <Route path="/achievements">
        {() => (
          <Protected>
            <Layout>
              <Achievements />
            </Layout>
          </Protected>
        )}
      </Route>
      <Route path="/shop">
        {() => (
          <Protected>
            <Layout>
              <Shop />
            </Layout>
          </Protected>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <Protected>
            <Layout>
              <Profile />
            </Layout>
          </Protected>
        )}
      </Route>
      <Route path="/goal">
        {() => (
          <Protected>
            <Layout>
              <Goal />
            </Layout>
          </Protected>
        )}
      </Route>

      <Route>
        {() => (
          <Layout>
            <NotFound />
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={getClerkAppearance(theme)}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/`}
      signUpFallbackRedirectUrl={`${basePath}/`}
      localization={clerkLocalization}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
