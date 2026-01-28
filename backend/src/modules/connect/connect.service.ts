import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class ConnectService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private stripeService: StripeService,
  ) { }

  async createConnectAccount(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.stripeAccountId) {
      const account = await this.stripeService.createExpressAccount(user.email);
      user.stripeAccountId = account.id;
      await this.userRepository.save(user);
    }

    const accountLink = await this.stripeService.createAccountLink(user.stripeAccountId);
    return accountLink;
  }

  async getPayouts(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.stripeAccountId) throw new NotFoundException('User or Stripe account not found');

    return this.stripeService.listPayouts(user.stripeAccountId);
  }
}
