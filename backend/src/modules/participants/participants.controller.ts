import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ParticipantsService } from './participants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ParticipantStatus } from '../../entities/participant.entity';

@ApiTags('Participants')
@Controller('tournaments/:tournamentId')
export class ParticipantsController {
  constructor(private participantsService: ParticipantsService) {}

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a tournament' })
  join(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @CurrentUser('id') userId: string,
    @Body('teamSlot') teamSlot?: number,
    @Body('teamLabel') teamLabel?: string,
    @Body('clanId') clanId?: string,
  ) {
    return this.participantsService.join(tournamentId, userId, {
      teamSlot: teamSlot ? Number(teamSlot) : undefined,
      teamLabel,
      clanId,
    });
  }

  @Get('participants')
  @ApiOperation({ summary: 'Get tournament participants' })
  getByTournament(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.participantsService.getByTournament(tournamentId);
  }

  @Get('participants/grouped')
  @ApiOperation({ summary: 'Get participants grouped by team slot (for team modes)' })
  getByTournamentGrouped(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.participantsService.getByTournamentGrouped(tournamentId);
  }

  @Put('participants/:participantId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update participant status' })
  updateStatus(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Body('status') status: ParticipantStatus,
    @Body('placement') placement?: number,
  ) {
    return this.participantsService.updateStatus(tournamentId, participantId, status, placement);
  }

  @Post('winner/:participantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Declare tournament winner (legacy)' })
  declareWinnerLegacy(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.participantsService.declareWinner(tournamentId, {
      winnerParticipantId: participantId,
    });
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete tournament and declare winner (solo or team)' })
  declareWinnerGeneric(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Body('winnerParticipantId') winnerParticipantId?: string,
    @Body('winnerTeamSlot') winnerTeamSlot?: number,
  ) {
    return this.participantsService.declareWinner(tournamentId, {
      winnerParticipantId,
      winnerTeamSlot: winnerTeamSlot !== undefined && winnerTeamSlot !== null ? Number(winnerTeamSlot) : undefined,
    });
  }
}
