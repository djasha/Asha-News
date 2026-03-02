import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { buildAuthHeaders } from '../../utils/authHeaders';

const SubscriptionModal = ({ isOpen, onClose, defaultPlan = 'premium' }) => {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [selectedPlan] = useState(defaultPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans');
      const data = await response.json();
      
      if (data.success) {
        setPlans(Object.entries(data.plans).map(([key, plan]) => ({
          id: key,
          ...plan
        })));
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setError('Failed to load subscription plans');
    }
  };

  const handleSubscribe = async (planId) => {
    if (!isAuthenticated) {
      onClose();
      // Trigger auth modal
      return;
    }

    if (planId === 'free') {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const plan = plans.find(p => p.id === planId);
      const headers = await buildAuthHeaders({
        'Content-Type': 'application/json'
      });
      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          priceId: plan.priceId
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        setError(data.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError('Failed to start subscription process');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] pointer-events-none overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 pointer-events-none">
          <div className="relative w-full max-w-4xl bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl shadow-2xl pointer-events-auto">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-surface-light dark:bg-surface-dark rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <svg className="w-5 h-5 text-text-primary-light dark:text-text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="p-8 text-center border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                Choose Your Plan
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Unlock the full power of AI-driven news analysis
              </p>
            </div>

            {error && (
              <div className="mx-8 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Plans Grid */}
            <div className="p-8 grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border-2 p-6 ${
                    selectedPlan === plan.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark'
                  } ${plan.id === 'premium' ? 'ring-2 ring-primary-500 ring-opacity-50' : ''}`}
                >
                  {plan.id === 'premium' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                      {plan.name}
                    </h3>
                    
                    <div className="mb-4">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                          Free
                        </span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                            ${plan.price}
                          </span>
                          <span className="text-text-secondary-light dark:text-text-secondary-dark">
                            /month
                          </span>
                        </>
                      )}
                    </div>

                    {plan.id !== 'free' && (
                      <div className="mb-4 text-sm text-primary-600 dark:text-primary-400 font-medium">
                        7-day free trial
                      </div>
                    )}

                    <ul className="space-y-3 mb-6 text-left">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoading}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        plan.id === 'free'
                          ? 'bg-gray-200 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-300 dark:hover:bg-gray-600'
                          : selectedPlan === plan.id
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : plan.id === 'free' ? (
                        'Current Plan'
                      ) : (
                        `Start ${plan.name} Trial`
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 text-center">
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                All plans include our core bias detection and fact-checking features
              </p>
              <div className="flex justify-center space-x-6 text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                <span>✓ Cancel anytime</span>
                <span>✓ Secure payments</span>
                <span>✓ 30-day money back</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default SubscriptionModal;
