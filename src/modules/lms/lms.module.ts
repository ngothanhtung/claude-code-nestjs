import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Student } from './students/student.entity';
import { StudentsController } from './students/students.controller';
import { StudentsService } from './students/students.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: 'lms', // Đặt tên kết nối là 'lms' để phân biệt với các module khác
      type: 'sqlite', // Sử dụng SQLite cho module LMS
      database: 'lms.sqlite', // Đặt tên file SQLite là lms.sqlite
      entities: [Student], // Liệt kê tất cả các entity của module này tại đây
      synchronize: true, // Chỉ nên dùng synchronize: true trong môi trường phát triển
    }),
    TypeOrmModule.forFeature([Student], 'lms'),
  ],
  providers: [StudentsService],
  controllers: [StudentsController],
})
export class LmsModule {}
