import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MobileFooter = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const footerSections = [
    {
      id: 'company',
      title: 'Company',
      items: [
        { label: 'About Us', path: '/about' },
        { label: 'How We Analyze', path: '/bias-methodology' },
        { label: 'Contact', path: '/contact' },
        { label: 'Careers', path: '/careers' }
      ]
    },
    {
      id: 'product',
      title: 'Product',
      items: [
        { label: 'Features', path: '/features' },
        { label: 'Sources', path: '/sources' },
        { label: 'Fact Checker', path: '/fact-check' },
        { label: 'API', path: '/api' }
      ]
    },
    {
      id: 'legal',
      title: 'Legal',
      items: [
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Terms of Service', path: '/terms' },
        { label: 'Cookie Policy', path: '/cookies' },
        { label: 'GDPR', path: '/gdpr' }
      ]
    }
  ];

  return (
    <footer className="lg:hidden bg-surface-elevated-light dark:bg-surface-elevated-dark border-t border-primary-200/20 dark:border-primary-700/20 mt-auto">
      {/* Quick Actions */}
      <div className="px-4 py-6 border-b border-primary-200/10 dark:border-primary-700/10">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/search')}
            className="flex items-center justify-center gap-2 p-4 bg-primary-600 dark:bg-primary-500 text-white rounded-mobile hover:bg-primary-700 dark:hover:bg-primary-600 active:bg-primary-800 dark:active:bg-primary-700 transition-colors touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="font-medium">Search</span>
          </button>
          
          <button
            onClick={() => navigate('/fact-check')}
            className="flex items-center justify-center gap-2 p-4 bg-surface-light dark:bg-surface-dark border border-primary-200 dark:border-primary-700 text-text-primary-light dark:text-text-primary-dark rounded-mobile hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark active:bg-interactive-active-light dark:active:bg-interactive-active-dark transition-colors touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-medium">Fact Checker</span>
          </button>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="px-4 py-2">
        {footerSections.map((section) => (
          <div key={section.id} className="border-b border-primary-200/10 dark:border-primary-700/10 last:border-b-0">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between py-4 text-left touch-manipulation"
              aria-expanded={expandedSection === section.id}
              aria-controls={`footer-section-${section.id}`}
            >
              <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                {section.title}
              </span>
              <svg 
                className={`w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark transition-transform duration-200 ${
                  expandedSection === section.id ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedSection === section.id && (
              <div 
                id={`footer-section-${section.id}`}
                className="pb-4 animate-slide-down"
              >
                <div className="space-y-3 pl-2">
                  {section.items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="block w-full text-left py-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 transition-colors touch-manipulation"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Social Links */}
      <div className="px-4 py-6 border-t border-primary-200/10 dark:border-primary-700/10">
        <div className="flex items-center justify-center gap-6 mb-4">
          <button 
            className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-light dark:bg-surface-dark hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark active:bg-interactive-active-light dark:active:bg-interactive-active-dark transition-colors touch-manipulation"
            aria-label="Follow us on Twitter"
          >
            <svg className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </button>
          
          <button 
            className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-light dark:bg-surface-dark hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark active:bg-interactive-active-light dark:active:bg-interactive-active-dark transition-colors touch-manipulation"
            aria-label="Follow us on LinkedIn"
          >
            <svg className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </button>
          
          <button 
            className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-light dark:bg-surface-dark hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark active:bg-interactive-active-light dark:active:bg-interactive-active-dark transition-colors touch-manipulation"
            aria-label="Subscribe to our newsletter"
          >
            <svg className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
            © 2024 Asha.News. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default MobileFooter;
