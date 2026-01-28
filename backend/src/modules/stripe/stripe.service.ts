import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  // --- Customers ---
  async createCustomer(email: string, name?: string) {
    return this.stripe.customers.create({ email, name });
  }

  async getCustomer(customerId: string) {
    return this.stripe.customers.retrieve(customerId);
  }

  // --- Payments ---
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId?: string,
    metadata?: any,
  ) {
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency,
      customer: customerId,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
  }

  async confirmPaymentIntent(paymentIntentId: string) {
    return this.stripe.paymentIntents.confirm(paymentIntentId);
  }

  // --- Setup Intents (for saving cards) ---
  async createSetupIntent(customerId: string) {
    return this.stripe.setupIntents.create({
      customer: customerId,
    });
  }

  // --- Subscriptions ---
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: any,
  ) {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
  }

  async cancelSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  // --- Refunds ---
  async createRefund(paymentIntentId: string, amount?: number) {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  }

  // --- Webhooks ---
  constructEvent(payload: string | Buffer, signature: string) {
    const webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }

  // --- Connect ---
  async createExpressAccount(email: string) {
    return this.stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
  }

  async createAccountLink(accountId: string) {
    return this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${this.configService.get('FRONTEND_URL')}/reauth`,
      return_url: `${this.configService.get('FRONTEND_URL')}/return`,
      type: 'account_onboarding',
    });
  }

  // --- Invoices ---
  async listInvoices(customerId: string) {
    return this.stripe.invoices.list({ customer: customerId });
  }

  // --- Payouts ---
  async listPayouts(accountId?: string) {
    if (accountId) {
      return this.stripe.payouts.list({}, { stripeAccount: accountId });
    }
    return this.stripe.payouts.list();
  }

  // --- Usage Based Billing ---
  async reportUsage(subscriptionItemId: string, quantity: number) {
    return (this.stripe.subscriptionItems as any).createUsageRecord(
      subscriptionItemId,
      {
        quantity,
        timestamp: 'now',
        action: 'set',
      },
    );
  }

  async getSubscriptionItem(subscriptionId: string) {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    return subscription.items.data[0].id;
  }
}
