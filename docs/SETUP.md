# Photo Sharing Backend - Setup Guide

## 📋 Prerequisites

Before setting up the Photo Sharing Backend, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher)
- **npm** (v8.0.0 or higher) 
- **PostgreSQL** (v12.0 or higher)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TrustApp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=photo_sharing_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
UPLOAD_MAX_SIZE=50MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp

# Storage Configuration (Local/S3)
STORAGE_TYPE=local
# For S3:
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_S3_BUCKET=your_bucket_name
# AWS_S3_REGION=us-west-2
```

### 4. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL with Docker
docker-compose up -d database

# Wait for database to be ready, then run migrations
npm run db:migrate
```

#### Option B: Manual PostgreSQL Setup

1. Create database:
```sql
CREATE DATABASE photo_sharing_db;
```

2. Run migrations:
```bash
npm run db:migrate
```

3. (Optional) Load sample data:
```bash
npm run db:seed
```

### 5. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📂 Project Structure

```
TrustApp/
├── src/                     # Source code (refactored architecture)
│   ├── config/             # Configuration files
│   ├── controllers/        # HTTP request handlers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database access layer
│   ├── routes/            # Route definitions
│   ├── services/          # Business logic layer
│   ├── utils/             # Shared utilities
│   └── validators/        # Input validation
├── database/              # Database files
│   ├── migrations/        # Ordered migration files
│   ├── seeds/            # Sample data
│   └── schema.sql        # Complete schema
├── uploads/              # File storage directory
├── tests/               # Test files
├── docs/               # Documentation
├── postman/            # API testing collections
├── server.js           # Main server file
└── package.json        # Dependencies and scripts
```

## 🗄️ Database Migrations

The project uses ordered SQL migration files:

```bash
# Run all migrations
npm run db:migrate

# Run specific migration
npm run db:migrate:single 001_initial_schema.sql

# Reset database (caution!)
npm run db:reset
```

### Migration Files:
- `001_initial_schema.sql` - Users and basic tables
- `002_friendships.sql` - Friendship system
- `003_photos_system.sql` - Photos, albums, likes, comments
- `004_sharing_system.sql` - Sharing and permissions
- `005_device_sync_system.sql` - Device synchronization

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Authentication Test
```bash
# Register new user
curl -X POST http://localhost:3000/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using Postman Collections

Import the Postman collections from the `postman/` directory:
- `Photo_Sharing_Complete_System.json` - Complete API collection
- Follow the testing guide in `postman/PHOTO_TESTING_GUIDE.md`

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start with nodemon (auto-reload)
npm start               # Start production server

# Database
npm run db:migrate      # Run all migrations
npm run db:seed        # Load sample data
npm run db:reset       # Reset database (caution!)

# Testing
npm test               # Run tests
npm run test:unit      # Run unit tests only
npm run test:integration # Run integration tests

# Utilities
npm run validate       # Validate refactored structure
npm run cleanup        # Clean temporary files
```

## 🐳 Docker Setup

### Using Docker Compose (Recommended)

```bash
# Start all services (database + backend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Scripts

```bash
# Windows
.\docker-scripts.ps1 start
.\docker-scripts.ps1 logs
.\docker-scripts.ps1 stop

# Linux/Mac
./docker-scripts.sh start
./docker-scripts.sh logs
./docker-scripts.sh stop
```

## 📁 File Storage Configuration

### Local Storage (Default)
Files are stored in `uploads/photos/` directory with user-specific subdirectories.

### AWS S3 Storage
Update `.env` file with S3 credentials and set `STORAGE_TYPE=s3`.

## 🔐 Security Configuration

### JWT Security
- Use a strong, unique `JWT_SECRET` in production
- Consider shorter token expiration times for production
- Implement refresh token mechanism for better security

### File Upload Security
- File type validation enabled by default
- File size limits enforced
- Virus scanning recommended for production

### Database Security
- Use strong database passwords
- Enable SSL connections in production
- Regular backups recommended

## 🚀 Production Deployment

### Environment Variables
```bash
NODE_ENV=production
DB_SSL=true
JWT_SECRET=your_production_secret_here
```

### Performance Optimization
- Enable gzip compression
- Use Redis for session storage
- Implement CDN for file delivery
- Database connection pooling enabled

### Monitoring
- Application logs in `logs/` directory
- Health check endpoint: `/health`
- Database connection monitoring

## 📚 API Documentation

### API Versions
- **v1 APIs**: `/api/*` (legacy, maintained for compatibility)
- **v2 APIs**: `/api/v2/*` (refactored, recommended)

### Main API Endpoints
- `/api/v2/auth/*` - Authentication
- `/api/v2/photos/*` - Photo management
- `/api/v2/friends/*` - Friend system
- `/api/v2/sharing/*` - Sharing system
- `/api/v2/users/*` - User management
- `/api/v2/device-sync/*` - Device synchronization
- `/api/v2/permissions/*` - Permission groups

### Authentication
All API endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check connection settings in .env
# Verify database exists and user has permissions
```

**File Upload Issues**
```bash
# Check upload directory permissions
chmod 755 uploads/
mkdir -p uploads/photos

# Verify file size limits in .env
```

**JWT Token Issues**
```bash
# Verify JWT_SECRET is set in .env
# Check token expiration time
# Ensure proper Authorization header format
```

### Getting Help

1. Check the logs in `logs/` directory
2. Review API documentation in `docs/`
3. Use Postman collections for testing
4. Check GitHub issues for known problems

## 🔄 Migration from Legacy System

If migrating from an older version:

1. Backup existing data
2. Run new migrations: `npm run db:migrate`
3. Test v2 APIs while keeping v1 for compatibility
4. Gradually migrate client applications to v2
5. Remove v1 APIs when migration is complete

---

## 📞 Support

For technical support or questions:
- Review documentation in `docs/` directory
- Check API testing guide in `postman/`
- Review refactoring summary in `COMPLETE_REFACTOR_SUMMARY.md` 