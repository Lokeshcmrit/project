import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  usernameOrEmployeeId: string; // Supports either email or employeeId

  @IsNotEmpty()
  @IsString()
  password: string;
}
