import { Controller, Post, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConnectService } from './connect.service';

@ApiTags('Stripe Connect')
@Controller('connect')
export class ConnectController {
  constructor(private readonly connectService: ConnectService) {}

  @Post('onboard/:userId')
  @ApiOperation({
    summary: 'Create a Stripe Connect Express account and get onboarding link',
  })
  async onboard(@Param('userId') userId: number) {
    return this.connectService.createConnectAccount(userId);
  }

  @Get('payouts/:userId')
  @ApiOperation({ summary: 'List payouts for a Connect account' })
  async getPayouts(@Param('userId') userId: number) {
    return this.connectService.getPayouts(userId);
  }
}
