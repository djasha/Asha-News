import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import MobileLayout from './components/Layout/MobileLayout';
import Home from './pages/Home';
import ArticleDetailPage from './pages/ArticleDetailPage';
import SearchPage from './pages/SearchPage';
import BiasMethodologyPage from './pages/BiasMethodologyPage';
import './index.css';

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router>
          <MobileLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/article/:id" element={<ArticleDetailPage />} />
              <Route path="/bias-methodology" element={<BiasMethodologyPage />} />
              <Route path="/sources" element={<div className="text-center py-20 text-text-primary-light dark:text-text-primary-dark">Sources page coming soon...</div>} />
              <Route path="/blindspots" element={<div className="text-center py-20 text-text-primary-light dark:text-text-primary-dark">Blindspots page coming soon...</div>} />
              <Route path="/about" element={<div className="text-center py-20 text-text-primary-light dark:text-text-primary-dark">About page coming soon...</div>} />
            </Routes>
          </MobileLayout>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
