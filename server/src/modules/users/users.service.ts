import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { AccountsService } from '../accounts/accounts.service';
import { AccountType } from '../accounts/entities/account.entity';

export type SanitizedUser = Omit<User, 'passwordHash' | 'hashPassword'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly categoriesService: CategoriesService,
    private readonly accountsService: AccountsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<SanitizedUser> {
    const { email } = createUserDto;
    const emailExisting = await this.findByEmail(email);
    if (emailExisting) {
      throw new ConflictException('Email Already Exists');
    }

    // Generate username from email if not provided
    let username = createUserDto.username;
    if (!username) {
      // Use email prefix as username, make it unique if needed
      const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      username = emailPrefix;
      
      // Check if username exists, append number if needed
      let counter = 1;
      let uniqueUsername = username;
      while (await this.findByUsername(uniqueUsername)) {
        uniqueUsername = `${username}${counter}`;
        counter++;
      }
      username = uniqueUsername;
    } else {
      const usernameExisting = await this.findByUsername(username);
      if (usernameExisting) {
        throw new ConflictException('Username Already Exists');
      }
    }

    const user = this.usersRepository.create({
      username,
      email,
      name: createUserDto.name,
      publicKey: createUserDto.publicKey,
      avatarUrl: createUserDto.avatarUrl,
      passwordHash: createUserDto.password,
      isVerified: createUserDto.isVerified ?? false,
    });
    try {
      const savedUser = await this.usersRepository.save(user);
      // Create default cash account for the new user
      try {
        await this.accountsService.create(savedUser.id, {
          name: 'Cash',
          type: AccountType.CASH,
          openingBalance: 0,
          openingBalanceDate: new Date().toISOString().split('T')[0],
        });
      } catch (accountError) {
        console.error('Failed to create default account:', accountError);
        // Continue even if account creation fails
      }
      // Create default categories for the new user
      await this.createDefaultCategories(savedUser.id);
      return this.toSafeUser(savedUser);
    } catch (err) {
      console.error('Error creating user:', err);
      // Log the actual error for debugging
      if (err instanceof Error) {
        console.error('Error details:', err.message, err.stack);
      }
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Error Creating User',
      );
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email, isDeleted: false, isActive: true },
    });
  }

  async findById(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id, isDeleted: false, isActive: true },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { username, isDeleted: false, isActive: true },
    });
  }

  async getProfile(user: {
    id?: number;
    username?: string;
  }): Promise<SanitizedUser> {
    if (!user.id && !user.username) {
      throw new NotFoundException();
    }
    const userData = user.id
      ? await this.findById(user.id)
      : await this.findByUsername(user.username as string);
    if (!userData) {
      throw new NotFoundException();
    }
    return this.toSafeUser(userData);
  }

  async verifyUser(email: string): Promise<SanitizedUser> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException();
    }
    user.isVerified = true;
    const updatedUser = await this.usersRepository.save(user);
    return this.toSafeUser(updatedUser);
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.passwordHash = hashedPassword;
    await this.usersRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<SanitizedUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);
    return this.toSafeUser(updatedUser);
  }

  toSafeUser(user: User): SanitizedUser {
    const safeUser = { ...user } as Partial<User>;
    delete safeUser.passwordHash;
    delete (safeUser as Record<string, unknown>).hashPassword;
    return safeUser as SanitizedUser;
  }

  private async createDefaultCategories(userId: number): Promise<void> {
    const defaultCategories = [
      { name: 'Food & Dining', icon: '🍔', color: '#ef4444' },
      { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
      { name: 'Shopping', icon: '🛍️', color: '#8b5cf6' },
      { name: 'Bills & Utilities', icon: '💳', color: '#f59e0b' },
      { name: 'Entertainment', icon: '🎬', color: '#ec4899' },
      { name: 'Healthcare', icon: '🏥', color: '#10b981' },
      { name: 'Education', icon: '📚', color: '#6366f1' },
      { name: 'Travel', icon: '✈️', color: '#06b6d4' },
      { name: 'Personal Care', icon: '👤', color: '#f97316' },
      { name: 'Gifts & Donations', icon: '🎁', color: '#84cc16' },
    ];

    try {
      await Promise.all(
        defaultCategories.map((category) =>
          this.categoriesService.create(userId, category),
        ),
      );
    } catch (error) {
      // Log error but don't fail user creation if categories fail
      console.error('Failed to create default categories:', error);
    }
  }
}
