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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { AuthenticatedRequest } from '../../common/types/authenticated-request.interface';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

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
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.expensesService.create(userId, createExpenseDto);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest, @Query() query: QueryExpenseDto) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.expensesService.findAll(userId, query);
  }

  @Get('stats')
  getStats(
    @Req() request: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.expensesService.getStats(userId, startDate, endDate);
  }

  @Get('monthly')
  getMonthly(
    @Req() request: AuthenticatedRequest,
    @Query('year') year?: number,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.expensesService.getMonthlyBreakdown(userId, year);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.expensesService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.expensesService.update(id, userId, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.expensesService.remove(id, userId);
  }
}

