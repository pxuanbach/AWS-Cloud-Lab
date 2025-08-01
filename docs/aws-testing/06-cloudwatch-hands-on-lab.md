# 🎯 CloudWatch Hands-on Lab Guide

Hướng dẫn thực hành tương tác với CloudWatch Console để phân tích metrics từ Group6 Blog Platform.

## 🚀 Prerequisites

1. ✅ Ứng dụng Group6 Blog đang chạy và gửi metrics
2. ✅ CloudWatch đã được setup (theo `8.CloudWatch.md`)
3. ✅ AWS Console access với quyền CloudWatch

## 📚 Lab Exercises

### Lab 1: Basic Metrics Exploration (10 phút)

**Objective**: Làm quen với CloudWatch Console và tìm hiểu metrics structure

**Steps:**
1. **Navigate to CloudWatch Console**
   ```
   AWS Console → CloudWatch → Metrics → All metrics
   ```

2. **Explore Custom Namespace**
   - Click **Custom namespaces**
   - Tìm **Group6Blog** → **Application**
   - Xem structure: `By Method`, `By Method, StatusCode`, `By Operation`

3. **View Request Metrics**
   - Click **By Method**
   - Select metrics: `RequestCount` với Method = GET, POST
   - **Graphed metrics** tab
   - Period: **5 minutes**
   - Statistic: **Sum**

**Expected Result**: Chart hiển thị request volume theo method

**Screenshot checkpoint**: Lưu chart với title "HTTP Requests by Method"

---

### Lab 2: Performance Analysis (15 phút)

**Objective**: Phân tích performance metrics và identify bottlenecks

**Steps:**
1. **Response Time Analysis**
   ```
   Group6Blog/Application → By Method
   Select: ResponseTime (GET, POST, PUT, DELETE)
   Statistic: Average
   Period: 1 minute
   ```

2. **Create Custom Time Range**
   - Time range: **Last 1 hour**
   - Refresh: **Auto refresh 1 minute**

3. **Add Horizontal Line for SLA**
   - **Graphed metrics** → **Add horizontal annotation**
   - Value: `200` (SLA target: 200ms)
   - Label: "SLA Target"
   - Color: Red

4. **Database Performance Correlation**
   - Add new metrics: `DatabaseResponseTime`
   - Dimensions: Operation = SELECT, INSERT, UPDATE
   - Compare với `ResponseTime`

**Analysis Questions:**
- Endpoint nào có response time cao nhất?
- Database operation nào chậm nhất?
- Có correlation giữa database và API response time không?

**Expected Result**: Multi-line chart showing API và DB response times with SLA line

---

### Lab 3: Error Rate Monitoring (15 phút)

**Objective**: Tính toán và visualize error rates

**Steps:**
1. **Collect Error Metrics**
   ```
   Group6Blog/Application → By Method, StatusCode
   Select: ErrorCount và SuccessCount
   All Methods (GET, POST, PUT, DELETE)
   Statistic: Sum
   Period: 5 minutes
   ```

2. **Create Error Rate Formula**
   - **Graphed metrics** → **Math** → **Add math expression**
   - Expression ID: `e1`
   - Expression: `m2/(m1+m2)*100`
   - Label: "Error Rate (%)"
   - Where:
     - m1 = SuccessCount
     - m2 = ErrorCount

3. **Set Y-axis Range**
   - **Graph options** → **Left Y axis**
   - Min: 0, Max: 10 (for 0-10% range)

4. **Add Target Line**
   - **Add horizontal annotation**
   - Value: `1` (1% error rate target)
   - Label: "Error Rate Target"

**Analysis Questions:**
- Error rate hiện tại là bao nhiêu %?
- Method nào có error rate cao nhất?
- Có pattern nào trong error distribution không?

---

### Lab 4: Authentication Security Analysis (20 phút)

**Objective**: Monitor authentication patterns và detect security issues

**Steps:**
1. **Authentication Success Rate**
   ```
   Group6Blog/Application → By AuthMethod, Result
   Select: AuthenticationAttempt
   Dimensions: Result = Success, Failure
   Statistic: Sum
   Period: 15 minutes
   ```

2. **Create Success Rate Calculation**
   - Math expression: `m1/(m1+m2)*100`
   - Where:
     - m1 = Success count
     - m2 = Failure count

3. **Time-based Analysis**
   - Change time range: **Last 24 hours**
   - Period: **1 hour**
   - Observe patterns by time of day

4. **Rate Analysis**
   - Add math expression for failure rate per hour:
   - Expression: `RATE(m2)`
   - Label: "Failed Logins per Second"

**Security Insights:**
- Bao nhiêu login attempts per hour?
- Có spike bất thường trong failed attempts không?
- Pattern nào suspicious (ví dụ: many failures from same source)?

**Red flags to look for:**
- Failure rate > 50 attempts/hour
- Success rate < 90%
- Unusual time patterns (attacks at night)

---

### Lab 5: Business Metrics Dashboard (25 phút)

**Objective**: Tạo custom dashboard cho business stakeholders

**Steps:**
1. **Create New Dashboard**
   ```
   CloudWatch → Dashboards → Create dashboard
   Name: "Group6-Blog-Business-Metrics"
   ```

2. **Widget 1: Daily Active Users (Line chart)**
   ```json
   Metric: AuthenticationAttempt (Result=Success)
   Statistic: Sum
   Period: 1 hour
   Time range: Last 7 days
   Title: "Daily Login Sessions"
   ```

3. **Widget 2: Content Creation (Number)**
   ```json
   Metric: BlogOperation (Operation=CREATE)
   Statistic: Sum
   Period: 1 day
   Time range: Last 30 days
   Title: "New Posts Created Today"
   ```

4. **Widget 3: File Upload Activity (Stacked area)**
   ```json
   Metrics: S3Operation (Operation=putObject)
   Dimensions: Result = Success, Failure
   Statistic: Sum
   Period: 1 hour
   Title: "File Upload Activity"
   ```

5. **Widget 4: System Health (Gauge)**
   ```json
   Math expression: (SuccessCount/(SuccessCount+ErrorCount))*100
   Title: "System Availability %"
   Gauge range: 0-100
   Healthy: >99%
   ```

**Dashboard Layout:**
```
┌─────────────────┬─────────────────┐
│ Daily Logins    │ New Posts Today │
│ (Line chart)    │ (Number)        │
├─────────────────┼─────────────────┤
│ File Uploads    │ System Health   │
│ (Stacked area)  │ (Gauge)         │
└─────────────────┴─────────────────┘
```

---

### Lab 6: Advanced Insights with CloudWatch Insights (20 phút)

**Objective**: Sử dụng CloudWatch Insights để deep-dive analysis

**Steps:**
1. **Access CloudWatch Insights**
   ```
   CloudWatch → Logs → Insights
   Select log groups: /aws/ec2/group6blog (nếu có)
   ```

2. **Query 1: Top Slow Endpoints**
   ```sql
   fields @timestamp, @message
   | filter @message like /Response time:/
   | parse @message "Response time: * ms for * *" as responseTime, method, url
   | stats avg(responseTime) as avgTime by url
   | sort avgTime desc
   | limit 10
   ```

3. **Query 2: Error Analysis by Hour**
   ```sql
   fields @timestamp, @message
   | filter @message like /ERROR/
   | stats count(*) as errorCount by bin(5m)
   | sort @timestamp
   ```

4. **Query 3: Authentication Failure Investigation**
   ```sql
   fields @timestamp, @message
   | filter @message like /Authentication failed/
   | parse @message "Authentication failed for user: *" as username
   | stats count(*) as attempts by username
   | sort attempts desc
   ```

**Advanced Analysis:**
- Pattern recognition trong logs
- Correlation analysis
- Trend identification

---

### Lab 7: Alerting Setup (15 phút)

**Objective**: Tạo meaningful alarms cho production monitoring

**Steps:**
1. **High Error Rate Alarm**
   ```
   CloudWatch → Alarms → Create alarm
   Metric: Group6Blog/Application > ErrorCount
   Statistic: Sum
   Period: 5 minutes
   Threshold: > 5 errors
   Evaluation periods: 2 out of 2
   ```

2. **Slow Response Time Alarm**
   ```
   Metric: ResponseTime
   Statistic: Average  
   Period: 5 minutes
   Threshold: > 500ms
   Evaluation periods: 3 out of 3
   ```

3. **Authentication Attack Detection**
   ```
   Metric: AuthenticationAttempt (Result=Failure)
   Statistic: Sum
   Period: 15 minutes
   Threshold: > 20 failures
   Evaluation periods: 1 out of 1
   ```

4. **Composite Alarm: System Health**
   ```
   CloudWatch → Alarms → Create composite alarm
   Alarm rule: 
   (ErrorRateAlarm OR SlowResponseAlarm) AND NOT MaintenanceMode
   ```

---

### Lab 8: Cost Optimization Analysis (10 phút)

**Objective**: Understand CloudWatch costs và optimize usage

**Steps:**
1. **Check Metric Usage**
   ```
   CloudWatch → Metrics → All metrics
   Custom namespaces → Count total metrics
   Estimate: ~20 custom metrics × $0.30 = $6/month
   ```

2. **Log Storage Analysis**
   ```
   CloudWatch → Logs → Log groups
   Check storage usage và retention settings
   Recommend: 30 days retention for application logs
   ```

3. **Dashboard Cost**
   ```
   CloudWatch → Dashboards
   Count custom dashboards: Each $3/month
   Optimize: Combine related metrics into fewer dashboards
   ```

**Cost Optimization Tips:**
- Reduce metric granularity cho non-critical metrics
- Set appropriate log retention periods
- Use composite alarms instead of multiple individual alarms
- Consider using CloudWatch agent for system metrics instead of custom metrics

---

## 🎯 Lab Summary & Next Steps

### What You've Learned:
✅ Navigate CloudWatch Console efficiently  
✅ Analyze performance metrics và identify bottlenecks  
✅ Calculate error rates và success metrics  
✅ Monitor authentication security patterns  
✅ Create business-focused dashboards  
✅ Use CloudWatch Insights for log analysis  
✅ Set up meaningful alarms  
✅ Understand cost implications  

### Production Readiness Checklist:
- [ ] All critical alarms configured
- [ ] Dashboard shared with team
- [ ] Runbook created for alarm response
- [ ] Cost optimization implemented
- [ ] Retention policies set
- [ ] Backup monitoring strategy defined

### Advanced Topics to Explore:
1. **Custom Metrics API** - Programmatic metric creation
2. **CloudWatch Events** - Event-driven monitoring
3. **X-Ray Integration** - Distributed tracing
4. **Container Insights** - ECS/EKS monitoring
5. **Synthetic Monitoring** - Proactive testing

Remember: Monitoring is iterative! Continuously refine your dashboards và alarms based on operational experience.
