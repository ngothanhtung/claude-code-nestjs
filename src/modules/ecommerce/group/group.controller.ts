import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group } from './group.entity';

@ApiTags('Groups')
@Controller('groups')
export class GroupController {
  constructor(private readonly service: GroupService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'Group created successfully', type: Group })
  create(@Body() dto: CreateGroupDto): Promise<Group> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all groups' })
  @ApiResponse({ status: 200, description: 'List of groups', type: [Group] })
  findAll(): Promise<Group[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a group by ID' })
  @ApiResponse({ status: 200, description: 'Group found', type: Group })
  @ApiResponse({ status: 404, description: 'Group not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Group> {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a group' })
  @ApiResponse({ status: 200, description: 'Group updated successfully', type: Group })
  @ApiResponse({ status: 404, description: 'Group not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
  ): Promise<Group> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a group' })
  @ApiResponse({ status: 204, description: 'Group deleted successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted group' })
  @ApiResponse({ status: 200, description: 'Group restored successfully', type: Group })
  @ApiResponse({ status: 404, description: 'Group not found' })
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<Group> {
    return this.service.restore(id);
  }
}
