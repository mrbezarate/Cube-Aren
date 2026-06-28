import { IsString, IsArray, IsOptional, IsEnum, ArrayMinSize, IsNotEmpty } from 'class-validator';
import { GameType } from '../../../entities/user.entity';

export enum OnboardingGame {
  CS2 = 'cs2',
  DOTA2 = 'dota2',
  VALORANT = 'valorant',
  LOL = 'lol',
  PUBG = 'pubg',
  APEX = 'apex',
  CUSTOM = 'custom',
}

export enum OnboardingGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export class OnboardingDto {
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one game must be selected' })
  @IsEnum(OnboardingGame, { each: true, message: 'Invalid game selection' })
  games: string[];

  @IsOptional()
  @IsEnum(OnboardingGender, { message: 'Invalid gender selection' })
  gender?: string;

  @IsEnum(GameType, { message: 'Invalid main game selection' })
  mainGame: GameType;

  @IsOptional()
  @IsString()
  source?: string;
}
