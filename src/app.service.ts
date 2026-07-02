import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

// Mock users (Version 1 - hardcoded credentials)
const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    password: '123456789',
    roles: [{ name: 'Administrators' }],
  },
  {
    id: 2,
    username: 'manager',
    password: '123456789',
    roles: [{ name: 'Managers' }],
  },
  {
    id: 3,
    username: 'member',
    password: '123456789',
    roles: [{ name: 'Members' }],
  },
  {
    id: 4,
    username: 'root',
    password: '123456789',
    roles: [{ name: 'Root' }],
  },
];

@Injectable()
export class AppService {
  constructor(private readonly jwtService: JwtService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const { username, password } = dto;

    // Tìm user theo username
    const user = MOCK_USERS.find((u) => u.username === username);

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Sign JWT payload — roles theo đúng format RolesGuard mong đợi
    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }
}


