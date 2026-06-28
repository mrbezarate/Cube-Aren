import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestJoinTeamDto {
  @IsOptional()
  @IsString()
  @MaxLength(240)
  message?: string;
}
