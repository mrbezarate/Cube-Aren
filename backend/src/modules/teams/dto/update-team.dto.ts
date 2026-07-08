import { IsString, IsOptional, IsBoolean, MinLength, MaxLength, Matches, IsArray } from 'class-validator';
import { GameType } from '../../../entities/player-stats.entity';

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  flag?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(5)
  @Matches(/^[A-Z0-9]+$/, { message: 'Tag can only contain uppercase letters and numbers' })
  tag?: string;

  @IsOptional()
  @IsBoolean()
  isRecruiting?: boolean;

  @IsOptional()
  @IsArray()
  supportedGames?: GameType[];
}
