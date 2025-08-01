# 📊 CloudWatch Console Monitoring Guide

Hướng dẫn sử dụng AWS CloudWatch Console để monitor và phân tích logs từ Group6 Blog Platform.

## 🎯 Overview

Ứng dụng Group6 Blog hiện tại đang gửi các metrics sau lên CloudWatch:
- **HTTP Requests**: RequestCount, ResponseTime, ErrorCount, SuccessCount
- **Authentication**: AuthenticationAttempt (Success/Failure)
- **Blog Operations**: BlogOperation (Create/Read/Update/Delete)
- **Database Operations**: DatabaseOperation, DatabaseResponseTime
- **S3 Operations**: S3Operation, S3ObjectSize
- **Application Errors**: ApplicationError

## 📈 Accessing CloudWatch Metrics

### Step 1: Navigate to CloudWatch
1. Đăng nhập AWS Console
2. Tìm kiếm **CloudWatch** trong search bar hoặc Services menu
3. CloudWatch Dashboard → Left sidebar → **Metrics** → **All metrics**

### Step 2: Find Application Metrics
1. Trong **Browse** tab, scroll xuống tìm **Custom namespaces**
2. Click **Group6Blog** (nếu đã có metrics) → **Application**
3. Bạn sẽ thấy các metric dimensions groups:
   - **Method** (GET, POST, PUT, DELETE)
   - **Method, StatusCode** (GET 200, POST 400, etc.)
   - **Method, Url** (GET /, POST /api/blogs, etc.)
   - **Operation** (SELECT, INSERT, UPDATE, DELETE)
   - **AuthMethod, Result** (password Success/Failure)
   - **ErrorType** (ValidationError, DatabaseError, etc.)

## 🔍 Common Monitoring Scenarios

### Scenario 1: Monitor API Response Times
```
Namespace: Group6Blog/Application
Metric: ResponseTime
Dimensions: Method = GET, POST, PUT, DELETE
```

**Steps:**
1. CloudWatch → Metrics → All metrics → **Browse** tab
2. Custom namespaces → **Group6Blog** → **Application** 
3. Click **Method** dimension group
4. Tick chọn các **ResponseTime** metrics với Methods khác nhau (GET, POST, etc.)
5. Click **Add to graph** button
6. Xem chart timeline ở phần graph
7. Để xem raw data: Click **Actions** → **View in metrics** hoặc hover trên data points để xem values

**Insight questions:**
- API nào có response time cao nhất?
- Response time có tăng theo thời gian không?
- Có spike bất thường nào không?

### Scenario 2: Track Error Rates
```
Namespace: Group6Blog/Application
Metrics: ErrorCount vs SuccessCount
Dimensions: Method, StatusCode
```

**Steps:**
1. Custom namespaces → **Group6Blog** → **Application**
2. Click **Method, StatusCode** dimension group
3. Tick chọn **ErrorCount** metrics (status codes 4xx, 5xx)
4. Tick chọn **SuccessCount** metrics (status codes 2xx)
5. Click **Add to graph**
6. Configure metrics: Period 5 minutes, Statistic Sum (in metric options panel)
7. Tạo **Math expression**: Click **Add math** → **Start with empty expression**
   ```
   Error Rate = m2/(m1+m2)*100
   ```
   (where m1=SuccessCount, m2=ErrorCount)

**Analysis:**
- Error rate bình thường là bao nhiêu %?
- Endpoint nào có error rate cao nhất?
- Error rate tăng vào thời điểm nào?

### Scenario 3: Database Performance Monitoring
```
Namespace: Group6Blog/Application
Metrics: DatabaseResponseTime, DatabaseOperation
Dimensions: Operation = SELECT, INSERT, UPDATE, DELETE
```

**Steps:**
1. Custom namespaces → **Group6Blog** → **Application**
2. Click **Operation** dimension group
3. Tick chọn **DatabaseResponseTime** cho các operations: SELECT, INSERT, UPDATE, DELETE
4. Click **Add to graph**
5. Configure metrics: Statistic = Average, Period = 1 minute
6. Time range selector (góc phải): Last 1 hour

**Key insights:**
- Query nào chậm nhất?
- Database performance có degradation không?
- Có bottleneck ở operation nào không?

### Scenario 4: Authentication Analysis
```
Namespace: Group6Blog/Application
Metric: AuthenticationAttempt
Dimensions: AuthMethod, Result
```

**Steps:**
1. Custom namespaces → **Group6Blog** → **Application**
2. Click **AuthMethod, Result** dimension group
3. Tick chọn **AuthenticationAttempt** metrics:
   - password, Success
   - password, Failure
4. Click **Add to graph**
5. Configure: Statistic = Sum, Period = 15 minutes

**To view detailed data:**
- Hover over chart points để xem exact values
- Click **Actions** menu → **View source** để xem metric details
- Download data: **Actions** → **Download as CSV**

**Security insights:**
- Bao nhiêu login attempts mỗi giờ?
- Success rate của authentication?
- Có attack patterns không?

### Scenario 5: S3 Upload Monitoring
```
Namespace: Group6Blog/Application
Metrics: S3Operation, S3ObjectSize
Dimensions: Operation, Result
```

**Steps:**
1. Custom namespaces → **Group6Blog** → **Application**
2. Click **Operation, Result** dimension group
3. Tick chọn **S3Operation** metrics cho:
   - putObject, Success
   - putObject, Failure
   - getObject, Success
   - getObject, Failure
4. Click **Add to graph**
5. Optionally add **S3ObjectSize** metrics từ **Operation** dimension group

**File management insights:**
- Bao nhiêu files được upload mỗi ngày?
- Average file size?
- Upload success rate?

## 🎨 Creating Custom Dashboards

### Dashboard 1: Application Overview
1. CloudWatch → **Dashboards** (left sidebar) → **Create dashboard**
2. Dashboard name: `Group6-Blog-Overview`
3. Click **Add widget**
4. **Widget type**: Line graph
5. **Data source**: CloudWatch
6. **Select metrics**: Custom namespaces → Group6Blog → Application

**Widget 1: Request Metrics**
```json
{
  "type": "metric",
  "properties": {
    "metrics": [
      ["Group6Blog/Application", "RequestCount", "Method", "GET"],
      [".", ".", ".", "POST"],
      [".", ".", ".", "PUT"],
      [".", ".", ".", "DELETE"]
    ],
    "period": 300,
    "stat": "Sum",
    "region": "us-east-1",
    "title": "HTTP Requests by Method"
  }
}
```

**Widget 2: Response Time**
```json
{
  "type": "metric",
  "properties": {
    "metrics": [
      ["Group6Blog/Application", "ResponseTime", "Method", "GET"],
      [".", ".", ".", "POST"]
    ],
    "period": 300,
    "stat": "Average",
    "region": "us-east-1",
    "title": "Average Response Time (ms)"
  }
}
```

**Widget 3: Error Rate**
```json
{
  "type": "metric",
  "properties": {
    "metrics": [
      ["Group6Blog/Application", "ErrorCount"],
      [".", "SuccessCount"]
    ],
    "period": 300,
    "stat": "Sum",
    "region": "us-east-1",
    "title": "Success vs Error Count"
  }
}
```

### Dashboard 2: Performance Deep Dive
**Widget 1: Database Performance**
```json
{
  "type": "metric",
  "properties": {
    "metrics": [
      ["Group6Blog/Application", "DatabaseResponseTime", "Operation", "SELECT"],
      [".", ".", ".", "INSERT"],
      [".", ".", ".", "UPDATE"]
    ],
    "period": 300,
    "stat": "Average",
    "title": "Database Query Performance"
  }
}
```

**Widget 2: Authentication Trends**
```json
{
  "type": "metric", 
  "properties": {
    "metrics": [
      ["Group6Blog/Application", "AuthenticationAttempt", "Result", "Success"],
      [".", ".", ".", "Failure"]
    ],
    "period": 900,
    "stat": "Sum",
    "title": "Authentication Success vs Failure"
  }
}
```

## 🚨 Setting Up Alarms

### Alarm 1: High Error Rate
1. CloudWatch → **Alarms** (left sidebar) → **Create alarm**
2. **Select metric**: 
   - **Browse** → Custom namespaces → **Group6Blog** → **Application**
   - Click appropriate dimension group → Select **ErrorCount** metric
   - Click **Select metric**
3. **Specify metric and conditions**:
   - **Statistic**: Sum
   - **Period**: 5 minutes
   - **Threshold type**: Static
   - **Whenever ErrorCount is**: Greater than **10**
4. **Configure actions**: Create SNS topic (skip in Learner Lab)
5. **Add name and description**: `Group6Blog-HighErrorRate`

### Alarm 2: Slow Response Time
1. **Select metric**: Group6Blog/Application → ResponseTime
2. **Conditions**:
   - Statistic: Average
   - Period: 5 minutes  
   - Threshold: Greater than 1000ms
3. **Notification**: Email alert

### Alarm 3: Database Performance
1. **Select metric**: Group6Blog/Application → DatabaseResponseTime
2. **Conditions**:
   - Statistic: Average
   - Period: 5 minutes
   - Threshold: Greater than 500ms

## 📊 Analyzing Metrics with CloudWatch Logs Insights

**Note**: CloudWatch Logs Insights dùng để analyze logs, không phải metrics. Để analyze metrics, dùng CloudWatch Metrics Math expressions.

### Math Expression Example: Calculate Error Rate
1. Sau khi add ErrorCount và SuccessCount metrics vào graph
2. Click **Add math** → **Start with empty expression**
3. Expression: `m2/(m1+m2)*100`
4. Label: `Error Rate %`
5. ID: `e1`

**View Data Options:**
- **Hover** trên chart points để xem values
- **Actions** → **Download as CSV** để export data
- **Actions** → **Copy permalink** để share chart
- **Time range selector** để adjust time window

### Logs Insights Queries (nếu có CloudWatch Logs):
*Note: Cần setup CloudWatch Logs agent trước để có log data*

### Query 1: Top Slowest Endpoints (Logs Insights)
```sql
fields @timestamp, @message
| filter @message like /Response time:/
| parse @message "Response time: * ms for * *" as responseTime, method, url
| stats avg(responseTime) as avgTime by url
| sort avgTime desc
| limit 10
```

### Query 2: Error Analysis by Hour (Logs Insights)
```sql
fields @timestamp, @message
| filter @message like /ERROR/
| stats count(*) as errorCount by bin(1h)
| sort @timestamp
```

### Query 3: Authentication Patterns (Logs Insights)
```sql
fields @timestamp, @message
| filter @message like /Authentication/
| parse @message "Authentication * for user: *" as result, username
| stats count(*) as attempts by result, username
| sort attempts desc
```

## 🔧 Best Practices

### 1. Set Appropriate Time Ranges
- **Real-time monitoring**: Last 1 hour
- **Daily review**: Last 24 hours  
- **Weekly analysis**: Last 7 days
- **Monthly trends**: Last 30 days

### 2. Use Annotations
- Mark deployment times
- Note when issues occurred
- Track configuration changes

### 3. Export Data
- **Actions** → **Download as CSV** cho offline analysis
- **Actions** → **Copy permalink** để share charts với team
- Schedule automated reports (CloudWatch Events + Lambda)

### 4. Cost Optimization
- Use appropriate metric resolution
- Set retention policies
- Archive old metrics

## 🎯 Key Performance Indicators (KPIs)

### Application Health
- **Error Rate**: < 1%
- **Average Response Time**: < 200ms
- **Database Query Time**: < 100ms
- **Authentication Success Rate**: > 99%

### Traffic Patterns
- **Requests per minute**: Track baseline
- **Peak hours**: Identify patterns
- **Geographic distribution**: Monitor sources

### Business Metrics
- **Blog posts created per day**
- **User registrations per hour**
- **File uploads success rate**
- **Active user sessions**

## 🚀 Advanced Use Cases

### Correlation Analysis
1. Compare error spikes with deployment times
2. Correlate slow response times with high traffic
3. Analyze authentication failures vs time of day

### Capacity Planning
1. Track request growth trends
2. Monitor resource utilization patterns
3. Predict scaling needs

### Security Monitoring
1. Unusual authentication patterns
2. Suspicious traffic sources
3. Error rate anomalies

This guide helps you leverage CloudWatch Console to gain deep insights into your Group6 Blog Platform performance and health!
