import { Controller, Get, MessageEvent, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('sse')
export class SseController {
  @Get()
  index(@Res() response: Response) {
    response.type('text/html').send(readFileSync(join(__dirname, '/index.html')).toString());
  }

  @Get('chart')
  chartIndex(@Res() response: Response) {
    response.type('text/html').send(readFileSync(join(__dirname, '/chart.html')).toString());
  }

  @Get('stock')
  stockIndex(@Res() response: Response) {
    response.type('text/html').send(readFileSync(join(__dirname, '/stock.html')).toString());
  }

  @Sse('event-stream')
  sse(): Observable<MessageEvent> {
    return interval(1000).pipe(
      map(() => ({
        data: {
          time: new Date().toISOString(),
          value: Math.floor(Math.random() * 100), // Simulating random chart values
        },
      })),
    );
  }

  @Sse('chart-stream')
  sseChart(): Observable<MessageEvent> {
    return interval(1000).pipe(
      map(() => ({
        data: {
          time: new Date().toISOString(),
          value: Math.floor(Math.random() * 100), // Simulating random chart values
        },
      })),
    );
  }

  @Sse('stock-stream')
  streamStockData(): Observable<{ data: { time: string; price: number } }> {
    return interval(1000).pipe(
      map(() => ({
        data: {
          time: new Date().toISOString(),
          price: 100 + Math.random() * 10 - 5, // Simulated stock price fluctuation
        },
      })),
    );
  }
}
