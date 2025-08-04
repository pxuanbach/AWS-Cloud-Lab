# 📝 Group6 Simple Blog Platform - AWS Cloud Architecture

## 🎯 Tổng quan ứng dụng

Ứng dụng blog đơn giản được thiết kế để demo việc triển khai một hệ thống web hoàn chỉnh trên AWS Cloud, bao gồm các thành phần từ frontend, backend, database đến các dịch vụ quản lý như authentication, storage và monitoring.

## 🏗️ Kiến trúc hệ thống AWS

```
                    ┌─────────────┐
                    │   Internet  │
                    └─────────────┘
                            │
                   ┌──────────────┐
                   │ CloudFront   │ (CDN - Future Enhancement)
                   └──────────────┘
                            │
            ┌───────────────────────────────────────────────────────┐
            │                  AWS Cloud (us-east-1)               │
            │                                                       │
            │  ┌─────────────────────────────────────────────────┐  │
            │  │            VPC (Group_6-VPC)                   │  │
            │  │              10.0.0.0/16                       │  │
            │  │                                                 │  │
            │  │  ┌─────────────────────────────────────────┐    │  │
            │  │  │           Public Subnets                │    │  │
            │  │  │                                         │    │  │
            │  │  │  ┌─────────────────────────────────────┐│    │  │
            │  │  │  │   Application Load Balancer (ALB)   ││    │  │
            │  │  │  │         Group6-ALB                  ││    │  │
            │  │  │  │     (Spans both AZs)                ││    │  │
            │  │  │  └─────────────────────────────────────┘│    │  │
            │  │  │                                         │    │  │
            │  │  │  AZ-1a (10.0.1.0/24)  AZ-1b (10.0.2.0/24) │  │
            │  │  │  ┌─────────────────┐   ┌─────────────────┐ │  │
            │  │  │  │   Bastion Host  │   │   NAT Gateway   │ │  │
            │  │  │  │   NAT Gateway   │   │                 │ │  │
            │  │  │  └─────────────────┘   └─────────────────┘ │  │
            │  │  └─────────────────────────────────────────┘    │  │
            │  │                        │                        │  │
            │  │  ┌─────────────────────────────────────────┐    │  │
            │  │  │          Private Subnets                │    │  │
            │  │  │                                         │    │  │
            │  │  │  AZ-1a (10.0.3.0/24)  AZ-1b (10.0.4.0/24) │  │
            │  │  │  ┌─────────────────┐   ┌─────────────────┐ │  │
            │  │  │  │   EC2 Instance  │   │   EC2 Instance  │ │  │
            │  │  │  │    Node.js App  │   │    Node.js App  │ │  │
            │  │  │  │  (Auto Scaling) │   │  (Auto Scaling) │ │  │
            │  │  │  └─────────────────┘   └─────────────────┘ │  │
            │  │  └─────────────────────────────────────────┘    │  │
            │  │                        │                        │  │
            │  │  ┌─────────────────────────────────────────┐    │  │
            │  │  │         Database Subnets                │    │  │
            │  │  │                                         │    │  │
            │  │  │  AZ-1a (10.0.5.0/24)  AZ-1b (10.0.6.0/24) │  │
            │  │  │  ┌─────────────────┐   ┌─────────────────┐ │  │
            │  │  │  │  RDS MySQL      │   │  RDS MySQL      │ │  │
            │  │  │  │   Primary       │◄─►│   Standby       │ │  │
            │  │  │  │  (Multi-AZ)     │   │  (Multi-AZ)     │ │  │
            │  │  │  └─────────────────┘   └─────────────────┘ │  │
            │  │  └─────────────────────────────────────────┘    │  │
            │  └─────────────────────────────────────────────────┘  │
            │                                                       │
            │  ┌─────────────────────────────────────────────────┐  │
            │  │              External Services                  │  │
            │  │  ┌─────────────────┐   ┌─────────────────────┐  │  │
            │  │  │   S3 Bucket     │   │    CloudWatch       │  │  │
            │  │  │  Static Files   │   │   Monitoring &      │  │  │
            │  │  │                 │   │      Logs           │  │  │
            │  │  └─────────────────┘   └─────────────────────┘  │  │
            │  │                                                 │  │
            │  │  ┌─────────────────┐   ┌─────────────────────┐  │  │
            │  │  │   CloudTrail    │   │    IAM Service      │  │  │
            │  │  │  API Audit      │   │  User & Role        │  │  │
            │  │  │     Logs        │   │   Management        │  │  │
            │  │  └─────────────────┘   └─────────────────────┘  │  │
            │  └─────────────────────────────────────────────────┘  │
            └───────────────────────────────────────────────────────┘
```

## � IAM Security Architecture

### 5-Tier Permission Model
```
┌─────────────────┬──────────────────┬─────────────────────────────┐
│     Role        │     Users        │         Permissions         │
├─────────────────┼──────────────────┼─────────────────────────────┤
│ 🔴 Root-Admins  │ group6-root-admin│ • Full AWS Access          │
│                 │                  │ • Account Management        │
├─────────────────┼──────────────────┼─────────────────────────────┤
│ 🔵 DevOps-Team  │ group6-devops    │ • EC2, RDS, ALB Full Access │
│                 │                  │ • Infrastructure Management │
├─────────────────┼──────────────────┼─────────────────────────────┤
│ 🟢 Developers   │ group6-dev       │ • S3 Read/Write             │
│                 │                  │ • EC2 Describe, RDS ReadOnly│
├─────────────────┼──────────────────┼─────────────────────────────┤
│ 🟣 QA-Team      │ group6-qa        │ • S3, RDS Read Only         │
│                 │                  │ • CloudWatch Monitoring     │
├─────────────────┼──────────────────┼─────────────────────────────┤
│ 🟠 Security     │ group6-security  │ • CloudTrail Full Access    │
│                 │                  │ • Security Auditing         │
└─────────────────┴──────────────────┴─────────────────────────────┘
```

## 🌐 Network Architecture

### VPC Design (10.0.0.0/16)
```
┌─────────────────────────────────────────────────────────────┐
│                    Availability Zones                      │
├──────────────────────────┬──────────────────────────────────┤
│         AZ-1a            │            AZ-1b                 │
├──────────────────────────┼──────────────────────────────────┤
│ Public Subnet (10.0.1.0/24) │ Public Subnet (10.0.2.0/24) │
│ • Bastion Host           │ • NAT Gateway 2              │
│ • NAT Gateway 1          │                              │
├──────────────────────────┼──────────────────────────────────┤
│ Private Subnet (10.0.3.0/24)│ Private Subnet (10.0.4.0/24)│
│ • EC2 Instance 1         │ • EC2 Instance 2             │
│ • Node.js Application    │ • Node.js Application        │
├──────────────────────────┼──────────────────────────────────┤
│ DB Subnet (10.0.5.0/24) │ DB Subnet (10.0.6.0/24)     │
│ • RDS MySQL Primary      │ • RDS MySQL Standby         │
│ • Multi-AZ Setup         │ • Automatic Failover        │
└──────────────────────────┴──────────────────────────────────┘
```

## �🔧 Technology Stack

### Frontend
- **HTML5 + CSS3**: Responsive design với Bootstrap 5
- **Vanilla JavaScript**: Client-side logic và API interactions

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework với RESTful APIs
- **Multer**: File upload middleware
- **JWT**: Token-based authentication

### Database
- **MySQL 8.0**: Relational database trên RDS
- **Multi-AZ deployment**: High availability setup

### AWS Integration
- **S3 Presigned URLs**: Secure file upload/download
- **IAM Instance Profiles**: Secure credential management cho EC2
- **CloudWatch SDK**: Custom metrics và logging
