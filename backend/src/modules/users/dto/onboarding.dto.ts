import { IsString, IsArray, IsOptional } from 'class-validator';

export class OnboardingDto {
  @IsString()
  role: string;

  @IsOptional()
  @IsArray()
  games?: string[];

  @IsOptional()
  @IsArray()
  goals?: string[];
}
