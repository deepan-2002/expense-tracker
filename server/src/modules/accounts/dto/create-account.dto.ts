import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  Length,
  Min,
} from 'class-validator';
import { AccountType } from '../entities/account.entity';

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  name: string;

  @IsNotEmpty()
  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @IsOptional()
  @IsDateString()
  openingBalanceDate?: string;
}

