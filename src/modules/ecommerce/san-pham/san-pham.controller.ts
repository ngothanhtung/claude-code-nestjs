import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { SanPhamService } from './san-pham.service';
import { CreateSanPhamDto } from './dto/create-san-pham.dto';
import { UpdateSanPhamDto } from './dto/update-san-pham.dto';
import { SanPham } from './san-pham.entity';

@Controller('san-pham')
export class SanPhamController {
  constructor(private readonly service: SanPhamService) {}

  @Post()
  create(@Body() dto: CreateSanPhamDto): Promise<SanPham> {
    return this.service.create(dto);
  }

  @Get()
  async findAll(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<{
    data: SanPham[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const [data, total] = await this.service.findAll(limit, offset);
    return { data, total, limit, offset };
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SanPham> {
    return this.service.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSanPhamDto,
  ): Promise<SanPham> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<SanPham> {
    return this.service.restore(id);
  }
}
