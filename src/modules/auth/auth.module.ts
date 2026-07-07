import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './controllers/auth.controller';
import { RolesController } from './controllers/roles.controller';
import { UsersController } from './controllers/users.controller';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import { RolesService } from './services/roles.service';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Role]),

    PassportModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const rawExpires = configService.get<string | number>('JWT_EXPIRES_IN');
        const expiresIn =
          typeof rawExpires === 'number'
            ? rawExpires
            : rawExpires && !isNaN(Number(rawExpires))
              ? Number(rawExpires)
              : (rawExpires as any);

        return {
          global: true,
          secret:
            configService.get<string>('JWT_SECRET') || 'nestjs-secret-key',
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, UsersController, RolesController],
  providers: [
    UsersService,
    RolesService,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [JwtModule, AuthService, UsersService, RolesService],
})
export class AuthModule {}
