import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { User } from '../users/entities/user.entity';
import { Account } from '../accounts/entities/account.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  async create(userId: number, createTransactionDto: CreateTransactionDto) {
    const transaction = this.transactionsRepository.create({
      ...createTransactionDto,
      userId,
      accountId: createTransactionDto.accountId,
      date: new Date(createTransactionDto.date),
    });
    return await this.transactionsRepository.save(transaction);
  }

  async findAll(userId: number, query: QueryTransactionDto) {
    const { page = 1, limit = 10, startDate, endDate, accountId, categoryId, search, transactionType } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId, isDeleted: false };

    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.date = Between(new Date(startDate), new Date());
    } else if (endDate) {
      where.date = Between(new Date('1970-01-01'), new Date(endDate));
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (transactionType) {
      where.transactionType = transactionType;
    }

    if (search) {
      where.description = ILike(`%${search}%`);
    }

        const [transactions, total] = await this.transactionsRepository.findAndCount({
          where,
          relations: ['category', 'account'],
          order: { date: 'DESC', createdAt: 'DESC' },
          skip,
          take: limit,
        });

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: number) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id, userId, isDeleted: false },
      relations: ['category'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(id: string, userId: number, updateTransactionDto: UpdateTransactionDto) {
    const transaction = await this.findOne(id, userId);
    
    if (updateTransactionDto.date) {
      transaction.date = new Date(updateTransactionDto.date);
      delete updateTransactionDto.date;
    }

    Object.assign(transaction, updateTransactionDto);
    return await this.transactionsRepository.save(transaction);
  }

  async remove(id: string, userId: number) {
    const transaction = await this.findOne(id, userId);
    transaction.isDeleted = true;
    await this.transactionsRepository.save(transaction);
    return { message: 'Transaction deleted successfully' };
  }

  async getBalance(accountId: string, userId: number) {
    const account = await this.accountsRepository.findOne({
      where: { id: accountId, userId, isDeleted: false },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const openingBalance = parseFloat(String(account.openingBalance || 0));
    let openingBalanceDate: Date | null = null;
    
    // Handle openingBalanceDate - it might be a Date object or a string
    if (account.openingBalanceDate) {
      if (account.openingBalanceDate instanceof Date) {
        openingBalanceDate = account.openingBalanceDate;
      } else if (typeof account.openingBalanceDate === 'string') {
        openingBalanceDate = new Date(account.openingBalanceDate);
      }
    }

    // Build query for transactions after opening balance date
    const queryBuilder = this.transactionsRepository
      .createQueryBuilder('transaction')
      .where('transaction.accountId = :accountId', { accountId })
      .andWhere('transaction.isDeleted = :isDeleted', { isDeleted: false });

    if (openingBalanceDate && !isNaN(openingBalanceDate.getTime())) {
      queryBuilder.andWhere('transaction.date >= :openingBalanceDate', {
        openingBalanceDate: openingBalanceDate.toISOString().split('T')[0],
      });
    }

    const totalCreditResult = await queryBuilder
      .clone()
      .andWhere('transaction.transactionType = :type', { type: TransactionType.CREDIT })
      .select('COALESCE(SUM(transaction.amount), 0)', 'totalCredit')
      .getRawOne();
    const totalCredit = parseFloat(totalCreditResult?.totalCredit || '0');

    const totalDebitResult = await queryBuilder
      .clone()
      .andWhere('transaction.transactionType = :type', { type: TransactionType.DEBIT })
      .select('COALESCE(SUM(transaction.amount), 0)', 'totalDebit')
      .getRawOne();
    const totalDebit = parseFloat(totalDebitResult?.totalDebit || '0');

    const balance = openingBalance + totalCredit - totalDebit;

    return {
      accountId: account.id,
      accountName: account.name,
      openingBalance,
      openingBalanceDate: openingBalanceDate && !isNaN(openingBalanceDate.getTime())
        ? openingBalanceDate.toISOString().split('T')[0]
        : undefined,
      totalCredit,
      totalDebit,
      balance,
    };
  }

  async getAllAccountBalances(userId: number) {
    const accounts = await this.accountsRepository.find({
      where: { userId, isDeleted: false },
    });

    const balances = await Promise.allSettled(
      accounts.map((account) => this.getBalance(account.id, userId)),
    );

    // Filter out failed balance calculations and return successful ones
    return balances
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to get balance for account ${accounts[index].id}:`, result.reason);
          // Return a default balance structure for failed accounts
          const account = accounts[index];
          let openingBalanceDate: string | undefined = undefined;
          
          if (account.openingBalanceDate) {
            if (account.openingBalanceDate instanceof Date) {
              openingBalanceDate = account.openingBalanceDate.toISOString().split('T')[0];
            } else {
              const dateStr = String(account.openingBalanceDate);
              openingBalanceDate = dateStr.split('T')[0];
            }
          }
          
          return {
            accountId: account.id,
            accountName: account.name,
            openingBalance: parseFloat(String(account.openingBalance || 0)),
            openingBalanceDate,
            totalCredit: 0,
            totalDebit: 0,
            balance: parseFloat(String(account.openingBalance || 0)),
          };
        }
      })
      .filter(Boolean);
  }

  async getStats(userId: number, startDate?: string, endDate?: string) {
    const queryBuilder = (qb: any) => {
      qb.where('transaction.userId = :userId', { userId })
        .andWhere('transaction.isDeleted = false');
      if (startDate && endDate) {
        qb.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      } else if (startDate) {
        qb.andWhere('transaction.date >= :startDate', { startDate });
      } else if (endDate) {
        qb.andWhere('transaction.date <= :endDate', { endDate });
      }
    };

    // Total credits
    const creditsQb = this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount), 0)', 'total')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.transactionType = :type', { type: TransactionType.CREDIT })
      .andWhere('transaction.isDeleted = false');
    if (startDate && endDate) {
      creditsQb.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }
    const creditsResult = await creditsQb.getRawOne();
    const credits = parseFloat(creditsResult?.total || '0');

    // Total debits
    const debitsQb = this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount), 0)', 'total')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.transactionType = :type', { type: TransactionType.DEBIT })
      .andWhere('transaction.isDeleted = false');
    if (startDate && endDate) {
      debitsQb.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }
    const debitsResult = await debitsQb.getRawOne();
    const debits = parseFloat(debitsResult?.total || '0');

    // Transactions by category
    const byCategoryQb = this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('category.icon', 'categoryIcon')
      .addSelect('category.color', 'categoryColor')
      .addSelect('transaction.transactionType', 'transactionType')
      .addSelect('SUM(transaction.amount)', 'total')
      .addSelect('COUNT(transaction.id)', 'count');
    queryBuilder(byCategoryQb);
    byCategoryQb
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.icon')
      .addGroupBy('category.color')
      .addGroupBy('transaction.transactionType');
    const byCategory = await byCategoryQb.getRawMany();

    // Transactions by payment method
    const byPaymentMethodQb = this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('transaction.paymentMethod', 'paymentMethod')
      .addSelect('transaction.transactionType', 'transactionType')
      .addSelect('SUM(transaction.amount)', 'total')
      .addSelect('COUNT(transaction.id)', 'count');
    queryBuilder(byPaymentMethodQb);
    byPaymentMethodQb
      .groupBy('transaction.paymentMethod')
      .addGroupBy('transaction.transactionType');
    const byPaymentMethod = await byPaymentMethodQb.getRawMany();

    return {
      totalCredit: credits,
      totalDebit: debits,
      byCategory: byCategory.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName || 'Uncategorized',
        categoryIcon: item.categoryIcon,
        categoryColor: item.categoryColor,
        transactionType: item.transactionType,
        total: parseFloat(item.total || '0'),
        count: parseInt(item.count || '0'),
      })),
      byPaymentMethod: byPaymentMethod.map((item) => ({
        paymentMethod: item.paymentMethod,
        transactionType: item.transactionType,
        total: parseFloat(item.total || '0'),
        count: parseInt(item.count || '0'),
      })),
    };
  }
}

