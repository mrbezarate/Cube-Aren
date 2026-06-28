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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { FilterTournamentDto } from './dto/filter-tournament.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

  @Get(':id')
  @ApiOperation({ summary: 'Get tournament by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tournamentsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('organizer', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create tournament (organizer only)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTournamentDto) {
    return this.tournamentsService.create(userId, dto);
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
}
