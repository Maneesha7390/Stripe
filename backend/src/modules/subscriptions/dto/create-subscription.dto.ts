import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Stripe Price ID for the plan',
    example: 'price_123...',
  })
  @IsString()
  @IsNotEmpty()
  priceId: string;

  @ApiProperty({ description: 'User ID subscribing', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
