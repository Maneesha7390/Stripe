import { Controller, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new subscription for a user' })
  async create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(dto);
  }

  @Delete('cancel/:subscriptionId')
  @ApiOperation({ summary: 'Cancel a subscription at the end of the period' })
  async cancel(@Param('subscriptionId') subscriptionId: string) {
    return this.subscriptionsService.cancelSubscription(subscriptionId);
  }
}
