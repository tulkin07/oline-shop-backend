import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'customer@example.com',
    description: 'Customer email or phone. Admin accounts must use POST /api/admin/auth/login.',
  })
  @ValidateIf((o: LoginDto) => !o.email)
  @IsString()
  @IsNotEmpty()
  login?: string;

  @ApiPropertyOptional({
    example: 'customer@example.com',
    description: 'Optional alias for login. Use POST /api/admin/auth/login for admins.',
  })
  @ValidateIf((o: LoginDto) => !o.login)
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Customer123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
