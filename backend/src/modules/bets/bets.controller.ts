import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BetsService } from './bets.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Bets')
@Controller('bets')
export class BetsController {
  constructor(private betsService: BetsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place a bet' })
  placeBet(@CurrentUser('id') userId: string, @Body() dto: CreateBetDto) {
    return this.betsService.placeBet(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user bets' })
  getMyBets(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.betsService.getMyBets(userId, page ? Number(page) : 1, limit ? Number(limit) : 10);
  }

  @Get('tournament/:tournamentId')
  @ApiOperation({ summary: 'Get all bets for a tournament' })
  getTournamentBets(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.betsService.getTournamentBets(tournamentId);
  }

  @Get('tournament/:tournamentId/odds')
  @ApiOperation({ summary: 'Get odds for a tournament' })
  getOdds(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.betsService.getOdds(tournamentId);
  }
}
