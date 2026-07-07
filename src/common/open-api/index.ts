import { ApiResponseOptions } from '@nestjs/swagger';

type Constructor<T = object> = new (...args: any[]) => T;
type Wrapper<T = object> = { new (): T & any; prototype: T };
type DecoratorOptions = { name: string; description?: string };
type ApiSchemaDecorator = <T extends Constructor>(options: DecoratorOptions) => (constructor: T) => Wrapper<T>;

export const ApiSchema: ApiSchemaDecorator = ({ name, description }) => {
  return (constructor) => {
    const wrapper = class extends constructor {};
    Object.defineProperty(wrapper, 'name', {
      value: name,
      writable: false,
    });
    Object.defineProperty(wrapper, 'description', {
      value: description,
      writable: false,
    });
    return wrapper;
  };
};

export const ApiBadRequestResponseOptions = (): ApiResponseOptions => ({
  description: 'Bad Request',
  status: 400,
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 400 },
      message: {
        type: 'array',
        items: {
          type: 'string',
          example: 'Error message',
        },
      },
      error: { type: 'string', example: 'Bad Request' },
    },
  },
});

export const ApiUnauthorizedResponseOptions = (): ApiResponseOptions => ({
  description: 'Unauthorized (Invalid token)',
  status: 401,
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 401 },
      message: {
        type: 'array',
        items: {
          type: 'string',
          example: `Invalid token`,
        },
      },
      error: { type: 'string', example: 'Unauthorized' },
    },
  },
});

export const ApiForbiddenResponseOptions = (): ApiResponseOptions => ({
  description: 'Forbidden (Invalid token)',
  status: 403,
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 403 },
      message: {
        type: 'array',
        items: {
          type: 'string',
          example: `Invalid token`,
        },
      },
      error: { type: 'string', example: 'Forbidden' },
    },
  },
});

export const ApiGoneResponseOptions = ({ entityName = 'Object' }: { entityName?: string } = {}): ApiResponseOptions => ({
  status: 410,
  description: `Gone (${entityName} not found)`,
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 410 },
      message: {
        type: 'array',
        items: {
          type: 'string',
          example: `${entityName} no longer exists`,
        },
      },
      error: { type: 'string', example: 'Gone' },
    },
  },
});

export const ApiCreatedResponseOptions = (): ApiResponseOptions => ({
  status: 201,
});

export const ApiDeletedResponseOptions = ({ entityName = 'Object' }: { entityName?: string } = {}): ApiResponseOptions => ({
  status: 200,
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 200 },
      message: {
        type: 'array',
        items: {
          type: 'string',
          example: `${entityName} successfully deleted`,
        },
      },
    },
  },
});
