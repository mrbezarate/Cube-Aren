import { Controller, Get, Post, Query, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current user balance' })
  async getBalance(@CurrentUser('id') userId: string) {
    const credits = await this.walletService.getBalance(userId);
    return { credits };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  getTransactions(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.walletService.getTransactions(userId, page ? Number(page) : 1, limit ? Number(limit) : 10);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit credits (Demo/Mock)' })
  async depositDemo(@CurrentUser('id') userId: string, @Body('amount') amount?: number) {
    const tx = await this.walletService.depositDemo(userId, amount ? Number(amount) : 1000);
    return { message: 'Deposit successful', transaction: tx };
  }
}
