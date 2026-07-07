/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ApiUnauthorizedResponseOptions } from '@common/open-api';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { ApiKey } from '../decorators/api-key.decorator';
import { HttpBasic } from '../decorators/http-basic.decorator';
import { Public } from '../decorators/public.decorator';
import { LoginDto, RegisterDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { LoginOkSchema } from '../schemas/login.schema';
import { AuthService } from '../services/auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'User registration' })
  @ApiOkResponse({
    description: 'User registered successfully',
    schema: LoginOkSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Username already exists' })
  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() user: RegisterDto) {
    return this.authService.register(user);
  }

  @ApiOperation({ summary: 'User login' })
  @ApiOkResponse({
    description: 'Login successful',
    schema: LoginOkSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @UseGuards(ThrottlerGuard)
  @Public()
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }

  @ApiOperation({ summary: 'User logout' })
  @ApiOkResponse({ description: 'Logout successful' })
  @ApiBearerAuth()
  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  async signOut(@Request() req: any) {
    await this.authService.signOut(req.user);
    return { message: 'Logged out successfully' };
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({ schema: LoginOkSchema })
  @ApiUnauthorizedResponse(ApiUnauthorizedResponseOptions())
  @Public()
  @Post('/refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.verifyRefreshToken(refreshTokenDto.refresh_token);
  }

  @ApiOperation({ summary: 'Reset login attempts' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Login attempts reset successfully' })
  @ApiUnauthorizedResponse(ApiUnauthorizedResponseOptions())
  @Get('/reset-login-attempts')
  async resetLoginAttempts(@Request() req: any) {
    return this.authService.resetLoginAttempts(req.user.username);
  }

  @ApiOperation({ summary: 'Get user profile' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'User profile retrieved successfully' })
  @Get('/profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @ApiOperation({ summary: 'Test API key authentication' })
  @ApiKey()
  @ApiOkResponse({ description: 'API key is valid' })
  @ApiUnauthorizedResponse({ description: 'Invalid API key' })
  @Get('/api-key-test')
  apiKey() {
    return { success: true };
  }

  @ApiOperation({ summary: 'Test HTTP Basic authentication' })
  @HttpBasic()
  @ApiOkResponse({ description: 'Basic auth successful' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Get('/basic-auth-test')
  basic() {
    return { success: true };
  }
}
