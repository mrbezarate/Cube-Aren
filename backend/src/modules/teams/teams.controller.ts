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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get team details' })
  getTeam(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.teamsService.getTeam(id, userId);
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
  @ApiOperation({ summary: 'Kick a member (captain or vice captain)' })
  kickMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser('id') kickerId: string,
  ) {
    return this.teamsService.kickMember(id, kickerId, targetUserId);
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

  @Put(':id/members/:userId/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a member role (captain only)' })
  updateMemberRole(
    @Param('id') teamId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser('id') captainId: string,
    @Body('role') role: string,
  ) {
    return this.teamsService.updateMemberRole(teamId, captainId, targetUserId, role);
  }

  @Post(':id/logo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/team-logos',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Разрешены только файлы изображений формата PNG, JPEG, JPG или GIF'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiOperation({ summary: 'Upload team logo (captain/mods only)' })
  async uploadLogo(
    @Param('id') teamId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }
    const logoUrl = `/api/uploads/team-logos/${file.filename}`;
    return this.teamsService.updateTeamLogo(teamId, userId, logoUrl);
  }

  @Post(':id/banner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/team-banners',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Разрешены только файлы изображений формата PNG, JPEG, JPG или GIF'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiOperation({ summary: 'Upload team banner (captain/mods only)' })
  async uploadBanner(
    @Param('id') teamId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }
    const bannerUrl = `/api/uploads/team-banners/${file.filename}`;
    return this.teamsService.updateTeamBanner(teamId, userId, bannerUrl);
  }
}
