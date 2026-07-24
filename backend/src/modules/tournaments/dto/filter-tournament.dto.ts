import { IsOptional, IsEnum, IsString, IsNumber, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TournamentFormat, TournamentStatus, TournamentType } from '../../../entities/tournament.entity';
import { GameType } from '../../../entities/player-stats.entity';

export class FilterTournamentDto {
  @IsOptional()
  @IsEnum(GameType)
  game?: GameType;

  @IsOptional()
  @IsEnum(TournamentFormat)
  format?: TournamentFormat;

  @IsOptional()
  @IsEnum(TournamentType)
  tournamentType?: TournamentType;

  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxEntryFee?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'prizePool' | 'startDate' | 'entryFee' | 'currentParticipants' | 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
