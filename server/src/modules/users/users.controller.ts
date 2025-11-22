import { Controller, Get, Param, ParseIntPipe, Patch, Body, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthenticatedRequest } from '../../common/types/authenticated-request.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private normalizeUserId(id: unknown): number {
    const parsed = Number(id);
    if (Number.isNaN(parsed)) {
      throw new Error('Invalid user ID');
    }
    return parsed;
  }

  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.usersService.getProfile({ id: userId });
  }

  @Patch('me')
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = this.normalizeUserId(request.user.id || request.user.sub);
    return this.usersService.update(userId, updateUserDto);
  }

  @Get(':id')
  getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getProfile({ id });
  }
}
