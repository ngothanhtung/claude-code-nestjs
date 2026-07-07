import { ApiUnauthorizedResponseOptions } from '@common/open-api';
import { ParseParamIdPipe } from '@common/pipes/validation.pipe';
// Create controller
import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { Roles } from '../decorators/roles.decorator';
import { AddRoleToUserDto, AddRolesToUserDto, RemoveRoleFromUserDto, RemoveRolesFromUserDto } from '../dtos/roles.dto';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { RoleName } from '../guards/role.enum';
import { UsersService } from '../services/users.service';

@ApiTags('Security | Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse(ApiUnauthorizedResponseOptions())
@Roles(RoleName.Administrators)
@Controller('security/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ description: 'List of all users' })
  @Get()
  async getUsers() {
    return this.usersService.findAll();
  }

  // ------------------------------------------------------------------------------------------------
  // [GET] BY ID
  // ------------------------------------------------------------------------------------------------
  @ApiOperation({ summary: 'Get one user by id' })
  @ApiOkResponse({ description: 'User found successfully' })
  @Get(':id')
  async findOne(@Param('id', ParseParamIdPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // ------------------------------------------------------------------------------------------------
  // [POST]
  // ------------------------------------------------------------------------------------------------
  @ApiOperation({ summary: 'Create new user' })
  @ApiOkResponse({ description: 'User created successfully' })
  @ApiBadRequestResponse({ description: 'Username already exists' })
  @Post()
  async create(@Body() body: CreateUserDto): Promise<any> {
    return this.usersService.create(body);
  }

  // ------------------------------------------------------------------------------------------------
  // [PATCH]
  // ------------------------------------------------------------------------------------------------
  @ApiOperation({ summary: 'Update one user by id' })
  @ApiOkResponse({ description: 'User updated successfully' })
  @Patch(':id')
  async update(@Param('id', ParseParamIdPipe) id: number, @Body() body: UpdateUserDto): Promise<any> {
    return this.usersService.update(id, body);
  }

  // ------------------------------------------------------------------------------------------------
  // [DELETE]
  // ------------------------------------------------------------------------------------------------
  @ApiOperation({ summary: 'Delete one user by id' })
  @ApiOkResponse({ description: 'User deleted successfully' })
  @Delete(':id')
  async delete(@Param('id', ParseParamIdPipe) id: number): Promise<any> {
    return this.usersService.delete(id);
  }

  // [PUT] Add role to user
  @ApiOperation({ summary: 'Add role to user' })
  @ApiOkResponse({ description: 'Role added to user successfully' })
  @Put(':id/add-role-to-user')
  async addRole(@Param('id', ParseParamIdPipe) id: number, @Body() body: AddRoleToUserDto) {
    return this.usersService.addRolesToUser({
      user_id: id,
      role_ids: [body.role_id],
    });
  }

  // [PUT] Add roles to user
  @ApiOperation({ summary: 'Add roles to user' })
  @ApiOkResponse({ description: 'Roles added to user successfully' })
  @Put(':id/add-roles-to-user')
  async addRoles(@Param('id', ParseParamIdPipe) id: number, @Body() body: AddRolesToUserDto) {
    return this.usersService.addRolesToUser({
      user_id: id,
      role_ids: body.role_ids,
    });
  }

  // [PUT] Remove role from user
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiOkResponse({ description: 'Role removed from user successfully' })
  @Put(':id/remove-role-from-user')
  async removeRole(@Param('id', ParseParamIdPipe) id: number, @Body() body: RemoveRoleFromUserDto) {
    return this.usersService.removeRolesFromUser({
      user_id: id,
      role_ids: [body.role_id],
    });
  }

  // [PUT] Remove roles from user
  @ApiOperation({ summary: 'Remove roles from user' })
  @ApiOkResponse({ description: 'Roles removed from user successfully' })
  @Put(':id/remove-roles-from-user')
  async removeRoles(@Param('id', ParseParamIdPipe) id: number, @Body() body: RemoveRolesFromUserDto) {
    return this.usersService.removeRolesFromUser({
      user_id: id,
      role_ids: body.role_ids,
    });
  }
}
