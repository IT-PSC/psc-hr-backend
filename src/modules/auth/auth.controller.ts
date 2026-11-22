import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto, TwoFactorVerifyDto } from './dto/two-factor.dto';
import {
  AuthUserDto,
  LoginChallengeDto,
  LoginSuccessDto,
} from './dto/auth-response.dto';

@ApiTags('Authentication & Sessions')
@ApiExtraModels(LoginSuccessDto, LoginChallengeDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Email and password login (public)',
    description:
      '**Public.** No JWT. `manager` and `employee` receive `accessToken` and `refreshToken`. ' +
      '`system_admin`, `hr`, and `finance_manager` receive `requires2FA: true` and a `challengeToken` ' +
      'unless `deviceToken` matches a trusted device. Demo password `Password123!`. Demo OTP `123456`. ' +
      'Example body: `{ "email": "employee@psc.local", "password": "Password123!" }`.',
  })
  @ApiOkResponse({
    description:
      'Either a token pair (requires2FA false) or a 2FA challenge (requires2FA true).',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(LoginSuccessDto) },
        { $ref: getSchemaPath(LoginChallengeDto) },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('2fa/verify')
  @ApiOperation({
    summary: 'Complete login after a 2FA challenge (public)',
    description:
      '**Public.** Exchange the `challengeToken` from login plus the 6-digit code for tokens. ' +
      'Local demo code is `123456`. Set `rememberDevice: true` to receive a `deviceToken` valid for 30 days; ' +
      'send that token on a later login to skip 2FA. ' +
      'Example: `{ "challengeToken": "<from login>", "code": "123456", "rememberDevice": true }`.',
  })
  @ApiOkResponse({ type: LoginSuccessDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired challenge, or wrong code',
  })
  verify2fa(@Body() dto: TwoFactorVerifyDto) {
    return this.auth.verify2fa(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Rotate refresh token (public)',
    description:
      '**Public.** Send the current `refreshToken`. The server deletes it and returns a new access token and refresh token. ' +
      'Reuse of an already-rotated token fails with 401. ' +
      'Example: `{ "refreshToken": "<refreshToken from login or 2FA verify>" }`.',
  })
  @ApiOkResponse({ type: LoginSuccessDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  @ApiBody({
    type: RefreshDto,
    required: false,
    description:
      'Optional. Omit refreshToken to revoke every refresh token for the current user.',
  })
  @ApiOperation({
    summary: 'Invalidate refresh tokens',
    description:
      '**Bearer required.** Body `{ "refreshToken": "<token>" }` revokes that refresh token. ' +
      'An empty body revokes every refresh token for the signed-in user. Access tokens are not blocklisted; they expire on their own.',
  })
  @ApiOkResponse({
    description: 'Refresh token(s) removed',
    schema: { example: { ok: true } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  logout(@CurrentUser() user: JwtPayload, @Body() body: Partial<RefreshDto>) {
    return this.auth.logout(body.refreshToken, user.sub);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Current user profile',
    description:
      '**Bearer required.** Returns the user id, email, employee id, AppRole list, and name from the access token subject. ' +
      'Roles are only `system_admin`, `hr`, `finance_manager`, `manager`, and `employee`.',
  })
  @ApiOkResponse({ type: AuthUserDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.me(user.sub);
  }

  @ApiBearerAuth()
  @Post('2fa/setup')
  @ApiOperation({
    summary: 'Enable the demo 2FA flag',
    description:
      '**Bearer required.** Sets `twoFactorEnabled` on the current account. ' +
      'Until a real TOTP provider is wired, the verification code remains the demo value `123456`.',
  })
  @ApiOkResponse({
    schema: {
      example: {
        ok: true,
        message: '2FA enabled (demo OTP 123456 until TOTP is wired)',
        demoCode: '123456',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  setup2fa(@CurrentUser() user: JwtPayload) {
    return this.auth.setup2fa(user.sub);
  }
}
