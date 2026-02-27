const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const StripeService = require('../services/stripeService');
const { authenticateToken } = require('../middleware/authMiddleware');

const stripeService = new StripeService();

/**
 * GET /api/subscription/plans
 * Get available subscription plans
 */
router.get('/plans', (req, res) => {
  try {
    const plans = stripeService.getPlans();
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    logger.error({ err: error }, 'Get plans error');
    res.status(500).json({
      error: 'Failed to get subscription plans',
      message: error.message
    });
  }
});

/**
 * POST /api/subscription/create-checkout-session
 * Create Stripe checkout session
 */
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { priceId } = req.body;
    const user = req.user;

    if (!priceId) {
      return res.status(400).json({
        error: 'Price ID is required'
      });
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customerResult = await stripeService.createCustomer({
        id: user.userId,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      });

      if (!customerResult.success) {
        return res.status(500).json({
          error: 'Failed to create customer',
          message: customerResult.error
        });
      }

      customerId = customerResult.customerId;
      // TODO: Update user record with Stripe customer ID
    }

    const successUrl = `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL}/subscription/cancel`;

    const sessionResult = await stripeService.createCheckoutSession(
      customerId,
      priceId,
      successUrl,
      cancelUrl
    );

    if (!sessionResult.success) {
      return res.status(500).json({
        error: 'Failed to create checkout session',
        message: sessionResult.error
      });
    }

    res.json({
      success: true,
      sessionId: sessionResult.sessionId,
      url: sessionResult.url
    });

  } catch (error) {
    logger.error({ err: error }, 'Create checkout session error');
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
});

/**
 * POST /api/subscription/create-portal-session
 * Create Stripe billing portal session
 */
router.post('/create-portal-session', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const customerId = user.stripeCustomerId;

    if (!customerId) {
      return res.status(400).json({
        error: 'No Stripe customer found'
      });
    }

    const returnUrl = `${process.env.FRONTEND_URL}/dashboard/subscription`;

    const sessionResult = await stripeService.createBillingPortalSession(
      customerId,
      returnUrl
    );

    if (!sessionResult.success) {
      return res.status(500).json({
        error: 'Failed to create portal session',
        message: sessionResult.error
      });
    }

    res.json({
      success: true,
      url: sessionResult.url
    });

  } catch (error) {
    logger.error({ err: error }, 'Create portal session error');
    res.status(500).json({
      error: 'Failed to create portal session',
      message: error.message
    });
  }
});

/**
 * GET /api/subscription/status
 * Get user's subscription status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const customerId = user.stripeCustomerId;

    if (!customerId) {
      return res.json({
        success: true,
        subscription: null,
        tier: 'free',
        features: stripeService.getPlans().free.features
      });
    }

    const subscriptionResult = await stripeService.getCustomerSubscription(customerId);

    if (!subscriptionResult.success) {
      return res.status(500).json({
        error: 'Failed to get subscription status',
        message: subscriptionResult.error
      });
    }

    const validation = stripeService.validateSubscription(subscriptionResult.subscription);
    const plans = stripeService.getPlans();

    res.json({
      success: true,
      subscription: subscriptionResult.subscription,
      tier: validation.tier,
      features: plans[validation.tier]?.features || plans.free.features,
      isValid: validation.valid
    });

  } catch (error) {
    logger.error({ err: error }, 'Get subscription status error');
    res.status(500).json({
      error: 'Failed to get subscription status',
      message: error.message
    });
  }
});

/**
 * POST /api/subscription/cancel
 * Cancel subscription
 */
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId, immediate = false } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        error: 'Subscription ID is required'
      });
    }

    const cancelResult = await stripeService.cancelSubscription(
      subscriptionId,
      !immediate
    );

    if (!cancelResult.success) {
      return res.status(500).json({
        error: 'Failed to cancel subscription',
        message: cancelResult.error
      });
    }

    res.json({
      success: true,
      subscription: cancelResult.subscription,
      message: immediate ? 'Subscription cancelled immediately' : 'Subscription will cancel at period end'
    });

  } catch (error) {
    logger.error({ err: error }, 'Cancel subscription error');
    res.status(500).json({
      error: 'Failed to cancel subscription',
      message: error.message
    });
  }
});

/**
 * POST /api/subscription/reactivate
 * Reactivate cancelled subscription
 */
router.post('/reactivate', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        error: 'Subscription ID is required'
      });
    }

    const reactivateResult = await stripeService.reactivateSubscription(subscriptionId);

    if (!reactivateResult.success) {
      return res.status(500).json({
        error: 'Failed to reactivate subscription',
        message: reactivateResult.error
      });
    }

    res.json({
      success: true,
      subscription: reactivateResult.subscription,
      message: 'Subscription reactivated successfully'
    });

  } catch (error) {
    logger.error({ err: error }, 'Reactivate subscription error');
    res.status(500).json({
      error: 'Failed to reactivate subscription',
      message: error.message
    });
  }
});

/**
 * POST /api/subscription/webhook
 * Handle Stripe webhooks
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    const webhookResult = await stripeService.handleWebhook(req.body, signature);

    if (!webhookResult.success) {
      return res.status(400).json({
        error: 'Webhook processing failed',
        message: webhookResult.error
      });
    }

    res.json({ received: true });

  } catch (error) {
    logger.error({ err: error }, 'Webhook error');
    res.status(400).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

/**
 * GET /api/subscription/usage
 * Get user's usage statistics
 */
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const today = new Date().toDateString();
    const usage = user.dailyUsage?.[today] || {};

    // Get subscription status to determine limits
    const customerId = user.stripeCustomerId;
    let tier = 'free';
    
    if (customerId) {
      const subscriptionResult = await stripeService.getCustomerSubscription(customerId);
      if (subscriptionResult.success) {
        const validation = stripeService.validateSubscription(subscriptionResult.subscription);
        tier = validation.tier;
      }
    }

    const limits = {
      free: { articles: 10, searches: 20 },
      premium: { articles: -1, searches: -1 }, // unlimited
      pro: { articles: -1, searches: -1 } // unlimited
    };

    res.json({
      success: true,
      usage: {
        articles: usage.articles || 0,
        searches: usage.searches || 0
      },
      limits: limits[tier],
      tier,
      resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
    });

  } catch (error) {
    logger.error({ err: error }, 'Get usage error');
    res.status(500).json({
      error: 'Failed to get usage statistics',
      message: error.message
    });
  }
});

module.exports = router;
