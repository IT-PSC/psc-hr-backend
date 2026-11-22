import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CreateExpenseClaimDto } from './dto/expenses.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get('claims')
  @RequirePermission('benefits', 'view')
  @ApiOperation({ summary: 'List expense claims' })
  list(@CurrentUser() user: JwtPayload) {
    return this.expenses.list(user);
  }

  @Post('claims')
  @RequirePermission('benefits', 'view')
  @ApiOperation({ summary: 'Submit expense claim and open an approval' })
  create(@Body() dto: CreateExpenseClaimDto, @CurrentUser() user: JwtPayload) {
    return this.expenses.create(dto, user);
  }

  @Post('claims/:id/cancel')
  @RequirePermission('benefits', 'view')
  @ApiOperation({ summary: 'Cancel a pending or returned expense claim' })
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.expenses.cancel(id, user);
  }
}
