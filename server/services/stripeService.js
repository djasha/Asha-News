// Initialize Stripe only if API key is provided
const logger = require('../utils/logger');
const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key_here'
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

class StripeService {
  constructor() {
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Subscription plans
    this.plans = {
      free: {
        name: 'Free',
        price: 0,
        features: ['10 articles/day', 'Basic bias analysis', 'Topic filtering'],
        limits: { articles: 10, searches: 20 }
      },
      premium: {
        name: 'Premium',
        priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
        price: 9.99,
        features: [
          'Unlimited articles',
          'Advanced bias analytics',
          'Blindspot detection',
          'Saved articles',
          'Email alerts',
          'Reading history'
        ]
      },
      pro: {
        name: 'Pro',
        priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
        price: 19.99,
        features: [
          'All Premium features',
          'API access',
          'Export functionality',
          'Advanced analytics',
          'Priority support'
        ]
      }
    };
  }

  /**
   * Create a new customer in Stripe
   */
  async createCustomer(userData) {
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }
    try {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        metadata: {
          userId: userData.id.toString(),
          source: 'asha_news'
        }
      });

      return {
        success: true,
        customerId: customer.id,
        customer
      };
    } catch (error) {
      logger.error('Stripe customer creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        subscription_data: {
          trial_period_days: 7, // 7-day free trial
          metadata: {
            source: 'asha_news'
          }
        }
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      logger.error('Stripe checkout session error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a billing portal session
   */
  async createBillingPortalSession(customerId, returnUrl) {
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return {
        success: true,
        url: session.url
      };
    } catch (error) {
      logger.error('Stripe billing portal error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get customer's subscription details
   */
  async getCustomerSubscription(customerId) {
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 1
      });

      if (subscriptions.data.length === 0) {
        return {
          success: true,
          subscription: null,
          status: 'none'
        };
      }

      const subscription = subscriptions.data[0];
      const product = await stripe.products.retrieve(subscription.items.data[0].price.product);

      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          plan: {
            id: subscription.items.data[0].price.id,
            name: product.name,
            amount: subscription.items.data[0].price.unit_amount / 100,
            currency: subscription.items.data[0].price.currency,
            interval: subscription.items.data[0].price.recurring.interval
          }
        }
      };
    } catch (error) {
      logger.error('Get subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd
      });

      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      };
    } catch (error) {
      logger.error('Cancel subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId) {
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      };
    } catch (error) {
      logger.error('Reactivate subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(body, signature) {
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }
    try {
      const event = stripe.webhooks.constructEvent(body, signature, this.webhookSecret);

      switch (event.type) {
        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(event.data.object);
        
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(event.data.object);
        
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(event.data.object);
        
        case 'invoice.payment_succeeded':
          return await this.handlePaymentSucceeded(event.data.object);
        
        case 'invoice.payment_failed':
          return await this.handlePaymentFailed(event.data.object);
        
        default:
          logger.info(`Unhandled event type: ${event.type}`);
          return { success: true, handled: false };
      }
    } catch (error) {
      logger.error('Webhook error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleSubscriptionCreated(subscription) {
    logger.info('Subscription created:', subscription.id);
    // Update user subscription status in database
    return { success: true, action: 'subscription_created' };
  }

  async handleSubscriptionUpdated(subscription) {
    logger.info('Subscription updated:', subscription.id);
    // Update user subscription status in database
    return { success: true, action: 'subscription_updated' };
  }

  async handleSubscriptionDeleted(subscription) {
    logger.info('Subscription deleted:', subscription.id);
    // Update user subscription status in database
    return { success: true, action: 'subscription_deleted' };
  }

  async handlePaymentSucceeded(invoice) {
    logger.info('Payment succeeded:', invoice.id);
    // Log successful payment, send confirmation email
    return { success: true, action: 'payment_succeeded' };
  }

  async handlePaymentFailed(invoice) {
    logger.info('Payment failed:', invoice.id);
    // Handle failed payment, notify user
    return { success: true, action: 'payment_failed' };
  }

  /**
   * Get available plans
   */
  getPlans() {
    return this.plans;
  }

  /**
   * Validate subscription status
   */
  validateSubscription(subscription) {
    if (!subscription) return { valid: false, tier: 'free' };

    const now = new Date();
    const isActive = subscription.status === 'active' || 
                    (subscription.status === 'trialing' && subscription.trialEnd > now);

    if (!isActive) return { valid: false, tier: 'free' };

    // Determine tier based on price ID
    const priceId = subscription.plan.id;
    if (priceId === this.plans.pro.priceId) {
      return { valid: true, tier: 'pro' };
    } else if (priceId === this.plans.premium.priceId) {
      return { valid: true, tier: 'premium' };
    }

    return { valid: false, tier: 'free' };
  }

  /**
   * Check feature access
   */
  hasFeatureAccess(subscription, feature) {
    const { tier } = this.validateSubscription(subscription);
    
    const featureMap = {
      free: ['basic_feed', 'basic_bias_analysis', 'topic_filtering'],
      premium: [
        'basic_feed', 'basic_bias_analysis', 'topic_filtering',
        'unlimited_articles', 'advanced_filtering', 'bias_analytics',
        'blindspot_detection', 'saved_articles', 'email_alerts', 'reading_history'
      ],
      pro: [
        'basic_feed', 'basic_bias_analysis', 'topic_filtering',
        'unlimited_articles', 'advanced_filtering', 'bias_analytics',
        'blindspot_detection', 'saved_articles', 'email_alerts', 'reading_history',
        'api_access', 'export_functionality', 'advanced_analytics', 'priority_support'
      ]
    };

    return featureMap[tier]?.includes(feature) || false;
  }
}

module.exports = StripeService;
