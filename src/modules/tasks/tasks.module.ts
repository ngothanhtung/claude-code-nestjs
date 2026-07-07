import { Module } from '@nestjs/common';
import { NotificationService, TasksService } from './tasks.service';

@Module({
  providers: [TasksService, NotificationService],
})
export class TasksModule {}
