import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, ILike } from 'typeorm';
import { Expense, PaymentMethod } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
  ) {}

  async create(userId: number, createExpenseDto: CreateExpenseDto) {
    const expense = this.expensesRepository.create({
      ...createExpenseDto,
      userId,
      date: new Date(createExpenseDto.date),
    });
    return await this.expensesRepository.save(expense);
  }

  async findAll(userId: number, query: QueryExpenseDto) {
    const { page = 1, limit = 10, startDate, endDate, categoryId, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.date = Between(new Date(startDate), new Date());
    } else if (endDate) {
      where.date = Between(new Date('1970-01-01'), new Date(endDate));
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.description = ILike(`%${search}%`);
    }

    const [expenses, total] = await this.expensesRepository.findAndCount({
      where,
      relations: ['category'],
      order: { date: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: number) {
    const expense = await this.expensesRepository.findOne({
      where: { id, userId },
      relations: ['category'],
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async update(id: string, userId: number, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.findOne(id, userId);
    
    if (updateExpenseDto.date) {
      expense.date = new Date(updateExpenseDto.date);
      delete updateExpenseDto.date;
    }

    Object.assign(expense, updateExpenseDto);
    return await this.expensesRepository.save(expense);
  }

  async remove(id: string, userId: number) {
    const expense = await this.findOne(id, userId);
    await this.expensesRepository.remove(expense);
    return { message: 'Expense deleted successfully' };
  }

  async getStats(userId: number, startDate?: string, endDate?: string) {
    const queryBuilder = (qb: any) => {
      qb.where('expense.userId = :userId', { userId });
      if (startDate && endDate) {
        qb.andWhere('expense.date BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      } else if (startDate) {
        qb.andWhere('expense.date >= :startDate', { startDate });
      } else if (endDate) {
        qb.andWhere('expense.date <= :endDate', { endDate });
      }
    };

    // Total expenses
    const totalQb = this.expensesRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total');
    queryBuilder(totalQb);
    const totalResult = await totalQb.getRawOne();
    const total = parseFloat(totalResult?.total || '0');

    // Expenses by category
    const byCategoryQb = this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoin('expense.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('category.icon', 'categoryIcon')
      .addSelect('category.color', 'categoryColor')
      .addSelect('SUM(expense.amount)', 'total')
      .addSelect('COUNT(expense.id)', 'count');
    queryBuilder(byCategoryQb);
    byCategoryQb
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.icon')
      .addGroupBy('category.color');
    const byCategory = await byCategoryQb.getRawMany();

    // Expenses by payment method
    const byPaymentMethodQb = this.expensesRepository
      .createQueryBuilder('expense')
      .select('expense.paymentMethod', 'paymentMethod')
      .addSelect('SUM(expense.amount)', 'total')
      .addSelect('COUNT(expense.id)', 'count');
    queryBuilder(byPaymentMethodQb);
    byPaymentMethodQb.groupBy('expense.paymentMethod');
    const byPaymentMethod = await byPaymentMethodQb.getRawMany();

    return {
      total,
      byCategory: byCategory.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName || 'Uncategorized',
        categoryIcon: item.categoryIcon,
        categoryColor: item.categoryColor,
        total: parseFloat(item.total || '0'),
        count: parseInt(item.count || '0'),
      })),
      byPaymentMethod: byPaymentMethod.map((item) => ({
        paymentMethod: item.paymentMethod,
        total: parseFloat(item.total || '0'),
        count: parseInt(item.count || '0'),
      })),
    };
  }

  async getMonthlyBreakdown(userId: number, year?: number) {
    const currentYear = year || new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const monthly = await this.expensesRepository
      .createQueryBuilder('expense')
      .select('EXTRACT(MONTH FROM expense.date)', 'month')
      .addSelect('SUM(expense.amount)', 'total')
      .addSelect('COUNT(expense.id)', 'count')
      .where('expense.userId = :userId', { userId })
      .andWhere('expense.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('EXTRACT(MONTH FROM expense.date)')
      .orderBy('month', 'ASC')
      .getRawMany();

    return monthly.map((item) => ({
      month: parseInt(item.month),
      total: parseFloat(item.total || '0'),
      count: parseInt(item.count || '0'),
    }));
  }
}

