import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import MobileLayout from './components/Layout/MobileLayout';
import Home from './pages/Home';
import ArticleDetailPage from './pages/ArticleDetailPage';
import SearchPage from './pages/SearchPage';
import StoriesPage from './pages/StoriesPage';
import BiasMethodologyPage from './pages/BiasMethodologyPage';
import TopicPage from './pages/TopicPage';
import AuthPage from './pages/AuthPage';
import PreferencesPage from './pages/PreferencesPage';
import ApiTestDashboard from './components/Testing/ApiTestDashboard';
import './index.css';

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <PreferencesProvider>
          <Router>
            <MobileLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/article/:id" element={<ArticleDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/stories" element={<StoriesPage />} />
                <Route path="/bias-methodology" element={<BiasMethodologyPage />} />
                <Route path="/topic/:slug" element={<TopicPage />} />
                <Route path="/auth/signin" element={<AuthPage />} />
                <Route path="/auth/signup" element={<AuthPage />} />
                <Route path="/preferences" element={<PreferencesPage />} />
                <Route path="/api-test" element={<ApiTestDashboard />} />
                <Route path="/sources" element={<div className="text-center py-20 text-text-primary-light dark:text-text-primary-dark">Sources page coming soon...</div>} />
                <Route path="/blindspots" element={<div className="text-center py-20 text-text-primary-light dark:text-text-primary-dark">Blindspots page coming soon...</div>} />
                <Route path="/about" element={<div className="text-center py-20 text-text-primary-light dark:text-text-primary-dark">About page coming soon...</div>} />
              </Routes>
            </MobileLayout>
          </Router>
        </PreferencesProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
