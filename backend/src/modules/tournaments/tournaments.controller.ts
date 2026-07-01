import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { FilterTournamentDto } from './dto/filter-tournament.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TournamentStatus } from '../../entities/tournament.entity';

@ApiTags('Tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private tournamentsService: TournamentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tournaments with filters' })
  findAll(@Query() filters: FilterTournamentDto) {
    return this.tournamentsService.findAll(filters);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured/top tournaments' })
  findFeatured() {
    return this.tournamentsService.findFeatured();
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get saved tournaments for current user' })
  getSaved(@CurrentUser('id') userId: string) {
    return this.tournamentsService.getSavedTournaments(userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get tournament by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId?: string,
  ) {
    await this.tournamentsService.incrementViews(id);
    const tournament = await this.tournamentsService.findOne(id);
    const isSaved = userId
      ? await this.tournamentsService.isTournamentSaved(userId, id)
      : false;
    return { ...tournament, isSaved };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create tournament (all users can create with limits)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTournamentDto) {
    return this.tournamentsService.create(userId, dto);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save tournament to bookmarks' })
  saveTournament(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tournamentsService.saveTournament(userId, id);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track tournament view' })
  async trackView(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.tournamentsService.trackTournamentView(userId, id);
    return { message: 'Просмотр зафиксирован' };
  }

  @Delete(':id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove tournament from bookmarks' })
  unsaveTournament(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tournamentsService.unsaveTournament(userId, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tournament' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<CreateTournamentDto>,
  ) {
    return this.tournamentsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete tournament' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.tournamentsService.delete(id, userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tournament status' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body('status') status: TournamentStatus,
  ) {
    return this.tournamentsService.updateStatus(id, status, userId);
  }

  @Patch(':id/feature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set tournament as featured (admin only)' })
  setFeatured(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('order') order: number,
  ) {
    return this.tournamentsService.setFeatured(id, order);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report organizer for tournament issues' })
  reportOrganizer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason: string,
    @Body('description') description?: string,
  ) {
    return this.tournamentsService.reportOrganizer(userId, id, reason, description);
  }

  @Get('organizer/:id/stats')
  @ApiOperation({ summary: 'Get organizer statistics' })
  getOrganizerStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.tournamentsService.getOrganizerStats(id);
  }
}
