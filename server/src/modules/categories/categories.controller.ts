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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthenticatedRequest } from '../../common/types/authenticated-request.interface';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

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
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.categoriesService.create(userId, createCategoryDto);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.categoriesService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.categoriesService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.categoriesService.update(id, userId, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.categoriesService.remove(id, userId);
  }
}

