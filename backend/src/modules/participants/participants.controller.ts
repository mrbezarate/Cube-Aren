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
    @Body('teamName') teamName?: string,
  ) {
    return this.participantsService.join(tournamentId, userId, teamName);
  }

  @Get('participants')
  @ApiOperation({ summary: 'Get tournament participants' })
  getByTournament(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.participantsService.getByTournament(tournamentId);
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
  @ApiOperation({ summary: 'Declare tournament winner' })
  declareWinner(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.participantsService.declareWinner(tournamentId, participantId);
  }
}
