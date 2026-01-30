import { Controller, Post, Body, Param, Delete, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) { }

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

  @Delete(':subscriptionId')
  @ApiOperation({ summary: 'Delete (immediately cancel) a subscription' })
  async delete(@Param('subscriptionId') subscriptionId: string) {
    return this.subscriptionsService.deleteSubscription(subscriptionId);
  }

  @Post('seed-plans')
  @ApiOperation({ summary: 'Seed 499/monthly and 4999/yearly plans' })
  async seedPlans() {
    return this.subscriptionsService.seedPlans();
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans from Stripe' })
  async getPlans() {
    return this.subscriptionsService.getAllPlans();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all user subscriptions from DB' })
  async getAll() {
    return this.subscriptionsService.getAllSubscriptions();
  }
}
