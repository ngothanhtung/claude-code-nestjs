import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { MailController } from './mail/mail.controller';
import { MailProcessor } from './mail/mail.processor';
import { MailService } from './mail/mail.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail-queue',
    }),
  ],
  controllers: [MailController],
  providers: [MailProcessor, MailService],
})
export class QueuesModule {}
