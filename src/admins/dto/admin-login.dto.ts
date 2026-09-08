import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @ValidateIf((o: AdminLoginDto) => !o.login)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'admin@example.com',
    description: 'Alias for email',
  })
  @ValidateIf((o: AdminLoginDto) => !o.email)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  login?: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
