import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('Users & Roles')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Current authenticated user' })
  me(@CurrentUser() user: JwtPayload) {
    return this.users.me(user.sub);
  }

  @Get()
  @RequirePermission('users', 'view')
  @ApiOperation({ summary: 'List users (admin/hr)' })
  findAll() {
    return this.users.findAll();
  }

  @Post()
  @RequirePermission('users', 'create')
  @ApiOperation({ summary: 'Create user with bcrypt password and roles' })
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  @RequirePermission('users', 'edit')
  @ApiOperation({
    summary: 'Update user active flag, roles, password, or employee link',
  })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }
}
