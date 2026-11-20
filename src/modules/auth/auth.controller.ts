import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto, TwoFactorVerifyDto } from './dto/two-factor.dto';
import { LoginSuccessDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Email/password login',
    description:
      'Returns tokens, or a 2FA challenge for privileged roles (demo OTP 123456).',
  })
  @ApiResponse({ status: 200, description: 'Tokens or 2FA challenge' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('2fa/verify')
  @ApiOperation({ summary: 'Complete login after 2FA challenge' })
  @ApiResponse({ status: 200, type: LoginSuccessDto })
  verify2fa(@Body() dto: TwoFactorVerifyDto) {
    return this.auth.verify2fa(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token → new access + refresh' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Invalidate refresh token(s)' })
  logout(
    @CurrentUser() user: JwtPayload,
    @Body() body: Partial<RefreshDto>,
  ) {
    return this.auth.logout(body.refreshToken, user.sub);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Current user profile (JWT)' })
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.me(user.sub);
  }

  @ApiBearerAuth()
  @Post('2fa/setup')
  @ApiOperation({ summary: 'Enable 2FA flag on account (demo)' })
  setup2fa(@CurrentUser() user: JwtPayload) {
    return this.auth.setup2fa(user.sub);
  }
}
