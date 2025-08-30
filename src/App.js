import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navigation from './components/Navigation/Navigation';
import Home from './pages/Home';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-200">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sources" element={<div className="text-center py-20 text-text-primary-light dark:text-text-primary-dark">Sources page coming soon...</div>} />
              <Route path="/blindspots" element={<div className="text-center py-20 text-text-primary-light dark:text-text-primary-dark">Blindspots page coming soon...</div>} />
              <Route path="/about" element={<div className="text-center py-20 text-text-primary-light dark:text-text-primary-dark">About page coming soon...</div>} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
