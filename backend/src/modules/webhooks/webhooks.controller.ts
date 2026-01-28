import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  BadRequestException,
} from '@nestjs/common';

import { StripeService } from '../stripe/stripe.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly stripeService: StripeService) {}

  @Post()
  @ApiOperation({ summary: 'Handle Stripe Webhooks' })
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
    @Res() res: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event;

    try {
      // Signature verification
      event = this.stripeService.constructEvent(
        req['rawBody'] || req.body, // In NestJS with rawBody enabled, it's in req['rawBody']
        signature,
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(
          `PaymentIntent for ${paymentIntent.amount} was successful!`,
        );
        // TODO: Update database
        break;
      case 'invoice.payment_succeeded':
        // Handle subscription payment success
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;
      // Add more cases as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
}
