# 🚀 QuickStart Guide - Docker Development

Hướng dẫn nhanh để khởi chạy ứng dụng Blog với Docker trong môi trường phát triển local.

## 📋 Yêu cầu hệ thống

- **Docker Desktop**: Phiên bản 20.10+ 
- **Docker Compose**: V2.0+
- **PowerShell**: Windows PowerShell 5.1+ hoặc PowerShell Core 7+

## 🏃‍♂️ Khởi chạy nhanh

### Bước 1: Clone repository
```powershell
git clone https://github.com/pxuanbach/AWS-Cloud-Lab.git
cd AWS-Cloud-Lab
```

### Bước 2: Kiểm tra Docker
```powershell
# Kiểm tra Docker đang chạy
docker --version
docker-compose --version

# Khởi động Docker Desktop nếu chưa chạy
```

### Bước 3: Khởi chạy ứng dụng
```powershell
# Sử dụng script tự động (Windows)
.\start-dev.ps1

# Hoặc chạy thủ công
docker-compose up -d --build
```

### Bước 4: Chờ services khởi động
```powershell
# Kiểm tra trạng thái services
docker-compose ps

# Xem logs để theo dõi
docker-compose logs -f
```

## Docker Services

```
┌─────────────────────────────────────────────────────┐
│                Docker Network                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │    Nginx    │  │   Blog App  │  │    MySQL    │ │
│  │   :8080     │──│    :3000    │──│    :3306    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │    MinIO    │  │Cognito Local│  │   Seeder    │ │
│  │ :9000,:9001 │  │    :9229    │  │   (temp)    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 5. Nginx (Load Balancer)
- **Port**: 8080 (HTTP)
- **Purpose**: Reverse proxy cho Blog App và MinIO

## ⚙️ Setup Cognito User Pool

### Quy trình tự động
1. **Cognito Local** khởi động trước
2. **Cognito Seeder** chạy script `init-users.sh`
3. Tạo User Pool và Client ID động
4. Seeder tạo 2 users mặc định
5. **Blog App** sử dụng User Pool ID và Client ID từ environment

### Cập nhật User Pool ID

Xem logs của cognito-seeder để lấy User Pool ID mới

```powershell
docker-compose logs cognito-seeder

```

Hoặc di chuyển vào thư mục `docker/cognito-local/db` và tìm tệp `local_XXXXXXXX.json`, local_XXXXXXXX chính là giá trị của user pool id. 
Cũng tại thư mục này, mở tệp `clients.json` và xem client id đang ánh xạ đến user pool id tương ứng.

Ví dụ:
```json
{
  "Clients": {
    "2s00fkusj37pbs3ejsg3ut855": {
      "ClientId": "2s00fkusj37pbs3ejsg3ut855",
      "ClientName": "BlogAppWebClient",
      "CreationDate": "2025-07-25T07:17:52.334Z",
      "ExplicitAuthFlows": [
        "ALLOW_USER_PASSWORD_AUTH",
        "ALLOW_REFRESH_TOKEN_AUTH"
      ],
      "LastModifiedDate": "2025-07-25T07:17:52.334Z",
      "TokenValidityUnits": {
        "AccessToken": "hours",
        "IdToken": "minutes",
        "RefreshToken": "days"
      },
      "UserPoolId": "local_3Q1ktWNN"
    }
  }
}
```


**Sửa file `docker-compose.yml`:**
```yaml
environment:
  COGNITO_USER_POOL_ID: local_3Q1ktWNN 
  COGNITO_CLIENT_ID: 2s00fkusj37pbs3ejsg3ut855 
```

**Restart blog-app:**
```powershell
docker-compose restart blog-app
```
