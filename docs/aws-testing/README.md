 🧪 AWS Cloud Lab - Testing & Monitoring Guides

Tài liệu hướng dẫn testing và monitoring cho Group6 Blog Platform trên AWS.

## 📋 Testing Guides Overview

| Guide | Mô tả | Thời gian | Skill Level |
|-------|-------|-----------|-------------|
| [00-testing-guide.md](00-testing-guide.md) | Tổng quan testing strategy và overview | 10 phút | Beginner |
| [01-high-availability-testing.md](01-high-availability-testing.md) | Test tính sẵn sàng cao với Multi-AZ | 30 phút | Intermediate |
| [02-security-user-management-testing.md](02-security-user-management-testing.md) | Test security và user management | 25 phút | Intermediate |
| [03-monitoring-logging-testing.md](03-monitoring-logging-testing.md) | Test monitoring và logging systems | 20 phút | Intermediate |
| [04-performance-results-testing.md](04-performance-results-testing.md) | Performance testing và load testing | 35 phút | Advanced |

## 📊 CloudWatch Monitoring Guides

| Guide | Mô tả | Thời gian | Skill Level |
|-------|-------|-----------|-------------|
| [05-cloudwatch-console-guide.md](05-cloudwatch-console-guide.md) | Hướng dẫn sử dụng CloudWatch Console | 15 phút | Beginner |
| [06-cloudwatch-hands-on-lab.md](06-cloudwatch-hands-on-lab.md) | Thực hành CloudWatch monitoring | 2 giờ | Intermediate |

## 🛠️ Supporting Scripts

| Script | Mô tả | Platform |
|--------|-------|----------|
| `../scripts/setup-cloudwatch-monitoring.ps1` | Tự động setup CloudWatch dashboard & alarms | PowerShell |
| `../scripts/generate-test-metrics.ps1` | Generate sample metrics data cho testing | PowerShell |

## 🚀 Quick Start

### 1. Setup CloudWatch Monitoring
```powershell
# Tạo dashboard và alarms tự động
.\scripts\setup-cloudwatch-monitoring.ps1 -Region "us-east-1"
```

### 2. Generate Test Data
```powershell
# Generate sample metrics cho 5 phút
.\scripts\generate-test-metrics.ps1 -Duration 300 -RequestsPerMinute 15 -IncludeErrors
```

### 3. Start Hands-on Lab
```powershell
# Mở CloudWatch Console và theo hướng dẫn
Start-Process "https://console.aws.amazon.com/cloudwatch/"
# Follow: 06-cloudwatch-hands-on-lab.md
```

## 📈 Learning Path

### Beginner → Intermediate
1. **Start here**: [05-cloudwatch-console-guide.md](05-cloudwatch-console-guide.md)
2. **Practice**: [06-cloudwatch-hands-on-lab.md](06-cloudwatch-hands-on-lab.md) (Labs 1-3)
3. **Apply**: [00-testing-guide.md](00-testing-guide.md)

### Intermediate → Advanced  
1. **Deep dive**: [06-cloudwatch-hands-on-lab.md](06-cloudwatch-hands-on-lab.md) (Labs 4-8)
2. **Test scenarios**: [01-high-availability-testing.md](01-high-availability-testing.md)
3. **Performance**: [04-performance-results-testing.md](04-performance-results-testing.md)

### Production Ready
1. **Security**: [02-security-user-management-testing.md](02-security-user-management-testing.md)
2. **Monitoring**: [03-monitoring-logging-testing.md](03-monitoring-logging-testing.md)
3. **Automation**: Setup scripts và CI/CD integration

## 🎯 Key Features Covered

### ✅ CloudWatch Monitoring
- Custom metrics collection từ Node.js app
- Real-time dashboards với business metrics
- Automated alerting cho production issues
- Log aggregation và analysis
- Performance optimization insights

### ✅ High Availability Testing
- Multi-AZ failover scenarios
- Load balancer health checks
- Auto Scaling Group testing
- Database failover validation
- Network resilience testing

### ✅ Security Validation
- IAM roles và permissions testing
- Security group rule validation
- Authentication flow testing
- Access control verification
- Audit trail validation

### ✅ Performance Analysis
- Load testing với realistic scenarios
- Response time optimization
- Database performance tuning
- CDN effectiveness validation
- Resource utilization analysis

## 🔧 Prerequisites

### Required Knowledge
- Basic AWS services understanding
- Command line familiarity (PowerShell)
- Web application concepts
- Basic monitoring concepts

### Required Setup
- ✅ AWS Cloud Lab environment deployed
- ✅ Group6 Blog application running
- ✅ CloudWatch setup completed
- ✅ PowerShell 5.1+ installed

### Optional Tools
- AWS CLI configured
- Postman hoặc similar API testing tool
- Browser developer tools familiarity

## 📚 Additional Resources

### AWS Documentation
- [CloudWatch User Guide](https://docs.aws.amazon.com/cloudwatch/)
- [CloudWatch Metrics](https://docs.aws.amazon.com/cloudwatch/latest/monitoring/working_with_metrics.html)
- [CloudWatch Alarms](https://docs.aws.amazon.com/cloudwatch/latest/monitoring/AlarmThatSendsEmail.html)

### Best Practices
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Monitoring Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/monitor-workload-resources.html)
- [Performance Optimization](https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html)

### Community Resources
- AWS re:Invent sessions on monitoring
- CloudWatch community forums
- AWS Architecture Center examples

## 🆘 Troubleshooting

### Common Issues
1. **Metrics not appearing**: Check AWS credentials và region
2. **Permission denied**: Verify IAM roles và policies
3. **Dashboard empty**: Ensure application is generating metrics
4. **Scripts failing**: Check PowerShell execution policy

### Support Contacts
- AWS Support (if available in your account)
- Course instructor hoặc TA
- Peer study groups
- AWS Community forums

---

**💡 Pro Tip**: Start with the CloudWatch Console Guide để build foundational understanding, then progress through hands-on labs để gain practical experience!

Happy monitoring! 📊✨
