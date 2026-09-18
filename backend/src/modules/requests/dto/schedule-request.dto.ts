import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ScheduleRequestDto {
  @IsNotEmpty()
  @IsString()
  scheduledStart: string;

  @IsNotEmpty()
  @IsString()
  scheduledEnd: string;

  @IsNotEmpty()
  @IsString()
  assignedCrewId: string;

  @IsOptional()
  @IsString()
  possessionType?: string;
}
