const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TrustApp API',
    version: '2.0.0',
    description: 'Photo sharing app with advanced access control and device sync',
    contact: {
      name: 'TrustApp Team',
      email: 'dev@trustapp.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.trustapp.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'User ID',
          },
          username: {
            type: 'string',
            description: 'Username',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email',
          },
          full_name: {
            type: 'string',
            description: 'User full name',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
        },
      },
      Photo: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Photo ID',
          },
          filename: {
            type: 'string',
            description: 'Original filename',
          },
          file_path: {
            type: 'string',
            description: 'File storage path',
          },
          file_size: {
            type: 'integer',
            description: 'File size in bytes',
          },
          mime_type: {
            type: 'string',
            description: 'File MIME type',
          },
          uploaded_at: {
            type: 'string',
            format: 'date-time',
            description: 'Upload timestamp',
          },
          album_id: {
            type: 'integer',
            nullable: true,
            description: 'Album ID if photo belongs to an album',
          },
        },
      },
      Friend: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Friend relationship ID',
          },
          user_id: {
            type: 'integer',
            description: 'User ID',
          },
          friend_id: {
            type: 'integer',
            description: 'Friend user ID',
          },
          status: {
            type: 'string',
            enum: ['pending', 'accepted', 'rejected'],
            description: 'Friendship status',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Request creation timestamp',
          },
        },
      },
      PhotoShare: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Share ID',
          },
          photo_id: {
            type: 'integer',
            description: 'Photo ID',
          },
          shared_with_user_id: {
            type: 'integer',
            description: 'User ID who received the share',
          },
          permission_level: {
            type: 'string',
            enum: ['view', 'download'],
            description: 'Permission level',
          },
          shared_at: {
            type: 'string',
            format: 'date-time',
            description: 'Share timestamp',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            description: 'Error message',
          },
          details: {
            type: 'object',
            description: 'Additional error details',
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
          message: {
            type: 'string',
            description: 'Success message',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './server.js',
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec; 