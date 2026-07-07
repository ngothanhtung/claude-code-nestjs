import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { ReportsService } from './reports.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(`🐞 ${TasksService.name}`, {
    timestamp: true,
  });

  constructor(private readonly reportsService: ReportsService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  handleCron() {
    this.logger.debug('Called when the current second is 30');
  }

  @Interval(20000)
  handleInterval() {
    this.logger.debug('Called every 20 seconds');
  }

  @Cron('19 20 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handle2030() {
    this.logger.debug('Called 20:12 Asia/Ho_Chi_Minh timezone');
    const data = await this.reportsService.getData();
    this.logger.debug(`Report data: ${JSON.stringify(data)}`);
  }

  @Timeout(30000)
  handleTimeout() {
    this.logger.debug('Called once after 30 seconds');
  }
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(`🐞 ${NotificationService.name}`);
  @Cron(CronExpression.EVERY_30_SECONDS, {
    name: 'notifications',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  triggerNotifications() {
    this.logger.debug('Called once after 30 seconds (notifications)');
  }
}
