import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from './student.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student, 'lms')
    private readonly studentsRepository: Repository<Student>,
  ) {}

  async create(dto: CreateStudentDto): Promise<Student> {
    const existing = await this.studentsRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Student with this email already exists');
    }

    const student = this.studentsRepository.create(dto);
    return this.studentsRepository.save(student);
  }

  findAll(): Promise<Student[]> {
    return this.studentsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({ where: { id } });

    if (!student) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }

    return student;
  }

  async update(id: string, dto: UpdateStudentDto): Promise<Student> {
    const student = await this.findById(id);

    if (dto.email && dto.email !== student.email) {
      const existing = await this.studentsRepository.findOne({
        where: { email: dto.email },
      });

      if (existing) {
        throw new ConflictException('Student with this email already exists');
      }
    }

    Object.assign(student, dto);
    return this.studentsRepository.save(student);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.studentsRepository.delete(id);
  }
}
