import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ConstructGuard API - Smart Unauthorized Construction Monitoring',
    version: '1.0.0',
    description:
      'ConstructGuard detects indicators of potentially unauthorized construction and prioritizes sites for human inspection. The system provides decision support, not legal enforcement.',
  },
  servers: [
    {
      url: '/api',
      description: 'ConstructGuard API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token to authenticate.',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          message: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['ADMIN', 'INSPECTOR', 'VIEWER'] },
        },
      },
      Site: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string' },
          name: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          address: { type: 'string' },
          authorized: { type: 'boolean' },
          permit_number: { type: 'string', nullable: true },
          permit_start_date: { type: 'string', format: 'date' },
          permit_end_date: { type: 'string', format: 'date' },
          permitted_start_time: { type: 'string' },
          permitted_end_time: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Camera: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          site_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          stream_url: { type: 'string' },
          status: { type: 'string', enum: ['ONLINE', 'OFFLINE'] },
          last_seen_at: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      SensorReading: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          site_id: { type: 'string' },
          sensor_id: { type: 'string' },
          sensor_type: { type: 'string', enum: ['vibration', 'noise', 'motion', 'temperature', 'dust'] },
          value: { type: 'number' },
          unit: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      RiskEvent: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          site_id: { type: 'string' },
          visual_score: { type: 'number' },
          change_score: { type: 'number' },
          sensor_score: { type: 'number' },
          time_score: { type: 'number' },
          permit_score: { type: 'number' },
          overall_score: { type: 'number' },
          risk_level: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          explanation: { type: 'string' },
          indicators: { type: 'array', items: { type: 'string' } },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Alert: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          risk_event_id: { type: 'string', format: 'uuid' },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          status: { type: 'string', enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'] },
          acknowledged_by: { type: 'string', nullable: true },
          acknowledged_at: { type: 'string', format: 'date-time', nullable: true },
          resolved_at: { type: 'string', format: 'date-time', nullable: true },
          site_name: { type: 'string' },
          risk_score: { type: 'number' },
          risk_level: { type: 'string' },
          explanation: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        description: 'Checks connectivity for PostgreSQL, Redis, MQTT broker, and Python CV service.',
        responses: {
          200: { description: 'All services healthy or degraded' },
          503: { description: 'One or more required dependencies failed' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Inspector Sharma' },
                  email: { type: 'string', format: 'email', example: 'inspector@constructguard.local' },
                  password: { type: 'string', format: 'password', example: 'Inspector@123' },
                  role: { type: 'string', enum: ['ADMIN', 'INSPECTOR', 'VIEWER'], default: 'VIEWER' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User successfully registered' },
          400: { description: 'Validation failed' },
          409: { description: 'User already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@constructguard.local' },
                  password: { type: 'string', format: 'password', example: 'Admin@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful, returns JWT access and refresh tokens' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'New token pair generated' },
          401: { description: 'Invalid or revoked refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'User logout',
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User profile retrieved' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/sites': {
      get: {
        summary: 'List all construction sites',
        responses: {
          200: { description: 'List of construction sites' },
        },
      },
      post: {
        summary: 'Register a new construction site',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Site' },
            },
          },
        },
        responses: {
          201: { description: 'Site registered successfully' },
        },
      },
    },
    '/sites/{id}': {
      get: {
        summary: 'Get site by ID or code',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Site details' },
          404: { description: 'Site not found' },
        },
      },
      put: {
        summary: 'Update site details',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Site updated successfully' },
          404: { description: 'Site not found' },
        },
      },
      delete: {
        summary: 'Delete site',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Site deleted successfully' },
          404: { description: 'Site not found' },
        },
      },
    },
    '/sites/{id}/sensors': {
      get: {
        summary: 'Get time-series sensor readings for site',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'sensor_type', in: 'query', schema: { type: 'string', enum: ['vibration', 'noise', 'motion', 'temperature', 'dust'] } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          200: { description: 'Sensor readings array' },
        },
      },
    },
    '/sites/{id}/sensors/latest': {
      get: {
        summary: 'Get latest sensor telemetry reading for all sensor types on a site',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Map of latest sensor readings by type' },
        },
      },
    },
    '/cameras': {
      get: {
        summary: 'List cameras',
        parameters: [
          { name: 'site_id', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Camera list' },
        },
      },
      post: {
        summary: 'Add a new camera',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Camera' },
            },
          },
        },
        responses: {
          201: { description: 'Camera created' },
        },
      },
    },
    '/risk-events': {
      get: {
        summary: 'Query historical risk intelligence events',
        parameters: [
          { name: 'siteId', in: 'query', schema: { type: 'string' } },
          { name: 'riskLevel', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } },
          { name: 'from', in: 'query', schema: { type: 'string' } },
          { name: 'to', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          200: { description: 'Risk events array' },
        },
      },
    },
    '/risk-events/{id}': {
      get: {
        summary: 'Get risk event details by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Risk event details' },
          404: { description: 'Not found' },
        },
      },
    },
    '/risk/analyze': {
      post: {
        summary: 'Direct risk intelligence analysis evaluation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['siteId'],
                properties: {
                  siteId: { type: 'string', example: 'b2c3d4e5-0002-4000-8000-000000000101' },
                  visualScore: { type: 'number', example: 75 },
                  changeScore: { type: 'number', example: 35 },
                  sensorScore: { type: 'number', example: 80 },
                  timeScore: { type: 'number', example: 90 },
                  permitScore: { type: 'number', example: 0 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Computed risk assessment result' },
        },
      },
    },
    '/alerts': {
      get: {
        summary: 'Get monitored alerts',
        parameters: [
          { name: 'severity', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'] } },
          { name: 'siteId', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Alerts array' },
        },
      },
    },
    '/alerts/{id}/acknowledge': {
      post: {
        summary: 'Acknowledge an open alert (Inspector / Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Alert acknowledged' },
          404: { description: 'Alert not found' },
        },
      },
    },
    '/alerts/{id}/resolve': {
      post: {
        summary: 'Resolve an alert after human inspection (Inspector / Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Alert resolved' },
          404: { description: 'Alert not found' },
        },
      },
    },
    '/dashboard/summary': {
      get: {
        summary: 'Get high-level dashboard metrics',
        responses: {
          200: { description: 'Summary counters for sites, alerts, cameras, and risk breakdown' },
        },
      },
    },
    '/dashboard/risk-trends': {
      get: {
        summary: 'Get multi-day risk scoring trends',
        parameters: [
          { name: 'days', in: 'query', schema: { type: 'integer', default: 7 } },
        ],
        responses: {
          200: { description: 'Daily score averages and incident counts' },
        },
      },
    },
    '/dashboard/site-summary': {
      get: {
        summary: 'Get site-by-site status summary for map and dashboard tables',
        responses: {
          200: { description: 'Site list with latest risk tier and open alert count' },
        },
      },
    },
    '/jobs/test-risk': {
      post: {
        summary: 'Trigger asynchronous risk calculation job in BullMQ',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['siteId'],
                properties: {
                  siteId: { type: 'string' },
                  visualScore: { type: 'number' },
                  changeScore: { type: 'number' },
                  sensorScore: { type: 'number' },
                  timeScore: { type: 'number' },
                  permitScore: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Job enqueued successfully' },
        },
      },
    },
  },
};

export const swaggerRouter = Router();
swaggerRouter.use('/', swaggerUi.serve, swaggerUi.setup(openApiSpec));
