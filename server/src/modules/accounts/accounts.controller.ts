import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AuthenticatedRequest } from '../../common/types/authenticated-request.interface';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  private normalizeUserId(id: unknown): number {
    const parsed = Number(id);
    if (Number.isNaN(parsed)) {
      throw new Error('Invalid user ID');
    }
    return parsed;
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.accountsService.create(userId, createAccountDto);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.accountsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.accountsService.findOne(id, userId);
  }

  @Get(':id/balance')
  getBalance(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.accountsService.getBalance(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.accountsService.update(id, userId, updateAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.accountsService.remove(id, userId);
  }
}

