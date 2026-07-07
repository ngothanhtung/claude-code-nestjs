import { ApiUnauthorizedResponseOptions } from '@common/open-api';
// Create controller
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { Roles } from '../decorators/roles.decorator';
import { CreateRoleDto, UpdateRoleDto } from '../dtos/role.dto';
import { RoleName } from '../guards/role.enum';
import { RolesService } from '../services/roles.service';
import { ParseParamIdPipe } from '@common/pipes/validation.pipe';
import { UsersService } from '../services/users.service';

@ApiTags('Security | Roles')
@ApiBearerAuth()
@ApiUnauthorizedResponse(ApiUnauthorizedResponseOptions())
@Roles(RoleName.Administrators)
@Controller('security/roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly usersService: UsersService,
  ) {}

  // [GET] all
  @ApiOperation({ summary: 'Get all roles' })
  @ApiOkResponse({ description: 'List of all roles' })
  @Get()
  async findAll(): Promise<any> {
    return this.rolesService.findAll();
  }

  // [POST] create
  @ApiOperation({ summary: 'Create new role' })
  @ApiOkResponse({ description: 'Role created successfully' })
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<any> {
    return this.rolesService.create(createRoleDto);
  }

  // [GET] by ID
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiOkResponse({ description: 'Role found successfully' })
  @Get(':id')
  async findOne(@Param('id', ParseParamIdPipe) id: number): Promise<any> {
    return this.rolesService.findOne(id);
  }

  // [GET] users by role ID
  @ApiOperation({ summary: `Get users by role id` })
  @Get(':id/users')
  async getUsersByRoleId(@Param('id', ParseParamIdPipe) id: number): Promise<any> {
    return this.usersService.findByRole(id);
  }

  // [PATCH] update
  @ApiOperation({ summary: 'Update role by ID' })
  @ApiOkResponse({ description: 'Role updated successfully' })
  @Patch(':id')
  async update(@Param('id', ParseParamIdPipe) id: number, @Body() updateRoleDto: UpdateRoleDto): Promise<any> {
    return this.rolesService.update(id, updateRoleDto);
  }
  // [DELETE]
  @ApiOperation({ summary: 'Delete role by ID' })
  @ApiOkResponse({ description: 'Role deleted successfully' })
  @Delete(':id')
  async delete(@Param('id', ParseParamIdPipe) id: number): Promise<any> {
    return this.rolesService.delete(id);
  }
}
