import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { GameType } from '../../../entities/player-stats.entity';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Team name must be at least 3 characters' })
  @MaxLength(30, { message: 'Team name must be at most 30 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tag must be at least 2 characters' })
  @MaxLength(5, { message: 'Tag must be at most 5 characters' })
  @Matches(/^[A-Z0-9]+$/, { message: 'Tag can only contain uppercase letters and numbers' })
  tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsEnum(GameType, { message: 'Invalid game type' })
  game: GameType;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsEnum(GameType, { each: true, message: 'Invalid supported game' })
  supportedGames?: GameType[];

  @IsOptional()
  @IsString()
  @MaxLength(240)
  joinMessage?: string;
}
