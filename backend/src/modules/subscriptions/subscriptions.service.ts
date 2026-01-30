import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { StripeService } from '../stripe/stripe.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private stripeService: StripeService,
  ) { }

  async createSubscription(dto: CreateSubscriptionDto) {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('User not found');

    if (!user.stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(
        user.email,
        user.name,
      );
      user.stripeCustomerId = customer.id;
      await this.userRepository.save(user);
    }

    const subscription = await this.stripeService.createSubscription(
      user.stripeCustomerId,
      dto.priceId,
    );

    // Save subscription info in DB
    const sub = this.subscriptionRepository.create({
      stripeId: subscription.id,
      status: subscription.status,
      priceId: dto.priceId,
      user: user,
      currentPeriodEnd: new Date(
        (subscription as any).current_period_end * 1000,
      ),
    });
    await this.subscriptionRepository.save(sub);

    return {
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent
        ?.client_secret,
    };
  }

  async cancelSubscription(subscriptionId: string) {
    const sub = await this.stripeService.cancelSubscription(subscriptionId);

    // Update DB
    const dbSub = await this.subscriptionRepository.findOne({
      where: { stripeId: subscriptionId },
    });
    if (dbSub) {
      dbSub.cancelAtPeriodEnd = true;
      dbSub.status = sub.status;
      await this.subscriptionRepository.save(dbSub);
    }

    return sub;
  }

  async deleteSubscription(subscriptionId: string) {
    const sub = await this.stripeService.deleteSubscription(subscriptionId);

    // Update DB
    const dbSub = await this.subscriptionRepository.findOne({
      where: { stripeId: subscriptionId },
    });
    if (dbSub) {
      dbSub.status = sub.status; // should be 'canceled'
      await this.subscriptionRepository.save(dbSub);
    }

    return sub;
  }

  async seedPlans() {
    // Create a generic "Subscription Plan" product
    const product = await this.stripeService.createProduct(
      'Premium Membership',
      'Access to premium features',
    );

    // Create Monthly Price: 499
    const monthlyPrice = await this.stripeService.createPrice(
      product.id,
      499,
      'month',
    );

    // Create Yearly Price: 4999
    const yearlyPrice = await this.stripeService.createPrice(
      product.id,
      4999,
      'year',
    );

    return {
      product,
      monthlyPrice,
      yearlyPrice,
    };
  }

  async getAllPlans() {
    const prices = await this.stripeService.listPrices();
    // Cutoff timestamp for "now onwards" (Jan 30, 2026)
    const cutoffDate = 1769731200;

    return prices.data
      .filter((price) => {
        const amount = (price.unit_amount || 0) / 100;
        // Keep initial plans (499 and 4999) OR any plans created from today onwards
        return amount === 499 || amount === 4999 || price.created >= cutoffDate;
      })
      .map((price) => ({
        id: price.id,
        nickname: (price.product as any).name,
        amount: (price.unit_amount || 0) / 100,
        currency: price.currency,
        interval: price.recurring?.interval || 'month',
        productId: (price.product as any).id,
      }));
  }

  async getAllSubscriptions() {
    return this.subscriptionRepository.find({
      relations: ['user'],
    });
  }
}
