import {
  IsNumber,
  IsString,
  IsOptional,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Amount to pay in major unit (e.g. 10.50 for $10.50)',
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.5) // Stripe minimum is usually $0.50
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'usd' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'User ID requesting the payment', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'Metadata for the payment',
    example: { orderId: '123' },
    required: false,
  })
  @IsOptional()
  metadata?: any;
}
