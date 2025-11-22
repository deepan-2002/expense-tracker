import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(userId: number, createCategoryDto: CreateCategoryDto) {
    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      userId,
    });
    return await this.categoriesRepository.save(category);
  }

  async findAll(userId: number) {
    return await this.categoriesRepository.find({
      where: { userId },
      relations: ['expenses'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, userId: number) {
    const category = await this.categoriesRepository.findOne({
      where: { id, userId },
      relations: ['expenses'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, userId: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id, userId);
    Object.assign(category, updateCategoryDto);
    return await this.categoriesRepository.save(category);
  }

  async remove(id: string, userId: number) {
    const category = await this.findOne(id, userId);
    await this.categoriesRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }
}

