import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import {
  OnQueueActive,
  Process,
  Processor,
  OnQueueCompleted,
  OnQueueProgress,
  OnQueueWaiting,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../../config/configuration';
import { Job } from 'bull';

@Processor('mail-queue')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);
  private readonly sesClient: SESClient;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    const awsConfig = this.configService.get('aws.ses', { infer: true });
    this.sesClient = new SESClient({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    });
  }

  @Process('send')
  async handleSendEmail(
    job: Job<{ to: string; subject: string; body: string }>,
  ) {
    const { to, subject, body } = job.data;
    // report progress
    await job.progress(0);

    // delay for 30 seconds
    // await new Promise((resolve) => setTimeout(resolve, 30000));
    await this.sendEmail(to, subject, body);
    // report progress
    await job.progress(100);
    return {};
  }

  async sendEmail(to: string, subject: string, body: string) {
    const params = {
      Source: 'office@softech.vn',
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: body } },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      await this.sesClient.send(command);
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }

  @OnQueueWaiting()
  onWaiting(jobId: number | string) {
    this.logger.debug(`Job ${jobId} is waiting...`);
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    this.logger.debug(
      `Progress: ${progress}% for job ${job.id} with data ${JSON.stringify(job.data)}`,
    );
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}...`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }
}
