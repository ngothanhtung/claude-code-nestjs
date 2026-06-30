import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SanPham } from './san-pham.entity';
import { SanPhamService } from './san-pham.service';
import { SanPhamController } from './san-pham.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SanPham])],
  controllers: [SanPhamController],
  providers: [SanPhamService],
  exports: [SanPhamService],
})
export class SanPhamModule {}
