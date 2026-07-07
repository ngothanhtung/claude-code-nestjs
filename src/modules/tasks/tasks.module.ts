import { Module } from '@nestjs/common';
import { NotificationService, TasksService } from './tasks.service';
import { ReportsService } from './reports.service';

@Module({
  providers: [TasksService, NotificationService, ReportsService],
})
export class TasksModule {}
