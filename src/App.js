import React, { Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";
import BreakingNewsAlert from "./components/BreakingNews/BreakingNewsAlert";
import MobileLayout from "./components/Layout/MobileLayout";
import StoryClusterPage from "./components/StoryCluster/StoryClusterPage";
import SubscriptionDashboard from "./components/Subscription/SubscriptionDashboard";
import { AuthProvider } from "./contexts/AuthContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { SiteConfigProvider } from "./contexts/SiteConfigContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";
import AdminLayout from "./components/Layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SiteSettings from "./pages/admin/SiteSettings";
import UserManagement from "./pages/admin/UserManagement";
import SubscriptionTiers from "./pages/admin/SubscriptionTiers";
import ConflictOpsPage from "./pages/admin/ConflictOpsPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import AuthPage from "./pages/AuthPage";
import DigestPage from "./pages/DigestPage";
import FactCheckerPage from "./pages/FactCheckerPage";
import ConflictMonitorPage from "./pages/ConflictMonitorPage";
import ConflictOpsWikiPage from "./pages/ConflictOpsWikiPage";
import AICheckerWikiPage from "./pages/AICheckerWikiPage";
import MarketsWikiPage from "./pages/MarketsWikiPage";
import AgentApiWikiPage from "./pages/AgentApiWikiPage";
import WikiIndexPage from "./pages/WikiIndexPage";
import HomeV1 from "./pages/HomeV1";
import LegalPage from "./pages/LegalPage";
import MarketsPage from "./pages/MarketsPage";
import PreferencesPage from "./pages/PreferencesPage";
import RSSManagementPage from "./pages/RSSManagementPage";
import StaticCMSPage from "./pages/StaticCMSPage";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { V1_CORE_ONLY } from "./config/v1";

const LegacyHome = lazy(() => import("./pages/Home"));
const LegacySearchPage = lazy(() => import("./pages/SearchPage"));
const LegacyStoriesPage = lazy(() => import("./pages/StoriesPage"));
const LegacyBiasMethodologyPage = lazy(() => import("./pages/BiasMethodologyPage"));
const LegacyTopicPage = lazy(() => import("./pages/TopicPage"));
const LegacyCategoryPage = lazy(() => import("./pages/CategoryPage"));
const LegacyDashboard = lazy(() => import("./pages/Dashboard"));
const LegacyForYou = lazy(() => import("./pages/ForYou"));
const LegacyBlogPage = lazy(() => import("./pages/BlogPage"));
const LegacyApiTestDashboard = lazy(() => import("./components/Testing/ApiTestDashboard"));
const LegacyDebugPage = lazy(() => import("./pages/DebugPage"));
const LegacySourcesPage = lazy(() => import("./pages/SourcesPage"));
const LegacySourcePage = lazy(() => import("./pages/SourcePage"));

const LEGACY_PATH_REDIRECTS = [
  "/legacy/home",
  "/search",
  "/stories",
  "/bias-methodology",
  "/topic/:slug",
  "/category/:category",
  "/politics",
  "/technology",
  "/business",
  "/environment",
  "/health",
  "/sports",
  "/entertainment",
  "/local",
  "/dashboard",
  "/for-you",
  "/blog",
  "/api-test",
  "/debug",
  "/sources",
  "/source/:sourceName",
];

const legacyLoadingFallback = (
  <div className="min-h-[40vh] flex items-center justify-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
    Loading page...
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <PreferencesProvider>
              <SiteConfigProvider>
                <Router>
                  <BreakingNewsAlert />
                  <MobileLayout>
                    <Suspense fallback={legacyLoadingFallback}>
                      <Routes>
                        <Route path="/" element={<HomeV1 />} />
                        <Route path="/ai-checker" element={<FactCheckerPage />} />
                        <Route path="/fact-check" element={<FactCheckerPage />} />
                        <Route path="/markets" element={<MarketsPage />} />
                        <Route path="/digest" element={<DigestPage />} />
                        <Route path="/conflicts" element={<ConflictMonitorPage />} />
                        <Route path="/wiki" element={<WikiIndexPage />} />
                        <Route path="/wiki/conflict-ops" element={<ConflictOpsWikiPage />} />
                        <Route path="/wiki/ai-checker" element={<AICheckerWikiPage />} />
                        <Route path="/wiki/markets" element={<MarketsWikiPage />} />
                        <Route path="/wiki/agent-api" element={<AgentApiWikiPage />} />
                        <Route path="/article/:id" element={<ArticleDetailPage />} />
                        <Route path="/story/:clusterId" element={<StoryClusterPage />} />

                        <Route path="/auth/signin" element={<AuthPage />} />
                        <Route path="/auth/signup" element={<AuthPage />} />
                        <Route path="/preferences" element={<PreferencesPage />} />
                        <Route path="/subscription" element={<SubscriptionDashboard />} />
                        <Route path="/subscribe" element={<SubscriptionDashboard />} />

                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute allowedRoles={['admin']}>
                              <AdminLayout />
                            </ProtectedRoute>
                          }
                        >
                          <Route index element={<AdminDashboard />} />
                          <Route path="dashboard" element={<AdminDashboard />} />
                          <Route path="settings" element={<SiteSettings />} />
                          <Route path="users" element={<UserManagement />} />
                          <Route path="rss" element={<RSSManagementPage />} />
                          <Route path="conflicts" element={<ConflictOpsPage />} />
                          <Route path="subscriptions" element={<SubscriptionTiers />} />
                        </Route>

                        {V1_CORE_ONLY ? (
                          LEGACY_PATH_REDIRECTS.map((path) => (
                            <Route key={path} path={path} element={<Navigate to="/" replace />} />
                          ))
                        ) : (
                          <>
                            <Route path="/legacy/home" element={<LegacyHome />} />
                            <Route path="/search" element={<LegacySearchPage />} />
                            <Route path="/stories" element={<LegacyStoriesPage />} />
                            <Route path="/bias-methodology" element={<LegacyBiasMethodologyPage />} />
                            <Route path="/topic/:slug" element={<LegacyTopicPage />} />
                            <Route path="/category/:category" element={<LegacyCategoryPage />} />
                            <Route path="/politics" element={<LegacyCategoryPage />} />
                            <Route path="/technology" element={<LegacyCategoryPage />} />
                            <Route path="/business" element={<LegacyCategoryPage />} />
                            <Route path="/environment" element={<LegacyCategoryPage />} />
                            <Route path="/health" element={<LegacyCategoryPage />} />
                            <Route path="/sports" element={<LegacyCategoryPage />} />
                            <Route path="/entertainment" element={<LegacyCategoryPage />} />
                            <Route path="/local" element={<LegacyCategoryPage />} />
                            <Route path="/dashboard" element={<LegacyDashboard />} />
                            <Route path="/for-you" element={<LegacyForYou />} />
                            <Route path="/blog" element={<LegacyBlogPage />} />
                            <Route path="/api-test" element={<LegacyApiTestDashboard />} />
                            <Route path="/debug" element={<LegacyDebugPage />} />
                            <Route path="/sources" element={<LegacySourcesPage />} />
                            <Route path="/source/:sourceName" element={<LegacySourcePage />} />
                          </>
                        )}

                        <Route
                          path="/about"
                          element={
                            <StaticCMSPage
                              slug="about"
                              title="About"
                              fallback="About page coming soon..."
                            />
                          }
                        />
                        <Route
                          path="/features"
                          element={
                            <StaticCMSPage
                              slug="features"
                              title="Features"
                              fallback="Features page coming soon..."
                            />
                          }
                        />
                        <Route
                          path="/contact"
                          element={
                            <StaticCMSPage
                              slug="contact"
                              title="Contact"
                              fallback="Contact page coming soon..."
                            />
                          }
                        />
                        <Route
                          path="/careers"
                          element={
                            <div className="min-h-screen bg-background-light dark:bg-background-dark">
                              <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                                <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                                  Careers
                                </h1>
                                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                                  Careers page coming soon...
                                </p>
                              </div>
                            </div>
                          }
                        />
                        <Route
                          path="/api"
                          element={
                            <StaticCMSPage
                              slug="api"
                              title="API"
                              fallback="API docs coming soon..."
                            />
                          }
                        />
                        <Route
                          path="/rss"
                          element={
                            <div className="min-h-screen bg-background-light dark:bg-background-dark">
                              <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                                <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                                  RSS Feed
                                </h1>
                                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                                  Subscribe to our RSS feed at{" "}
                                  <a className="text-primary-600 hover:underline" href="/rss.xml">
                                    /rss.xml
                                  </a>
                                </p>
                              </div>
                            </div>
                          }
                        />
                        <Route
                          path="/privacy"
                          element={
                            <LegalPage
                              slug="privacy-policy"
                              title="Privacy Policy"
                              fallback="Privacy Policy coming soon..."
                            />
                          }
                        />
                        <Route
                          path="/terms"
                          element={
                            <LegalPage
                              slug="terms-of-service"
                              title="Terms of Service"
                              fallback="Terms of Service coming soon..."
                            />
                          }
                        />
                        <Route
                          path="/cookies"
                          element={
                            <LegalPage
                              slug="cookie-policy"
                              title="Cookie Policy"
                              fallback="Cookie Policy coming soon..."
                            />
                          }
                        />
                        <Route
                          path="/gdpr"
                          element={
                            <LegalPage
                              slug="gdpr"
                              title="GDPR"
                              fallback="GDPR page coming soon..."
                            />
                          }
                        />
                        <Route path="/page/:slug" element={<StaticCMSPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </MobileLayout>
                </Router>
              </SiteConfigProvider>
            </PreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
