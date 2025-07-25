# Environment Configuration Guide

## Quick Setup

### 1. Copy environment template
```bash
cp .env.template .env
```

### 2. For Local Development (with LocalStack)
```bash
cp .env.local .env
```

### 3. Install dependencies
```bash
npm install
```

### 4. Run application
```bash
# Development with local environment
npm run dev:local

# Regular development
npm run dev

# Production
npm start
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database host | localhost | ✅ |
| `DB_USER` | Database username | admin | ✅ |
| `DB_PASSWORD` | Database password | password123 | ✅ |
| `DB_NAME` | Database name | blog_db | ✅ |
| `AWS_REGION` | AWS region | us-east-1 | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS access key | test (LocalStack) | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | test (LocalStack) | ✅ |
| `AWS_ENDPOINT_URL` | AWS endpoint (LocalStack) | http://localhost:4566 | ❌ |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID | us-east-1_TestPool | ✅ |
| `COGNITO_CLIENT_ID` | Cognito App Client ID | test-client-id | ✅ |
| `S3_BUCKET_NAME` | S3 bucket for images | blog-images-bucket | ✅ |
| `CLOUDFRONT_DOMAIN` | CloudFront distribution domain | d123456789.cloudfront.net | ✅ |
| `PORT` | Application port | 3000 | ❌ |
| `NODE_ENV` | Node environment | development | ❌ |
| `SESSION_SECRET` | Session secret key | dev-secret-key | ✅ |

## Development Modes

### Local Development (with LocalStack)
- Uses `.env.local` configuration
- Connects to LocalStack for AWS services
- Uses local MySQL database

### Docker Development
- Uses Docker Compose environment variables
- All services run in containers
- Automatically configured for LocalStack

### Production
- Uses production AWS services
- Requires real AWS credentials
- Uses production database

## AWS Services Setup

### LocalStack (Development)
```bash
# Start LocalStack with Docker Compose
docker-compose up localstack

# Check LocalStack health
curl http://localhost:4566/_localstack/health
```

### Real AWS (Production)
1. Create Cognito User Pool
2. Create S3 bucket
3. Set up CloudFront distribution
4. Configure IAM roles and policies
5. Update environment variables with real values

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check `DB_HOST`, `DB_USER`, `DB_PASSWORD`
   - Ensure MySQL is running

2. **AWS services not accessible**
   - Check `AWS_ENDPOINT_URL` for LocalStack
   - Verify AWS credentials

3. **Cognito authentication failed**
   - Verify `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID`
   - Check user pool exists

4. **S3 upload failed**
   - Check `S3_BUCKET_NAME`
   - Verify bucket exists and permissions
