import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  constructor() {}

  getData(): Promise<any> {
    console.log(`Fetching data for report`);
    return Promise.resolve([]);
  }
}
