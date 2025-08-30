const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Advanced Payment Gateway Service
 * Handles multiple payment methods, status tracking, and retry mechanisms
 */
class PaymentGatewayService {
  constructor() {
    this.gateways = {
      stripe: {
        baseURL: process.env.STRIPE_API_URL || 'https://api.stripe.com/v1',
        apiKey: process.env.STRIPE_SECRET_KEY,
        timeout: 30000
      },
      paypal: {
        baseURL: process.env.PAYPAL_API_URL || 'https://api-m.paypal.com/v1',
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        timeout: 30000
      },
      ach: {
        baseURL: process.env.ACH_API_URL || 'https://api.ach.com/v1',
        apiKey: process.env.ACH_API_KEY,
        timeout: 45000
      },
      wire: {
        baseURL: process.env.WIRE_API_URL || 'https://api.wire.com/v1',
        apiKey: process.env.WIRE_API_KEY,
        timeout: 60000
      },
      crypto: {
        baseURL: process.env.CRYPTO_API_URL || 'https://api.crypto.com/v1',
        apiKey: process.env.CRYPTO_API_KEY,
        timeout: 30000
      }
    };
    
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000
    };
    
    this.paymentStatuses = new Map();
    this.scheduledPayments = new Map();
  }

  /**
   * Initialize payment gateways
   */
  async initialize() {
    try {
      logger.info('Initializing Payment Gateway Service');
      
      // Test connections to all gateways
      const results = await Promise.allSettled([
        this.testGateway('stripe'),
        this.testGateway('paypal'),
        this.testGateway('ach'),
        this.testGateway('wire'),
        this.testGateway('crypto')
      ]);
      
      const activeGateways = results
        .map((result, index) => ({ result, gateway: Object.keys(this.gateways)[index] }))
        .filter(({ result }) => result.status === 'fulfilled')
        .map(({ gateway }) => gateway);
      
      logger.info('Payment gateways initialized', { activeGateways });
      return activeGateways;
      
    } catch (error) {
      logger.error('Failed to initialize payment gateways', { error: error.message });
      throw error;
    }
  }

  /**
   * Test gateway connectivity
   */
  async testGateway(gatewayName) {
    const gateway = this.gateways[gatewayName];
    if (!gateway) throw new Error(`Gateway ${gatewayName} not configured`);

    try {
      const response = await axios.get(`${gateway.baseURL}/health`, {
        headers: this.getGatewayHeaders(gatewayName),
        timeout: gateway.timeout
      });
      
      return response.data;
    } catch (error) {
      logger.warn(`Gateway ${gatewayName} test failed`, { error: error.message });
      throw error;
    }
  }

  /**
   * Process payment with multiple retry attempts
   */
  async processPayment(paymentData) {
    const {
      amount,
      currency = 'USD',
      method = 'ach',
      beneficiaryAccount,
      reference,
      milestoneId,
      projectId,
      retryOnFailure = true
    } = paymentData;

    const paymentId = this.generatePaymentId(milestoneId, projectId);
    
    try {
      logger.info('Processing payment', { paymentId, method, amount, currency });

      // Validate payment method
      if (!this.gateways[method]) {
        throw new Error(`Unsupported payment method: ${method}`);
      }

      // Process payment with retry logic
      const result = await this.processWithRetry(
        () => this.executePayment(method, paymentData),
        paymentId
      );

      // Store payment status
      this.paymentStatuses.set(paymentId, {
        status: 'completed',
        method,
        amount,
        currency,
        timestamp: new Date(),
        gatewayReference: result.gatewayReference,
        fees: result.fees
      });

      logger.audit('PAYMENT_COMPLETED', null, {
        paymentId,
        milestoneId,
        projectId,
        amount,
        method,
        gatewayReference: result.gatewayReference
      });

      return {
        success: true,
        paymentId,
        status: 'completed',
        gatewayReference: result.gatewayReference,
        estimatedCompletion: result.estimatedCompletion,
        fees: result.fees
      };

    } catch (error) {
      logger.error('Payment processing failed', {
        paymentId,
        method,
        error: error.message
      });

      // Store failed payment status
      this.paymentStatuses.set(paymentId, {
        status: 'failed',
        method,
        amount,
        currency,
        timestamp: new Date(),
        error: error.message
      });

      // Schedule retry if enabled
      if (retryOnFailure) {
        await this.scheduleRetry(paymentId, paymentData);
      }

      throw error;
    }
  }

  /**
   * Execute payment on specific gateway
   */
  async executePayment(method, paymentData) {
    const gateway = this.gateways[method];
    
    switch (method) {
      case 'stripe':
        return await this.processStripePayment(gateway, paymentData);
      case 'paypal':
        return await this.processPayPalPayment(gateway, paymentData);
      case 'ach':
        return await this.processACHPayment(gateway, paymentData);
      case 'wire':
        return await this.processWirePayment(gateway, paymentData);
      case 'crypto':
        return await this.processCryptoPayment(gateway, paymentData);
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(gateway, paymentData) {
    const { amount, currency, beneficiaryAccount, reference } = paymentData;
    
    const payload = {
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: currency.toLowerCase(),
      destination: beneficiaryAccount,
      description: reference,
      metadata: {
        project_id: paymentData.projectId,
        milestone_id: paymentData.milestoneId
      }
    };

    const response = await axios.post(`${gateway.baseURL}/transfers`, payload, {
      headers: this.getGatewayHeaders('stripe'),
      timeout: gateway.timeout
    });

    return {
      gatewayReference: response.data.id,
      estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      fees: response.data.fees || 0
    };
  }

  /**
   * Process PayPal payment
   */
  async processPayPalPayment(gateway, paymentData) {
    const { amount, currency, beneficiaryAccount, reference } = paymentData;
    
    // First get access token
    const authResponse = await axios.post(`${gateway.baseURL}/oauth2/token`, 
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${gateway.clientId}:${gateway.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: gateway.timeout
      }
    );

    const accessToken = authResponse.data.access_token;

    // Create payout
    const payload = {
      sender_batch_header: {
        sender_batch_id: reference,
        email_subject: 'Green Hydrogen Subsidy Payment'
      },
      items: [{
        recipient_type: 'EMAIL',
        amount: {
          value: amount.toString(),
          currency: currency
        },
        receiver: beneficiaryAccount,
        note: reference
      }]
    };

    const response = await axios.post(`${gateway.baseURL}/payments/payouts`, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: gateway.timeout
    });

    return {
      gatewayReference: response.data.batch_header.payout_batch_id,
      estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      fees: 0 // PayPal doesn't charge for payouts
    };
  }

  /**
   * Process ACH payment
   */
  async processACHPayment(gateway, paymentData) {
    const { amount, currency, beneficiaryAccount, reference } = paymentData;
    
    const payload = {
      amount: amount,
      currency: currency,
      recipient_account: beneficiaryAccount,
      reference: reference,
      type: 'credit',
      metadata: {
        project_id: paymentData.projectId,
        milestone_id: paymentData.milestoneId
      }
    };

    const response = await axios.post(`${gateway.baseURL}/transfers/ach`, payload, {
      headers: this.getGatewayHeaders('ach'),
      timeout: gateway.timeout
    });

    return {
      gatewayReference: response.data.transfer_id,
      estimatedCompletion: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
      fees: response.data.fees || 0.25
    };
  }

  /**
   * Process Wire payment
   */
  async processWirePayment(gateway, paymentData) {
    const { amount, currency, beneficiaryAccount, reference } = paymentData;
    
    const payload = {
      amount: amount,
      currency: currency,
      beneficiary_account: beneficiaryAccount,
      reference: reference,
      type: 'outbound',
      metadata: {
        project_id: paymentData.projectId,
        milestone_id: paymentData.milestoneId
      }
    };

    const response = await axios.post(`${gateway.baseURL}/transfers/wire`, payload, {
      headers: this.getGatewayHeaders('wire'),
      timeout: gateway.timeout
    });

    return {
      gatewayReference: response.data.wire_id,
      estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      fees: response.data.fees || 25
    };
  }

  /**
   * Process Crypto payment
   */
  async processCryptoPayment(gateway, paymentData) {
    const { amount, currency, beneficiaryAccount, reference } = paymentData;
    
    const payload = {
      amount: amount,
      currency: currency,
      destination_address: beneficiaryAccount,
      reference: reference,
      network: 'ethereum', // Default to Ethereum
      metadata: {
        project_id: paymentData.projectId,
        milestone_id: paymentData.milestoneId
      }
    };

    const response = await axios.post(`${gateway.baseURL}/transfers/crypto`, payload, {
      headers: this.getGatewayHeaders('crypto'),
      timeout: gateway.timeout
    });

    return {
      gatewayReference: response.data.transaction_hash,
      estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      fees: response.data.network_fee || 0.001
    };
  }

  /**
   * Process payment with retry logic
   */
  async processWithRetry(operation, paymentId, attempt = 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.retryConfig.maxAttempts) {
        throw error;
      }

      const delay = Math.min(
        this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
        this.retryConfig.maxDelay
      );

      logger.warn(`Payment attempt ${attempt} failed, retrying in ${delay}ms`, {
        paymentId,
        error: error.message
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.processWithRetry(operation, paymentId, attempt + 1);
    }
  }

  /**
   * Schedule payment retry
   */
  async scheduleRetry(paymentId, paymentData) {
    const retryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    this.scheduledPayments.set(paymentId, {
      paymentData,
      retryTime,
      attempts: 1
    });

    logger.info('Payment retry scheduled', { paymentId, retryTime });
  }

  /**
   * Get payment status
   */
  getPaymentStatus(paymentId) {
    return this.paymentStatuses.get(paymentId) || null;
  }

  /**
   * Get all payment statuses
   */
  getAllPaymentStatuses() {
    const statuses = [];
    for (const [paymentId, status] of this.paymentStatuses) {
      statuses.push({ paymentId, ...status });
    }
    return statuses;
  }

  /**
   * Schedule recurring payment
   */
  scheduleRecurringPayment(scheduleData) {
    const {
      id,
      amount,
      currency,
      method,
      beneficiaryAccount,
      frequency, // daily, weekly, monthly, yearly
      startDate,
      endDate,
      reference
    } = scheduleData;

    const schedule = {
      id,
      amount,
      currency,
      method,
      beneficiaryAccount,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      reference,
      nextPayment: new Date(startDate),
      isActive: true
    };

    this.scheduledPayments.set(id, schedule);
    
    // Schedule first payment
    this.scheduleNextPayment(id);
    
    logger.info('Recurring payment scheduled', { id, frequency, startDate });
    
    return { success: true, scheduleId: id };
  }

  /**
   * Schedule next payment in recurring sequence
   */
  scheduleNextPayment(scheduleId) {
    const schedule = this.scheduledPayments.get(scheduleId);
    if (!schedule || !schedule.isActive) return;

    const now = new Date();
    if (schedule.nextPayment <= now) {
      // Process payment
      this.processPayment({
        amount: schedule.amount,
        currency: schedule.currency,
        method: schedule.method,
        beneficiaryAccount: schedule.beneficiaryAccount,
        reference: schedule.reference
      });

      // Calculate next payment date
      schedule.nextPayment = this.calculateNextPaymentDate(
        schedule.nextPayment,
        schedule.frequency
      );

      // Check if schedule should end
      if (schedule.endDate && schedule.nextPayment > schedule.endDate) {
        schedule.isActive = false;
        logger.info('Recurring payment schedule completed', { scheduleId });
      } else {
        // Schedule next payment
        this.scheduleNextPayment(scheduleId);
      }
    }
  }

  /**
   * Calculate next payment date based on frequency
   */
  calculateNextPaymentDate(currentDate, frequency) {
    const next = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }
    
    return next;
  }

  /**
   * Get gateway headers for authentication
   */
  getGatewayHeaders(gatewayName) {
    const gateway = this.gateways[gatewayName];
    
    switch (gatewayName) {
      case 'stripe':
        return { 'Authorization': `Bearer ${gateway.apiKey}` };
      case 'paypal':
        return { 'Content-Type': 'application/json' };
      case 'ach':
      case 'wire':
      case 'crypto':
        return { 'Authorization': `Bearer ${gateway.apiKey}` };
      default:
        return {};
    }
  }

  /**
   * Generate unique payment ID
   */
  generatePaymentId(milestoneId, projectId) {
    return `PAY_${projectId}_${milestoneId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get payment analytics
   */
  getPaymentAnalytics() {
    const statuses = Array.from(this.paymentStatuses.values());
    
    return {
      totalPayments: statuses.length,
      completedPayments: statuses.filter(s => s.status === 'completed').length,
      failedPayments: statuses.filter(s => s.status === 'failed').length,
      totalAmount: statuses
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + s.amount, 0),
      totalFees: statuses
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.fees || 0), 0),
      methodBreakdown: this.getMethodBreakdown(statuses)
    };
  }

  /**
   * Get payment method breakdown
   */
  getMethodBreakdown(statuses) {
    const breakdown = {};
    
    statuses.forEach(status => {
      if (status.status === 'completed') {
        breakdown[status.method] = (breakdown[status.method] || 0) + 1;
      }
    });
    
    return breakdown;
  }
}

module.exports = new PaymentGatewayService();
