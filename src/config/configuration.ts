export interface AppConfig {
  port: number;
  cors: {
    origin: string | boolean;
    methods: string[];
    allowedHeaders: string[];
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3333', 10) || 3333,
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});
