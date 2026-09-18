import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { DepartmentType, Severity } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateRequestDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  segmentId: string;

  @IsNotEmpty()
  @IsEnum(DepartmentType)
  reportingDepartment: DepartmentType;

  @IsArray()
  requiredDepartments: DepartmentType[];

  @IsNotEmpty()
  observedAt: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedDelayMinutes: number;

  @IsNotEmpty()
  @IsEnum(Severity)
  severity: Severity;
}
