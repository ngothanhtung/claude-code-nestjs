import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './category.entity';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { RoleName } from '@modules/auth/guards/role.enum';
import { Public } from '@modules/auth/decorators/public.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @Roles(RoleName.Administrators, RoleName.Managers)
  @Post()
  create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.service.create(dto);
  }

  @Public()
  @Get()
  findAll(): Promise<Category[]> {
    return this.service.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Category> {
    return this.service.findById(id);
  }

  @Roles(RoleName.Administrators)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.service.update(id, dto);
  }

  @Roles(RoleName.Administrators)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
