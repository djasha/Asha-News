import React from "react";
import { HelmetProvider } from "react-helmet-async";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import BreakingNewsAlert from "./components/BreakingNews/BreakingNewsAlert";
import MobileLayout from "./components/Layout/MobileLayout";
import StoryClusterPage from "./components/StoryCluster/StoryClusterPage";
import SubscriptionDashboard from "./components/Subscription/SubscriptionDashboard";
import ApiTestDashboard from "./components/Testing/ApiTestDashboard";
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
import ArticleDetailPage from "./pages/ArticleDetailPage";
import AuthPage from "./pages/AuthPage";
import BiasMethodologyPage from "./pages/BiasMethodologyPage";
import BlogPage from "./pages/BlogPage";
import CategoryPage from "./pages/CategoryPage";
import Dashboard from "./pages/Dashboard";
import FactCheckerPage from "./pages/FactCheckerPage";
import ForYou from "./pages/ForYou";
import Home from "./pages/Home";
import LegalPage from "./pages/LegalPage";
import PreferencesPage from "./pages/PreferencesPage";
import RSSManagementPage from "./pages/RSSManagementPage";
import SearchPage from "./pages/SearchPage";
import SourcePage from "./pages/SourcePage";
import SourcesPage from "./pages/SourcesPage";
import StaticCMSPage from "./pages/StaticCMSPage";
import StoriesPage from "./pages/StoriesPage";
import TopicPage from "./pages/TopicPage";
import DebugPage from "./pages/DebugPage";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import ProtectedRoute from "./components/Auth/ProtectedRoute";

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
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route
                        path="/article/:id"
                        element={<ArticleDetailPage />}
                      />
                      <Route
                        path="/story/:clusterId"
                        element={<StoryClusterPage />}
                      />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/stories" element={<StoriesPage />} />
                      <Route
                        path="/bias-methodology"
                        element={<BiasMethodologyPage />}
                      />
                      <Route path="/fact-check" element={<FactCheckerPage />} />
                      <Route path="/topic/:slug" element={<TopicPage />} />
                      <Route
                        path="/category/:category"
                        element={<CategoryPage />}
                      />
                      <Route path="/politics" element={<CategoryPage />} />
                      <Route path="/technology" element={<CategoryPage />} />
                      <Route path="/business" element={<CategoryPage />} />
                      <Route path="/environment" element={<CategoryPage />} />
                      <Route path="/health" element={<CategoryPage />} />
                      <Route path="/sports" element={<CategoryPage />} />
                      <Route path="/entertainment" element={<CategoryPage />} />
                      <Route path="/local" element={<CategoryPage />} />
                      <Route path="/auth/signin" element={<AuthPage />} />
                      <Route path="/auth/signup" element={<AuthPage />} />
                      <Route path="/preferences" element={<PreferencesPage />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/for-you" element={<ForYou />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/api-test" element={<ApiTestDashboard />} />
                      <Route path="/debug" element={<DebugPage />} />
                      <Route
                        path="/subscription"
                        element={<SubscriptionDashboard />}
                      />
                      <Route
                        path="/subscribe"
                        element={<SubscriptionDashboard />}
                      />
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
                        <Route path="subscriptions" element={<SubscriptionTiers />} />
                      </Route>
                      <Route path="/sources" element={<SourcesPage />} />
                      <Route path="/source/:sourceName" element={<SourcePage />} />
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
                    </Routes>
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
