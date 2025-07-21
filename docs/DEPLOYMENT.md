# Photo Sharing Backend - Production Deployment Guide

## 🚀 Production Deployment

This guide covers deploying the Photo Sharing Backend to production environments.

## 📋 Pre-Deployment Checklist

### ✅ **Code Preparation**
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Environment-specific configurations ready
- [ ] Security configurations reviewed

### ✅ **Infrastructure**
- [ ] Production server/container environment ready
- [ ] PostgreSQL database configured
- [ ] SSL certificates obtained
- [ ] Domain/subdomain configured
- [ ] Load balancer configured (if applicable)
- [ ] Monitoring/logging systems ready

### ✅ **Security**
- [ ] Strong JWT secrets generated
- [ ] Database credentials secured
- [ ] File upload restrictions configured
- [ ] Rate limiting configured
- [ ] CORS settings reviewed

---

## 🔧 Environment Configuration

### Production Environment Variables

Create a production `.env` file:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
TRUST_PROXY=true

# Database Configuration
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=photo_sharing_prod
DB_USER=photo_app_user
DB_PASSWORD=your-secure-database-password
DB_SSL=true
DB_MAX_CONNECTIONS=20

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_MAX_SIZE=50MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,image/heic
MAX_FILES_PER_REQUEST=100

# Storage Configuration
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-production-bucket
AWS_S3_REGION=us-west-2
AWS_S3_ENDPOINT=https://s3.us-west-2.amazonaws.com

# Security Configuration
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# Monitoring & Logging
LOG_LEVEL=info
LOG_FILE=true
SENTRY_DSN=your-sentry-dsn

# Performance
COMPRESSION_ENABLED=true
CACHE_TTL=3600
```

---

## 🐳 Docker Deployment

### Production Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeapp -u 1001

WORKDIR /app

# Copy built node_modules and source
COPY --from=builder --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --chown=nodeapp:nodejs . .

# Create uploads directory
RUN mkdir -p uploads/photos && chown -R nodeapp:nodejs uploads

# Switch to non-root user
USER nodeapp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node health-check.js

EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### Production Docker Compose

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: production
    container_name: photo_sharing_app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    volumes:
      - app_uploads:/app/uploads
      - app_logs:/app/logs
    depends_on:
      database:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
    networks:
      - photo_sharing_network

  database:
    image: postgres:15-alpine
    container_name: photo_sharing_db_prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: photo_sharing_prod
      POSTGRES_USER: photo_app_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - postgres_backups:/backups
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U photo_app_user -d photo_sharing_prod"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 256M
    networks:
      - photo_sharing_network

  nginx:
    image: nginx:alpine
    container_name: photo_sharing_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - app_uploads:/var/www/uploads:ro
    depends_on:
      - app
    networks:
      - photo_sharing_network

volumes:
  postgres_data:
  postgres_backups:
  app_uploads:
  app_logs:

networks:
  photo_sharing_network:
    driver: bridge
```

---

## 🌐 Nginx Configuration

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rss+xml
        application/vnd.geo+json
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        font/opentype
        image/bmp
        image/svg+xml
        image/x-icon
        text/cache-manifest
        text/css
        text/plain
        text/vcard
        text/vnd.rim.location.xloc
        text/vtt
        text/x-component
        text/x-cross-domain-policy;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Upstream backend
    upstream backend {
        server app:3000 max_fails=3 fail_timeout=30s;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # Main server block
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Auth endpoints (stricter rate limiting)
        location ~ ^/api/(v1|v2)/auth/(login|register) {
            limit_req zone=auth burst=3 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Upload endpoints (stricter rate limiting)
        location ~ ^/api/(v1|v2)/.*/upload {
            limit_req zone=upload burst=5 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Large file upload settings
            client_max_body_size 100M;
            proxy_request_buffering off;
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
        }

        # Static file serving (photos)
        location /uploads/ {
            root /var/www;
            expires 1y;
            add_header Cache-Control "public, immutable";
            
            # Security for uploads
            location ~* \.(php|pl|py|jsp|asp|sh|cgi)$ {
                deny all;
            }
        }

        # Health check
        location /health {
            proxy_pass http://backend;
            access_log off;
        }

        # Block access to sensitive files
        location ~ /\. {
            deny all;
        }
        
        location ~ ^/(package\.json|\.env|database/) {
            deny all;
        }
    }
}
```

---

## ☁️ AWS Deployment

### Using AWS ECS with Fargate

1. **Create ECR Repository:**
```bash
aws ecr create-repository --repository-name photo-sharing-backend
```

2. **Build and Push Docker Image:**
```bash
# Get login token
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-west-2.amazonaws.com

# Build image
docker build -t photo-sharing-backend .

# Tag image
docker tag photo-sharing-backend:latest 123456789012.dkr.ecr.us-west-2.amazonaws.com/photo-sharing-backend:latest

# Push image
docker push 123456789012.dkr.ecr.us-west-2.amazonaws.com/photo-sharing-backend:latest
```

3. **ECS Task Definition:**
```json
{
  "family": "photo-sharing-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "photo-sharing-backend",
      "image": "123456789012.dkr.ecr.us-west-2.amazonaws.com/photo-sharing-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:ssm:us-west-2:123456789012:parameter/photo-sharing/jwt-secret"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:ssm:us-west-2:123456789012:parameter/photo-sharing/db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/photo-sharing-backend",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### RDS PostgreSQL Setup

```bash
# Create RDS instance
aws rds create-db-instance \
    --db-instance-identifier photo-sharing-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --allocated-storage 20 \
    --storage-type gp2 \
    --db-name photo_sharing_prod \
    --master-username photo_app_user \
    --master-user-password your-secure-password \
    --vpc-security-group-ids sg-12345678 \
    --backup-retention-period 7 \
    --multi-az \
    --storage-encrypted
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
- Store sensitive data in AWS Systems Manager Parameter Store
- Use IAM roles instead of hardcoded credentials
- Rotate secrets regularly

### 2. Database Security
- Enable SSL connections
- Use least-privilege database user
- Regular security updates
- Database encryption at rest

### 3. File Upload Security
- Validate file types and sizes
- Scan uploaded files for malware
- Use signed URLs for S3 access
- Implement file access logging

### 4. Network Security
- Use VPC with private subnets
- Configure security groups properly
- Enable WAF for additional protection
- Use CloudFront for static content

### 5. Application Security
- Keep dependencies updated
- Implement proper CORS policies
- Use rate limiting
- Enable request logging

---

## 📊 Monitoring & Logging

### CloudWatch Configuration

```javascript
// logger.js
const winston = require('winston');
const CloudWatchTransport = require('winston-cloudwatch');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new CloudWatchTransport({
      logGroupName: '/aws/ecs/photo-sharing-backend',
      logStreamName: 'application',
      awsRegion: 'us-west-2'
    })
  ]
});
```

### Health Check Endpoint

```javascript
// health-check.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

---

## 🔄 Database Migrations in Production

### Migration Strategy

1. **Pre-deployment:**
```bash
# Backup database
pg_dump -h production-db-host -U username -d photo_sharing_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Test migrations on staging
npm run db:migrate:dry-run
```

2. **During deployment:**
```bash
# Run migrations
npm run db:migrate

# Verify migration success
npm run db:verify
```

3. **Post-deployment:**
```bash
# Monitor application logs
# Verify all endpoints working
# Check database performance
```

### Zero-Downtime Migrations

1. **Additive changes first** (new columns, tables)
2. **Deploy application** with backward compatibility
3. **Remove old code** in next deployment
4. **Clean up old columns/tables** in subsequent migration

---

## 📈 Performance Optimization

### 1. Database Optimization
- Proper indexing strategy
- Connection pooling
- Query optimization
- Read replicas for heavy read operations

### 2. Caching Strategy
```javascript
// Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

// Cache user profiles
const cacheKey = `user:${userId}`;
const cachedUser = await client.get(cacheKey);
if (cachedUser) {
  return JSON.parse(cachedUser);
}
// ... fetch from database and cache
await client.setex(cacheKey, 3600, JSON.stringify(user));
```

### 3. File Storage Optimization
- Use CloudFront for global content delivery
- Implement image resizing on-the-fly
- Use appropriate image formats (WebP, AVIF)
- Lazy loading for large galleries

---

## 🚨 Backup & Recovery

### Database Backup

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="photo_sharing_backup_${DATE}.sql"

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp "${BACKUP_FILE}.gz" s3://your-backup-bucket/database/

# Clean up local file
rm "${BACKUP_FILE}.gz"

# Keep only last 30 days of backups
aws s3 ls s3://your-backup-bucket/database/ --recursive | \
  sort | head -n -30 | awk '{print $4}' | \
  xargs -I {} aws s3 rm s3://your-backup-bucket/{}
```

### File Storage Backup

```bash
#!/bin/bash
# backup-files.sh

DATE=$(date +%Y%m%d_%H%M%S)

# Sync uploads to backup bucket
aws s3 sync s3://your-main-bucket s3://your-backup-bucket/files_${DATE}/ \
  --storage-class GLACIER
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Database migrations prepared
- [ ] Environment variables updated
- [ ] SSL certificates ready
- [ ] Monitoring configured
- [ ] Backup procedures tested

### During Deployment
- [ ] Backup current database
- [ ] Deploy new application version
- [ ] Run database migrations
- [ ] Verify health checks passing
- [ ] Test critical API endpoints
- [ ] Monitor error logs

### Post-Deployment
- [ ] Verify all features working
- [ ] Check performance metrics
- [ ] Monitor error rates
- [ ] Validate file uploads
- [ ] Test user authentication
- [ ] Confirm backup systems operational

### Rollback Plan
- [ ] Database rollback scripts ready
- [ ] Previous application version tagged
- [ ] Rollback procedure documented
- [ ] Team communication plan ready

---

## 📞 Production Support

### Log Locations
- Application logs: `/app/logs/` or CloudWatch
- Nginx logs: `/var/log/nginx/`
- Database logs: CloudWatch or RDS logs

### Monitoring Dashboards
- Application metrics: CloudWatch or custom dashboard
- Database performance: RDS Performance Insights
- Infrastructure: AWS CloudWatch or third-party tools

### Alerting
- High error rates
- Database connection issues
- Disk space warnings
- Memory/CPU usage alerts
- Failed backup notifications

### Emergency Contacts
- DevOps team
- Database administrator
- Security team
- Business stakeholders 