import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { RequestJoinTeamDto } from './dto/request-join-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GameType } from '../../entities/player-stats.entity';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a team (costs 400 CR)' })
  createTeam(@CurrentUser('id') userId: string, @Body() dto: CreateTeamDto) {
    return this.teamsService.createTeam(userId, dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all teams' })
  @ApiQuery({ name: 'game', required: false, enum: GameType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllTeams(
    @CurrentUser('id') userId?: string,
    @Query('game') game?: GameType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.teamsService.getAllTeams(userId, game, page, limit);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my teams' })
  getMyTeams(@CurrentUser('id') userId: string) {
    return this.teamsService.getMyTeams(userId);
  }

  @Get('requests/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending requests for captain teams' })
  getMyRequests(@CurrentUser('id') userId: string) {
    return this.teamsService.getMyJoinRequests(userId);
  }

  @Get('leaderboard/:game')
  @ApiOperation({ summary: 'Get team leaderboard by game' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLeaderboard(
    @Param('game') game: GameType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.teamsService.getLeaderboard(game, page || 1, limit || 50);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team details' })
  getTeam(@Param('id') id: string) {
    return this.teamsService.getTeam(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update team (captain only)' })
  updateTeam(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.updateTeam(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete team (captain only)' })
  deleteTeam(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.teamsService.deleteTeam(id, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request to join a team' })
  joinTeam(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RequestJoinTeamDto,
  ) {
    return this.teamsService.requestJoinTeam(id, userId, dto);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a team' })
  leaveTeam(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.teamsService.leaveTeam(id, userId);
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kick a member (captain only)' })
  kickMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser('id') captainId: string,
  ) {
    return this.teamsService.kickMember(id, captainId, targetUserId);
  }

  @Post(':id/requests/:requestId/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve join request (captain only)' })
  approveRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser('id') captainId: string,
  ) {
    return this.teamsService.approveJoinRequest(id, requestId, captainId);
  }

  @Post(':id/requests/:requestId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject join request (captain only)' })
  rejectRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser('id') captainId: string,
  ) {
    return this.teamsService.rejectJoinRequest(id, requestId, captainId);
  }
}
