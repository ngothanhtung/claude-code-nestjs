import { Body, Controller, Post } from '@nestjs/common';

import { MailService } from './mail.service';

@Controller('queues/mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  async sendEmail(@Body() body: { to: string; subject: string; body: string }) {
    await this.mailService.sendEmailJob({
      to: body.to,
      subject: body.subject,
      body: body.body,
    });
    return { message: 'Email queued successfully' };
  }
}
