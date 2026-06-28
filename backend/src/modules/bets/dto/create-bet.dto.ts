import { IsString, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBetDto {
  @ApiProperty()
  @IsUUID()
  tournamentId: string;

  @ApiProperty({ description: 'Participant ID you are betting on' })
  @IsUUID()
  predictedWinnerId: string;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;
}
