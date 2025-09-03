import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  const [isSignIn, setIsSignIn] = useState(mode === 'signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just redirect back to home
    // In a real app, this would handle authentication
    console.log(isSignIn ? 'Sign in' : 'Sign up', formData);
    navigate(-1);
  };

  const toggleMode = () => {
    setIsSignIn(!isSignIn);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    });
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{isSignIn ? 'Sign In' : 'Sign Up'} | Asha.News</title>
        <meta name="description" content={`${isSignIn ? 'Sign in to' : 'Create an account on'} Asha.News to follow topics and get personalized news.`} />
      </Helmet>

      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            <div className="text-2xl font-logo font-semibold text-text-primary-light dark:text-text-primary-dark">
              Asha
              <span className="text-primary-600 dark:text-primary-400">.</span>
              News
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {isSignIn ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {isSignIn ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
            >
              {isSignIn ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isSignIn && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={!isSignIn}
                  className="relative block w-full px-3 py-2 border border-primary-300 dark:border-primary-600 placeholder-text-tertiary-light dark:placeholder-text-tertiary-dark text-text-primary-light dark:text-text-primary-dark bg-surface-light dark:bg-surface-dark rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 border border-primary-300 dark:border-primary-600 placeholder-text-tertiary-light dark:placeholder-text-tertiary-dark text-text-primary-light dark:text-text-primary-dark bg-surface-light dark:bg-surface-dark rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignIn ? "current-password" : "new-password"}
                required
                className="relative block w-full px-3 py-2 border border-primary-300 dark:border-primary-600 placeholder-text-tertiary-light dark:placeholder-text-tertiary-dark text-text-primary-light dark:text-text-primary-dark bg-surface-light dark:bg-surface-dark rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            {!isSignIn && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required={!isSignIn}
                  className="relative block w-full px-3 py-2 border border-primary-300 dark:border-primary-600 placeholder-text-tertiary-light dark:placeholder-text-tertiary-dark text-text-primary-light dark:text-text-primary-dark bg-surface-light dark:bg-surface-dark rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            )}
          </div>

          {isSignIn && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 dark:border-primary-600 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              {isSignIn ? 'Sign in' : 'Sign up'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary-300 dark:border-primary-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-primary-300 dark:border-primary-600 rounded-lg shadow-sm bg-surface-light dark:bg-surface-dark text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2">Google</span>
              </button>

              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-primary-300 dark:border-primary-600 rounded-lg shadow-sm bg-surface-light dark:bg-surface-dark text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
                <span className="ml-2">Twitter</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
