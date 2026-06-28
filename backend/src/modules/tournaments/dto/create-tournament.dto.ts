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
import { TournamentGame, TournamentFormat } from '../../../entities/tournament.entity';

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
}
