import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Transaction } from '../transactions/entities/transaction.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  async create(userId: number, createAccountDto: CreateAccountDto) {
    const account = this.accountsRepository.create({
      ...createAccountDto,
      userId,
      openingBalance: createAccountDto.openingBalance ?? 0,
      openingBalanceDate: createAccountDto.openingBalanceDate
        ? new Date(createAccountDto.openingBalanceDate)
        : new Date(),
    });
    return await this.accountsRepository.save(account);
  }

  async findAll(userId: number) {
    return await this.accountsRepository.find({
      where: { userId, isDeleted: false },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, userId: number) {
    const account = await this.accountsRepository.findOne({
      where: { id, userId, isDeleted: false },
      relations: ['transactions'],
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async update(id: string, userId: number, updateAccountDto: UpdateAccountDto) {
    const account = await this.findOne(id, userId);
    
    if (updateAccountDto.openingBalanceDate) {
      account.openingBalanceDate = new Date(updateAccountDto.openingBalanceDate);
    }

    Object.assign(account, updateAccountDto);
    return await this.accountsRepository.save(account);
  }

  async remove(id: string, userId: number) {
    const account = await this.findOne(id, userId);
    
    // Prevent deletion of default "Cash" account
    if (account.name.toLowerCase() === 'cash' && account.type === AccountType.CASH) {
      // Check if this is the first account created (default account)
      const allAccounts = await this.accountsRepository.find({
        where: { userId, isDeleted: false },
        order: { createdAt: 'ASC' },
      });
      
      if (allAccounts.length > 0 && allAccounts[0].id === account.id) {
        throw new ForbiddenException('Cannot delete the default Cash account');
      }
    }
    
    // Check if account has any transactions
    const transactionCount = await this.transactionsRepository.count({
      where: { accountId: id, isDeleted: false },
    });
    
    if (transactionCount > 0) {
      throw new BadRequestException(
        `Cannot delete account with ${transactionCount} transaction(s). Please delete or move the transactions first.`,
      );
    }
    
    account.isDeleted = true;
    await this.accountsRepository.save(account);
    return { message: 'Account deleted successfully' };
  }

  async getBalance(accountId: string, userId: number) {
    const account = await this.findOne(accountId, userId);
    
    const { TransactionType } = await import('../transactions/entities/transaction.entity');
    const { Repository: TransactionRepository } = await import('typeorm');
    
    // We'll calculate this in the transactions service
    return {
      accountId: account.id,
      accountName: account.name,
      openingBalance: parseFloat(String(account.openingBalance || 0)),
      openingBalanceDate: account.openingBalanceDate,
    };
  }
}

