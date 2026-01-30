import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { StripeService } from '../stripe/stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private stripeService: StripeService,
  ) { }

  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('User not found');

    // Create Stripe Customer if not exists
    if (!user.stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(
        user.email,
        user.name,
      );
      user.stripeCustomerId = customer.id;
      await this.userRepository.save(user);
    }

    // Merge metadata
    const stripeMetadata = {
      ...(dto.metadata || {}),
      order_id: dto.order_id || 'NOT_PROVIDED',
      subscriptionPlanId: dto.subscriptionPlanId || 'NONE',
    };

    const intent = await this.stripeService.createPaymentIntent(
      dto.amount,
      dto.currency,
      user.stripeCustomerId,
      stripeMetadata,
    );

    // Save initial payment record
    const payment = this.paymentRepository.create({
      stripeId: intent.id,
      amount: dto.amount,
      currency: dto.currency,
      status: intent.status,
      user: user,
      order_id: dto.order_id, // Can be null in DB
      subscriptionPlanId: dto.subscriptionPlanId,
      metadata: JSON.stringify(stripeMetadata),
    });
    await this.paymentRepository.save(payment);

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    };
  }

  async createSetupIntent(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(
        user.email,
        user.name,
      );
      user.stripeCustomerId = customer.id;
      await this.userRepository.save(user);
    }

    const intent = await this.stripeService.createSetupIntent(
      user.stripeCustomerId,
    );

    return {
      clientSecret: intent.client_secret,
      setupIntentId: intent.id,
    };
  }

  async refund(paymentIntentId: string, amount?: number) {
    const refund = await this.stripeService.createRefund(
      paymentIntentId,
      amount,
    );

    // Update payment record status in DB
    const payment = await this.paymentRepository.findOne({
      where: { stripeId: paymentIntentId },
    });
    if (payment) {
      payment.status = 'refunded';
      await this.paymentRepository.save(payment);
    }

    return refund;
  }
}
