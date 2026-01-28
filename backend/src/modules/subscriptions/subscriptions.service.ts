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
  ) {}

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
}
