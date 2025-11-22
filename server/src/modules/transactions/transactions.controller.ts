import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { AuthenticatedRequest } from '../../common/types/authenticated-request.interface';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

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
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.transactionsService.create(userId, createTransactionDto);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest, @Query() query: QueryTransactionDto) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.transactionsService.findAll(userId, query);
  }

  @Get('balance/:accountId')
  getBalance(
    @Param('accountId') accountId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.transactionsService.getBalance(accountId, userId);
  }

  @Get('balances')
  getAllBalances(@Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.transactionsService.getAllAccountBalances(userId);
  }

  @Get('stats')
  getStats(
    @Req() request: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.transactionsService.getStats(userId, startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.transactionsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.transactionsService.update(id, userId, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.transactionsService.remove(id, userId);
  }
}

