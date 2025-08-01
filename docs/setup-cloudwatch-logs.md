# 📋 Setup CloudWatch Logs cho Group6 Blog

Hướng dẫn cấu hình để gửi application logs lên AWS CloudWatch Logs.

## 🎯 Overview

CloudWatch Logs cho phép:
- Centralized logging từ nhiều EC2 instances
- Real-time log monitoring và alerting
- Log aggregation và search
- Integration với CloudWatch Insights

## 🔧 Method 1: CloudWatch Logs Agent (Recommended)

### Step 1: Install CloudWatch Logs Agent trên EC2
```bash
# Download và install agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Hoặc cho Ubuntu/Debian:
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

### Step 2: Create CloudWatch Agent Config
```json
{
  "agent": {
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/group6blog/app.log",
            "log_group_name": "/aws/ec2/group6blog",
            "log_stream_name": "{instance_id}/application",
            "timezone": "UTC",
            "timestamp_format": "%Y-%m-%d %H:%M:%S"
          },
          {
            "file_path": "/var/log/group6blog/error.log", 
            "log_group_name": "/aws/ec2/group6blog",
            "log_stream_name": "{instance_id}/errors",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
```

### Step 3: Start CloudWatch Agent
```bash
# Copy config file
sudo cp cloudwatch-config.json /opt/aws/amazon-cloudwatch-agent/etc/

# Start agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json \
    -s
```

## 🔧 Method 2: Winston CloudWatch Transport

### Step 1: Install Dependencies
```bash
cd app
npm install winston-cloudwatch --save
```

### Step 2: Update logger.js
```javascript
const winston = require('winston');
const CloudWatchTransport = require('winston-cloudwatch');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        
        // File transport
        new winston.transports.File({ 
            filename: 'logs/app.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // CloudWatch Logs transport (only in production)
        ...(process.env.NODE_ENV === 'production' && process.env.AWS_REGION ? [
            new CloudWatchTransport({
                logGroupName: '/aws/ec2/group6blog',
                logStreamName: `application-${process.env.INSTANCE_ID || 'local'}`,
                awsRegion: process.env.AWS_REGION,
                jsonMessage: true,
                retentionInDays: 30
            })
        ] : [])
    ]
});

module.exports = logger;
```

### Step 3: Update Environment Variables
```bash
# .env hoặc environment setup
NODE_ENV=production
AWS_REGION=us-east-1
INSTANCE_ID=i-1234567890abcdef0  # Optional: EC2 instance ID
```

## 📊 Viewing Logs trong CloudWatch Console

### Step 1: Navigate to CloudWatch Logs
```
AWS Console → CloudWatch → Logs → Log groups
```

### Step 2: Find Your Log Group
```
Log group: /aws/ec2/group6blog
Log streams: 
  - application-{instance-id}
  - errors-{instance-id}
```

### Step 3: Search và Filter Logs
```javascript
// CloudWatch Logs Insights queries
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

// Filter by specific operations
fields @timestamp, level, message, meta.operation
| filter meta.operation = "cloudwatch_put_metric"
| sort @timestamp desc

// Authentication logs
fields @timestamp, @message
| filter @message like /Authentication/
| stats count() by bin(1h)
```

## 🔍 Sample Log Entries

### HTTP Request Log
```json
{
  "@timestamp": "2025-08-01T10:30:15.123Z",
  "level": "http",
  "message": "2025-08-01T10:30:15.123Z - GET /api/blogs - 200",
  "meta": {
    "method": "GET",
    "url": "/api/blogs",
    "statusCode": 200,
    "responseTime": 45,
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Error Log
```json
{
  "@timestamp": "2025-08-01T10:31:20.456Z",
  "level": "error", 
  "message": "Database connection failed",
  "meta": {
    "operation": "database_connect",
    "error": "Connection timeout",
    "stack": "Error: Connection timeout\n    at..."
  }
}
```

### CloudWatch Metric Log
```json
{
  "@timestamp": "2025-08-01T10:30:15.200Z",
  "level": "debug",
  "message": "CloudWatch metric sent",
  "meta": {
    "metricName": "RequestCount",
    "value": 1,
    "unit": "Count",
    "dimensions": {
      "Method": "GET",
      "StatusCode": "200"
    }
  }
}
```

## 🚨 Log-based Alarms

### Error Rate Alarm
```json
{
  "filterName": "ErrorFilter",
  "filterPattern": "{ $.level = \"error\" }",
  "metricTransformation": {
    "metricName": "ApplicationErrors",
    "metricNamespace": "Group6Blog/Logs",
    "metricValue": "1"
  }
}
```

### High Response Time Alarm
```json
{
  "filterName": "SlowRequestFilter", 
  "filterPattern": "{ $.meta.responseTime > 1000 }",
  "metricTransformation": {
    "metricName": "SlowRequests",
    "metricNamespace": "Group6Blog/Logs", 
    "metricValue": "$.meta.responseTime"
  }
}
```

## 💰 Cost Considerations

### CloudWatch Logs Pricing
- **Ingestion**: $0.50 per GB ingested
- **Storage**: $0.03 per GB per month
- **Archive**: $0.0036 per GB per month (after 30 days)

### Cost Optimization
```javascript
// Set log retention
const retentionInDays = 30; // vs default unlimited

// Filter sensitive logs
const shouldLog = (level, message) => {
    if (level === 'debug' && process.env.NODE_ENV === 'production') {
        return false; // Skip debug logs in production
    }
    return true;
};

// Batch log uploads
const cloudWatchTransport = new CloudWatchTransport({
    uploadRate: 2000, // Upload every 2 seconds
    logRetentionInDays: 30
});
```

## 🔧 PowerShell Setup Script

```powershell
# setup-cloudwatch-logs.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$LogGroupName = "/aws/ec2/group6blog",
    
    [Parameter(Mandatory=$false)]
    [int]$RetentionDays = 30
)

# Create log group
aws logs create-log-group --log-group-name $LogGroupName

# Set retention policy
aws logs put-retention-policy `
    --log-group-name $LogGroupName `
    --retention-in-days $RetentionDays

Write-Host "✅ CloudWatch Logs setup completed!" -ForegroundColor Green
Write-Host "Log Group: $LogGroupName" -ForegroundColor Cyan
Write-Host "Retention: $RetentionDays days" -ForegroundColor Cyan
```

## 🎯 Next Steps

1. **Choose method**: CloudWatch Agent (recommended) hoặc Winston transport
2. **Setup log group**: `/aws/ec2/group6blog`
3. **Configure application**: Update logger.js với CloudWatch transport
4. **Test logging**: Generate traffic và check CloudWatch Logs console
5. **Setup alarms**: Create log-based metric filters và alarms
6. **Optimize costs**: Set appropriate retention policies

Sau khi setup, bạn sẽ thấy logs real-time trong CloudWatch Logs console!
