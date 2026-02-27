import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firebaseAuthService } from '../services/firebase';
import { API_SERVER, CMS_BASE } from '../config/api';

const DebugPage = () => {
  const auth = useAuth();
  const [tests, setTests] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runTests = async () => {
    const results = {};

    // Test 1: Firebase loaded
    try {
      results.firebaseLoaded = {
        status: typeof firebaseAuthService !== 'undefined',
        message: 'Firebase service loaded'
      };
    } catch (e) {
      results.firebaseLoaded = { status: false, message: e.message };
    }

    // Test 2: Auth context
    try {
      results.authContext = {
        status: auth !== null,
        message: `Auth context available, authenticated: ${auth?.isAuthenticated}`
      };
    } catch (e) {
      results.authContext = { status: false, message: e.message };
    }

    // Test 3: Backend API
    try {
      const response = await fetch(`${API_SERVER}/health`);
      const data = await response.json();
      results.backendAPI = {
        status: response.ok,
        message: `Backend: ${data.message || 'OK'}`
      };
    } catch (e) {
      results.backendAPI = {
        status: false,
        message: `Backend not reachable: ${e.message}`
      };
    }

    // Test 4: Directus API
    try {
      const response = await fetch(`${CMS_BASE}/site-config`);
      results.directusAPI = {
        status: response.ok,
        message: 'Directus CMS reachable via proxy'
      };
    } catch (e) {
      results.directusAPI = {
        status: false,
        message: `Directus error: ${e.message}`
      };
    }

    // Test 5: LocalStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      results.localStorage = {
        status: true,
        message: 'LocalStorage working'
      };
    } catch (e) {
      results.localStorage = {
        status: false,
        message: `LocalStorage error: ${e.message}`
      };
    }

    // Test 6: Console errors check
    const originalConsoleError = console.error;
    let errorCount = 0;
    console.error = (...args) => {
      errorCount++;
      originalConsoleError(...args);
    };
    
    setTimeout(() => {
      results.consoleErrors = {
        status: errorCount === 0,
        message: `${errorCount} console.error calls detected`
      };
      console.error = originalConsoleError;
      setTests(results);
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-8">
            Running System Tests...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-8">
          System Debug Dashboard
        </h1>

        <div className="space-y-4">
          {Object.entries(tests).map(([key, test]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border-2 ${
                test.status
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-text-primary-light dark:text-text-primary-dark">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    test.status
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {test.status ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span>{test.status ? 'PASS' : 'FAIL'}</span>
                  </span>
                </span>
              </div>
              <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">
                {test.message}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            Common Issues & Fixes
          </h2>
          <div className="space-y-4 text-text-secondary-light dark:text-text-secondary-dark">
            <div>
              <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                Backend API Failed
              </h3>
              <p>Start backend: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">cd server && npm run dev</code></p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                Firebase Errors
              </h3>
              <p>Enable Email/Password and Google auth in Firebase Console</p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                Directus Failed
              </h3>
              <p>
                Check if the backend CMS proxy is reachable at{' '}
                <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{`${CMS_BASE}/site-config`}</code>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Home</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
