import {
  IsString,
  IsEnum,
  IsNumber,
  IsInt,
  IsOptional,
  IsDateString,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TournamentGame, TournamentFormat, TournamentType, GameMode } from '../../../entities/tournament.entity';

export class CreateTournamentDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TournamentGame })
  @IsEnum(TournamentGame)
  game: TournamentGame;

  @ApiProperty({ enum: TournamentFormat })
  @IsEnum(TournamentFormat)
  format: TournamentFormat;

  @ApiProperty({ enum: TournamentType, default: TournamentType.SOLO })
  @IsOptional()
  @IsEnum(TournamentType)
  tournamentType?: TournamentType;

  @ApiProperty({ enum: GameMode, default: GameMode.FFA })
  @IsOptional()
  @IsEnum(GameMode)
  gameMode?: GameMode;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  entryFee: number;

  @ApiProperty()
  @IsInt()
  @Min(2)
  @Max(1000)
  maxParticipants: number;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rules?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.5)
  commissionRate?: number;

  @ApiProperty({ required: false, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  roundsCount?: number;

  // Для TWO_TEAM и MULTI_TEAM: сколько команд
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(16)
  teamsCount?: number;

  // Для TWO_TEAM и MULTI_TEAM: игроков в одной команде
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  teamSize?: number;
}


