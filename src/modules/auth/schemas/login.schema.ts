export const LoginOkSchema = {
  type: 'object',
  properties: {
    loggedInUser: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        isActive: { type: 'boolean' },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
    access_token: { type: 'string' },
    refresh_token: { type: 'string' },
  },
};

export const LoginUnauthorizedSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number' },
    message: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    error: { type: 'string' },
  },
};
