import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @ApiOperation({ summary: 'Create a PaymentIntent for one-time payment' })
  @ApiResponse({
    status: 201,
    description: 'PaymentIntent created successfully',
  })
  async createIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(dto);
  }

  @Post('save-card/:userId')
  @ApiOperation({
    summary: 'Create a SetupIntent to save a card for later use',
  })
  async saveCard(@Param('userId') userId: number) {
    return this.paymentsService.createSetupIntent(userId);
  }

  @Post('refund/:paymentIntentId')
  @ApiOperation({ summary: 'Refund a payment' })
  async refund(
    @Param('paymentIntentId') paymentIntentId: string,
    @Query('amount') amount?: number,
  ) {
    return this.paymentsService.refund(paymentIntentId, amount);
  }
}
