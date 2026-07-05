import { IsString, IsNumber, IsUUID, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBetDto {
  @ApiProperty()
  @IsUUID()
  tournamentId: string;

  @ApiProperty({ description: 'Participant ID you are betting on (optional if matchId provided)', required: false })
  @IsOptional()
  @IsUUID()
  predictedWinnerId?: string;

  @ApiProperty({ description: 'Match ID you are betting on (optional)', required: false })
  @IsOptional()
  @IsUUID()
  matchId?: string;

  @ApiProperty({ description: 'Side of team you are betting on: 1 or 2 (optional)', required: false })
  @IsOptional()
  @IsNumber()
  predictedSide?: number;

  @ApiProperty({ description: 'Team slot you are betting on (optional)', required: false })
  @IsOptional()
  @IsNumber()
  predictedTeamSlot?: number;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;
}
