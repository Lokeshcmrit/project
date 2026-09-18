import { IsNotEmpty, IsString } from 'class-validator';

export class RescheduleRequestDto {
  @IsNotEmpty()
  @IsString()
  newStart: string;

  @IsNotEmpty()
  @IsString()
  newEnd: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class RejectRequestDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}
