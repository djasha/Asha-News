import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNavigation as useCMSNavigation } from '../../hooks/useCMSData';
import { CORE_NAV_ITEMS_DESKTOP } from '../../config/v1';

const Section = ({ title, children }) => (
  <div>
    <h4 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 uppercase tracking-wide">
      {title}
    </h4>
    <ul className="space-y-2 text-sm">
      {children}
    </ul>
  </div>
);

const FooterLink = ({ to, external, children }) => {
  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        {children}
      </a>
    );
  }
  return (
    <Link 
      to={to}
      className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
    >
      {children}
    </Link>
  );
};

const SiteFooter = () => {
  const navigate = useNavigate();

  // Optional CMS-driven footer links
  const { data: footerNav } = useCMSNavigation('footer');
  const normalizePath = (p) => {
    if (!p) return '/';
    try {
      const url = new URL(p, window.location.origin);
      return url.pathname || '/';
    } catch {
      return p.startsWith('/') ? p : `/${p}`;
    }
  };
  let footerItems = [];
  if (Array.isArray(footerNav) && footerNav.length) {
    const menu = footerNav.find((m) => m.enabled) || footerNav[0];
    if (menu && Array.isArray(menu.items) && menu.items.length) {
      footerItems = menu.items
        .map((it) => ({
          name: it.label || it.name || it.title || 'Link',
          path: normalizePath(it.path || it.url || it.link),
        }))
        .filter((i) => i.path && i.path.startsWith('/'));
    }
  }
  return (
    <footer className="hidden lg:block bg-surface-elevated-light dark:bg-surface-elevated-dark border-t border-primary-200/20 dark:border-primary-700/20 mt-16">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="col-span-1 lg:col-span-2">
            <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
              Asha.News
            </div>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-4">
              AI-powered news analysis and story clustering. Compare coverage
              across the spectrum and spot blindspots.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm"
              >
                Home Feed
              </button>
              <button
                onClick={() => navigate("/ai-checker")}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-text-primary-light dark:text-text-primary-dark rounded-lg text-sm"
              >
                AI Checker
              </button>
            </div>
          </div>

          <Section title="Company">
            <li>
              <FooterLink to="/about">About Us</FooterLink>
            </li>
            <li>
              <FooterLink to="/contact">Contact</FooterLink>
            </li>
            <li>
              <FooterLink to="/careers">Careers</FooterLink>
            </li>
          </Section>

          {footerItems.length > 0 && (
            <Section title="More">
              {footerItems.map((item) => (
                <li key={item.path}>
                  <FooterLink to={item.path}>{item.name}</FooterLink>
                </li>
              ))}
            </Section>
          )}

          <Section title="Product">
            {CORE_NAV_ITEMS_DESKTOP.map((item) => (
              <li key={item.path}>
                <FooterLink to={item.path}>{item.label}</FooterLink>
              </li>
            ))}
          </Section>

          <Section title="Resources">
            <li>
              <FooterLink to="/wiki">Wiki</FooterLink>
            </li>
            <li>
              <FooterLink to="/api">API</FooterLink>
            </li>
            <li>
              <FooterLink to="/wiki/conflict-ops">Conflict Ops Wiki</FooterLink>
            </li>
            <li>
              <FooterLink to="/wiki/ai-checker">AI Checker Wiki</FooterLink>
            </li>
            <li>
              <FooterLink to="/wiki/markets">Markets Wiki</FooterLink>
            </li>
            <li>
              <FooterLink to="/wiki/agent-api">Agent API Wiki</FooterLink>
            </li>
            <li>
              <FooterLink to="/rss.xml" external>
                RSS
              </FooterLink>
            </li>
          </Section>

          <Section title="Legal">
            <li>
              <FooterLink to="/privacy">Privacy Policy</FooterLink>
            </li>
            <li>
              <FooterLink to="/terms">Terms of Service</FooterLink>
            </li>
            <li>
              <FooterLink to="/cookies">Cookie Policy</FooterLink>
            </li>
            <li>
              <FooterLink to="/gdpr">GDPR</FooterLink>
            </li>
          </Section>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-200/20 dark:border-primary-700/20 flex items-center justify-between">
          <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
            {" "}
            {new Date().getFullYear()} Asha.News. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://x.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="w-9 h-9 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.954 4.569c-.885.392-1.83.654-2.825.775 1.014-.609 1.794-1.574 2.163-2.723-.949.564-2.005.974-3.127 1.195-.897-.959-2.178-1.559-3.594-1.559-2.723 0-4.928 2.205-4.928 4.917 0 .39.045.765.127 1.124-4.094-.205-7.72-2.165-10.148-5.144-.424.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.229-.616v.06c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.6 3.418-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.402 4.768 2.212 7.557 2.212 9.054 0 14-7.496 14-13.986 0-.21-.006-.423-.016-.634.961-.689 1.8-1.56 2.46-2.548z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5h4V24h-4V8.5zM8.5 8.5h3.8v2.1h.1c.5-.9 1.7-2.1 3.6-2.1 3.8 0 4.5 2.5 4.5 5.8V24h-4v-6.4c0-1.5 0-3.4-2.1-3.4-2.1 0-2.5 1.6-2.5 3.3V24h-4V8.5z" />
              </svg>
            </a>
            <a
              href="/subscription"
              className="w-9 h-9 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400"
              aria-label="Newsletter"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
