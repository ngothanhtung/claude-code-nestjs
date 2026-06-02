import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Student } from './students/student.entity';
import { StudentsController } from './students/students.controller';
import { StudentsService } from './students/students.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: 'lms',
      type: 'sqlite',
      database: 'lms.sqlite',
      entities: [Student],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Student], 'lms'),
  ],
  providers: [StudentsService],
  controllers: [StudentsController],
})
export class LmsModule {}
