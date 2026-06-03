export interface AppConfig {
  port: number;
  cors: {
    origin: string | boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  mongodb: {
    uri: string;
  };
  aws: {
    ses: {
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3333', 10) || 3333,
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres_password',
    name: process.env.DB_NAME ?? 'claude_code_nestjs',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  mongodb: {
    uri:
      process.env.MONGODB_URI ??
      'mongodb://root:root_password@localhost:27017/cms?authSource=admin',
  },
  aws: {
    ses: {
      region: process.env.AWS_SES_REGION ?? 'us-east-1',
      accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY ?? '',
    },
  },
});
