/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Cache } from 'cache-manager';
import Redis from 'ioredis';

import {
  LOGIN_ATTEMPTS_LIMIT,
  LOGIN_ATTEMPTS_TIMEOUT,
} from '@constants/settings';
import { UsersService } from '@modules/auth/services/users.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  private loginAttemptsLimit = 5;
  private readonly redis: Redis;
  constructor(
    @Inject(CACHE_MANAGER) private cacheService: Cache,

    private configService: ConfigService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {
    this.loginAttemptsLimit = this.configService.get<number>(
      LOGIN_ATTEMPTS_LIMIT,
      5,
    );
  }

  async register(user: any): Promise<any> {
    const existingUser = await this.usersService.findByUserNameForLogin(
      user.username,
    );
    if (existingUser) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['Username already exists'],
        error: 'Bad Request',
      });
    }
    const newUser = await this.usersService.create(user);

    return {
      id: newUser.id,
      username: newUser.username,
    };
  }

  async login(username: string, password: string): Promise<any> {
    console.log('Login attempt for user:', username);

    // Check failed attempts
    const failedAttempts = await this.getLoginAttempts(username);

    console.log('Failed attempts:', failedAttempts);

    if (failedAttempts >= this.loginAttemptsLimit) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: ['Too many failed attempts'],
        error: 'Unauthorized',
      });
    }

    const user = await this.usersService.findByUserNameForLogin(username);
    if (user?.password !== password) {
      // Increment login attempts
      await this.incrementLoginAttempts(username);

      throw new UnauthorizedException({
        statusCode: 401,
        message: [
          'Invalid username or password',
          'You have ' +
            (this.loginAttemptsLimit - failedAttempts) +
            ' attempts left',
        ],
        error: 'Unauthorized',
      });
    }
    return {
      loggedInUser: {
        ...user,

        roles: user.roles?.map((role: Role) => ({
          id: role.id,
          code: role.code,
          name: role.name,
          description: role.description,
        })),
        password: undefined,
        refreshToken: undefined,
      },
      access_token: this.generateToken(user),
      refresh_token: await this.generateRefreshToken(user.id),
    };
  }

  async signOut(user: any) {
    await this.usersService.update(user.id, {
      refreshToken: null,
    });
  }

  generateToken(user: User) {
    const payload = {
      id: user.id,
      username: user.username,
      sub: user.id,
      application: 'Online Shop - API',
      roles: user.roles?.map((role: Role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      })),
    };

    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }
    const refreshToken = await this.jwtService.signAsync(
      {
        id,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      },
    );
    await this.usersService.update(id, {
      refreshToken: refreshToken,
    });

    return refreshToken;
  }

  async verifyRefreshToken(refreshToken: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
      const { id } = decoded;

      const user = await this.usersService.findOne(id);

      console.log(user);

      if (!user) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: ['Invalid refresh token'],
          error: 'Unauthorized',
        });
      }

      console.log('User refresh token:', user.refreshToken);
      console.log('Provided refresh token:', refreshToken);

      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: ['Invalid refresh token'],
          error: 'Unauthorized',
        });
      }
      return {
        loggedInUser: {
          ...user,

          roles: user.roles.map((r: any) => ({
            id: r.id,
            name: r.name,
          })),
          password: undefined,
          refreshToken: undefined,
        },
        access_token: this.generateToken(user),
        refresh_token: await this.generateRefreshToken(user.id),
      };
    } catch (error) {
      throw new UnauthorizedException(error.response || error.message);
    }
  }

  // Reset login attempts for a user
  async resetLoginAttempts(username: string): Promise<void> {
    const key = `LOGIN-FAILED:${username}`;
    const attempts = await this.redis.get(key);
    if (!attempts) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: ['No login attempts found'],
        error: 'Unauthorized',
      });
    }
    if (parseInt(attempts, 10) < 5) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: ['Login attempts are less than 5'],
        error: 'Unauthorized',
      });
    }
    // Reset login attempts
    await this.cacheService.del(key);
  }

  async incrementLoginAttempts(username: string): Promise<number> {
    const key = `LOGIN-FAILED:${username}`;
    const attempts = await this.getLoginAttempts(username);
    // Increment login attempts
    // Set expiration time for login attempts
    // If attempts is 0, set expiration time to 5 minutes

    const timeout = this.configService.get<number>(
      LOGIN_ATTEMPTS_TIMEOUT,
      10000,
    ); // 10 seconds
    if (attempts === 0) {
      await this.cacheService.set(key, 1, timeout);
      return 1;
    }

    await this.cacheService.set(key, attempts + 1, timeout);

    return attempts;
  }

  async getLoginAttempts(username: string): Promise<number> {
    const key = `LOGIN-FAILED:${username}`;
    const attempts = (await this.cacheService.get(key)) as string;
    if (!attempts) {
      return 0;
    }
    // If attempts are not a number, return 0
    if (isNaN(parseInt(attempts, 10))) {
      return 0;
    }
    // If attempts are a number, return it
    return attempts ? parseInt(attempts, 10) : 0;
  }
}
